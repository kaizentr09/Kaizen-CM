import { ChecklistItemData } from '../types';

export async function sendToGoogleSheets(
  url: string,
  itemData: ChecklistItemData,
  inspectionId: string,
  carIdentity: { licensePlate: string, odometer: string }
): Promise<void> {
  const payload = {
    inspectionId: inspectionId,
    timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    licensePlate: carIdentity.licensePlate || 'N/A',
    odometer: carIdentity.odometer || 'N/A',
    part: itemData.label,
    status: itemData.status,
    notes: itemData.notes,
    photo: itemData.photo ? itemData.photo.split(',')[1] : null, // Send base64 string
  };

  await fetch(url, {
    method: 'POST',
    mode: 'no-cors', // Required for simple Apps Script POST requests
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  // Note: With 'no-cors', we can't inspect the response for success.
  // We assume success if the request doesn't throw a network error.
}