import fs from 'node:fs';
import path from 'node:path';
import { AllowedUsers } from './types.ts';
import { EventTemplate, finalizeEvent, SimplePool, Event, getPublicKey, Relay, Filter } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

const DATA_DIR = path.join(process.cwd(), 'data');
const ALLOWED_USERS_FILE = path.join(DATA_DIR, 'allowedUsers.json');

// 環境変数からリレー情報を取得
export const LISTEN_RELAY = process.env.LISTEN_RELAY || 'wss://relay.damus.io';
export const PUBLISH_RELAYS = process.env.PUBLISH_RELAYS?.split(' ') || ['wss://relay.damus.io'];

export const loadJson = async (filename: string) => {
  try {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data, (key, value) => {
      // Date文字列をDateオブジェクトに変換
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value);
      }
      return value;
    });
  } catch (error) {
    return {};
  }
};

export const loadAllowedUsers = async (): Promise<AllowedUsers> => {
  return await loadJson(ALLOWED_USERS_FILE);
};

export const saveAllowedUsers = async (users: AllowedUsers): Promise<void> => {
  // dataディレクトリが存在しない場合は作成
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(ALLOWED_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
};

export const loadKey = async (filename: string): Promise<string> => {
  const filePath = path.join(DATA_DIR, filename);
  return (fs.readFileSync(filePath, 'utf-8')).trim();
};

export const saveKey = async (filename: string, key: string): Promise<void> => {
  // dataディレクトリが存在しない場合は作成
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, key, 'utf-8');
};

export const publishEvent = async (privateKey: string, event: EventTemplate): Promise<void> => {
  const sk = hexToBytes(privateKey);
  const signedEvent = finalizeEvent(event, sk);
  const pool = new SimplePool();
  await Promise.all(pool.publish(PUBLISH_RELAYS, signedEvent));
  pool.close(PUBLISH_RELAYS);
};

export const sendReply = async (event: Event, content: string, privateKey: string) => {
  const replyEvent = {
    kind: 1,
    content: content,
    tags: [['e', event.id], ['p', event.pubkey]], // リプライ先のイベントとユーザーをタグ付け
    created_at: Math.floor(Date.now() / 1000)
  };
  await publishEvent(privateKey, replyEvent);
};

export const connectToRelay = async (relayUrl: string): Promise<Relay> => {
  return await Relay.connect(relayUrl);
};

export const getBotPublicKey = (privateKey: string): string => {
  const sk = hexToBytes(privateKey);
  return getPublicKey(sk);
}; 