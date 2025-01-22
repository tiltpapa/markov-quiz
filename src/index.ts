import { Command } from 'commander';
import manageList from './manageList';
import generateQuiz from './generateQuiz';
import announceAnswer from './announceAnswer';
import listenReplies from './listenReplies';

const program = new Command();

program
  .command('generate')
  .description('クイズを生成する')
  .action(() => {
    generateQuiz();
  });

program
  .command('announce')
  .description('正解を発表する')
  .action(() => {
    announceAnswer();
  });

program
  .command('listen')
  .description('リプライをリスニングして許諾リストを管理する')
  .action(() => {
    listenReplies();
  });

program.parse(process.argv);