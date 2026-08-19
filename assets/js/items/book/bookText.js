// Shared text-layout helpers used by the spine, title page, and content page.

// Splits `text` into `n` character-balanced lines at word boundaries (greedy: fill to
// the running target length). Returns fewer than `n` lines when there aren't enough
// words to fill them.
export function balanceLines(text, n) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= n) return n === 1 ? [words.join(' ')] : words.slice();
    if (n === 1) return [words.join(' ')];

    const total  = words.reduce((s, w) => s + w.length, 0) + (words.length - 1);
    const target = total / n;
    const lines = [];
    let line = '', remainingWords = words.length;
    for (const word of words) {
        const linesLeft = n - lines.length;
        const candidate = line ? `${line} ${word}` : word;
        // Start a new line once this one is near its share — but never strand the
        // remaining words with fewer lines than they need.
        if (line && candidate.length > target && linesLeft > 1 && remainingWords >= linesLeft) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
        remainingWords--;
    }
    if (line) lines.push(line);
    return lines;
}

// Breaks `text` into lines no wider than `maxWidth` canvas units.
export function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}
