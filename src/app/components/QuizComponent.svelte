<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { QuizData } from '../../lib/types.ts';

  export let quiz: QuizData;

  let selectedAnswer = '';
  let showResult = false;
  let userAnswers: { [key: string]: string } = {};

  const dispatch = createEventDispatcher();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja');
  };

  const submitAnswer = () => {
    if (!selectedAnswer.trim()) {
      alert('回答を入力してください');
      return;
    }
    
    showResult = true;
    userAnswers[quiz.correctUserId] = selectedAnswer;
  };

  const resetQuiz = () => {
    selectedAnswer = '';
    showResult = false;
    dispatch('reset');
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(quiz.correctUserId);
    alert('ユーザーIDをコピーしました！');
  };
</script>

<div class="card bg-white bg-opacity-95 shadow-lg mb-4">
  <div class="card-header text-center bg-primary bg-opacity-10 border-bottom border-primary border-opacity-25">
    <h2 class="h4 text-dark mb-2">📝 クイズ問題</h2>
    <p class="text-muted small mb-0">作成日時: {formatDate(quiz.createdAt)}</p>
  </div>

  <div class="card-body">
    <div class="alert alert-info border-start border-primary border-4 bg-primary bg-opacity-10 mb-4">
      <p class="fw-semibold mb-0">次の文章はどのユーザーの投稿から生成されたでしょうか？</p>
    </div>
    
    <div class="mb-4">
      {#each quiz.questions as question, index}
        <div class="card bg-light border-0 mb-3">
          <div class="card-body py-3">
            <div class="d-flex">
              <span class="badge bg-primary me-3 mt-1 flex-shrink-0">{index + 1}</span>
              <div class="flex-grow-1 lh-base">{question}</div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if !showResult}
      <div class="bg-light border border-light-subtle rounded p-4">
        <label for="answer" class="form-label fw-semibold text-dark mb-3">あなたの回答:</label>
        <div class="input-group mb-3">
          <input 
            id="answer"
            type="text" 
            class="form-control form-control-lg"
            bind:value={selectedAnswer}
            placeholder="ユーザー名やpubkeyを入力してください"
            on:keydown={(e) => e.key === 'Enter' && submitAnswer()}
          />
          <button 
            class="btn btn-primary btn-lg px-4" 
            type="button"
            on:click={submitAnswer} 
            disabled={!selectedAnswer.trim()}
          >
            回答する
          </button>
        </div>
        <div class="text-muted small">
          💡 ヒント: Nostrのユーザー名やpubkeyで回答してください
        </div>
      </div>
    {:else}
      <div class="border border-success border-2 rounded p-4 bg-success bg-opacity-10">
        <h3 class="h5 text-success mb-4">🎉 回答結果</h3>
        
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="card-title text-dark mb-3">正解:</h6>
                         <div class="d-flex align-items-center gap-2 mb-2">
               <button 
                 class="flex-grow-1 bg-light p-2 rounded border user-select-all text-break btn text-start"
                 style="font-family: monospace; word-break: break-all;"
                 on:click={copyUserId}
               >
                 {quiz.correctUserId}
               </button>
              <button 
                class="btn btn-outline-primary btn-sm" 
                on:click={copyUserId} 
                title="コピー"
              >
                📋
              </button>
            </div>
            {#if quiz.userDisplayName}
              <p class="text-muted fst-italic small mb-0">表示名: {quiz.userDisplayName}</p>
            {/if}
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h6 class="card-title text-dark mb-2">あなたの回答: <span class="fw-normal">{selectedAnswer}</span></h6>
            <div class="fw-semibold">
              {#if selectedAnswer.toLowerCase().includes(quiz.correctUserId.toLowerCase()) || 
                   (quiz.userDisplayName && selectedAnswer.toLowerCase().includes(quiz.userDisplayName.toLowerCase()))}
                <div class="text-success">✅ 正解です！おめでとうございます！</div>
              {:else}
                <div class="text-danger">❌ 残念！正解は上記のユーザーでした。</div>
              {/if}
            </div>
          </div>
        </div>

        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-primary" on:click={resetQuiz}>
            新しいクイズを読み込む
          </button>
          
          <a 
            href={`https://iris.to/${quiz.correctUserId}`} 
            target="_blank" 
            rel="noopener"
            class="btn btn-success"
          >
            📱 プロフィールを見る
          </a>
        </div>
      </div>
    {/if}

    {#if quiz.emojiTags && quiz.emojiTags.length > 0}
      <div class="mt-4 p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded">
        <h6 class="text-warning-emphasis mb-3">🎨 使用されているカスタム絵文字</h6>
        <div class="d-flex flex-wrap gap-2">
          {#each quiz.emojiTags as tag}
            <span class="badge bg-warning text-dark">:{tag[1]}:</span>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

 