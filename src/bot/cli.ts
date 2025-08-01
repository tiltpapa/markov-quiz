import { Command } from 'commander';
import { generateQuizForBot } from './generate.js';
import { listenReplies } from './listen.js';
import { fetchUsersInfo } from './fetch-users-info.js';

const program = new Command();

program
  .name('markov-quiz-bot')
  .description('Nostr マルコフ連鎖クイズBot')
  .version('1.0.0');

program
  .command('generate')
  .description('クイズを生成してWebサイト用のJSONファイルを作成')
  .action(async () => {
    try {
      await generateQuizForBot();
      console.log('✅ クイズ生成が完了しました');
      process.exit(0);
    } catch (error) {
      console.error('❌ クイズ生成でエラーが発生しました:', error);
      process.exit(1);
    }
  });

program
  .command('listen')
  .description('リプライをリスニングして許諾リストを管理する')
  .action(async () => {
    try {
      await listenReplies();
      console.log('✅ リプライ監視が完了しました');
      process.exit(0);
    } catch (error) {
      console.error('❌ リプライ監視でエラーが発生しました:', error);
      process.exit(1);
    }
  });

program
  .command('fetch-users')
  .description('許諾リストのユーザーのプロフィール情報を取得する')
  .action(async () => {
    try {
      await fetchUsersInfo();
      console.log('✅ ユーザー情報取得が完了しました');
      process.exit(0);
    } catch (error) {
      console.error('❌ ユーザー情報取得でエラーが発生しました:', error);
      process.exit(1);
    }
  });

// エラーハンドリング
program.configureOutput({
  writeErr: (str) => console.error(str)
});

program.exitOverride((err) => {
  if (err.code === 'commander.help' || err.code === 'commander.version') {
    process.exit(0);
  }
  process.exit(1);
});

if (process.argv.length <= 2) {
  program.help();
} else {
  program.parse();
} 