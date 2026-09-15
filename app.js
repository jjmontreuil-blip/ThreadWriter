(() => {
  const STORAGE_KEY = 'threadwriter.project.v1';
  const defaultState = () => ({
    version: 2,
    title: 'Untitled Thread',
    sceneHeader: '',
    headerFont: 'rounded',
    conversationStyle: 'chat',
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
  const findState = { query: '', replacement: '', caseSensitive: false, matches: [], current: 0 };

  const els = {
    title: document.getElementById('docTitle'),
    saveStatus: document.getElementById('saveStatus'),
    thread: document.getElementById('thread'),
    speakerStrip: document.getElementById('speakerStrip'),
    composer: document.getElementById('composer'),
    send: document.getElementById('sendBtn'),
    participantsBtn: document.getElementById('participantsBtn'),
    headerBtn: document.getElementById('headerBtn'),
    conversationStyle: document.getElementById('conversationStyle'),
    findBtn: document.getElementById('findBtn'),
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
    exportPngBtn: document.getElementById('exportPngBtn'),
    printBtn: document.getElementById('printBtn'),
    timestampDialog: document.getElementById('timestampDialog'),
    timestampInput: document.getElementById('timestampInput'),
    closeTimestampDialogBtn: document.getElementById('closeTimestampDialogBtn'),
    useMessageTimeBtn: document.getElementById('useMessageTimeBtn'),
    removeTimestampBtn: document.getElementById('removeTimestampBtn'),
    saveTimestampBtn: document.getElementById('saveTimestampBtn'),
    headerDialog: document.getElementById('headerDialog'),
    headerInput: document.getElementById('headerInput'),
    headerFont: document.getElementById('headerFont'),
    closeHeaderDialogBtn: document.getElementById('closeHeaderDialogBtn'),
    removeHeaderBtn: document.getElementById('removeHeaderBtn'),
    saveHeaderBtn: document.getElementById('saveHeaderBtn'),
    findDialog: document.getElementById('findDialog'),
    closeFindDialogBtn: document.getElementById('closeFindDialogBtn'),
    findInput: document.getElementById('findInput'),
    replaceInput: document.getElementById('replaceInput'),
    caseSensitiveFind: document.getElementById('caseSensitiveFind'),
    findStatus: document.getElementById('findStatus'),
    findPrevBtn: document.getElementById('findPrevBtn'),
    findNextBtn: document.getElementById('findNextBtn'),
    replaceCurrentBtn: document.getElementById('replaceCurrentBtn'),
    replaceAllBtn: document.getElementById('replaceAllBtn')
  };

  function normalizeState(project) {
    const base = defaultState();
    if (!project || !Array.isArray(project.participants) || !Array.isArray(project.messages)) throw new Error('Bad project');
    const allowedFonts = new Set(['rounded', 'sans', 'serif', 'mono']);
    return {
      ...project,
      version: 2,
      title: typeof project.title === 'string' ? project.title : base.title,
      sceneHeader: typeof project.sceneHeader === 'string' ? project.sceneHeader : '',
      headerFont: allowedFonts.has(project.headerFont) ? project.headerFont : 'rounded',
      conversationStyle: project.conversationStyle === 'transcript' ? 'transcript' : 'chat',
      activeParticipantId: project.activeParticipantId || project.participants[0]?.id || null,
      participants: project.participants.map((p, index) => ({
        id: p.id || `p${index + 1}`,
        name: typeof p.name === 'string' && p.name.trim() ? p.name : `Participant ${index + 1}`,
        side: p.side === 'right' ? 'right' : 'left',
        color: /^#?[0-9a-fA-F]{6}$/.test(String(p.color || '')) ? (String(p.color).startsWith('#') ? p.color : `#${p.color}`) : '#e5e5ea'
      })),
      messages: project.messages.map((m, index) => ({
        ...m,
        id: m.id || `m${Date.now()}-${index}`,
        text: typeof m.text === 'string' ? m.text : String(m.text ?? ''),
        createdAt: m.createdAt || new Date().toISOString()
      }))
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return normalizeState(JSON.parse(raw));
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
    els.conversationStyle.value = state.conversationStyle || 'chat';
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
    els.thread.classList.toggle('style-transcript', state.conversationStyle === 'transcript');

    if (state.sceneHeader) {
      const header = document.createElement('div');
      header.className = `scene-header font-${state.headerFont || 'rounded'}`;
      header.textContent = state.sceneHeader;
      header.tabIndex = 0;
      header.title = 'Edit scene header';
      header.addEventListener('click', openHeaderDialog);
      header.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openHeaderDialog();
        }
      });
      els.thread.appendChild(header);
    }

    if (!state.messages.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<strong>Your thread is empty.</strong><br>Choose a participant, type below, and press Enter. Tab switches speakers.';
      els.thread.appendChild(empty);
      return;
    }

    if (findState.query) findState.matches = computeFindMatches();
    const matchingIds = new Set(findState.matches.map(match => match.messageId));
    const currentMatch = findState.matches[findState.current];

    state.messages.forEach((msg, index) => {
      const p = getParticipant(msg.speakerId);
      if (!p) return;

      const previous = state.messages[index - 1];
      const continuesSpeaker = previous?.speakerId === msg.speakerId;
      const showSpeakerLabel = state.conversationStyle === 'transcript' || !continuesSpeaker;

      const row = document.createElement('article');
      row.className = `message-row ${p.side}${continuesSpeaker ? ' continuation' : ' speaker-start'}${msg.displayTimestamp ? ' timestamped' : ''}`;
      if (matchingIds.has(msg.id)) row.classList.add('find-match');
      if (currentMatch?.messageId === msg.id) row.classList.add('find-current');
      row.dataset.messageId = msg.id;

      const card = document.createElement('div');
      card.className = 'message-card';

      if (showSpeakerLabel) {
        const label = document.createElement('div');
        label.className = 'speaker-label';
        label.textContent = p.name;
        card.appendChild(label);
      }

      if (msg.displayTimestamp) {
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = msg.displayTimestamp;
        card.appendChild(timestamp);
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
      const moveUp = makeToolButton('Move up', () => { closeMessageMenus(); moveMessage(msg.id, -1); });
      const moveDown = makeToolButton('Move down', () => { closeMessageMenus(); moveMessage(msg.id, 1); });
      moveUp.disabled = index === 0;
      moveDown.disabled = index === state.messages.length - 1;
      const del = makeToolButton('Delete', () => { closeMessageMenus(); deleteMessage(msg.id); }, true);
      menu.append(edit, swap, timestamp, moveUp, moveDown, del);

      menuButton.addEventListener('click', e => {
        e.stopPropagation();
        const opening = menu.hidden;
        closeMessageMenus();
        menu.hidden = !opening;
        menuButton.setAttribute('aria-expanded', String(opening));
        if (opening) requestAnimationFrame(() => positionMessageMenu(menu, menuButton, row));
      });
      menu.addEventListener('click', e => e.stopPropagation());

      actions.append(menuButton, menu);
      bubbleWrap.append(bubble, actions);
      card.appendChild(bubbleWrap);

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

  function moveMessage(id, direction) {
    const index = state.messages.findIndex(message => message.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= state.messages.length) return;

    const [message] = state.messages.splice(index, 1);
    state.messages.splice(target, 0, message);
    scheduleSave();
    renderThread();
  }

  function positionMessageMenu(menu, button, row) {
    if (!window.matchMedia('(max-width: 700px)').matches) return;

    const vv = window.visualViewport;
    const viewLeft = vv?.offsetLeft || 0;
    const viewTop = vv?.offsetTop || 0;
    const viewWidth = vv?.width || window.innerWidth;
    const viewHeight = vv?.height || window.innerHeight;
    const pad = 8;
    const gap = 5;
    const buttonRect = button.getBoundingClientRect();

    // A transformed message-actions parent changes the containing block for CSS fixed
    // positioning. Move the open mobile popover to <body> so viewport clamping is real.
    menu._threadwriterHome = menu.parentElement;
    menu._threadwriterButton = button;
    document.body.appendChild(menu);
    menu.style.position = 'fixed';
    menu.style.right = 'auto';
    menu.style.bottom = 'auto';
    menu.style.zIndex = '100';

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    let left = row.classList.contains('right')
      ? buttonRect.left - menuWidth - gap
      : buttonRect.right + gap;
    left = Math.max(viewLeft + pad, Math.min(left, viewLeft + viewWidth - menuWidth - pad));

    let top = buttonRect.top + (buttonRect.height - menuHeight) / 2;
    top = Math.max(viewTop + pad, Math.min(top, viewTop + viewHeight - menuHeight - pad));

    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
  }

  function clearMessageMenuPosition(menu) {
    menu.style.position = '';
    menu.style.left = '';
    menu.style.right = '';
    menu.style.top = '';
    menu.style.bottom = '';
    menu.style.zIndex = '';
    if (menu._threadwriterHome?.isConnected) menu._threadwriterHome.appendChild(menu);
    delete menu._threadwriterHome;
  }

  function closeMessageMenus() {
    document.querySelectorAll('.message-menu:not([hidden])').forEach(menu => {
      menu.hidden = true;
      menu._threadwriterButton?.setAttribute('aria-expanded', 'false');
      delete menu._threadwriterButton;
      clearMessageMenuPosition(menu);
    });
  }

  document.addEventListener('click', closeMessageMenus);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMessageMenus();
  });
  window.addEventListener('resize', closeMessageMenus);
  window.addEventListener('scroll', closeMessageMenus, { passive: true });
  window.visualViewport?.addEventListener('resize', closeMessageMenus);
  window.visualViewport?.addEventListener('scroll', closeMessageMenus);

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

  function openHeaderDialog() {
    els.headerInput.value = state.sceneHeader || '';
    els.headerFont.value = state.headerFont || 'rounded';
    els.removeHeaderBtn.disabled = !state.sceneHeader;
    els.headerDialog.showModal();
    requestAnimationFrame(() => els.headerInput.focus());
  }

  function closeHeaderDialog() {
    if (els.headerDialog.open) els.headerDialog.close();
  }

  els.headerBtn.addEventListener('click', openHeaderDialog);
  els.closeHeaderDialogBtn.addEventListener('click', closeHeaderDialog);
  els.saveHeaderBtn.addEventListener('click', () => {
    state.sceneHeader = els.headerInput.value.trim();
    state.headerFont = els.headerFont.value;
    scheduleSave();
    renderThread();
    closeHeaderDialog();
  });
  els.removeHeaderBtn.addEventListener('click', () => {
    state.sceneHeader = '';
    state.headerFont = els.headerFont.value;
    scheduleSave();
    renderThread();
    closeHeaderDialog();
  });

  els.conversationStyle.addEventListener('change', () => {
    state.conversationStyle = els.conversationStyle.value === 'transcript' ? 'transcript' : 'chat';
    scheduleSave();
    renderThread();
  });

  function computeFindMatches() {
    const query = findState.query;
    if (!query) return [];
    const needle = findState.caseSensitive ? query : query.toLocaleLowerCase();
    const matches = [];
    state.messages.forEach(message => {
      const haystack = findState.caseSensitive ? message.text : message.text.toLocaleLowerCase();
      let from = 0;
      while (from <= haystack.length) {
        const at = haystack.indexOf(needle, from);
        if (at === -1) break;
        matches.push({ messageId: message.id, start: at, length: query.length });
        from = at + Math.max(1, query.length);
      }
    });
    return matches;
  }

  function refreshFindMatches({ preserveCurrent = true, scroll = false } = {}) {
    const oldMatch = preserveCurrent ? findState.matches[findState.current] : null;
    findState.query = els.findInput.value;
    findState.replacement = els.replaceInput.value;
    findState.caseSensitive = els.caseSensitiveFind.checked;
    findState.matches = computeFindMatches();

    if (!findState.matches.length) {
      findState.current = 0;
    } else if (oldMatch) {
      const same = findState.matches.findIndex(match => match.messageId === oldMatch.messageId && match.start === oldMatch.start);
      findState.current = same >= 0 ? same : Math.min(findState.current, findState.matches.length - 1);
    } else {
      findState.current = Math.min(findState.current, findState.matches.length - 1);
    }

    if (!findState.query) els.findStatus.textContent = 'Enter text to search.';
    else if (!findState.matches.length) els.findStatus.textContent = 'No matches.';
    else els.findStatus.textContent = `${findState.current + 1} of ${findState.matches.length} matches`;

    renderThread();
    if (scroll) scrollToCurrentFindMatch();
  }

  function scrollToCurrentFindMatch() {
    const match = findState.matches[findState.current];
    if (!match) return;
    const row = [...els.thread.querySelectorAll('.message-row')].find(el => el.dataset.messageId === match.messageId);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function stepFind(direction) {
    refreshFindMatches({ preserveCurrent: true });
    if (!findState.matches.length) return;
    findState.current = (findState.current + direction + findState.matches.length) % findState.matches.length;
    els.findStatus.textContent = `${findState.current + 1} of ${findState.matches.length} matches`;
    renderThread();
    scrollToCurrentFindMatch();
  }

  function replaceCurrentFind() {
    refreshFindMatches({ preserveCurrent: true });
    const match = findState.matches[findState.current];
    if (!match) return;
    const message = state.messages.find(item => item.id === match.messageId);
    if (!message) return;
    message.text = message.text.slice(0, match.start) + els.replaceInput.value + message.text.slice(match.start + match.length);
    scheduleSave();
    findState.matches = computeFindMatches();
    if (findState.current >= findState.matches.length) findState.current = Math.max(0, findState.matches.length - 1);
    renderThread();
    refreshFindMatches({ preserveCurrent: false, scroll: true });
  }

  function replaceAllFind() {
    refreshFindMatches({ preserveCurrent: true });
    if (!findState.query || !findState.matches.length) return;
    const escaped = findState.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = findState.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(escaped, flags);
    let count = 0;
    state.messages.forEach(message => {
      message.text = message.text.replace(regex, () => {
        count += 1;
        return els.replaceInput.value;
      });
    });
    scheduleSave();
    findState.matches = [];
    findState.current = 0;
    renderThread();
    refreshFindMatches({ preserveCurrent: false });
    els.findStatus.textContent = `Replaced ${count} ${count === 1 ? 'match' : 'matches'}.`;
  }

  function openFindDialog() {
    els.findDialog.showModal();
    requestAnimationFrame(() => {
      els.findInput.focus();
      els.findInput.select();
      refreshFindMatches({ preserveCurrent: false });
    });
  }

  function closeFindDialog() {
    if (els.findDialog.open) els.findDialog.close();
    findState.query = '';
    findState.matches = [];
    findState.current = 0;
    renderThread();
  }

  els.findBtn.addEventListener('click', openFindDialog);
  els.closeFindDialogBtn.addEventListener('click', closeFindDialog);
  els.findInput.addEventListener('input', () => refreshFindMatches({ preserveCurrent: false }));
  els.replaceInput.addEventListener('input', () => { findState.replacement = els.replaceInput.value; });
  els.caseSensitiveFind.addEventListener('change', () => refreshFindMatches({ preserveCurrent: false }));
  els.findPrevBtn.addEventListener('click', () => stepFind(-1));
  els.findNextBtn.addEventListener('click', () => stepFind(1));
  els.replaceCurrentBtn.addEventListener('click', replaceCurrentFind);
  els.replaceAllBtn.addEventListener('click', replaceAllFind);
  els.findInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      stepFind(e.shiftKey ? -1 : 1);
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
      state = normalizeState(parsed);
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

  els.exportPngBtn.addEventListener('click', exportPng);

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
    if (state.sceneHeader) lines.push(state.sceneHeader, '');
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

  function headerCanvasFont(size, weight = 700) {
    const family = {
      serif: 'Georgia, serif',
      sans: 'Arial, sans-serif',
      mono: 'Consolas, monospace',
      rounded: '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif'
    }[state.headerFont] || '"Trebuchet MS", sans-serif';
    return `${weight} ${size}px ${family}`;
  }

  function wrapCanvasText(ctx, text, maxWidth) {
    const result = [];
    const paragraphs = String(text).split('\n');

    const splitLongToken = token => {
      const pieces = [];
      let current = '';
      for (const char of token) {
        const next = current + char;
        if (current && ctx.measureText(next).width > maxWidth) {
          pieces.push(current);
          current = char;
        } else current = next;
      }
      if (current) pieces.push(current);
      return pieces;
    };

    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (!paragraph.length) {
        result.push('');
        return;
      }
      const rawTokens = paragraph.split(/\s+/);
      const tokens = rawTokens.flatMap(token => ctx.measureText(token).width > maxWidth ? splitLongToken(token) : [token]);
      let line = '';
      tokens.forEach(token => {
        const test = line ? `${line} ${token}` : token;
        if (line && ctx.measureText(test).width > maxWidth) {
          result.push(line);
          line = token;
        } else line = test;
      });
      if (line) result.push(line);
      if (paragraphIndex < paragraphs.length - 1 && paragraph === '') result.push('');
    });
    return result.length ? result : [''];
  }

  function roundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function paintPngThread(ctx, draw = false) {
    const W = 1080;
    const left = 72;
    const right = 72;
    const contentWidth = W - left - right;
    const maxBubbleWidth = contentWidth * 0.67;
    let y = 64;

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    ctx.font = '700 36px "Trebuchet MS", Arial, sans-serif';
    const titleLines = wrapCanvasText(ctx, state.title || 'Untitled Thread', contentWidth);
    if (draw) {
      ctx.fillStyle = '#17171b';
      titleLines.forEach((line, index) => ctx.fillText(line, left, y + index * 44));
    }
    y += titleLines.length * 44 + 30;

    if (state.sceneHeader) {
      ctx.font = headerCanvasFont(29, 700);
      const headerLines = wrapCanvasText(ctx, state.sceneHeader, contentWidth - 120);
      if (draw) {
        ctx.fillStyle = '#292930';
        ctx.textAlign = 'center';
        headerLines.forEach((line, index) => ctx.fillText(line, W / 2, y + index * 38));
        ctx.textAlign = 'left';
      }
      y += headerLines.length * 38 + 34;
    }

    state.messages.forEach((message, index) => {
      const participant = getParticipant(message.speakerId);
      if (!participant) return;
      const previous = state.messages[index - 1];
      const continues = previous?.speakerId === message.speakerId;
      const transcript = state.conversationStyle === 'transcript';

      if (message.displayTimestamp && index > 0) y += 26;
      else if (index > 0) y += transcript ? 18 : (continues ? 8 : 18);

      const side = participant.side === 'right' ? 'right' : 'left';
      const showSpeaker = transcript || !continues;

      if (showSpeaker) {
        ctx.font = transcript ? '800 16px Arial, sans-serif' : '600 17px Arial, sans-serif';
        const name = transcript ? participant.name.toLocaleUpperCase() : participant.name;
        if (draw) {
          ctx.fillStyle = '#6d6d78';
          ctx.textAlign = transcript || side === 'left' ? 'left' : 'right';
          ctx.fillText(name, transcript || side === 'left' ? left : W - right, y);
          ctx.textAlign = 'left';
        }
        y += 23;
      }

      if (message.displayTimestamp) {
        ctx.font = '500 15px Arial, sans-serif';
        if (draw) {
          ctx.fillStyle = '#777780';
          ctx.textAlign = transcript || side === 'left' ? 'left' : 'right';
          ctx.fillText(message.displayTimestamp, transcript || side === 'left' ? left : W - right, y);
          ctx.textAlign = 'left';
        }
        y += 22;
      }

      ctx.font = '400 26px Arial, sans-serif';
      if (transcript) {
        const lines = wrapCanvasText(ctx, message.text, contentWidth - 10);
        if (draw) {
          ctx.fillStyle = '#17171b';
          lines.forEach((line, lineIndex) => ctx.fillText(line, left, y + lineIndex * 35));
        }
        y += Math.max(1, lines.length) * 35;
        return;
      }

      const padX = 20;
      const padY = 15;
      const maxInner = maxBubbleWidth - padX * 2;
      const lines = wrapCanvasText(ctx, message.text, maxInner);
      const measured = Math.max(1, ...lines.map(line => ctx.measureText(line || ' ').width));
      const bubbleWidth = Math.max(92, Math.min(maxBubbleWidth, measured + padX * 2));
      const bubbleHeight = Math.max(58, lines.length * 35 + padY * 2);
      const x = side === 'right' ? W - right - bubbleWidth : left;

      if (draw) {
        ctx.fillStyle = participant.color || '#e5e5ea';
        roundedRectPath(ctx, x, y, bubbleWidth, bubbleHeight, 23);
        ctx.fill();
        ctx.fillStyle = '#151518';
        lines.forEach((line, lineIndex) => ctx.fillText(line, x + padX, y + padY + lineIndex * 35));
      }
      y += bubbleHeight;
    });

    return y + 72;
  }

  function exportPng() {
    try {
      const measure = document.createElement('canvas');
      measure.width = 1080;
      measure.height = 100;
      const measureCtx = measure.getContext('2d');
      const height = Math.ceil(paintPngThread(measureCtx, false));
      const maxHeight = 15000;
      if (height > maxHeight) {
        alert('This thread is too tall for a reliable single PNG in some browsers. Use PDF for this one for now; split-image export is on the roadmap.');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = Math.max(280, height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = state.conversationStyle === 'transcript' ? '#ffffff' : '#f4f4f7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      paintPngThread(ctx, true);
      canvas.toBlob(blob => {
        if (!blob) {
          alert('PNG export failed in this browser. PDF export is still available.');
          return;
        }
        downloadBlob(blob, `${safeName(state.title)}.png`);
      }, 'image/png');
    } catch (err) {
      console.error(err);
      alert('PNG export failed in this browser. PDF export is still available.');
    }
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

  function wordHeaderFontName() {
    return { rounded: 'Aptos', sans: 'Arial', serif: 'Georgia', mono: 'Consolas' }[state.headerFont] || 'Aptos';
  }

  function wordSceneHeaderParagraph() {
    if (!state.sceneHeader) return '';
    const font = wordHeaderFontName();
    const runProps = `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>`;
    const runs = String(state.sceneHeader).split('\n').map((line, index) => {
      const br = index ? `<w:r>${runProps}<w:br/></w:r>` : '';
      return `${br}<w:r>${runProps}<w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
    }).join('');
    return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="300"/></w:pPr>${runs}</w:p>`;
  }

  async function buildPortableDocx() {
    const paragraphs = [];
    paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${xmlEscape(state.title || 'Untitled Thread')}</w:t></w:r></w:p>`);
    if (state.sceneHeader) paragraphs.push(wordSceneHeaderParagraph());
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
    return Math.max(20, Math.min(67, Math.round(18 + visualLength * 0.78)));
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
      <w:p><w:pPr><w:jc w:val="${side === 'right' ? 'right' : 'left'}"/><w:spacing w:before="0" w:after="35"/></w:pPr><w:r><w:rPr><w:color w:val="7A7A84"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>${xmlEscape(text)}</w:t></w:r></w:p>
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
    // A timestamp is part of the new message beat and sits above the bubble.
    const gap = message.displayTimestamp
      ? (continuesSpeaker ? 220 : 260)
      : (continuesSpeaker ? 35 : 115);

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
  ${timestampRow}
  ${bubbleRow}
</w:tbl>`;
  }

  function richTranscriptMessage(message, participant) {
    const name = participant?.name || 'Unknown';
    const timestamp = message.displayTimestamp
      ? `<w:r><w:rPr><w:color w:val="7A7A84"/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr><w:t xml:space="preserve">  ${xmlEscape(message.displayTimestamp)}</w:t></w:r>`
      : '';
    return `<w:p><w:pPr><w:spacing w:before="180" w:after="45"/></w:pPr><w:r><w:rPr><w:b/><w:smallCaps/><w:color w:val="6D6D78"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>${xmlEscape(name)}</w:t></w:r>${timestamp}</w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="90"/></w:pPr>${richTextRuns(message.text)}</w:p>`;
  }

  async function buildRichDocx() {
    const blocks = [];
    blocks.push(`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${xmlEscape(state.title || 'Untitled Thread')}</w:t></w:r></w:p>`);
    if (state.sceneHeader) blocks.push(wordSceneHeaderParagraph());
    state.messages.forEach((m, index) => {
      const p = getParticipant(m.speakerId);
      const previous = state.messages[index - 1];
      const continuesSpeaker = previous?.speakerId === m.speakerId;
      blocks.push(state.conversationStyle === 'transcript' ? richTranscriptMessage(m, p) : richMessageTable(m, p, continuesSpeaker));
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
