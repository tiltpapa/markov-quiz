import { loadAllowedUsers, loadKey, publishEvent } from './utils';
import { fetchEvents } from 'nostr-fetch';
import { NostrEvent } from './types';
import { buildMarkovChain, generateSentence } from './markov';
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

  // Markofに食わせる二次配列を作成
  // sanitizeContentで不要な文字列を削除
  // budouxでわかち書きする
  const contents = events
    .map((event) => sanitizeContent(event.content))
    .filter((content) => content.length > 0);

  if (contents.length === 0) {
    console.log('有効な投稿がありません。');
    return;
  }

  // saveUsedEmojis

  // マルコフ連鎖の構築
  const markov = buildMarkovChain(contents);

  // クイズ文を生成
  const quizText = generateSentence(markov);

  if (quizText.length === 0) {
    console.log('クイズの生成に失敗しました。');
    return;
  }

  // クイズを投稿
  const privateKey = await loadKey('privateKey.txt');
  const answerPublicKey = await loadKey('publicKey.txt');

  const quizContent = `クイズ: 次の投稿はどのユーザのものか？\n${quizText}`;
  const quizEvent = {
    kind: 1,
    content: quizContent,
    tags: [],
  };

  await publishEvent(privateKey, quizEvent);

  console.log('クイズを生成し、投稿しました:', quizText);
  
  // publicKey.txtを保存

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