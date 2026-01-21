import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

export async function parseExcel(fileUrl: string): Promise<any[]> {
  let arrayBuffer: ArrayBuffer;
  
  if (fileUrl.startsWith('file://')) {
    // Local file for testing
    const buffer = readFileSync(fileUrl.replace('file://', ''));
    arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } else {
    // Remote file (S3)
    const response = await fetch(fileUrl);
    arrayBuffer = await response.arrayBuffer();
  }
  
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  // Use first sheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel file contains no sheets');
  }
  
  const worksheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  
  return data;
}
