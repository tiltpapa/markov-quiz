import { MarkovChain } from 'kurwov';

export const generateSentence = (markov: MarkovChain, maxTries = 100): string => {
  try {
    const result = markov.generate();
    return result || '';
  } catch (error) {
    console.error('マルコフ生成エラー:', error);
    return '';
  }
}; 