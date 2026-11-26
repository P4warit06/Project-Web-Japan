export const MOODS = ["happy", "calm", "excited", "tired", "sad"] as const;
export type Mood = (typeof MOODS)[number];

export type MemoryDTO = {
  id: string;
  tripId: string;
  tripTitle: string;
  title: string;
  content: string;
  happenedAt: string; // ISO datetime
  mood: Mood | null;
  tags: string[];
};
