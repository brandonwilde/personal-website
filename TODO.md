# Personal Website (Three.js) — To-Do List

## 🎨 Realism & Polish

- [ ] **Blog inside the notebook, with page turns** — Instead of linking out, render recent posts on the notebook's own pages and animate a real page turn. Feed comes from the blog RSS (same fetch-with-committed-snapshot-fallback pattern as Goodreads). Sketch:
  - Page = a segmented `PlaneGeometry` bent per-vertex (or in a vertex shader) around a hinge at the spine; ease the flip and let the leading edge lag slightly so it curls rather than rotating rigidly.
  - Page content = `CanvasTexture` per face, text drawn at high resolution so it survives the zoom.
  - Legibility is the real constraint, not the animation: at the notebook's resting size the type is unreadable, so opening it needs a camera move that fills the frame with the spread.
  - Keep every post title a real link out (or a page of its own) — don't lose shareable URLs the way an iframe would.

- [ ] **More realistic lighting** — Add multiple light sources of varying brightness and color temperature to simulate a real room (overhead, sconce, ambient fill, etc.). Current lighting is functional but flat.
- [ ] **Lived-in book arrangement** — Add slight random Y offsets and lean angles so books don't all sit perfectly flush — more natural bookshelf look.
- [ ] Fill empty space with more books or decorative objects.
  - [ ] Generate 3D items with TripoSR, StableFast3D, Hunyuan3D, Meshy, Tripo3D, or Hyper3D Rodin
  - [ ] Add something above the shelf (artwork, wifi router?) and something in the foreground (Persian rug?) for mobile displays where there's a lot of vertical space
  - [ ] **Miniature piano/keyboard prop** — Add a small 3D piano (or keyboard) sitting on a shelf, mirroring the mini keyboard on Brandon's real bookshelf. A personality touch nodding to playing piano. Could also be the home for an "improv comedy" easter egg/personal note.
  - [ ] Add chessboard

## 🔭 Navigation & Responsive Design

- [ ] **Confirm before leaving for the blog** — Clicking the notebook currently navigates straight out to `the.btw.so` via the invisible `<a>` overlay in `BlogNotebook.js`. On desktop that's survivable (hover URL preview, opens in a new tab), but on mobile there's no preview and no warning — the tap just throws you onto another site. Show a small confirmation ("Read the blog at the.btw.so?" / Go / Cancel) before navigating, at least on touch devices. Cheap insurance if the in-notebook reader above doesn't land soon.
- [ ] **Re-center / home button** — If free-roam is kept, provide a button to snap back to the default viewing position.
- [ ] Add controls better suited for laptop
- [ ] Let user pull out a book manually rather than (or in addition to) just clicking. Might be more fun

## ⚙️ Stability / Code Quality

- [ ] **Goodreads via GitHub Action (replace runtime rss2json)** — A scheduled action fetches the `list_rss?shelf=read` feed server-side (no CORS/proxy/10-item cap), parses it, and commits a regenerated `goodreadsSnapshot.js`. Removes the flaky runtime rss2json dependency; data is only as fresh as the cron. Unlocks build-time processing:
  - Sample each cover's dominant color and bake a spine/back hex into the snapshot, replacing the arbitrary `_hashColor(title)` so spines match the real books.
- [ ] Improve code organization - break up big files, co-locate related code, such as that for displaying an item and its content
- [ ] **ES module cache-busting** — Requires Ctrl+Shift+R to pick up JS changes in in browser. Add a version query string to module imports or use a bundler.
