<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { QuizData } from '../../lib/types.ts';
  import EmojiText from './EmojiText.svelte';

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
    userAnswers[quiz.userInfo.id] = selectedAnswer;
  };

  const resetQuiz = () => {
    selectedAnswer = '';
    showResult = false;
    dispatch('reset');
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(quiz.userInfo.id);
    alert('ユーザーIDをコピーしました！');
  };

  const isCorrectAnswer = (answer: string): boolean => {
    const lowerAnswer = answer.toLowerCase();
    const { id, npub, name, display_name } = quiz.userInfo;
    
    return (
      lowerAnswer.includes(id.toLowerCase()) ||
      lowerAnswer.includes(npub.toLowerCase()) ||
      (name && lowerAnswer.includes(name.toLowerCase())) ||
      (display_name && lowerAnswer.includes(display_name.toLowerCase()))
    );
  };
</script>

<div class="card bg-white bg-opacity-95 shadow-lg mb-4">
  <div class="card-header text-center bg-primary bg-opacity-10 border-bottom border-primary border-opacity-25">
    <h2 class="h4 text-dark mb-2">問題</h2>
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
            <div class="d-flex align-items-center">
              <span class="badge bg-primary me-3 mt-1 d-flex align-items-center justify-content-center" style="height: 100%;">{index + 1}</span>
              <div class="flex-grow-1 lh-base">
                <EmojiText text={question} emojiTags={quiz.emojiTags} />
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if !showResult}
      <div class="bg-light border border-light-subtle rounded p-4">
        <label for="answer" class="form-label fw-semibold text-dark mb-3">Answer</label>
        <div class="input-group mb-3">
          <input 
            id="answer"
            type="text" 
            class="form-control form-control-lg"
            bind:value={selectedAnswer}
            placeholder="ユーザー名やnpubを入力してください"
            on:keydown={(e) => e.key === 'Enter' && submitAnswer()}
          />
          <button 
            class="btn btn-primary btn-lg px-4" 
            type="button"
            on:click={submitAnswer} 
            disabled={!selectedAnswer.trim()}
          >
            こいつだ！
          </button>
        </div>
        <div class="text-muted small">
          回答フォーマット: name, display_name, 公開鍵(npub, hex)
        </div>
      </div>
    {:else}
      <div class="border border-success border-2 rounded p-4 bg-success bg-opacity-10">
        <h3 class="h5 text-success mb-4">🎉 回答結果</h3>
        
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="card-title text-dark mb-3">正解:</h6>
            {#if quiz.userInfo.display_name || quiz.userInfo.name}
              <p class="h6 text-primary mb-2">
                {quiz.userInfo.display_name || quiz.userInfo.name}
              </p>
            {/if}
            <div class="d-flex align-items-center gap-2 mb-2">
              <button 
                class="flex-grow-1 bg-light p-2 rounded border user-select-all text-break btn text-start"
                style="font-family: monospace; word-break: break-all;"
                on:click={copyUserId}
              >
                {quiz.userInfo.id}
              </button>
              <button 
                class="btn btn-outline-primary btn-sm" 
                on:click={copyUserId} 
                title="コピー"
              >
              📋
              </button>
            </div>
            <p class="text-muted small mb-0">npub: {quiz.userInfo.npub}</p>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h6 class="card-title text-dark mb-2">あなたの回答: <span class="fw-normal">{selectedAnswer}</span></h6>
            <div class="fw-semibold">
              {#if isCorrectAnswer(selectedAnswer)}
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
            href={`https://iris.to/${quiz.userInfo.id}`} 
            target="_blank" 
            rel="noopener"
            class="btn btn-success"
          >
            📱 プロフィールを見る
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>

 