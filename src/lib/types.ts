import type { WindowNostr } from 'nostr-tools/nip07';

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

// NIP-07 Window extension
declare global {
  interface Window {
    nostr?: WindowNostr;
  }
} 

export interface UserInfo {
  id: string;
  name?: string;
  display_name?: string;
  picture?: string;
  npub: string;
}

export interface UsersInfoData {
  usersInfo: { [userId: string]: UserInfo };
}
