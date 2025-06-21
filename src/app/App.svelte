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
          <button class="btn btn-primary" on:click={loadQuiz}>再読み込み</button>
        </div>
      </div>
    {:else if currentQuiz}
      <QuizComponent quiz={currentQuiz} />
    {:else}
      <div class="card bg-white bg-opacity-90 shadow">
        <div class="card-body text-center py-5">
          <h5 class="mb-3">📝 クイズが見つかりません</h5>
          <button class="btn btn-primary" on:click={loadQuiz}>再読み込み</button>
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
            <div class="d-flex flex-wrap justify-content-center gap-2">
              <a href="./data/allowedUsers.json" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">
                📋 許可ユーザーリスト
              </a>
              <a href="./data/lastSince.json" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">
                🕒 最終同期情報
              </a>
              <a href="./data/quiz.json" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">
                🎯 クイズデータ
              </a>
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