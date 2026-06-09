# Personal Website (Three.js) — To-Do List

## 🚨 Launch Blockers (Critical UX)



## 📋 Feature Parity (Pre-launch)

- [ ] **Shelf labels** — Add visible section labels to each shelf row (like the main version) so visitors understand the categories at a glance without opening books.
- [ ] **Skills books content** — `skillsA–D` have no `modalInfo`. Add real content: programming languages, tools & frameworks, spoken languages, other skills.
- [ ] **Projects books content** — `projectsA–G` are placeholders ("Project A"…). Fill in real project data with descriptions, tech stack, links.


## 🎨 Realism & Polish

- [ ] **Fix bookshelf corners** — Side panels, back panel, and shelves don't align cleanly at the corners.
- [ ] **More realistic lighting** — Add multiple light sources of varying brightness and color temperature to simulate a real room (overhead, sconce, ambient fill, etc.). Current lighting is functional but flat.
- [ ] **Smoother / slower animations** — Current open/close animations feel a bit fast or abrupt. Slow them down and ease curves so the motion feels more deliberate and cinematic.
- [ ] **Lived-in book arrangement** — Add slight random Y offsets and lean angles so books don't all sit perfectly flush — more natural bookshelf look.
- [ ] **Better spine texture** — Spines look flat. Add subtle vertical grain lines or an embossed title effect to the spine canvas texture.
- [ ] **Shadow between books** — Books next to each other should cast soft contact shadows onto neighboring spines.
- [ ] Fill empty space with more books or decorative objects.
- [ ] Add a background and surroundings to make the scene feel more like a real room.

## 🔭 Navigation & Responsive Design

- [ ] **Responsive layout** — The scene needs to look good across a range of viewport sizes (desktop widescreen, laptop 1080p, tablet). Tune camera FOV, book scale, and UI element sizes relative to viewport.
- [ ] **Free-roam camera (undecided)** — Consider letting users orbit/pan around the shelf freely rather than locking to a fixed viewpoint. Trade-offs:
  - *Pro*: more immersive, novel UX.
  - *Con*: requires exterior shelf detail (back, sides visible), a "re-center" control button, and the open-book animation must bring content to the viewer's current vantage point rather than assuming a fixed camera position.
  - Current OrbitControls give this partially for free, but it feels unguided. A curated "walk up to the shelf" interaction might be better.
- [ ] **Re-center / home button** — If free-roam is kept, provide a button to snap back to the default viewing position.
- [ ] If panning, rotating perspective and cursor ends on an object, don't consider it clicked.

## ⚙️ Stability / Code Quality

- [ ] **Goodreads via GitHub Action (replace runtime rss2json)** — A scheduled action fetches the `list_rss?shelf=read` feed server-side (no CORS/proxy/10-item cap), parses it, and commits a regenerated `goodreadsSnapshot.js`. Removes the flaky runtime rss2json dependency; data is only as fresh as the cron. Unlocks build-time processing:
  - Sample each cover's dominant color and bake a spine/back hex into the snapshot, replacing the arbitrary `_hashColor(title)` so spines match the real books.
- [ ] Improve code organization - break up big files, co-locate related code, such as that for displaying an item and its content
- [ ] **ES module cache-busting** — Requires Ctrl+Shift+R to pick up JS changes in in browser. Add a version query string to module imports or use a bundler.
- [ ] **Mobile / touch support** — OrbitControls work on desktop; verify and fix touch interaction on mobile.
