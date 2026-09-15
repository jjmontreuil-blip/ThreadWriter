# Threadwriter v0.5.1

A small local-first dialogue editor that looks and behaves like an instant-message thread.

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
- Two `.docx` export modes with no external libraries: Portable transcript and Rich chat-layout
- Plain `.txt` transcript export
- Print stylesheet for browser Print / Save as PDF
- Consecutive messages from the same participant are visually grouped under one speaker label
- Compact per-message overflow menu for edit, speaker reassignment, optional timestamp, and delete
- Phone-sized screens present message actions as a bottom action sheet so controls never open offscreen
- Optional editable per-message timestamps, including free-form story labels such as “two hours later”
- Timestamped messages gain a little extra spacing before them to visually signal that time has passed
- Timestamps carry through TXT, Portable DOCX, Rich DOCX, and Print/PDF exports
- Installable PWA behavior when served over HTTP/HTTPS

## Running it

### Easiest desktop test
Open `index.html` directly in a modern browser. Editing, autosave, DOCX/TXT export, and Print/PDF should work.

### For installable/offline PWA behavior
Serve the folder locally, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/` in your browser. Service-worker/offline installation features require HTTP/HTTPS rather than `file://`.

## DOCX export modes

**Portable DOCX** exports ordinary paragraphs with bold speaker names. It is the safest choice when the next step is substantial editing in Word, LibreOffice, Pages, or Google Docs.

**Rich DOCX** preserves the thread's left/right message layout, participant colors, speaker grouping, and message-bubble feel using ordinary editable Word tables. It intentionally uses shaded table cells rather than floating drawing shapes, so the file remains much more portable across word processors. Rounded bubble corners are not preserved because that would require less-compatible drawing objects.

## v0.5.1 changes

- Mobile-safe message action sheet on narrow screens
- Timestamp spacing corrected so the visual pause falls *before* the timestamped message rather than after it
- Same-speaker messages following a timestamp tuck back into the normal conversational rhythm
- Matching timestamp-gap behavior in Rich DOCX / print-friendly layout

## Possible future ideas

- Optional image attachments and faux link previews
- Scene / chapter organization
- Drag-to-reorder messages
- Markdown export
- Automatic backups / version history
- Find/replace
- Dialogue-only drafting mode separate from literal texting mode
