import { Url } from "url";

export interface AllowedUsers {
    [userId: string]: Date;
}

export interface UsedEmojis {
    [emoji: string]: Url;
}