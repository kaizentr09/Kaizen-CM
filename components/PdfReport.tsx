import React from 'react';
import { ChecklistItemData } from '../types';

interface PdfReportProps {
  items: ChecklistItemData[];
  carIdentity: {
    licensePlate: string;
    odometer: string;
  };
}

const PdfReport: React.FC<PdfReportProps> = ({ items, carIdentity }) => {
  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'good':
        return { text: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
      case 'not-good':
        return { text: 'Not Good', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { text: 'Unchecked', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  return (
    <div id="pdf-report" className="w-[800px] bg-white p-8 font-sans">
      <header className="mb-8 pb-4 border-b-2 border-slate-600">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800">Laporan Walk Around Check</h1>
          <p className="text-lg text-slate-500 mt-2">
            Tanggal Dibuat: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex justify-around items-center text-center mt-6">
          <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Plat Nomor</p>
              <p className="text-2xl font-mono bg-gray-800 text-white py-1 px-4 rounded-md inline-block tracking-widest mt-1">{carIdentity.licensePlate || 'N/A'}</p>
          </div>
          <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Odometer</p>
              <p className="text-2xl font-mono text-slate-800 mt-1">{carIdentity.odometer ? `${Number(carIdentity.odometer).toLocaleString('id-ID')} km` : 'N/A'}</p>
          </div>
        </div>
      </header>
      
      <main className="space-y-6">
        {items.map(item => {
          const statusInfo = getStatusInfo(item.status);
          return (
            <div key={item.id} className="p-4 border border-gray-200 rounded-lg break-inside-avoid">
              <h2 className="text-2xl font-semibold text-slate-700 mb-3">{item.label}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {item.photo ? (
                    <img src={item.photo} alt={item.label} className="w-full h-auto object-cover rounded-md border border-gray-300" />
                  ) : (
                    <div className="w-full aspect-video bg-gray-100 flex items-center justify-center rounded-md">
                      <p className="text-gray-400">Tidak ada foto</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-start">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Status</h3>
                    <p className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.text}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Catatan</h3>
                    <p className="text-gray-800 text-base bg-slate-50 p-3 rounded-md min-h-[60px]">
                      {item.notes || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>
      
      <footer className="mt-8 pt-4 text-center text-xs text-gray-400 border-t border-gray-200">
        <p>Laporan ini dibuat secara otomatis oleh Aplikasi Walk Around Check.</p>
      </footer>
    </div>
  );
};

export default PdfReport;
