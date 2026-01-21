// @ts-ignore - pdf-parse has complex module exports
import pdfParse from 'pdf-parse';

export async function parsePDF(fileUrl: string): Promise<any[]> {
  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // @ts-ignore
  const data = await pdfParse(buffer);
  
  // Extract text and attempt to parse as tabular data
  // This is a simplified approach - production would use a table extraction library
  const lines = data.text.split('\n').filter((line: string) => line.trim().length > 0);
  
  if (lines.length < 2) {
    throw new Error('PDF does not contain enough data to parse');
  }
  
  // Assume first line is headers, rest are data
  // Split by multiple spaces or tabs
  const headers = lines[0].split(/\s{2,}|\t/).map((h: string) => h.trim()).filter((h: string) => h.length > 0);
  const records: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/\s{2,}|\t/).map((v: string) => v.trim()).filter((v: string) => v.length > 0);
    if (values.length === headers.length) {
      const record: any = {};
      headers.forEach((header: string, index: number) => {
        record[header] = values[index];
      });
      records.push(record);
    }
  }
  
  if (records.length === 0) {
    throw new Error('PDF parsing failed: no valid records found');
  }
  
  return records;
}
