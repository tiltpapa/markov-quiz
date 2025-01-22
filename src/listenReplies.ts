import { loadAllowedUsers, saveAllowedUsers, loadKey, publishEvent } from './utils';
import { Event, relayInit, getPublicKey } from 'nostr-tools';
import { AllowedUsers, NostrEvent } from './types';

const LISTEN_RELAY_URL = 'wss://relay.damus.io'; // 使用するリレーを指定

const handleReply = async (event: Event, botPubkey: string, privateKey: string, allowedUsers: AllowedUsers) => {
  const userPubkey = event.pubkey;
  const content = event.content.trim().toLowerCase();

  if (content === 'ok') {
    allowedUsers[userPubkey] = true;
    await saveAllowedUsers(allowedUsers);
    // 返信メッセージ
    const replyContent = 'あなたはクイズの許諾リストに追加されました！';
    await sendReply(event, replyContent, privateKey);
    console.log(`ユーザー ${userPubkey} を許諾リストに追加しました。`);
  } else if (content === 'ng') {
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
  } else {
    // 無効なコマンドに対する返信
    const replyContent = '許諾リストの管理には「OK」または「NG」とリプライしてください。';
    await sendReply(event, replyContent, privateKey);
    console.log(`ユーザー ${userPubkey} から無効なコマンドを受信しました。`);
  }
};

const sendReply = async (event: Event, content: string, privateKey: string) => {
  const replyEvent: Partial<NostrEvent> = {
    kind: 1,
    content: content,
    tags: [['e', event.id], ['p', event.pubkey]], // リプライ先のイベントとユーザーをタグ付け
  };
  await publishEvent(privateKey, replyEvent);
};

const listenReplies = async () => {
  const allowedUsers = await loadAllowedUsers();
  const privateKey = await loadKey('privateKey.txt');
  const botPubkey = getPublicKey(privateKey);

  const relay = relayInit(LISTEN_RELAY_URL);
  relay.on('connect', () => {
    console.log(`接続中: ${LISTEN_RELAY_URL}`);
    // ボット宛てのリプライを購読
    const sub = relay.sub([
      {
        kinds: [1],
        '#p': [botPubkey],
      },
    ]);

    sub.on('event', async (event: Event) => {
      await handleReply(event, botPubkey, privateKey, allowedUsers);
    });

    sub.on('eose', () => {
      console.log('購読終了（End of Stored Events）。');
    });
  });

  relay.on('error', () => {
    console.error(`リレー ${LISTEN_RELAY_URL} への接続に失敗しました。`);
  });

  await relay.connect();
};

export default listenReplies;