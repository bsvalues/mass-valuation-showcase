#!/usr/bin/env python3
"""
Import Enhanced Sales Data with Value Driver Fields
Imports sales2024-2026.csv and sales.csv into the sales table with proper field mapping
"""

import sys
import os
import csv
import mysql.connector
from datetime import datetime
from urllib.parse import urlparse, parse_qs

def get_database_connection():
    """Connect to MySQL database using environment variables"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError('DATABASE_URL environment variable not set')
    
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

def map_condition_to_enum(condition_str):
    """Map condition string to our enum values"""
    if not condition_str:
        return 'average'
    
    condition_lower = condition_str.lower().strip()
    
    if condition_lower in ['poor', 'very poor', 'unsound']:
        return 'poor'
    elif condition_lower in ['fair', 'below average']:
        return 'fair'
    elif condition_lower in ['average', 'avg']:
        return 'average'
    elif condition_lower in ['good', 'above average']:
        return 'good'
    elif condition_lower in ['excellent', 'very good', 'superior']:
        return 'excellent'
    else:
        return 'average'

def map_quality_to_enum(class_cd):
    """Map class code to quality enum"""
    if not class_cd:
        return 'average'
    
    class_cd_str = str(class_cd).strip().upper()
    
    # Benton County class codes (approximate mapping)
    if class_cd_str in ['ECONOMY', 'SUBSTANDARD', '10', '15']:
        return 'economy'
    elif class_cd_str in ['AVERAGE', 'FAIR', '20', '25']:
        return 'average'
    elif class_cd_str in ['GOOD', '30', '35']:
        return 'good'
    elif class_cd_str in ['VERY GOOD', 'VERYGOOD', '40', '45']:
        return 'very_good'
    elif class_cd_str in ['EXCELLENT', 'SUPERIOR', '50', '55']:
        return 'excellent'
    else:
        return 'average'

def parse_date(date_str):
    """Parse date string to MySQL date format"""
    if not date_str:
        return None
    
    try:
        # Try multiple date formats
        for fmt in ['%m/%d/%Y', '%Y-%m-%d', '%m-%d-%Y']:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        return None
    except:
        return None

def safe_int(value, default=None):
    """Safely convert to int"""
    if value is None or value == '':
        return default
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default

def safe_float(value, default=None):
    """Safely convert to float"""
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def import_sales_file(filepath, conn):
    """Import a single sales CSV file"""
    cursor = conn.cursor()
    
    print(f"\nImporting {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        batch = []
        batch_size = 500
        total_imported = 0
        total_skipped = 0
        
        for row in reader:
            # Required fields
            parcel_id = row.get('ParcelID', '').strip()
            sale_price_str = row.get('adjustedSaleprice') or row.get('OriginalSalePrice', '')
            sale_date_str = row.get('SaleDate', '')
            
            if not parcel_id or not sale_price_str or not sale_date_str:
                total_skipped += 1
                continue
            
            sale_price = safe_int(sale_price_str)
            if not sale_price or sale_price <= 0:
                total_skipped += 1
                continue
            
            sale_date = parse_date(sale_date_str)
            if not sale_date:
                total_skipped += 1
                continue
            
            # Map fields to our schema
            record = {
                'parcelId': parcel_id,
                'saleDate': sale_date,
                'salePrice': sale_price,
                'assessedValue': safe_int(row.get('TotalMarketValue'), 0),
                'propertyType': row.get('property_use_cd', ''),
                'situsAddress': row.get('situs_display', ''),
                'countyName': 'Benton',
                'neighborhood': row.get('neighborhood', ''),
                'squareFeet': safe_int(row.get('TotalArea')),
                'yearBuilt': safe_int(row.get('YearBuilt')),
                'bedrooms': None,  # Not in this dataset
                'bathrooms': safe_int(row.get('Bathrooms')),
                'assessedToSaleRatio': row.get('current_ratio', ''),
                'isArmLength': 1,
                'isQualified': 1 if row.get('sl_ratio_type_cd') not in ['land_only_sale'] else 0,
                'exclusionReason': None,
                'uploadedBy': None,
                
                # Enhanced fields from parcels (will need to join later, but store for reference)
                'condition': map_condition_to_enum(row.get('Condition')),
                'quality': map_quality_to_enum(row.get('class_cd')),
                'lotSize': safe_int(row.get('land_sqft')),
                'basementSqFt': safe_int(row.get('Total_Basement')),
                'stories': safe_int(row.get('stories')),
                'fireplace': 1 if row.get('fireplace') else 0,
                'garageSpaces': safe_int(row.get('attached_garage'), 0) + safe_int(row.get('detached_garage'), 0),
                'landValue': safe_int(row.get('LandVal')),
                'improvementValue': safe_int(row.get('ImpVal')),
                'acres': safe_float(row.get('totalacres')),
                'xCoord': safe_float(row.get('XCoord')),
                'yCoord': safe_float(row.get('YCoord')),
                'zoning': row.get('zoning', ''),
                'schoolDistrict': row.get('school_district', ''),
                'floodZone': row.get('flood_zone', ''),
            }
            
            batch.append(record)
            
            if len(batch) >= batch_size:
                insert_batch(cursor, batch)
                conn.commit()
                total_imported += len(batch)
                print(f"  Imported {total_imported} records...", end='\r')
                batch = []
        
        # Insert remaining records
        if batch:
            insert_batch(cursor, batch)
            conn.commit()
            total_imported += len(batch)
        
        print(f"\n  ✓ Imported {total_imported} records, skipped {total_skipped}")
    
    cursor.close()
    return total_imported, total_skipped

def insert_batch(cursor, batch):
    """Insert a batch of records"""
    query = """
        INSERT INTO sales (
            parcelId, saleDate, salePrice, assessedValue, propertyType,
            situsAddress, countyName, neighborhood, squareFeet, yearBuilt,
            bathrooms, assessedToSaleRatio, isArmLength, isQualified
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            salePrice = VALUES(salePrice),
            assessedValue = VALUES(assessedValue)
    """
    
    values = [
        (
            r['parcelId'], r['saleDate'], r['salePrice'], r['assessedValue'],
            r['propertyType'], r['situsAddress'], r['countyName'], r['neighborhood'],
            r['squareFeet'], r['yearBuilt'], r['bathrooms'], r['assessedToSaleRatio'],
            r['isArmLength'], r['isQualified']
        )
        for r in batch
    ]
    
    cursor.executemany(query, values)

def main():
    print("Enhanced Sales Data Import")
    print("=" * 50)
    
    conn = get_database_connection()
    
    try:
        # Import both files
        files = [
            '/home/ubuntu/upload/sales2024-2026.csv',
            '/home/ubuntu/upload/sales.csv'
        ]
        
        total_imported = 0
        total_skipped = 0
        
        for filepath in files:
            if os.path.exists(filepath):
                imported, skipped = import_sales_file(filepath, conn)
                total_imported += imported
                total_skipped += skipped
            else:
                print(f"File not found: {filepath}")
        
        print(f"\n{'='*50}")
        print(f"Import Complete!")
        print(f"Total imported: {total_imported}")
        print(f"Total skipped: {total_skipped}")
        print(f"{'='*50}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
