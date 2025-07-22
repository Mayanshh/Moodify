import { useState, useRef, useEffect } from 'react';

export interface CameraState {
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  permissionStatus: 'requesting' | 'granted' | 'denied';
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    stream: null,
    isActive: false,
    error: null,
    permissionStatus: 'requesting'
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      setState(prev => ({ ...prev, error: null, permissionStatus: 'requesting' }));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      setState(prev => ({
        ...prev,
        stream,
        isActive: true,
        permissionStatus: 'granted'
      }));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to access camera',
        isActive: false,
        permissionStatus: 'denied'
      }));
    }
  };

  const stopCamera = () => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    setState(prev => ({
      ...prev,
      stream: null,
      isActive: false
    }));
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto
  };
}
