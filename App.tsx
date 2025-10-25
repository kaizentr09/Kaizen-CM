import React, { useState, useCallback, useEffect } from 'react';
import { ChecklistItemData } from './types';
import { CAR_PARTS } from './constants';
import Checklist from './components/Checklist';
import Header from './components/Header';
import PdfReport from './components/PdfReport';
import Settings from './components/Settings';
import CarIdentity from './components/CarIdentity';
import CameraCapture from './components/CameraCapture';
import { sendToGoogleSheets } from './services/googleSheetService';
import { extractTextFromImage, analyzeCarPartImage } from './services/geminiService';


declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const App: React.FC = () => {
  const [inspectionId] = useState(() => new Date().toISOString());
  const [checklistItems, setChecklistItems] = useState<ChecklistItemData[]>(
    CAR_PARTS.map(part => ({
      ...part,
      photo: null,
      status: 'unchecked',
      notes: '',
      isAnalyzing: false,
      syncStatus: 'unsynced',
    }))
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(() => localStorage.getItem('googleSheetUrl') || '');
  
  const [carIdentity, setCarIdentity] = useState({ licensePlate: '', odometer: '' });
  const [isProcessingId, setIsProcessingId] = useState<'licensePlate' | 'odometer' | null>(null);
  const [cameraTarget, setCameraTarget] = useState<string | null>(null); // 'licensePlate', 'odometer', or item.id

  const handleUpdateItem = useCallback((id: string, update: Partial<ChecklistItemData>) => {
    setChecklistItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, ...update } : item))
    );
  }, []);
  
  const handleUpdateIdentity = useCallback((update: Partial<typeof carIdentity>) => {
      setCarIdentity(prev => ({ ...prev, ...update }));
  }, []);

  const handleCapture = async (dataUrl: string) => {
    if (!cameraTarget) return;

    const currentTarget = cameraTarget;
    const targetItem = checklistItems.find(item => item.id === currentTarget);
    setCameraTarget(null); // Close camera immediately
    const base64Image = dataUrl.split(',')[1];

    if (currentTarget === 'licensePlate' || currentTarget === 'odometer') {
        setIsProcessingId(currentTarget);
        try {
            const text = await extractTextFromImage(base64Image, currentTarget);
            handleUpdateIdentity({ [currentTarget]: text });
        } catch (error) {
            console.error(`Failed to scan ${currentTarget}`, error);
            alert(`Gagal memindai ${currentTarget}. Silakan coba lagi atau isi manual.`);
        } finally {
            setIsProcessingId(null);
        }
    } else if (targetItem) {
        // It's a checklist item
        handleUpdateItem(currentTarget, { photo: dataUrl, isAnalyzing: true, status: 'unchecked', notes: 'Menganalisis gambar...' });
        try {
            const result = await analyzeCarPartImage(base64Image, targetItem.label);
            handleUpdateItem(currentTarget, {
                status: result.status,
                notes: result.description,
                isAnalyzing: false,
                syncStatus: 'unsynced'
            });
        } catch (error) {
             console.error(`Failed to analyze ${targetItem.label}`, error);
             handleUpdateItem(currentTarget, {
                isAnalyzing: false,
                notes: 'Gagal menganalisis gambar. Harap periksa manual.',
                status: 'not-good',
                syncStatus: 'unsynced'
             });
        }
    }
  };

  useEffect(() => {
    if (!googleSheetUrl) return;

    const itemToSync = checklistItems.find(item => 
      item.status !== 'unchecked' &&
      !item.isAnalyzing &&
      item.syncStatus === 'unsynced'
    );

    if (itemToSync) {
      handleUpdateItem(itemToSync.id, { syncStatus: 'syncing' });

      sendToGoogleSheets(googleSheetUrl, itemToSync, inspectionId, carIdentity)
        .then(() => {
          handleUpdateItem(itemToSync.id, { syncStatus: 'synced' });
        })
        .catch(error => {
          console.error("Failed to sync with Google Sheets:", error);
          handleUpdateItem(itemToSync.id, { syncStatus: 'error' });
        });
    }
  }, [checklistItems, googleSheetUrl, handleUpdateItem, inspectionId, carIdentity]);

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    const reportElement = document.getElementById('pdf-report');
    if (!reportElement) {
      console.error('PDF report element not found');
      setIsGeneratingPdf(false);
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const canvas = await window.html2canvas(reportElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`walk-around-check-${carIdentity.licensePlate || 'mobil'}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  const handleSaveSettings = (url: string) => {
    setGoogleSheetUrl(url);
    localStorage.setItem('googleSheetUrl', url);
    setShowSettings(false);
  };

  const allItemsChecked = checklistItems.every(item => item.status !== 'unchecked');

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Header onToggleSettings={() => setShowSettings(true)} />
       {showSettings && (
        <Settings
          initialUrl={googleSheetUrl}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {cameraTarget && <CameraCapture onCapture={handleCapture} onClose={() => setCameraTarget(null)} />}
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <CarIdentity 
         identity={carIdentity}
         onScan={(target) => setCameraTarget(target)}
         onUpdate={handleUpdateIdentity}
         isProcessing={isProcessingId}
        />
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Instruksi Pengecekan</h2>
          <p className="text-slate-600">
            Lakukan pengecekan pada setiap bagian mobil. Ambil foto, berikan status (Good/Not Good), dan tambahkan catatan. AI akan membantu menganalisis kerusakan.
          </p>
           {!googleSheetUrl && (
            <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
              <p className="font-bold">Fitur Google Sheets belum aktif.</p>
              <p>Klik ikon pengaturan di pojok kanan atas untuk menghubungkan aplikasi dengan Google Sheets.</p>
            </div>
          )}
        </div>
        <Checklist items={checklistItems} onUpdateItem={handleUpdateItem} onTakePhoto={(id) => setCameraTarget(id)} />
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleGeneratePdf}
            disabled={!allItemsChecked || isGeneratingPdf}
            className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isGeneratingPdf ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Membuat PDF...
              </>
            ) : (
              'Unduh Laporan PDF'
            )}
          </button>
        </div>
        {!allItemsChecked && (
          <p className="text-center text-sm text-red-600 mt-4">
            Silakan selesaikan pengecekan semua item untuk mengunduh PDF.
          </p>
        )}
      </main>
      <div className="absolute -z-10 -left-[9999px] top-0">
         <PdfReport items={checklistItems} carIdentity={carIdentity} />
      </div>
    </div>
  );
};

export default App;