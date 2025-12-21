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
      <div className="relative w-full h-full max-w-md bg-black overflow-hidden flex flex-col border-x border-white/10">
        <div className="absolute top-4 left-4 z-10">
          <button onClick={onCancel} className="p-3 bg-black text-white border border-white/20 hover:bg-white/10 transition-colors rounded-none">
            <X size={20} />
          </button>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white p-6 text-center">
            <p className="mb-6 text-red-400 font-mono text-sm uppercase tracking-wider">{error}</p>
            <button 
              onClick={startCamera}
              className="px-6 py-3 bg-white text-black font-bold uppercase tracking-wider text-xs hover:bg-gray-200 flex items-center gap-2 rounded-none"
            >
              <RefreshCw size={14} /> Retry Access
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
        <div className="h-32 bg-black flex items-center justify-center gap-8 w-full border-t border-white/10">
          <div className="p-1 border border-white/20 rounded-none">
            <button 
              onClick={handleCapture}
              disabled={!!error}
              className="w-16 h-16 bg-white hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center rounded-none"
              aria-label="Take picture"
            >
              <div className="w-10 h-10 border-2 border-black rounded-none"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};