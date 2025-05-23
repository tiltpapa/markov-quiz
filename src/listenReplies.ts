import { loadAllowedUsers, saveAllowedUsers, loadKey, publishEvent, saveKey, LISTEN_RELAY } from './utils.ts';
import { Event, getPublicKey, Relay, Filter } from 'nostr-tools';
import { AllowedUsers } from './types.ts';
import { hexToBytes } from '@noble/hashes/utils';

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
  }/* else {
    // 無効なコマンドに対する返信
    const replyContent = '許諾リストの管理には「OK」または「NG」とリプライしてください。';
    await sendReply(event, replyContent, privateKey);
    console.log(`ユーザー ${userPubkey} から無効なコマンドを受信しました。`);
  }*/
};

const sendReply = async (event: Event, content: string, privateKey: string) => {
  const replyEvent = {
    kind: 1,
    content: content,
    tags: [['e', event.id], ['p', event.pubkey]], // リプライ先のイベントとユーザーをタグ付け
    created_at: Math.floor(Date.now / 1000)
  };
  await publishEvent(privateKey, replyEvent);
};

const listenReplies = async () => {
  const allowedUsers = await loadAllowedUsers();

  const privateKey = await loadKey('privateKey.txt');
  const sk = hexToBytes(privateKey);
  const botPubkey = getPublicKey(sk);

  const noticeEvent = {
    kind: 1,
    content: 'これより許諾リストを整理します。',
    tags: [],
    created_at: Math.floor(Date.now / 1000)
  };
  await publishEvent(privateKey, noticeEvent);
  
  // 最後にreqした日付を呼び出す
  const filter: Filter = {
    kinds: [1],
    '#p': [botPubkey],
  };
  
  try {
    const lastSince = await loadKey('lastSince.txt');
    filter.since = Number(lastSince);
  } catch (error) {
    filter.since = Math.floor(new Date('2025/01/01').getTime() / 1000);
  }

  const relay = await Relay.connect(LISTEN_RELAY);

  // ボット宛てのリプライを購読
  const sub = relay.subscribe([
    filter
  ], {
    onevent(event) {
      handleReply(event, privateKey, allowedUsers);
    },
    oneose() {
      console.log('購読終了（End of Stored Events）。');
      sub.close();
    }
  });

  relay.close();

  // 現在の日時記録
  const now = Math.floor(Date.now / 1000);
  await saveKey('lastSince.txt', String(now));
};

export default listenReplies;