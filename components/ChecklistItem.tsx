import React from 'react';
import { ChecklistItemData, CheckStatus } from '../types';

interface ChecklistItemProps {
  item: ChecklistItemData;
  onUpdate: (id: string, update: Partial<ChecklistItemData>) => void;
  onTakePhoto: (id: string) => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, onUpdate, onTakePhoto }) => {
  const setStatus = (status: CheckStatus) => {
    onUpdate(item.id, { status });
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
                    onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
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
