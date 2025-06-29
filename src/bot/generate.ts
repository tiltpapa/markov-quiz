import { generateQuizData } from '../lib/quiz.js';
import { loadUserData, saveUserData, LISTEN_RELAY, getPrivateKey, generateQuizFileName } from '../lib/nostr.js';
import fs from 'fs';
import path from 'path';

export const generateQuizForBot = async () => {
  console.log('🎯 クイズ生成を開始します...');
  
  // ユーザーデータを読み込み
  const userData = await loadUserData();
  console.log(`📋 許諾リスト: ${Object.keys(userData.allowedUsers).length}ユーザー`);
  console.log(`🚫 拒否リスト: ${Object.keys(userData.denyUsers).length}ユーザー`);

  if (Object.keys(userData.allowedUsers).length === 0) {
    throw new Error('許諾リストにユーザーが存在しません');
  }

  // クイズデータを生成
  const quizData = await generateQuizData({
    relays: [LISTEN_RELAY],
    userData,
    questionsCount: 5,
    eventsToFetch: 10000
  });

  if (!quizData) {
    throw new Error('クイズデータの生成に失敗しました');
  }

  // データディレクトリの作成
  const dataDir = path.join(process.cwd(), 'src', 'data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 新しいファイル名でクイズデータを保存
  const quizFileName = generateQuizFileName();
  const quizFilePath = path.join(dataDir, quizFileName);
  fs.writeFileSync(quizFilePath, JSON.stringify(quizData, null, 2), 'utf-8');
  
  // quiz.jsonにも最新のクイズデータを保存（後方互換性のため）
  const legacyQuizFilePath = path.join(dataDir, 'quiz.json');
  fs.writeFileSync(legacyQuizFilePath, JSON.stringify(quizData, null, 2), 'utf-8');
  
  console.log(`💾 クイズデータを保存しました: ${quizFileName}`);
  console.log(`🎮 問題数: ${quizData.questions.length}`);
  console.log(`👤 正解ユーザー: ${quizData.correctUserId.slice(0, 8)}...`);

  console.log('✨ クイズ生成が完了しました');
}; 