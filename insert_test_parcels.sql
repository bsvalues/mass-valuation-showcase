-- Insert 5 test parcels with realistic geometries for Benton County
INSERT INTO waCountyParcels (parcelId, countyName, situsAddress, valueLand, valueBuilding, geometry, createdAt, updatedAt)
VALUES 
  ('12345-001', 'Benton County', '123 Main St, Richland, WA', 150000, 350000, '{"type":"Polygon","coordinates":[[[-119.28,46.28],[-119.279,46.28],[-119.279,46.281],[-119.28,46.281],[-119.28,46.28]]]}', NOW(), NOW()),
  ('12345-002', 'Benton County', '456 Oak Ave, Kennewick, WA', 200000, 450000, '{"type":"Polygon","coordinates":[[[-119.29,46.29],[-119.289,46.29],[-119.289,46.291],[-119.29,46.291],[-119.29,46.29]]]}', NOW(), NOW()),
  ('12345-003', 'Benton County', '789 Pine Rd, Pasco, WA', 100000, 250000, '{"type":"Polygon","coordinates":[[[-119.30,46.30],[-119.299,46.30],[-119.299,46.301],[-119.30,46.301],[-119.30,46.30]]]}', NOW(), NOW()),
  ('12345-004', 'Benton County', '321 Elm St, West Richland, WA', 180000, 400000, '{"type":"Polygon","coordinates":[[[-119.31,46.31],[-119.309,46.31],[-119.309,46.311],[-119.31,46.311],[-119.31,46.31]]]}', NOW(), NOW()),
  ('12345-005', 'Benton County', '654 Maple Dr, Benton City, WA', 120000, 300000, '{"type":"Polygon","coordinates":[[[-119.32,46.32],[-119.319,46.32],[-119.319,46.321],[-119.32,46.321],[-119.32,46.32]]]}', NOW(), NOW());
