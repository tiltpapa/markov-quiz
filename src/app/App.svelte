<script lang="ts">
  import { onMount } from 'svelte';
  import QuizComponent from './components/QuizComponent.svelte';
  import type { QuizData } from '../lib/types.ts';

  let currentQuiz: QuizData | null = null;
  let loading = true;
  let error = '';
  let lastSyncInfo: any = null;
  let allowedUsersCount = 0;

  const loadQuiz = async () => {
    try {
      loading = true;
      error = '';
      
      // GitHub Pagesから最新のクイズデータを取得
      const response = await fetch('./data/quiz.json');
      if (!response.ok) {
        throw new Error('クイズデータの取得に失敗しました');
      }
      
      const quizData = await response.json();
      currentQuiz = quizData;
    } catch (err) {
      error = err instanceof Error ? err.message : 'エラーが発生しました';
      console.error('クイズ読み込みエラー:', err);
    } finally {
      loading = false;
    }
  };

  const loadSystemInfo = async () => {
    try {
      // 最終同期情報を取得
      const lastSyncResponse = await fetch('./data/lastSince.json');
      if (lastSyncResponse.ok) {
        lastSyncInfo = await lastSyncResponse.json();
      }

      // 許可ユーザー数を取得
      const allowedUsersResponse = await fetch('./data/allowedUsers.json');
      if (allowedUsersResponse.ok) {
        const allowedUsers = await allowedUsersResponse.json();
        allowedUsersCount = Object.keys(allowedUsers).length;
      }
    } catch (err) {
      console.error('システム情報読み込みエラー:', err);
    }
  };

  onMount(() => {
    loadQuiz();
    loadSystemInfo();
  });
</script>

<main class="container">
  <header>
    <h1>🎯 Nostr マルコフ連鎖クイズ</h1>
    <p>マルコフ連鎖で生成された文章から、元のユーザーを当ててみよう！</p>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>クイズを読み込み中...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>❌ {error}</p>
      <button on:click={loadQuiz}>再読み込み</button>
    </div>
  {:else if currentQuiz}
    <QuizComponent quiz={currentQuiz} />
  {:else}
    <div class="no-quiz">
      <p>📝 クイズが見つかりません</p>
      <button on:click={loadQuiz}>再読み込み</button>
    </div>
  {/if}

  <footer>
    <div class="main-links">
      <p>
        <a href="https://github.com/tiltpapa/markov-quiz" target="_blank" rel="noopener">
          GitHub でソースコードを見る
        </a>
      </p>
      <p class="note">
        このクイズはNostr上のユーザーの投稿をマルコフ連鎖で解析して作成されています。<br>
        参加を希望される場合は、botに「OK」とリプライしてください。
      </p>
    </div>
    
    <div class="system-info">
      <h4>📊 システム情報</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">参加ユーザー数:</span>
          <span class="value">{allowedUsersCount}人</span>
        </div>
        {#if lastSyncInfo}
          <div class="info-item">
            <span class="label">最終更新:</span>
            <span class="value">{new Date(lastSyncInfo.lastUpdate).toLocaleString('ja')}</span>
          </div>
        {/if}
      </div>
      <div class="data-links">
        <a href="./data/allowedUsers.json" target="_blank" rel="noopener">📋 許可ユーザーリスト</a>
        <a href="./data/lastSince.json" target="_blank" rel="noopener">🕒 最終同期情報</a>
        <a href="./data/quiz.json" target="_blank" rel="noopener">🎯 クイズデータ</a>
      </div>
    </div>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  header {
    text-align: center;
    margin-bottom: 30px;
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  header h1 {
    margin: 0 0 10px 0;
    color: #4a5568;
    font-size: 2.5rem;
  }

  header p {
    margin: 0;
    color: #666;
    font-size: 1.1rem;
  }

  .loading, .error, .no-quiz {
    text-align: center;
    background: rgba(255, 255, 255, 0.9);
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    color: #e53e3e;
  }

  .error button, .no-quiz button {
    background: #667eea;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
    font-size: 1rem;
  }

  .error button:hover, .no-quiz button:hover {
    background: #5a67d8;
  }

  footer {
    text-align: center;
    margin-top: 40px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 10px;
  }

  .main-links a {
    color: #667eea;
    text-decoration: none;
  }

  .main-links a:hover {
    text-decoration: underline;
  }

  .note {
    font-size: 0.9rem;
    color: #666;
    margin-top: 10px;
  }

  .system-info {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
  }

  .system-info h4 {
    color: #4a5568;
    margin: 0 0 12px 0;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f7fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }

  .label {
    color: #4a5568;
    font-weight: 500;
  }

  .value {
    color: #2d3748;
    font-weight: 600;
  }

  .data-links {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .data-links a {
    background: #f0f4f8;
    color: #4a5568;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 0.85rem;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
  }

  .data-links a:hover {
    background: #e2e8f0;
    color: #2d3748;
  }

  @media (max-width: 600px) {
    .container {
      padding: 10px;
    }
    
    header h1 {
      font-size: 2rem;
    }
    
    header p {
      font-size: 1rem;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .data-links {
      flex-direction: column;
      align-items: center;
    }
  }
</style> 