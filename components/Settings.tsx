import React, { useState } from 'react';

interface SettingsProps {
  initialUrl: string;
  onSave: (url: string) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ initialUrl, onSave, onClose }) => {
  const [url, setUrl] = useState(initialUrl);

  const scriptCode = `var FOLDER_NAME = "Walkaround Check Photos";

function getDriveFolder() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    var folder = DriveApp.createFolder(FOLDER_NAME);
    folder.setDescription("Images uploaded from the Walkaround Check application.");
    return folder;
  }
}

function doPost(e) {
  try {
    var sheetName = "Walkaround Checks";
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
      sheet.getRange("A1:H1").setValues([["Inspection ID", "Timestamp", "License Plate", "Odometer (km)", "Car Part", "Status", "Notes", "Photo"]]).setFontWeight("bold");
      sheet.setColumnWidth(8, 150); // Set width for photo column
    }
    
    var data = JSON.parse(e.postData.contents);
    
    var photoUrl = "";
    if (data.photo) {
      try {
        var decodedImage = Utilities.base64Decode(data.photo, Utilities.Charset.UTF_8);
        var blob = Utilities.newBlob(decodedImage, 'image/jpeg', data.inspectionId + '-' + data.part + '.jpg');
        var folder = getDriveFolder();
        
        var files = folder.getFilesByName(blob.getName());
        var file;
        if (files.hasNext()) {
          file = files.next();
          file.setContent(blob.getBytes());
        } else {
          file = folder.createFile(blob);
        }
        
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        photoUrl = '=IMAGE("' + 'https://drive.google.com/uc?export=view&id=' + file.getId() + '")';
      } catch (f_err) {
        photoUrl = "Error uploading image: " + f_err.toString();
      }
    }

    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var rowIndex = -1;
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == data.inspectionId && values[i][4] == data.part) {
        rowIndex = i + 1;
        break;
      }
    }
    
    var newRowData = [data.inspectionId, data.timestamp, data.licensePlate, data.odometer, data.part, data.status, data.notes, photoUrl];
    
    if (rowIndex != -1) {
      sheet.getRange(rowIndex, 1, 1, 8).setValues([newRowData]);
    } else {
      sheet.appendRow(newRowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "action": rowIndex != -1 ? "updated" : "appended" })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log(error.toString());
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800">Pengaturan Google Sheets</h2>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <label htmlFor="gs-url" className="block text-sm font-bold text-gray-700 mb-2">
              URL Web App Google Apps Script
            </label>
            <input
              id="gs-url"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://script.google.com/macros/s/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-md border">
            <h3 className="text-base font-bold">Cara Mendapatkan URL:</h3>
            <ol className="pl-5 space-y-2">
              <li>Buka <a href="https://sheets.new" target="_blank" rel="noopener noreferrer">Google Sheets</a> dan buat spreadsheet baru.</li>
              <li>Buka <strong>Extensions &gt; Apps Script</strong>.</li>
              <li>Hapus semua kode yang ada dan tempel kode di bawah ini:
                <pre className="mt-2 bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto">
                  <code>{scriptCode}</code>
                </pre>
              </li>
              <li>Simpan proyek (ikon disket). Beri nama, misalnya "Walkaround Check Sync".</li>
              <li>Klik tombol <strong>Deploy &gt; New deployment</strong>.</li>
              <li>Klik ikon roda gigi di sebelah "Select type", lalu pilih <strong>Web app</strong>.</li>
              <li>Pada bagian "Who has access", pilih <strong>Anyone</strong> (PENTING!).</li>
              <li>Klik <strong>Deploy</strong>.</li>
              <li>Klik <strong>Authorize access</strong> dan izinkan skrip berjalan dengan akun Google Anda (skrip akan meminta izin untuk mengelola Google Sheets dan Google Drive).</li>
              <li>Salin <strong>Web app URL</strong> yang ditampilkan dan tempel di kolom di atas.</li>
            </ol>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(url)}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;