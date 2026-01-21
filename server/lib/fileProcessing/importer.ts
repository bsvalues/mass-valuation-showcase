import { parseCSV } from './csvParser';
import { parseExcel } from './excelParser';
import { parseXML } from './xmlParser';
import { parseJSON } from './jsonParser';
import { parsePDF } from './pdfParser';
import { validateRecord } from './validator';
import { transformRecord, autoDetectMapping, type ColumnMapping } from './transformer';
import { getDb } from '../../db';
import { importJobs, importErrors, parcels } from '../../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export async function processImportJob(jobId: number, customMapping?: ColumnMapping) {
  console.log(`[Import] Starting job ${jobId}`);
  
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }
  
  // Fetch job details
  const jobResults = await db.select().from(importJobs).where(eq(importJobs.id, jobId)).limit(1);
  if (!jobResults.length) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  const job = jobResults[0];
  const { fileUrl, fileFormat } = job;
  
  // Update status to processing
  await db.update(importJobs)
    .set({ status: 'processing' })
    .where(eq(importJobs.id, jobId));
  
  try {
    // Parse file based on format
    let rawRecords: any[] = [];
    
    console.log(`[Import] Parsing ${fileFormat} file: ${fileUrl}`);
    
    switch (fileFormat.toLowerCase()) {
      case 'csv':
        rawRecords = await parseCSV(fileUrl);
        break;
      case 'xlsx':
      case 'xls':
        rawRecords = await parseExcel(fileUrl);
        break;
      case 'xml':
        rawRecords = await parseXML(fileUrl);
        break;
      case 'pdf':
        rawRecords = await parsePDF(fileUrl);
        break;
      case 'json':
        rawRecords = await parseJSON(fileUrl);
        break;
      default:
        throw new Error(`Unsupported file format: ${fileFormat}`);
    }
    
    console.log(`[Import] Parsed ${rawRecords.length} records`);
    
    if (rawRecords.length === 0) {
      throw new Error('File contains no data');
    }
    
    // Auto-detect column mapping if not provided
    const headers = Object.keys(rawRecords[0] || {});
    const mapping = customMapping || autoDetectMapping(headers);
    
    console.log(`[Import] Using column mapping:`, mapping);
    
    // Validate that all required fields are mapped
    const requiredFields = ['parcelId', 'address'];
    const missingFields = requiredFields.filter(field => !mapping[field as keyof ColumnMapping]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required field mappings: ${missingFields.join(', ')}`);
    }
    
    // Process records in batches
    const batchSize = 1000;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < rawRecords.length; i += batchSize) {
      const batch = rawRecords.slice(i, i + batchSize);
      const validRecords: any[] = [];
      
      console.log(`[Import] Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)`);
      
      for (let j = 0; j < batch.length; j++) {
        const rowNumber = i + j + 1;
        const rawRecord = batch[j];
        
        try {
          // Transform and validate
          const transformed = transformRecord(rawRecord, mapping);
          const validation = validateRecord(transformed);
          
          if (validation.success && validation.data) {
            // Map to parcels table schema
            const parcelData: any = {
              parcelId: validation.data.parcelId,
              address: validation.data.address,
              squareFeet: validation.data.sqft || null,
              yearBuilt: validation.data.yearBuilt || null,
              landValue: validation.data.landValue || null,
              buildingValue: validation.data.buildingValue || null,
              totalValue: (validation.data.landValue || 0) + (validation.data.buildingValue || 0) || null,
              uploadedBy: job.userId,
            };
            
            validRecords.push(parcelData);
            successCount++;
          } else {
            // Log validation error
            await db.insert(importErrors).values({
              jobId,
              rowNumber,
              errorMessage: validation.errors?.join('; ') || 'Validation failed',
              rawData: JSON.stringify(rawRecord),
            });
            failCount++;
          }
        } catch (error) {
          // Log parsing error
          await db.insert(importErrors).values({
            jobId,
            rowNumber,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            rawData: JSON.stringify(rawRecord),
          });
          failCount++;
        }
      }
      
      // Batch insert valid records with upsert logic
      if (validRecords.length > 0) {
        console.log(`[Import] Inserting ${validRecords.length} valid records`);
        
        try {
          await db.insert(parcels)
            .values(validRecords)
            .onDuplicateKeyUpdate({
              set: {
                address: sql`VALUES(address)`,
                squareFeet: sql`VALUES(squareFeet)`,
                yearBuilt: sql`VALUES(yearBuilt)`,
                landValue: sql`VALUES(landValue)`,
                buildingValue: sql`VALUES(buildingValue)`,
                totalValue: sql`VALUES(totalValue)`,
                uploadedBy: sql`VALUES(uploadedBy)`,
              },
            });
        } catch (dbError) {
          console.error(`[Import] Database insert failed:`, dbError);
          // Log all records in this batch as failed
          for (let k = 0; k < validRecords.length; k++) {
            await db.insert(importErrors).values({
              jobId,
              rowNumber: i + k + 1,
              errorMessage: dbError instanceof Error ? dbError.message : 'Database insert failed',
              rawData: JSON.stringify(validRecords[k]),
            });
            failCount++;
            successCount--;
          }
        }
      }
    }
    
    console.log(`[Import] Job ${jobId} completed: ${successCount} success, ${failCount} failed`);
    
    // Update job status
    const finalStatus = failCount === 0 ? 'completed' : (successCount > 0 ? 'partial' : 'failed');
    
    await db.update(importJobs).set({
      status: finalStatus,
      totalRecords: rawRecords.length,
      successfulRecords: successCount,
      failedRecords: failCount,
      completedAt: new Date(),
      errorSummary: failCount > 0 ? `${failCount} of ${rawRecords.length} records failed validation or insertion` : null,
    }).where(eq(importJobs.id, jobId));
    
  } catch (error) {
    console.error(`[Import] Job ${jobId} failed:`, error);
    
    // Mark job as failed
    await db.update(importJobs).set({
      status: 'failed',
      errorSummary: error instanceof Error ? error.message : 'Unknown error occurred',
      completedAt: new Date(),
    }).where(eq(importJobs.id, jobId));
    
    throw error;
  }
}
