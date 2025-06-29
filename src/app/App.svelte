<script lang="ts">
  import { onMount } from 'svelte';
  import QuizComponent from './components/QuizComponent.svelte';
  import type { QuizData } from '../lib/types.ts';
  
  // 静的データを直接import
  import quizData from '../data/quiz.json';
  import lastSinceData from '../data/lastSince.json';
  import allowedUsersData from '../data/allowedUsers.json';

  let currentQuiz: QuizData | null = null;
  let loading = true;
  let error = '';
  let lastSyncInfo: any = null;
  let allowedUsersCount = 0;

  const loadData = () => {
    try {
      loading = true;
      error = '';
      
      // インポートしたデータを直接使用
      currentQuiz = quizData;
      lastSyncInfo = lastSinceData;
      allowedUsersCount = Object.keys(allowedUsersData).length;
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'データの読み込みに失敗しました';
      console.error('データ読み込みエラー:', err);
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    loadData();
  });
</script>

<div class="min-vh-100 gradient-bg">
  <div class="container py-4">
    <header class="text-center mb-4">
      <div class="card bg-white bg-opacity-90 shadow">
        <div class="card-body py-4">
          <h1 class="display-4 text-primary mb-3">🎯 Nostr マルコフ連鎖クイズ</h1>
          <p class="lead text-muted mb-0">マルコフ連鎖で生成された文章から、元のユーザーを当ててみよう！</p>
        </div>
      </div>
    </header>

    {#if loading}
      <div class="card bg-white bg-opacity-90 shadow">
        <div class="card-body text-center py-5">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">読み込み中...</span>
          </div>
          <p class="mb-0">クイズを読み込み中...</p>
        </div>
      </div>
    {:else if error}
      <div class="card bg-white bg-opacity-90 shadow">
        <div class="card-body text-center py-5">
          <div class="text-danger mb-3">
            <h5>❌ {error}</h5>
          </div>
          <button class="btn btn-primary" on:click={loadData}>再読み込み</button>
        </div>
      </div>
    {:else if currentQuiz}
      <QuizComponent quiz={currentQuiz} />
    {:else}
      <div class="card bg-white bg-opacity-90 shadow">
        <div class="card-body text-center py-5">
          <h5 class="mb-3">📝 クイズが見つかりません</h5>
          <button class="btn btn-primary" on:click={loadData}>再読み込み</button>
        </div>
      </div>
    {/if}

    <footer class="mt-5">
      <div class="card bg-white bg-opacity-75 shadow-sm">
        <div class="card-body text-center">
          <div class="mb-4">
            <p class="mb-2">
              <a href="https://github.com/tiltpapa/markov-quiz" target="_blank" rel="noopener" class="text-decoration-none">
                GitHub でソースコードを見る
              </a>
            </p>
            <p class="text-muted small mb-0">
              このクイズはNostr上のユーザーの投稿をマルコフ連鎖で解析して作成されています。<br>
              参加を希望される場合は、botに「OK」とリプライしてください。
            </p>
          </div>
          
          <div class="border-top pt-4">
            <h6 class="text-primary mb-3">📊 システム情報</h6>
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <div class="card bg-light border">
                  <div class="card-body py-2 d-flex justify-content-between align-items-center">
                    <span class="fw-medium text-secondary">参加ユーザー数:</span>
                    <span class="fw-bold text-dark">{allowedUsersCount}人</span>
                  </div>
                </div>
              </div>
              {#if lastSyncInfo}
                <div class="col-md-6">
                  <div class="card bg-light border">
                    <div class="card-body py-2 d-flex justify-content-between align-items-center">
                      <span class="fw-medium text-secondary">最終更新:</span>
                      <span class="fw-bold text-dark small">{new Date(lastSyncInfo.lastUpdate).toLocaleString('ja')}</span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
            <div class="text-center">
              <p class="text-muted small mb-0">
                データファイルはアプリケーション内に統合されています
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  /* Bootstrapのコンテナの最大幅をカスタマイズ */
  .container {
    max-width: 800px;
  }
</style> 