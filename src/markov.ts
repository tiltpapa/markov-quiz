import Markov from 'markov-strings';
/*
export const buildMarkovChain = (texts: string[]): Markov.MarkovChain => {
  const markov = new Markov(texts, { stateSize: 2 });
  markov.buildCorpus();
  return markov;
};
*/
export const generateSentence = (markov: Markov, maxTries = 100): string => {
  try {
    const result = markov.generate({
      maxTries,
      filter: (result) => result.string.split(' ').length >= 3
    });
    return result.string;
  } catch (error) {
    console.error('マルコフ生成エラー:', error);
    return '';
  }
};