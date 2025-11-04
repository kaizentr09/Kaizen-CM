import React from 'react';
import { SavedInspection } from '../types';

interface ReportsProps {
  inspections: SavedInspection[];
  onDownload: (inspection: SavedInspection) => void;
  onClose: () => void;
}

const Reports: React.FC<ReportsProps> = ({ inspections, onDownload, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Riwayat Inspeksi</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          {inspections.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum Ada Laporan</h3>
              <p className="mt-1 text-sm text-gray-500">Selesaikan inspeksi untuk melihat riwayatnya di sini.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {inspections.map(inspection => (
                <li key={inspection.id} className="p-4 border bg-slate-50 rounded-lg flex justify-between items-center transition-shadow hover:shadow-md">
                  <div>
                    <p className="font-bold text-slate-800">{inspection.carIdentity.licensePlate || 'Tanpa Plat'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(inspection.date).toLocaleString('id-ID', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => onDownload(inspection)}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors text-sm shadow-sm"
                  >
                    Unduh PDF
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
