import { generateQuizData } from '../lib/quiz.ts';
import { loadAllowedUsers, saveAllowedUsers, LISTEN_RELAY, getPrivateKey } from '../lib/nostr.ts';
import fs from 'fs';
import path from 'path';

export const generateQuizForBot = async () => {
  console.log('🎯 クイズ生成を開始します...');
  
  // 許諾リストを読み込み
  const allowedUsers = await loadAllowedUsers();
  console.log(`📋 許諾リスト: ${Object.keys(allowedUsers).length}ユーザー`);

  if (Object.keys(allowedUsers).length === 0) {
    throw new Error('許諾リストにユーザーが存在しません');
  }

  // クイズデータを生成
  const quizData = await generateQuizData({
    relays: [LISTEN_RELAY],
    allowedUsers,
    questionsCount: 3,
    eventsToFetch: 10000
  });

  if (!quizData) {
    throw new Error('クイズデータの生成に失敗しました');
  }

  // 静的ファイルディレクトリの作成
  const staticDir = path.join(process.cwd(), 'static');
  const dataDir = path.join(staticDir, 'data');
  
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // クイズデータをJSONファイルとして保存
  const quizFilePath = path.join(dataDir, 'quiz.json');
  fs.writeFileSync(quizFilePath, JSON.stringify(quizData, null, 2), 'utf-8');
  
  console.log(`💾 クイズデータを保存しました: ${quizFilePath}`);
  console.log(`🎮 問題数: ${quizData.questions.length}`);
  console.log(`👤 正解ユーザー: ${quizData.correctUserId.slice(0, 8)}...`);

  // 許諾リストを更新（使用済みユーザーの日時を更新）
  allowedUsers[quizData.correctUserId] = new Date();
  await saveAllowedUsers(allowedUsers);
  
  console.log('✨ 許諾リストを更新しました');
}; 