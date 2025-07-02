export interface QuizAttempt {
  quizId: string;
  attempts: number;
  correct: boolean;
  retired: boolean;
  lastAttemptAt: number;
  answers: string[];
}

export interface QuizHistory {
  [quizId: string]: QuizAttempt;
}

const DB_NAME = 'MarkovQuizDB';
const DB_VERSION = 1;
const STORE_NAME = 'quizHistory';

class QuizStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'quizId' });
        }
      };
    });
  }

  async getQuizAttempt(quizId: string): Promise<QuizAttempt | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(quizId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(attempt);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async recordAnswer(quizId: string, answer: string, isCorrect: boolean): Promise<QuizAttempt> {
    const existing = await this.getQuizAttempt(quizId);
    
    const attempt: QuizAttempt = existing || {
      quizId,
      attempts: 0,
      correct: false,
      retired: false,
      lastAttemptAt: 0,
      answers: []
    };

    attempt.attempts++;
    attempt.answers.push(answer);
    attempt.lastAttemptAt = Date.now();
    
    if (isCorrect) {
      attempt.correct = true;
    }

    await this.saveQuizAttempt(attempt);
    return attempt;
  }

  async recordRetire(quizId: string): Promise<QuizAttempt> {
    const existing = await this.getQuizAttempt(quizId);
    
    const attempt: QuizAttempt = existing || {
      quizId,
      attempts: 0,
      correct: false,
      retired: false,
      lastAttemptAt: 0,
      answers: []
    };

    attempt.retired = true;
    attempt.lastAttemptAt = Date.now();

    await this.saveQuizAttempt(attempt);
    return attempt;
  }

  generateQuizId(quiz: any): string {
    // createdAtをそのままIDとして使用
    return quiz.createdAt.toString();
  }
}

export const quizStorage = new QuizStorage(); 