import fs from 'node:fs';
import path from 'node:path';
import { UserData } from './types.js';
import { EventTemplate, finalizeEvent, SimplePool, Event, getPublicKey, Relay, Filter } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

// データディレクトリ（src内）
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ALLOWED_USERS_FILE = path.join(DATA_DIR, 'allowedUsers.json');
const LAST_SINCE_FILE = path.join(DATA_DIR, 'lastSince.json');

// 環境変数からリレー情報を取得
export const LISTEN_RELAY = process.env.LISTEN_RELAY || 'wss://relay.damus.io';
export const PUBLISH_RELAYS = process.env.PUBLISH_RELAYS?.split(' ') || ['wss://relay.damus.io'];

// 環境変数からプライベートキーを取得
export const getPrivateKey = (): string => {
  const privateKey = process.env.NOSTR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('NOSTR_PRIVATE_KEY環境変数が設定されていません');
  }
  return privateKey;
};

export const loadJson = async (filename: string) => {
  try {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

export const loadUserData = async (): Promise<UserData> => {
  const data = await loadJson(ALLOWED_USERS_FILE);
  return {
    allowedUsers: data.allowedUsers || {},
    denyUsers: data.denyUsers || {}
  };
};

export const saveUserData = async (userData: UserData): Promise<void> => {
  // src/dataディレクトリが存在しない場合は作成
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(ALLOWED_USERS_FILE, JSON.stringify(userData, null, 2), 'utf-8');
};

// 過去問から使用されたユーザーを取得する関数
export const getRecentQuizUsers = (): string[] => {
  const files = fs.readdirSync(DATA_DIR)
    .filter(file => file.match(/^quiz_\d{12}\.json$/))
    .sort((a, b) => b.localeCompare(a)) // 降順でソート（新しいファイルから）
    .slice(0, 3); // 過去3問分

  const recentUsers: string[] = [];
  for (const file of files) {
    try {
      const filePath = path.join(DATA_DIR, file);
      const quizData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (quizData.correctUserId) {
        recentUsers.push(quizData.correctUserId);
      }
    } catch (error) {
      console.log(`クイズファイル読み込みエラー: ${file}`);
    }
  }
  
  return recentUsers;
};

// 現在の日時をファイル名形式で生成する関数
export const generateQuizFileName = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `quiz_${year}${month}${day}${hour}${minute}.json`;
};

// lastSinceをJSON形式で管理
export const loadLastSince = async (): Promise<number> => {
  try {
    const data = await loadJson(LAST_SINCE_FILE);
    return data.timestamp || Math.floor(new Date('2025/01/01').getTime() / 1000);
  } catch (error) {
    return Math.floor(new Date('2025/01/01').getTime() / 1000);
  }
};

export const saveLastSince = async (timestamp: number): Promise<void> => {
  // src/dataディレクトリが存在しない場合は作成
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  const data = {
    timestamp,
    lastUpdate: new Date().toISOString(),
    description: "最後にリプライを取得した時刻（Unix timestamp）"
  };
  
  fs.writeFileSync(LAST_SINCE_FILE, JSON.stringify(data, null, 2), 'utf-8');
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