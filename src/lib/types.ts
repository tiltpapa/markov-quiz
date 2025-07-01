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
  createdAt: number;
  emojiTags: string[][];
  userInfo: {
    id: string;
    name?: string;
    display_name?: string;
    npub: string;
  };
} 