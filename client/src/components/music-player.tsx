import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2 
} from 'lucide-react';

interface Track {
  id: string;
  name: string;
  artist: string;
  albumCover: string;
  previewUrl?: string;
}

interface MusicPlayerProps {
  currentTrack?: Track | null;
  onNext?: () => void;
  onPrevious?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export function MusicPlayer({ 
  currentTrack, 
  onNext, 
  onPrevious, 
  onPlay, 
  onPause 
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'track' | 'playlist'>('off');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (currentTrack?.previewUrl && audioRef.current) {
      audioRef.current.src = currentTrack.previewUrl;
      audioRef.current.load();
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (repeatMode === 'track') {
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
      } else if (onNext) {
        onNext();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onNext, repeatMode]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.previewUrl) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        onPause?.();
      } else {
        await audio.play();
        setIsPlaying(true);
        onPlay?.();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = value[0];
    setVolume(newVolume);
    audio.volume = newVolume / 100;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      switch (prev) {
        case 'off': return 'playlist';
        case 'playlist': return 'track';
        case 'track': return 'off';
        default: return 'off';
      }
    });
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'track':
        return <Repeat className="w-4 h-4 text-emerald-400" />;
      case 'playlist':
        return <Repeat className="w-4 h-4" />;
      default:
        return <Repeat className="w-4 h-4" />;
    }
  };

  if (!currentTrack) {
    return (
      <Card className="glass-card border-white/20 p-6 bg-white/5">
        <div className="text-center text-slate-400 py-8">
          <span className="text-4xl mb-2 block">🎵</span>
          <p>No track selected</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-white/20 p-6 bg-white/5">
      <audio ref={audioRef} preload="metadata" />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img 
            src={currentTrack.albumCover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'} 
            alt="Album cover" 
            className="w-12 h-12 rounded-lg object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';
            }}
          />
          <div>
            <h4 className="font-semibold text-white truncate max-w-48">
              {currentTrack.name}
            </h4>
            <p className="text-sm text-slate-400 truncate max-w-48">
              {currentTrack.artist}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            size="icon"
            onClick={onPrevious}
            disabled={!onPrevious}
            className="glass-button bg-white/10 hover:bg-white/20 border-white/20 rounded-full w-10 h-10 disabled:opacity-50"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            size="icon"
            onClick={togglePlayPause}
            disabled={!currentTrack.previewUrl}
            className="glass-button bg-emerald-400/20 hover:bg-emerald-400/30 border-emerald-400/30 rounded-full w-12 h-12 disabled:opacity-50"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-emerald-400" />
            ) : (
              <Play className="w-5 h-5 text-emerald-400" />
            )}
          </Button>
          
          <Button
            size="icon"
            onClick={onNext}
            disabled={!onNext}
            className="glass-button bg-white/10 hover:bg-white/20 border-white/20 rounded-full w-10 h-10 disabled:opacity-50"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            size="icon"
            onClick={() => setIsShuffled(!isShuffled)}
            className={`glass-button bg-white/10 hover:bg-white/20 border-white/20 rounded-full w-10 h-10 ${
              isShuffled ? 'text-emerald-400' : ''
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </Button>
          
          <Button
            size="icon"
            onClick={toggleRepeat}
            className="glass-button bg-white/10 hover:bg-white/20 border-white/20 rounded-full w-10 h-10"
          >
            {getRepeatIcon()}
          </Button>
          
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center space-x-3 text-sm text-slate-400">
        <span className="w-12 text-right">{formatTime(currentTime)}</span>
        <Slider
          value={[duration ? (currentTime / duration) * 100 : 0]}
          onValueChange={handleProgressChange}
          max={100}
          step={0.1}
          className="flex-1"
        />
        <span className="w-12">{formatTime(duration)}</span>
      </div>
    </Card>
  );
}
