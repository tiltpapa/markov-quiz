import Markov from 'markov-strings';

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