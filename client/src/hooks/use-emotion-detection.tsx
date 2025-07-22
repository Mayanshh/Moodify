import { useState, useCallback, useRef, useEffect } from 'react';
import { detectEmotions, loadFaceApiModels, type EmotionDetection } from '@/lib/tensorflow-setup';

export function useEmotionDetection() {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionDetection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeModels = useCallback(async () => {
    try {
      setError(null);
      await loadFaceApiModels();
      setModelsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emotion detection models');
      setModelsLoaded(false);
    }
  }, []);

  const startDetection = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!modelsLoaded) {
      await initializeModels();
    }

    if (!modelsLoaded || isDetecting) return;

    setIsDetecting(true);
    setError(null);

    const detect = async () => {
      try {
        if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
          const detection = await detectEmotions(videoElement);
          if (detection) {
            setCurrentEmotion(detection);
            // Stop detection once we have a stable emotion
            if (detectionIntervalRef.current) {
              clearInterval(detectionIntervalRef.current);
              detectionIntervalRef.current = null;
            }
            setIsDetecting(false);
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error during emotion detection';
        setError(errorMessage);
        setIsDetecting(false);
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
          detectionIntervalRef.current = null;
        }
      }
    };

    // Run detection every 2000ms until we get a result
    detectionIntervalRef.current = setInterval(detect, 2000);
  }, [modelsLoaded, initializeModels, isDetecting]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    initializeModels();
    
    return () => {
      stopDetection();
    };
  }, [initializeModels, stopDetection]);

  const redetectEmotion = useCallback(async (videoElement: HTMLVideoElement) => {
    setCurrentEmotion(null);
    stopDetection();
    await startDetection(videoElement);
  }, [startDetection, stopDetection]);

  return {
    currentEmotion,
    isDetecting,
    error,
    modelsLoaded,
    startDetection,
    stopDetection,
    redetectEmotion,
    initializeModels
  };
}
