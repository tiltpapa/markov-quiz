import { nip19 } from 'nostr-tools';
import { loadKey, publishEvent } from './utils';

const announceAnswer = async () => {
  const privateKey = await loadKey('privateKey.txt');
  const answerPublicKey = await loadKey('answerKey.txt');

  // 正解発表の投稿内容を作成
  const answerContent = `クイズの正解はユーザ: ${nip19.npubEncode(answerPublicKey)} です！`;

  const answerEvent = {
    kind: 1,
    content: answerContent,
    tags: [],
    created_at: Math.floor(Date.now / 1000)
  };

  await publishEvent(privateKey, answerEvent);

  console.log('正解を発表しました:', answerContent);
};

export default announceAnswer;