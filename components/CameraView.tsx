import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    // First try environment (back) camera
    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      { video: true, audio: false } // Fallback to any video device
    ];

    let lastError: any = null;
    
    for (const constraint of constraints) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
        setStream(mediaStream);
        setIsLoading(false);
        return; // Success
      } catch (err) {
        lastError = err;
        console.warn("Failed to start camera with constraint:", constraint, err);
      }
    }

    // If we reach here, all attempts failed
    console.error("All camera access attempts failed:", lastError);
    setError(lastError?.message || "Unable to access camera. Please check permissions.");
    setIsLoading(false);
  }, []);

  // Sync stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Some browsers require explicit play() call even with autoPlay
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [stream]);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ensure video is actually playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error("Video dimensions are 0, cannot capture.");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Stop stream before passing data
        stream.getTracks().forEach(track => track.stop());
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="relative w-full h-full max-w-md bg-black overflow-hidden flex flex-col">
        {/* Header Controls */}
        <div className="absolute top-4 left-4 z-20">
          <button 
            onClick={onCancel} 
            className="p-3 bg-black/60 text-white border border-white/20 hover:bg-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport */}
        <div className="flex-1 relative flex items-center justify-center bg-zinc-900">
          {error ? (
            <div className="flex flex-col items-center justify-center text-white p-8 text-center max-w-xs">
              <div className="mb-4 p-3 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <p className="mb-8 text-zinc-400 font-mono text-xs leading-relaxed uppercase tracking-tighter">
                {error}
              </p>
              <button 
                onClick={startCamera}
                className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Re-link System
              </button>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white z-10 bg-black">
                  <div className="w-12 h-12 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Initializing Optical Link</span>
                </div>
              )}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              />
              {/* Scanline Effect */}
              {!isLoading && (
                <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10 flex flex-col justify-center">
                  <div className="w-full h-[1px] bg-white/20 animate-scanline"></div>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Shutter Control */}
        <div className="h-40 bg-black flex flex-col items-center justify-center gap-4 w-full border-t border-white/10 px-8">
          <div className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Nexus Optical Capture</div>
          <div className="flex items-center gap-8">
            <div className="p-1 border border-white/10 rounded-full">
              <button 
                onClick={handleCapture}
                disabled={!!error || isLoading}
                className="w-20 h-20 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center group"
                aria-label="Capture Signal"
              >
                <div className="w-18 h-18 border border-black/10 flex items-center justify-center">
                  <Camera className="text-black group-active:scale-110 transition-transform" size={28} strokeWidth={1.5} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-50vh); }
          100% { transform: translateY(50vh); }
        }
        .animate-scanline {
          animation: scanline 3s linear infinite;
        }
      `}</style>
    </div>
  );
};