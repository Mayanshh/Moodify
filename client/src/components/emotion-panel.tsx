import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface EmotionPanelProps {
  currentEmotion?: {
    emotion: string;
    confidence: number;
    expressions: { [key: string]: number };
  } | null;
}

export function EmotionPanel({ currentEmotion }: EmotionPanelProps) {
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

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'text-emerald-400',
      sad: 'text-blue-400',
      angry: 'text-red-400',
      surprised: 'text-yellow-400',
      neutral: 'text-slate-400',
      fearful: 'text-purple-400',
      disgusted: 'text-green-400'
    };
    return colors[emotion] || 'text-slate-400';
  };

  const getProgressColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'bg-emerald-400',
      sad: 'bg-blue-400',
      angry: 'bg-red-400',
      surprised: 'bg-yellow-400',
      neutral: 'bg-slate-400',
      fearful: 'bg-purple-400',
      disgusted: 'bg-green-400'
    };
    return colors[emotion] || 'bg-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Current Emotion */}
      <Card className="glass-card border-white/20 p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Current Mood</h3>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 glass-card rounded-full flex items-center justify-center border border-white/20 shadow-lg shadow-emerald-400/20">
            <span className="text-3xl">
              {currentEmotion ? getEmotionIcon(currentEmotion.emotion) : '😐'}
            </span>
          </div>
          <h4 className={`text-2xl font-bold mb-2 capitalize ${
            currentEmotion ? getEmotionColor(currentEmotion.emotion) : 'text-slate-400'
          }`}>
            {currentEmotion?.emotion || 'No emotion detected'}
          </h4>
          <p className="text-sm text-slate-300">
            Confidence: {currentEmotion?.confidence || 0}%
          </p>
        </div>
      </Card>

      {/* Emotion Breakdown */}
      <Card className="glass-card border-white/20 p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Emotion Analysis</h3>
        <div className="space-y-3">
          {currentEmotion?.expressions ? (
            Object.entries(currentEmotion.expressions)
              .sort(([,a], [,b]) => b - a)
              .map(([emotion, confidence]) => (
                <div key={emotion} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getEmotionIcon(emotion)}</span>
                    <span className="text-sm text-white capitalize">{emotion}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(emotion)}`}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">
                      {confidence}%
                    </span>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center text-slate-400 py-8">
              <span className="text-4xl mb-2 block">🤖</span>
              <p>Start camera to analyze emotions</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
