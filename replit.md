# Moodify - Emotion-Based Music Recommendation App

## Overview

This is a full-stack web application that uses facial emotion detection to recommend music from Spotify. The app captures video from a user's camera, analyzes their facial expressions to detect emotions using TensorFlow.js/face-api.js, and then recommends appropriate music tracks from Spotify based on the detected emotion.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

✓ Fixed infinite loop issue in emotion detection component completely
✓ Implemented stable emotion detection - detects once and stops until user requests re-detection  
✓ Removed synthetic emotion fallback data to maintain data integrity
✓ Added comprehensive WebGL compatibility checks and clear error messaging
✓ Implemented real Spotify API integration without hardcoded values
✓ Added manual Spotify OAuth authentication with popup flow
✓ Enhanced error handling for devices without WebGL support
✓ Improved emotion detection timeout protection and error states
✓ Updated UI to show clear requirements for WebGL-enabled devices
✓ Fixed Face API model loading to use CDN directly for better reliability

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management, React hooks for local state

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API endpoints
- **Development**: Hot reload with Vite integration in development mode

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for production use)
- **Schema**: Type-safe database schema with Zod validation
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Emotion Detection System
- **Library**: face-api.js for facial emotion recognition
- **Models**: TinyFaceDetector, FaceExpressionNet, FaceLandmark68Net, FaceRecognitionNet
- **Fallback**: CDN-hosted models as backup
- **Real-time Processing**: 1-second intervals for emotion detection
- **Supported Emotions**: happy, sad, angry, surprised, neutral, fearful, disgusted

### Camera Integration
- **API**: WebRTC MediaDevices API
- **Permissions**: Handles camera permission requests
- **Error Handling**: Graceful fallbacks for camera access issues
- **Video Processing**: Real-time video feed for emotion analysis

### Music Integration
- **Service**: Spotify Web API
- **Authentication**: OAuth 2.0 flow with PKCE
- **Features**: Track recommendations, playback controls, preview playback
- **Data**: Track metadata including album covers, artist information

### UI Components
- **Design System**: shadcn/ui with consistent styling
- **Theme**: Dark theme with green accent colors
- **Responsive**: Mobile-first responsive design
- **Accessibility**: ARIA compliant components from Radix UI

## Data Flow

1. **Camera Initialization**: User grants camera permission, video feed starts
2. **Emotion Detection**: Face-api.js analyzes video frames every second
3. **Emotion Processing**: Detected emotions are normalized and confidence scores calculated
4. **Spotify Authentication**: User connects to Spotify via OAuth
5. **Music Recommendation**: Emotion data sent to Spotify API for track recommendations
6. **Database Storage**: Emotion sessions and recommendations stored for history
7. **Music Playback**: Users can preview and control recommended tracks

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **face-api.js**: Facial emotion detection models
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Fast build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler

## Deployment Strategy

### Build Process
- **Client**: Vite builds React app to `dist/public`
- **Server**: esbuild bundles Node.js server to `dist/index.js`
- **Static Assets**: Served from build output directory

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Spotify**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
- **Development**: Automatic Vite integration with HMR
- **Production**: Optimized builds with external package bundling

### Database Setup
- **Schema**: Defined in `shared/schema.ts` with Drizzle
- **Tables**: users, emotion_sessions, music_recommendations
- **Migrations**: `npm run db:push` applies schema changes
- **Storage**: In-memory storage class for development, PostgreSQL for production

### Security Considerations
- **CORS**: Configured for cross-origin requests
- **Environment Variables**: Sensitive data stored in environment
- **OAuth**: Secure Spotify authentication flow
- **Input Validation**: Zod schemas for API request validation

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and robust error handling for both camera access and API integrations.