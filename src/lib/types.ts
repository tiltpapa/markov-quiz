export interface AllowedUsers {
    [userId: string]: string;
}

export interface DenyUsers {
    [userId: string]: string;
}

export interface UserData {
    allowedUsers: AllowedUsers;
    denyUsers: DenyUsers;
}

export interface QuizData {
  questions: string[];
  correctUserId: string;
  userDisplayName?: string;
  createdAt: number;
  emojiTags: string[][];
} 