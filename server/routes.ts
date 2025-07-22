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

  // Get music recommendations based on emotion
  app.post("/api/recommendations", async (req, res) => {
    try {
      const { emotion, confidence } = req.body;
      
      if (!emotion) {
        return res.status(400).json({ message: "Emotion is required" });
      }

      // Get Spotify access token
      const accessToken = await getSpotifyAccessToken();

      // Create emotion session
      const session = await storage.createEmotionSession({
        emotion,
        confidence: confidence || 80
      });

      // First, let's get available genre seeds to verify our API access
      console.log('Fetching available genre seeds from Spotify...');
      const genreResponse = await fetch(
        'https://api.spotify.com/v1/recommendations/available-genre-seeds',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!genreResponse.ok) {
        const genreErrorText = await genreResponse.text();
        console.error('Failed to get genre seeds:', genreResponse.status, genreErrorText);
        console.error('Request headers:', genreResponse.headers);
        console.error('Response URL:', genreResponse.url);
        return res.status(400).json({ 
          message: "Failed to access Spotify API for genre seeds", 
          error: genreErrorText,
          status: genreResponse.status,
          url: genreResponse.url
        });
      }

      let selectedGenre = 'pop'; // Default fallback
      
      try {
        const genreData = await genreResponse.json();
        console.log('Available genres:', genreData.genres?.slice(0, 10) || 'No genres found');

        if (genreData.genres && genreData.genres.length > 0) {
          // Map emotions to available Spotify genres
          const emotionToGenres: Record<string, string[]> = {
            happy: ['pop', 'dance', 'funk', 'disco'],
            sad: ['blues', 'folk', 'indie'],
            angry: ['rock', 'metal', 'punk'],
            surprised: ['electronic', 'jazz', 'funk'],
            neutral: ['pop', 'indie', 'alternative'],
            fearful: ['ambient', 'classical'],
            disgusted: ['grunge', 'alternative', 'punk']
          };

          const possibleGenres = emotionToGenres[emotion.toLowerCase()] || emotionToGenres.neutral;
          const availableGenres = genreData.genres.filter(g => possibleGenres.includes(g));
          selectedGenre = availableGenres.length > 0 
            ? availableGenres[Math.floor(Math.random() * availableGenres.length)]
            : genreData.genres[Math.floor(Math.random() * Math.min(10, genreData.genres.length))];
        }
      } catch (parseError) {
        console.error('Failed to parse genre response, using fallback genre:', parseError);
      }

      // Get recommendations from Spotify
      console.log(`Making Spotify API request for genre: ${selectedGenre}`);
      const recommendationsResponse = await fetch(
        `https://api.spotify.com/v1/recommendations?seed_genres=${encodeURIComponent(selectedGenre)}&limit=10`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Spotify API response status: ${recommendationsResponse.status}`);
      
      // Read response body as text first to see what we got
      const responseText = await recommendationsResponse.text();
      console.log('Spotify API response body:', responseText);
      
      if (!recommendationsResponse.ok) {
        console.error('Spotify recommendations API error:');
        console.error('- Status:', recommendationsResponse.status);
        console.error('- Status Text:', recommendationsResponse.statusText);
        console.error('- URL:', recommendationsResponse.url);
        console.error('- Body:', responseText);
        return res.status(400).json({ 
          message: "Failed to get Spotify recommendations", 
          error: responseText,
          status: recommendationsResponse.status,
          statusText: recommendationsResponse.statusText,
          url: recommendationsResponse.url
        });
      }

      // Try to parse the response
      let recommendationsData;
      try {
        recommendationsData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Spotify response:', parseError, 'Response text:', responseText);
        return res.status(500).json({ message: "Invalid response from Spotify API" });
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
