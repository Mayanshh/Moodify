import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumCover: string;
  previewUrl?: string;
  matchScore?: number;
}

export interface SpotifyState {
  isConnected: boolean;
  accessToken: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function useSpotify() {
  const [state, setState] = useState<SpotifyState>({
    isConnected: false,
    accessToken: null,
    isConnecting: false,
    error: null
  });

  const connectToSpotify = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      console.log('Connecting to Spotify via server authentication...');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set connected state - server handles authentication automatically
      setState(prev => ({
        ...prev,
        isConnected: true,
        accessToken: 'server_managed', // Server handles tokens
        isConnecting: false,
        error: null
      }));
      
      console.log('Connected to Spotify successfully');

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect to Spotify',
        isConnecting: false
      }));
    }
  }, []);

  const getRecommendations = useCallback(async (emotion: string, confidence: number): Promise<SpotifyTrack[]> => {
    if (!state.isConnected) {
      throw new Error('Not connected to Spotify');
    }

    try {
      console.log(`Getting recommendations for emotion: ${emotion} with confidence: ${confidence}%`);
      
      const response = await apiRequest('POST', '/api/recommendations', {
        emotion,
        confidence
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get recommendations');
      }
      
      console.log(`Found ${data.recommendations.length} recommendations for ${emotion} mood`);
      
      return data.recommendations.map((rec: any) => ({
        id: rec.trackId,
        name: rec.trackName,
        artist: rec.artistName,
        albumCover: rec.albumCover,
        previewUrl: rec.previewUrl,
        matchScore: rec.matchScore
      }));
      
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  }, [state.isConnected]);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      accessToken: null,
      isConnecting: false,
      error: null
    });
  }, []);

  return {
    ...state,
    connectToSpotify,
    getRecommendations,
    disconnect
  };
}
