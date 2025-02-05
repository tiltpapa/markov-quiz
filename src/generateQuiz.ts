import { loadAllowedUsers, loadKey, publishEvent } from './utils';
import { fetchEvents } from 'nostr-fetch';
import { UsedEmojis } from './types';
import { buildMarkovChain, generateSentence } from './markov';
import { NostrEvent } from 'nostr-tools';
import fs from 'fs-extra';
import path from 'path';
import { matchAll } from 'nostr-tools/lib/types/nip30';
import { loadDefaultJapaneseParser } from 'budoux';

const generateQuiz = async () => {
  const allowedUsers = await loadAllowedUsers();
  const userIds = Object.keys(allowedUsers);

  if (userIds.length === 0) {
    console.log('許諾リストにユーザが存在しません。');
    return;
  }

  // ランダムにユーザを選択
  const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];

  // イベントを取得
  const events: NostrEvent[] = await fetchEvents({
    kinds: [1],
    authors: [randomUserId],
    limit: 1000 // なるべく長い期間の投稿を取得
  });

  if (events.length === 0) {
    console.log('選択したユーザの投稿が見つかりません。');
    return;
  }
  
  // sanitizeContentで不要な文字列を削除
  // budouxでわかち書きする
  const parser = loadDefaultJapaneseParser();
  const contents = events
    .map((event) => sanitizeContent(event.content))
    .filter((content) => content.length > 0)
    .map((content) => {
        const tokens = parser.parse(content);
        return tokens.join(' ');
    });

  if (contents.length === 0) {
    console.log('有効な投稿がありません。');
    return;
  }  

  // emojiタグを取り出す
  const emojiTags = events.filter((event) => event.tags.length > 1)
                    .flatMap((event) => event.tags)
                    .filter((tag) => tag[0] === "emoji")
  
  // マルコフ連鎖の構築
  const markov = buildMarkovChain(contents);
  // 例文を 3 つ生成（それぞれ generateSentence を実行）
  const exampleSentences: string[] = [];
  for (let i = 0; i < 3; i++) {
    const sentence = generateSentence(markov);
    if (sentence.length === 0) {
      console.log('例文生成に失敗しました。');
      return;
    }
    exampleSentences.push(sentence);
  }
  
  const quizTags: string[][] = [];
  exampleSentences.forEach((sentence) => {
    const emojiIterator = matchAll(sentence);
    for (const emojiMatch of emojiIterator) {
       const tags = emojiTags.filter((emojiTag) => emojiMatch.name === emojiTag[1]);
       tags.forEach((tag) => quizTags.push(tag));
    }
  });
  // 投稿内容に3つの例文をまとめる
  const quizContent = `クイズ: 次の投稿はどのユーザのものか？\n\n` + 
                       exampleSentences.map((s, index) => `${index + 1}. ${s}`).join('\n');

  // クイズ投稿用のイベント作成
  const quizEvent = {
    kind: 1,
    content: quizContent,
    tags: quizTags,
    created_at: Math.floor(Date.now / 1000)
  };

  // クイズを投稿
  const privateKey = await loadKey('privateKey.txt');

  await publishEvent(privateKey, quizEvent);

  console.log('クイズを生成し、投稿しました:', quizContent);
  
  // answerKey.txtを保存

  // saveAllowUsers

};

const sanitizeContent = (content: string): string => {
  // URLやnostr URIを除去
  return content
    .replace(/https?:\/\/\S+/g, '')
    .replace(/nostr:\S+/g, '')
    .replace(/:\w+:/g, (match) => match) // カスタム絵文字を保持
    .trim();
};

export default generateQuiz;