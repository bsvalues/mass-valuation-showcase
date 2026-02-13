#!/usr/bin/env python3
"""
Enhanced ML Model Training Script with Value Driver Features
Trains Random Forest and Gradient Boosting models with comprehensive feature engineering
Target: R² > 0.6
"""

import sys
import json
import os
from datetime import datetime
import mysql.connector
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
import numpy as np

def get_database_connection():
    """Connect to MySQL database using environment variables"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError('DATABASE_URL environment variable not set')
    
    from urllib.parse import urlparse, parse_qs
    
    parsed = urlparse(db_url)
    
    user = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port or 3306
    database = parsed.path.lstrip('/')
    
    query_params = parse_qs(parsed.query)
    ssl_config = None
    if 'ssl' in query_params:
        ssl_config = {
            'ssl_verify_cert': True,
            'ssl_verify_identity': True
        }
    
    conn_params = {
        'host': host,
        'user': user,
        'password': password,
        'database': database,
        'port': int(port)
    }
    
    if ssl_config:
        conn_params['ssl_disabled'] = False
    
    return mysql.connector.connect(**conn_params)

def fetch_training_data():
    """Fetch enhanced sales data from database for training"""
    conn = get_database_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT 
            s.salePrice,
            s.assessedValue,
            s.squareFeet,
            s.yearBuilt,
            s.bedrooms,
            s.bathrooms,
            s.propertyType,
            s.neighborhood,
            YEAR(s.saleDate) as saleYear,
            s.countyName
        FROM sales s
        WHERE s.salePrice > 0 
          AND s.squareFeet > 0 
          AND s.squareFeet IS NOT NULL
          AND s.yearBuilt IS NOT NULL
          AND s.yearBuilt > 1800
          AND s.isQualified = 1
        LIMIT 50000
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    print(f"Fetched {len(rows)} sales records for training")
    return rows

def engineer_features(data):
    """
    Engineer comprehensive features from raw data
    Returns: X (features), y (target), feature_names
    """
    X = []
    y = []
    
    property_type_encoding = {
        '11': 1,  # Single Unit
        '12': 2,  # Duplex
        '13': 3,  # Triplex
        '14': 4,  # Fourplex
        '18': 5,  # Other Residential
        '65': 6,  # Service/Professional
        '83': 7,  # Current Use - Ag
        '39': 8,  # Manufacturing
        '54': 9,  # Retail Food
        'R': 1,   # Residential
        'C': 6,   # Commercial
    }
    
    current_year = datetime.now().year
    
    for row in data:
        # Target variable
        sale_price = row['salePrice']
        if sale_price <= 0 or sale_price > 10000000:  # Filter outliers
            continue
            
        # Basic features with imputation
        square_feet = row['squareFeet'] or 1500
        year_built = row['yearBuilt'] if row['yearBuilt'] and row['yearBuilt'] > 1800 else 1980
        bedrooms = row['bedrooms'] or 3
        bathrooms = row['bathrooms'] or 2
        property_type = row['propertyType'] or '11'
        sale_year = row['saleYear'] or current_year
        
        # Derived features
        age = current_year - year_built
        effective_age = max(0, age)  # No negative ages
        
        # Price per square foot (from assessed value as proxy)
        assessed_value = row['assessedValue'] or sale_price
        price_per_sqft = assessed_value / square_feet if square_feet > 0 else 0
        
        # Age-related features
        age_squared = age ** 2  # Capture non-linear depreciation
        is_new = 1 if age < 5 else 0
        is_old = 1 if age > 50 else 0
        
        # Size-related features
        sqft_log = np.log1p(square_feet)  # Log transform for better distribution
        sqft_squared = square_feet ** 2
        
        # Bathrooms per bedroom ratio
        bath_bed_ratio = bathrooms / bedrooms if bedrooms > 0 else 1
        
        # Encode property type
        prop_type_encoded = property_type_encoding.get(property_type, 0)
        
        # Interaction terms
        sqft_x_age = square_feet * age
        sqft_x_bathrooms = square_feet * bathrooms
        
        # Temporal features
        years_since_sale = current_year - sale_year
        
        # Feature vector (20 features)
        feature_vector = [
            square_feet,
            sqft_log,
            year_built,
            age,
            effective_age,
            age_squared,
            bedrooms,
            bathrooms,
            bath_bed_ratio,
            prop_type_encoded,
            sale_year,
            years_since_sale,
            price_per_sqft,
            is_new,
            is_old,
            sqft_squared,
            sqft_x_age,
            sqft_x_bathrooms,
            assessed_value,
            1  # Bias term
        ]
        
        X.append(feature_vector)
        y.append(sale_price)
    
    feature_names = [
        'square_feet',
        'sqft_log',
        'year_built',
        'age',
        'effective_age',
        'age_squared',
        'bedrooms',
        'bathrooms',
        'bath_bed_ratio',
        'property_type',
        'sale_year',
        'years_since_sale',
        'price_per_sqft',
        'is_new',
        'is_old',
        'sqft_squared',
        'sqft_x_age',
        'sqft_x_bathrooms',
        'assessed_value',
        'bias'
    ]
    
    return np.array(X), np.array(y), feature_names

def train_random_forest_with_tuning(X_train, y_train, X_test, y_test):
    """
    Train Random Forest with hyperparameter tuning
    """
    print("\n" + "="*50)
    print("Training Random Forest with Grid Search...")
    print("="*50)
    
    # Define parameter grid
    param_grid = {
        'n_estimators': [100, 200, 300],
        'max_depth': [15, 20, 25, None],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4],
        'max_features': ['sqrt', 'log2']
    }
    
    # Create base model
    rf = RandomForestRegressor(random_state=42, n_jobs=-1)
    
    # Grid search with cross-validation
    grid_search = GridSearchCV(
        rf, 
        param_grid, 
        cv=3,  # 3-fold CV for speed
        scoring='r2',
        n_jobs=-1,
        verbose=1
    )
    
    print("Running grid search (this may take a few minutes)...")
    grid_search.fit(X_train, y_train)
    
    print(f"\nBest parameters: {grid_search.best_params_}")
    print(f"Best CV R² score: {grid_search.best_score_:.4f}")
    
    # Get best model
    best_rf = grid_search.best_estimator_
    
    # Evaluate on test set
    y_pred = best_rf.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
    
    print(f"\nRandom Forest Test Set Performance:")
    print(f"  MAE:  ${mae:,.0f}")
    print(f"  RMSE: ${rmse:,.0f}")
    print(f"  R²:   {r2:.4f}")
    print(f"  MAPE: {mape:.2f}%")
    
    return best_rf, {
        'mae': float(mae),
        'rmse': float(rmse),
        'r2': float(r2),
        'mape': float(mape),
        'best_params': grid_search.best_params_,
        'cv_score': float(grid_search.best_score_)
    }

def train_gradient_boosting(X_train, y_train, X_test, y_test):
    """
    Train Gradient Boosting model
    """
    print("\n" + "="*50)
    print("Training Gradient Boosting Regressor...")
    print("="*50)
    
    gb = GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=5,
        min_samples_split=5,
        min_samples_leaf=2,
        subsample=0.8,
        random_state=42,
        verbose=1
    )
    
    gb.fit(X_train, y_train)
    
    # Evaluate
    y_pred = gb.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
    
    print(f"\nGradient Boosting Test Set Performance:")
    print(f"  MAE:  ${mae:,.0f}")
    print(f"  RMSE: ${rmse:,.0f}")
    print(f"  R²:   {r2:.4f}")
    print(f"  MAPE: {mape:.2f}%")
    
    return gb, {
        'mae': float(mae),
        'rmse': float(rmse),
        'r2': float(r2),
        'mape': float(mape)
    }

def main():
    print("Enhanced ML Model Training")
    print("="*50)
    
    # Fetch data
    data = fetch_training_data()
    
    if len(data) < 100:
        print("Error: Insufficient training data")
        sys.exit(1)
    
    # Engineer features
    print("\nEngineering features...")
    X, y, feature_names = engineer_features(data)
    
    print(f"Total samples after feature engineering: {len(X)}")
    print(f"Number of features: {X.shape[1]}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    
    # Train Random Forest with tuning
    rf_model, rf_metrics = train_random_forest_with_tuning(X_train, y_train, X_test, y_test)
    
    # Train Gradient Boosting
    gb_model, gb_metrics = train_gradient_boosting(X_train, y_train, X_test, y_test)
    
    # Compare models
    print("\n" + "="*50)
    print("Model Comparison:")
    print("="*50)
    print(f"Random Forest R²:      {rf_metrics['r2']:.4f}")
    print(f"Gradient Boosting R²:  {gb_metrics['r2']:.4f}")
    
    # Select best model
    if rf_metrics['r2'] > gb_metrics['r2']:
        best_model = rf_model
        best_metrics = rf_metrics
        model_type = 'RandomForest'
        print(f"\n✓ Random Forest selected as best model (R² = {rf_metrics['r2']:.4f})")
    else:
        best_model = gb_model
        best_metrics = gb_metrics
        model_type = 'GradientBoosting'
        print(f"\n✓ Gradient Boosting selected as best model (R² = {gb_metrics['r2']:.4f})")
    
    # Save best model
    model_dir = '/home/ubuntu/mass-valuation-showcase/ml/models'
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'enhanced_model.pkl')
    joblib.dump(best_model, model_path, protocol=4)
    print(f"\nModel saved to {model_path}")
    
    # Save metrics
    best_metrics.update({
        'model_type': model_type,
        'feature_count': X.shape[1],
        'feature_names': feature_names,
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'trained_at': datetime.now().isoformat()
    })
    
    metrics_path = os.path.join(model_dir, 'enhanced_model_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(best_metrics, f, indent=2)
    print(f"Metrics saved to {metrics_path}")
    
    # Feature importance
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        indices = np.argsort(importances)[::-1]
        
        print("\nTop 10 Feature Importances:")
        for i in range(min(10, len(feature_names))):
            idx = indices[i]
            print(f"  {i+1}. {feature_names[idx]}: {importances[idx]:.4f}")
    
    print("\n" + "="*50)
    print("Training Complete!")
    print("="*50)

if __name__ == '__main__':
    main()
