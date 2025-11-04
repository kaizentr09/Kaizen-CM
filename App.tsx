import React, { useState, useCallback, useEffect } from 'react';
import { ChecklistItemData, SavedInspection } from './types';
import { CAR_PARTS } from './constants';
import Checklist from './components/Checklist';
import Header from './components/Header';
import PdfReport from './components/PdfReport';
import CarIdentity from './components/CarIdentity';
import CameraCapture from './components/CameraCapture';
import Settings from './components/Settings';
import Reports from './components/Reports';
import { extractTextFromImage, analyzeCarPartImage } from './services/geminiService';
import { sendToGoogleSheets } from './services/googleSheetService';


declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const App: React.FC = () => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItemData[]>(
    CAR_PARTS.map(part => ({
      ...part,
      photo: null,
      status: 'unchecked',
      notes: '',
      isAnalyzing: false,
    }))
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [carIdentity, setCarIdentity] = useState({ licensePlate: '', odometer: '' });
  const [isProcessingId, setIsProcessingId] = useState<'licensePlate' | 'odometer' | null>(null);
  const [cameraTarget, setCameraTarget] = useState<string | null>(null); // 'licensePlate', 'odometer', or item.id
  
  const [showSettings, setShowSettings] = useState(false);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [inspectionId, setInspectionId] = useState(() => `INSP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const [showReports, setShowReports] = useState(false);
  const [savedInspections, setSavedInspections] = useState<SavedInspection[]>([]);
  const [pdfDataSource, setPdfDataSource] = useState<{ items: ChecklistItemData[], carIdentity: any } | null>(null);

  useEffect(() => {
    const storedUrl = localStorage.getItem('googleSheetsUrl');
    if (storedUrl) {
      setGoogleSheetsUrl(storedUrl);
    }
    const storedInspections = localStorage.getItem('savedInspections');
    if (storedInspections) {
      setSavedInspections(JSON.parse(storedInspections));
    }
  }, []);

  const handleSaveSettings = (url: string) => {
    setGoogleSheetsUrl(url);
    localStorage.setItem('googleSheetsUrl', url);
    setShowSettings(false);
  };

  const syncItemToSheets = useCallback(async (item: ChecklistItemData) => {
    if (!googleSheetsUrl) return;
    try {
      await sendToGoogleSheets(googleSheetsUrl, item, inspectionId, carIdentity);
    } catch (error) {
      console.error(`Failed to sync ${item.label} to Google Sheets`, error);
    }
  }, [googleSheetsUrl, inspectionId, carIdentity]);


  const handleUpdateItem = useCallback((id: string, update: Partial<ChecklistItemData>) => {
    let itemToSync: ChecklistItemData | null = null;
    
    setChecklistItems(prevItems => {
        const newItems = prevItems.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, ...update };
                if (
                    (update.status && update.status !== 'unchecked') ||
                    (update.notes !== undefined && item.status !== 'unchecked')
                ) {
                    itemToSync = updatedItem;
                }
                return updatedItem;
            }
            return item;
        });
        return newItems;
    });

    if (itemToSync) {
        syncItemToSheets(itemToSync);
    }
  }, [syncItemToSheets]);
  
  const handleUpdateIdentity = useCallback((update: Partial<typeof carIdentity>) => {
      setCarIdentity(prev => ({ ...prev, ...update }));
  }, []);

  const handleCapture = async (dataUrl: string) => {
    if (!cameraTarget) return;

    const currentTarget = cameraTarget;
    const targetItem = checklistItems.find(item => item.id === currentTarget);
    setCameraTarget(null);
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
        const initialUpdate = { photo: dataUrl, isAnalyzing: true, status: 'unchecked' as const, notes: 'Menganalisis gambar...' };
        handleUpdateItem(currentTarget, initialUpdate);
        
        try {
            const result = await analyzeCarPartImage(base64Image, targetItem.label);
            const finalUpdate = {
                status: result.status,
                notes: result.description,
                isAnalyzing: false,
            };
            handleUpdateItem(currentTarget, finalUpdate);
            syncItemToSheets({ ...targetItem, ...initialUpdate, ...finalUpdate });
        } catch (error) {
             console.error(`Failed to analyze ${targetItem.label}`, error);
             const errorUpdate = {
                isAnalyzing: false,
                notes: 'Gagal menganalisis gambar. Harap periksa manual.',
                status: 'not-good' as const,
             };
             handleUpdateItem(currentTarget, errorUpdate);
             syncItemToSheets({ ...targetItem, ...initialUpdate, ...errorUpdate });
        }
    }
  };
  
  const downloadPdf = async (items: ChecklistItemData[], identity: { licensePlate: string; odometer: string; }) => {
    setPdfDataSource({ items, carIdentity: identity });
    setIsGeneratingPdf(true);

    await new Promise(resolve => setTimeout(resolve, 100));

    const reportElement = document.getElementById('pdf-report');
    if (!reportElement) {
      console.error('PDF report element not found');
      setIsGeneratingPdf(false);
      setPdfDataSource(null);
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
      pdf.save(`walk-around-check-${identity.licensePlate || 'mobil'}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setIsGeneratingPdf(false);
      setPdfDataSource(null);
    }
  };

  const handleGeneratePdfAndSave = async () => {
    await downloadPdf(checklistItems, carIdentity);
    
    const newInspection: SavedInspection = {
        id: inspectionId,
        date: new Date().toISOString(),
        carIdentity,
        items: checklistItems,
    };
    
    setSavedInspections(prevInspections => {
        const updatedInspections = [newInspection, ...prevInspections];
        localStorage.setItem('savedInspections', JSON.stringify(updatedInspections));
        return updatedInspections;
    });
  };

  const handleStartNewInspection = () => {
    if (window.confirm('Apakah Anda yakin ingin memulai inspeksi baru? Kemajuan saat ini akan direset.')) {
        setChecklistItems(
            CAR_PARTS.map(part => ({
                ...part,
                photo: null,
                status: 'unchecked',
                notes: '',
                isAnalyzing: false,
            }))
        );
        setCarIdentity({ licensePlate: '', odometer: '' });
        setInspectionId(`INSP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
  };
  
  const allItemsChecked = checklistItems.every(item => item.status !== 'unchecked');
  const reportData = pdfDataSource || { items: checklistItems, carIdentity };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Header onShowSettings={() => setShowSettings(true)} onShowReports={() => setShowReports(true)} />
      {cameraTarget && <CameraCapture onCapture={handleCapture} onClose={() => setCameraTarget(null)} />}
      {showSettings && <Settings initialUrl={googleSheetsUrl} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />}
      {showReports && <Reports inspections={savedInspections} onDownload={(inspection) => downloadPdf(inspection.items, inspection.carIdentity)} onClose={() => setShowReports(false)} />}
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
        </div>
        <Checklist items={checklistItems} onUpdateItem={handleUpdateItem} onTakePhoto={(id) => setCameraTarget(id)} />
        <div className="mt-8 flex flex-col md:flex-row justify-center items-center gap-4">
          <button
            onClick={handleGeneratePdfAndSave}
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
           {allItemsChecked && (
            <button
              onClick={handleStartNewInspection}
              className="w-full md:w-auto bg-slate-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-300 flex items-center justify-center"
            >
              Mulai Inspeksi Baru
            </button>
          )}
        </div>
        {!allItemsChecked && (
          <p className="text-center text-sm text-red-600 mt-4">
            Silakan selesaikan pengecekan semua item untuk mengunduh PDF.
          </p>
        )}
      </main>
      <div className="absolute -z-10 -left-[9999px] top-0">
         <PdfReport items={reportData.items} carIdentity={reportData.carIdentity} />
      </div>
    </div>
  );
};

export default App;
