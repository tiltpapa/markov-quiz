<script lang="ts">
  import { nip30 } from 'nostr-tools';
  
  export let text: string;
  export let emojiTags: string[][] = [];

  interface TextSegment {
    type: 'text' | 'emoji' | 'newline';
    content: string;
    emojiUrl?: string;
    emojiName?: string;
  }

  const parseTextWithEmojis = (text: string, emojiTags: string[][]): TextSegment[] => {
    const segments: TextSegment[] = [];

    // 絵文字のパターンマップを作成
    const emojiMap = new Map<string, { url: string; name: string }>();
    emojiTags.forEach(tag => {
      if (tag.length >= 3 && tag[0] === 'emoji') {
        emojiMap.set(tag[1], { url: tag[2], name: tag[1] });
      }
    });

    // nip30を使って絵文字のマッチを取得
    const emojiMatches: Array<{ name: string; start: number; end: number }> = [];
    if (emojiTags && emojiTags.length > 0) {
      const emojiIterator = nip30.matchAll(text);
      
      for (const emojiMatch of emojiIterator) {
        const emojiInfo = emojiMap.get(emojiMatch.name);
        if (emojiInfo) {
          emojiMatches.push({
            name: emojiMatch.name,
            start: emojiMatch.start,
            end: emojiMatch.end
          });
        }
      }
    }

    // 改行の位置を取得
    const newlineMatches: Array<{ start: number; end: number }> = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') {
        newlineMatches.push({ start: i, end: i + 1 });
      }
    }

    // すべてのマッチを統合してソート
    const allMatches: Array<{ type: 'emoji' | 'newline'; start: number; end: number; name?: string }> = [
      ...emojiMatches.map(match => ({ type: 'emoji' as const, ...match })),
      ...newlineMatches.map(match => ({ type: 'newline' as const, ...match }))
    ];
    allMatches.sort((a, b) => a.start - b.start);

    let lastIndex = 0;

    // 各マッチについて処理
    for (const match of allMatches) {
      // マッチの前のテキストを追加
      if (match.start > lastIndex) {
        const beforeText = text.substring(lastIndex, match.start);
        if (beforeText) {
          segments.push({ type: 'text', content: beforeText });
        }
      }

      if (match.type === 'emoji' && match.name) {
        // 絵文字セグメントを追加
        const emojiInfo = emojiMap.get(match.name);
        if (emojiInfo) {
          segments.push({
            type: 'emoji',
            content: text.substring(match.start, match.end),
            emojiUrl: emojiInfo.url,
            emojiName: emojiInfo.name
          });
        }
      } else if (match.type === 'newline') {
        // 改行セグメントを追加
        segments.push({
          type: 'newline',
          content: '\n'
        });
      }

      lastIndex = match.end;
    }

    // 残りのテキストを追加
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        segments.push({ type: 'text', content: remainingText });
      }
    }

    // 何も見つからなかった場合は元のテキストをそのまま返す
    if (segments.length === 0) {
      return [{ type: 'text', content: text }];
    }

    return segments;
  };

  $: textSegments = parseTextWithEmojis(text, emojiTags);
</script>

<span class="emoji-text">
  {#each textSegments as segment}
    {#if segment.type === 'emoji'}
      <img 
        src={segment.emojiUrl} 
        alt={segment.content}
        title={segment.content}
        class="custom-emoji"
        style="width: 1.5em; height: 1.5em; vertical-align: middle; margin: 0 2px; display: inline-block;"
        loading="lazy"
      />
    {:else if segment.type === 'newline'}
      <br />
    {:else}
      {segment.content}
    {/if}
  {/each}
</span>

<style>
  .emoji-text {
    line-height: 1.5;
  }

  .custom-emoji {
    object-fit: contain;
    vertical-align: middle;
  }
</style> 