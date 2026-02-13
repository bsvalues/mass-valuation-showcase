#!/usr/bin/env python3
"""
Populate neighborhoodStats table with aggregated cluster statistics
"""
import os
import sys
import mysql.connector
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create database connection from DATABASE_URL"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError("DATABASE_URL not found in environment")
    
    # Parse mysql://user:pass@host:port/database
    parts = db_url.replace('mysql://', '').split('@')
    user_pass = parts[0].split(':')
    host_db = parts[1].split('/')
    host_port = host_db[0].split(':')
    
    return mysql.connector.connect(
        host=host_port[0],
        port=int(host_port[1]) if len(host_port) > 1 else 3306,
        user=user_pass[0],
        password=user_pass[1],
        database=host_db[1].split('?')[0]
    )

def calculate_cluster_stats(cursor, cluster_id):
    """Calculate statistics for a specific cluster"""
    print(f"Calculating stats for Cluster {cluster_id}...")
    
    # Get all sales in this cluster
    query = """
        SELECT 
            COUNT(*) as total_properties,
            AVG(salePrice) as median_sale_price,
            AVG(assessedValue) as median_home_value,
            AVG(squareFeet) as avg_sqft,
            AVG(YEAR(CURDATE()) - yearBuilt) as avg_age,
            0.0 as center_lat,
            0.0 as center_lng,
            SUM(CASE WHEN saleDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN 1 ELSE 0 END) as sales_volume_12m
        FROM sales
        WHERE neighborhoodClusterId = %s

    """
    
    cursor.execute(query, (cluster_id,))
    result = cursor.fetchone()
    
    if not result or result[0] == 0:
        print(f"  No data found for Cluster {cluster_id}")
        return None
    
    stats = {
        'neighborhoodClusterId': cluster_id,
        'neighborhoodName': f'Market Segment {cluster_id}',
        'totalProperties': int(result[0]) if result[0] else 0,
        'medianSalePrice': int(result[1]) if result[1] else 0,
        'medianHomeValue': int(result[2]) if result[2] else 0,
        'centerLatitude': float(result[5]) if result[5] else 0.0,
        'centerLongitude': float(result[6]) if result[6] else 0.0,
        'salesVolume12Month': int(result[7]) if result[7] else 0,
    }
    
    print(f"  Properties: {stats['totalProperties']}")
    print(f"  Median Sale Price: ${stats['medianSalePrice']:,}")
    print(f"  Center: ({stats['centerLatitude']:.4f}, {stats['centerLongitude']:.4f})")
    
    return stats

def insert_or_update_stats(cursor, stats):
    """Insert or update neighborhoodStats record"""
    # Check if record exists
    cursor.execute(
        "SELECT id FROM neighborhoodStats WHERE neighborhoodClusterId = %s",
        (stats['neighborhoodClusterId'],)
    )
    existing = cursor.fetchone()
    
    if existing:
        # Update existing record
        update_query = """
            UPDATE neighborhoodStats SET
                neighborhoodName = %s,
                totalProperties = %s,
                medianSalePrice = %s,
                medianHomeValue = %s,
                centerLatitude = %s,
                centerLongitude = %s,
                salesVolume12Month = %s,
                updatedAt = NOW()
            WHERE neighborhoodClusterId = %s
        """
        cursor.execute(update_query, (
            stats['neighborhoodName'],
            stats['totalProperties'],
            stats['medianSalePrice'],
            stats['medianHomeValue'],
            stats['centerLatitude'],
            stats['centerLongitude'],
            stats['salesVolume12Month'],
            stats['neighborhoodClusterId']
        ))
        print(f"  ✓ Updated existing record (ID: {existing[0]})")
    else:
        # Insert new record
        insert_query = """
            INSERT INTO neighborhoodStats (
                neighborhoodClusterId, neighborhoodName, totalProperties,
                medianSalePrice, medianHomeValue, centerLatitude, centerLongitude,
                salesVolume12Month, createdAt, updatedAt
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """
        cursor.execute(insert_query, (
            stats['neighborhoodClusterId'],
            stats['neighborhoodName'],
            stats['totalProperties'],
            stats['medianSalePrice'],
            stats['medianHomeValue'],
            stats['centerLatitude'],
            stats['centerLongitude'],
            stats['salesVolume12Month']
        ))
        print(f"  ✓ Inserted new record (ID: {cursor.lastrowid})")

def main():
    """Main execution"""
    print("=" * 60)
    print("Populating neighborhoodStats table")
    print("=" * 60)
    
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get unique cluster IDs
        cursor.execute("""
            SELECT DISTINCT neighborhoodClusterId 
            FROM sales 
            WHERE neighborhoodClusterId IS NOT NULL 
            ORDER BY neighborhoodClusterId
        """)
        cluster_ids = [row[0] for row in cursor.fetchall()]
        
        print(f"\nFound {len(cluster_ids)} clusters: {cluster_ids}\n")
        
        # Process each cluster
        for cluster_id in cluster_ids:
            stats = calculate_cluster_stats(cursor, cluster_id)
            if stats:
                insert_or_update_stats(cursor, stats)
                print()
        
        # Commit changes
        conn.commit()
        
        print("=" * 60)
        print("✓ Successfully populated neighborhoodStats table")
        print("=" * 60)
        
        # Show summary
        cursor.execute("SELECT COUNT(*) FROM neighborhoodStats")
        total = cursor.fetchone()[0]
        print(f"\nTotal neighborhood stats records: {total}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n✗ Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
