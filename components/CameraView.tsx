import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }, []);

  useEffect(() => {
    startCamera();

    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Stop stream before passing data
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Video Viewport */}
      <div className="relative w-full h-full max-w-md bg-black overflow-hidden flex flex-col">
        <div className="absolute top-4 left-4 z-10">
          <button onClick={onCancel} className="p-2 bg-black/50 rounded-full text-white backdrop-blur-sm">
            <X size={24} />
          </button>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white p-6 text-center">
            <p className="mb-4 text-red-400">{error}</p>
            <button 
              onClick={startCamera}
              className="px-4 py-2 bg-indigo-600 rounded-lg flex items-center gap-2"
            >
              <RefreshCw size={18} /> Retry
            </button>
          </div>
        ) : (
          <div className="flex-1 relative">
             <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Controls */}
        <div className="h-32 bg-black/80 backdrop-blur-md flex items-center justify-center gap-8 w-full pb-6 pt-4">
          <div className="border-4 border-white/30 rounded-full p-1">
            <button 
              onClick={handleCapture}
              disabled={!!error}
              className="w-16 h-16 bg-white rounded-full hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center"
              aria-label="Take picture"
            >
              <Camera className="text-black" size={32} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};