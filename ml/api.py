#!/usr/bin/env python3
"""
Flask REST API for ML model predictions.
Bypasses Python subprocess SRE module mismatch issues.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import sys

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js backend

# Load model on startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
model = None
feature_names = ['squareFeet', 'yearBuilt', 'bedrooms', 'propertyType_encoded', 'saleYear', 'age']

try:
    model = joblib.load(MODEL_PATH)
    print(f"[Flask API] Model loaded successfully from {MODEL_PATH}", file=sys.stderr)
except Exception as e:
    print(f"[Flask API] ERROR loading model: {e}", file=sys.stderr)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict property value from features.
    
    Expected JSON input:
    {
        "squareFeet": 2000,
        "yearBuilt": 2010,
        "bedrooms": 3,
        "propertyType": "Single Family",
        "basementSqFt": 0,
        "acres": 0.25
    }
    
    Returns:
    {
        "predictedValue": 450000,
        "features": {...}
    }
    """
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.json
        
        # Extract features
        square_feet = data.get('squareFeet', 0)
        year_built = data.get('yearBuilt', 2000)
        bedrooms = data.get('bedrooms', 3)
        property_type = data.get('propertyType', 'Single Family')
        
        # Calculate derived features
        current_year = 2026
        sale_year = current_year  # Use current year for prediction
        age = current_year - year_built
        
        # Property type encoding (same as training)
        property_type_map = {
            'Single Family': 0,
            'Condo': 1,
            'Townhouse': 2,
            'Multi-Family': 3,
            'Commercial': 4,
            'Industrial': 5,
            'Land': 6,
            'Other': 7
        }
        property_type_encoded = property_type_map.get(property_type, 0)
        
        # Create feature vector (6 features matching training)
        features = np.array([[
            square_feet,
            year_built,
            bedrooms,
            property_type_encoded,
            sale_year,
            age
        ]])
        
        # Make prediction
        predicted_value = model.predict(features)[0]
        
        # Calculate confidence interval using Random Forest estimators
        # Get predictions from all trees in the forest
        tree_predictions = np.array([tree.predict(features)[0] for tree in model.estimators_])
        
        # Calculate standard deviation and confidence interval (±1.96 std for 95% CI)
        std_dev = np.std(tree_predictions)
        confidence_lower = predicted_value - (1.96 * std_dev)
        confidence_upper = predicted_value + (1.96 * std_dev)
        
        return jsonify({
            'predictedValue': int(predicted_value),
            'confidenceInterval': {
                'lower': int(confidence_lower),
                'upper': int(confidence_upper),
                'stdDev': float(std_dev)
            },
            'features': {
                'squareFeet': square_feet,
                'yearBuilt': year_built,
                'bedrooms': bedrooms,
                'propertyType': property_type,
                'propertyTypeEncoded': property_type_encoded,
                'saleYear': sale_year,
                'age': age
            }
        })
    
    except Exception as e:
        print(f"[Flask API] Prediction error: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run on port 5000
    app.run(host='127.0.0.1', port=5000, debug=False)
