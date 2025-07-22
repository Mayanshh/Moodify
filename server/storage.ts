import { 
  users, 
  emotionSessions, 
  musicRecommendations,
  type User, 
  type InsertUser,
  type EmotionSession,
  type InsertEmotionSession,
  type MusicRecommendation,
  type InsertMusicRecommendation
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSpotifyTokens(userId: number, accessToken: string, refreshToken: string, expiresIn: number): Promise<void>;
  createEmotionSession(session: InsertEmotionSession & { userId?: number }): Promise<EmotionSession>;
  getRecentEmotionSessions(userId?: number, limit?: number): Promise<EmotionSession[]>;
  createMusicRecommendation(recommendation: InsertMusicRecommendation & { sessionId: number }): Promise<MusicRecommendation>;
  getRecommendationsBySession(sessionId: number): Promise<MusicRecommendation[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private emotionSessions: Map<number, EmotionSession>;
  private musicRecommendations: Map<number, MusicRecommendation>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentRecommendationId: number;

  constructor() {
    this.users = new Map();
    this.emotionSessions = new Map();
    this.musicRecommendations = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentRecommendationId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      spotifyAccessToken: null,
      spotifyRefreshToken: null,
      spotifyTokenExpiry: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserSpotifyTokens(userId: number, accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      const expiryDate = new Date(Date.now() + expiresIn * 1000);
      const updatedUser: User = {
        ...user,
        spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshToken,
        spotifyTokenExpiry: expiryDate
      };
      this.users.set(userId, updatedUser);
    }
  }

  async createEmotionSession(session: InsertEmotionSession & { userId?: number }): Promise<EmotionSession> {
    const id = this.currentSessionId++;
    const emotionSession: EmotionSession = {
      ...session,
      id,
      userId: session.userId || null,
      timestamp: new Date()
    };
    this.emotionSessions.set(id, emotionSession);
    return emotionSession;
  }

  async getRecentEmotionSessions(userId?: number, limit: number = 10): Promise<EmotionSession[]> {
    const sessions = Array.from(this.emotionSessions.values())
      .filter(session => !userId || session.userId === userId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
    return sessions;
  }

  async createMusicRecommendation(recommendation: InsertMusicRecommendation & { sessionId: number }): Promise<MusicRecommendation> {
    const id = this.currentRecommendationId++;
    const musicRecommendation: MusicRecommendation = {
      ...recommendation,
      id,
      albumCover: recommendation.albumCover || null,
      previewUrl: recommendation.previewUrl || null,
      matchScore: recommendation.matchScore || null
    };
    this.musicRecommendations.set(id, musicRecommendation);
    return musicRecommendation;
  }

  async getRecommendationsBySession(sessionId: number): Promise<MusicRecommendation[]> {
    return Array.from(this.musicRecommendations.values())
      .filter(rec => rec.sessionId === sessionId);
  }
}

export const storage = new MemStorage();
