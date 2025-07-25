import { NostrFetcher } from 'nostr-fetch';
import { loadUserData, LISTEN_RELAYS } from '../lib/nostr.js';
import { nip19 } from 'nostr-tools';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';
import { UserInfo, UsersInfoData } from '../lib/types.js';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const USERS_INFO_FILE = path.join(DATA_DIR, 'allowedUsersInfo.json');

export const fetchUsersInfo = async () => {
  console.log('ユーザー情報の取得を開始します...');
  
  // ユーザーデータを読み込み
  const userData = await loadUserData();
  const allowedUserIds = Object.keys(userData.allowedUsers);
  
  console.log(`対象ユーザー数: ${allowedUserIds.length}人`);
  
  if (allowedUserIds.length === 0) {
    throw new Error('許諾リストにユーザーが存在しません');
  }

  // NostrFetcherを初期化
  const fetcher = NostrFetcher.init({ webSocketConstructor: WebSocket });
  
  const usersInfo: { [userId: string]: UserInfo } = {};

  // 既存のユーザー情報ファイルがあれば読み込み
  if (fs.existsSync(USERS_INFO_FILE)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(USERS_INFO_FILE, 'utf-8'));
      if (existingData.usersInfo) {
        Object.assign(usersInfo, existingData.usersInfo);
        console.log(`既存のユーザー情報を読み込みました: ${Object.keys(existingData.usersInfo).length}件`);
      }
    } catch (error) {
      console.log('⚠ 既存ファイルの読み込みに失敗しました、新規作成します');
    }
  }

  try {
    console.log('プロフィール情報を取得中...');
    
    // fetchLatestEventsPerAuthorを使用してすべてのユーザーのプロフィール情報を取得
    const profileEventsIterable = fetcher.fetchLatestEventsPerAuthor(
      { authors: allowedUserIds, relayUrls: LISTEN_RELAYS },
      {
        kinds: [0], // プロフィール情報
      },
      1 // 各ユーザーごとに1件ずつ取得
    );

    let successCount = 0;
    let errorCount = 0;

    // まず全allowedUsersの基本情報を初期化（既存データがない場合のみ）
    for (const userId of allowedUserIds) {
      if (!usersInfo[userId]) {
        usersInfo[userId] = {
          id: userId,
          npub: nip19.npubEncode(userId)
        };
      }
    }

    // AsyncIterableをイテレートして各ユーザーのプロフィール情報を処理
    for await (const { author, events } of profileEventsIterable) {
      try {
        if (events.length > 0 && usersInfo[author]) {
          try {
            const profileData = JSON.parse(events[0].content);
            // 既存データを保護：有効な値がある場合のみ上書き
            if (profileData.name && profileData.name.trim()) {
              usersInfo[author].name = profileData.name;
            }
            if (profileData.display_name && profileData.display_name.trim()) {
              usersInfo[author].display_name = profileData.display_name;
            }
            if (profileData.picture && profileData.picture.trim()) {
              usersInfo[author].picture = profileData.picture;
            }
            console.log(`✓ ${profileData.name || profileData.display_name || author.slice(0, 8)}`);
            successCount++;
          } catch (parseError) {
            console.log(`⚠ プロフィール解析失敗: ${author.slice(0, 8)}...`);
            errorCount++;
          }
        }
      } catch (error) {
        console.log(`❌ ユーザー処理エラー ${author.slice(0, 8)}...:`, error);
        errorCount++;
      }
    }

    // プロフィールが見つからなかったユーザーをカウント
    for (const userId of allowedUserIds) {
      if (!usersInfo[userId].name && !usersInfo[userId].display_name) {
        console.log(`⚠ プロフィール未発見: ${userId.slice(0, 8)}...`);
        errorCount++;
      }
    }

    console.log(`\n取得結果: 成功 ${successCount}件, エラー/未発見 ${errorCount}件`);

  } catch (error) {
    console.error('プロフィール情報の取得に失敗しました:', error);
    throw error;
  }

  // allowedUsersに含まれていないユーザー情報を削除
  const finalUsersInfo: { [userId: string]: UserInfo } = {};
  for (const userId of allowedUserIds) {
    if (usersInfo[userId]) {
      finalUsersInfo[userId] = usersInfo[userId];
    }
  }

  // データディレクトリの作成
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 結果をファイルに保存
  const result: UsersInfoData = {
    usersInfo: finalUsersInfo
  };

  fs.writeFileSync(USERS_INFO_FILE, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\nユーザー情報を保存しました`);
  console.log(`保存されたユーザー数: ${Object.keys(finalUsersInfo).length}人`);
};

// CLIから直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchUsersInfo()
    .then(() => {
      console.log('✅ ユーザー情報取得が完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ ユーザー情報取得でエラーが発生しました:', error);
      process.exit(1);
    });
} 