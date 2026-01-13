interface Point {
  id: string;
  value: number;
  lat: number;
  lng: number;
}

interface Cluster {
  centroid: Point;
  points: Point[];
}

export function performKMeansClustering(data: any[], k: number = 5): Cluster[] {
  // Mock coordinate generation since we don't have real geocoding yet
  // In a real app, we would use the address to get lat/lng
  const points: Point[] = data.map((item, index) => ({
    id: item.pin || `P-${index}`,
    value: parseFloat(item.total_value || '0'),
    // Generate mock coordinates around a central point (e.g., Miami)
    lat: 25.7617 + (Math.random() - 0.5) * 0.1,
    lng: -80.1918 + (Math.random() - 0.5) * 0.1
  }));

  if (points.length === 0) return [];

  // Initialize centroids randomly
  let centroids: Point[] = points.slice(0, k).map(p => ({ ...p }));
  let clusters: Cluster[] = [];
  let iterations = 0;
  const maxIterations = 10;

  while (iterations < maxIterations) {
    // Assign points to nearest centroid
    clusters = centroids.map(c => ({ centroid: c, points: [] }));
    
    points.forEach(point => {
      let minDist = Infinity;
      let closestIndex = 0;
      
      centroids.forEach((centroid, index) => {
        const dist = Math.sqrt(
          Math.pow(point.lat - centroid.lat, 2) + 
          Math.pow(point.lng - centroid.lng, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestIndex = index;
        }
      });
      
      clusters[closestIndex].points.push(point);
    });

    // Recalculate centroids
    const newCentroids = clusters.map(cluster => {
      if (cluster.points.length === 0) return cluster.centroid;
      
      const sumLat = cluster.points.reduce((sum, p) => sum + p.lat, 0);
      const sumLng = cluster.points.reduce((sum, p) => sum + p.lng, 0);
      const sumVal = cluster.points.reduce((sum, p) => sum + p.value, 0);
      
      return {
        lat: sumLat / cluster.points.length,
        lng: sumLng / cluster.points.length,
        value: sumVal / cluster.points.length,
        id: 'centroid'
      } as Point;
    });

    // Check for convergence (simplified)
    if (JSON.stringify(newCentroids) === JSON.stringify(centroids)) break;
    
    centroids = newCentroids;
    iterations++;
  }

  return clusters;
}
