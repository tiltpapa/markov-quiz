<script lang="ts">
  import { onMount } from 'svelte';
  import type { QuizData } from '../../lib/types.ts';
  import type { QuizAttempt } from '../../lib/storage';
  import { quizStorage } from '../../lib/storage';
  import EmojiText from './EmojiText.svelte';
  import { SimplePool, type EventTemplate } from 'nostr-tools';

  export let quiz: QuizData;

  let selectedAnswer = '';
  let showCorrectResult = false;
  let showIncorrectResult = false;
  let userAnswers: { [key: string]: string } = {};
  let quizAttempt: QuizAttempt | null = null;
  let quizId = '';
  let isSharing = false;

//  const dispatch = createEventDispatcher();

  onMount(async () => {
    quizId = quizStorage.generateQuizId(quiz);
    quizAttempt = await quizStorage.getQuizAttempt(quizId);
    
    // 既に正解済みまたはリタイヤ済みの場合は適切な表示状態を設定
    if (quizAttempt) {
      if (quizAttempt.correct) {
        // 正解済みの場合：正解結果を表示し、最後の正解した回答を設定
        showCorrectResult = true;
        selectedAnswer = quizAttempt.answers.find(answer => isCorrectAnswer(answer)) || '';
      } else if (quizAttempt.retired) {
        // リタイヤ済みの場合：答えを表示
        showCorrectResult = true;
        selectedAnswer = ''; // リタイヤした場合は回答を空にする
      }
      // 不正解しただけでリタイヤしていない場合は、通常通り回答欄を表示
    }
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja', { timeZone: 'JST' });
  };

  const submitAnswer = async () => {
    if (!selectedAnswer.trim()) {
      alert('回答を入力してください');
      return;
    }
    
    const isCorrect = isCorrectAnswer(selectedAnswer);
    quizAttempt = await quizStorage.recordAnswer(quizId, selectedAnswer, isCorrect);
    userAnswers[quiz.userInfo.id] = selectedAnswer;
    
    if (isCorrect) {
      showCorrectResult = true;
    } else {
      showIncorrectResult = true;
    }
  };

  const resetQuiz = () => {
    selectedAnswer = '';
    showCorrectResult = false;
    showIncorrectResult = false;
    // dispatch('reset');
  };

  const retryQuiz = () => {
    selectedAnswer = '';
    showIncorrectResult = false;
  };

  const giveUpQuiz = async () => {
    quizAttempt = await quizStorage.recordRetire(quizId);
    showIncorrectResult = false;
    showCorrectResult = true;
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

  const createShareText = (): string => {
    const createdDate = formatDate(quiz.createdAt);
    const attempts = quizAttempt?.attempts || 1;
    const result = quizAttempt?.correct ? '正解しました！' : 'リタイヤしました';
    
    return `markov-quiz
${createdDate}作成の問題
${attempts}回目で${result}

https://tiltpapa.github.io/markov-quiz/
#markov_quiz`;
  };

  const copyToClipboard = async () => {
    try {
      const shareText = createShareText();
      await navigator.clipboard.writeText(shareText);
      alert('投稿内容をクリップボードにコピーしました！');
    } catch (err) {
      alert('クリップボードへのコピーに失敗しました');
    }
  };

  const shareToNostr = async () => {
    if (isSharing) return;
    isSharing = true;
    
    try {
      // NIP-07の存在確認
      if (!window.nostr) {
        alert('Nostr拡張機能が見つかりません。クリップボードにコピーしました。');
        await copyToClipboard();
        return;
      }

      const shareText = createShareText();
      const pubkey = await window.nostr.getPublicKey();
      
      const event: EventTemplate = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["t", "markov_quiz"]],
        content: shareText,
      };

      const signedEvent = await window.nostr.signEvent(event);
      
      // リレーに投稿
      const pool = new SimplePool();
      const relays = [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay-jp.nostr.wirednet.jp',
        'wss://yabu.me'
      ];
      
      await Promise.all(pool.publish(relays, signedEvent));
      pool.close(relays);
      
      alert('Nostrに投稿しました！');
      
    } catch (error) {
      console.error('Nostr投稿エラー:', error);
      alert('投稿に失敗しました。クリップボードにコピーしました。');
      await copyToClipboard();
    } finally {
      isSharing = false;
    }
  };
</script>

<div class="card bg-white bg-opacity-95 shadow-lg mb-4">
  <div class="card-header text-center bg-primary bg-opacity-10 border-bottom border-primary border-opacity-25">
    <h2 class="h4 text-dark mb-2">問題</h2>
    <p class="text-muted small mb-0">作成日時: {formatDate(quiz.createdAt)}</p>
  </div>

  <div class="card-body">
<!--
    <div class="alert alert-info border-start border-primary border-4 bg-primary bg-opacity-10 mb-4">
      <p class="fw-semibold mb-0">次の文章はどのユーザーの投稿から生成されたでしょうか？</p>
    </div>
-->
    
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

    <div class="bg-light border border-light rounded p-4 mb-4">
      <b>ヒント</b> 実装予定
    </div>

    {#if !showCorrectResult && !showIncorrectResult}
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
    {:else if showIncorrectResult}
      <div class="border border-warning border-2 rounded p-4 bg-warning bg-opacity-10">
        <h3 class="h5 text-warning mb-4">不正解</h3>
        
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="card-title text-dark mb-2">あなたの回答: <span class="fw-normal">{selectedAnswer}</span></h6>
            <div class="text-danger fw-semibold mb-2">残念！</div>
            {#if quizAttempt}
              <div class="text-muted small">挑戦回数: {quizAttempt.attempts}回</div>
            {/if}
          </div>
        </div>

        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-primary" on:click={retryQuiz}>
            もう一度挑戦
          </button>
          <button class="btn btn-secondary" on:click={giveUpQuiz}>
            リタイヤして答えを見る
          </button>
<!--      
          <button class="btn btn-outline-primary" on:click={resetQuiz}>
            新しいクイズを読み込む
          </button>
-->
        </div>
      </div>
    {:else if showCorrectResult}
      <div class="border border-success border-2 rounded p-4 bg-success bg-opacity-10">
        <h3 class="h5 text-success mb-4">回答結果</h3>
        
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="card-title text-dark mb-3">正解: 
              {#if quiz.userInfo.display_name || quiz.userInfo.name}
                  {quiz.userInfo.display_name || quiz.userInfo.name}
              {/if}
            </h6>
            <p class="text-muted small mb-0">{quiz.userInfo.npub}</p>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h6 class="card-title text-dark mb-2">あなたの回答: <span class="fw-normal">{selectedAnswer}</span></h6>
            <div class="fw-semibold">
              {#if selectedAnswer && isCorrectAnswer(selectedAnswer)}
                <div class="text-success">正解です！おめでとうございます！</div>
              {:else}
                <div class="text-danger">残念！正解は上記のユーザーでした。</div>
              {/if}
            </div>
            {#if quizAttempt && quizAttempt.attempts > 0}
              <div class="text-muted small mt-2">
                {#if quizAttempt.correct}
                  {quizAttempt.attempts}回目で正解！
                {:else if quizAttempt.retired}
                  {quizAttempt.attempts}回挑戦してリタイヤ
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <div class="d-flex flex-wrap gap-2 mb-3">
          <button 
            class="btn btn-primary"
            on:click={shareToNostr}
            disabled={isSharing}
          >
            {#if isSharing}
              投稿中...
            {:else}
              Nostrでシェア
            {/if}
          </button>
          
          <button 
            class="btn btn-outline-primary"
            on:click={copyToClipboard}
          >
            コピー
          </button>
          
          <a 
            href={`https://njump.me/${quiz.userInfo.npub}`} 
            target="_blank" 
            rel="noopener"
            class="btn btn-success"
          >
            プロフィールを見る
          </a>
        </div>
      </div>
    {/if}

    <div class="bg-light border border-light rounded p-4 mt-4">
      <b>過去問</b> 実装予定
    </div>
  </div>
</div>

 