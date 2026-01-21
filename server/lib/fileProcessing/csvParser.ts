import Papa from 'papaparse';
import { readFileSync } from 'fs';

export async function parseCSV(fileUrl: string): Promise<any[]> {
  let csvText: string;
  
  if (fileUrl.startsWith('file://')) {
    // Local file for testing
    csvText = readFileSync(fileUrl.replace('file://', ''), 'utf-8');
  } else {
    // Remote file (S3)
    const response = await fetch(fileUrl);
    csvText = await response.text();
  }
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('[CSV Parser] Parsing warnings:', results.errors);
        }
        resolve(results.data as any[]);
      },
      error: (error: Error) => reject(new Error(`CSV parsing failed: ${error.message}`)),
    });
  });
}
