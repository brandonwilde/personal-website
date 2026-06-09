// Fetches recent reads from a Goodreads user's RSS "updates" feed and normalizes them
// into the shape consumed by the bookshelf (see goodreadsSnapshot.js for the same shape).
//
// Goodreads has no public API anymore (retired 2020), so we read the public RSS feed
// through the api.rss2json.com CORS proxy — the same source the legacy `master` site used,
// but with robust DOMParser parsing instead of the old reversed-string hack.
//
// This is only used for the *background refresh*; any failure is swallowed by the caller,
// which keeps the committed snapshot on screen.

// Goodreads' built-in status shelves aren't genres — drop them from the displayed tags.
const SYSTEM_SHELVES = new Set(['read', 'currently-reading', 'to-read', 'did-not-finish']);

// Strips the size directive (e.g. `._SY75_`, `._SX50_`, combined forms) from a gr-assets
// thumbnail URL to request the full-resolution cover. The bare `<id>.jpg` form returns the
// original upload. Returns the input unchanged if it doesn't match the expected pattern.
export function upgradeCoverUrl(url) {
    if (!url) return url;
    return url.replace(/\._S[XY]\d+(_S[XY]\d+)*_(\.jpg)$/i, '$2');
}

async function fetchFeedItems(config) {
    const rss = `https://www.goodreads.com/user/updates_rss/${config.userId}`;
    const proxy = `${config.proxyBase ?? 'https://api.rss2json.com/v1/api.json?rss_url='}${encodeURIComponent(rss)}`;
    const response = await fetch(proxy);
    if (!response.ok) throw new Error(`rss2json ${response.status}`);
    const data = await response.json();
    if (data.status !== 'ok' || !Array.isArray(data.items)) {
        throw new Error(`rss2json bad payload: ${data.status}`);
    }
    return data.items;
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Pulls structured fields out of one RSS item's `content` HTML. The review-text extraction
// is the most fragile part of the feed (Goodreads doesn't tag it cleanly), so it works by
// removing the known boilerplate from the item's text and returning whatever remains.
export function parseReviewItem(item) {
    const doc = new DOMParser().parseFromString(item.content, 'text/html');

    const img        = doc.querySelector('img');
    const titleEl    = doc.querySelector('.bookTitle');
    const authorEl   = doc.querySelector('.authorName');
    const ratingMtch = item.content.match(/gave\s+(\d+)\s+stars?/i);

    // Goodreads appends a format suffix to the linked title, e.g. "On Bullshit (Hardcover)".
    const title  = (titleEl?.textContent  ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim();
    const author = (authorEl?.textContent ?? '').trim();
    const rating = ratingMtch ? parseInt(ratingMtch[1], 10) : 0;

    const genres = Array.from(doc.querySelectorAll('a.actionLinkLite'))
        .map(a => a.textContent.trim())
        .filter(g => g && !SYSTEM_SHELVES.has(g));

    const coverImgSrc = img?.getAttribute('src') ?? '';

    return {
        id:              item.guid ? `gr${item.guid.replace(/\D/g, '')}` : `gr${title.replace(/\W/g, '')}`,
        title,
        author,
        coverImgSrc,
        coverImgSrcFull: upgradeCoverUrl(coverImgSrc),
        rating,
        genres,
        review:          extractReview(doc, { title, author }),
    };
}

function extractReview(doc, { title, author }) {
    let text = (doc.body.textContent ?? '')
        .replace(/ /g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Remove the "<user> gave N stars to <title> by <author>" lead-in.
    text = text.replace(/^.*?gave\s+\d+\s+stars?\s+to\s+/i, '');
    if (title)  text = text.replace(title, '');
    text = text.replace(/^\s*\([^)]*\)\s*/, '');   // dangling "(Hardcover)"
    text = text.replace(/^\s*by\s+/i, '');
    if (author) text = text.replace(author, '');

    // Remove the "bookshelves: a, b, c" block. Strip *every* shelf link (not just the
    // display-capped genres) so no shelf name leaks into the review text.
    text = text.replace(/bookshelves:\s*/i, '');
    for (const a of doc.querySelectorAll('a.actionLinkLite')) {
        const shelf = a.textContent.trim();
        if (shelf) text = text.replace(new RegExp(`\\b${escapeRegExp(shelf)}\\b,?`, 'i'), '');
    }

    // Trim stray separators and the "...more" truncation link.
    text = text.replace(/^[\s,]+|[\s,]+$/g, '');
    text = text.replace(/\s*\.{3}\s*more\s*$/i, '').trim();
    return text;
}

// Returns up to `config.count` normalized recent reads. Throws on network/parse failure so
// the caller can fall back to the committed snapshot.
export async function fetchRecentReads(config) {
    const items = await fetchFeedItems(config);
    const reads = items
        .filter(it => typeof it.guid === 'string' && it.guid.startsWith('Review'))
        .map(parseReviewItem)
        .filter(r => r.title);

    // The feed can carry multiple update entries for the same book (e.g. rating + shelving).
    // Keep the first occurrence of each book so duplicates don't render twice or crowd out
    // later books, then take the most recent `count`.
    const seen = new Set();
    const unique = reads.filter(r => (seen.has(r.id) ? false : seen.add(r.id)));
    return unique.slice(0, config.count);
}
