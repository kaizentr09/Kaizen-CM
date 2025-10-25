import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Tidak bisa mengakses kamera. Pastikan Anda telah memberikan izin.");
    }
  }, []);
  
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, [stream]);
  
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 p-4">
      {error ? (
        <div className="bg-white p-6 rounded-lg text-center">
            <h3 className="text-lg font-bold text-red-600 mb-4">Error</h3>
            <p className="text-slate-700 mb-4">{error}</p>
            <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-lg">Tutup</button>
        </div>
      ) : (
        <>
            <div className="relative w-full max-w-3xl aspect-video overflow-hidden rounded-lg shadow-lg">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="mt-6 flex items-center space-x-4">
                <button onClick={onClose} className="bg-gray-700 text-white font-bold py-3 px-6 rounded-full shadow-lg">
                    Batal
                </button>
                <button onClick={handleCapture} className="bg-blue-600 text-white font-bold p-4 rounded-full shadow-lg animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l1.414-1.414A1 1 0 0114.414 4H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        <path d="M10 12a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                </button>
            </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;