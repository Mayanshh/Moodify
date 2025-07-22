import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Heart, Share } from 'lucide-react';
import { SiSpotify } from 'react-icons/si';
import { useSpotify, type SpotifyTrack } from '@/hooks/use-spotify';
import { MusicPlayer } from './music-player';
import { useToast } from '@/hooks/use-toast';

interface MusicRecommendationsProps {
  currentEmotion?: {
    emotion: string;
    confidence: number;
  } | null;
}

export function MusicRecommendations({ currentEmotion }: MusicRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  const { isConnected, isConnecting, connectToSpotify, getRecommendations } = useSpotify();
  const { toast } = useToast();

  const loadRecommendations = async () => {
    if (!isConnected || !currentEmotion) return;

    setIsLoading(true);
    try {
      const tracks = await getRecommendations(currentEmotion.emotion, currentEmotion.confidence);
      setRecommendations(tracks);
      if (tracks.length > 0) {
        setCurrentTrack(tracks[0]);
        setCurrentTrackIndex(0);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get music recommendations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentEmotion && isConnected) {
      loadRecommendations();
    }
  }, [currentEmotion?.emotion, isConnected]);

  const playTrack = (track: SpotifyTrack, index: number) => {
    setCurrentTrack(track);
    setCurrentTrackIndex(index);
  };

  const nextTrack = () => {
    if (recommendations.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % recommendations.length;
    setCurrentTrack(recommendations[nextIndex]);
    setCurrentTrackIndex(nextIndex);
  };

  const previousTrack = () => {
    if (recommendations.length === 0) return;
    const prevIndex = currentTrackIndex === 0 ? recommendations.length - 1 : currentTrackIndex - 1;
    setCurrentTrack(recommendations[prevIndex]);
    setCurrentTrackIndex(prevIndex);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getStarRating = (score: number) => {
    const stars = Math.round((score / 100) * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < stars ? 'text-yellow-400' : 'text-slate-600'}>
        ⭐
      </span>
    ));
  };

  return (
    <Card className="glass-card border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">Mood-Based Recommendations</h2>
          <p className="text-slate-300">
            {currentEmotion ? 
              `Perfect tracks for your ${currentEmotion.emotion} mood` : 
              'Connect to Spotify and start emotion detection for personalized recommendations'
            }
          </p>
        </div>
        <Button
          onClick={loadRecommendations}
          disabled={!isConnected || !currentEmotion || isLoading}
          className="glass-button bg-white/10 hover:bg-white/20 border-white/20"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {!isConnected ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 glass-card rounded-full flex items-center justify-center border border-white/20">
            <SiSpotify className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Connect to Spotify</h3>
          <p className="text-slate-400 mb-4">
            Connect your Spotify account to get personalized music recommendations based on your emotions
          </p>
          <Button
            onClick={connectToSpotify}
            disabled={isConnecting}
            className="glass-button bg-emerald-400/20 hover:bg-emerald-400/30 text-white border-emerald-400/30"
          >
            <SiSpotify className="w-4 h-4 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect to Spotify'}
          </Button>
        </div>
      ) : !currentEmotion ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 glass-card rounded-full flex items-center justify-center border border-white/20">
            <span className="text-3xl">😊</span>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Start Emotion Detection</h3>
          <p className="text-slate-400 mb-4">
            Enable your camera to detect emotions and get music recommendations
          </p>
        </div>
      ) : (
        <>
          {/* Recommendations Grid */}
          {recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {recommendations.slice(0, 6).map((track, index) => (
                <Card 
                  key={track.id}
                  className={`glass-card border-white/20 p-4 hover:bg-white/20 transition-all cursor-pointer ${
                    currentTrack?.id === track.id ? 'ring-2 ring-emerald-400/50' : ''
                  }`}
                  onClick={() => playTrack(track, index)}
                >
                  <div className="flex items-center space-x-4">
                    <img 
                      src={track.albumCover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'} 
                      alt="Album cover" 
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate text-white">{track.name}</h4>
                      <p className="text-sm text-slate-400 truncate">{track.artist}</p>
                      <div className="flex items-center mt-1">
                        <div className="flex text-xs mr-2">
                          {getStarRating(track.matchScore || 85)}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs border-current ${getMatchScoreColor(track.matchScore || 85)}`}
                        >
                          {track.matchScore || 85}% match
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(track, index);
                      }}
                      className="glass-button bg-white/10 hover:bg-white/20 border-white/20 rounded-full w-10 h-10"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Music Player */}
          <MusicPlayer
            currentTrack={currentTrack}
            onNext={nextTrack}
            onPrevious={previousTrack}
          />
        </>
      )}

      {/* Floating Actions */}
      <div className="fixed bottom-6 right-6 space-y-4">
        <Button
          size="icon"
          className="glass-button bg-white/10 hover:bg-white/20 border-white/20 rounded-full w-14 h-14 shadow-lg"
          onClick={() => toast({ title: "Added to favorites", description: "Track saved to your library" })}
        >
          <Heart className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          className="glass-button bg-white/10 hover:bg-white/20 border-white/20 rounded-full w-14 h-14 shadow-lg"
          onClick={() => {
            if (navigator.share && currentTrack) {
              navigator.share({
                title: currentTrack.name,
                text: `Check out "${currentTrack.name}" by ${currentTrack.artist}`,
                url: window.location.href
              });
            } else {
              toast({ title: "Link copied", description: "Playlist link copied to clipboard" });
            }
          }}
        >
          <Share className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
}
