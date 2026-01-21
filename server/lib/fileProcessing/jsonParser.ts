import { readFileSync } from 'fs';

export async function parseJSON(fileUrl: string): Promise<any[]> {
  let data: any;
  
  if (fileUrl.startsWith('file://')) {
    // Local file for testing
    const jsonText = readFileSync(fileUrl.replace('file://', ''), 'utf-8');
    data = JSON.parse(jsonText);
  } else {
    // Remote file (S3)
    const response = await fetch(fileUrl);
    data = await response.json();
  }
  
  // Expect array of records
  if (!Array.isArray(data)) {
    throw new Error('JSON file must contain an array of records');
  }
  
  return data;
}
