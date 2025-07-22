import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function SpotifyCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'SPOTIFY_AUTH_ERROR',
          error: error
        }, window.location.origin);
        window.close();
      } else {
        setLocation('/');
      }
      return;
    }

    if (code) {
      // Exchange code for token
      fetch('/api/spotify/callback?code=' + code)
        .then(response => response.json())
        .then(data => {
          if (data.accessToken) {
            // Send success to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'SPOTIFY_AUTH_SUCCESS',
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresIn: data.expiresIn
              }, window.location.origin);
              window.close();
            } else {
              setLocation('/');
            }
          } else {
            throw new Error('No access token received');
          }
        })
        .catch(error => {
          console.error('Spotify auth error:', error);
          if (window.opener) {
            window.opener.postMessage({
              type: 'SPOTIFY_AUTH_ERROR',
              error: 'Failed to authenticate with Spotify'
            }, window.location.origin);
            window.close();
          } else {
            setLocation('/');
          }
        });
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold">Connecting to Spotify...</h2>
        <p className="text-slate-300 mt-2">Please wait while we authenticate your account</p>
      </div>
    </div>
  );
}