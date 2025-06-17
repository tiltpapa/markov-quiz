import { loadAllowedUsers, saveAllowedUsers, loadLastSince, saveLastSince, LISTEN_RELAY, sendReply, getBotPublicKey, connectToRelay, getPrivateKey } from '../lib/nostr.ts';
import { Event, Filter } from 'nostr-tools';
import { AllowedUsers } from '../lib/types.ts';

const handleReply = async (event: Event, privateKey: string, allowedUsers: AllowedUsers) => {
  const userPubkey = event.pubkey;
  const content = event.content.trim().toLowerCase();

  if (content.slice(-2) === 'ok') {
    if (allowedUsers[userPubkey]) {
      const replyContent = 'あなたは既に許諾リストに含まれています。';
      await sendReply(event, replyContent, privateKey);
    } else {
      allowedUsers[userPubkey] = new Date(0);
      await saveAllowedUsers(allowedUsers);
      // 返信メッセージ
      const replyContent = 'あなたはクイズの許諾リストに追加されました！';
      await sendReply(event, replyContent, privateKey);
      console.log(`ユーザー ${userPubkey} を許諾リストに追加しました。`);
    }
  } else if (content.slice(-2) === 'ng') {
    if (allowedUsers[userPubkey]) {
      delete allowedUsers[userPubkey];
      await saveAllowedUsers(allowedUsers);
      const replyContent = 'あなたはクイズの許諾リストから除外されました。';
      await sendReply(event, replyContent, privateKey);
      console.log(`ユーザー ${userPubkey} を許諾リストから除外しました。`);
    } else {
      const replyContent = 'あなたは既に許諾リストに含まれていません。';
      await sendReply(event, replyContent, privateKey);
      console.log(`ユーザー ${userPubkey} は許諾リストに含まれていません。`);
    }
  }
};

export const listenReplies = async () => {
  const allowedUsers = await loadAllowedUsers();
  const privateKey = getPrivateKey(); // 環境変数から取得
  const botPubkey = getBotPublicKey(privateKey);

  // 許諾リスト整理開始の通知
  console.log('許諾リスト整理を開始します...');
  
  // 最後にreqした日付を呼び出す
  const filter: Filter = {
    kinds: [1],
    '#p': [botPubkey],
  };
  
  const lastSince = await loadLastSince();
  filter.since = lastSince;
  console.log(`前回取得時刻: ${new Date(lastSince * 1000).toLocaleString('ja')}`);

  const relay = await connectToRelay(LISTEN_RELAY);
  console.log(`リレー ${LISTEN_RELAY} に接続しました。`);

  // ボット宛てのリプライを購読
  const sub = relay.subscribe([
    filter
  ], {
    onevent(event) {
      console.log(`リプライを受信: ${event.pubkey.slice(0, 8)}... -> ${event.content.slice(0, 20)}...`);
      handleReply(event, privateKey, allowedUsers);
    },
    oneose() {
      console.log('購読終了（End of Stored Events）。');
      sub.close();
      relay.close();
    }
  });

  // 現在の日時記録
  const now = Math.floor(Date.now() / 1000);
  await saveLastSince(now);
  console.log('許諾リスト整理が完了しました。');
}; 