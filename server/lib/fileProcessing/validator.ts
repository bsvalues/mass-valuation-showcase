import { z } from 'zod';

export const ParcelImportSchema = z.object({
  parcelId: z.string().min(1, 'Parcel ID is required'),
  address: z.string().min(1, 'Address is required'),
  sqft: z.number().positive('Square footage must be positive').optional().nullable(),
  yearBuilt: z.number().int().min(1800, 'Year built must be after 1800').max(new Date().getFullYear(), 'Year built cannot be in the future').optional().nullable(),
  landValue: z.number().nonnegative('Land value cannot be negative').optional().nullable(),
  buildingValue: z.number().nonnegative('Building value cannot be negative').optional().nullable(),
  salePrice: z.number().nonnegative('Sale price cannot be negative').optional().nullable(),
});

export type ParcelImportInput = z.infer<typeof ParcelImportSchema>;

export function validateRecord(record: any): { success: boolean; data?: ParcelImportInput; errors?: string[] } {
  try {
    const validated = ParcelImportSchema.parse(record);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}
