import { loadAllowedUsers, loadKey, publishEvent } from './utils';
import { fetchEvents } from 'nostr-fetch';
import { UsedEmojis } from './types';
import { buildMarkovChain, generateSentence } from './markov';
import { NostrEvent } from 'nostr-tools';
import fs from 'fs-extra';
import path from 'path';

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

  const contents = events
    .map((event) => sanitizeContent(event.content))
    .filter((content) => content.length > 0);

  if (contents.length === 0) {
    console.log('有効な投稿がありません。');
    return;
  }

  // Markofに食わせる二次配列を作成
  // sanitizeContentで不要な文字列を削除
  // budouxでわかち書きする

  // saveUsedEmojis
  let usedEmojis: UsedEmojis;
  events.forEach((event) => {
    if(event.tags.length > 1){
      event.tags.map((tag) => {
        if(tag[0] === "emoji"){ 
          usedEmojis[tag[1]] = tag[2];
        }
      })
    }
  });

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

  // 投稿内容に3つの例文をまとめる
  const quizContent = `クイズ: 次の投稿はどのユーザのものか？\n\n` + 
                       exampleSentences.map((s, index) => `${index + 1}. ${s}`).join('\n');

  // クイズ投稿用のイベント作成
  const quizEvent = {
    kind: 1,
    content: quizContent,
    tags: [],
    created_at: Math.floor(Date.now / 1000)
  };

  // クイズを投稿
  const privateKey = await loadKey('privateKey.txt');
  const answerPublicKey = await loadKey('publicKey.txt');

  await publishEvent(privateKey, quizEvent);

  console.log('クイズを生成し、投稿しました:', quizText);
  
  // publicKey.txtを保存

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