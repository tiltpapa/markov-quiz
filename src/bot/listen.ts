import { loadUserData, saveUserData, loadLastSince, saveLastSince, LISTEN_RELAY, sendReply, getBotPublicKey, connectToRelay, getPrivateKey } from '../lib/nostr.js';
import { Event, Filter, Relay, verifyEvent } from 'nostr-tools';
import { UserData } from '../lib/types.js';
import { NostrFetcher } from 'nostr-fetch';
import WebSocket from 'ws';

const handleReply = async (event: Event, privateKey: string, userData: UserData) => {
  const userPubkey = event.pubkey;
  const content = event.content.trim().toLowerCase();

  try {
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
  } catch (error) {
    console.error(`リプライ処理でエラーが発生しました (ユーザー: ${userPubkey.slice(0, 8)}...):`, error);
    // エラーが発生してもuserDataの更新は試行する
/*    try {
      await saveUserData(userData);
    } catch (saveError) {
      console.error('ユーザーデータの保存に失敗しました:', saveError);
    }*/
  }
};

export const listenReplies = async () => {
  console.log('=== 許諾リスト整理開始 ===');
  
  try {
    const userData = await loadUserData();
    // console.log('✓ ユーザーデータ読み込み完了');
    const privateKey = getPrivateKey(); // 環境変数から取得
    // console.log('✓ プライベートキー取得完了');
    const botPubkey = getBotPublicKey(privateKey);
    // console.log(`✓ ボットの公開キー: ${botPubkey}`);
    const lastSince = await loadLastSince();
    // console.log('✓ lastSince読み込み完了');

    // 許諾リスト整理開始の通知
    console.log(`許諾リスト: ${Object.keys(userData.allowedUsers).length}ユーザー`);
    console.log(`拒否リスト: ${Object.keys(userData.denyUsers).length}ユーザー`);
    
    // デバッグ用：現在時刻とlastSinceの比較
    const nowfortest = Math.floor(Date.now() / 1000);
    console.log(`現在時刻: ${new Date(nowfortest * 1000).toLocaleString('ja')} (${nowfortest})`);
    console.log(`前回取得時刻: ${new Date(lastSince * 1000).toLocaleString('ja')} (${lastSince})`);
    console.log(`時間差: ${(nowfortest - lastSince) / 60} 分`);
    
    // NostrFetcherを初期化
    const fetcher = NostrFetcher.init({ webSocketConstructor: WebSocket });
    
    // フィルター設定
    const filter = {
      kinds: [1],
      '#p': [botPubkey],
      since: lastSince
    };
    
    // console.log('使用するフィルター:', JSON.stringify(filter, null, 2));
    console.log(`リレーURL: ${LISTEN_RELAY}`);

    // console.log('ボット宛てのリプライを取得します...');
    
    // ボット宛てのリプライを取得（最大1000件）
    const events = await fetcher.fetchLatestEvents(
      [LISTEN_RELAY],
      filter,
      1000
    );
    
    console.log(`取得完了: ${events.length}件のイベント`);
    
    if (events.length === 0) {
      console.log('ボット宛てのリプライが見つかりませんでした。');
    } else {
      console.log('取得されたイベントを処理します...');
      
      let processedCount = 0;
      events.sort((a, b) => a.created_at - b.created_at);
      
      // 並行処理ではなく順次処理に変更
      for (const event of events) {
        processedCount++;
        console.log(`[${processedCount}/${events.length}] リプライを処理: ${event.pubkey.slice(0, 8)}... -> ${event.content.slice(0, 50)}...`);
        
        // イベントの署名検証を実行
        const isValid = verifyEvent(event);
        
        if (isValid) {
          await handleReply(event, privateKey, userData);
          // 各リプライ処理の間に短い待機時間を追加（WebSocket接続の競合を避けるため）
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          console.log('署名検証に失敗したため、このイベントをスキップします');
        }
      }
      
      console.log(`${processedCount}件のイベント処理完了`);
    }

    // 現在の日時記録
    const now = Math.floor(Date.now() / 1000);
    await saveLastSince(now);
    console.log('=== 許諾リスト整理完了 ===');
    
  } catch (error) {
    console.error('処理中にエラーが発生しました:', error);
  }
}; 