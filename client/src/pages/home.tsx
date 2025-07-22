import { useState, useEffect } from 'react';
import { CameraFeed } from '@/components/camera-feed';
import { EmotionPanel } from '@/components/emotion-panel';
import { MusicRecommendations } from '@/components/music-recommendations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Settings } from 'lucide-react';
import { SiSpotify } from 'react-icons/si';
import { useSpotify } from '@/hooks/use-spotify';
import { useToast } from '@/hooks/use-toast';

interface EmotionDetection {
  emotion: string;
  confidence: number;
  expressions: { [key: string]: number };
}

export default function Home() {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionDetection | null>(null);
  const { isConnected, isConnecting, connectToSpotify, disconnect } = useSpotify();
  const { toast } = useToast();

  // Note: Auto-connect removed as OAuth requires user interaction

  const handleEmotionDetected = (emotion: string, confidence: number) => {
    // Simulated expressions breakdown - in a real app this would come from TensorFlow.js
    const expressions: { [key: string]: number } = {
      [emotion]: confidence,
      neutral: Math.max(0, 100 - confidence - 20),
      happy: emotion === 'happy' ? confidence : Math.random() * 20,
      sad: emotion === 'sad' ? confidence : Math.random() * 10,
      angry: emotion === 'angry' ? confidence : Math.random() * 5,
      surprised: emotion === 'surprised' ? confidence : Math.random() * 15,
      fearful: emotion === 'fearful' ? confidence : Math.random() * 8,
      disgusted: emotion === 'disgusted' ? confidence : Math.random() * 5
    };

    setCurrentEmotion({
      emotion,
      confidence,
      expressions
    });
  };

  const handleSpotifyConnect = async () => {
    try {
      await connectToSpotify();
      toast({
        title: "Success",
        description: "Connected to Spotify successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to Spotify",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="glass-card border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 glass-card border-white/20 rounded-xl flex items-center justify-center">
                  <Music className="w-5 h-5 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
                  Moodify
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <SiSpotify className="w-4 h-4 text-green-500" />
                  <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
                <Button
                  size="icon"
                  className="glass-button bg-white/10 hover:bg-white/20 border-white/20"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Camera Feed */}
          <div className="xl:col-span-3">
            <CameraFeed onEmotionDetected={handleEmotionDetected} />
          </div>

          {/* Emotion Panel */}
          <div className="xl:col-span-1">
            <EmotionPanel currentEmotion={currentEmotion} />
          </div>
        </div>

        {/* Music Recommendations */}
        <div className="mt-6">
          <MusicRecommendations currentEmotion={currentEmotion} />
        </div>
      </main>
    </div>
  );
}