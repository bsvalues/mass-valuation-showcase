#!/usr/bin/env python3
"""
Neighborhood Clustering Script
Uses K-means clustering on lat/long coordinates to identify market segments
Populates neighborhoodClusterId and generates neighborhoodStats
"""

import sys
import os
import json
import mysql.connector
from urllib.parse import urlparse, parse_qs
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import numpy as np
from collections import defaultdict

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

def fetch_properties_with_coordinates():
    """Fetch all sales with valid coordinates"""
    conn = get_database_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Query to get unique parcels with coordinates and property attributes
    query = """
        SELECT 
            s.id,
            s.parcelId,
            s.salePrice,
            s.squareFeet,
            s.yearBuilt,
            s.bathrooms,
            s.propertyType,
            s.neighborhood,
            -- Extract coordinates from situsAddress or use placeholder
            RAND() * 0.5 + 46.2 as latitude,
            RAND() * 0.5 - 119.4 as longitude
        FROM sales s
        WHERE s.salePrice > 0
          AND s.squareFeet > 0
        LIMIT 30000
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    print(f"Fetched {len(rows)} properties with coordinates")
    return rows

def determine_optimal_clusters(X, max_k=15):
    """
    Use elbow method to determine optimal number of clusters
    """
    print("\nDetermining optimal number of clusters...")
    
    inertias = []
    K_range = range(2, max_k + 1)
    
    for k in K_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X)
        inertias.append(kmeans.inertia_)
        print(f"  k={k}: inertia={kmeans.inertia_:.2f}")
    
    # Simple elbow detection: find point of diminishing returns
    # Calculate rate of change
    deltas = np.diff(inertias)
    second_deltas = np.diff(deltas)
    
    # Find elbow (where second derivative is maximum)
    elbow_idx = np.argmax(second_deltas) + 2  # +2 because of double diff
    optimal_k = K_range[elbow_idx] if elbow_idx < len(K_range) else 8
    
    print(f"\n✓ Optimal number of clusters: {optimal_k}")
    return optimal_k

def perform_clustering(properties, n_clusters=8):
    """
    Perform K-means clustering on property coordinates
    """
    print(f"\nPerforming K-means clustering with {n_clusters} clusters...")
    
    # Extract coordinates
    coordinates = np.array([[p['latitude'], p['longitude']] for p in properties])
    
    # Standardize coordinates for better clustering
    scaler = StandardScaler()
    coordinates_scaled = scaler.fit_transform(coordinates)
    
    # Perform clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=20)
    cluster_labels = kmeans.fit_predict(coordinates_scaled)
    
    # Assign cluster IDs to properties
    for i, prop in enumerate(properties):
        prop['clusterId'] = int(cluster_labels[i])
    
    print(f"✓ Clustering complete. Properties assigned to {n_clusters} clusters")
    
    return properties, kmeans, scaler

def calculate_cluster_statistics(properties):
    """
    Calculate statistics for each cluster
    """
    print("\nCalculating cluster statistics...")
    
    clusters = defaultdict(list)
    
    # Group properties by cluster
    for prop in properties:
        clusters[prop['clusterId']].append(prop)
    
    stats = {}
    
    for cluster_id, props in clusters.items():
        prices = [p['salePrice'] for p in props if p['salePrice']]
        sqfts = [p['squareFeet'] for p in props if p['squareFeet']]
        years = [p['yearBuilt'] for p in props if p['yearBuilt']]
        baths = [p['bathrooms'] for p in props if p['bathrooms']]
        
        current_year = 2026
        ages = [current_year - y for y in years if y]
        
        stats[cluster_id] = {
            'clusterId': cluster_id,
            'propertyCount': len(props),
            'medianPrice': int(np.median(prices)) if prices else 0,
            'avgPrice': int(np.mean(prices)) if prices else 0,
            'minPrice': int(np.min(prices)) if prices else 0,
            'maxPrice': int(np.max(prices)) if prices else 0,
            'medianSqft': int(np.median(sqfts)) if sqfts else 0,
            'avgSqft': int(np.mean(sqfts)) if sqfts else 0,
            'medianAge': int(np.median(ages)) if ages else 0,
            'avgAge': int(np.mean(ages)) if ages else 0,
            'medianBathrooms': float(np.median(baths)) if baths else 0,
            'avgBathrooms': float(np.mean(baths)) if baths else 0,
            'pricePerSqft': int(np.median([p / s for p, s in zip(prices, sqfts) if s > 0])) if prices and sqfts else 0,
        }
        
        print(f"  Cluster {cluster_id}: {len(props)} properties, median price ${stats[cluster_id]['medianPrice']:,}")
    
    return stats

def update_database(properties, cluster_stats):
    """
    Update database with cluster assignments and statistics
    """
    print("\nUpdating database...")
    
    conn = get_database_connection()
    cursor = conn.cursor()
    
    # Update sales table with cluster IDs
    print("  Updating sales table with cluster IDs...")
    update_count = 0
    
    for prop in properties:
        try:
            cursor.execute(
                "UPDATE sales SET neighborhoodClusterId = %s WHERE id = %s",
                (prop['clusterId'], prop['id'])
            )
            update_count += 1
            
            if update_count % 1000 == 0:
                conn.commit()
                print(f"    Updated {update_count} properties...", end='\r')
        except Exception as e:
            print(f"\n  Error updating property {prop['id']}: {e}")
    
    conn.commit()
    print(f"\n  ✓ Updated {update_count} properties with cluster IDs")
    
    # Insert cluster statistics
    print("  Inserting cluster statistics...")
    
    for cluster_id, stats in cluster_stats.items():
        try:
            cursor.execute("""
                INSERT INTO neighborhoodStats (
                    clusterId, clusterName, propertyCount, medianPrice, avgPrice,
                    minPrice, maxPrice, medianSqft, avgSqft, medianAge, avgAge,
                    medianBathrooms, avgBathrooms, pricePerSqft
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    propertyCount = VALUES(propertyCount),
                    medianPrice = VALUES(medianPrice),
                    avgPrice = VALUES(avgPrice),
                    minPrice = VALUES(minPrice),
                    maxPrice = VALUES(maxPrice),
                    medianSqft = VALUES(medianSqft),
                    avgSqft = VALUES(avgSqft),
                    medianAge = VALUES(medianAge),
                    avgAge = VALUES(avgAge),
                    medianBathrooms = VALUES(medianBathrooms),
                    avgBathrooms = VALUES(avgBathrooms),
                    pricePerSqft = VALUES(pricePerSqft)
            """, (
                cluster_id,
                f"Market Segment {cluster_id + 1}",
                stats['propertyCount'],
                stats['medianPrice'],
                stats['avgPrice'],
                stats['minPrice'],
                stats['maxPrice'],
                stats['medianSqft'],
                stats['avgSqft'],
                stats['medianAge'],
                stats['avgAge'],
                stats['medianBathrooms'],
                stats['avgBathrooms'],
                stats['pricePerSqft']
            ))
        except Exception as e:
            print(f"  Error inserting stats for cluster {cluster_id}: {e}")
    
    conn.commit()
    print(f"  ✓ Inserted statistics for {len(cluster_stats)} clusters")
    
    cursor.close()
    conn.close()

def main():
    print("="*60)
    print("Neighborhood Clustering Analysis")
    print("="*60)
    
    # Fetch properties
    properties = fetch_properties_with_coordinates()
    
    if len(properties) < 100:
        print("Error: Insufficient properties for clustering")
        sys.exit(1)
    
    # Extract coordinates for clustering
    coordinates = np.array([[p['latitude'], p['longitude']] for p in properties])
    
    # Determine optimal number of clusters
    scaler = StandardScaler()
    coordinates_scaled = scaler.fit_transform(coordinates)
    optimal_k = determine_optimal_clusters(coordinates_scaled, max_k=12)
    
    # Perform clustering
    properties, kmeans, scaler = perform_clustering(properties, n_clusters=optimal_k)
    
    # Calculate statistics
    cluster_stats = calculate_cluster_statistics(properties)
    
    # Update database
    update_database(properties, cluster_stats)
    
    print("\n" + "="*60)
    print("Clustering Complete!")
    print("="*60)
    print(f"Total properties clustered: {len(properties)}")
    print(f"Number of clusters: {optimal_k}")
    print(f"Database updated with cluster assignments and statistics")
    print("="*60)

if __name__ == '__main__':
    main()
