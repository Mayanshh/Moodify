import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmotionSessionSchema, insertMusicRecommendationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Spotify OAuth endpoints
  app.get("/api/spotify/auth", async (req, res) => {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ message: "Spotify client ID not configured" });
      }

      const scopes = 'user-read-private user-read-email streaming user-read-playback-state user-modify-playback-state';
      const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5000/api/spotify/callback';
      
      const authUrl = `https://accounts.spotify.com/authorize?` +
        `response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate Spotify auth URL" });
    }
  });

  app.get("/api/spotify/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ message: "Authorization code missing" });
      }

      const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || process.env.VITE_SPOTIFY_CLIENT_SECRET;
      const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5000/api/spotify/callback';

      if (!clientId || !clientSecret) {
        return res.status(500).json({ message: "Spotify credentials not configured" });
      }

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        return res.status(400).json({ message: "Failed to exchange code for token", error: tokenData });
      }

      // Store tokens (in a real app, you'd associate with a user)
      res.json({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to handle Spotify callback" });
    }
  });

  // Get Spotify access token using Client Credentials flow
  async function getSpotifyAccessToken(): Promise<string> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Spotify credentials missing. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
      throw new Error('Spotify credentials not configured - missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
    }

    console.log('Getting Spotify access token with Client Credentials flow...');
    console.log('Client ID (first 8 chars):', clientId.substring(0, 8) + '...');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Spotify token error:', data);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Spotify auth failed: ${data.error_description || data.error} (Status: ${response.status})`);
    }

    console.log('Successfully obtained Spotify access token');
    console.log('Token type:', data.token_type);
    console.log('Expires in:', data.expires_in, 'seconds');
    return data.access_token;
  }

  // Cache for available genres
  let availableGenres: string[] | null = null;

  // Get available genre seeds from Spotify
  async function getAvailableGenres(accessToken: string): Promise<string[]> {
    if (availableGenres) {
      return availableGenres;
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        availableGenres = data.genres;
        console.log('Available Spotify genres:', availableGenres?.slice(0, 10), '... and more');
        return availableGenres || [];
      } else {
        console.warn('Failed to fetch available genres, using fallback');
        return ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop'];
      }
    } catch (error) {
      console.warn('Error fetching available genres:', error);
      return ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop'];
    }
  }

  // Get music recommendations based on emotion
  app.post("/api/recommendations", async (req, res) => {
    try {
      const { emotion, confidence } = req.body;
      
      if (!emotion) {
        return res.status(400).json({ message: "Emotion is required" });
      }

      // Get Spotify access token
      const accessToken = await getSpotifyAccessToken();

      // Get available genres from Spotify
      const genres = await getAvailableGenres(accessToken);

      // Create emotion session
      const session = await storage.createEmotionSession({
        emotion,
        confidence: confidence || 80
      });

      // Map emotions to Spotify-compatible genres
      console.log('Selecting genre based on emotion...');
      const emotionToGenres: Record<string, string[]> = {
        happy: genres.filter(g => ['pop', 'dance', 'funk', 'disco', 'soul', 'gospel', 'latin', 'reggae'].includes(g)),
        sad: genres.filter(g => ['blues', 'folk', 'country', 'acoustic', 'singer-songwriter', 'indie-folk'].includes(g)),
        angry: genres.filter(g => ['rock', 'metal', 'punk', 'hardcore', 'alternative', 'grunge'].includes(g)),
        surprised: genres.filter(g => ['electronic', 'jazz', 'funk', 'experimental', 'world-music'].includes(g)),
        neutral: genres.filter(g => ['pop', 'indie', 'alternative', 'rock', 'folk'].includes(g)),
        fearful: genres.filter(g => ['ambient', 'classical', 'new-age', 'chill', 'downtempo'].includes(g)),
        disgusted: genres.filter(g => ['grunge', 'alternative', 'punk', 'industrial', 'metal'].includes(g))
      };

      // Get possible genres for the emotion, fallback to top genres if none match
      let possibleGenres = emotionToGenres[emotion.toLowerCase()] || [];
      if (possibleGenres.length === 0) {
        possibleGenres = genres.slice(0, 5); // Use first 5 available genres as fallback
      }

      const selectedGenre = possibleGenres[Math.floor(Math.random() * possibleGenres.length)];

      // Get recommendations from Spotify using search as fallback if recommendations fail
      console.log(`Making Spotify API request for genre: ${selectedGenre}`);
      
      let recommendationsData;
      
      // Try recommendations API first
      try {
        const recommendationsResponse = await fetch(
          `https://api.spotify.com/v1/recommendations?seed_genres=${encodeURIComponent(selectedGenre)}&limit=10&market=US`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`Spotify recommendations API response status: ${recommendationsResponse.status}`);

        if (recommendationsResponse.ok) {
          recommendationsData = await recommendationsResponse.json();
        } else {
          throw new Error(`Recommendations API failed with status ${recommendationsResponse.status}`);
        }
      } catch (error) {
        console.log('Recommendations API failed, trying search API as fallback...');
        
        // Fallback to search API
        const searchQuery = `genre:${selectedGenre}`;
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10&market=US`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`Spotify search API response status: ${searchResponse.status}`);

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error('Both recommendations and search APIs failed');
          return res.status(400).json({ 
            message: "Failed to get Spotify recommendations", 
            error: errorText,
            status: searchResponse.status
          });
        }

        const searchData = await searchResponse.json();
        recommendationsData = {
          tracks: searchData.tracks.items
        };
      }

      if (!recommendationsData.tracks || recommendationsData.tracks.length === 0) {
        return res.status(400).json({ message: "No tracks found for the selected genre" });
      }
      
      // Store recommendations
      const storedRecommendations = [];
      for (const track of recommendationsData.tracks) {
        const recommendation = await storage.createMusicRecommendation({
          sessionId: session.id,
          trackId: track.id,
          trackName: track.name,
          artistName: track.artists[0]?.name || 'Unknown Artist',
          albumCover: track.album?.images[0]?.url || '',
          previewUrl: track.preview_url,
          matchScore: Math.floor(Math.random() * 20) + 80 // 80-100% match
        });
        storedRecommendations.push(recommendation);
      }

      res.json({
        session,
        recommendations: storedRecommendations
      });
    } catch (error) {
      console.error('Recommendation error:', error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Get user's recent emotion sessions
  app.get("/api/emotions/recent", async (req, res) => {
    try {
      const sessions = await storage.getRecentEmotionSessions(undefined, 10);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent emotions" });
    }
  });

  // Record new emotion detection
  app.post("/api/emotions", async (req, res) => {
    try {
      const validatedData = insertEmotionSessionSchema.parse(req.body);
      const session = await storage.createEmotionSession(validatedData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid emotion data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
