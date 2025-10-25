import React from 'react';

interface CarIdentityProps {
  identity: {
    licensePlate: string;
    odometer: string;
  };
  onUpdate: (update: { licensePlate?: string; odometer?: string }) => void;
  onScan: (target: 'licensePlate' | 'odometer') => void;
  isProcessing: 'licensePlate' | 'odometer' | null;
}

const ScanButton: React.FC<{ onClick: () => void; isProcessing: boolean }> = ({ onClick, isProcessing }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isProcessing}
    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-wait"
    aria-label={isProcessing ? "Memindai" : "Pindai dengan kamera"}
  >
    {isProcessing ? (
      <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )}
  </button>
);


const CarIdentity: React.FC<CarIdentityProps> = ({ identity, onUpdate, onScan, isProcessing }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Identitas Kendaraan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
            Plat Nomor
          </label>
          <div className="relative">
            <input
              type="text"
              id="licensePlate"
              name="licensePlate"
              value={identity.licensePlate}
              onChange={(e) => onUpdate({ licensePlate: e.target.value.toUpperCase() })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 pr-10"
              placeholder="Scan atau ketik manual"
            />
            <ScanButton onClick={() => onScan('licensePlate')} isProcessing={isProcessing === 'licensePlate'} />
          </div>
        </div>
        <div>
          <label htmlFor="odometer" className="block text-sm font-medium text-gray-700 mb-1">
            Odometer (km)
          </label>
           <div className="relative">
              <input
                type="text"
                id="odometer"
                name="odometer"
                inputMode="numeric"
                value={identity.odometer}
                onChange={(e) => onUpdate({ odometer: e.target.value.replace(/\D/g, '') })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 pr-10"
                placeholder="Scan atau ketik manual"
              />
              <ScanButton onClick={() => onScan('odometer')} isProcessing={isProcessing === 'odometer'} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default CarIdentity;
