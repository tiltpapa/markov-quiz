import fs from 'fs-extra';
import path from 'path';
import { AllowedUsers, UsedEmojis } from './types';
import { EventTemplate, finalizeEvent, getEventHash, NostrEvent, SimplePool } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils'

const DATA_DIR = path.join(__dirname, '../data');
const ALLOWED_USERS_FILE = path.join(DATA_DIR, 'allowedUsers.json');
const USED_EMOJIS_FILE = path.join(DATA_DIR, 'usedEmojis.json');

export const loadJson = async (filename: string) => {
  try {
    const data = await fs.readFile(filename, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

export const loadAllowedUsers = async (): Promise<AllowedUsers> => {
  return loadJson(ALLOWED_USERS_FILE);
};
/*
export const loadUsedEmojis = async (): Promise<UsedEmojis> => {
  return loadJson(USED_EMOJIS_FILE);
};
*/
export const saveAllowedUsers = async (users: AllowedUsers): Promise<void> => {
  await fs.writeFile(ALLOWED_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
};
/*
export const saveUsedEmojis = async (emojis: UsedEmojis): Promise<void> => {
  await fs.writeFile(USED_EMOJIS_FILE, JSON.stringify(emojis, null, 2), 'utf-8');
};
*/
export const loadKey = async (filename: string): Promise<string> => {
  const filePath = path.join(DATA_DIR, filename);
  return (await fs.readFile(filePath, 'utf-8')).trim();
};

export const saveKey = async (filename: string, key: string): Promise<void> => {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, key, 'utf-8');
};

export const publishEvent = async (privateKey: string, event: EventTemplate): Promise<void> => {
  const sk = hexToBytes(privateKey);
  const signedEvent = finalizeEvent(event, sk);
  const relays = import.meta.env.PUBLISH_RELAY.split(' ');
  const pool = new SimplePool();
  await Promise.all(pool.publish(relays, signedEvent));
};