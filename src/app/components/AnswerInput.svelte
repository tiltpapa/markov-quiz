<script lang="ts">
  import type { QuizData, UserInfo } from '../../lib/types.ts';
  import type { QuizAttempt } from '../../lib/storage';
  import autoComplete from "@tarekraafat/autocomplete.js";
  import allowedUsersInfo from '../../data/allowedUsersInfo.json';
  import { onMount } from 'svelte';

  export let quiz: QuizData;
  export let quizAttempt: QuizAttempt | null;
  export let selectedAnswer: string;
  export let onSubmit: () => void;

  const suggestionData = Object.values(allowedUsersInfo.usersInfo).map((user: UserInfo) => ({
    value: user.npub,
    name: `${user.display_name || user.name || ''} @${user.name || user.npub}`,
    picture: user.picture || '',
//    html: `<img src="${user.picture || ''}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" onerror="this.style.display='none'" /><span>${user.display_name || user.name || 'Unknown'} @${user.name || ''}</span>`
  }));

  
  onMount(() => {
      const autoCompleteJS = new autoComplete({
        selector: '#answer',
        placeHolder: "Guess the user...",
        threshold: 0,
        data: {
            src: suggestionData,
            keys: ['name'],
            cache: true,
        },
        resultsList: {
            class: "autoComplete_list",
            maxResults: undefined,
        },
        resultItem: {
            class: "autoComplete_result",
            element: (item, data) => {
                item.innerHTML = `<img src="${data.value.picture || ''}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" onerror="this.style.display='none'" /><span>${data.value.name}</span>`;
                return item;
            },
            highlight: true
        },
        events: {
            input: {
                focus: () => {
                    autoCompleteJS.start();
                },
                selection: (event) => {
                    console.log(event);
                    const selection = event.detail.selection.value;
                    selectedAnswer = selection.value;
                }
            }
        }
        });
  });
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

<style>
  #answer {
    background-image: none;
    padding: 0.5rem 1rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem 0 0 0.375rem;
    font-size: 1.25rem;
    color: #212529;
    background-color: #fff;
    /* 最小幅を設定して縮小可能にする */
    min-width: 120px;
    flex-shrink: 1;
  }

  /* autocompleteライブラリのモバイル用幅固定を無効化 */
  :global(.autoComplete_wrapper > input) {
    width: 100% !important;
  }

  /* input-group内でのレスポンシブ対応 */
  .input-group .autoComplete_wrapper {
    flex: 1 1 auto;
    display: flex;
  }

  .input-group .autoComplete_wrapper > input {
    flex: 1 1 auto;
    width: 100% !important;
  }

  /* input-groupの折り返し防止とサイズ調整 */
  .input-group {
    flex-wrap: nowrap !important;
    min-width: 0;
  }

  /* ボタンの最小幅と縮小設定 */
  .input-group .btn {
    min-width: 80px;
    flex-shrink: 0;
    white-space: nowrap;
  }
</style>