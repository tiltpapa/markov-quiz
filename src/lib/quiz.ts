import { NostrFetcher } from 'nostr-fetch';
import { generateSentence } from './markov.js';
import { nip30, NostrEvent, nip19, Relay } from 'nostr-tools';
// import { useWebSocketImplementation } from 'nostr-tools/relay';
import { jaModel, Parser } from 'budoux';
import { MarkovChain } from 'kurwov';
import { UserData } from './types.js';
import { getRecentQuizUsers } from './nostr.js';
import WebSocket from 'ws';

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

export interface QuizGenerationConfig {
  relays: string[];
  userData: UserData;
  questionsCount?: number;
  eventsToFetch?: number;
}

const sanitizeContent = (content: string): string => {
  // URLやnostr URIを除去
  return content
    .replace(/https?:\/\/\S+/g, '')
    .replace(/nostr:\S+/g, '')
    .replace(/:\w+:/g, (match) => match) // カスタム絵文字を保持
    .trim();
};

export const generateQuizData = async (config: QuizGenerationConfig): Promise<QuizData | null> => {
  const { relays, userData, questionsCount = 3, eventsToFetch = 10000 } = config;
  const { allowedUsers, denyUsers } = userData;
  
  // 許可されているユーザーのIDリスト（拒否リストにないもののみ）
  const availableUserIds = Object.keys(allowedUsers).filter(userId => !denyUsers[userId]);

  if (availableUserIds.length === 0) {
    console.log('許諾リストにユーザが存在しません。');
    return null;
  }

  // 過去3問で使用されたユーザーを取得
  const recentQuizUsers = getRecentQuizUsers();
  console.log(`過去3問で使用されたユーザー: ${recentQuizUsers.length}人`);

  // 過去3問で使用されていないユーザーを優先的に選択
  const preferredUserIds = availableUserIds.filter(userId => !recentQuizUsers.includes(userId));
  const candidateUserIds = preferredUserIds.length > 0 ? preferredUserIds : availableUserIds;

  console.log(`選択候補ユーザー: ${candidateUserIds.length}人 (優先候補: ${preferredUserIds.length}人)`);

  // ランダムにユーザを選択
  const randomUserId = candidateUserIds[Math.floor(Math.random() * candidateUserIds.length)];
  console.log(`選択されたユーザー: ${randomUserId.slice(0, 8)}...`);

  // NostrFetcherを初期化（WebSocketを一度だけ使用）
  const fetcher = NostrFetcher.init({webSocketConstructor: WebSocket});

  // ユーザーのプロフィール情報を取得
  let userInfo: { id: string; name?: string; display_name?: string; npub: string };
  try {
    const profileEvents = await fetcher.fetchLatestEvents(
      relays,
      { kinds: [0], authors: [randomUserId] },
      1
    );

    if (profileEvents.length > 0) {
      try {
        const profileData = JSON.parse(profileEvents[0].content);
        userInfo = {
          id: randomUserId,
          name: profileData.name,
          display_name: profileData.display_name,
          npub: nip19.npubEncode(randomUserId)
        };
        console.log(`ユーザー情報取得成功: ${profileData.name || profileData.display_name || 'Unknown'}`);
      } catch (error) {
        console.log('プロフィール情報のパースに失敗しました');
        userInfo = {
          id: randomUserId,
          npub: nip19.npubEncode(randomUserId)
        };
      }
    } else {
      console.log('プロフィール情報が見つかりませんでした');
      userInfo = {
        id: randomUserId,
        npub: nip19.npubEncode(randomUserId)
      };
    }
  } catch (error) {
    console.log('プロフィール情報の取得に失敗しました:', error);
    userInfo = {
      id: randomUserId,
      npub: nip19.npubEncode(randomUserId)
    };
  }

  // イベントを取得（同じfetcherインスタンスを再利用）
  const events: NostrEvent[] = await fetcher.fetchLatestEvents(
    relays,
    { kinds: [1], authors: [randomUserId] },
    eventsToFetch,
  );

  if (events.length === 0) {
    console.log('選択したユーザの投稿が見つかりません。');
    return null;
  }
  
  // sanitizeContentで不要な文字列を削除
  // budouxでわかち書きする
  const parser = new Parser(jaModel);
  const contents = events
    .map((event) => sanitizeContent(event.content))
    .filter((content) => content.length > 0)
    .map((content) => {
        const tokens = parser.parse(content);
        return tokens.join(' ');
    });

  if (contents.length === 0) {
    console.log('有効な投稿がありません。');
    return null;
  }  

  // emojiタグを取り出す
  const emojiTags = events.filter((event) => event.tags.length > 1)
                    .flatMap((event) => event.tags)
                    .filter((tag) => tag[0] === "emoji")
  
  // マルコフ連鎖の構築
  const markov = new MarkovChain(contents);

  // 例文を生成
  const generationCount = questionsCount >= 20 ? questionsCount * 1.5 : 20; // 最低20回、questionsCount>=20なら30回
  const allQuestions: string[] = [];
  
  for (let i = 0; i < generationCount; i++) {
    const sentence = markov.generate();
    if (sentence && sentence.length > 0) {
      const cleanSentence = sentence.replace(/ /g,'');
      // 1文字以上のもののみ追加
      if (cleanSentence.length > 1) {
        allQuestions.push(cleanSentence);
      }
    }
  }
  
  if (allQuestions.length === 0) {
    console.log('有効な例文が生成できませんでした。');
    return null;
  }
  
  // 文字長でソート
  allQuestions.sort((a, b) => a.length - b.length);
  
  // 選択する個数を計算
  const shortCount = Math.floor(questionsCount * 0.4);
  const longCount = questionsCount - shortCount;
  
  const questions: string[] = [];
  
  // 短い方から選択
  for (let i = 0; i < Math.min(shortCount, allQuestions.length); i++) {
    questions.push(allQuestions[i]);
  }
  
  // 長い方から選択
  const startIndex = Math.max(0, allQuestions.length - longCount);
  for (let i = startIndex; i < allQuestions.length; i++) {
    if (!questions.includes(allQuestions[i])) {
      questions.push(allQuestions[i]);
    }
  }
  /*
  // 足りない場合は長い方から追加
  while (questions.length < questionsCount && questions.length < allQuestions.length) {
    for (let i = allQuestions.length - 1; i >= 0; i--) {
      if (!questions.includes(allQuestions[i])) {
        questions.push(allQuestions[i]);
        break;
      }
    }
  }
  */
  // questionsCount個に調整
  // questions.splice(questionsCount);
  
  const quizTags: string[][] = [];
  questions.forEach((sentence) => {
    const emojiIterator = nip30.matchAll(sentence);
    for (const emojiMatch of emojiIterator) {
       const tags = emojiTags.filter((emojiTag) => emojiMatch.name === emojiTag[1]);
       tags.forEach((tag) => quizTags.push(tag));
    }
  });

  return {
    questions,
    createdAt: Date.now(),
    emojiTags: quizTags,
    userInfo
  };
}; 