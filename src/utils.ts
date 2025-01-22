import fs from 'fs-extra';
import path from 'path';
import { AllowedUsers, NostrEvent } from './types';
import { getEventHash, signEvent } from 'nostr-tools';

const DATA_DIR = path.join(__dirname, '../data');
const ALLOWED_USERS_FILE = path.join(DATA_DIR, 'allowedUsers.json');

export const loadAllowedUsers = async (): Promise<AllowedUsers> => {
  try {
    const data = await fs.readFile(ALLOWED_USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

export const saveAllowedUsers = async (users: AllowedUsers): Promise<void> => {
  await fs.writeFile(ALLOWED_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
};

export const loadKey = async (filename: string): Promise<string> => {
  const filePath = path.join(DATA_DIR, filename);
  return (await fs.readFile(filePath, 'utf-8')).trim();
};

export const publishEvent = async (privateKey: string, event: Partial<NostrEvent>): Promise<void> => {
  const createdAt = Math.floor(Date.now() / 1000);
  const fullEvent = {
    ...event,
    created_at: createdAt,
  };

  const eventHash = getEventHash(fullEvent);
  const signedEvent = {
    ...fullEvent,
    id: eventHash,
    sig: signEvent(fullEvent, privateKey),
  };

  const relays = ['wss://relay.damus.io', 'wss://relay.nostr.info'];
  for (const relay of relays) {
    try {
      const response = await fetch(relay, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(['EVENT', signedEvent]),
      });
      if (response.ok) {
        console.log(`イベントをリレー ${relay} に送信しました。`);
      } else {
        console.error(`リレー ${relay} への送信に失敗しました。ステータス: ${response.status}`);
      }
    } catch (error) {
      console.error(`リレー ${relay} への接続エラー:`, error);
    }
  }
};