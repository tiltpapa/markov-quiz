import { loadKey, publishEvent } from './utils';

const announceAnswer = async () => {
  const privateKey = await loadKey('privateKey.txt');
  const answerPublicKey = await loadKey('publicKey.txt');

  // 正解発表の投稿内容を作成
  const answerContent = `クイズの正解はユーザ: ${answerPublicKey} です！`;

  const answerEvent = {
    kind: 1,
    content: answerContent,
    tags: [],
  };

  await publishEvent(privateKey, answerEvent);

  console.log('正解を発表しました:', answerContent);
};

export default announceAnswer;