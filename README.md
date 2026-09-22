# ThreadWriter v0.6.3

A small local-first dialogue editor that looks and behaves like a message thread, but can also switch into a plain transcript-style drafting view.

## Current features

- Responsive desktop / phone / tablet layout
- Multiple participants with names, left/right alignment, and bubble colors
- `Enter` creates a message
- `Shift+Enter` inserts a line break
- `Tab` / `Shift+Tab` cycles participants while composing
- `Ctrl+1` through `Ctrl+9` jumps directly to a participant
- Touch-friendly participant buttons for mobile
- Local autosave in the browser
- Editable native `.threadwriter` JSON project export/import
- Consecutive messages from the same participant are visually grouped
- Compact per-message overflow menu for edit, insert-above/below, speaker reassignment, optional timestamp, reordering, and delete
- Viewport-safe mobile message menus
- Optional editable timestamps, including free-form story labels such as “two hours later”
- Timestamped messages create a visual time-break before the new message beat
- Move Up / Move Down controls in each message menu for reliable one-step reordering
- Find & Replace across message text, including next/previous navigation and case-sensitive search
- Live thread word count for committed message text (headers, timestamps, and participant labels are excluded)
- Insert Above / Insert Below commands for adding a message directly where it belongs in an existing thread
- Optional centered scene header for chapter names, dates, channels, AI-session labels, interstitial jokes, etc.
- Four simple header-font families: Rounded, Sans, Serif, and Mono
- Conversation Styles: **Mobile Chat** and **Transcript**
- PNG image export for shareable rendered conversations
- Two `.docx` export modes with no external libraries: Portable transcript and Rich layout
- Plain `.txt` transcript export
- Print stylesheet for browser Print / Save as PDF
- Headers, timestamps, and Transcript style carry through the relevant exports
- Installable PWA behavior when served over HTTP/HTTPS

## Running it

### Easiest desktop test

Open `index.html` directly in a modern browser. Editing, autosave, PNG/DOCX/TXT export, and Print/PDF should work.

### For installable/offline PWA behavior

Serve the folder locally, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/` in your browser. Service-worker/offline installation features require HTTP/HTTPS rather than `file://`.

GitHub Pages is also a good fit: place these files at the publishing root and add the resulting site to an iPhone/iPad Home Screen if desired.


## New in v0.6.3

- Added a live **word count** in the composer area. It counts committed message text only, so participant labels, timestamps, and scene headers do not inflate the total.
- Added **Insert above** and **Insert below** to each message's `…` menu. The inserted message starts with the neighboring message's speaker and opens immediately for inline editing; use **Change speaker** afterward if needed.
- Renamed the top-bar **People** button to **Participants** for clearer terminology.
- Bumped the PWA cache for hosted/Home Screen copies.

## Fixed in v0.6.2

- Replaced drag-to-reorder with dependable **Move up** and **Move down** commands in each message's `…` menu.
- The first message disables **Move up** and the last message disables **Move down**, so the controls make their limits clear.
- Bumped the offline/PWA cache so hosted copies can pick up the change cleanly.

## Fixed in v0.6.1

- Attempted a cross-browser drag-to-reorder fix by following pointer position directly. In real-world browser testing this remained unreliable, so v0.6.2 replaces drag reordering with explicit one-step movement controls.
- Bumped the offline/PWA cache for that maintenance release.

## New in v0.6

### Reorder messages

Use **Move up** or **Move down** in a message's `…` menu to shift it one position at a time. Speaker grouping is recalculated automatically after every move. This deliberately favors predictable behavior across desktop and mobile browsers over drag-and-drop gestures.

### Find & Replace

The **Find** button searches message text and highlights matching messages. You can step through matches, replace the current match, replace all matches, and optionally use case-sensitive search.

Participant names are intentionally not altered by Find & Replace; rename a participant once in **Participants** and every message assigned to that participant updates automatically.

### Scene headers

**Header** adds optional centered text above the conversation. It can function as a chapter/scene title, date marker, channel name, CHIRP session label, transcript heading, or narrative interstitial. The header can use Rounded, Sans, Serif, or Mono typography.

### Conversation Styles

v0.6 introduces the first two presentation families:

- **Mobile Chat**: the familiar ThreadWriter left/right bubble layout.
- **Transcript**: the same underlying conversation presented as speaker-labelled dialogue blocks without literal message bubbles.

This is a presentation choice, not a separate document type. You can switch back and forth without changing the underlying text.

### PNG export

**PNG** creates a clean, shareable long image of the rendered thread, including the document title, optional scene header, timestamps, participant colors, and the selected Conversation Style.

For now, extremely long threads that would exceed a browser-safe single-image height should use PDF. Split-image export remains a possible future addition.

### PWA updates

The service worker now prefers fresh network files when online and falls back to its cache when offline. This should make GitHub Pages / Home Screen installs less prone to clinging to an older release after an update.

## DOCX export modes

**Portable DOCX** exports ordinary paragraphs with speaker names. It is the safest choice when the next step is substantial editing in Word, LibreOffice, Pages, or Google Docs.

**Rich DOCX** preserves the active presentation style. Mobile Chat uses editable Word tables for left/right layout and participant colors; Transcript uses ordinary speaker-labelled blocks. Scene headers and timestamps are retained.

Rich chat bubbles intentionally use shaded table cells rather than floating drawing shapes, so the file remains much more portable across word processors. Rounded bubble corners are not preserved in DOCX because that would require less-compatible drawing objects.

## Project-file compatibility

v0.6 project files add fields for the scene header and Conversation Style, but older `.threadwriter` files remain importable. Missing v0.6 settings are filled with sensible defaults on import.

## Possible future ideas

### Core / reliability

- Automatic backups and lightweight version history
- Word-count breakdowns / project totals once multi-scene projects exist

### Output / sharing

- JPG export
- Split/subdivided image export for very long threads

### Projects

- Multiple scenes / chapters inside one project
- Project-wide search

### Authoring tools

- Under-message annotations for actions, metrics, read receipts, or system notes
- General-purpose narrative / system text blocks
- Single-image attachments
- Faux link previews

### Import / migration

- Import existing TXT / Markdown / DOCX conversations, including speaker-labelled dialogue and two-person left/right-aligned drafts

### Presentation

- Additional generic Conversation Styles such as Work Chat, AI / Terminal, and Retro IM
- Image captions / alt text
- Optional participant avatars
- Optional word-balloon tails

The guiding rule remains: ThreadWriter should make fictional digital conversations easier to write, not become a full messaging platform with a novel trapped inside it.
