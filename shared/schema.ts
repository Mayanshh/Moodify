import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  spotifyAccessToken: text("spotify_access_token"),
  spotifyRefreshToken: text("spotify_refresh_token"),
  spotifyTokenExpiry: timestamp("spotify_token_expiry"),
});

export const emotionSessions = pgTable("emotion_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  emotion: text("emotion").notNull(),
  confidence: integer("confidence").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const musicRecommendations = pgTable("music_recommendations", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => emotionSessions.id),
  trackId: text("track_id").notNull(),
  trackName: text("track_name").notNull(),
  artistName: text("artist_name").notNull(),
  albumCover: text("album_cover"),
  previewUrl: text("preview_url"),
  matchScore: integer("match_score"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEmotionSessionSchema = createInsertSchema(emotionSessions).pick({
  emotion: true,
  confidence: true,
});

export const insertMusicRecommendationSchema = createInsertSchema(musicRecommendations).pick({
  trackId: true,
  trackName: true,
  artistName: true,
  albumCover: true,
  previewUrl: true,
  matchScore: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type EmotionSession = typeof emotionSessions.$inferSelect;
export type InsertEmotionSession = z.infer<typeof insertEmotionSessionSchema>;
export type MusicRecommendation = typeof musicRecommendations.$inferSelect;
export type InsertMusicRecommendation = z.infer<typeof insertMusicRecommendationSchema>;
