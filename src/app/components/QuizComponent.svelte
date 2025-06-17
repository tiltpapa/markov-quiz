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

<div class="quiz-container">
  <div class="quiz-header">
    <h2>📝 クイズ問題</h2>
    <p class="quiz-date">作成日時: {formatDate(quiz.createdAt)}</p>
  </div>

  <div class="questions">
    <p class="instruction">次の文章はどのユーザーの投稿から生成されたでしょうか？</p>
    
    <div class="question-list">
      {#each quiz.questions as question, index}
        <div class="question-item">
          <span class="question-number">{index + 1}.</span>
          <div class="question-text">{question}</div>
        </div>
      {/each}
    </div>
  </div>

  {#if !showResult}
    <div class="answer-section">
      <label for="answer">あなたの回答:</label>
      <div class="input-group">
        <input 
          id="answer"
          type="text" 
          bind:value={selectedAnswer}
          placeholder="ユーザー名やpubkeyを入力してください"
          on:keydown={(e) => e.key === 'Enter' && submitAnswer()}
        />
        <button on:click={submitAnswer} disabled={!selectedAnswer.trim()}>
          回答する
        </button>
      </div>
      <p class="hint">💡 ヒント: Nostrのユーザー名やpubkeyで回答してください</p>
    </div>
  {:else}
    <div class="result-section">
      <h3>🎉 回答結果</h3>
      
      <div class="correct-answer">
        <p><strong>正解:</strong></p>
        <div class="user-info">
          <code class="pubkey" on:click={copyUserId}>
            {quiz.correctUserId}
          </code>
          <button class="copy-btn" on:click={copyUserId} title="コピー">📋</button>
        </div>
        {#if quiz.userDisplayName}
          <p class="display-name">表示名: {quiz.userDisplayName}</p>
        {/if}
      </div>

      <div class="your-answer">
        <p><strong>あなたの回答:</strong> {selectedAnswer}</p>
        <p class="result-text">
          {#if selectedAnswer.toLowerCase().includes(quiz.correctUserId.toLowerCase()) || 
               (quiz.userDisplayName && selectedAnswer.toLowerCase().includes(quiz.userDisplayName.toLowerCase()))}
            ✅ 正解です！おめでとうございます！
          {:else}
            ❌ 残念！正解は上記のユーザーでした。
          {/if}
        </p>
      </div>

      <div class="actions">
        <button class="primary" on:click={resetQuiz}>
          新しいクイズを読み込む
        </button>
        
        <a 
          href={`https://iris.to/${quiz.correctUserId}`} 
          target="_blank" 
          rel="noopener"
          class="profile-link"
        >
          📱 プロフィールを見る
        </a>
      </div>
    </div>
  {/if}

  {#if quiz.emojiTags && quiz.emojiTags.length > 0}
    <div class="emoji-section">
      <h4>🎨 使用されているカスタム絵文字</h4>
      <div class="emoji-list">
        {#each quiz.emojiTags as tag}
          <span class="emoji-tag">:{tag[1]}:</span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .quiz-container {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }

  .quiz-header {
    text-align: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e2e8f0;
  }

  .quiz-header h2 {
    color: #2d3748;
    margin: 0 0 8px 0;
    font-size: 1.8rem;
  }

  .quiz-date {
    color: #718096;
    font-size: 0.9rem;
    margin: 0;
  }

  .instruction {
    font-size: 1.1rem;
    color: #4a5568;
    text-align: center;
    margin-bottom: 20px;
    padding: 12px;
    background: #f7fafc;
    border-radius: 8px;
    border-left: 4px solid #667eea;
  }

  .question-list {
    margin-bottom: 24px;
  }

  .question-item {
    display: flex;
    margin-bottom: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .question-number {
    font-weight: bold;
    color: #667eea;
    margin-right: 12px;
    min-width: 24px;
  }

  .question-text {
    flex: 1;
    line-height: 1.6;
    color: #2d3748;
  }

  .answer-section {
    margin: 24px 0;
    padding: 20px;
    background: #f7fafc;
    border-radius: 8px;
  }

  .answer-section label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2d3748;
  }

  .input-group {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .input-group input {
    flex: 1;
    padding: 12px;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
  }

  .input-group input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .input-group button {
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
  }

  .input-group button:hover:not(:disabled) {
    background: #5a67d8;
  }

  .input-group button:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }

  .hint {
    color: #718096;
    font-size: 0.9rem;
    margin: 0;
  }

  .result-section {
    margin: 24px 0;
    padding: 20px;
    background: #f0fff4;
    border-radius: 8px;
    border: 1px solid #9ae6b4;
  }

  .result-section h3 {
    color: #22543d;
    margin: 0 0 16px 0;
  }

  .correct-answer, .your-answer {
    margin-bottom: 16px;
    padding: 12px;
    background: white;
    border-radius: 6px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
  }

  .pubkey {
    background: #f1f5f9;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    cursor: pointer;
    flex: 1;
    overflow-wrap: break-word;
  }

  .pubkey:hover {
    background: #e2e8f0;
  }

  .copy-btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .copy-btn:hover {
    background: #5a67d8;
  }

  .display-name {
    color: #4a5568;
    font-style: italic;
    margin: 4px 0 0 0;
  }

  .result-text {
    font-weight: 600;
    padding: 8px;
    border-radius: 4px;
  }

  .actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 20px;
  }

  .primary {
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
  }

  .primary:hover {
    background: #5a67d8;
  }

  .profile-link {
    background: #48bb78;
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: 600;
    display: inline-block;
  }

  .profile-link:hover {
    background: #38a169;
  }

  .emoji-section {
    margin-top: 24px;
    padding: 16px;
    background: #fffaf0;
    border-radius: 8px;
    border: 1px solid #fed7aa;
  }

  .emoji-section h4 {
    color: #9c4221;
    margin: 0 0 12px 0;
  }

  .emoji-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .emoji-tag {
    background: #fef5e7;
    color: #744210;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9rem;
    border: 1px solid #d69e2e;
  }

  @media (max-width: 600px) {
    .quiz-container {
      padding: 16px;
    }
    
    .input-group {
      flex-direction: column;
    }
    
    .actions {
      flex-direction: column;
    }
    
    .user-info {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style> 