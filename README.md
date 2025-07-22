
# MoodTunes 🎵

An emotion-based music recommendation system that detects your facial expressions and suggests Spotify tracks that match your mood.

## Features

- **Real-time Emotion Detection**: Uses Face API.js to analyze facial expressions
- **Smart Music Recommendations**: Integrates with Spotify API to suggest mood-appropriate music
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: Drizzle ORM with Neon PostgreSQL
- **APIs**: Spotify Web API, Face API.js
- **Deployment**: Replit

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `DATABASE_URL`
4. Run the development server: `npm run dev`

## How It Works

1. **Emotion Detection**: The camera captures your facial expression
2. **Mood Analysis**: Face API.js analyzes the image and determines your emotion
3. **Music Matching**: The system maps your emotion to appropriate music genres
4. **Spotify Integration**: Fetches recommendations from Spotify based on the detected mood
5. **Personalized Playlist**: Displays tracks that match your current emotional state

## Developer

**Mayansh Bangali**
- GitHub: [https://github.com/Mayanshh](https://github.com/Mayanshh)
- LinkedIn: [https://in.linkedin.com/in/mayansh-bangali](https://in.linkedin.com/in/mayansh-bangali)

---

*Built with passion for music and technology* 🚀
