#!/usr/bin/env python3.11
"""
ML Model Training Script for Property Valuation
Trains Random Forest Regressor on Benton County sales data
"""

import sys
import json
import os
from datetime import datetime
import mysql.connector
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import numpy as np

def get_database_connection():
    """Connect to MySQL database using environment variables"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError('DATABASE_URL environment variable not set')
    
    # Parse DATABASE_URL (format: mysql://user:pass@host:port/database?ssl=...)
    import re
    from urllib.parse import urlparse, parse_qs
    
    parsed = urlparse(db_url)
    
    # Extract connection parameters
    user = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port or 3306
    database = parsed.path.lstrip('/')
    
    # Parse SSL parameters from query string
    query_params = parse_qs(parsed.query)
    ssl_config = None
    if 'ssl' in query_params:
        # SSL is enabled
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
    """Fetch sales data from database for training"""
    conn = get_database_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT 
            s.salePrice,
            s.assessedValue,
            s.squareFeet,
            s.yearBuilt,
            s.bedrooms,
            s.propertyType,
            YEAR(s.saleDate) as saleYear
        FROM sales s
        WHERE s.salePrice > 0 
          AND s.squareFeet > 0 
          AND s.squareFeet IS NOT NULL
        LIMIT 50000
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return rows

def engineer_features(data):
    """
    Engineer features from raw data
    Returns: X (features), y (target)
    """
    X = []
    y = []
    
    property_type_encoding = {
        '11': 1,  # Single Unit
        '12': 2,  # Duplex
        '13': 3,  # Triplex
        '14': 4,  # Fourplex
        '18': 5,  # Other Residential
        '83': 6,  # Current Use - Ag
        '39': 7,  # Manufacturing
        '54': 8,  # Retail Food
    }
    
    current_year = datetime.now().year
    
    for row in data:
        # Target variable
        sale_price = row['salePrice']
        if sale_price <= 0:
            continue
            
        # Features with imputation for missing values
        square_feet = row['squareFeet'] or 0
        year_built = row['yearBuilt'] if row['yearBuilt'] and row['yearBuilt'] > 1800 else 1980  # Impute with median year
        bedrooms = row['bedrooms'] or 3  # Impute with median bedrooms
        property_type = row['propertyType'] or '11'
        sale_year = row['saleYear'] or current_year
        age = current_year - year_built
        
        # Encode property type
        prop_type_encoded = property_type_encoding.get(property_type, 0)
        
        # Derived features
        price_per_sqft = sale_price / square_feet if square_feet > 0 else 0
        
        feature_vector = [
            square_feet,
            year_built,
            bedrooms,
            prop_type_encoded,
            sale_year,
            age,
            price_per_sqft,
        ]
        
        X.append(feature_vector)
        y.append(sale_price)
    
    return np.array(X), np.array(y)

def train_model(X, y, model_path):
    """
    Train Random Forest model and save to file
    Returns: model, metrics
    """
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples")
    
    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    print("Training Random Forest model...")
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
    cv_mean = cv_scores.mean()
    cv_std = cv_scores.std()
    
    metrics = {
        'mae': float(mae),
        'rmse': float(rmse),
        'r2': float(r2),
        'cv_mean': float(cv_mean),
        'cv_std': float(cv_std),
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'feature_count': X.shape[1],
        'trained_at': datetime.now().isoformat()
    }
    
    # Save model
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    # Save metrics
    metrics_path = model_path.replace('.pkl', '_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to {metrics_path}")
    
    return model, metrics

def main():
    """Main training pipeline"""
    if len(sys.argv) < 2:
        print("Usage: python train_model.py <output_model_path>")
        sys.exit(1)
    
    model_path = sys.argv[1]
    
    print("=== ML Model Training Pipeline ===")
    print(f"Output model path: {model_path}")
    
    # Fetch data
    print("\n1. Fetching training data from database...")
    data = fetch_training_data()
    print(f"   Fetched {len(data)} sales records")
    
    # Engineer features
    print("\n2. Engineering features...")
    X, y = engineer_features(data)
    print(f"   Features shape: {X.shape}")
    print(f"   Target shape: {y.shape}")
    
    # Train model
    print("\n3. Training model...")
    model, metrics = train_model(X, y, model_path)
    
    # Print results
    print("\n=== Training Complete ===")
    print(f"MAE: ${metrics['mae']:,.2f}")
    print(f"RMSE: ${metrics['rmse']:,.2f}")
    print(f"R²: {metrics['r2']:.4f}")
    print(f"Cross-validation R² (mean ± std): {metrics['cv_mean']:.4f} ± {metrics['cv_std']:.4f}")
    print(f"\nModel saved successfully!")
    
    # Output JSON for programmatic parsing
    print("\n__JSON_OUTPUT__")
    print(json.dumps(metrics))
    
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
