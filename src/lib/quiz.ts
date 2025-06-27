import { NostrFetcher } from 'nostr-fetch';
import { generateSentence } from './markov.js';
import { nip30, NostrEvent } from 'nostr-tools';
import { jaModel, Parser } from 'budoux';
import { MarkovChain } from 'kurwov';
import { UserData } from './types.js';
import { getRecentQuizUsers } from './nostr.js';

export interface QuizData {
  questions: string[];
  correctUserId: string;
  userDisplayName?: string;
  createdAt: number;
  emojiTags: string[][];
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

  // イベントを取得
  const fetcher = NostrFetcher.init({webSocketConstructor: WebSocket});
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
  const questions: string[] = [];
  for (let i = 0; i < questionsCount; i++) {
    const sentence = markov.generate();
    if (!sentence || sentence.length === 0) {
      console.log('例文生成に失敗しました。');
      return null;
    }
    questions.push(sentence.replace(/ /g,''));
  }
  
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
    correctUserId: randomUserId,
    createdAt: Date.now(),
    emojiTags: quizTags
  };
}; 