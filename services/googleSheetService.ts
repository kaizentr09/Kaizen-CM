import { ChecklistItemData } from '../types';

export async function sendToGoogleSheets(
  url: string,
  itemData: ChecklistItemData,
  inspectionId: string,
  carIdentity: { licensePlate: string, odometer: string }
): Promise<void> {
  const payload = {
    inspectionId: inspectionId,
    timestamp: new Date().toLocaleString('id-ID'),
    licensePlate: carIdentity.licensePlate || 'N/A',
    odometer: carIdentity.odometer || 'N/A',
    part: itemData.label,
    status: itemData.status,
    notes: itemData.notes,
  };

  const response = await fetch(url, {
    method: 'POST',
    mode: 'no-cors', // Required for simple Apps Script POST requests
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  // Note: With 'no-cors', we can't inspect the response body for success.
  // We assume success if the request doesn't throw a network error.
  // The Apps Script handles the data appending.
  if (response.type === 'opaque' || response.ok) {
     return Promise.resolve();
  } else {
     return Promise.reject(new Error('Failed to send data to Google Sheets'));
  }
}
