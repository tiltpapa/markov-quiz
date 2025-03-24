export * from './types.ts';
export * from './utils.ts';
export * from './markov.ts';

import { Command } from 'commander';
import generateQuiz from './generateQuiz.ts';
import announceAnswer from './announceAnswer.ts';
import listenReplies from './listenReplies.ts';

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

program.parse(Deno.args);