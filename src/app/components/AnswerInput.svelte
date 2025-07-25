<script lang="ts">
  import type { QuizData, UserInfo } from '../../lib/types.ts';
  import type { QuizAttempt } from '../../lib/storage';
  import allowedUsersInfo from '../../data/allowedUsersInfo.json';

  export let quiz: QuizData;
  export let quizAttempt: QuizAttempt | null;
  export let selectedAnswer: string;
  export let onSubmit: () => void;

  const suggestionData = Object.values(allowedUsersInfo.usersInfo).map((user: UserInfo) => ({
    value: user.id,
    label: `${user.display_name || user.name || 'Unknown'} @${user.name || ''}`,
    html: `<img src="${user.picture || ''}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" onerror="this.style.display='none'" /><span>${user.display_name || user.name || 'Unknown'} @${user.name || ''}</span>`
  }));
</script>

<div class="bg-light border border-light-subtle rounded p-4">
  <label for="answer" class="form-label fw-semibold text-dark mb-3">回答欄</label>
  {#if quizAttempt && quizAttempt.attempts > 0}
    <div class="alert alert-info mb-3">
      挑戦回数: {quizAttempt.attempts}回
    </div>
  {/if}
  <div class="input-group mb-3">
    <input 
      id="answer"
      type="text" 
      class="form-control form-control-lg"
      bind:value={selectedAnswer}
      on:keydown={(e) => e.key === 'Enter' && onSubmit()}
    />
    <button 
      class="btn btn-primary btn-lg px-4" 
      type="button"
      on:click={onSubmit} 
      disabled={!selectedAnswer.trim()}
    >
      こいつだ！
    </button>
  </div>
  <div class="text-muted small">
    回答フォーマット: 
    {#if quiz.userInfo.name}name, {/if}
    {#if quiz.userInfo.display_name}display_name, {/if}
    公開鍵(npub, hex)
  </div>
  {#if !quiz.userInfo.name && !quiz.userInfo.display_name}
    <div class="text-warning small mt-1">
      プロフィール情報の取得に失敗しました
    </div>
  {/if}
</div> 