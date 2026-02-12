#!/usr/bin/env python3.11
"""
ML Model Prediction Script
Makes predictions using trained Random Forest model
"""

import sys
import json
import joblib
import numpy as np
from datetime import datetime

def load_model(model_path):
    """Load trained model from file"""
    return joblib.load(model_path)

def prepare_features(property_data):
    """
    Prepare feature vector from property data
    Expected fields: squareFeet, yearBuilt, bedrooms, propertyType, saleYear
    Model uses 6 features: squareFeet, yearBuilt, bedrooms, propertyType (encoded), saleYear, age
    """
    property_type_encoding = {
        '11': 1, '12': 2, '13': 3, '14': 4, '18': 5,
        '83': 6, '39': 7, '54': 8
    }
    
    current_year = datetime.now().year
    
    square_feet = property_data.get('squareFeet', 0)
    year_built = property_data.get('yearBuilt', 1950)
    bedrooms = property_data.get('bedrooms', 0)
    property_type = property_data.get('propertyType', '11')
    sale_year = property_data.get('saleYear', current_year)
    age = property_data.get('age', current_year - year_built)
    
    prop_type_encoded = property_type_encoding.get(property_type, 0)
    
    # Feature vector (6 features) - matches training script
    return [
        square_feet,
        year_built,
        bedrooms,
        prop_type_encoded,
        sale_year,
        age,
    ]

def predict_single(model, property_data):
    """Make prediction for a single property"""
    features = prepare_features(property_data)
    X = np.array([features])
    prediction = model.predict(X)[0]
    return float(prediction)

def predict_batch(model, properties):
    """Make predictions for multiple properties"""
    X = np.array([prepare_features(prop) for prop in properties])
    predictions = model.predict(X)
    return [float(p) for p in predictions]

def main():
    """Main prediction pipeline"""
    if len(sys.argv) < 3:
        print("Usage: python predict.py <model_path> <input_json>")
        sys.exit(1)
    
    model_path = sys.argv[1]
    input_json = sys.argv[2]
    
    # Load model
    model = load_model(model_path)
    
    # Parse input
    input_data = json.loads(input_json)
    
    # Check if batch or single
    if isinstance(input_data, list):
        predictions = predict_batch(model, input_data)
    else:
        predictions = [predict_single(model, input_data)]
    
    # Output JSON
    output = {
        'predictions': predictions,
        'count': len(predictions)
    }
    
    print(json.dumps(output))
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
