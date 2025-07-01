import { loadUserData, saveUserData, loadLastSince, saveLastSince, LISTEN_RELAY, sendReply, getBotPublicKey, connectToRelay, getPrivateKey } from '../lib/nostr.js';
import { Event, Filter, verifyEvent } from 'nostr-tools';
import { UserData } from '../lib/types.js';

const handleReply = async (event: Event, privateKey: string, userData: UserData) => {
  const userPubkey = event.pubkey;
  const content = event.content.trim().toLowerCase();

  if (content.slice(-2) === 'ok') {
    if (userData.allowedUsers[userPubkey]) {
      const replyContent = 'あなたは既に許諾リストに含まれています。';
      await sendReply(event, replyContent, privateKey);
    } else {
      // denyUsersにいる場合は削除
      if (userData.denyUsers[userPubkey]) {
        delete userData.denyUsers[userPubkey];
      }
      
      // allowedUsersに追加（valueはイベントのid）
      userData.allowedUsers[userPubkey] = event.id;
      await saveUserData(userData);
      
      // 返信メッセージ
      const replyContent = 'あなたはクイズの許諾リストに追加されました！';
      await sendReply(event, replyContent, privateKey);
      console.log(`ユーザー ${userPubkey.slice(0, 8)}... を許諾リストに追加しました。(id: ${event.id.slice(0, 8)}...)`);
    }
  } else if (content.slice(-2) === 'ng') {
    if (userData.allowedUsers[userPubkey]) {
      // allowedUsersから削除してdenyUsersに移動
      delete userData.allowedUsers[userPubkey];
      userData.denyUsers[userPubkey] = event.id;
      await saveUserData(userData);
      
      const replyContent = 'あなたはクイズの許諾リストから除外されました。';
      await sendReply(event, replyContent, privateKey);
      console.log(`ユーザー ${userPubkey.slice(0, 8)}... を許諾リストから除外し、拒否リストに追加しました。(id: ${event.id.slice(0, 8)}...)`);
    } else {
      // 既にallowedUsersにいない場合でも、denyUsersには追加
      userData.denyUsers[userPubkey] = event.id;
      await saveUserData(userData);
      
      const replyContent = 'あなたは拒否リストに追加されました。';
      await sendReply(event, replyContent, privateKey);
      console.log(`ユーザー ${userPubkey.slice(0, 8)}... を拒否リストに追加しました。(id: ${event.id.slice(0, 8)}...)`);
    }
  }
};

export const listenReplies = async () => {
  const userData = await loadUserData();
  const privateKey = getPrivateKey(); // 環境変数から取得
  const botPubkey = getBotPublicKey(privateKey);
  const lastSince = await loadLastSince();

  // 許諾リスト整理開始の通知
  console.log('許諾リスト整理を開始します...');
  console.log(`許諾リスト: ${Object.keys(userData.allowedUsers).length}ユーザー`);
  console.log(`拒否リスト: ${Object.keys(userData.denyUsers).length}ユーザー`);
  
  // 最後にreqした日付を呼び出す
  const filter: Filter = {
    kinds: [1],
    '#p': [botPubkey],
    since: lastSince
  };
  
  console.log(`前回取得時刻: ${new Date(lastSince * 1000).toLocaleString('ja')}`);

  const relay = await connectToRelay(LISTEN_RELAY);
  console.log(`リレー ${LISTEN_RELAY} に接続しました。`);

  // ボット宛てのリプライを購読
  const sub = relay.subscribe([
    filter
  ], {
    onevent(event) {
      console.log(`リプライを受信: ${event.pubkey.slice(0, 8)}... -> ${event.content.slice(0, 20)}...`);
      
      // イベントの署名検証を実行
      const isValid = verifyEvent(event);
      if (!isValid) {
        // console.log(`無効な署名のイベントを無視: ${event.id.slice(0, 8)}... from ${event.pubkey.slice(0, 8)}...`);
        return;
      }
      
      // console.log(`イベント署名検証成功: ${event.id.slice(0, 8)}...`);
      handleReply(event, privateKey, userData);
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