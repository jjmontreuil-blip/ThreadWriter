# ThreadWriter v0.6.6

A small local-first dialogue editor that looks and behaves like a message thread, but can also switch into a plain transcript-style drafting view.

## Current features

- Responsive desktop / phone / tablet layout
- Multiple participants with names, left/right alignment, and bubble colors
- `Enter` creates a message
- `Shift+Enter` inserts a line break
- `Tab` / `Shift+Tab` cycles participants while composing
- `Ctrl+1` through `Ctrl+9` jumps directly to a participant
- Touch-friendly participant buttons for mobile
- Local autosave in the browser, with each conversation stored separately
- **Recent** conversation picker for reopening locally saved threads, including multiple threads with the same title
- **Save As…** creates a portable `.threadwriter` file you control, while autosave continues maintaining the browser-local Recent copy
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


## New in v0.6.6

### Save As means an actual file

- Replaced the misleading manual **Save** button with **Save As…**. Autosave still keeps the current conversation in ThreadWriter's browser-local **Recent** library.
- On supported desktop Chromium-family browsers served from HTTPS/localhost, **Save As…** opens the operating system's file picker so you can choose the `.threadwriter` filename and folder.
- On iOS/Safari and other browsers without that picker, ThreadWriter first tries the system share sheet so **Save to Files** can choose a destination. If that is unavailable, it falls back to a normal browser download.
- The old **Project** export button has been folded into **Save As…** so there is one clear command for making an editable external ThreadWriter file.
- Save-status wording now distinguishes the internal autosave (**Saved to Recent**) from an external file copy.
- The browser-local Recent library remains independent of external `.threadwriter` files: Save As is the explicit backup/portable-copy path, not a replacement for autosave.

## New in v0.6.5

### Safer local conversations

- ThreadWriter no longer keeps only one browser autosave slot. Every new or imported conversation receives its own local document ID and is stored separately.
- **New** now saves the current thread first, then creates a separate blank thread. Reusing the title “Untitled Thread” no longer overwrites an earlier conversation.
- **Recent** opens a local conversation picker showing title, word count, last-updated time, and a short preview. This is the first step toward the fuller project/navigation interface planned for later versions.
- **Save** performs an immediate manual local save in addition to the existing autosave behavior.
- Imported `.threadwriter` files are brought in as separate local conversations instead of replacing the current browser autosave.
- v0.6.4-and-earlier single-slot autosaves are migrated into the new local conversation library on first launch. The old legacy storage key is deliberately left untouched as an extra safety copy.
- ThreadWriter now flushes the current thread to local storage when the page is hidden or closed, in addition to normal debounced autosaving.
- Local-save failures are surfaced as **Save failed** instead of silently pretending the write succeeded.

### Important note

The local conversation library is browser/device-specific. It is much safer than the old single autosave slot, but it is **not yet a backup system**. Clearing browser site data can still remove locally stored threads. Use **Save As…** to make external `.threadwriter` backups until automatic backup/version-history work is added.

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
- Optional recovery/version browser for prior local revisions
- Word-count breakdowns / project totals once multi-scene projects exist

### User interface

- Clean up / organize the growing top-of-page toolbar
- Expand the Recent/local-document interface as Projects arrive

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
