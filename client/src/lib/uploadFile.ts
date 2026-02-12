/**
 * Upload file to S3 via backend endpoint
 * Returns the S3 URL and file key
 */
export async function uploadFileToS3(file: File): Promise<{ url: string; key: string }> {
  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  
  // Upload to backend endpoint which handles S3 upload
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }
  
  const data = await response.json();
  return {
    url: data.url,
    key: data.key,
  };
}
