(() => {
  const APP_VERSION = '0.7.2';
  const LEGACY_STORAGE_KEY = 'threadwriter.project.v1';
  const LIBRARY_KEY = 'threadwriter.library.v1';
  const DOCUMENT_PREFIX = 'threadwriter.document.v1.';
  const PROJECT_LIBRARY_KEY = 'threadwriter.projects.v1';
  const HISTORY_PREFIX = 'threadwriter.history.v1.';
  const HISTORY_MAX = 12;
  const HISTORY_INTERVAL_MS = 5 * 60 * 1000;
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

  let library = loadLibraryIndex();
  let projectLibrary = loadProjectLibrary();
  let currentDocumentId = null;
  let state = initializeLibraryState();
  sanitizeProjectLibrary();
  let selectedProjectId = projectIdForDocument(currentDocumentId) || projectLibrary.lastProjectId || Object.keys(projectLibrary.projects)[0] || null;
  let saveTimer = null;
  let timestampMessageId = null;
  let pendingInsertId = null;
  const findState = { query: '', replacement: '', caseSensitive: false, matches: [], current: 0 };

  const els = {
    title: document.getElementById('docTitle'),
    saveStatus: document.getElementById('saveStatus'),
    runtimeVersion: document.getElementById('runtimeVersion'),
    projectContext: document.getElementById('projectContext'),
    thread: document.getElementById('thread'),
    speakerStrip: document.getElementById('speakerStrip'),
    composer: document.getElementById('composer'),
    wordCount: document.getElementById('wordCount'),
    send: document.getElementById('sendBtn'),
    textMenuBtn: document.getElementById('textMenuBtn'),
    textMenu: document.getElementById('textMenu'),
    fileMenuBtn: document.getElementById('fileMenuBtn'),
    fileMenu: document.getElementById('fileMenu'),
    exportMenuBtn: document.getElementById('exportMenuBtn'),
    exportMenu: document.getElementById('exportMenu'),
    participantsBtn: document.getElementById('participantsBtn'),
    headerBtn: document.getElementById('headerBtn'),
    conversationStyle: document.getElementById('conversationStyle'),
    findBtn: document.getElementById('findBtn'),
    saveAsBtn: document.getElementById('saveAsBtn'),
    historyBtn: document.getElementById('historyBtn'),
    projectsBtn: document.getElementById('projectsBtn'),
    recentBtn: document.getElementById('recentBtn'),
    recentDialog: document.getElementById('recentDialog'),
    closeRecentDialogBtn: document.getElementById('closeRecentDialogBtn'),
    recentList: document.getElementById('recentList'),
    historyDialog: document.getElementById('historyDialog'),
    closeHistoryDialogBtn: document.getElementById('closeHistoryDialogBtn'),
    createSnapshotBtn: document.getElementById('createSnapshotBtn'),
    historyList: document.getElementById('historyList'),
    dialog: document.getElementById('participantsDialog'),
    editor: document.getElementById('participantsEditor'),
    template: document.getElementById('participantEditorTemplate'),
    addParticipant: document.getElementById('addParticipantBtn'),
    saveParticipants: document.getElementById('saveParticipantsBtn'),
    newBtn: document.getElementById('newBtn'),
    importBtn: document.getElementById('importBtn'),
    fileInput: document.getElementById('fileInput'),
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
    replaceAllBtn: document.getElementById('replaceAllBtn'),
    projectsDialog: document.getElementById('projectsDialog'),
    closeProjectsDialogBtn: document.getElementById('closeProjectsDialogBtn'),
    newProjectName: document.getElementById('newProjectName'),
    createProjectBtn: document.getElementById('createProjectBtn'),
    projectList: document.getElementById('projectList'),
    projectEmpty: document.getElementById('projectEmpty'),
    projectDetailContent: document.getElementById('projectDetailContent'),
    projectNameEditor: document.getElementById('projectNameEditor'),
    deleteProjectBtn: document.getElementById('deleteProjectBtn'),
    projectStats: document.getElementById('projectStats'),
    addCurrentToProjectBtn: document.getElementById('addCurrentToProjectBtn'),
    newProjectSceneBtn: document.getElementById('newProjectSceneBtn'),
    projectSearchInput: document.getElementById('projectSearchInput'),
    projectSearchResults: document.getElementById('projectSearchResults'),
    projectSceneList: document.getElementById('projectSceneList'),
    backupProjectBtn: document.getElementById('backupProjectBtn'),
    restoreProjectBtn: document.getElementById('restoreProjectBtn'),
    projectBackupInput: document.getElementById('projectBackupInput')
  };

  function closeTopMenus(except = null) {
    const menus = [
      [els.textMenu, els.textMenuBtn],
      [els.fileMenu, els.fileMenuBtn]
    ];
    menus.forEach(([menu, button]) => {
      if (!menu || menu === except) return;
      menu.hidden = true;
      button?.setAttribute('aria-expanded', 'false');
    });
    if (els.exportMenu && (!except || except !== els.fileMenu)) {
      els.exportMenu.hidden = true;
      els.exportMenuBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleTopMenu(menu, button) {
    const opening = menu.hidden;
    closeTopMenus(menu);
    menu.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
    if (!opening && menu === els.fileMenu && els.exportMenu) {
      els.exportMenu.hidden = true;
      els.exportMenuBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  els.textMenuBtn?.addEventListener('click', event => {
    event.stopPropagation();
    toggleTopMenu(els.textMenu, els.textMenuBtn);
  });
  els.fileMenuBtn?.addEventListener('click', event => {
    event.stopPropagation();
    toggleTopMenu(els.fileMenu, els.fileMenuBtn);
  });
  els.textMenu?.addEventListener('click', event => event.stopPropagation());
  els.fileMenu?.addEventListener('click', event => event.stopPropagation());
  els.exportMenuBtn?.addEventListener('click', event => {
    event.stopPropagation();
    const opening = els.exportMenu.hidden;
    els.exportMenu.hidden = !opening;
    els.exportMenuBtn.setAttribute('aria-expanded', String(opening));
  });
  document.addEventListener('click', () => closeTopMenus());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeTopMenus();
  });

  function blankProjectLibrary() {
    return { version: 1, lastProjectId: null, projects: {} };
  }

  function loadProjectLibrary() {
    try {
      const raw = localStorage.getItem(PROJECT_LIBRARY_KEY);
      if (!raw) return blankProjectLibrary();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return blankProjectLibrary();
      return {
        version: 1,
        lastProjectId: typeof parsed.lastProjectId === 'string' ? parsed.lastProjectId : null,
        projects: parsed.projects && typeof parsed.projects === 'object' ? parsed.projects : {}
      };
    } catch {
      return blankProjectLibrary();
    }
  }

  function saveProjectLibrary() {
    try {
      localStorage.setItem(PROJECT_LIBRARY_KEY, JSON.stringify(projectLibrary));
      return true;
    } catch (error) {
      console.error('ThreadWriter project save failed', error);
      return false;
    }
  }

  function makeProjectId() {
    return crypto.randomUUID ? crypto.randomUUID() : `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function projectIdForDocument(documentId) {
    if (!documentId || !projectLibrary?.projects) return null;
    for (const [projectId, project] of Object.entries(projectLibrary.projects)) {
      if (Array.isArray(project.documentIds) && project.documentIds.includes(documentId)) return projectId;
    }
    return null;
  }

  function projectForDocument(documentId) {
    const projectId = projectIdForDocument(documentId);
    return projectId ? projectLibrary.projects[projectId] : null;
  }

  function sanitizeProjectLibrary() {
    if (!projectLibrary || typeof projectLibrary !== 'object') projectLibrary = blankProjectLibrary();
    if (!projectLibrary.projects || typeof projectLibrary.projects !== 'object') projectLibrary.projects = {};
    const validDocumentIds = new Set(Object.keys(library.documents || {}));
    Object.entries(projectLibrary.projects).forEach(([projectId, project]) => {
      if (!project || typeof project !== 'object') {
        delete projectLibrary.projects[projectId];
        return;
      }
      project.id = projectId;
      project.name = typeof project.name === 'string' && project.name.trim() ? project.name.trim() : 'Untitled Project';
      project.documentIds = Array.isArray(project.documentIds) ? [...new Set(project.documentIds.filter(id => validDocumentIds.has(id)))] : [];
      project.createdAt = project.createdAt || new Date().toISOString();
      project.updatedAt = project.updatedAt || project.createdAt;
    });
    if (projectLibrary.lastProjectId && !projectLibrary.projects[projectLibrary.lastProjectId]) projectLibrary.lastProjectId = null;
    saveProjectLibrary();
  }

  function touchProject(projectId) {
    const project = projectLibrary.projects[projectId];
    if (!project) return;
    project.updatedAt = new Date().toISOString();
    projectLibrary.lastProjectId = projectId;
    saveProjectLibrary();
  }

  function projectWordCount(project) {
    if (!project) return 0;
    return project.documentIds.reduce((sum, documentId) => {
      if (documentId === currentDocumentId) return sum + wordCountForState(state);
      const meta = library.documents[documentId];
      if (meta && Number.isFinite(Number(meta.wordCount))) return sum + Number(meta.wordCount);
      const stored = readStoredDocument(documentId);
      return sum + (stored ? wordCountForState(stored) : 0);
    }, 0);
  }

  function addDocumentToProject(documentId, projectId, { confirmMove = true } = {}) {
    const project = projectLibrary.projects[projectId];
    if (!project || !documentId) return false;
    const previousProjectId = projectIdForDocument(documentId);
    if (previousProjectId === projectId) return true;
    if (previousProjectId && confirmMove) {
      const previousName = projectLibrary.projects[previousProjectId]?.name || 'another project';
      if (!confirm(`This thread already belongs to “${previousName}”. Move it to “${project.name}”?`)) return false;
    }
    if (previousProjectId) {
      const previous = projectLibrary.projects[previousProjectId];
      previous.documentIds = previous.documentIds.filter(id => id !== documentId);
      previous.updatedAt = new Date().toISOString();
    }
    if (!project.documentIds.includes(documentId)) project.documentIds.push(documentId);
    touchProject(projectId);
    selectedProjectId = projectId;
    return true;
  }

  function removeDocumentFromProject(documentId, projectId) {
    const project = projectLibrary.projects[projectId];
    if (!project) return;
    project.documentIds = project.documentIds.filter(id => id !== documentId);
    touchProject(projectId);
  }

  function createProject(name) {
    const id = makeProjectId();
    const now = new Date().toISOString();
    projectLibrary.projects[id] = {
      id,
      name: String(name || '').trim() || 'Untitled Project',
      documentIds: [],
      createdAt: now,
      updatedAt: now
    };
    selectedProjectId = id;
    projectLibrary.lastProjectId = id;
    saveProjectLibrary();
    return id;
  }

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

  function makeDocumentId() {
    return crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function historyStorageKey(id) {
    return `${HISTORY_PREFIX}${id}`;
  }

  function blankHistory() {
    return { version: 1, snapshots: [] };
  }

  function loadHistory(id) {
    if (!id) return blankHistory();
    try {
      const raw = localStorage.getItem(historyStorageKey(id));
      if (!raw) return blankHistory();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.snapshots)) return blankHistory();
      return {
        version: 1,
        snapshots: parsed.snapshots.filter(item => item && typeof item === 'object' && item.state).slice(0, HISTORY_MAX)
      };
    } catch {
      return blankHistory();
    }
  }

  function saveHistory(id, history) {
    if (!id) return false;
    const payload = { version: 1, snapshots: (history?.snapshots || []).slice(0, HISTORY_MAX) };
    try {
      localStorage.setItem(historyStorageKey(id), JSON.stringify(payload));
      return true;
    } catch (error) {
      console.warn('ThreadWriter history save failed; pruning snapshots.', error);
      try {
        payload.snapshots = payload.snapshots.slice(0, Math.min(6, HISTORY_MAX));
        localStorage.setItem(historyStorageKey(id), JSON.stringify(payload));
        return true;
      } catch (retryError) {
        console.error('ThreadWriter history save failed', retryError);
        return false;
      }
    }
  }

  function cloneState(project) {
    return JSON.parse(JSON.stringify(project));
  }

  function stateSignature(project) {
    try { return JSON.stringify(project); } catch { return ''; }
  }

  function createSnapshot(documentId, snapshotState, reason = 'Automatic snapshot', { force = false } = {}) {
    if (!documentId || !snapshotState) return null;
    const history = loadHistory(documentId);
    const normalized = normalizeState(cloneState(snapshotState));
    const signature = stateSignature(normalized);
    const latest = history.snapshots[0];
    if (latest?.signature === signature || stateSignature(latest?.state) === signature) return latest || null;

    if (!force && latest?.createdAt) {
      const elapsed = Date.now() - new Date(latest.createdAt).getTime();
      if (Number.isFinite(elapsed) && elapsed < HISTORY_INTERVAL_MS) return null;
    }

    const snapshot = {
      id: crypto.randomUUID ? crypto.randomUUID() : `snapshot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      reason,
      wordCount: wordCountForState(normalized),
      preview: previewForState(normalized),
      signature,
      state: normalized
    };
    history.snapshots.unshift(snapshot);
    history.snapshots = history.snapshots.slice(0, HISTORY_MAX);
    return saveHistory(documentId, history) ? snapshot : null;
  }

  function maybeSnapshotBeforeWrite(documentId, previousState, nextState) {
    if (!documentId || !previousState || !nextState) return;
    if (stateSignature(previousState) === stateSignature(nextState)) return;
    // Do not clutter a brand-new thread's history with the untouched factory blank.
    if (stateSignature(previousState) === stateSignature(defaultState())) return;
    const destructive = (nextState.messages?.length || 0) < (previousState.messages?.length || 0)
      || (nextState.participants?.length || 0) < (previousState.participants?.length || 0);
    createSnapshot(documentId, previousState, destructive ? 'Before destructive edit' : 'Automatic snapshot', { force: destructive });
  }

  function checkpointCurrent(reason = 'Session checkpoint') {
    if (!currentDocumentId || !state) return null;
    saveNow({ quiet: true, skipHistory: true });
    return createSnapshot(currentDocumentId, state, reason, { force: true });
  }

  function documentStorageKey(id) {
    return `${DOCUMENT_PREFIX}${id}`;
  }

  function blankLibrary() {
    return { version: 1, currentId: null, documents: {} };
  }

  function loadLibraryIndex() {
    try {
      const raw = localStorage.getItem(LIBRARY_KEY);
      if (!raw) return blankLibrary();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return blankLibrary();
      return {
        version: 1,
        currentId: typeof parsed.currentId === 'string' ? parsed.currentId : null,
        documents: parsed.documents && typeof parsed.documents === 'object' ? parsed.documents : {}
      };
    } catch {
      return blankLibrary();
    }
  }

  function saveLibraryIndex() {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
  }

  function readStoredDocument(id) {
    if (!id) return null;
    try {
      const raw = localStorage.getItem(documentStorageKey(id));
      return raw ? normalizeState(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  function wordCountForState(project) {
    return project.messages.reduce((sum, message) => sum + countWordsInText(message.text), 0);
  }

  function previewForState(project) {
    const first = project.messages.find(message => String(message.text || '').trim());
    if (!first) return 'Empty thread';
    const clean = String(first.text).replace(/\s+/g, ' ').trim();
    return clean.length > 110 ? `${clean.slice(0, 107)}…` : clean;
  }

  function updateDocumentMeta(id, project, options = {}) {
    const now = new Date().toISOString();
    const existing = library.documents[id] || {};
    library.documents[id] = {
      title: project.title || 'Untitled Thread',
      createdAt: existing.createdAt || options.createdAt || now,
      updatedAt: options.touchUpdated === false ? (existing.updatedAt || now) : now,
      lastOpenedAt: options.touchOpened === false ? (existing.lastOpenedAt || existing.updatedAt || now) : now,
      wordCount: wordCountForState(project),
      preview: previewForState(project)
    };
  }

  function persistDocument(id, project, options = {}) {
    try {
      if (!options.skipHistory) {
        const previous = readStoredDocument(id);
        if (previous) maybeSnapshotBeforeWrite(id, previous, project);
      }
      localStorage.setItem(documentStorageKey(id), JSON.stringify(project));
      updateDocumentMeta(id, project, options);
      if (options.makeCurrent !== false) library.currentId = id;
      saveLibraryIndex();
      const owningProjectId = projectIdForDocument(id);
      if (owningProjectId) touchProject(owningProjectId);
      return true;
    } catch (error) {
      console.error('ThreadWriter local save failed', error);
      return false;
    }
  }

  function initializeLibraryState() {
    // First, reopen the currently selected v0.6.5+ local document if it exists.
    if (library.currentId) {
      const current = readStoredDocument(library.currentId);
      if (current) {
        currentDocumentId = library.currentId;
        updateDocumentMeta(currentDocumentId, current, { touchUpdated: false });
        try { saveLibraryIndex(); } catch {}
        return current;
      }
    }

    // If the index lost its current pointer, recover the most recently opened valid document.
    const candidates = Object.entries(library.documents)
      .sort((a, b) => String(b[1]?.lastOpenedAt || b[1]?.updatedAt || '').localeCompare(String(a[1]?.lastOpenedAt || a[1]?.updatedAt || '')));
    for (const [id] of candidates) {
      const recovered = readStoredDocument(id);
      if (recovered) {
        currentDocumentId = id;
        library.currentId = id;
        updateDocumentMeta(id, recovered, { touchUpdated: false });
        try { saveLibraryIndex(); } catch {}
        return recovered;
      }
    }

    // Migrate the single autosave used by v0.6.4 and earlier. Keep the legacy key
    // untouched as an extra safety copy instead of deleting it during migration.
    try {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const legacy = normalizeState(JSON.parse(legacyRaw));
        const id = makeDocumentId();
        currentDocumentId = id;
        persistDocument(id, legacy);
        return legacy;
      }
    } catch {}

    const fresh = defaultState();
    const id = makeDocumentId();
    currentDocumentId = id;
    persistDocument(id, fresh);
    return fresh;
  }

  function saveNow({ quiet = false, skipHistory = false } = {}) {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!currentDocumentId) currentDocumentId = makeDocumentId();
    const ok = persistDocument(currentDocumentId, state, { skipHistory });
    if (typeof els !== 'undefined' && els.saveStatus) {
      els.saveStatus.textContent = ok ? 'Saved to Recent' : 'Save failed';
    }
    if (!ok && !quiet) alert('ThreadWriter could not save this thread locally. Use Save As… to make an external copy before continuing.');
    return ok;
  }

  function scheduleSave() {
    if (els.saveStatus) els.saveStatus.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveNow({ quiet: true }), 180);
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
    updateWordCount();
    renderProjectContext();
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
    updateWordCount();
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
      const insertAbove = makeToolButton('Insert above', () => { closeMessageMenus(); insertMessageAdjacent(msg.id, 0); });
      const insertBelow = makeToolButton('Insert below', () => { closeMessageMenus(); insertMessageAdjacent(msg.id, 1); });
      const swap = makeToolButton('Change speaker', () => { closeMessageMenus(); cycleMessageSpeaker(msg.id); });
      const timestamp = makeToolButton(msg.displayTimestamp ? 'Edit timestamp…' : 'Add timestamp…', () => { closeMessageMenus(); openTimestampDialog(msg.id); });
      const moveUp = makeToolButton('Move up', () => { closeMessageMenus(); moveMessage(msg.id, -1); });
      const moveDown = makeToolButton('Move down', () => { closeMessageMenus(); moveMessage(msg.id, 1); });
      moveUp.disabled = index === 0;
      moveDown.disabled = index === state.messages.length - 1;
      const del = makeToolButton('Delete', () => { closeMessageMenus(); deleteMessage(msg.id); }, true);
      menu.append(edit, insertAbove, insertBelow, swap, timestamp, moveUp, moveDown, del);

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

  function countWordsInText(text) {
    if (!text || !text.trim()) return 0;
    // Prefer the browser's Unicode-aware word segmenter, but fall back cleanly if a
    // browser exposes Intl.Segmenter without useful isWordLike support.
    try {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
        let count = 0;
        for (const part of segmenter.segment(text)) if (part.isWordLike) count += 1;
        if (count > 0) return count;
      }
    } catch {}
    try {
      const matches = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
      if (matches) return matches.length;
    } catch {}
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function updateWordCount() {
    const count = state.messages.reduce((sum, message) => sum + countWordsInText(message.text), 0);
    if (els.wordCount) els.wordCount.textContent = `${count.toLocaleString()} ${count === 1 ? 'word' : 'words'}`;
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

  function insertMessageAdjacent(referenceId, offset) {
    const referenceIndex = state.messages.findIndex(message => message.id === referenceId);
    if (referenceIndex < 0) return;
    const reference = state.messages[referenceIndex];
    const newMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      speakerId: reference.speakerId,
      text: '',
      createdAt: new Date().toISOString()
    };
    const insertIndex = referenceIndex + offset;
    state.messages.splice(insertIndex, 0, newMessage);
    pendingInsertId = newMessage.id;
    renderThread();

    requestAnimationFrame(() => {
      const row = [...els.thread.querySelectorAll('.message-row')].find(el => el.dataset.messageId === newMessage.id);
      const bubble = row?.querySelector('.bubble');
      if (!bubble) return;
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      startEditMessage(newMessage.id, bubble, { removeIfBlank: true });
    });
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

  function startEditMessage(id, bubble, { removeIfBlank = false } = {}) {
    const msg = state.messages.find(m => m.id === id);
    if (!msg) return;
    const editing = bubble.contentEditable === 'true';
    if (editing) {
      msg.text = bubble.textContent.trimEnd();
      bubble.contentEditable = 'false';
      if (removeIfBlank && !msg.text.trim()) {
        state.messages = state.messages.filter(message => message.id !== id);
        if (pendingInsertId === id) pendingInsertId = null;
      } else {
        if (pendingInsertId === id) pendingInsertId = null;
        scheduleSave();
      }
      renderThread();
      return;
    }
    bubble.contentEditable = 'true';
    bubble.focus();
    placeCaretAtEnd(bubble);
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      msg.text = bubble.textContent.trimEnd();
      bubble.contentEditable = 'false';
      if (removeIfBlank && !msg.text.trim()) {
        state.messages = state.messages.filter(message => message.id !== id);
      } else {
        scheduleSave();
      }
      if (pendingInsertId === id) pendingInsertId = null;
      renderThread();
    };
    bubble.addEventListener('blur', finish, { once: true });
    bubble.addEventListener('keydown', e => {
      if (e.key === 'Escape' && removeIfBlank) {
        e.preventDefault();
        cancelled = true;
        state.messages = state.messages.filter(message => message.id !== id);
        if (pendingInsertId === id) pendingInsertId = null;
        renderThread();
        els.composer.focus();
        return;
      }
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
    if (pendingInsertId === id) pendingInsertId = null;
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

  els.headerBtn.addEventListener('click', () => { closeTopMenus(); openHeaderDialog(); });
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
    closeTopMenus();
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

  els.findBtn.addEventListener('click', () => { closeTopMenus(); openFindDialog(); });
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

  els.participantsBtn.addEventListener('click', () => { closeTopMenus(); openParticipantsDialog(); });
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

  function renderHistoryList() {
    if (!els.historyList) return;
    els.historyList.innerHTML = '';
    const history = loadHistory(currentDocumentId);
    if (!history.snapshots.length) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = 'No earlier snapshots yet. ThreadWriter creates local snapshots while a thread changes, and you can create one manually at any time.';
      els.historyList.appendChild(empty);
      return;
    }

    history.snapshots.forEach(snapshot => {
      const item = document.createElement('div');
      item.className = 'history-item';
      const main = document.createElement('div');
      main.className = 'history-main';
      const top = document.createElement('div');
      top.className = 'history-top';
      const when = document.createElement('strong');
      when.textContent = formatRecentTime(snapshot.createdAt);
      const reason = document.createElement('span');
      reason.className = 'history-reason';
      reason.textContent = snapshot.reason || 'Snapshot';
      top.append(when, reason);
      const meta = document.createElement('div');
      meta.className = 'history-meta';
      const words = Number(snapshot.wordCount ?? wordCountForState(snapshot.state));
      meta.textContent = `${words.toLocaleString()} ${words === 1 ? 'word' : 'words'} · ${snapshot.preview || previewForState(snapshot.state)}`;
      main.append(top, meta);

      const restore = document.createElement('button');
      restore.type = 'button';
      restore.textContent = 'Restore';
      restore.addEventListener('click', () => restoreSnapshot(snapshot));
      item.append(main, restore);
      els.historyList.appendChild(item);
    });
  }

  function openHistoryDialog() {
    closeTopMenus();
    saveNow({ quiet: true });
    renderHistoryList();
    els.historyDialog.showModal();
  }

  function restoreSnapshot(snapshot) {
    if (!snapshot?.state) return;
    if (!confirm(`Restore the version from ${formatRecentTime(snapshot.createdAt)}? ThreadWriter will save your current version to history first.`)) return;
    createSnapshot(currentDocumentId, state, 'Before restore', { force: true });
    state = normalizeState(cloneState(snapshot.state));
    pendingInsertId = null;
    persistDocument(currentDocumentId, state, { skipHistory: true });
    els.composer.value = '';
    autoSizeComposer();
    render();
    renderHistoryList();
    els.historyDialog.close();
  }

  function renderProjectContext() {
    if (!els.projectContext) return;
    const projectId = projectIdForDocument(currentDocumentId);
    const project = projectId ? projectLibrary.projects[projectId] : null;
    if (!project) {
      els.projectContext.hidden = true;
      els.projectContext.textContent = '';
      return;
    }
    els.projectContext.hidden = false;
    els.projectContext.textContent = `Project: ${project.name}`;
    els.projectContext.title = 'Open this project';
  }

  function openLocalDocument(id, { closeDialogs = true } = {}) {
    if (!id || id === currentDocumentId) {
      if (closeDialogs) {
        if (els.recentDialog?.open) els.recentDialog.close();
        if (els.projectsDialog?.open) els.projectsDialog.close();
      }
      return true;
    }
    checkpointCurrent('Closed / switched thread');
    const loaded = readStoredDocument(id);
    if (!loaded) {
      alert('That local conversation could not be opened. Its saved data may have been removed by the browser.');
      return false;
    }
    state = loaded;
    currentDocumentId = id;
    library.currentId = id;
    updateDocumentMeta(id, state, { touchUpdated: false });
    try { saveLibraryIndex(); } catch {}
    selectedProjectId = projectIdForDocument(id) || selectedProjectId;
    if (selectedProjectId) {
      projectLibrary.lastProjectId = selectedProjectId;
      saveProjectLibrary();
    }
    pendingInsertId = null;
    els.composer.value = '';
    autoSizeComposer();
    render();
    if (closeDialogs) {
      if (els.recentDialog?.open) els.recentDialog.close();
      if (els.projectsDialog?.open) els.projectsDialog.close();
    }
    return true;
  }

  function createProjectScene(projectId) {
    const project = projectLibrary.projects[projectId];
    if (!project) return;
    checkpointCurrent('Closed / switched thread');
    const fresh = defaultState();
    const id = makeDocumentId();
    currentDocumentId = id;
    state = fresh;
    pendingInsertId = null;
    persistDocument(id, fresh);
    addDocumentToProject(id, projectId, { confirmMove: false });
    els.composer.value = '';
    autoSizeComposer();
    render();
    if (els.projectsDialog?.open) els.projectsDialog.close();
    els.title.focus();
    els.title.select();
  }

  function moveProjectScene(projectId, documentId, direction) {
    const project = projectLibrary.projects[projectId];
    if (!project) return;
    const index = project.documentIds.indexOf(documentId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= project.documentIds.length) return;
    const [moved] = project.documentIds.splice(index, 1);
    project.documentIds.splice(target, 0, moved);
    touchProject(projectId);
    renderProjectsDialog();
  }

  function projectSceneMeta(documentId) {
    if (documentId === currentDocumentId) {
      return {
        title: state.title || 'Untitled Thread',
        wordCount: wordCountForState(state),
        preview: previewForState(state),
        updatedAt: library.documents[documentId]?.updatedAt || new Date().toISOString()
      };
    }
    return library.documents[documentId] || { title: 'Untitled Thread', wordCount: 0, preview: 'Empty thread', updatedAt: '' };
  }

  function projectSearch(project, query) {
    const raw = String(query || '').trim();
    if (!raw) return [];
    const needle = raw.toLocaleLowerCase();
    const results = [];
    for (const documentId of project.documentIds) {
      const documentState = documentId === currentDocumentId ? state : readStoredDocument(documentId);
      if (!documentState) continue;
      const title = documentState.title || 'Untitled Thread';
      const header = documentState.sceneHeader || '';
      if (title.toLocaleLowerCase().includes(needle)) {
        results.push({ documentId, title, kind: 'Title', snippet: title });
      } else if (header.toLocaleLowerCase().includes(needle)) {
        results.push({ documentId, title, kind: 'Header', snippet: header.replace(/\s+/g, ' ').trim() });
      }
      for (const message of documentState.messages) {
        const participant = documentState.participants.find(p => p.id === message.speakerId);
        const clean = String(message.text || '').replace(/\s+/g, ' ').trim();
        const at = clean.toLocaleLowerCase().indexOf(needle);
        if (at === -1) continue;
        const start = Math.max(0, at - 45);
        const end = Math.min(clean.length, at + raw.length + 80);
        const snippet = `${start > 0 ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`;
        results.push({ documentId, title, kind: participant?.name || 'Message', snippet });
        if (results.length >= 60) return results;
      }
    }
    return results;
  }

  function renderProjectSearchResults(project) {
    const query = els.projectSearchInput.value.trim();
    els.projectSearchResults.innerHTML = '';
    if (!query) {
      els.projectSearchResults.hidden = true;
      return;
    }
    els.projectSearchResults.hidden = false;
    const results = projectSearch(project, query);
    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'project-search-empty';
      empty.textContent = 'No matches in this project.';
      els.projectSearchResults.appendChild(empty);
      return;
    }
    results.forEach(result => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'project-search-result';
      const label = document.createElement('strong');
      label.textContent = result.title;
      const kind = document.createElement('small');
      kind.textContent = result.kind;
      const snippet = document.createElement('div');
      snippet.className = 'project-search-snippet';
      snippet.textContent = result.snippet;
      button.append(label, kind, snippet);
      button.addEventListener('click', () => {
        const messageSearch = result.kind !== 'Title' && result.kind !== 'Header';
        openLocalDocument(result.documentId);
        if (messageSearch && query) {
          els.findInput.value = query;
          els.replaceInput.value = '';
          els.caseSensitiveFind.checked = false;
          findState.current = 0;
          refreshFindMatches({ preserveCurrent: false, scroll: true });
        }
      });
      els.projectSearchResults.appendChild(button);
    });
  }

  function renderProjectsDialog() {
    sanitizeProjectLibrary();
    if (selectedProjectId && !projectLibrary.projects[selectedProjectId]) selectedProjectId = null;
    if (!selectedProjectId) selectedProjectId = projectIdForDocument(currentDocumentId) || projectLibrary.lastProjectId || Object.keys(projectLibrary.projects)[0] || null;

    els.projectList.innerHTML = '';
    const entries = Object.entries(projectLibrary.projects).sort((a, b) => String(b[1].updatedAt || '').localeCompare(String(a[1].updatedAt || '')));
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'recent-empty';
      empty.textContent = 'No projects yet.';
      els.projectList.appendChild(empty);
    } else {
      entries.forEach(([projectId, project]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'project-list-button';
        if (projectId === selectedProjectId) button.classList.add('active');
        const title = document.createElement('strong');
        title.textContent = project.name;
        const details = document.createElement('span');
        const count = project.documentIds.length;
        details.textContent = `${count} ${count === 1 ? 'scene' : 'scenes'} · ${projectWordCount(project).toLocaleString()} words`;
        button.append(title, details);
        button.addEventListener('click', () => {
          selectedProjectId = projectId;
          projectLibrary.lastProjectId = projectId;
          saveProjectLibrary();
          els.projectSearchInput.value = '';
          renderProjectsDialog();
        });
        els.projectList.appendChild(button);
      });
    }

    const project = selectedProjectId ? projectLibrary.projects[selectedProjectId] : null;
    els.projectEmpty.hidden = !!project;
    els.projectDetailContent.hidden = !project;
    if (els.backupProjectBtn) els.backupProjectBtn.disabled = !project;
    if (!project) return;

    els.projectNameEditor.value = project.name;
    const totalWords = projectWordCount(project);
    const sceneCount = project.documentIds.length;
    els.projectStats.textContent = `${sceneCount.toLocaleString()} ${sceneCount === 1 ? 'scene' : 'scenes'} · ${totalWords.toLocaleString()} ${totalWords === 1 ? 'word' : 'words'}`;
    const currentOwner = projectIdForDocument(currentDocumentId);
    els.addCurrentToProjectBtn.disabled = currentOwner === selectedProjectId;
    els.addCurrentToProjectBtn.textContent = currentOwner === selectedProjectId ? 'Current thread added' : (currentOwner ? 'Move current thread here' : 'Add current thread');

    els.projectSceneList.innerHTML = '';
    if (!project.documentIds.length) {
      const empty = document.createElement('div');
      empty.className = 'recent-empty';
      empty.textContent = 'No scenes yet. Add the current thread or create a new scene.';
      els.projectSceneList.appendChild(empty);
    } else {
      project.documentIds.forEach((documentId, index) => {
        const meta = projectSceneMeta(documentId);
        const row = document.createElement('div');
        row.className = 'project-scene-row';
        if (documentId === currentDocumentId) row.classList.add('current');
        const main = document.createElement('div');
        main.className = 'project-scene-main';
        const text = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'project-scene-title';
        title.textContent = meta.title || 'Untitled Thread';
        const details = document.createElement('div');
        details.className = 'project-scene-meta';
        details.textContent = `${Number(meta.wordCount || 0).toLocaleString()} words · ${meta.preview || 'Empty thread'}`;
        text.append(title, details);
        const order = document.createElement('span');
        order.className = 'project-scene-meta';
        order.textContent = `${index + 1}`;
        main.append(text, order);

        const actions = document.createElement('div');
        actions.className = 'project-scene-actions';
        const open = document.createElement('button');
        open.type = 'button';
        open.textContent = documentId === currentDocumentId ? 'Current' : 'Open';
        open.disabled = documentId === currentDocumentId;
        open.addEventListener('click', () => openLocalDocument(documentId));
        const up = document.createElement('button');
        up.type = 'button'; up.textContent = '↑'; up.title = 'Move scene up'; up.disabled = index === 0;
        up.addEventListener('click', () => moveProjectScene(selectedProjectId, documentId, -1));
        const down = document.createElement('button');
        down.type = 'button'; down.textContent = '↓'; down.title = 'Move scene down'; down.disabled = index === project.documentIds.length - 1;
        down.addEventListener('click', () => moveProjectScene(selectedProjectId, documentId, 1));
        const rename = document.createElement('button');
        rename.type = 'button'; rename.textContent = 'Rename';
        rename.addEventListener('click', () => {
          const documentState = documentId === currentDocumentId ? state : readStoredDocument(documentId);
          if (!documentState) return;
          const value = prompt('Scene title:', documentState.title || 'Untitled Thread');
          if (value === null) return;
          documentState.title = value.trim() || 'Untitled Thread';
          if (documentId === currentDocumentId) {
            state.title = documentState.title;
            els.title.value = state.title;
            saveNow({ quiet: true });
          } else persistDocument(documentId, documentState, { touchOpened: false, makeCurrent: false });
          renderProjectsDialog();
        });
        const remove = document.createElement('button');
        remove.type = 'button'; remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
          removeDocumentFromProject(documentId, selectedProjectId);
          renderProjectContext();
          renderProjectsDialog();
        });
        actions.append(open, up, down, rename, remove);
        row.append(main, actions);
        els.projectSceneList.appendChild(row);
      });
    }
    renderProjectSearchResults(project);
  }

  function openProjectsDialog(preferCurrent = false) {
    saveNow({ quiet: true });
    const currentProjectId = projectIdForDocument(currentDocumentId);
    if (preferCurrent && currentProjectId) selectedProjectId = currentProjectId;
    else if (!selectedProjectId) selectedProjectId = currentProjectId || projectLibrary.lastProjectId || Object.keys(projectLibrary.projects)[0] || null;
    els.projectSearchInput.value = '';
    renderProjectsDialog();
    els.projectsDialog.showModal();
  }

  function createNewLocalThread() {
    checkpointCurrent('Closed / switched thread');
    state = defaultState();
    currentDocumentId = makeDocumentId();
    pendingInsertId = null;
    persistDocument(currentDocumentId, state);
    render();
    els.composer.value = '';
    autoSizeComposer();
    els.composer.focus();
  }

  function formatRecentTime(value) {
    if (!value) return 'unknown time';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'unknown time';
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }

  function renderRecentList() {
    if (!els.recentList) return;
    els.recentList.innerHTML = '';
    const entries = Object.entries(library.documents)
      .sort((a, b) => String(b[1]?.lastOpenedAt || b[1]?.updatedAt || '').localeCompare(String(a[1]?.lastOpenedAt || a[1]?.updatedAt || '')));

    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'recent-empty';
      empty.textContent = 'No locally saved conversations yet.';
      els.recentList.appendChild(empty);
      return;
    }

    entries.forEach(([id, meta]) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'recent-item';
      if (id === currentDocumentId) item.classList.add('current');

      const top = document.createElement('div');
      top.className = 'recent-item-top';
      const title = document.createElement('strong');
      title.textContent = meta.title || 'Untitled Thread';
      const badge = document.createElement('span');
      badge.className = 'recent-badge';
      badge.textContent = id === currentDocumentId ? 'Current' : 'Open';
      top.append(title, badge);

      const details = document.createElement('div');
      details.className = 'recent-details';
      const words = Number(meta.wordCount || 0);
      const project = projectForDocument(id);
      details.textContent = `${words.toLocaleString()} ${words === 1 ? 'word' : 'words'} · ${formatRecentTime(meta.updatedAt || meta.lastOpenedAt)}${project ? ` · ${project.name}` : ''}`;

      const preview = document.createElement('div');
      preview.className = 'recent-preview';
      preview.textContent = meta.preview || 'Empty thread';

      item.append(top, details, preview);
      item.addEventListener('click', () => {
        if (!openLocalDocument(id)) renderRecentList();
      });
      els.recentList.appendChild(item);
    });
  }

  async function saveBlobAsPortableFile(blob, filename, description, extensions) {
    if (typeof window.showSaveFilePicker === 'function' && window.isSecureContext) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description, accept: { 'application/json': extensions } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return 'saved';
      } catch (error) {
        if (error?.name === 'AbortError') return 'cancelled';
        console.warn('ThreadWriter file picker unavailable; falling back.', error);
      }
    }
    try {
      const file = new File([blob], filename, { type: 'application/json' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return 'shared';
      }
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
      console.warn('ThreadWriter share sheet unavailable; falling back.', error);
    }
    downloadBlob(blob, filename);
    return 'downloaded';
  }

  async function backupSelectedProject() {
    const project = projectLibrary.projects[selectedProjectId];
    if (!project) return;
    checkpointCurrent('Project backup checkpoint');
    const scenes = project.documentIds.map((documentId, index) => {
      const documentState = documentId === currentDocumentId ? state : readStoredDocument(documentId);
      if (!documentState) return null;
      return {
        order: index,
        title: documentState.title || 'Untitled Thread',
        state: cloneState(documentState),
        history: loadHistory(documentId).snapshots.map(snapshot => ({ ...snapshot, state: cloneState(snapshot.state) }))
      };
    }).filter(Boolean);
    const backup = {
      format: 'threadwriter-project-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      project: {
        name: project.name,
        createdAt: project.createdAt,
        scenes
      }
    };
    const filename = `${safeName(project.name)}.threadwriter-project`;
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const result = await saveBlobAsPortableFile(blob, filename, 'ThreadWriter project backup', ['.threadwriter-project', '.json']);
    if (result && result !== 'cancelled' && els.saveStatus) els.saveStatus.textContent = 'Project backup created';
  }

  function restoreProjectBackup(parsed) {
    if (!parsed || parsed.format !== 'threadwriter-project-backup' || parsed.version !== 1 || !parsed.project || !Array.isArray(parsed.project.scenes)) {
      throw new Error('Not a ThreadWriter project backup');
    }
    const projectId = makeProjectId();
    const documentIds = [];
    parsed.project.scenes.forEach(scene => {
      const restored = normalizeState(scene.state);
      const documentId = makeDocumentId();
      persistDocument(documentId, restored, { makeCurrent: false, touchOpened: false, skipHistory: true });
      if (Array.isArray(scene.history) && scene.history.length) {
        const snapshots = scene.history.slice(0, HISTORY_MAX).map(snapshot => {
          const restoredSnapshotState = normalizeState(snapshot.state);
          return {
            id: snapshot.id || (crypto.randomUUID ? crypto.randomUUID() : `snapshot-${Date.now()}-${Math.random()}`),
            createdAt: snapshot.createdAt || new Date().toISOString(),
            reason: snapshot.reason || 'Restored snapshot',
            wordCount: Number(snapshot.wordCount ?? wordCountForState(restoredSnapshotState)),
            preview: snapshot.preview || previewForState(restoredSnapshotState),
            signature: snapshot.signature || stateSignature(restoredSnapshotState),
            state: restoredSnapshotState
          };
        });
        saveHistory(documentId, { version: 1, snapshots });
      }
      documentIds.push(documentId);
    });
    projectLibrary.projects[projectId] = {
      id: projectId,
      name: String(parsed.project.name || 'Restored Project').trim() || 'Restored Project',
      documentIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    selectedProjectId = projectId;
    projectLibrary.lastProjectId = projectId;
    saveProjectLibrary();
    return { projectId, documentIds };
  }

  async function saveAsProject() {
    saveNow({ quiet: true });
    const filename = `${safeName(state.title)}.threadwriter`;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const result = await saveBlobAsPortableFile(blob, filename, 'ThreadWriter project', ['.threadwriter']);
    if (result === 'saved' && els.saveStatus) els.saveStatus.textContent = 'Saved file';
    else if (result === 'shared' && els.saveStatus) els.saveStatus.textContent = 'Shared file copy';
    else if (result === 'downloaded' && els.saveStatus) els.saveStatus.textContent = 'Downloaded file copy';
    els.saveAsBtn.blur();
  }

  els.saveAsBtn.addEventListener('click', () => { closeTopMenus(); saveAsProject(); });
  els.historyBtn.addEventListener('click', openHistoryDialog);
  els.closeHistoryDialogBtn.addEventListener('click', () => els.historyDialog.close());
  els.createSnapshotBtn.addEventListener('click', () => {
    saveNow({ quiet: true });
    const snapshot = createSnapshot(currentDocumentId, state, 'Manual snapshot', { force: true });
    if (snapshot && els.saveStatus) els.saveStatus.textContent = 'Snapshot created';
    renderHistoryList();
  });

  els.projectsBtn.addEventListener('click', () => { closeTopMenus(); openProjectsDialog(true); });
  els.projectContext.addEventListener('click', () => openProjectsDialog(true));
  els.closeProjectsDialogBtn.addEventListener('click', () => els.projectsDialog.close());
  els.createProjectBtn.addEventListener('click', () => {
    const projectId = createProject(els.newProjectName.value);
    els.newProjectName.value = '';
    selectedProjectId = projectId;
    renderProjectsDialog();
  });
  els.newProjectName.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      els.createProjectBtn.click();
    }
  });
  els.projectNameEditor.addEventListener('change', () => {
    const project = projectLibrary.projects[selectedProjectId];
    if (!project) return;
    project.name = els.projectNameEditor.value.trim() || 'Untitled Project';
    touchProject(selectedProjectId);
    renderProjectContext();
    renderProjectsDialog();
  });
  els.deleteProjectBtn.addEventListener('click', () => {
    const project = projectLibrary.projects[selectedProjectId];
    if (!project) return;
    if (!confirm(`Delete the project “${project.name}”? Its conversations will stay in Recent.`)) return;
    delete projectLibrary.projects[selectedProjectId];
    if (projectLibrary.lastProjectId === selectedProjectId) projectLibrary.lastProjectId = null;
    selectedProjectId = Object.keys(projectLibrary.projects)[0] || null;
    saveProjectLibrary();
    renderProjectContext();
    renderProjectsDialog();
  });
  els.addCurrentToProjectBtn.addEventListener('click', () => {
    if (!selectedProjectId) return;
    saveNow({ quiet: true });
    if (addDocumentToProject(currentDocumentId, selectedProjectId)) {
      renderProjectContext();
      renderProjectsDialog();
    }
  });
  els.newProjectSceneBtn.addEventListener('click', () => {
    if (selectedProjectId) createProjectScene(selectedProjectId);
  });
  els.backupProjectBtn.addEventListener('click', () => backupSelectedProject());
  els.restoreProjectBtn.addEventListener('click', () => els.projectBackupInput.click());
  els.projectBackupInput.addEventListener('change', async () => {
    const file = els.projectBackupInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const result = restoreProjectBackup(parsed);
      renderProjectsDialog();
      alert(`Restored “${projectLibrary.projects[result.projectId]?.name || 'project'}” with ${result.documentIds.length} scene${result.documentIds.length === 1 ? '' : 's'}.`);
    } catch (error) {
      alert(`Could not restore this project backup: ${error.message}`);
    } finally {
      els.projectBackupInput.value = '';
    }
  });
  els.projectSearchInput.addEventListener('input', () => {
    const project = projectLibrary.projects[selectedProjectId];
    if (project) renderProjectSearchResults(project);
  });

  els.recentBtn.addEventListener('click', () => {
    closeTopMenus();
    saveNow({ quiet: true });
    renderRecentList();
    els.recentDialog.showModal();
  });
  els.closeRecentDialogBtn.addEventListener('click', () => els.recentDialog.close());

  els.newBtn.addEventListener('click', () => {
    closeTopMenus();
    if (!confirm('Start a new thread? Your current thread will remain saved under Recent.')) return;
    createNewLocalThread();
  });

  els.importBtn.addEventListener('click', () => { closeTopMenus(); els.fileInput.click(); });
  els.fileInput.addEventListener('change', async () => {
    const file = els.fileInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = normalizeState(parsed);
      checkpointCurrent('Closed / switched thread');
      state = imported;
      currentDocumentId = makeDocumentId();
      pendingInsertId = null;
      persistDocument(currentDocumentId, state);
      els.composer.value = '';
      autoSizeComposer();
      render();
    } catch (err) {
      alert(`Could not import this file: ${err.message}`);
    } finally {
      els.fileInput.value = '';
    }
  });

  els.exportTxtBtn.addEventListener('click', () => {
    closeTopMenus();
    const txt = buildTranscript();
    downloadBlob(new Blob([txt], { type: 'text/plain;charset=utf-8' }), `${safeName(state.title)}.txt`);
  });

  els.exportPngBtn.addEventListener('click', () => { closeTopMenus(); exportPng(); });

  els.exportDocxBtn.addEventListener('click', () => { closeTopMenus(); els.docxDialog.showModal(); });
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

  els.printBtn.addEventListener('click', () => { closeTopMenus(); window.print(); });

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

  window.addEventListener('pagehide', () => { saveNow({ quiet: true }); createSnapshot(currentDocumentId, state, 'Session checkpoint', { force: true }); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { saveNow({ quiet: true }); createSnapshot(currentDocumentId, state, 'Session checkpoint', { force: true }); }
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  if (els.runtimeVersion) els.runtimeVersion.textContent = `v${APP_VERSION}`;
  render();
  autoSizeComposer();
})();
