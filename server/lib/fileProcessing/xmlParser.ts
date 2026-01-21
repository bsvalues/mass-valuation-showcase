import { parseStringPromise } from 'xml2js';

export async function parseXML(fileUrl: string): Promise<any[]> {
  const response = await fetch(fileUrl);
  const xmlText = await response.text();
  
  const result = await parseStringPromise(xmlText, {
    explicitArray: false,
    mergeAttrs: true,
  });
  
  // Navigate to records array - adjust path based on XML structure
  // Common patterns: result.root?.record or result.records?.record
  const records = result.root?.record || result.records?.record || [];
  
  // Ensure it's an array
  return Array.isArray(records) ? records : [records];
}
