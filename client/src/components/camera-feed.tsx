import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, RotateCcw, Image } from 'lucide-react';
import { useCamera } from '@/hooks/use-camera';
import { useEmotionDetection } from '@/hooks/use-emotion-detection';
import { cn } from '@/lib/utils';

interface CameraFeedProps {
  onEmotionDetected?: (emotion: string, confidence: number) => void;
}

export function CameraFeed({ onEmotionDetected }: CameraFeedProps) {
  const { 
    stream, 
    isActive, 
    error: cameraError, 
    permissionStatus, 
    videoRef, 
    startCamera, 
    stopCamera, 
    capturePhoto 
  } = useCamera();
  
  const {
    currentEmotion,
    isDetecting,
    error: detectionError,
    modelsLoaded,
    startDetection,
    stopDetection,
    redetectEmotion
  } = useEmotionDetection();

  const [hasStarted, setHasStarted] = useState(false);
  const [hasDetectedEmotion, setHasDetectedEmotion] = useState(false);

  useEffect(() => {
    if (currentEmotion && onEmotionDetected && !hasDetectedEmotion) {
      setHasDetectedEmotion(true);
      onEmotionDetected(currentEmotion.emotion, currentEmotion.confidence);
    }
  }, [currentEmotion]);

  const handleStartCamera = async () => {
    setHasStarted(true);
    setHasDetectedEmotion(false);
    await startCamera();
  };

  const handleDetectEmotion = async () => {
    if (videoRef.current && modelsLoaded) {
      setHasDetectedEmotion(false);
      await startDetection(videoRef.current);
    }
  };

  const handleRedetectEmotion = async () => {
    if (videoRef.current) {
      setHasDetectedEmotion(false);
      await redetectEmotion(videoRef.current);
    }
  };

  const getEmotionIcon = (emotion: string) => {
    const icons: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      neutral: '😐',
      fearful: '😨',
      disgusted: '🤢'
    };
    return icons[emotion] || '😐';
  };

  const getStatusColor = () => {
    if (cameraError || detectionError) return 'bg-red-400';
    if (isActive && modelsLoaded) return 'bg-emerald-400';
    return 'bg-yellow-400';
  };

  const getStatusText = () => {
    if (cameraError) return 'Camera Error';
    if (detectionError) return 'Detection Error';
    if (!hasStarted) return 'Ready to Start';
    if (permissionStatus === 'requesting') return 'Requesting Permission';
    if (permissionStatus === 'denied') return 'Permission Denied';
    if (isActive && !modelsLoaded) return 'Loading Models';
    if (isActive && modelsLoaded) return 'Camera Active';
    return 'Camera Inactive';
  };

  return (
    <Card className="glass-card border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Emotion Detection</h2>
        <div className="flex items-center space-x-2">
          <div className={cn("w-3 h-3 rounded-full", getStatusColor(), {
            "animate-pulse": isActive && modelsLoaded
          })} />
          <span className="text-sm text-emerald-400">{getStatusText()}</span>
        </div>
      </div>

      <div className="relative aspect-video bg-slate-900/50 rounded-2xl overflow-hidden backdrop-blur-sm border border-white/10">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Emotion detection overlay */}
        {currentEmotion && currentEmotion.boundingBox && (
          <div 
            className="absolute border-2 border-emerald-400 rounded-lg shadow-lg shadow-emerald-400/30"
            style={{
              left: `${(currentEmotion.boundingBox.x / videoRef.current!.videoWidth) * 100}%`,
              top: `${(currentEmotion.boundingBox.y / videoRef.current!.videoHeight) * 100}%`,
              width: `${(currentEmotion.boundingBox.width / videoRef.current!.videoWidth) * 100}%`,
              height: `${(currentEmotion.boundingBox.height / videoRef.current!.videoHeight) * 100}%`
            }}
          >
            <div className="absolute -top-12 left-0 glass-card rounded-lg px-3 py-1 border border-white/20">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getEmotionIcon(currentEmotion.emotion)}</span>
                <span className="text-sm font-medium text-white capitalize">
                  {currentEmotion.emotion}
                </span>
                <span className="text-xs text-emerald-400">
                  {currentEmotion.confidence}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* No camera state */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 glass-card rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-400 mb-4">
                {cameraError || detectionError ? 
                  (cameraError || detectionError) : 
                  'Click to start camera'
                }
              </p>
              {!hasStarted && (
                <Button 
                  onClick={handleStartCamera}
                  className="glass-button bg-emerald-400/20 hover:bg-emerald-400/30 text-white border-emerald-400/30"
                >
                  Start Camera
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Error state for WebGL/Detection issues */}
        {isActive && detectionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center max-w-md mx-4">
              <div className="w-16 h-16 mx-auto mb-4 glass-card rounded-full flex items-center justify-center border border-red-400/30">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Detection Not Available</h3>
              <p className="text-sm text-slate-300 mb-4">
                {detectionError}
              </p>
              <p className="text-xs text-slate-400">
                Try using a different browser or device that supports WebGL for emotion detection.
              </p>
            </div>
          </div>
        )}

        {/* Camera active but no emotion detected */}
        {isActive && !currentEmotion && !detectionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="text-center">
              <Button 
                onClick={handleDetectEmotion}
                disabled={isDetecting}
                className="glass-button bg-emerald-400/20 hover:bg-emerald-400/30 text-white border-emerald-400/30"
              >
                {isDetecting ? 'Detecting...' : 'Detect Emotion'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Camera controls */}
      <div className="flex items-center justify-center mt-4 space-x-4">
        <Button
          size="icon"
          onClick={isActive ? stopCamera : handleStartCamera}
          className="glass-button bg-white/10 hover:bg-white/20 border-white/20 rounded-full w-12 h-12"
        >
          {isActive ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </Button>
        
        <Button
          size="icon"
          onClick={capturePhoto}
          disabled={!isActive}
          className="glass-button bg-white/10 hover:bg-white/20 border-white/20 rounded-full w-12 h-12 disabled:opacity-50"
        >
          <Image className="w-5 h-5" />
        </Button>
        
        <Button
          size="icon"
          onClick={handleRedetectEmotion}
          disabled={!isActive || !videoRef.current}
          className="glass-button bg-emerald-400/20 hover:bg-emerald-400/30 border-emerald-400/30 rounded-full w-12 h-12 disabled:opacity-50"
          title="Detect New Emotion"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
}
