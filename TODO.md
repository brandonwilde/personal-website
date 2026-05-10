# Personal Website (Three.js) — To-Do List

## 🚨 Launch Blockers (Critical UX)

- [ ] **In-book content display** — Content should appear ON the page from the very start of the open animation (baked into canvas textures or HTML overlay that appears immediately), not slide in afterward. Left page = title, right page = content. The 3D book is the frame.
- [x] **Open/close mutual exclusion** — If a book is open and the user clicks another, the open book must close (simultaneously or first) before the new one opens. Books must never overlap in the scene.
- [ ] **Legible reading size** — Open book should fill ~70-80% of the viewport. Fix `showcaseY` (camera coordinate mismatch), tune `zOut`, and size the content overlay to be comfortably readable.
- [x] **Fix close-button crash** — `main.js:264`: `closeBtn.onclick` references `this.books` but `this` is `window`. Books never close via the X button. (pre-existing bug)
- [x] **ESC key + click-outside to close** — No keyboard or backdrop dismissal exists.
- [ ] **Fix bookshelf corners** — Side panels, back panel, and shelves don't align cleanly at the corners.
- [ ] **Blog book → external link** — Clicking "Blog" should navigate to `https://the.btw.so` (new tab), not trigger a book-open animation.
- [ ] **Contact card → distinct behavior** — "Contact Info" is treated as a book but isn't book-shaped. Give it a business-card-style display instead of the standard book open.

## 📋 Feature Parity (Pre-launch)

- [ ] **Shelf labels** — Add visible section labels to each shelf row (like the main version) so visitors understand the categories at a glance without opening books.
- [ ] **Skills books content** — `skillsA–D` have no `modalInfo`. Add real content: programming languages, tools & frameworks, spoken languages, other skills.
- [ ] **Projects books content** — `projectsA–G` are placeholders ("Project A"…). Fill in real project data with descriptions, tech stack, links.
- [ ] **Reviews / Goodreads integration** — `bookReviews` and `recentReads` need the Goodreads RSS widget (was in `componentsOld/bookReviews.js`).
- [ ] **Non-book objects — distinct animations** — `blog` (6W×1H×8T) and `contact` (2W×1H×3T) have unusual proportions. Their open animation should differ from standard books.

## 🎨 Realism & Polish

- [ ] **More realistic lighting** — Add multiple light sources of varying brightness and color temperature to simulate a real room (overhead, sconce, ambient fill, etc.). Current lighting is functional but flat.
- [ ] **Smoother / slower animations** — Current open/close animations feel a bit fast or abrupt. Slow them down and ease curves so the motion feels more deliberate and cinematic.
- [ ] **Lived-in book arrangement** — Add slight random Y offsets and lean angles so books don't all sit perfectly flush — more natural bookshelf look.
- [ ] **Right-hand content page** — When a book is open, show a second "page" (right side) with content.
- [ ] **Better spine texture** — Spines look flat. Add subtle vertical grain lines or an embossed title effect to the spine canvas texture.
- [ ] **Shadow between books** — Books next to each other should cast soft contact shadows onto neighboring spines.
- [ ] **Cursor feedback** — Show a "grab" cursor when hovering over an open book (indicates it can be closed).

## 🔭 Navigation & Responsive Design

- [ ] **Responsive layout** — The scene needs to look good across a range of viewport sizes (desktop widescreen, laptop 1080p, tablet). Tune camera FOV, book scale, and UI element sizes relative to viewport.
- [ ] **Free-roam camera (undecided)** — Consider letting users orbit/pan around the shelf freely rather than locking to a fixed viewpoint. Trade-offs:
  - *Pro*: more immersive, novel UX.
  - *Con*: requires exterior shelf detail (back, sides visible), a "re-center" control button, and the open-book animation must bring content to the viewer's current vantage point rather than assuming a fixed camera position.
  - Current OrbitControls give this partially for free, but it feels unguided. A curated "walk up to the shelf" interaction might be better.
- [ ] **Re-center / home button** — If free-roam is kept, provide a button to snap back to the default viewing position.

## ⚙️ Stability / Code Quality

- [x] **`createBookshelf()` called twice** — `BookshelfScene` constructor already calls it; `main.js` calls it again. Remove the duplicate.
- [ ] **ES module cache-busting** — Requires Ctrl+Shift+R to pick up JS changes in in browser. Add a version query string to module imports or use a bundler.
- [ ] **Mobile / touch support** — OrbitControls work on desktop; verify and fix touch interaction on mobile.
