# ThreadWriter v0.10.1

A small local-first dialogue editor that looks and behaves like a message thread, but can also switch into a plain transcript-style drafting view.

## Current features

- Responsive desktop / phone / tablet layout
- Multiple participants with names, left/right alignment, and bubble colors
- `Enter` creates a message
- `Shift+Enter` inserts a line break
- `Tab` / `Shift+Tab` cycles participants while composing
- `Ctrl+1` through `Ctrl+9` jumps directly to a participant
- `Ctrl+Enter` / `Cmd+Enter` opens a new Narrative block from the composer and saves/closes it from the Narrative editor
- Touch-friendly participant buttons for mobile
- Persistent mobile **Narrative** quick button beside the participant strip for adding blocks without reopening the top menu
- Local autosave in the browser, with each conversation stored separately
- **Recent** conversation picker for reopening locally saved threads, including multiple threads with the same title
- Local **Projects** for grouping, reordering, counting, and searching multiple scenes/conversations
- Lightweight per-thread **Version History** with automatic local snapshots, manual checkpoints, and one-click restore
- Portable full-project backup / restore files (`.threadwriter-project`) that include every scene plus available local snapshot history
- **Save As…** creates a portable `.threadwriter` file you control, while autosave continues maintaining the browser-local Recent copy
- Editable native `.threadwriter` JSON project export/import
- Consecutive messages from the same participant are visually grouped
- Compact hierarchical per-message overflow menu for editing, speaker reassignment, moving, inserting messages/narrative blocks, annotations/timestamps, and delete
- Viewport-safe message menus on desktop and mobile that float above the fixed composer and stay clamped inside the visible screen
- Optional editable timestamps, including free-form story labels such as “two hours later”
- Timestamped messages create a visual time-break before the new message beat
- Move Up / Move Down controls in each message menu for reliable one-step reordering
- Find & Replace across message, narrative, annotation, image-caption, alt-text, and faux-link-preview content, including next/previous navigation and case-sensitive search
- Live thread word count for committed message, narrative, visible image-caption text, and faux-link title/description text (headers, timestamps, annotations, alt text, source labels, URLs, and participant labels are excluded)
- Insert Above / Insert Below commands for adding a message directly where it belongs in an existing thread
- General-purpose narrative / system blocks in the ordered thread flow
- Multiline under-message annotations for actions, stage directions, read receipts, reactions, metrics, and notes
- One static image attachment per message or narrative block, with optional visible captions and accessibility alt text; image binaries are stored once in IndexedDB rather than duplicated through local version-history snapshots
- One manually authored faux link preview per message or narrative block, with source/site, title, description, display URL/domain, and optional thumbnail; previews never scrape or contact a live website
- Browser-readable image imports are normalized to PNG or JPEG and resized to a maximum 2400-pixel dimension for saner local storage
- Optional centered scene header for chapter names, dates/times, group names, scene labels, interstitials, etc.
- Four simple header-font families: Rounded, Sans, Serif, and Mono
- Conversation Styles: **Mobile Chat** and **Transcript**
- Unified PNG/JPEG/TIFF image export for screen, high-resolution, print, or custom-width conversation graphics, with optional grayscale and smart splitting
- Two `.docx` export modes with no external libraries: Portable transcript and Rich layout
- Plain `.txt` transcript export
- Self-contained styled `.html` export with embedded image media
- Clean Print / Save as PDF stylesheet, including box-free Transcript output and no app status/project/version metadata
- Headers, timestamps, Transcript style, images, visible image captions, and faux link previews carry through the relevant visual exports; TXT and Portable DOCX preserve readable image/link metadata
- Installable PWA behavior when served over HTTP/HTTPS

## Running it

### Easiest desktop test

Open `index.html` directly in a modern browser. Editing, autosave, HTML/image/DOCX/TXT export, and Print/PDF should work.

### For installable/offline PWA behavior

Serve the folder locally, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/` in your browser. Service-worker/offline installation features require HTTP/HTTPS rather than `file://`.

GitHub Pages is also a good fit: place these files at the publishing root and add the resulting site to an iPhone/iPad Home Screen if desired.


## New in v0.10.1

- Fixed faux-link-preview thumbnails in PNG, JPEG, TIFF, grayscale, high-resolution, custom-size, and print raster exports so they preserve their source aspect ratio and use a centered cover crop instead of stretching to the preview box.
- Bumped the runtime version, asset query strings, and PWA/service-worker cache to **v0.10.1** so hosted GitHub Pages and Home Screen copies reliably pick up the maintenance release.


## New in v0.10

- **Self-contained HTML export** for a styled, selectable, responsive copy of the current thread. Attached images and faux-link thumbnails are embedded directly so the file can travel on its own.
- **Unified image export dialog** replaces the old one-click PNG export. Choose PNG, JPEG, or baseline TIFF.
- **Screen / High-resolution / Print / Custom sizing**: 1080 px screen output, 2160 px high-resolution output, physical print width with 300/600 DPI, or a custom pixel width. Print PNG/JPEG/TIFF files carry the chosen DPI metadata as well as the matching pixel dimensions.
- **Color or grayscale** output for every raster format.
- **Intelligent long-image splitting** keeps messages and narrative blocks together when possible and packages multi-part exports in a ZIP instead of asking the browser to allow a hailstorm of downloads.
- **Print/PDF cleanup** uses dedicated print layout, real page margins, empty paged-media header/footer boxes where supported, and temporary title suppression while the print dialog opens. ThreadWriter UI stays out of the document.
- Existing DOCX, TXT, Rich DOCX, project backup, image attachment, caption/alt-text, and faux-link-preview behavior is unchanged.


## New in v0.9.2

### Faux link previews

- Messages and Narrative blocks can now carry **one manually authored faux link preview**. Add or edit it from the block/message `…` menu.
- Preview fields are **Site / source**, **Title**, **Description**, and **Display URL / domain**. None are fetched from the network, so fictional URLs and in-world publications work exactly as well as real ones.
- Each preview can optionally include a **thumbnail image**. Thumbnail binaries reuse ThreadWriter's IndexedDB media store and lightweight ID references, so Version History does not duplicate the image six times.
- Preview title and description count toward thread/project word counts because they are visible authored prose; source labels and display URLs do not.
- Find & Replace and project-wide search include all four text fields.
- Faux previews carry through **PNG**, **Print/PDF**, and **Rich DOCX** visually. **TXT** and **Portable DOCX** preserve their fields as readable structured metadata, including a thumbnail filename placeholder when present.
- `.threadwriter` files and project backups automatically include preview thumbnails alongside ordinary image attachments.

## New in v0.9.1

### Image captions and alt text

- Every attached image can now carry an optional **caption** and **alt text**, edited from **Edit → Image details…** on either a message or Narrative block.
- Captions render directly beneath their image in Mobile Chat and Transcript views, Print/PDF, PNG, and Rich DOCX. Captions count toward thread and project word counts because they are visible authored text.
- Alt text is not shown in the conversation. It becomes the browser image's accessible alternative text and is embedded into Rich DOCX image metadata.
- TXT and Portable DOCX preserve both values explicitly alongside the image placeholder so caption/alt work is not lost when moving into a plain manuscript workflow.
- Find & Replace and project-wide search now include captions and alt text. A current alt-text search match highlights the associated image even though the alt text itself is intentionally invisible.
- Replacing an image preserves its caption and alt text, which is useful when swapping in a corrected or higher-resolution version of the same illustration. Removing the attachment removes its metadata with it.
- Caption/alt metadata lives in the lightweight document state, not the binary media store, so Version History, Recent, Save As, and project backups carry it without duplicating image payloads.

## New in v0.9

### Single-image attachments

- Messages and Narrative blocks can now carry **one static image attachment**. Add one from the block/message `…` menu; once attached, **Edit** offers Replace image and Remove image controls.
- ThreadWriter accepts image formats the current browser can decode, then normalizes them for storage. PNG sources remain PNG; other readable formats are flattened to JPEG. Images are resized only when their longest edge exceeds **2400 px**.
- Local media lives in **IndexedDB** under a separate image ID. Conversation states and Version History snapshots keep only lightweight references, so six snapshots do not six-times duplicate the same binary image.
- Removing/replacing an image is treated as a destructive edit for Version History, giving the outgoing attachment a recovery checkpoint when possible. Unreferenced local media is garbage-collected after it falls out of current conversations and retained history.
- `.threadwriter` Save As files now use a v2 wrapper that embeds the current conversation's referenced media once. v0.8.x and older raw ThreadWriter JSON files still open normally.
- `.threadwriter-project` backups are now v2 and embed all images referenced by project scenes and retained history once at the project level. v1 project backups remain restorable.

### Image-aware exports

- **PNG** output renders attached images in both Mobile Chat and Transcript styles.
- **Print / PDF** uses the same in-thread image elements, so attached images carry into the clean print stylesheet.
- **Rich DOCX** embeds attached PNG/JPEG media directly into the Word package.
- **Portable DOCX** and **TXT** intentionally stay text-first and insert a readable `[Image attachment: filename]` placeholder instead of binary media.

## New in v0.8.2

### Context-menu cleanup

- Message and Narrative `…` menus now move into a viewport-level floating layer on desktop as well as mobile, so controls near the bottom of a long thread no longer disappear behind the fixed participant/composer panel.
- Open menus choose the roomier side of the `…` button when necessary and clamp vertically/horizontally inside the visible viewport.
- Reorganized crowded message controls into compact nested menus: **Edit**, **Move**, **Insert**, and **Add**, with **Change speaker** and **Delete** kept immediately accessible.
- **Edit** opens directly on a plain message; once an annotation and/or timestamp exists, it becomes a submenu for Message plus the attached extras.
- **Add** only offers extras that are not already present.
- **Insert** now supports Message Above/Below and Narrative Above/Below from either message or narrative blocks.
- Narrative menus use the slimmer **Edit / Insert / Move / Delete** hierarchy.
- Submenus are click/tap driven on every device; **Escape** backs out one submenu level before closing the popover.

## New in v0.8.1

### Authoring-flow refinements

- Added `Ctrl+Enter` / `Cmd+Enter` as a composer shortcut for opening a new Narrative block. The same shortcut saves and closes the Narrative editor.
- An unfinished message remains untouched while a Narrative block is added, and focus returns to the composer afterward when the shortcut/quick button launched the block.
- Added a persistent mobile **Narrative** quick button. On phones, the swipeable participant strip now ends at the same horizontal point as the message field, leaving a compact Narrative control above the Send button.

### PDF / Print cleanup

- Transcript-style Print/PDF output no longer reintroduces full-width borders around every message.
- Print output hides ThreadWriter's browser-local status line, including project membership and runtime version, while retaining the document title and optional scene header as document content.
- Mobile Chat print styling remains unchanged.

## New in v0.8

### Narrative / system blocks

- Added **Text → Narrative block…** for unassigned text that belongs between messages: narration, stage directions, scene context, time jumps, system notices, and similar material.
- Narrative blocks live in the same ordered flow as messages, can be moved up/down or deleted, and can have ordinary messages inserted around them.
- Message menus also include **Insert narrative below…** for placing a block directly in context.
- Narrative text is included in thread/project word counts and project-wide search.
- Narrative blocks carry through TXT, Portable DOCX, Rich DOCX, PNG, and Print/PDF output.

### Under-message annotations

- Messages can now carry a multiline **annotation** beneath the bubble or transcript text. Use it for actions, stage directions, read receipts, reactions, metrics, or other message-adjacent notes.
- Annotations are searchable and replaceable but are deliberately excluded from the manuscript word count.
- Annotations carry through TXT, both DOCX modes, PNG, and Print/PDF output.

### Reliability / housekeeping

- Version History now keeps up to **6** local snapshots per conversation rather than 12, reducing browser-storage growth while retaining a useful rollback window.
- Scene-header guidance now uses generic examples such as scene numbers, dates/times, group chats, and time jumps instead of project-specific examples.
- v0.7.x and earlier `.threadwriter` files remain compatible; older messages are normalized into the v0.8 document model on open.

## New in v0.7.2

### Local version history

- Added **File → Version History…** for the current conversation.
- v0.7.2 originally introduced up to **12 local snapshots per thread** in the same browser; v0.8 reduces the current cap to 6. Automatic snapshots are spaced roughly five minutes apart while the thread changes, with extra checkpoints when a thread is switched/closed and before destructive edits.
- **Create snapshot now** makes an explicit checkpoint whenever you want one.
- Restoring a snapshot first saves the current state as **Before restore**, so using history does not casually destroy the version you are leaving.
- Snapshot entries show date/time, reason, word count, and a short preview.
- Local history is intentionally lightweight and browser-local. Clearing site data can remove it. As of v0.9, image binaries live separately in IndexedDB while history snapshots retain only image references.

### Project backup / restore

- Projects now have **Back up project…**, which creates a portable `.threadwriter-project` JSON backup containing the project name, scene order, every current scene, and any available local history snapshots for those scenes.
- **Restore project backup…** imports that file as a new local project with new document IDs, so restoring does not overwrite an existing project or Recent conversation.
- Desktop Chromium-family browsers can use the system Save As picker; iOS/Safari uses the share sheet / Save to Files when available; other browsers fall back to a normal download.

### Safety model

ThreadWriter now has three deliberately different safety layers:

1. **Recent**: convenient current browser-local autosaves.
2. **Version History**: local rollback points for editing mistakes and accidental deletions.
3. **Save As / Project Backup**: external files you actually control and can keep outside browser storage.

Version history and Recent are recovery tools, not substitutes for external backups.

## New in v0.7.1

### Projects

- Added a local **Projects** workspace for grouping related ThreadWriter conversations into a larger manuscript or production. A project can hold many scenes while every scene remains an ordinary ThreadWriter conversation that also stays available in **Recent**.
- Create and rename projects, add the current thread, create a new scene directly inside a project, remove scenes without deleting them, and reorder scenes with explicit up/down controls.
- The current thread shows a small clickable **Project: …** indicator under its title whenever it belongs to a project.
- Project dialogs show scene count plus a live **project-level word count**.
- Added **project-wide search** across scene titles, scene headers, and message text. Selecting a message-text result opens that scene and hands the query to ThreadWriter's existing Find system so matching messages are highlighted.
- Recent conversations now show their project name when they belong to one.
- Projects and their scene order are stored locally in the browser alongside the Recent library. Existing v0.7 and earlier conversations remain compatible and begin unassigned until you add them to a project.

### Important safety note

Projects are organization, **not yet backup/version history**. Project membership and scene order live in browser storage, and clearing site data can remove them. Individual scenes can still be protected with **Save As…**. Automatic snapshots / fuller project backup remain planned safety work for a later v0.7.x release.

## New in v0.7

### Cleaner top-of-page interface

- Reorganized the growing toolbar into three primary controls: **Text**, **File**, and **Recent**.
- **Text** now contains Participants, Header, Conversation Style, and Find & Replace.
- **File** now contains New, Open, Save As, and a nested Export section.
- **Open…** replaces the older “Import” label for native `.threadwriter` files, reserving “Import” for the planned future feature that converts non-ThreadWriter text/DOCX material.
- **Export** now groups DOCX, TXT, PNG, and PDF/Print instead of keeping four format buttons permanently visible.
- **Recent** remains top-level so locally saved conversations stay one tap/click away.
- Mobile now uses the same compact menu hierarchy rather than wrapping a large grid of controls across the top of the screen.
- No document-format changes in this release; v0.6.x `.threadwriter` files remain compatible.

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

The **Find** button searches message, narrative, and annotation text and highlights matching content. You can step through matches, replace the current match, replace all matches, and optionally use case-sensitive search.

Participant names are intentionally not altered by Find & Replace; rename a participant once in **Participants** and every message assigned to that participant updates automatically.

### Scene headers

**Header** adds optional centered text above the conversation. It can function as a chapter/scene title, date marker, group/channel name, transcript heading, or narrative interstitial. The header can use Rounded, Sans, Serif, or Mono typography.

### Conversation Styles

v0.6 introduces the first two presentation families:

- **Mobile Chat**: the familiar ThreadWriter left/right bubble layout.
- **Transcript**: the same underlying conversation presented as speaker-labelled dialogue blocks without literal message bubbles.

This is a presentation choice, not a separate document type. You can switch back and forth without changing the underlying text.

### Image export

**Image…** opens the v0.10 raster-export panel. It can create PNG, JPEG, or TIFF copies of the rendered thread, including the document title, optional scene header, timestamps, participant colors, images/link previews, and the selected Conversation Style.

Screen output is 1080 px wide; High Resolution is 2160 px; Print converts a physical width plus 300/600 DPI into pixels and writes that DPI metadata into the file; Custom accepts a pixel width. Any raster format can be exported in color or grayscale.

Long threads can split automatically at message or narrative-block boundaries. Multi-part results are delivered as one ZIP so browsers do not have to approve a stack of separate downloads.

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

- Optional richer snapshot policies / longer history once storage moves beyond localStorage
- Word-count breakdowns beyond the existing thread/project totals

### User interface

- Expand the Recent/local-document interface as Projects arrive

### Output / sharing

- Further PDF pagination refinements if real-world print testing exposes problems
- Possible ODT / SVG export only if actual users request them

### Projects

- Optional folders / nested organization if real-world use eventually demands it
- Optional project-level metadata beyond name, order, search, word count, and backups

### Authoring tools


### Import / migration

- Import existing TXT / Markdown / DOCX conversations, including speaker-labelled dialogue and two-person left/right-aligned drafts

### Presentation

- Core drafting styles: Theater Draft and Screen Draft
- Conversation background control: solid color or 2–4-color gradients with selectable direction
- Optional participant avatars
- Optional word-balloon tails
- Additional decorative Conversation Styles only if real-world demand justifies them

The guiding rule remains: ThreadWriter should make fictional digital conversations easier to write, not become a full messaging platform with a novel trapped inside it.
