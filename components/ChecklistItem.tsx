import React from 'react';
import { ChecklistItemData, CheckStatus } from '../types';

interface ChecklistItemProps {
  item: ChecklistItemData;
  onUpdate: (id: string, update: Partial<ChecklistItemData>) => void;
  onTakePhoto: (id: string) => void;
}

const SyncStatusIndicator: React.FC<{ status: ChecklistItemData['syncStatus'], onRetry: () => void }> = ({ status, onRetry }) => {
  if (!status || status === 'unsynced' || status === 'good' || status === 'not-good' || status === 'unchecked') {
    return null;
  }
  
  const statusMap = {
    syncing: {
      Icon: () => (
        <svg className="h-5 w-5 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      text: 'Menyimpan...',
      color: 'text-blue-600'
    },
    synced: {
      Icon: () => <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
      text: 'Tersimpan',
      color: 'text-green-600'
    },
    error: {
      Icon: () => <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
      text: 'Gagal',
      color: 'text-red-600'
    },
  };

  const currentStatus = statusMap[status];
  if (!currentStatus) return null;

  return (
    <div className="flex items-center space-x-2">
      <currentStatus.Icon />
      <span className={`text-sm font-medium ${currentStatus.color}`}>{currentStatus.text}</span>
      {status === 'error' && (
        <button onClick={onRetry} className="text-xs text-blue-600 hover:underline">Coba Lagi</button>
      )}
    </div>
  );
};


const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, onUpdate, onTakePhoto }) => {
  const setStatus = (status: CheckStatus) => {
    onUpdate(item.id, { status, syncStatus: 'unsynced' });
  };
  
  const statusColor = {
    'unchecked': 'border-gray-300',
    'good': 'border-green-500',
    'not-good': 'border-red-500'
  }

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${statusColor[item.status]} overflow-hidden transition-all duration-300`}>
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-800">{item.label}</h3>
      </div>
      
      <div className="p-4 bg-slate-50">
        <div className="aspect-video bg-gray-200 rounded-md mb-4 flex items-center justify-center overflow-hidden">
          {item.photo ? (
            <img src={item.photo} alt={item.label} className="object-cover w-full h-full cursor-pointer" onClick={() => onTakePhoto(item.id)} />
          ) : (
            <button onClick={() => onTakePhoto(item.id)} className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                <path d="M10 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              </svg>
              <span className="mt-1 text-sm font-semibold">Ambil Foto</span>
            </button>
          )}
        </div>

        {item.photo && (
          <>
            <div className="flex justify-center space-x-2 mb-4">
              <button
                onClick={() => setStatus('good')}
                className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${item.status === 'good' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-200'}`}
              >
                Good
              </button>
              <button
                onClick={() => setStatus('not-good')}
                className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${item.status === 'not-good' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-red-200'}`}
              >
                Not Good
              </button>
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={`notes-${item.id}`} className="block text-sm font-medium text-gray-700">Catatan</label>
                  {item.status !== 'unchecked' && <SyncStatusIndicator status={item.syncStatus} onRetry={() => onUpdate(item.id, { syncStatus: 'unsynced' })} />}
                </div>
                {item.isAnalyzing ? (
                  <div className="w-full p-2 h-24 bg-gray-200 rounded-md animate-pulse flex items-center justify-center">
                    <p className="text-sm text-gray-500">AI sedang menganalisis...</p>
                  </div>
                ) : (
                  <textarea
                    id={`notes-${item.id}`}
                    rows={3}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                    value={item.notes}
                    onChange={(e) => onUpdate(item.id, { notes: e.target.value, syncStatus: 'unsynced' })}
                    placeholder="Tambah catatan (opsional)"
                  />
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChecklistItem;
