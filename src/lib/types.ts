export interface AllowedUsers {
    [userId: string]: Date;
}

export interface QuizData {
  questions: string[];
  correctUserId: string;
  userDisplayName?: string;
  createdAt: number;
  emojiTags: string[][];
} 