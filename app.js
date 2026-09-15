(() => {
  const STORAGE_KEY = 'threadwriter.project.v1';
  const defaultState = () => ({
    version: 1,
    title: 'Untitled Thread',
    activeParticipantId: 'p1',
    participants: [
      { id: 'p1', name: 'Participant 1', side: 'left', color: '#d9e6ff' },
      { id: 'p2', name: 'Participant 2', side: 'right', color: '#c9f2d0' }
    ],
    messages: []
  });

  let state = loadState();
  let saveTimer = null;
  let timestampMessageId = null;

  const els = {
    title: document.getElementById('docTitle'),
    saveStatus: document.getElementById('saveStatus'),
    thread: document.getElementById('thread'),
    speakerStrip: document.getElementById('speakerStrip'),
    composer: document.getElementById('composer'),
    send: document.getElementById('sendBtn'),
    participantsBtn: document.getElementById('participantsBtn'),
    dialog: document.getElementById('participantsDialog'),
    editor: document.getElementById('participantsEditor'),
    template: document.getElementById('participantEditorTemplate'),
    addParticipant: document.getElementById('addParticipantBtn'),
    saveParticipants: document.getElementById('saveParticipantsBtn'),
    newBtn: document.getElementById('newBtn'),
    importBtn: document.getElementById('importBtn'),
    fileInput: document.getElementById('fileInput'),
    exportProjectBtn: document.getElementById('exportProjectBtn'),
    exportDocxBtn: document.getElementById('exportDocxBtn'),
    docxDialog: document.getElementById('docxDialog'),
    closeDocxDialogBtn: document.getElementById('closeDocxDialogBtn'),
    portableDocxBtn: document.getElementById('portableDocxBtn'),
    richDocxBtn: document.getElementById('richDocxBtn'),
    exportTxtBtn: document.getElementById('exportTxtBtn'),
    printBtn: document.getElementById('printBtn'),
    timestampDialog: document.getElementById('timestampDialog'),
    timestampInput: document.getElementById('timestampInput'),
    closeTimestampDialogBtn: document.getElementById('closeTimestampDialogBtn'),
    useMessageTimeBtn: document.getElementById('useMessageTimeBtn'),
    removeTimestampBtn: document.getElementById('removeTimestampBtn'),
    saveTimestampBtn: document.getElementById('saveTimestampBtn')
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.participants) || !Array.isArray(parsed.messages)) throw new Error('Bad project');
      return parsed;
    } catch {
      return defaultState();
    }
  }

  function scheduleSave() {
    els.saveStatus.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      els.saveStatus.textContent = 'Saved locally';
    }, 180);
  }

  function getParticipant(id) {
    return state.participants.find(p => p.id === id) || state.participants[0];
  }

  function ensureActiveParticipant() {
    if (!getParticipant(state.activeParticipantId)) {
      state.activeParticipantId = state.participants[0]?.id || null;
    }
  }

  function render() {
    ensureActiveParticipant();
    els.title.value = state.title || 'Untitled Thread';
    renderSpeakers();
    renderThread();
  }

  function renderSpeakers() {
    els.speakerStrip.innerHTML = '';
    state.participants.forEach((p, index) => {
      const b = document.createElement('button');
      b.className = 'speaker-chip' + (p.id === state.activeParticipantId ? ' active' : '');
      b.style.setProperty('--chip-color', p.color);
      b.textContent = `${index < 9 ? index + 1 + ' · ' : ''}${p.name}`;
      b.type = 'button';
      b.addEventListener('click', () => setActiveParticipant(p.id));
      els.speakerStrip.appendChild(b);
    });
  }

  function renderThread() {
    els.thread.innerHTML = '';
    if (!state.messages.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<strong>Your thread is empty.</strong><br>Choose a participant, type below, and press Enter. Tab switches speakers.';
      els.thread.appendChild(empty);
      return;
    }
    state.messages.forEach((msg, index) => {
      const p = getParticipant(msg.speakerId);
      if (!p) return;

      const previous = state.messages[index - 1];
      const continuesSpeaker = previous?.speakerId === msg.speakerId;

      const row = document.createElement('article');
      row.className = `message-row ${p.side}${continuesSpeaker ? ' continuation' : ' speaker-start'}${msg.displayTimestamp ? ' timestamped' : ''}`;
      row.dataset.messageId = msg.id;

      const card = document.createElement('div');
      card.className = 'message-card';

      if (!continuesSpeaker) {
        const label = document.createElement('div');
        label.className = 'speaker-label';
        label.textContent = p.name;
        card.appendChild(label);
      }

      const bubbleWrap = document.createElement('div');
      bubbleWrap.className = 'bubble-wrap';

      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.style.setProperty('--bubble-color', p.color);
      bubble.textContent = msg.text;
      bubble.tabIndex = 0;

      const actions = document.createElement('div');
      actions.className = 'message-actions';

      const menuButton = document.createElement('button');
      menuButton.type = 'button';
      menuButton.className = 'message-menu-button';
      menuButton.textContent = '⋯';
      menuButton.setAttribute('aria-label', `Options for ${p.name} message`);
      menuButton.setAttribute('aria-expanded', 'false');

      const menu = document.createElement('div');
      menu.className = 'message-menu';
      menu.hidden = true;
      menu.setAttribute('role', 'menu');

      const edit = makeToolButton('Edit', () => { closeMessageMenus(); startEditMessage(msg.id, bubble); });
      const swap = makeToolButton('Change speaker', () => { closeMessageMenus(); cycleMessageSpeaker(msg.id); });
      const timestamp = makeToolButton(msg.displayTimestamp ? 'Edit timestamp…' : 'Add timestamp…', () => { closeMessageMenus(); openTimestampDialog(msg.id); });
      const del = makeToolButton('Delete', () => { closeMessageMenus(); deleteMessage(msg.id); }, true);
      menu.append(edit, swap, timestamp, del);

      menuButton.addEventListener('click', e => {
        e.stopPropagation();
        const opening = menu.hidden;
        closeMessageMenus();
        menu.hidden = !opening;
        menuButton.setAttribute('aria-expanded', String(opening));
      });
      menu.addEventListener('click', e => e.stopPropagation());

      actions.append(menuButton, menu);
      bubbleWrap.append(bubble, actions);
      card.appendChild(bubbleWrap);

      if (msg.displayTimestamp) {
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = msg.displayTimestamp;
        card.appendChild(timestamp);
      }

      row.appendChild(card);
      els.thread.appendChild(row);
    });
  }

  function makeToolButton(label, action, destructive = false) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('role', 'menuitem');
    if (destructive) b.classList.add('destructive');
    b.addEventListener('click', action);
    return b;
  }

  function closeMessageMenus() {
    document.querySelectorAll('.message-menu:not([hidden])').forEach(menu => {
      menu.hidden = true;
      menu.parentElement?.querySelector('.message-menu-button')?.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', closeMessageMenus);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMessageMenus();
  });

  function startEditMessage(id, bubble) {
    const msg = state.messages.find(m => m.id === id);
    if (!msg) return;
    const editing = bubble.contentEditable === 'true';
    if (editing) {
      msg.text = bubble.textContent.trimEnd();
      bubble.contentEditable = 'false';
      scheduleSave();
      renderThread();
      return;
    }
    bubble.contentEditable = 'true';
    bubble.focus();
    placeCaretAtEnd(bubble);
    const finish = () => {
      msg.text = bubble.textContent.trimEnd();
      bubble.contentEditable = 'false';
      scheduleSave();
      renderThread();
    };
    bubble.addEventListener('blur', finish, { once: true });
    bubble.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        bubble.blur();
      }
    });
  }

  function placeCaretAtEnd(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function cycleMessageSpeaker(id) {
    if (state.participants.length < 2) return;
    const msg = state.messages.find(m => m.id === id);
    const idx = state.participants.findIndex(p => p.id === msg.speakerId);
    msg.speakerId = state.participants[(idx + 1) % state.participants.length].id;
    scheduleSave();
    renderThread();
  }

  function deleteMessage(id) {
    state.messages = state.messages.filter(m => m.id !== id);
    scheduleSave();
    renderThread();
  }

  function openTimestampDialog(id) {
    const msg = state.messages.find(m => m.id === id);
    if (!msg) return;
    timestampMessageId = id;
    els.timestampInput.value = msg.displayTimestamp || '';
    els.removeTimestampBtn.disabled = !msg.displayTimestamp;
    els.timestampDialog.showModal();
    requestAnimationFrame(() => {
      els.timestampInput.focus();
      els.timestampInput.select();
    });
  }

  function closeTimestampDialog() {
    timestampMessageId = null;
    if (els.timestampDialog.open) els.timestampDialog.close();
  }

  function formatMessageTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  }

  els.closeTimestampDialogBtn.addEventListener('click', closeTimestampDialog);
  els.useMessageTimeBtn.addEventListener('click', () => {
    const msg = state.messages.find(m => m.id === timestampMessageId);
    if (!msg) return;
    els.timestampInput.value = formatMessageTime(msg.createdAt);
    els.timestampInput.focus();
  });
  els.removeTimestampBtn.addEventListener('click', () => {
    const msg = state.messages.find(m => m.id === timestampMessageId);
    if (!msg) return closeTimestampDialog();
    delete msg.displayTimestamp;
    scheduleSave();
    renderThread();
    closeTimestampDialog();
  });
  els.saveTimestampBtn.addEventListener('click', () => {
    const msg = state.messages.find(m => m.id === timestampMessageId);
    if (!msg) return closeTimestampDialog();
    const value = els.timestampInput.value.trim();
    if (value) msg.displayTimestamp = value;
    else delete msg.displayTimestamp;
    scheduleSave();
    renderThread();
    closeTimestampDialog();
  });
  els.timestampInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      els.saveTimestampBtn.click();
    }
  });

  function setActiveParticipant(id, focus = true) {
    state.activeParticipantId = id;
    scheduleSave();
    renderSpeakers();
    if (focus) els.composer.focus();
  }

  function cycleSpeaker(direction = 1) {
    if (!state.participants.length) return;
    const idx = Math.max(0, state.participants.findIndex(p => p.id === state.activeParticipantId));
    const next = (idx + direction + state.participants.length) % state.participants.length;
    setActiveParticipant(state.participants[next].id);
  }

  function addMessage() {
    const text = els.composer.value.trimEnd();
    if (!text.trim() || !state.activeParticipantId) return;
    state.messages.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      speakerId: state.activeParticipantId,
      text,
      createdAt: new Date().toISOString()
    });
    els.composer.value = '';
    autoSizeComposer();
    scheduleSave();
    renderThread();
    requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  }

  function autoSizeComposer() {
    els.composer.style.height = 'auto';
    els.composer.style.height = Math.min(els.composer.scrollHeight, window.innerHeight * .28) + 'px';
  }

  els.composer.addEventListener('input', autoSizeComposer);
  els.composer.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      cycleSpeaker(e.shiftKey ? -1 : 1);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addMessage();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
      const p = state.participants[Number(e.key) - 1];
      if (p) {
        e.preventDefault();
        setActiveParticipant(p.id);
      }
    }
  });
  els.send.addEventListener('click', addMessage);

  els.title.addEventListener('input', () => {
    state.title = els.title.value;
    scheduleSave();
  });

  els.participantsBtn.addEventListener('click', openParticipantsDialog);
  function openParticipantsDialog() {
    els.editor.innerHTML = '';
    state.participants.forEach(p => appendParticipantEditor(p));
    els.dialog.showModal();
  }

  function appendParticipantEditor(participant = null) {
    const node = els.template.content.firstElementChild.cloneNode(true);
    const p = participant || {
      id: crypto.randomUUID ? crypto.randomUUID() : 'p' + Date.now(),
      name: `Participant ${state.participants.length + 1}`,
      side: state.participants.length % 2 ? 'right' : 'left',
      color: '#e5e5ea'
    };
    node.dataset.id = p.id;
    node.querySelector('.participant-name').value = p.name;
    node.querySelector('.participant-side').value = p.side;
    node.querySelector('.participant-color').value = p.color;
    node.querySelector('.remove-participant').addEventListener('click', () => {
      if (els.editor.children.length <= 1) return;
      node.remove();
    });
    els.editor.appendChild(node);
  }

  els.addParticipant.addEventListener('click', () => appendParticipantEditor());
  els.saveParticipants.addEventListener('click', e => {
    e.preventDefault();
    const rows = [...els.editor.querySelectorAll('.participant-edit-row')];
    const newParticipants = rows.map((row, idx) => ({
      id: row.dataset.id || 'p' + Date.now() + idx,
      name: row.querySelector('.participant-name').value.trim() || `Participant ${idx + 1}`,
      side: row.querySelector('.participant-side').value,
      color: row.querySelector('.participant-color').value
    }));
    const validIds = new Set(newParticipants.map(p => p.id));
    const fallbackId = newParticipants[0].id;
    state.messages.forEach(m => { if (!validIds.has(m.speakerId)) m.speakerId = fallbackId; });
    state.participants = newParticipants;
    ensureActiveParticipant();
    scheduleSave();
    render();
    els.dialog.close();
  });

  els.newBtn.addEventListener('click', () => {
    if (!confirm('Start a new thread? Export your current project first if you want a separate backup.')) return;
    state = defaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
    els.composer.value = '';
    els.composer.focus();
  });

  els.importBtn.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', async () => {
    const file = els.fileInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.participants) || !Array.isArray(parsed.messages)) throw new Error('Not a Threadwriter project');
      state = parsed;
      scheduleSave();
      render();
    } catch (err) {
      alert(`Could not import this file: ${err.message}`);
    } finally {
      els.fileInput.value = '';
    }
  });

  els.exportProjectBtn.addEventListener('click', () => {
    downloadBlob(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), `${safeName(state.title)}.threadwriter`);
  });

  els.exportTxtBtn.addEventListener('click', () => {
    const txt = buildTranscript();
    downloadBlob(new Blob([txt], { type: 'text/plain;charset=utf-8' }), `${safeName(state.title)}.txt`);
  });

  els.exportDocxBtn.addEventListener('click', () => els.docxDialog.showModal());
  els.closeDocxDialogBtn.addEventListener('click', () => els.docxDialog.close());
  els.portableDocxBtn.addEventListener('click', () => exportDocx('portable'));
  els.richDocxBtn.addEventListener('click', () => exportDocx('rich'));

  async function exportDocx(mode) {
    try {
      const blob = mode === 'rich' ? await buildRichDocx() : await buildPortableDocx();
      const suffix = mode === 'rich' ? '-rich' : '';
      downloadBlob(blob, `${safeName(state.title)}${suffix}.docx`);
      els.docxDialog.close();
    } catch (err) {
      console.error(err);
      alert('DOCX export failed in this browser. TXT export and Print/PDF are still available.');
    }
  }

  els.printBtn.addEventListener('click', () => window.print());

  function safeName(name) {
    return (name || 'thread').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'thread';
  }

  function buildTranscript() {
    const lines = [state.title || 'Untitled Thread', ''];
    state.messages.forEach(m => {
      const p = getParticipant(m.speakerId);
      const stamp = m.displayTimestamp ? ` [${m.displayTimestamp}]` : '';
      lines.push(`${p?.name || 'Unknown'}${stamp}: ${m.text}`, '');
    });
    return lines.join('\n');
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function xmlEscape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function textRuns(text) {
    return String(text).split('\n').map((line, idx) => {
      const run = `<w:r><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
      return idx === 0 ? run : `<w:r><w:br/></w:r>${run}`;
    }).join('');
  }

  function sanitizeHexColor(color, fallback = 'E5E5EA') {
    const match = String(color || '').trim().match(/^#?([0-9a-fA-F]{6})$/);
    return match ? match[1].toUpperCase() : fallback;
  }

  function documentPackage(documentXml, stylesXml) {
    const files = {
      '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
      '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
      'word/document.xml': documentXml,
      'word/styles.xml': stylesXml,
      'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    };
    return new Blob([makeStoredZip(files)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  const baseStylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:pPr><w:spacing w:after="240"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr>
  </w:style>
</w:styles>`;

  async function buildPortableDocx() {
    const paragraphs = [];
    paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${xmlEscape(state.title || 'Untitled Thread')}</w:t></w:r></w:p>`);
    for (const m of state.messages) {
      const p = getParticipant(m.speakerId);
      const timestampRun = m.displayTimestamp ? `<w:r><w:rPr><w:i/><w:color w:val="6D6D78"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t xml:space="preserve">  ${xmlEscape(m.displayTimestamp)}</w:t></w:r>` : '';
      paragraphs.push(`<w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${xmlEscape(p?.name || 'Unknown')}</w:t></w:r>${timestampRun}</w:p>`);
      paragraphs.push(`<w:p><w:pPr><w:spacing w:after="180"/></w:pPr>${textRuns(m.text)}</w:p>`);
    }

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join('\n')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    return documentPackage(documentXml, baseStylesXml);
  }

  function estimateBubblePercent(text) {
    const lines = String(text).split('\n');
    const longest = Math.max(1, ...lines.map(line => line.length));
    const total = Math.max(1, String(text).length);
    const visualLength = Math.max(longest, Math.min(72, Math.ceil(total * 0.7)));
    return Math.max(20, Math.min(68, Math.round(18 + visualLength * 0.78)));
  }

  function richTextRuns(text) {
    return String(text).split('\n').map((line, idx) => {
      const run = `<w:r><w:rPr><w:color w:val="111116"/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
      return idx === 0 ? run : `<w:r><w:br/></w:r>${run}`;
    }).join('');
  }

  function emptyCell(width) {
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr><w:p/></w:tc>`;
  }

  function labelCell(name, side) {
    return `<w:tc>
      <w:tcPr><w:tcW w:w="10080" w:type="dxa"/><w:gridSpan w:val="2"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>
      <w:p><w:pPr><w:jc w:val="${side === 'right' ? 'right' : 'left'}"/><w:spacing w:before="0" w:after="35"/></w:pPr><w:r><w:rPr><w:color w:val="6D6D78"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>${xmlEscape(name)}</w:t></w:r></w:p>
    </w:tc>`;
  }

  function bubbleCell(width, text, fill) {
    return `<w:tc>
      <w:tcPr>
        <w:tcW w:w="${width}" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
        <w:tcMar><w:top w:w="115" w:type="dxa"/><w:left w:w="165" w:type="dxa"/><w:bottom w:w="115" w:type="dxa"/><w:right w:w="165" w:type="dxa"/></w:tcMar>
        <w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>
        <w:vAlign w:val="center"/>
      </w:tcPr>
      <w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="300" w:lineRule="auto"/></w:pPr>${richTextRuns(text)}</w:p>
    </w:tc>`;
  }

  function timestampCell(width, text, side) {
    return `<w:tc>
      <w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>
      <w:p><w:pPr><w:jc w:val="${side === 'right' ? 'right' : 'left'}"/><w:spacing w:before="35" w:after="0"/></w:pPr><w:r><w:rPr><w:color w:val="7A7A84"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>${xmlEscape(text)}</w:t></w:r></w:p>
    </w:tc>`;
  }

  function richMessageTable(message, participant, continuesSpeaker) {
    const CONTENT_WIDTH = 10080;
    const bubbleWidth = Math.round(CONTENT_WIDTH * estimateBubblePercent(message.text) / 100);
    const spacerWidth = CONTENT_WIDTH - bubbleWidth;
    const side = participant?.side === 'right' ? 'right' : 'left';
    const fill = sanitizeHexColor(participant?.color);
    const name = participant?.name || 'Unknown';
    const firstWidth = side === 'left' ? bubbleWidth : spacerWidth;
    const secondWidth = CONTENT_WIDTH - firstWidth;
    const grid = `<w:tblGrid><w:gridCol w:w="${firstWidth}"/><w:gridCol w:w="${secondWidth}"/></w:tblGrid>`;
    const labelRow = continuesSpeaker ? '' : `<w:tr><w:trPr><w:cantSplit/></w:trPr>${labelCell(name, side)}</w:tr>`;
    const bubbleRow = `<w:tr><w:trPr><w:cantSplit/></w:trPr>${side === 'left' ? `${bubbleCell(bubbleWidth, message.text, fill)}${emptyCell(spacerWidth)}` : `${emptyCell(spacerWidth)}${bubbleCell(bubbleWidth, message.text, fill)}`}</w:tr>`;
    const timestampRow = message.displayTimestamp ? `<w:tr><w:trPr><w:cantSplit/></w:trPr>${side === 'left' ? `${timestampCell(bubbleWidth, message.displayTimestamp, side)}${emptyCell(spacerWidth)}` : `${emptyCell(spacerWidth)}${timestampCell(bubbleWidth, message.displayTimestamp, side)}`}</w:tr>` : '';
    const gap = continuesSpeaker ? 35 : 115;

    return `<w:p><w:pPr><w:spacing w:before="0" w:after="${gap}"/></w:pPr></w:p>
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="10080" w:type="dxa"/>
    <w:tblLayout w:type="fixed"/>
    <w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>
    <w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar>
  </w:tblPr>
  ${grid}
  ${labelRow}
  ${bubbleRow}
  ${timestampRow}
</w:tbl>`;
  }

  async function buildRichDocx() {
    const blocks = [];
    blocks.push(`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${xmlEscape(state.title || 'Untitled Thread')}</w:t></w:r></w:p>`);
    state.messages.forEach((m, index) => {
      const p = getParticipant(m.speakerId);
      const previous = state.messages[index - 1];
      const continuesSpeaker = previous?.speakerId === m.speakerId;
      blocks.push(richMessageTable(m, p, continuesSpeaker));
    });

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${blocks.join('\n')}
    <w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    return documentPackage(documentXml, baseStylesXml);
  }

  function makeStoredZip(files) {
    const encoder = new TextEncoder();
    const entries = [];
    let offset = 0;
    const localParts = [];

    for (const [name, content] of Object.entries(files)) {
      const nameBytes = encoder.encode(name);
      const data = encoder.encode(content);
      const crc = crc32(data);
      const local = new Uint8Array(30 + nameBytes.length + data.length);
      const view = new DataView(local.buffer);
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0x0800, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, data.length, true);
      view.setUint32(22, data.length, true);
      view.setUint16(26, nameBytes.length, true);
      view.setUint16(28, 0, true);
      local.set(nameBytes, 30);
      local.set(data, 30 + nameBytes.length);
      localParts.push(local);
      entries.push({ nameBytes, data, crc, offset });
      offset += local.length;
    }

    const centralParts = [];
    let centralSize = 0;
    for (const e of entries) {
      const c = new Uint8Array(46 + e.nameBytes.length);
      const v = new DataView(c.buffer);
      v.setUint32(0, 0x02014b50, true);
      v.setUint16(4, 20, true);
      v.setUint16(6, 20, true);
      v.setUint16(8, 0x0800, true);
      v.setUint16(10, 0, true);
      v.setUint16(12, 0, true);
      v.setUint16(14, 0, true);
      v.setUint32(16, e.crc, true);
      v.setUint32(20, e.data.length, true);
      v.setUint32(24, e.data.length, true);
      v.setUint16(28, e.nameBytes.length, true);
      v.setUint16(30, 0, true);
      v.setUint16(32, 0, true);
      v.setUint16(34, 0, true);
      v.setUint16(36, 0, true);
      v.setUint32(38, 0, true);
      v.setUint32(42, e.offset, true);
      c.set(e.nameBytes, 46);
      centralParts.push(c);
      centralSize += c.length;
    }

    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    const total = offset + centralSize + end.length;
    const out = new Uint8Array(total);
    let pos = 0;
    [...localParts, ...centralParts, end].forEach(part => { out.set(part, pos); pos += part.length; });
    return out;
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (const b of bytes) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  render();
  autoSizeComposer();
})();
