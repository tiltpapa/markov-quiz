import NDK, { NDKEvent, NDKFilter, NDKKind, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { hexToBytes } from '@noble/hashes/utils';
import { getPublicKey } from 'nostr-tools';
import WebSocket from 'ws';
import { Event } from 'nostr-tools';

// NDKインスタンスのグローバル管理
let ndkInstance: NDK | null = null;

// NDKインスタンスを取得または作成
export const getNDK = (relayUrls: string[] = []): NDK => {
  if (!ndkInstance) {
    ndkInstance = new NDK({
      explicitRelayUrls: relayUrls.length > 0 ? relayUrls : ['wss://relay.damus.io'],
      enableOutboxModel: false,
    });
  }
  return ndkInstance;
};

// NDKを初期化してリレーに接続
export const initNDK = async (relayUrls: string[]): Promise<NDK> => {
  const ndk = getNDK(relayUrls);
  await ndk.connect();
  return ndk;
};

// NDKインスタンスをクリーンアップ
export const cleanupNDK = () => {
  if (ndkInstance) {
    // NDKインスタンスをリセット
    ndkInstance = null;
  }
};

// 秘密鍵からNDKSignerを作成
export const createNDKSigner = (privateKey: string): NDKPrivateKeySigner => {
  const signer = new NDKPrivateKeySigner(privateKey);
  return signer;
};

// 公開鍵を取得
export const getPublicKeyFromPrivate = (privateKey: string): string => {
  const sk = hexToBytes(privateKey);
  return getPublicKey(sk);
};

// NDKEventをnostr-tools Eventに変換
export const ndkEventToNostrEvent = (ndkEvent: NDKEvent): Event => {
  return {
    id: ndkEvent.id!,
    pubkey: ndkEvent.pubkey!,
    created_at: ndkEvent.created_at!,
    kind: ndkEvent.kind!,
    tags: ndkEvent.tags,
    content: ndkEvent.content,
    sig: ndkEvent.sig!,
  };
};

// NDKでイベントを投稿
export const publishEvent = async (
  relayUrls: string[],
  privateKey: string,
  eventData: {
    kind: NDKKind;
    content: string;
    tags?: string[][];
    created_at?: number;
  }
): Promise<void> => {
  const ndk = await initNDK(relayUrls);
  const signer = createNDKSigner(privateKey);
  
  try {
    const event = new NDKEvent(ndk, {
      kind: eventData.kind,
      content: eventData.content,
      tags: eventData.tags || [],
      created_at: eventData.created_at || Math.floor(Date.now() / 1000),
    });
    
    await event.sign(signer);
    await event.publish();
    
    console.log('イベントを投稿しました:', event.id);
  } catch (error) {
    console.error('NDKでのイベント投稿に失敗:', error);
    throw error;
  }
}; 