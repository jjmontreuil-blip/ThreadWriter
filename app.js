(() => {
  const APP_VERSION = '0.10.7';
  const LEGACY_STORAGE_KEY = 'threadwriter.project.v1';
  const LIBRARY_KEY = 'threadwriter.library.v1';
  const DOCUMENT_PREFIX = 'threadwriter.document.v1.';
  const PROJECT_LIBRARY_KEY = 'threadwriter.projects.v1';
  const CONVERSATION_PRESETS_KEY = 'threadwriter.conversation-presets.v1';
  const HISTORY_PREFIX = 'threadwriter.history.v1.';
  const HISTORY_MAX = 6;
  const HISTORY_INTERVAL_MS = 5 * 60 * 1000;
  const MEDIA_DB_NAME = 'threadwriter.media.v1';
  const MEDIA_STORE = 'images';
  const MAX_IMAGE_DIMENSION = 2400;
  const MAX_IMAGE_FILE_BYTES = 25 * 1024 * 1024;
  const defaultState = () => ({
    version: 8,
    title: 'Untitled Thread',
    sceneHeader: '',
    headerFont: 'rounded',
    conversationStyle: 'chat',
    conversationWidth: 'wide',
    conversationBackground: { mode: 'default', solid: '#f4f4f7', colors: ['#f4f4f7', '#d9e6ff'], direction: 'vertical' },
    highContrastLabels: false,
    activeParticipantId: 'p1',
    participants: [
      { id: 'p1', name: 'Participant 1', side: 'left', color: '#d9e6ff', textColorMode: 'auto', textColor: '#151518' },
      { id: 'p2', name: 'Participant 2', side: 'right', color: '#c9f2d0', textColorMode: 'auto', textColor: '#151518' }
    ],
    messages: []
  });

  let library = loadLibraryIndex();
  let projectLibrary = loadProjectLibrary();
  let conversationPresetLibrary = loadConversationPresetLibrary();
  let currentDocumentId = null;
  let state = initializeLibraryState();
  sanitizeProjectLibrary();
  let selectedProjectId = projectIdForDocument(currentDocumentId) || projectLibrary.lastProjectId || Object.keys(projectLibrary.projects)[0] || null;
  let saveTimer = null;
  let timestampMessageId = null;
  let annotationMessageId = null;
  let narrativeBlockId = null;
  let narrativeInsertIndex = null;
  let narrativeReturnFocusToComposer = false;
  let pendingInsertId = null;
  let imageTargetItemId = null;
  let imageDetailsItemId = null;
  let linkPreviewItemId = null;
  let linkPreviewImageTargetId = null;
  let mediaDbPromise = null;
  let mediaGcTimer = null;
  const mediaObjectUrls = new Map();
  const findState = { query: '', replacement: '', caseSensitive: false, matches: [], current: 0 };

  const els = {
    title: document.getElementById('docTitle'),
    saveStatus: document.getElementById('saveStatus'),
    runtimeVersion: document.getElementById('runtimeVersion'),
    projectContext: document.getElementById('projectContext'),
    thread: document.getElementById('thread'),
    conversationCanvas: document.getElementById('conversationCanvas'),
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
    narrativeBtn: document.getElementById('narrativeBtn'),
    quickNarrativeBtn: document.getElementById('quickNarrativeBtn'),
    conversationStyle: document.getElementById('conversationStyle'),
    conversationWidth: document.getElementById('conversationWidth'),
    backgroundBtn: document.getElementById('backgroundBtn'),
    backgroundDialog: document.getElementById('backgroundDialog'),
    closeBackgroundDialogBtn: document.getElementById('closeBackgroundDialogBtn'),
    backgroundMode: document.getElementById('backgroundMode'),
    backgroundSolidField: document.getElementById('backgroundSolidField'),
    backgroundSolidColor: document.getElementById('backgroundSolidColor'),
    backgroundColorCountField: document.getElementById('backgroundColorCountField'),
    backgroundColorCount: document.getElementById('backgroundColorCount'),
    backgroundDirectionField: document.getElementById('backgroundDirectionField'),
    backgroundDirection: document.getElementById('backgroundDirection'),
    backgroundColors: document.getElementById('backgroundColors'),
    backgroundGradientTools: document.getElementById('backgroundGradientTools'),
    backgroundPresetGrid: document.getElementById('backgroundPresetGrid'),
    flipGradientBtn: document.getElementById('flipGradientBtn'),
    highContrastLabelsInput: document.getElementById('highContrastLabelsInput'),
    backgroundPreviewLabel: document.getElementById('backgroundPreviewLabel'),
    backgroundColor1: document.getElementById('backgroundColor1'),
    backgroundColor2: document.getElementById('backgroundColor2'),
    backgroundColor3: document.getElementById('backgroundColor3'),
    backgroundColor4: document.getElementById('backgroundColor4'),
    backgroundPreview: document.getElementById('backgroundPreview'),
    resetBackgroundBtn: document.getElementById('resetBackgroundBtn'),
    saveBackgroundBtn: document.getElementById('saveBackgroundBtn'),
    conversationPresetsBtn: document.getElementById('conversationPresetsBtn'),
    conversationPresetsDialog: document.getElementById('conversationPresetsDialog'),
    closeConversationPresetsDialogBtn: document.getElementById('closeConversationPresetsDialogBtn'),
    conversationPresetNameInput: document.getElementById('conversationPresetNameInput'),
    saveConversationPresetBtn: document.getElementById('saveConversationPresetBtn'),
    conversationPresetStatus: document.getElementById('conversationPresetStatus'),
    conversationPresetList: document.getElementById('conversationPresetList'),
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
    imageInput: document.getElementById('imageInput'),
    linkPreviewImageInput: document.getElementById('linkPreviewImageInput'),
    imageDetailsDialog: document.getElementById('imageDetailsDialog'),
    imageDetailsName: document.getElementById('imageDetailsName'),
    imageCaptionInput: document.getElementById('imageCaptionInput'),
    imageAltInput: document.getElementById('imageAltInput'),
    closeImageDetailsDialogBtn: document.getElementById('closeImageDetailsDialogBtn'),
    saveImageDetailsBtn: document.getElementById('saveImageDetailsBtn'),
    linkPreviewDialog: document.getElementById('linkPreviewDialog'),
    linkPreviewSiteInput: document.getElementById('linkPreviewSiteInput'),
    linkPreviewTitleInput: document.getElementById('linkPreviewTitleInput'),
    linkPreviewDescriptionInput: document.getElementById('linkPreviewDescriptionInput'),
    linkPreviewUrlInput: document.getElementById('linkPreviewUrlInput'),
    linkPreviewThumbnailStatus: document.getElementById('linkPreviewThumbnailStatus'),
    chooseLinkPreviewThumbnailBtn: document.getElementById('chooseLinkPreviewThumbnailBtn'),
    removeLinkPreviewThumbnailBtn: document.getElementById('removeLinkPreviewThumbnailBtn'),
    removeLinkPreviewBtn: document.getElementById('removeLinkPreviewBtn'),
    closeLinkPreviewDialogBtn: document.getElementById('closeLinkPreviewDialogBtn'),
    saveLinkPreviewBtn: document.getElementById('saveLinkPreviewBtn'),
    exportDocxBtn: document.getElementById('exportDocxBtn'),
    docxDialog: document.getElementById('docxDialog'),
    closeDocxDialogBtn: document.getElementById('closeDocxDialogBtn'),
    portableDocxBtn: document.getElementById('portableDocxBtn'),
    richDocxBtn: document.getElementById('richDocxBtn'),
    exportTxtBtn: document.getElementById('exportTxtBtn'),
    exportHtmlBtn: document.getElementById('exportHtmlBtn'),
    exportImageBtn: document.getElementById('exportImageBtn'),
    printBtn: document.getElementById('printBtn'),
    imageExportDialog: document.getElementById('imageExportDialog'),
    closeImageExportDialogBtn: document.getElementById('closeImageExportDialogBtn'),
    imageExportFormat: document.getElementById('imageExportFormat'),
    imageExportSizeMode: document.getElementById('imageExportSizeMode'),
    imageExportPrintWidthField: document.getElementById('imageExportPrintWidthField'),
    imageExportDpiField: document.getElementById('imageExportDpiField'),
    imageExportCustomWidthField: document.getElementById('imageExportCustomWidthField'),
    imageExportPrintWidth: document.getElementById('imageExportPrintWidth'),
    imageExportDpi: document.getElementById('imageExportDpi'),
    imageExportCustomWidth: document.getElementById('imageExportCustomWidth'),
    imageExportColorMode: document.getElementById('imageExportColorMode'),
    imageExportSplit: document.getElementById('imageExportSplit'),
    imageExportSummary: document.getElementById('imageExportSummary'),
    runImageExportBtn: document.getElementById('runImageExportBtn'),
    timestampDialog: document.getElementById('timestampDialog'),
    timestampInput: document.getElementById('timestampInput'),
    closeTimestampDialogBtn: document.getElementById('closeTimestampDialogBtn'),
    useMessageTimeBtn: document.getElementById('useMessageTimeBtn'),
    removeTimestampBtn: document.getElementById('removeTimestampBtn'),
    saveTimestampBtn: document.getElementById('saveTimestampBtn'),
    annotationDialog: document.getElementById('annotationDialog'),
    annotationInput: document.getElementById('annotationInput'),
    closeAnnotationDialogBtn: document.getElementById('closeAnnotationDialogBtn'),
    removeAnnotationBtn: document.getElementById('removeAnnotationBtn'),
    saveAnnotationBtn: document.getElementById('saveAnnotationBtn'),
    narrativeDialog: document.getElementById('narrativeDialog'),
    narrativeInput: document.getElementById('narrativeInput'),
    narrativeStyle: document.getElementById('narrativeStyle'),
    closeNarrativeDialogBtn: document.getElementById('closeNarrativeDialogBtn'),
    removeNarrativeBtn: document.getElementById('removeNarrativeBtn'),
    saveNarrativeBtn: document.getElementById('saveNarrativeBtn'),
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

  function openMediaDb() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('This browser does not support local image storage.'));
    if (mediaDbPromise) return mediaDbPromise;
    mediaDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(MEDIA_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open image storage.'));
    });
    return mediaDbPromise;
  }

  async function mediaRequest(mode, action) {
    const db = await openMediaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, mode);
      const store = tx.objectStore(MEDIA_STORE);
      let request;
      try { request = action(store); } catch (error) { reject(error); return; }
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Image storage request failed.'));
      tx.onabort = () => reject(tx.error || new Error('Image storage transaction failed.'));
    });
  }

  function putMediaRecord(record) {
    return mediaRequest('readwrite', store => store.put(record));
  }

  function getMediaRecord(id) {
    if (!id) return Promise.resolve(null);
    return mediaRequest('readonly', store => store.get(id)).then(result => result || null).catch(() => null);
  }

  function deleteMediaRecord(id) {
    if (!id) return Promise.resolve();
    return mediaRequest('readwrite', store => store.delete(id)).catch(() => {});
  }

  function getAllMediaKeys() {
    return mediaRequest('readonly', store => store.getAllKeys()).catch(() => []);
  }

  function normalizeImageAttachment(value) {
    if (!value || typeof value !== 'object' || typeof value.id !== 'string' || !value.id) return null;
    return {
      id: value.id,
      name: typeof value.name === 'string' && value.name ? value.name : 'image',
      mime: ['image/jpeg', 'image/png'].includes(value.mime) ? value.mime : 'image/jpeg',
      width: Math.max(1, Number(value.width) || 1),
      height: Math.max(1, Number(value.height) || 1),
      size: Math.max(0, Number(value.size) || 0),
      caption: typeof value.caption === 'string' ? value.caption : '',
      altText: typeof value.altText === 'string' ? value.altText : ''
    };
  }

  function normalizeLinkPreview(value) {
    if (!value || typeof value !== 'object') return null;
    const preview = {
      site: typeof value.site === 'string' ? value.site : '',
      title: typeof value.title === 'string' ? value.title : '',
      description: typeof value.description === 'string' ? value.description : '',
      displayUrl: typeof value.displayUrl === 'string' ? value.displayUrl : ''
    };
    const thumbnail = normalizeImageAttachment(value.thumbnail);
    if (thumbnail) preview.thumbnail = thumbnail;
    if (!preview.site && !preview.title && !preview.description && !preview.displayUrl && !preview.thumbnail) return null;
    return preview;
  }


  function normalizeConversationStyle(value) {
    return ['chat', 'transcript', 'theater', 'screen'].includes(value) ? value : 'chat';
  }

  function normalizeHex(value, fallback = '#f4f4f7') {
    const raw = String(value || '').trim();
    if (!/^#?[0-9a-fA-F]{6}$/.test(raw)) return fallback;
    return (raw.startsWith('#') ? raw : `#${raw}`).toLowerCase();
  }

  function normalizeConversationBackground(value) {
    const fallback = defaultState().conversationBackground;
    if (!value || typeof value !== 'object') return { ...fallback, colors: [...fallback.colors] };
    const mode = ['default', 'solid', 'gradient'].includes(value.mode) ? value.mode : 'default';
    const direction = ['vertical', 'horizontal', 'diag-right', 'diag-left'].includes(value.direction) ? value.direction : 'vertical';
    const rawColors = Array.isArray(value.colors) ? value.colors : fallback.colors;
    const colors = rawColors.slice(0, 4).map((color, index) => normalizeHex(color, fallback.colors[index] || fallback.colors[0]));
    while (colors.length < 2) colors.push(fallback.colors[colors.length] || fallback.colors[0]);
    return {
      mode,
      solid: normalizeHex(value.solid, fallback.solid),
      colors,
      direction
    };
  }

  function backgroundDirectionCss(direction) {
    return ({ vertical: 'to bottom', horizontal: 'to right', 'diag-right': 'to bottom right', 'diag-left': 'to bottom left' })[direction] || 'to bottom';
  }

  function backgroundDirectionPoints(direction, width, height) {
    if (direction === 'horizontal') return [0, 0, width, 0];
    if (direction === 'diag-right') return [0, 0, width, height];
    if (direction === 'diag-left') return [width, 0, 0, height];
    return [0, 0, 0, height];
  }

  function conversationBackgroundCss(backgroundValue = state.conversationBackground) {
    const background = normalizeConversationBackground(backgroundValue);
    if (background.mode === 'solid') return background.solid;
    if (background.mode === 'gradient') return `linear-gradient(${backgroundDirectionCss(background.direction)}, ${background.colors.join(', ')})`;
    return '';
  }

  function hexLuminance(hex) {
    const value = normalizeHex(hex, '#f4f4f7').slice(1);
    const channels = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16) / 255).map(channel => channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4));
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function customBackgroundIsDark(backgroundValue = state.conversationBackground) {
    const background = normalizeConversationBackground(backgroundValue);
    if (background.mode === 'default') return false;
    const colors = background.mode === 'solid' ? [background.solid] : background.colors;
    const average = colors.reduce((sum, color) => sum + hexLuminance(color), 0) / Math.max(1, colors.length);
    return average < 0.28;
  }

  function imageIdsForState(project) {
    const ids = new Set();
    for (const item of project?.messages || []) {
      const attachment = normalizeImageAttachment(item?.imageAttachment);
      if (attachment?.id) ids.add(attachment.id);
      const preview = normalizeLinkPreview(item?.linkPreview);
      if (preview?.thumbnail?.id) ids.add(preview.thumbnail.id);
    }
    return ids;
  }

  function mergeImageIds(target, project) {
    for (const id of imageIdsForState(project)) target.add(id);
    return target;
  }

  async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Could not read image data.'));
      reader.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(dataUrl) {
    const match = String(dataUrl || '').match(/^data:([^;,]+);base64,(.*)$/s);
    if (!match) throw new Error('Invalid embedded image data.');
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: match[1] || 'application/octet-stream' });
  }

  async function serializeMediaForIds(ids) {
    const media = [];
    for (const id of ids) {
      const record = await getMediaRecord(id);
      if (!record?.blob) continue;
      media.push({
        id: record.id,
        name: record.name || 'image',
        mime: record.mime || record.blob.type || 'image/jpeg',
        width: Number(record.width) || 1,
        height: Number(record.height) || 1,
        size: Number(record.size) || record.blob.size || 0,
        dataUrl: await blobToDataUrl(record.blob)
      });
    }
    return media;
  }

  async function restoreEmbeddedMedia(media) {
    if (!Array.isArray(media)) return;
    clearTimeout(mediaGcTimer);
    mediaGcTimer = null;
    for (const entry of media) {
      if (!entry || typeof entry.id !== 'string' || !entry.id || typeof entry.dataUrl !== 'string') continue;
      try {
        const blob = dataUrlToBlob(entry.dataUrl);
        await putMediaRecord({
          id: entry.id,
          name: typeof entry.name === 'string' && entry.name ? entry.name : 'image',
          mime: ['image/jpeg', 'image/png'].includes(entry.mime) ? entry.mime : (blob.type || 'image/jpeg'),
          width: Math.max(1, Number(entry.width) || 1),
          height: Math.max(1, Number(entry.height) || 1),
          size: blob.size,
          blob,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Skipped an invalid embedded ThreadWriter image.', error);
      }
    }
  }

  async function getMediaObjectUrl(id) {
    if (!id) return null;
    if (mediaObjectUrls.has(id)) return mediaObjectUrls.get(id);
    const record = await getMediaRecord(id);
    if (!record?.blob) return null;
    const url = URL.createObjectURL(record.blob);
    mediaObjectUrls.set(id, url);
    return url;
  }

  async function mountAttachmentImage(img, attachment, placeholder = null) {
    const normalized = normalizeImageAttachment(attachment);
    if (!normalized) return;
    const url = await getMediaObjectUrl(normalized.id);
    if (!img.isConnected) return;
    if (!url) {
      img.hidden = true;
      if (placeholder) {
        placeholder.hidden = false;
        placeholder.textContent = `[Image unavailable: ${normalized.name}]`;
      }
      return;
    }
    img.src = url;
    img.hidden = false;
    if (placeholder) placeholder.hidden = true;
  }

  async function decodeImageFile(file) {
    if (typeof createImageBitmap === 'function') {
      try { return await createImageBitmap(file); } catch {}
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The selected image could not be decoded by this browser.')); };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('This browser could not prepare the image.')), type, quality);
    });
  }

  async function normalizeAndStoreImage(file) {
    if (!file) throw new Error('No image was selected.');
    clearTimeout(mediaGcTimer);
    mediaGcTimer = null;
    if (file.type && !file.type.startsWith('image/')) throw new Error('Please choose an image file.');
    if (file.size > MAX_IMAGE_FILE_BYTES) throw new Error('That image is larger than 25 MB. Please choose a smaller source image.');

    const source = await decodeImageFile(file);
    const sourceWidth = Number(source.width || source.naturalWidth) || 1;
    const sourceHeight = Number(source.height || source.naturalHeight) || 1;
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    if (outputMime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(source, 0, 0, width, height);
    source.close?.();
    const blob = await canvasToBlob(canvas, outputMime, outputMime === 'image/jpeg' ? 0.88 : undefined);
    const id = crypto.randomUUID ? crypto.randomUUID() : `image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const record = {
      id,
      name: file.name || (outputMime === 'image/png' ? 'image.png' : 'image.jpg'),
      mime: outputMime,
      width,
      height,
      size: blob.size,
      blob,
      createdAt: new Date().toISOString()
    };
    await putMediaRecord(record);
    return record;
  }

  function imageAttachmentFromRecord(record, previous = null) {
    const old = normalizeImageAttachment(previous);
    return {
      id: record.id,
      name: record.name || 'image',
      mime: record.mime || 'image/jpeg',
      width: record.width,
      height: record.height,
      size: record.size || record.blob?.size || 0,
      caption: old?.caption || '',
      altText: old?.altText || ''
    };
  }

  function startImagePicker(itemId) {
    const item = state.messages.find(entry => entry.id === itemId);
    if (!item) return;
    imageTargetItemId = itemId;
    els.imageInput.value = '';
    els.imageInput.click();
  }

  async function attachImageToItem(itemId, file) {
    const item = state.messages.find(entry => entry.id === itemId);
    if (!item || !file) return;
    if (els.saveStatus) els.saveStatus.textContent = 'Preparing image…';
    try {
      const record = await normalizeAndStoreImage(file);
      item.imageAttachment = imageAttachmentFromRecord(record, item.imageAttachment);
      scheduleSave();
      renderThread();
      if (els.saveStatus) els.saveStatus.textContent = 'Image attached';
      scheduleMediaGarbageCollection();
    } catch (error) {
      console.error(error);
      if (els.saveStatus) els.saveStatus.textContent = 'Image not attached';
      alert(error.message || 'ThreadWriter could not attach that image.');
    }
  }

  function removeImageFromItem(itemId) {
    const item = state.messages.find(entry => entry.id === itemId);
    if (!item?.imageAttachment) return;
    delete item.imageAttachment;
    scheduleSave();
    renderThread();
    scheduleMediaGarbageCollection();
  }

  function openImageDetailsDialog(itemId) {
    const item = state.messages.find(entry => entry.id === itemId);
    const attachment = normalizeImageAttachment(item?.imageAttachment);
    if (!item || !attachment || !els.imageDetailsDialog) return;
    imageDetailsItemId = itemId;
    if (els.imageDetailsName) els.imageDetailsName.textContent = attachment.name || 'Image attachment';
    if (els.imageCaptionInput) els.imageCaptionInput.value = attachment.caption || '';
    if (els.imageAltInput) els.imageAltInput.value = attachment.altText || '';
    els.imageDetailsDialog.showModal();
    requestAnimationFrame(() => els.imageCaptionInput?.focus());
  }

  function closeImageDetailsDialog() {
    imageDetailsItemId = null;
    if (els.imageDetailsDialog?.open) els.imageDetailsDialog.close();
  }

  function saveImageDetails() {
    const item = state.messages.find(entry => entry.id === imageDetailsItemId);
    const attachment = normalizeImageAttachment(item?.imageAttachment);
    if (!item || !attachment) { closeImageDetailsDialog(); return; }
    attachment.caption = String(els.imageCaptionInput?.value || '').trim();
    attachment.altText = String(els.imageAltInput?.value || '').trim();
    item.imageAttachment = attachment;
    scheduleSave();
    renderThread();
    closeImageDetailsDialog();
  }

  els.closeImageDetailsDialogBtn?.addEventListener('click', closeImageDetailsDialog);
  els.saveImageDetailsBtn?.addEventListener('click', saveImageDetails);
  els.imageDetailsDialog?.addEventListener('cancel', event => {
    event.preventDefault();
    closeImageDetailsDialog();
  });
  [els.imageCaptionInput, els.imageAltInput].forEach(input => input?.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      saveImageDetails();
    }
  }));

  function openLinkPreviewDialog(itemId) {
    const item = state.messages.find(entry => entry.id === itemId);
    if (!item || !els.linkPreviewDialog) return;
    linkPreviewItemId = itemId;
    const preview = normalizeLinkPreview(item.linkPreview) || { site: '', title: '', description: '', displayUrl: '' };
    els.linkPreviewSiteInput.value = preview.site || '';
    els.linkPreviewTitleInput.value = preview.title || '';
    els.linkPreviewDescriptionInput.value = preview.description || '';
    els.linkPreviewUrlInput.value = preview.displayUrl || '';
    if (els.linkPreviewThumbnailStatus) els.linkPreviewThumbnailStatus.textContent = preview.thumbnail?.name || 'No thumbnail';
    if (els.removeLinkPreviewThumbnailBtn) els.removeLinkPreviewThumbnailBtn.hidden = !preview.thumbnail;
    if (els.removeLinkPreviewBtn) els.removeLinkPreviewBtn.hidden = !item.linkPreview;
    els.linkPreviewDialog.showModal();
    requestAnimationFrame(() => els.linkPreviewTitleInput?.focus());
  }

  function closeLinkPreviewDialog() {
    linkPreviewItemId = null;
    if (els.linkPreviewDialog?.open) els.linkPreviewDialog.close();
  }

  function saveLinkPreview() {
    const item = state.messages.find(entry => entry.id === linkPreviewItemId);
    if (!item) { closeLinkPreviewDialog(); return; }
    const existing = normalizeLinkPreview(item.linkPreview);
    const preview = {
      site: String(els.linkPreviewSiteInput?.value || '').trim(),
      title: String(els.linkPreviewTitleInput?.value || '').trim(),
      description: String(els.linkPreviewDescriptionInput?.value || '').trim(),
      displayUrl: String(els.linkPreviewUrlInput?.value || '').trim()
    };
    if (existing?.thumbnail) preview.thumbnail = existing.thumbnail;
    if (!preview.site && !preview.title && !preview.description && !preview.displayUrl && !preview.thumbnail) delete item.linkPreview;
    else item.linkPreview = preview;
    scheduleSave();
    renderThread();
    closeLinkPreviewDialog();
  }

  function removeLinkPreview() {
    const item = state.messages.find(entry => entry.id === linkPreviewItemId);
    if (!item?.linkPreview) { closeLinkPreviewDialog(); return; }
    delete item.linkPreview;
    scheduleSave();
    renderThread();
    closeLinkPreviewDialog();
    scheduleMediaGarbageCollection();
  }

  function chooseLinkPreviewThumbnail() {
    if (!linkPreviewItemId) return;
    linkPreviewImageTargetId = linkPreviewItemId;
    els.linkPreviewImageInput.value = '';
    els.linkPreviewImageInput.click();
  }

  async function attachLinkPreviewThumbnail(itemId, file) {
    const item = state.messages.find(entry => entry.id === itemId);
    if (!item || !file) return;
    if (els.saveStatus) els.saveStatus.textContent = 'Preparing preview thumbnail…';
    try {
      const record = await normalizeAndStoreImage(file);
      const preview = normalizeLinkPreview(item.linkPreview) || { site: '', title: '', description: '', displayUrl: '' };
      preview.thumbnail = imageAttachmentFromRecord(record, preview.thumbnail);
      item.linkPreview = preview;
      if (els.linkPreviewThumbnailStatus) els.linkPreviewThumbnailStatus.textContent = preview.thumbnail.name || 'Thumbnail';
      if (els.removeLinkPreviewThumbnailBtn) els.removeLinkPreviewThumbnailBtn.hidden = false;
      if (els.removeLinkPreviewBtn) els.removeLinkPreviewBtn.hidden = false;
      scheduleSave();
      renderThread();
      if (els.saveStatus) els.saveStatus.textContent = 'Preview thumbnail attached';
      scheduleMediaGarbageCollection();
    } catch (error) {
      console.error(error);
      if (els.saveStatus) els.saveStatus.textContent = 'Thumbnail not attached';
      alert(error.message || 'ThreadWriter could not attach that thumbnail.');
    }
  }

  function removeLinkPreviewThumbnail() {
    const item = state.messages.find(entry => entry.id === linkPreviewItemId);
    const preview = normalizeLinkPreview(item?.linkPreview);
    if (!item || !preview?.thumbnail) return;
    delete preview.thumbnail;
    item.linkPreview = preview;
    if (els.linkPreviewThumbnailStatus) els.linkPreviewThumbnailStatus.textContent = 'No thumbnail';
    if (els.removeLinkPreviewThumbnailBtn) els.removeLinkPreviewThumbnailBtn.hidden = true;
    scheduleSave();
    renderThread();
    scheduleMediaGarbageCollection();
  }

  els.closeLinkPreviewDialogBtn?.addEventListener('click', closeLinkPreviewDialog);
  els.saveLinkPreviewBtn?.addEventListener('click', saveLinkPreview);
  els.removeLinkPreviewBtn?.addEventListener('click', removeLinkPreview);
  els.chooseLinkPreviewThumbnailBtn?.addEventListener('click', chooseLinkPreviewThumbnail);
  els.removeLinkPreviewThumbnailBtn?.addEventListener('click', removeLinkPreviewThumbnail);
  els.linkPreviewDialog?.addEventListener('cancel', event => { event.preventDefault(); closeLinkPreviewDialog(); });
  els.linkPreviewImageInput?.addEventListener('change', async () => {
    const file = els.linkPreviewImageInput.files?.[0];
    const targetId = linkPreviewImageTargetId;
    linkPreviewImageTargetId = null;
    if (file && targetId) await attachLinkPreviewThumbnail(targetId, file);
  });
  [els.linkPreviewSiteInput, els.linkPreviewTitleInput, els.linkPreviewDescriptionInput, els.linkPreviewUrlInput].forEach(input => input?.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      saveLinkPreview();
    }
  }));

  async function garbageCollectMedia() {
    try {
      const referenced = new Set();
      mergeImageIds(referenced, state);
      for (const id of Object.keys(library.documents || {})) {
        const doc = id === currentDocumentId ? state : readStoredDocument(id);
        if (doc) mergeImageIds(referenced, doc);
        const history = loadHistory(id);
        for (const snapshot of history.snapshots) mergeImageIds(referenced, snapshot.state);
      }
      const keys = await getAllMediaKeys();
      for (const id of keys) {
        if (referenced.has(id)) continue;
        const url = mediaObjectUrls.get(id);
        if (url) URL.revokeObjectURL(url);
        mediaObjectUrls.delete(id);
        await deleteMediaRecord(id);
      }
    } catch (error) {
      console.warn('ThreadWriter image cleanup skipped.', error);
    }
  }

  function scheduleMediaGarbageCollection() {
    clearTimeout(mediaGcTimer);
    mediaGcTimer = setTimeout(() => garbageCollectMedia(), 3500);
  }

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

  function normalizeConversationWidth(value) {
    return value === 'tablet' || value === 'phone' ? value : 'wide';
  }

  function normalizeBubbleTextMode(value) {
    return value === 'black' || value === 'white' || value === 'custom' ? value : 'auto';
  }

  function relativeLuminance(hex) {
    const normalized = normalizeHex(hex, '#e5e5ea').slice(1);
    const channels = [0, 2, 4].map(index => parseInt(normalized.slice(index, index + 2), 16) / 255)
      .map(channel => channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4));
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function automaticBubbleTextColor(background) {
    const luminance = relativeLuminance(background);
    const blackContrast = (luminance + 0.05) / 0.05;
    const whiteContrast = 1.05 / (luminance + 0.05);
    return whiteContrast > blackContrast ? '#ffffff' : '#111116';
  }

  function participantBubbleTextColor(participant) {
    const mode = normalizeBubbleTextMode(participant?.textColorMode);
    if (mode === 'black') return '#111116';
    if (mode === 'white') return '#ffffff';
    if (mode === 'custom') return normalizeHex(participant?.textColor, '#ff2d55');
    return automaticBubbleTextColor(participant?.color || '#e5e5ea');
  }

  function blankConversationPresetLibrary() {
    return { version: 1, presets: [] };
  }

  function normalizeConversationPreset(value, index = 0) {
    if (!value || typeof value !== 'object') return null;
    const participants = Array.isArray(value.participants) ? value.participants.map((participant, participantIndex) => ({
      name: typeof participant?.name === 'string' && participant.name.trim() ? participant.name.trim() : `Participant ${participantIndex + 1}`,
      side: participant?.side === 'right' ? 'right' : 'left',
      color: normalizeHex(participant?.color, '#e5e5ea'),
      textColorMode: normalizeBubbleTextMode(participant?.textColorMode),
      textColor: normalizeHex(participant?.textColor, '#ff2d55')
    })).slice(0, 24) : [];
    if (!participants.length) return null;
    return {
      id: typeof value.id === 'string' && value.id ? value.id : `preset-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      name: typeof value.name === 'string' && value.name.trim() ? value.name.trim() : `Preset ${index + 1}`,
      conversationStyle: normalizeConversationStyle(value.conversationStyle),
      conversationWidth: normalizeConversationWidth(value.conversationWidth),
      conversationBackground: normalizeConversationBackground(value.conversationBackground),
      highContrastLabels: value.highContrastLabels === true,
      participants,
      createdAt: value.createdAt || new Date().toISOString(),
      updatedAt: value.updatedAt || value.createdAt || new Date().toISOString()
    };
  }

  function loadConversationPresetLibrary() {
    try {
      const raw = localStorage.getItem(CONVERSATION_PRESETS_KEY);
      if (!raw) return blankConversationPresetLibrary();
      const parsed = JSON.parse(raw);
      const rawPresets = Array.isArray(parsed?.presets) ? parsed.presets : [];
      return { version: 1, presets: rawPresets.map(normalizeConversationPreset).filter(Boolean) };
    } catch {
      return blankConversationPresetLibrary();
    }
  }

  function saveConversationPresetLibrary() {
    try {
      localStorage.setItem(CONVERSATION_PRESETS_KEY, JSON.stringify(conversationPresetLibrary));
      return true;
    } catch (error) {
      console.error('ThreadWriter conversation preset save failed', error);
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
    const participants = project.participants.map((p, index) => ({
      id: p.id || `p${index + 1}`,
      name: typeof p.name === 'string' && p.name.trim() ? p.name : `Participant ${index + 1}`,
      side: p.side === 'right' ? 'right' : 'left',
      color: /^#?[0-9a-fA-F]{6}$/.test(String(p.color || '')) ? (String(p.color).startsWith('#') ? p.color : `#${p.color}`) : '#e5e5ea',
      textColorMode: normalizeBubbleTextMode(p.textColorMode),
      textColor: normalizeHex(p.textColor, '#ff2d55')
    }));
    const fallbackSpeakerId = participants[0]?.id || null;
    return {
      ...project,
      version: 8,
      title: typeof project.title === 'string' ? project.title : base.title,
      sceneHeader: typeof project.sceneHeader === 'string' ? project.sceneHeader : '',
      headerFont: allowedFonts.has(project.headerFont) ? project.headerFont : 'rounded',
      conversationStyle: normalizeConversationStyle(project.conversationStyle),
      conversationWidth: normalizeConversationWidth(project.conversationWidth),
      conversationBackground: normalizeConversationBackground(project.conversationBackground),
      highContrastLabels: project.highContrastLabels === true,
      activeParticipantId: project.activeParticipantId || fallbackSpeakerId,
      participants,
      messages: project.messages.map((m, index) => {
        const kind = m?.kind === 'narrative' ? 'narrative' : 'message';
        const item = {
          ...m,
          kind,
          id: m?.id || `m${Date.now()}-${index}`,
          text: typeof m?.text === 'string' ? m.text : String(m?.text ?? ''),
          createdAt: m?.createdAt || new Date().toISOString()
        };
        const imageAttachment = normalizeImageAttachment(m?.imageAttachment);
        if (imageAttachment) item.imageAttachment = imageAttachment;
        else delete item.imageAttachment;
        const linkPreview = normalizeLinkPreview(m?.linkPreview);
        if (linkPreview) item.linkPreview = linkPreview;
        else delete item.linkPreview;
        if (kind === 'narrative') {
          item.narrativeStyle = m?.narrativeStyle === 'system' ? 'system' : 'narrative';
          delete item.speakerId;
          delete item.annotation;
          delete item.displayTimestamp;
        } else {
          item.speakerId = m?.speakerId || fallbackSpeakerId;
          item.annotation = typeof m?.annotation === 'string' ? m.annotation : '';
        }
        return item;
      })
    };
  }

  function isNarrative(item) {
    return item?.kind === 'narrative';
  }

  function isMessage(item) {
    return !isNarrative(item);
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
      scheduleMediaGarbageCollection();
      return true;
    } catch (error) {
      console.warn('ThreadWriter history save failed; pruning snapshots.', error);
      try {
        payload.snapshots = payload.snapshots.slice(0, Math.min(6, HISTORY_MAX));
        localStorage.setItem(historyStorageKey(id), JSON.stringify(payload));
        scheduleMediaGarbageCollection();
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
    const previousImageIds = imageIdsForState(previousState);
    const nextImageIds = imageIdsForState(nextState);
    const removedOrReplacedImage = [...previousImageIds].some(id => !nextImageIds.has(id));
    const destructive = (nextState.messages?.length || 0) < (previousState.messages?.length || 0)
      || (nextState.participants?.length || 0) < (previousState.participants?.length || 0)
      || removedOrReplacedImage;
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

  function wordCountForItem(item) {
    const caption = normalizeImageAttachment(item?.imageAttachment)?.caption || '';
    const preview = normalizeLinkPreview(item?.linkPreview);
    return countWordsInText(item?.text || '') + countWordsInText(caption)
      + countWordsInText(preview?.title || '') + countWordsInText(preview?.description || '');
  }

  function wordCountForState(project) {
    return project.messages.reduce((sum, item) => sum + wordCountForItem(item), 0);
  }

  function previewForState(project) {
    const first = project.messages.find(item => String(item.text || '').trim());
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

  function applyConversationPresentation() {
    const background = normalizeConversationBackground(state.conversationBackground);
    state.conversationBackground = background;
    if (!els.conversationCanvas) return;
    const css = conversationBackgroundCss(background);
    els.conversationCanvas.style.background = css || '';
    const customBackground = background.mode !== 'default';
    const darkBackground = customBackground && customBackgroundIsDark(background);
    els.conversationCanvas.classList.toggle('custom-background', customBackground);
    els.conversationCanvas.classList.toggle('custom-background-dark', darkBackground);
    els.conversationCanvas.classList.toggle('custom-background-light', customBackground && !darkBackground);
    els.conversationCanvas.classList.toggle('high-contrast-labels', state.highContrastLabels === true);
    const width = normalizeConversationWidth(state.conversationWidth);
    els.conversationCanvas.classList.toggle('width-tablet', width === 'tablet');
    els.conversationCanvas.classList.toggle('width-phone', width === 'phone');
  }

  function render() {
    ensureActiveParticipant();
    els.title.value = state.title || 'Untitled Thread';
    els.conversationStyle.value = state.conversationStyle || 'chat';
    if (els.conversationWidth) els.conversationWidth.value = normalizeConversationWidth(state.conversationWidth);
    applyConversationPresentation();
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

  function makeImageAttachmentElement(item, kind = 'message', findFlags = {}) {
    const attachment = normalizeImageAttachment(item?.imageAttachment);
    if (!attachment) return null;
    const frame = document.createElement('figure');
    frame.className = `image-attachment image-attachment-${kind}`;
    frame.title = attachment.name || 'Image attachment';
    if (findFlags.altMatch) frame.classList.add('image-alt-match');
    if (findFlags.altCurrent) frame.classList.add('image-alt-current');

    const img = document.createElement('img');
    img.className = 'attached-image';
    img.alt = attachment.altText || `Image attachment: ${attachment.name || 'image'}`;
    img.loading = 'eager';
    if (attachment.width && attachment.height) {
      img.width = attachment.width;
      img.height = attachment.height;
      img.style.aspectRatio = `${attachment.width} / ${attachment.height}`;
    }

    const placeholder = document.createElement('div');
    placeholder.className = 'image-attachment-placeholder';
    placeholder.textContent = `Loading image…`;
    frame.append(img, placeholder);

    if (attachment.caption) {
      const caption = document.createElement('figcaption');
      caption.className = 'image-caption';
      if (findFlags.captionMatch) caption.classList.add('find-match');
      if (findFlags.captionCurrent) caption.classList.add('find-current');
      caption.textContent = attachment.caption;
      caption.tabIndex = 0;
      caption.title = 'Edit image caption and alt text';
      caption.addEventListener('click', () => openImageDetailsDialog(item.id));
      caption.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openImageDetailsDialog(item.id);
        }
      });
      frame.appendChild(caption);
    }

    mountAttachmentImage(img, attachment, placeholder);
    return frame;
  }

  function makeLinkPreviewElement(item, kind = 'message', findFlags = {}) {
    const preview = normalizeLinkPreview(item?.linkPreview);
    if (!preview) return null;
    const card = document.createElement('div');
    card.className = `link-preview-card link-preview-${kind}`;
    card.tabIndex = 0;
    card.title = 'Edit faux link preview';
    if (findFlags.match) card.classList.add('find-match');
    if (findFlags.current) card.classList.add('find-current');
    card.addEventListener('click', () => openLinkPreviewDialog(item.id));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openLinkPreviewDialog(item.id); }
    });
    if (preview.thumbnail) {
      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'link-preview-thumbnail';
      const img = document.createElement('img');
      img.alt = ''; img.loading = 'eager';
      const placeholder = document.createElement('div');
      placeholder.className = 'link-preview-thumbnail-placeholder';
      placeholder.textContent = 'Image';
      thumbWrap.append(img, placeholder);
      mountAttachmentImage(img, preview.thumbnail, placeholder);
      card.appendChild(thumbWrap);
    }
    const body = document.createElement('div'); body.className = 'link-preview-body';
    if (preview.site) { const el = document.createElement('div'); el.className = 'link-preview-site'; el.textContent = preview.site; body.appendChild(el); }
    if (preview.title) { const el = document.createElement('div'); el.className = 'link-preview-title'; el.textContent = preview.title; body.appendChild(el); }
    if (preview.description) { const el = document.createElement('div'); el.className = 'link-preview-description'; el.textContent = preview.description; body.appendChild(el); }
    if (preview.displayUrl) { const el = document.createElement('div'); el.className = 'link-preview-url'; el.textContent = preview.displayUrl; body.appendChild(el); }
    card.appendChild(body);
    return card;
  }

  function renderThread() {
    updateWordCount();
    els.thread.innerHTML = '';
    ['transcript', 'theater', 'screen'].forEach(style => els.thread.classList.toggle(`style-${style}`, state.conversationStyle === style));

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
      empty.innerHTML = '<strong>Your thread is empty.</strong><br>Choose a participant and write below, or add a Narrative block from Text.';
      els.thread.appendChild(empty);
      return;
    }

    if (findState.query) findState.matches = computeFindMatches();
    const textMatchIds = new Set(findState.matches.filter(match => match.field === 'text').map(match => match.messageId));
    const annotationMatchIds = new Set(findState.matches.filter(match => match.field === 'annotation').map(match => match.messageId));
    const captionMatchIds = new Set(findState.matches.filter(match => match.field === 'imageCaption').map(match => match.messageId));
    const altTextMatchIds = new Set(findState.matches.filter(match => match.field === 'imageAltText').map(match => match.messageId));
    const linkPreviewMatchIds = new Set(findState.matches.filter(match => match.field.startsWith('linkPreview')).map(match => match.messageId));
    const currentMatch = findState.matches[findState.current];

    state.messages.forEach((item, index) => {
      if (isNarrative(item)) {
        const row = document.createElement('article');
        row.className = `narrative-row narrative-${item.narrativeStyle === 'system' ? 'system' : 'narrative'}`;
        if (textMatchIds.has(item.id)) row.classList.add('find-match');
        if (currentMatch?.messageId === item.id && currentMatch.field === 'text') row.classList.add('find-current');
        row.dataset.messageId = item.id;

        const card = document.createElement('div');
        card.className = 'narrative-card';
        const text = document.createElement('div');
        text.className = 'narrative-text';
        text.textContent = item.text;
        text.tabIndex = 0;

        const actions = document.createElement('div');
        actions.className = 'message-actions narrative-actions';
        const menuButton = document.createElement('button');
        menuButton.type = 'button';
        menuButton.className = 'message-menu-button';
        menuButton.textContent = '⋯';
        menuButton.setAttribute('aria-label', 'Options for narrative block');
        menuButton.setAttribute('aria-expanded', 'false');

        const menu = document.createElement('div');
        menu.className = 'message-menu';
        menu.hidden = true;
        menu.setAttribute('role', 'menu');
        const hasImage = Boolean(item.imageAttachment);
        const hasLinkPreview = Boolean(item.linkPreview);
        const showRoot = () => {
          const controls = [];
          if (hasImage || hasLinkPreview) controls.push(makeSubmenuButton('Edit', () => showEdit()));
          else controls.push(makeToolButton('Edit', () => { closeMessageMenus(); openNarrativeDialog(item.id); }));
          controls.push(makeSubmenuButton('Insert', () => showInsert()));
          controls.push(makeSubmenuButton('Move', () => showMove()));
          if (!hasImage || !hasLinkPreview) controls.push(makeSubmenuButton('Add', () => showAdd()));
          controls.push(makeToolButton('Delete', () => { closeMessageMenus(); deleteMessage(item.id); }, true));
          setMessageMenuPage(menu, controls);
        };
        const showEdit = () => {
          const controls = [makeToolButton('Text', () => { closeMessageMenus(); openNarrativeDialog(item.id); })];
          if (hasImage) {
            controls.push(makeToolButton('Image details…', () => { closeMessageMenus(); openImageDetailsDialog(item.id); }));
            controls.push(makeToolButton('Replace image…', () => { closeMessageMenus(); startImagePicker(item.id); }));
            controls.push(makeToolButton('Remove image', () => { closeMessageMenus(); removeImageFromItem(item.id); }, true));
          }
          if (hasLinkPreview) controls.push(makeToolButton('Link preview…', () => { closeMessageMenus(); openLinkPreviewDialog(item.id); }));
          setMessageMenuPage(menu, controls, showRoot, 'Edit');
        };
        const showMove = () => {
          const moveUp = makeToolButton('Up', () => { closeMessageMenus(); moveMessage(item.id, -1); });
          const moveDown = makeToolButton('Down', () => { closeMessageMenus(); moveMessage(item.id, 1); });
          moveUp.disabled = index === 0;
          moveDown.disabled = index === state.messages.length - 1;
          setMessageMenuPage(menu, [moveUp, moveDown], showRoot, 'Move');
        };
        const showInsert = () => {
          const messageAbove = makeToolButton('Message above', () => { closeMessageMenus(); insertMessageAdjacent(item.id, 0); });
          const messageBelow = makeToolButton('Message below', () => { closeMessageMenus(); insertMessageAdjacent(item.id, 1); });
          const narrativeAbove = makeToolButton('Narrative above…', () => { closeMessageMenus(); openNarrativeDialog(null, index); });
          const narrativeBelow = makeToolButton('Narrative below…', () => { closeMessageMenus(); openNarrativeDialog(null, index + 1); });
          setMessageMenuPage(menu, [messageAbove, messageBelow, narrativeAbove, narrativeBelow], showRoot, 'Insert');
        };
        const showAdd = () => {
          const controls = [];
          if (!hasImage) controls.push(makeToolButton('Image…', () => { closeMessageMenus(); startImagePicker(item.id); }));
          if (!hasLinkPreview) controls.push(makeToolButton('Link preview…', () => { closeMessageMenus(); openLinkPreviewDialog(item.id); }));
          setMessageMenuPage(menu, controls, showRoot, 'Add');
        };
        menu._threadwriterShowRoot = showRoot;
        showRoot();

        menuButton.addEventListener('click', e => {
          e.stopPropagation();
          const opening = menu.hidden;
          closeMessageMenus();
          if (opening) menu._threadwriterShowRoot?.();
          menu.hidden = !opening;
          menuButton.setAttribute('aria-expanded', String(opening));
          if (opening) requestAnimationFrame(() => positionMessageMenu(menu, menuButton, row));
        });
        menu.addEventListener('click', e => e.stopPropagation());
        actions.append(menuButton, menu);
        card.appendChild(text);
        const narrativeImage = makeImageAttachmentElement(item, 'narrative', {
          captionMatch: captionMatchIds.has(item.id),
          captionCurrent: currentMatch?.messageId === item.id && currentMatch.field === 'imageCaption',
          altMatch: altTextMatchIds.has(item.id),
          altCurrent: currentMatch?.messageId === item.id && currentMatch.field === 'imageAltText'
        });
        if (narrativeImage) card.appendChild(narrativeImage);
        const narrativePreview = makeLinkPreviewElement(item, 'narrative', {
          match: linkPreviewMatchIds.has(item.id),
          current: currentMatch?.messageId === item.id && currentMatch.field.startsWith('linkPreview')
        });
        if (narrativePreview) card.appendChild(narrativePreview);
        card.appendChild(actions);
        row.appendChild(card);
        els.thread.appendChild(row);
        return;
      }

      const p = getParticipant(item.speakerId);
      if (!p) return;

      const previous = state.messages[index - 1];
      const continuesSpeaker = isMessage(previous) && previous?.speakerId === item.speakerId;
      const showSpeakerLabel = state.conversationStyle !== 'chat' || !continuesSpeaker;

      const row = document.createElement('article');
      row.className = `message-row ${p.side}${continuesSpeaker ? ' continuation' : ' speaker-start'}${item.displayTimestamp ? ' timestamped' : ''}`;
      if (textMatchIds.has(item.id)) row.classList.add('find-match');
      if (currentMatch?.messageId === item.id && currentMatch.field === 'text') row.classList.add('find-current');
      row.dataset.messageId = item.id;

      const card = document.createElement('div');
      card.className = 'message-card';

      if (showSpeakerLabel) {
        const label = document.createElement('div');
        label.className = 'speaker-label';
        label.textContent = p.name;
        card.appendChild(label);
      }

      if (item.displayTimestamp) {
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = item.displayTimestamp;
        card.appendChild(timestamp);
      }

      const bubbleWrap = document.createElement('div');
      bubbleWrap.className = 'bubble-wrap';

      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.style.setProperty('--bubble-color', p.color);
      bubble.style.setProperty('--bubble-text-color', participantBubbleTextColor(p));
      bubble.textContent = item.text;
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

      const hasAnnotation = Boolean(item.annotation);
      const hasTimestamp = Boolean(item.displayTimestamp);
      const hasImage = Boolean(item.imageAttachment);
      const hasLinkPreview = Boolean(item.linkPreview);
      const showRoot = () => {
        const controls = [];
        if (hasAnnotation || hasTimestamp || hasImage || hasLinkPreview) {
          controls.push(makeSubmenuButton('Edit', () => showEdit()));
        } else {
          controls.push(makeToolButton('Edit', () => { closeMessageMenus(); startEditMessage(item.id, bubble); }));
        }
        controls.push(makeToolButton('Change speaker', () => { closeMessageMenus(); cycleMessageSpeaker(item.id); }));
        controls.push(makeSubmenuButton('Move', () => showMove()));
        controls.push(makeSubmenuButton('Insert', () => showInsert()));
        if (!hasAnnotation || !hasTimestamp || !hasImage || !hasLinkPreview) controls.push(makeSubmenuButton('Add', () => showAdd()));
        controls.push(makeToolButton('Delete', () => { closeMessageMenus(); deleteMessage(item.id); }, true));
        setMessageMenuPage(menu, controls);
      };
      const showEdit = () => {
        const controls = [makeToolButton('Message', () => { closeMessageMenus(); startEditMessage(item.id, bubble); })];
        if (hasAnnotation) controls.push(makeToolButton('Annotation…', () => { closeMessageMenus(); openAnnotationDialog(item.id); }));
        if (hasTimestamp) controls.push(makeToolButton('Timestamp…', () => { closeMessageMenus(); openTimestampDialog(item.id); }));
        if (hasImage) {
          controls.push(makeToolButton('Image details…', () => { closeMessageMenus(); openImageDetailsDialog(item.id); }));
          controls.push(makeToolButton('Replace image…', () => { closeMessageMenus(); startImagePicker(item.id); }));
          controls.push(makeToolButton('Remove image', () => { closeMessageMenus(); removeImageFromItem(item.id); }, true));
        }
        if (hasLinkPreview) controls.push(makeToolButton('Link preview…', () => { closeMessageMenus(); openLinkPreviewDialog(item.id); }));
        setMessageMenuPage(menu, controls, showRoot, 'Edit');
      };
      const showMove = () => {
        const moveUp = makeToolButton('Up', () => { closeMessageMenus(); moveMessage(item.id, -1); });
        const moveDown = makeToolButton('Down', () => { closeMessageMenus(); moveMessage(item.id, 1); });
        moveUp.disabled = index === 0;
        moveDown.disabled = index === state.messages.length - 1;
        setMessageMenuPage(menu, [moveUp, moveDown], showRoot, 'Move');
      };
      const showInsert = () => {
        const messageAbove = makeToolButton('Message above', () => { closeMessageMenus(); insertMessageAdjacent(item.id, 0); });
        const messageBelow = makeToolButton('Message below', () => { closeMessageMenus(); insertMessageAdjacent(item.id, 1); });
        const narrativeAbove = makeToolButton('Narrative above…', () => { closeMessageMenus(); openNarrativeDialog(null, index); });
        const narrativeBelow = makeToolButton('Narrative below…', () => { closeMessageMenus(); openNarrativeDialog(null, index + 1); });
        setMessageMenuPage(menu, [messageAbove, messageBelow, narrativeAbove, narrativeBelow], showRoot, 'Insert');
      };
      const showAdd = () => {
        const controls = [];
        if (!hasAnnotation) controls.push(makeToolButton('Annotation…', () => { closeMessageMenus(); openAnnotationDialog(item.id); }));
        if (!hasTimestamp) controls.push(makeToolButton('Timestamp…', () => { closeMessageMenus(); openTimestampDialog(item.id); }));
        if (!hasImage) controls.push(makeToolButton('Image…', () => { closeMessageMenus(); startImagePicker(item.id); }));
        if (!hasLinkPreview) controls.push(makeToolButton('Link preview…', () => { closeMessageMenus(); openLinkPreviewDialog(item.id); }));
        setMessageMenuPage(menu, controls, showRoot, 'Add');
      };
      menu._threadwriterShowRoot = showRoot;
      showRoot();

      menuButton.addEventListener('click', e => {
        e.stopPropagation();
        const opening = menu.hidden;
        closeMessageMenus();
        if (opening) menu._threadwriterShowRoot?.();
        menu.hidden = !opening;
        menuButton.setAttribute('aria-expanded', String(opening));
        if (opening) requestAnimationFrame(() => positionMessageMenu(menu, menuButton, row));
      });
      menu.addEventListener('click', e => e.stopPropagation());

      actions.append(menuButton, menu);
      bubbleWrap.append(bubble, actions);
      card.appendChild(bubbleWrap);

      const messageImage = makeImageAttachmentElement(item, 'message', {
        captionMatch: captionMatchIds.has(item.id),
        captionCurrent: currentMatch?.messageId === item.id && currentMatch.field === 'imageCaption',
        altMatch: altTextMatchIds.has(item.id),
        altCurrent: currentMatch?.messageId === item.id && currentMatch.field === 'imageAltText'
      });
      if (messageImage) card.appendChild(messageImage);
      const messagePreview = makeLinkPreviewElement(item, 'message', {
        match: linkPreviewMatchIds.has(item.id),
        current: currentMatch?.messageId === item.id && currentMatch.field.startsWith('linkPreview')
      });
      if (messagePreview) card.appendChild(messagePreview);

      if (item.annotation) {
        const note = document.createElement('div');
        note.className = 'message-annotation';
        if (annotationMatchIds.has(item.id)) note.classList.add('find-match');
        if (currentMatch?.messageId === item.id && currentMatch.field === 'annotation') note.classList.add('find-current');
        note.textContent = item.annotation;
        note.tabIndex = 0;
        note.title = 'Edit message annotation';
        note.addEventListener('click', () => openAnnotationDialog(item.id));
        note.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openAnnotationDialog(item.id);
          }
        });
        card.appendChild(note);
      }

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
    const count = wordCountForState(state);
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

  function makeSubmenuButton(label, action) {
    const b = makeToolButton(label, action);
    b.classList.add('message-submenu-toggle');
    b.setAttribute('aria-haspopup', 'menu');
    const chevron = document.createElement('span');
    chevron.className = 'message-submenu-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';
    b.appendChild(chevron);
    return b;
  }

  function setMessageMenuPage(menu, controls, backAction = null, title = '') {
    menu.replaceChildren();
    menu._threadwriterBack = backAction || null;
    if (backAction) {
      const head = document.createElement('div');
      head.className = 'message-menu-subhead';
      const back = makeToolButton('‹ Back', () => backAction());
      back.classList.add('message-menu-back');
      const label = document.createElement('span');
      label.className = 'message-menu-page-title';
      label.textContent = title;
      head.append(back, label);
      menu.appendChild(head);
    }
    controls.forEach(control => menu.appendChild(control));
    if (!menu.hidden && menu._threadwriterButton && menu._threadwriterRow) {
      requestAnimationFrame(() => {
        const button = menu._threadwriterButton;
        const row = menu._threadwriterRow;
        if (!menu.hidden && button?.isConnected && row?.isConnected) positionMessageMenu(menu, button, row);
      });
    }
  }

  function insertMessageAdjacent(referenceId, offset) {
    const referenceIndex = state.messages.findIndex(item => item.id === referenceId);
    if (referenceIndex < 0) return;
    const reference = state.messages[referenceIndex];
    const speakerId = isMessage(reference) && getParticipant(reference.speakerId) ? reference.speakerId : state.activeParticipantId;
    const newMessage = {
      kind: 'message',
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      speakerId,
      text: '',
      annotation: '',
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
    if (!menu || !button || !row) return;
    const vv = window.visualViewport;
    const viewLeft = vv?.offsetLeft || 0;
    const viewTop = vv?.offsetTop || 0;
    const viewWidth = vv?.width || window.innerWidth;
    const viewHeight = vv?.height || window.innerHeight;
    const pad = 8;
    const gap = 6;
    const buttonRect = button.getBoundingClientRect();

    // Keep the popover in the top-level viewport layer on every device. This avoids
    // transformed/overflowing message containers and lets the menu float above the
    // fixed composer instead of disappearing behind it near the bottom of the page.
    if (!menu._threadwriterHome) menu._threadwriterHome = menu.parentElement;
    menu._threadwriterButton = button;
    menu._threadwriterRow = row;
    if (menu.parentElement !== document.body) document.body.appendChild(menu);
    menu.style.position = 'fixed';
    menu.style.right = 'auto';
    menu.style.bottom = 'auto';
    menu.style.zIndex = '100';
    menu.style.maxHeight = `${Math.max(120, viewHeight - pad * 2)}px`;
    menu.style.overflowY = 'auto';

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const preferLeft = row.classList.contains('right') || row.classList.contains('narrative-row');
    const roomLeft = buttonRect.left - gap - menuWidth >= viewLeft + pad;
    const roomRight = buttonRect.right + gap + menuWidth <= viewLeft + viewWidth - pad;

    let left;
    if (preferLeft && roomLeft) left = buttonRect.left - menuWidth - gap;
    else if (!preferLeft && roomRight) left = buttonRect.right + gap;
    else if (roomLeft) left = buttonRect.left - menuWidth - gap;
    else if (roomRight) left = buttonRect.right + gap;
    else left = buttonRect.left + (buttonRect.width - menuWidth) / 2;
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
    menu.style.maxHeight = '';
    menu.style.overflowY = '';
    if (menu._threadwriterHome?.isConnected) menu._threadwriterHome.appendChild(menu);
    delete menu._threadwriterHome;
    delete menu._threadwriterRow;
    menu._threadwriterBack = null;
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
    if (e.key !== 'Escape') return;
    const openMenu = document.querySelector('.message-menu:not([hidden])');
    if (openMenu?._threadwriterBack) {
      e.preventDefault();
      openMenu._threadwriterBack();
      return;
    }
    closeMessageMenus();
  });
  window.addEventListener('resize', closeMessageMenus);
  window.addEventListener('scroll', closeMessageMenus, { passive: true });
  window.visualViewport?.addEventListener('resize', closeMessageMenus);
  window.visualViewport?.addEventListener('scroll', closeMessageMenus);

  function startEditMessage(id, bubble, { removeIfBlank = false } = {}) {
    const msg = state.messages.find(m => m.id === id);
    if (!msg || !isMessage(msg)) return;
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
    if (!msg || !isMessage(msg)) return;
    const idx = state.participants.findIndex(p => p.id === msg.speakerId);
    msg.speakerId = state.participants[(idx + 1 + state.participants.length) % state.participants.length].id;
    scheduleSave();
    renderThread();
  }

  function deleteMessage(id) {
    state.messages = state.messages.filter(m => m.id !== id);
    if (pendingInsertId === id) pendingInsertId = null;
    scheduleSave();
    renderThread();
    scheduleMediaGarbageCollection();
  }

  function openTimestampDialog(id) {
    const msg = state.messages.find(m => m.id === id);
    if (!msg || !isMessage(msg)) return;
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

  function openAnnotationDialog(id) {
    const msg = state.messages.find(item => item.id === id);
    if (!msg || !isMessage(msg)) return;
    annotationMessageId = id;
    els.annotationInput.value = msg.annotation || '';
    els.removeAnnotationBtn.disabled = !msg.annotation;
    els.annotationDialog.showModal();
    requestAnimationFrame(() => {
      els.annotationInput.focus();
      els.annotationInput.select();
    });
  }

  function closeAnnotationDialog() {
    annotationMessageId = null;
    if (els.annotationDialog.open) els.annotationDialog.close();
  }

  els.closeAnnotationDialogBtn.addEventListener('click', closeAnnotationDialog);
  els.removeAnnotationBtn.addEventListener('click', () => {
    const msg = state.messages.find(item => item.id === annotationMessageId);
    if (!msg || !isMessage(msg)) return closeAnnotationDialog();
    msg.annotation = '';
    scheduleSave();
    renderThread();
    closeAnnotationDialog();
  });
  els.saveAnnotationBtn.addEventListener('click', () => {
    const msg = state.messages.find(item => item.id === annotationMessageId);
    if (!msg || !isMessage(msg)) return closeAnnotationDialog();
    msg.annotation = els.annotationInput.value.trimEnd();
    scheduleSave();
    renderThread();
    closeAnnotationDialog();
  });
  els.annotationInput.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      els.saveAnnotationBtn.click();
    }
  });

  function openNarrativeDialog(id = null, insertIndex = null, options = {}) {
    const block = id ? state.messages.find(item => item.id === id && isNarrative(item)) : null;
    narrativeBlockId = block?.id || null;
    narrativeInsertIndex = Number.isInteger(insertIndex) ? insertIndex : state.messages.length;
    narrativeReturnFocusToComposer = Boolean(options.returnFocusToComposer);
    els.narrativeInput.value = block?.text || '';
    if (els.narrativeStyle) els.narrativeStyle.value = block?.narrativeStyle === 'system' ? 'system' : 'narrative';
    els.removeNarrativeBtn.disabled = !block;
    els.narrativeDialog.showModal();
    requestAnimationFrame(() => {
      els.narrativeInput.focus();
      if (block) els.narrativeInput.select();
    });
  }

  function closeNarrativeDialog() {
    const returnFocus = narrativeReturnFocusToComposer;
    narrativeBlockId = null;
    narrativeInsertIndex = null;
    narrativeReturnFocusToComposer = false;
    if (els.narrativeDialog.open) els.narrativeDialog.close();
    if (returnFocus) requestAnimationFrame(() => els.composer.focus());
  }

  function saveNarrativeBlock() {
    const text = els.narrativeInput.value.trimEnd();
    if (!text.trim()) {
      if (narrativeBlockId) {
        state.messages = state.messages.filter(item => item.id !== narrativeBlockId);
        scheduleSave();
        renderThread();
      }
      return closeNarrativeDialog();
    }

    if (narrativeBlockId) {
      const block = state.messages.find(item => item.id === narrativeBlockId && isNarrative(item));
      if (block) {
        block.text = text;
        block.narrativeStyle = els.narrativeStyle?.value === 'system' ? 'system' : 'narrative';
      }
    } else {
      const block = {
        kind: 'narrative',
        id: crypto.randomUUID ? crypto.randomUUID() : `narrative-${Date.now()}-${Math.random()}`,
        text,
        narrativeStyle: els.narrativeStyle?.value === 'system' ? 'system' : 'narrative',
        createdAt: new Date().toISOString()
      };
      const index = Math.max(0, Math.min(Number.isInteger(narrativeInsertIndex) ? narrativeInsertIndex : state.messages.length, state.messages.length));
      state.messages.splice(index, 0, block);
    }
    scheduleSave();
    renderThread();
    closeNarrativeDialog();
  }

  els.narrativeBtn.addEventListener('click', () => {
    closeTopMenus();
    openNarrativeDialog(null, state.messages.length);
  });
  els.quickNarrativeBtn?.addEventListener('click', () => {
    openNarrativeDialog(null, state.messages.length, { returnFocusToComposer: true });
  });
  els.closeNarrativeDialogBtn.addEventListener('click', closeNarrativeDialog);
  els.narrativeDialog.addEventListener('cancel', () => {
    if (!narrativeReturnFocusToComposer) return;
    narrativeBlockId = null;
    narrativeInsertIndex = null;
    narrativeReturnFocusToComposer = false;
    requestAnimationFrame(() => els.composer.focus());
  });
  els.removeNarrativeBtn.addEventListener('click', () => {
    if (!narrativeBlockId) return closeNarrativeDialog();
    state.messages = state.messages.filter(item => item.id !== narrativeBlockId);
    scheduleSave();
    renderThread();
    closeNarrativeDialog();
  });
  els.saveNarrativeBtn.addEventListener('click', saveNarrativeBlock);
  els.narrativeInput.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      saveNarrativeBlock();
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
    state.conversationStyle = normalizeConversationStyle(els.conversationStyle.value);
    scheduleSave();
    renderThread();
    closeTopMenus();
  });

  els.conversationWidth?.addEventListener('change', () => {
    state.conversationWidth = normalizeConversationWidth(els.conversationWidth.value);
    scheduleSave();
    applyConversationPresentation();
    closeTopMenus();
  });

  const BACKGROUND_PRESETS = {
    spectrum: { mode: 'gradient', colors: ['#ff3b30', '#ffcc00', '#34c759', '#007aff'], direction: 'horizontal' },
    steel: { mode: 'gradient', colors: ['#eef1f4', '#9aa3ad', '#dce1e6'], direction: 'vertical' },
    terminal: { mode: 'gradient', colors: ['#000000', '#03140b', '#0a2415', '#123a24'], direction: 'vertical' },
    ocean: { mode: 'gradient', colors: ['#071b3d', '#1769aa', '#55d8e6'], direction: 'diag-right' },
    sunset: { mode: 'gradient', colors: ['#ff8a34', '#ff4f85', '#6c3bd1'], direction: 'diag-right' },
    twilight: { mode: 'gradient', colors: ['#101a4f', '#432b78', '#8c5ee8'], direction: 'vertical' },
    paper: { mode: 'solid', solid: '#f5f0e6', colors: ['#f5f0e6', '#eee6d8'], direction: 'vertical' },
    midnight: { mode: 'gradient', colors: ['#0d0f14', '#252a38'], direction: 'vertical' }
  };

  function backgroundColorInputs() {
    return [els.backgroundColor1, els.backgroundColor2, els.backgroundColor3, els.backgroundColor4];
  }

  function applyBackgroundPreset(name) {
    const preset = BACKGROUND_PRESETS[name];
    if (!preset || !els.backgroundMode) return;
    els.backgroundMode.value = preset.mode;
    if (preset.mode === 'solid') {
      els.backgroundSolidColor.value = normalizeHex(preset.solid, '#f4f4f7');
    } else {
      const colors = preset.colors.slice(0, 4);
      els.backgroundColorCount.value = String(Math.max(2, colors.length));
      els.backgroundDirection.value = preset.direction || 'vertical';
      const inputs = backgroundColorInputs();
      const fallback = ['#f4f4f7', '#d9e6ff', '#c9f2d0', '#f6d6ff'];
      inputs.forEach((input, index) => { if (input) input.value = colors[index] || fallback[index]; });
    }
    updateBackgroundDialogPreview();
  }

  function swapBackgroundStops(indexA, indexB) {
    const count = Math.min(4, Math.max(2, Number(els.backgroundColorCount?.value) || 2));
    if (indexA < 0 || indexB < 0 || indexA >= count || indexB >= count || indexA === indexB) return;
    const inputs = backgroundColorInputs();
    const temp = inputs[indexA].value;
    inputs[indexA].value = inputs[indexB].value;
    inputs[indexB].value = temp;
    updateBackgroundDialogPreview();
  }

  function flipBackgroundStops() {
    const count = Math.min(4, Math.max(2, Number(els.backgroundColorCount?.value) || 2));
    const inputs = backgroundColorInputs();
    const values = inputs.slice(0, count).map(input => input.value).reverse();
    values.forEach((value, index) => { inputs[index].value = value; });
    updateBackgroundDialogPreview();
  }

  function backgroundDraftFromControls() {
    const count = Math.min(4, Math.max(2, Number(els.backgroundColorCount?.value) || 2));
    const colors = [els.backgroundColor1, els.backgroundColor2, els.backgroundColor3, els.backgroundColor4]
      .slice(0, count)
      .map((input, index) => normalizeHex(input?.value, ['#f4f4f7', '#d9e6ff', '#c9f2d0', '#f6d6ff'][index]));
    return normalizeConversationBackground({
      mode: els.backgroundMode?.value || 'default',
      solid: els.backgroundSolidColor?.value || '#f4f4f7',
      colors,
      direction: els.backgroundDirection?.value || 'vertical'
    });
  }

  function updateBackgroundDialogPreview() {
    if (!els.backgroundMode) return;
    const mode = els.backgroundMode.value;
    if (els.backgroundSolidField) els.backgroundSolidField.hidden = mode !== 'solid';
    if (els.backgroundColorCountField) els.backgroundColorCountField.hidden = mode !== 'gradient';
    if (els.backgroundDirectionField) els.backgroundDirectionField.hidden = mode !== 'gradient';
    if (els.backgroundColors) els.backgroundColors.hidden = mode !== 'gradient';
    if (els.backgroundGradientTools) els.backgroundGradientTools.hidden = mode !== 'gradient';
    const count = Math.min(4, Math.max(2, Number(els.backgroundColorCount?.value) || 2));
    backgroundColorInputs().forEach((input, index) => {
      const stop = input?.closest('.background-color-stop');
      if (stop) {
        stop.hidden = mode !== 'gradient' || index >= count;
        const left = stop.querySelector('[data-stop-move="left"]');
        const right = stop.querySelector('[data-stop-move="right"]');
        if (left) left.disabled = index === 0;
        if (right) right.disabled = index >= count - 1;
      }
    });
    if (els.backgroundPreview) {
      const draft = backgroundDraftFromControls();
      els.backgroundPreview.style.background = conversationBackgroundCss(draft) || 'var(--bg)';
      els.backgroundPreview.classList.toggle('dark-preview', draft.mode !== 'default' && customBackgroundIsDark(draft));
      els.backgroundPreview.classList.toggle('high-contrast-preview', els.highContrastLabelsInput?.checked === true);
    }
  }

  function openBackgroundDialog() {
    const background = normalizeConversationBackground(state.conversationBackground);
    els.backgroundMode.value = background.mode;
    els.backgroundSolidColor.value = background.solid;
    els.backgroundColorCount.value = String(Math.min(4, Math.max(2, background.colors.length)));
    els.backgroundDirection.value = background.direction;
    const inputs = backgroundColorInputs();
    const defaults = ['#f4f4f7', '#d9e6ff', '#c9f2d0', '#f6d6ff'];
    inputs.forEach((input, index) => { if (input) input.value = background.colors[index] || defaults[index]; });
    if (els.highContrastLabelsInput) els.highContrastLabelsInput.checked = state.highContrastLabels === true;
    updateBackgroundDialogPreview();
    els.backgroundDialog.showModal();
  }

  function closeBackgroundDialog() {
    if (els.backgroundDialog?.open) els.backgroundDialog.close();
  }

  els.backgroundBtn?.addEventListener('click', () => { closeTopMenus(); openBackgroundDialog(); });
  els.closeBackgroundDialogBtn?.addEventListener('click', closeBackgroundDialog);
  els.backgroundDialog?.addEventListener('cancel', event => { event.preventDefault(); closeBackgroundDialog(); });
  [els.backgroundMode, els.backgroundSolidColor, els.backgroundColorCount, els.backgroundDirection, els.backgroundColor1, els.backgroundColor2, els.backgroundColor3, els.backgroundColor4, els.highContrastLabelsInput].forEach(control => control?.addEventListener('input', updateBackgroundDialogPreview));
  els.backgroundPresetGrid?.addEventListener('click', event => {
    const button = event.target.closest('[data-background-preset]');
    if (!button) return;
    applyBackgroundPreset(button.dataset.backgroundPreset);
  });
  els.backgroundColors?.addEventListener('click', event => {
    const button = event.target.closest('[data-stop-move]');
    if (!button) return;
    const stop = button.closest('.background-color-stop');
    const index = Number(stop?.dataset.backgroundStop);
    if (!Number.isInteger(index)) return;
    swapBackgroundStops(index, button.dataset.stopMove === 'left' ? index - 1 : index + 1);
  });
  els.flipGradientBtn?.addEventListener('click', flipBackgroundStops);
  els.resetBackgroundBtn?.addEventListener('click', () => {
    els.backgroundMode.value = 'default';
    updateBackgroundDialogPreview();
  });
  els.saveBackgroundBtn?.addEventListener('click', () => {
    state.conversationBackground = backgroundDraftFromControls();
    state.highContrastLabels = els.highContrastLabelsInput?.checked === true;
    scheduleSave();
    applyConversationPresentation();
    closeBackgroundDialog();
  });

  function conversationStyleLabel(style) {
    return ({ chat: 'Mobile Chat', transcript: 'Transcript', theater: 'Theater Draft', screen: 'Screen Draft' })[normalizeConversationStyle(style)] || 'Mobile Chat';
  }

  function captureConversationPreset(name, existing = null) {
    const now = new Date().toISOString();
    return normalizeConversationPreset({
      id: existing?.id || (crypto.randomUUID ? crypto.randomUUID() : `preset-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      name,
      conversationStyle: state.conversationStyle,
      conversationWidth: normalizeConversationWidth(state.conversationWidth),
      conversationBackground: cloneState(normalizeConversationBackground(state.conversationBackground)),
      highContrastLabels: state.highContrastLabels === true,
      participants: state.participants.map(participant => ({ name: participant.name, side: participant.side, color: participant.color, textColorMode: normalizeBubbleTextMode(participant.textColorMode), textColor: normalizeHex(participant.textColor, '#ff2d55') })),
      createdAt: existing?.createdAt || now,
      updatedAt: now
    });
  }

  function renderConversationPresetList() {
    if (!els.conversationPresetList) return;
    els.conversationPresetList.innerHTML = '';
    const presets = [...(conversationPresetLibrary.presets || [])].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    if (!presets.length) {
      const empty = document.createElement('div');
      empty.className = 'conversation-preset-empty';
      empty.textContent = 'No saved conversation presets yet.';
      els.conversationPresetList.appendChild(empty);
      return;
    }
    presets.forEach(preset => {
      const row = document.createElement('div');
      row.className = 'conversation-preset-item';
      const main = document.createElement('div');
      main.className = 'conversation-preset-main';
      const name = document.createElement('strong');
      name.textContent = preset.name;
      const meta = document.createElement('div');
      meta.className = 'conversation-preset-meta';
      meta.textContent = `${conversationStyleLabel(preset.conversationStyle)} · ${normalizeConversationWidth(preset.conversationWidth)} width · ${preset.participants.length} participant${preset.participants.length === 1 ? '' : 's'}${preset.highContrastLabels ? ' · high contrast labels' : ''}`;
      const swatches = document.createElement('div');
      swatches.className = 'conversation-preset-swatches';
      preset.participants.slice(0, 8).forEach(participant => {
        const swatch = document.createElement('span');
        swatch.className = 'conversation-preset-swatch';
        swatch.style.background = participant.color;
        swatch.title = participant.name;
        swatches.appendChild(swatch);
      });
      main.append(name, meta, swatches);
      const actions = document.createElement('div');
      actions.className = 'conversation-preset-actions';
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.textContent = 'Apply';
      apply.addEventListener('click', () => applyConversationPreset(preset));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'danger-button';
      remove.textContent = 'Delete';
      remove.addEventListener('click', () => {
        if (!confirm(`Delete the conversation preset “${preset.name}”?`)) return;
        conversationPresetLibrary.presets = conversationPresetLibrary.presets.filter(item => item.id !== preset.id);
        if (!saveConversationPresetLibrary()) { alert('ThreadWriter could not update saved conversation presets in this browser.'); return; }
        renderConversationPresetList();
      });
      actions.append(apply, remove);
      row.append(main, actions);
      els.conversationPresetList.appendChild(row);
    });
  }

  function openConversationPresetsDialog() {
    if (!els.conversationPresetsDialog) return;
    if (els.conversationPresetNameInput) els.conversationPresetNameInput.value = '';
    if (els.conversationPresetStatus) els.conversationPresetStatus.textContent = '';
    renderConversationPresetList();
    els.conversationPresetsDialog.showModal();
    requestAnimationFrame(() => els.conversationPresetNameInput?.focus());
  }

  function closeConversationPresetsDialog() {
    if (els.conversationPresetsDialog?.open) els.conversationPresetsDialog.close();
  }

  function saveCurrentConversationPreset() {
    const requestedName = String(els.conversationPresetNameInput?.value || '').trim();
    if (!requestedName) {
      if (els.conversationPresetStatus) els.conversationPresetStatus.textContent = 'Give this preset a name first.';
      els.conversationPresetNameInput?.focus();
      return;
    }
    const existing = (conversationPresetLibrary.presets || []).find(preset => preset.name.toLocaleLowerCase() === requestedName.toLocaleLowerCase()) || null;
    const preset = captureConversationPreset(requestedName, existing);
    if (!preset) return;
    if (existing) conversationPresetLibrary.presets = conversationPresetLibrary.presets.map(item => item.id === existing.id ? preset : item);
    else conversationPresetLibrary.presets.push(preset);
    if (!saveConversationPresetLibrary()) {
      if (els.conversationPresetStatus) els.conversationPresetStatus.textContent = 'Could not save presets in this browser.';
      return;
    }
    if (els.conversationPresetStatus) els.conversationPresetStatus.textContent = existing ? `Updated “${requestedName}”.` : `Saved “${requestedName}”.`;
    renderConversationPresetList();
  }

  function applyConversationPreset(presetValue) {
    const preset = normalizeConversationPreset(presetValue);
    if (!preset) return;
    createSnapshot(currentDocumentId, state, 'Before applying conversation preset', { force: true });
    state.conversationStyle = preset.conversationStyle;
    state.conversationWidth = normalizeConversationWidth(preset.conversationWidth);
    state.conversationBackground = cloneState(preset.conversationBackground);
    state.highContrastLabels = preset.highContrastLabels === true;

    const existing = Array.isArray(state.participants) ? state.participants : [];
    const keepExtras = state.messages.some(item => isMessage(item));
    const nextParticipants = preset.participants.map((participant, index) => ({
      id: existing[index]?.id || (crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${index}`),
      name: participant.name,
      side: participant.side,
      color: participant.color,
      textColorMode: normalizeBubbleTextMode(participant.textColorMode),
      textColor: normalizeHex(participant.textColor, '#ff2d55')
    }));
    if (keepExtras && existing.length > nextParticipants.length) {
      existing.slice(nextParticipants.length).forEach(participant => nextParticipants.push({ ...participant }));
    }
    state.participants = nextParticipants.length ? nextParticipants : existing;
    ensureActiveParticipant();
    scheduleSave();
    render();
    if (els.saveStatus) els.saveStatus.textContent = `Applied preset: ${preset.name}`;
    closeConversationPresetsDialog();
  }

  els.conversationPresetsBtn?.addEventListener('click', () => { closeTopMenus(); openConversationPresetsDialog(); });
  els.closeConversationPresetsDialogBtn?.addEventListener('click', closeConversationPresetsDialog);
  els.conversationPresetsDialog?.addEventListener('cancel', event => { event.preventDefault(); closeConversationPresetsDialog(); });
  els.saveConversationPresetBtn?.addEventListener('click', saveCurrentConversationPreset);
  els.conversationPresetNameInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); saveCurrentConversationPreset(); }
  });

  function findFieldValue(item, field) {
    if (field === 'imageCaption') return normalizeImageAttachment(item?.imageAttachment)?.caption || '';
    if (field === 'imageAltText') return normalizeImageAttachment(item?.imageAttachment)?.altText || '';
    if (field.startsWith('linkPreview')) {
      const preview = normalizeLinkPreview(item?.linkPreview);
      const key = field.replace('linkPreview', '').replace(/^./, c => c.toLowerCase());
      return preview && typeof preview[key] === 'string' ? preview[key] : '';
    }
    return typeof item?.[field] === 'string' ? item[field] : '';
  }

  function setFindFieldValue(item, field, value) {
    if (field.startsWith('linkPreview')) {
      const preview = normalizeLinkPreview(item?.linkPreview);
      if (!preview) return false;
      const key = field.replace('linkPreview', '').replace(/^./, c => c.toLowerCase());
      if (!['site', 'title', 'description', 'displayUrl'].includes(key)) return false;
      preview[key] = value;
      item.linkPreview = preview;
      return true;
    }
    if (field === 'imageCaption' || field === 'imageAltText') {
      const attachment = normalizeImageAttachment(item?.imageAttachment);
      if (!attachment) return false;
      if (field === 'imageCaption') attachment.caption = value;
      else attachment.altText = value;
      item.imageAttachment = attachment;
      return true;
    }
    if (typeof item?.[field] !== 'string') return false;
    item[field] = value;
    return true;
  }

  function computeFindMatches() {
    const query = findState.query;
    if (!query) return [];
    const needle = findState.caseSensitive ? query : query.toLocaleLowerCase();
    const matches = [];

    const collect = (item, field) => {
      const value = findFieldValue(item, field);
      if (!value) return;
      const haystack = findState.caseSensitive ? value : value.toLocaleLowerCase();
      let from = 0;
      while (from <= haystack.length) {
        const at = haystack.indexOf(needle, from);
        if (at === -1) break;
        matches.push({ messageId: item.id, field, start: at, length: query.length });
        from = at + Math.max(1, query.length);
      }
    };

    state.messages.forEach(item => {
      collect(item, 'text');
      if (isMessage(item)) collect(item, 'annotation');
      if (item.imageAttachment) {
        collect(item, 'imageCaption');
        collect(item, 'imageAltText');
      }
      if (item.linkPreview) {
        collect(item, 'linkPreviewSite');
        collect(item, 'linkPreviewTitle');
        collect(item, 'linkPreviewDescription');
        collect(item, 'linkPreviewDisplayUrl');
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
      const same = findState.matches.findIndex(match => match.messageId === oldMatch.messageId && match.field === oldMatch.field && match.start === oldMatch.start);
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
    const row = [...els.thread.querySelectorAll('[data-message-id]')].find(el => el.dataset.messageId === match.messageId);
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
    const item = state.messages.find(entry => entry.id === match.messageId);
    if (!item) return;
    const currentValue = findFieldValue(item, match.field);
    if (!currentValue && match.start !== 0) return;
    const nextValue = currentValue.slice(0, match.start) + els.replaceInput.value + currentValue.slice(match.start + match.length);
    if (!setFindFieldValue(item, match.field, nextValue)) return;
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
    const replaceField = (item, field) => {
      const value = findFieldValue(item, field);
      if (!value) return;
      const nextValue = value.replace(regex, () => {
        count += 1;
        return els.replaceInput.value;
      });
      if (nextValue !== value) setFindFieldValue(item, field, nextValue);
    };
    state.messages.forEach(item => {
      replaceField(item, 'text');
      if (isMessage(item)) replaceField(item, 'annotation');
      if (item.imageAttachment) {
        replaceField(item, 'imageCaption');
        replaceField(item, 'imageAltText');
      }
      if (item.linkPreview) {
        replaceField(item, 'linkPreviewSite');
        replaceField(item, 'linkPreviewTitle');
        replaceField(item, 'linkPreviewDescription');
        replaceField(item, 'linkPreviewDisplayUrl');
      }
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
      kind: 'message',
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      speakerId: state.activeParticipantId,
      text,
      annotation: '',
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
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      openNarrativeDialog(null, state.messages.length, { returnFocusToComposer: true });
      return;
    }
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
      color: '#e5e5ea',
      textColorMode: 'auto',
      textColor: '#ff2d55'
    };
    node.dataset.id = p.id;
    node.querySelector('.participant-name').value = p.name;
    node.querySelector('.participant-side').value = p.side;
    const bubbleColorInput = node.querySelector('.participant-color');
    const textModeInput = node.querySelector('.participant-text-mode');
    const textColorInput = node.querySelector('.participant-text-color');
    bubbleColorInput.value = normalizeHex(p.color, '#e5e5ea');
    textModeInput.value = normalizeBubbleTextMode(p.textColorMode);
    textColorInput.value = normalizeHex(p.textColor, '#ff2d55');
    const updateTextColorVisibility = () => { textColorInput.hidden = textModeInput.value !== 'custom'; };
    updateTextColorVisibility();
    textModeInput.addEventListener('change', updateTextColorVisibility);
    node.querySelectorAll('[data-bubble-color]').forEach(button => button.addEventListener('click', () => {
      bubbleColorInput.value = normalizeHex(button.dataset.bubbleColor, '#e5e5ea');
    }));
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
      color: row.querySelector('.participant-color').value,
      textColorMode: normalizeBubbleTextMode(row.querySelector('.participant-text-mode')?.value),
      textColor: normalizeHex(row.querySelector('.participant-text-color')?.value, '#ff2d55')
    }));
    const validIds = new Set(newParticipants.map(p => p.id));
    const fallbackId = newParticipants[0].id;
    state.messages.forEach(m => { if (isMessage(m) && !validIds.has(m.speakerId)) m.speakerId = fallbackId; });
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
    const addTextResult = (documentId, title, kind, value) => {
      const clean = String(value || '').replace(/\s+/g, ' ').trim();
      const at = clean.toLocaleLowerCase().indexOf(needle);
      if (at === -1) return;
      const start = Math.max(0, at - 45);
      const end = Math.min(clean.length, at + raw.length + 80);
      const snippet = `${start > 0 ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`;
      results.push({ documentId, title, kind, snippet });
    };

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
      for (const item of documentState.messages) {
        const attachment = normalizeImageAttachment(item.imageAttachment);
        if (isNarrative(item)) {
          addTextResult(documentId, title, 'Narrative', item.text);
          if (attachment?.caption) addTextResult(documentId, title, 'Narrative image caption', attachment.caption);
          if (attachment?.altText) addTextResult(documentId, title, 'Narrative image alt text', attachment.altText);
          const preview = normalizeLinkPreview(item.linkPreview);
          if (preview?.site) addTextResult(documentId, title, 'Narrative link source', preview.site);
          if (preview?.title) addTextResult(documentId, title, 'Narrative link title', preview.title);
          if (preview?.description) addTextResult(documentId, title, 'Narrative link description', preview.description);
          if (preview?.displayUrl) addTextResult(documentId, title, 'Narrative link URL', preview.displayUrl);
        } else {
          const participant = documentState.participants.find(p => p.id === item.speakerId);
          const name = participant?.name || 'Message';
          addTextResult(documentId, title, name, item.text);
          if (item.annotation) addTextResult(documentId, title, `${name} annotation`, item.annotation);
          if (attachment?.caption) addTextResult(documentId, title, `${name} image caption`, attachment.caption);
          if (attachment?.altText) addTextResult(documentId, title, `${name} image alt text`, attachment.altText);
          const preview = normalizeLinkPreview(item.linkPreview);
          if (preview?.site) addTextResult(documentId, title, `${name} link source`, preview.site);
          if (preview?.title) addTextResult(documentId, title, `${name} link title`, preview.title);
          if (preview?.description) addTextResult(documentId, title, `${name} link description`, preview.description);
          if (preview?.displayUrl) addTextResult(documentId, title, `${name} link URL`, preview.displayUrl);
        }
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
    const mediaIds = new Set();
    const scenes = project.documentIds.map((documentId, index) => {
      const documentState = documentId === currentDocumentId ? state : readStoredDocument(documentId);
      if (!documentState) return null;
      mergeImageIds(mediaIds, documentState);
      const history = loadHistory(documentId).snapshots.map(snapshot => {
        mergeImageIds(mediaIds, snapshot.state);
        return { ...snapshot, state: cloneState(snapshot.state) };
      });
      return {
        order: index,
        title: documentState.title || 'Untitled Thread',
        state: cloneState(documentState),
        history
      };
    }).filter(Boolean);
    const backup = {
      format: 'threadwriter-project-backup',
      version: 2,
      exportedAt: new Date().toISOString(),
      project: {
        name: project.name,
        createdAt: project.createdAt,
        scenes
      },
      media: await serializeMediaForIds(mediaIds)
    };
    const filename = `${safeName(project.name)}.threadwriter-project`;
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const result = await saveBlobAsPortableFile(blob, filename, 'ThreadWriter project backup', ['.threadwriter-project', '.json']);
    if (result && result !== 'cancelled' && els.saveStatus) els.saveStatus.textContent = 'Project backup created';
  }

  async function restoreProjectBackup(parsed) {
    if (!parsed || parsed.format !== 'threadwriter-project-backup' || ![1, 2].includes(parsed.version) || !parsed.project || !Array.isArray(parsed.project.scenes)) {
      throw new Error('Not a ThreadWriter project backup');
    }
    if (parsed.version >= 2) await restoreEmbeddedMedia(parsed.media);
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
    const payload = {
      format: 'threadwriter-file',
      version: 2,
      exportedAt: new Date().toISOString(),
      state: cloneState(state),
      media: await serializeMediaForIds(imageIdsForState(state))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
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
      const result = await restoreProjectBackup(parsed);
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
      let importedSource = parsed;
      if (parsed?.format === 'threadwriter-file' && parsed?.version >= 2 && parsed?.state) {
        await restoreEmbeddedMedia(parsed.media);
        importedSource = parsed.state;
      }
      const imported = normalizeState(importedSource);
      checkpointCurrent('Closed / switched thread');
      state = imported;
      currentDocumentId = makeDocumentId();
      pendingInsertId = null;
      persistDocument(currentDocumentId, state);
      els.composer.value = '';
      autoSizeComposer();
      render();
      scheduleMediaGarbageCollection();
    } catch (err) {
      alert(`Could not import this file: ${err.message}`);
    } finally {
      els.fileInput.value = '';
    }
  });

  els.imageInput.addEventListener('change', async () => {
    const file = els.imageInput.files?.[0];
    const targetId = imageTargetItemId;
    imageTargetItemId = null;
    try {
      if (file && targetId) await attachImageToItem(targetId, file);
    } finally {
      els.imageInput.value = '';
    }
  });

  els.exportTxtBtn.addEventListener('click', () => {
    closeTopMenus();
    const txt = buildTranscript();
    downloadBlob(new Blob([txt], { type: 'text/plain;charset=utf-8' }), `${safeName(state.title)}.txt`);
  });

  els.exportHtmlBtn.addEventListener('click', async () => {
    closeTopMenus();
    try {
      if (els.saveStatus) els.saveStatus.textContent = 'Preparing HTML…';
      const html = await buildHtmlExport();
      downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${safeName(state.title)}.html`);
      if (els.saveStatus) els.saveStatus.textContent = 'HTML exported';
    } catch (err) {
      console.error(err);
      alert('HTML export failed in this browser.');
      if (els.saveStatus) els.saveStatus.textContent = 'HTML export failed';
    }
  });

  els.exportImageBtn.addEventListener('click', () => { closeTopMenus(); openImageExportDialog(); });
  els.closeImageExportDialogBtn.addEventListener('click', () => els.imageExportDialog.close());
  els.imageExportSizeMode.addEventListener('change', updateImageExportDialog);
  els.imageExportFormat.addEventListener('change', updateImageExportDialog);
  els.imageExportPrintWidth.addEventListener('input', updateImageExportDialog);
  els.imageExportDpi.addEventListener('change', updateImageExportDialog);
  els.imageExportCustomWidth.addEventListener('input', updateImageExportDialog);
  els.imageExportColorMode.addEventListener('change', updateImageExportDialog);
  els.imageExportSplit.addEventListener('change', updateImageExportDialog);
  els.runImageExportBtn.addEventListener('click', exportImageFromDialog);

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

  els.printBtn.addEventListener('click', () => {
    closeTopMenus();
    const oldTitle = document.title;
    document.title = '';
    let restored = false;
    const restoreTitle = () => {
      if (restored) return;
      restored = true;
      document.title = oldTitle;
    };
    window.addEventListener('afterprint', restoreTitle, { once: true });
    window.print();
    setTimeout(restoreTitle, 1500);
  });

  function safeName(name) {
    return (name || 'thread').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'thread';
  }

  function transcriptLinkPreviewLines(item, indent = '') {
    const preview = normalizeLinkPreview(item?.linkPreview);
    if (!preview) return [];
    const lines = [`${indent}[Link preview]`];
    const addMultiline = (label, value) => {
      if (!value) return;
      const parts = String(value).split('\n');
      lines.push(`${indent}${label}: ${parts[0] || ''}`);
      parts.slice(1).forEach(part => lines.push(`${indent}  ${part}`));
    };
    addMultiline('Source', preview.site);
    addMultiline('Title', preview.title);
    addMultiline('Description', preview.description);
    addMultiline('URL', preview.displayUrl);
    if (preview.thumbnail) lines.push(`${indent}Thumbnail: ${preview.thumbnail.name || 'image'}`);
    return lines;
  }

  function transcriptImageMetadataLines(item, indent = '') {
    const attachment = normalizeImageAttachment(item?.imageAttachment);
    if (!attachment) return [];
    const lines = [`${indent}[Image attachment: ${attachment.name || 'image'}]`];
    const addMultiline = (label, value) => {
      if (!value) return;
      const parts = String(value).split('\n');
      lines.push(`${indent}${label}: ${parts[0] || ''}`);
      parts.slice(1).forEach(part => lines.push(`${indent}  ${part}`));
    };
    addMultiline('Caption', attachment.caption);
    addMultiline('Alt text', attachment.altText);
    return lines;
  }

  function buildTranscript() {
    const lines = [state.title || 'Untitled Thread', ''];
    if (state.sceneHeader) lines.push(state.sceneHeader, '');
    state.messages.forEach(item => {
      if (isNarrative(item)) {
        lines.push(item.text);
        lines.push(...transcriptImageMetadataLines(item));
        lines.push(...transcriptLinkPreviewLines(item));
        lines.push('');
        return;
      }
      const p = getParticipant(item.speakerId);
      const stamp = item.displayTimestamp ? ` [${item.displayTimestamp}]` : '';
      lines.push(`${p?.name || 'Unknown'}${stamp}: ${item.text}`);
      lines.push(...transcriptImageMetadataLines(item, '    '));
      lines.push(...transcriptLinkPreviewLines(item, '    '));
      if (item.annotation) {
        String(item.annotation).split('\n').forEach(line => lines.push(`    ${line}`));
      }
      lines.push('');
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

  function fitImageBox(attachment, maxWidth, maxHeight = Infinity) {
    const meta = normalizeImageAttachment(attachment);
    if (!meta) return { width: 0, height: 0 };
    const scale = Math.min(1, maxWidth / meta.width, maxHeight / meta.height);
    return {
      width: Math.max(1, Math.round(meta.width * scale)),
      height: Math.max(1, Math.round(meta.height * scale))
    };
  }

  async function loadCanvasImagesForState(project) {
    const images = new Map();
    for (const id of imageIdsForState(project)) {
      const record = await getMediaRecord(id);
      if (!record?.blob) continue;
      try {
        if (typeof createImageBitmap === 'function') {
          images.set(id, await createImageBitmap(record.blob));
        } else {
          const url = await getMediaObjectUrl(id);
          if (!url) continue;
          const img = await new Promise((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = reject;
            element.src = url;
          });
          images.set(id, img);
        }
      } catch (error) {
        console.warn('Could not decode an image for PNG export.', error);
      }
    }
    return images;
  }

  function closeCanvasImages(images) {
    for (const source of images.values()) source?.close?.();
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

  function paintPngImageCaption(ctx, text, x, y, maxWidth, align = 'left', draw = false) {
    if (!text) return 0;
    ctx.font = '400 18px Arial, sans-serif';
    const lines = wrapCanvasText(ctx, text, Math.max(120, maxWidth));
    if (draw) {
      const background = normalizeConversationBackground(state.conversationBackground);
      ctx.fillStyle = background.mode !== 'default' && customBackgroundIsDark(background) ? '#dedee6' : '#5f5f68';
      ctx.textAlign = align;
      lines.forEach((line, lineIndex) => ctx.fillText(line, x, y + lineIndex * 25));
      ctx.textAlign = 'left';
    }
    return Math.max(1, lines.length) * 25;
  }


  function drawImageCover(ctx, source, dx, dy, dWidth, dHeight) {
    const sw = Number(source?.naturalWidth || source?.videoWidth || source?.width) || 1;
    const sh = Number(source?.naturalHeight || source?.videoHeight || source?.height) || 1;
    const scale = Math.max(dWidth / sw, dHeight / sh);
    const sWidth = dWidth / scale;
    const sHeight = dHeight / scale;
    const sx = Math.max(0, (sw - sWidth) / 2);
    const sy = Math.max(0, (sh - sHeight) / 2);
    ctx.drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  }

  function paintPngLinkPreview(ctx, previewValue, x, y, width, draw = false, imageMap = new Map()) {
    const preview = normalizeLinkPreview(previewValue);
    if (!preview) return 0;
    const pad = 16;
    const thumbW = preview.thumbnail ? Math.min(150, width * 0.31) : 0;
    const gap = preview.thumbnail ? 14 : 0;
    const textW = Math.max(120, width - pad * 2 - thumbW - gap);
    const segments = [];
    let textH = 0;
    const add = (text, font, lineH, color) => {
      if (!text) return;
      ctx.font = font;
      const lines = wrapCanvasText(ctx, text, textW);
      segments.push({ lines, font, lineH, color });
      textH += lines.length * lineH + 5;
    };
    add(preview.site, '700 14px Arial, sans-serif', 19, '#777780');
    add(preview.title, '700 20px Arial, sans-serif', 27, '#25252b');
    add(preview.description, '400 16px Arial, sans-serif', 22, '#555560');
    add(preview.displayUrl, '400 14px Arial, sans-serif', 19, '#777780');
    const thumbH = preview.thumbnail ? Math.min(130, Math.max(88, textH)) : 0;
    const height = Math.max(72, textH + pad * 2 - 5, thumbH + pad * 2);
    if (draw) {
      ctx.fillStyle = '#f7f7f9';
      roundedRectPath(ctx, x, y, width, height, 16);
      ctx.fill();
      ctx.strokeStyle = '#d8d8df';
      ctx.lineWidth = 2;
      ctx.stroke();
      let tx = x + pad;
      if (preview.thumbnail) {
        const source = imageMap.get(preview.thumbnail.id);
        if (source) drawImageCover(ctx, source, tx, y + pad, thumbW, thumbH);
        else { ctx.fillStyle = '#e5e5ea'; ctx.fillRect(tx, y + pad, thumbW, thumbH); }
        tx += thumbW + gap;
      }
      let ty = y + pad;
      ctx.textAlign = 'left';
      for (const segment of segments) {
        ctx.font = segment.font;
        ctx.fillStyle = segment.color;
        segment.lines.forEach((line, i) => ctx.fillText(line, tx, ty + i * segment.lineH));
        ty += segment.lines.length * segment.lineH + 5;
      }
    }
    return height;
  }

  function paintPngThread(ctx, draw = false, imageMap = new Map(), options = {}) {
    const W = 1080;
    const safeBreaks = Array.isArray(options.safeBreaks) ? options.safeBreaks : null;
    const widthMode = normalizeConversationWidth(state.conversationWidth);
    const desiredContentWidth = widthMode === 'phone' ? 500 : (widthMode === 'tablet' ? 720 : 936);
    const contentWidth = Math.min(W - 48, desiredContentWidth);
    const left = (W - contentWidth) / 2;
    const right = left;
    const maxBubbleWidth = contentWidth * 0.67;
    const style = normalizeConversationStyle(state.conversationStyle);
    const plainDraft = style !== 'chat';
    const transcript = style === 'transcript';
    const theater = style === 'theater';
    const screen = style === 'screen';
    const customBackground = normalizeConversationBackground(state.conversationBackground).mode !== 'default';
    const darkBackground = customBackground && customBackgroundIsDark(state.conversationBackground);
    const canvasText = darkBackground ? '#f7f7fa' : '#17171b';
    const canvasMuted = darkBackground ? '#dedee6' : '#666670';
    let y = 64;

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    ctx.font = '700 36px "Trebuchet MS", Arial, sans-serif';
    const titleLines = wrapCanvasText(ctx, state.title || 'Untitled Thread', contentWidth);
    if (draw) {
      ctx.fillStyle = canvasText;
      titleLines.forEach((line, index) => ctx.fillText(line, left, y + index * 44));
    }
    y += titleLines.length * 44 + 30;

    if (state.sceneHeader) {
      ctx.font = headerCanvasFont(29, 700);
      const headerLines = wrapCanvasText(ctx, state.sceneHeader, contentWidth - 120);
      if (draw) {
        ctx.fillStyle = darkBackground ? '#f2f2f7' : '#292930';
        ctx.textAlign = 'center';
        headerLines.forEach((line, index) => ctx.fillText(line, W / 2, y + index * 38));
        ctx.textAlign = 'left';
      }
      y += headerLines.length * 38 + 34;
    }

    state.messages.forEach((item, index) => {
      if (isNarrative(item)) {
        if (index > 0) y += 26;
        const systemNarrative = item.narrativeStyle === 'system';
        ctx.font = systemNarrative ? '560 22px Arial, sans-serif' : 'italic 500 22px Georgia, "Times New Roman", serif';
        const narrativeWidth = theater ? contentWidth * 0.76 : (screen ? contentWidth * 0.72 : contentWidth * 0.78);
        const lines = wrapCanvasText(ctx, item.text, narrativeWidth);
        const narrativeX = theater ? left + contentWidth * 0.08 : (screen ? (W - narrativeWidth) / 2 : W / 2);
        if (draw) {
          ctx.fillStyle = canvasMuted;
          ctx.textAlign = theater || screen ? 'left' : 'center';
          lines.forEach((line, lineIndex) => ctx.fillText(line, narrativeX, y + lineIndex * 31));
          ctx.textAlign = 'left';
        }
        y += Math.max(1, lines.length) * 31 + 10;
        if (item.imageAttachment) {
          const box = fitImageBox(item.imageAttachment, contentWidth * 0.68, 680);
          y += 8;
          const x = theater ? left + contentWidth * 0.08 : (W - box.width) / 2;
          if (draw && box.width && box.height) {
            const source = imageMap.get(item.imageAttachment.id);
            if (source) {
              ctx.drawImage(source, x, y, box.width, box.height);
            } else {
              ctx.fillStyle = '#e5e5ea';
              roundedRectPath(ctx, x, y, box.width, box.height, 16);
              ctx.fill();
              ctx.fillStyle = '#686872';
              ctx.font = '500 16px Arial, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('Image unavailable', W / 2, y + Math.max(12, box.height / 2 - 8));
              ctx.textAlign = 'left';
            }
          }
          y += box.height;
          if (item.imageAttachment.caption) {
            y += 8;
            y += paintPngImageCaption(ctx, item.imageAttachment.caption, W / 2, y, box.width, 'center', draw);
          }
          y += 12;
        }
        if (item.linkPreview) {
          y += 8;
          const previewWidth = Math.min(620, contentWidth * 0.72);
          const previewX = theater ? left + contentWidth * 0.08 : (W - previewWidth) / 2;
          y += paintPngLinkPreview(ctx, item.linkPreview, previewX, y, previewWidth, draw, imageMap);
          y += 10;
        }
        y += 12;
        if (safeBreaks) safeBreaks.push(y);
        return;
      }

      const participant = getParticipant(item.speakerId);
      if (!participant) return;
      const previous = state.messages[index - 1];
      const continues = isMessage(previous) && previous?.speakerId === item.speakerId;

      if (item.displayTimestamp && index > 0) y += 26;
      else if (index > 0) y += plainDraft ? 18 : (continues ? 8 : 18);

      const side = participant.side === 'right' ? 'right' : 'left';
      const showSpeaker = plainDraft || !continues;

      if (showSpeaker) {
        ctx.font = plainDraft ? '800 16px Arial, sans-serif' : '600 17px Arial, sans-serif';
        const name = plainDraft ? participant.name.toLocaleUpperCase() : participant.name;
        if (draw) {
          const labelAlign = theater || screen ? 'center' : (transcript || side === 'left' ? 'left' : 'right');
          const labelX = theater || screen ? W / 2 : (transcript || side === 'left' ? left : W - right);
          ctx.textAlign = labelAlign;
          if (state.highContrastLabels === true) {
            const labelWidth = Math.ceil(ctx.measureText(name).width);
            const padX = 9;
            const rectHeight = 23;
            let rectX = labelX - padX;
            if (labelAlign === 'center') rectX = labelX - labelWidth / 2 - padX;
            if (labelAlign === 'right') rectX = labelX - labelWidth - padX;
            ctx.fillStyle = 'rgba(0,0,0,.78)';
            roundedRectPath(ctx, rectX, y - 17, labelWidth + padX * 2, rectHeight, 8);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.fillStyle = darkBackground ? '#dedee6' : '#6d6d78';
          }
          ctx.fillText(name, labelX, y);
          ctx.textAlign = 'left';
        }
        y += 23;
      }

      if (item.displayTimestamp) {
        ctx.font = '500 15px Arial, sans-serif';
        if (draw) {
          ctx.fillStyle = darkBackground ? '#d6d6de' : '#777780';
          if (theater || screen) {
            ctx.textAlign = 'center';
            ctx.fillText(item.displayTimestamp, W / 2, y);
          } else {
            ctx.textAlign = transcript || side === 'left' ? 'left' : 'right';
            ctx.fillText(item.displayTimestamp, transcript || side === 'left' ? left : W - right, y);
          }
          ctx.textAlign = 'left';
        }
        y += 22;
      }

      ctx.font = '400 26px Arial, sans-serif';
      let annotationAnchorX = left;
      let annotationMaxWidth = contentWidth - 10;
      if (plainDraft) {
        const textWidth = screen ? contentWidth * 0.62 : contentWidth - 10;
        const textX = screen ? (W - textWidth) / 2 : left;
        const lines = wrapCanvasText(ctx, item.text, textWidth);
        if (draw) {
          ctx.fillStyle = canvasText;
          lines.forEach((line, lineIndex) => ctx.fillText(line, textX, y + lineIndex * 35));
        }
        annotationAnchorX = textX;
        annotationMaxWidth = textWidth;
        y += Math.max(1, lines.length) * 35;
      } else {
        const padX = 20;
        const padY = 15;
        const maxInner = maxBubbleWidth - padX * 2;
        const lines = wrapCanvasText(ctx, item.text, maxInner);
        const measured = Math.max(1, ...lines.map(line => ctx.measureText(line || ' ').width));
        const bubbleWidth = Math.max(92, Math.min(maxBubbleWidth, measured + padX * 2));
        const bubbleHeight = Math.max(58, lines.length * 35 + padY * 2);
        const x = side === 'right' ? W - right - bubbleWidth : left;
        annotationAnchorX = side === 'right' ? W - right : left;
        annotationMaxWidth = bubbleWidth;

        if (draw) {
          ctx.fillStyle = participant.color || '#e5e5ea';
          roundedRectPath(ctx, x, y, bubbleWidth, bubbleHeight, 23);
          ctx.fill();
          ctx.fillStyle = participantBubbleTextColor(participant);
          lines.forEach((line, lineIndex) => ctx.fillText(line, x + padX, y + padY + lineIndex * 35));
        }
        y += bubbleHeight;
      }

      if (item.imageAttachment) {
        y += 10;
        const imageMaxWidth = plainDraft ? Math.min(620, screen ? contentWidth * 0.72 : contentWidth) : Math.min(620, maxBubbleWidth);
        const box = fitImageBox(item.imageAttachment, imageMaxWidth, 720);
        const imageX = screen ? (W - box.width) / 2 : (plainDraft || side === 'left' ? left : W - right - box.width);
        if (draw && box.width && box.height) {
          const source = imageMap.get(item.imageAttachment.id);
          if (source) {
            ctx.drawImage(source, imageX, y, box.width, box.height);
          } else {
            ctx.fillStyle = '#e5e5ea';
            roundedRectPath(ctx, imageX, y, box.width, box.height, 16);
            ctx.fill();
            ctx.fillStyle = '#686872';
            ctx.font = '500 16px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Image unavailable', imageX + box.width / 2, y + Math.max(12, box.height / 2 - 8));
            ctx.textAlign = 'left';
          }
        }
        annotationMaxWidth = Math.max(annotationMaxWidth, box.width);
        y += box.height;
        if (item.imageAttachment.caption) {
          y += 8;
          const captionAlign = plainDraft || side === 'left' ? 'left' : 'right';
          const captionX = captionAlign === 'right' ? imageX + box.width : imageX;
          y += paintPngImageCaption(ctx, item.imageAttachment.caption, captionX, y, box.width, captionAlign, draw);
        }
      }

      if (item.linkPreview) {
        y += 10;
        const previewWidth = plainDraft ? Math.min(650, screen ? contentWidth * 0.72 : contentWidth) : Math.min(620, maxBubbleWidth);
        const previewX = screen ? (W - previewWidth) / 2 : (plainDraft || side === 'left' ? left : W - right - previewWidth);
        y += paintPngLinkPreview(ctx, item.linkPreview, previewX, y, previewWidth, draw, imageMap);
        annotationMaxWidth = Math.max(annotationMaxWidth, previewWidth);
      }

      if (item.annotation) {
        y += 9;
        ctx.font = 'italic 500 18px Arial, sans-serif';
        const lines = wrapCanvasText(ctx, item.annotation, Math.max(120, annotationMaxWidth));
        if (draw) {
          ctx.fillStyle = darkBackground ? '#dedee6' : '#686872';
          ctx.textAlign = plainDraft || side === 'left' ? 'left' : 'right';
          lines.forEach((line, lineIndex) => ctx.fillText(line, annotationAnchorX, y + lineIndex * 25));
          ctx.textAlign = 'left';
        }
        y += Math.max(1, lines.length) * 25;
      }
      if (safeBreaks) safeBreaks.push(y);
    });

    return y + 72;
  }

  function clampNumber(value, min, max, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  }

  function imageExportSettings() {
    const mode = els.imageExportSizeMode.value;
    let targetWidth = 1080;
    let dpi = 96;
    if (mode === 'high') targetWidth = 2160;
    if (mode === 'print') {
      dpi = clampNumber(els.imageExportDpi.value, 72, 1200, 300);
      const inches = clampNumber(els.imageExportPrintWidth.value, 1, 20, 5);
      targetWidth = Math.round(inches * dpi);
    }
    if (mode === 'custom') targetWidth = Math.round(clampNumber(els.imageExportCustomWidth.value, 360, 4800, 1080));
    targetWidth = Math.max(360, Math.min(4800, targetWidth));
    return {
      format: els.imageExportFormat.value,
      sizeMode: mode,
      targetWidth,
      dpi,
      grayscale: els.imageExportColorMode.value === 'grayscale',
      split: !!els.imageExportSplit.checked
    };
  }

  function updateImageExportDialog() {
    const mode = els.imageExportSizeMode.value;
    els.imageExportPrintWidthField.hidden = mode !== 'print';
    els.imageExportDpiField.hidden = mode !== 'print';
    els.imageExportCustomWidthField.hidden = mode !== 'custom';
    const settings = imageExportSettings();
    const formatName = settings.format === 'jpeg' ? 'JPEG' : settings.format.toUpperCase();
    const colorName = settings.grayscale ? 'grayscale' : 'color';
    const sizeNote = mode === 'print'
      ? `${settings.targetWidth.toLocaleString()} px wide at ${settings.dpi} DPI`
      : `${settings.targetWidth.toLocaleString()} px wide`;
    els.imageExportSummary.textContent = `${formatName} · ${sizeNote} · ${colorName}${settings.split ? ' · long threads split at safe content boundaries' : ' · single image when browser limits allow'}.`;
  }

  function openImageExportDialog() {
    updateImageExportDialog();
    els.imageExportDialog.showModal();
  }

  function applyCanvasGrayscale(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722);
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    ctx.putImageData(image, 0, 0);
  }

  function writeTiffEntry(view, offset, tag, type, count, value) {
    view.setUint16(offset, tag, true);
    view.setUint16(offset + 2, type, true);
    view.setUint32(offset + 4, count, true);
    if (type === 3 && count === 1) {
      view.setUint16(offset + 8, value, true);
      view.setUint16(offset + 10, 0, true);
    } else {
      view.setUint32(offset + 8, value, true);
    }
  }

  function canvasToTiffBlob(canvas, dpi = 96, grayscale = false) {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = ctx.getImageData(0, 0, width, height).data;
    const samples = grayscale ? 1 : 3;
    const pixelBytes = width * height * samples;
    const entryCount = grayscale ? 12 : 13;
    const ifdOffset = 8;
    const ifdSize = 2 + entryCount * 12 + 4;
    let extraOffset = ifdOffset + ifdSize;
    const bitsOffset = grayscale ? 0 : extraOffset;
    if (!grayscale) extraOffset += 6;
    if (extraOffset % 2) extraOffset += 1;
    const xResOffset = extraOffset;
    extraOffset += 8;
    const yResOffset = extraOffset;
    extraOffset += 8;
    const pixelOffset = extraOffset;
    const out = new Uint8Array(pixelOffset + pixelBytes);
    const view = new DataView(out.buffer);

    out[0] = 0x49; out[1] = 0x49;
    view.setUint16(2, 42, true);
    view.setUint32(4, ifdOffset, true);
    view.setUint16(ifdOffset, entryCount, true);
    let e = ifdOffset + 2;
    const add = (tag, type, count, value) => { writeTiffEntry(view, e, tag, type, count, value); e += 12; };
    add(256, 4, 1, width);
    add(257, 4, 1, height);
    add(258, 3, grayscale ? 1 : 3, grayscale ? 8 : bitsOffset);
    add(259, 3, 1, 1);
    add(262, 3, 1, grayscale ? 1 : 2);
    add(273, 4, 1, pixelOffset);
    add(277, 3, 1, samples);
    add(278, 4, 1, height);
    add(279, 4, 1, pixelBytes);
    add(282, 5, 1, xResOffset);
    add(283, 5, 1, yResOffset);
    if (!grayscale) add(284, 3, 1, 1);
    add(296, 3, 1, 2);
    view.setUint32(e, 0, true);

    if (!grayscale) {
      view.setUint16(bitsOffset, 8, true);
      view.setUint16(bitsOffset + 2, 8, true);
      view.setUint16(bitsOffset + 4, 8, true);
    }
    const res = Math.max(1, Math.round(dpi || 96));
    view.setUint32(xResOffset, res, true); view.setUint32(xResOffset + 4, 1, true);
    view.setUint32(yResOffset, res, true); view.setUint32(yResOffset + 4, 1, true);

    let pos = pixelOffset;
    for (let i = 0; i < rgba.length; i += 4) {
      if (grayscale) {
        out[pos++] = rgba[i];
      } else {
        out[pos++] = rgba[i];
        out[pos++] = rgba[i + 1];
        out[pos++] = rgba[i + 2];
      }
    }
    return new Blob([out], { type: 'image/tiff' });
  }

  function pngDpiChunk(dpi) {
    const ppm = Math.max(1, Math.round(Number(dpi || 96) / 0.0254));
    const data = new Uint8Array(9);
    const dataView = new DataView(data.buffer);
    dataView.setUint32(0, ppm, false);
    dataView.setUint32(4, ppm, false);
    data[8] = 1;
    const type = new TextEncoder().encode('pHYs');
    const crcInput = new Uint8Array(type.length + data.length);
    crcInput.set(type, 0); crcInput.set(data, type.length);
    const chunk = new Uint8Array(4 + 4 + data.length + 4);
    const view = new DataView(chunk.buffer);
    view.setUint32(0, data.length, false);
    chunk.set(type, 4);
    chunk.set(data, 8);
    view.setUint32(8 + data.length, crc32(crcInput), false);
    return chunk;
  }

  async function pngBlobWithDpi(blob, dpi) {
    const src = new Uint8Array(await blob.arrayBuffer());
    if (src.length < 33 || src[0] !== 137 || src[1] !== 80 || src[2] !== 78 || src[3] !== 71) return blob;
    const parts = [src.slice(0, 8)];
    let offset = 8;
    let inserted = false;
    while (offset + 12 <= src.length) {
      const view = new DataView(src.buffer, src.byteOffset + offset, src.length - offset);
      const len = view.getUint32(0, false);
      const end = offset + 12 + len;
      if (end > src.length) return blob;
      const type = String.fromCharCode(...src.slice(offset + 4, offset + 8));
      if (type !== 'pHYs') parts.push(src.slice(offset, end));
      if (type === 'IHDR' && !inserted) { parts.push(pngDpiChunk(dpi)); inserted = true; }
      offset = end;
      if (type === 'IEND') break;
    }
    if (!inserted) return blob;
    return new Blob(parts, { type: 'image/png' });
  }

  async function jpegBlobWithDpi(blob, dpi) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const density = Math.max(1, Math.min(65535, Math.round(Number(dpi || 96))));
    let offset = 2;
    while (offset + 4 < bytes.length && bytes[offset] === 0xFF) {
      const marker = bytes[offset + 1];
      if (marker === 0xDA || marker === 0xD9) break;
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (marker === 0xE0 && length >= 16 && bytes[offset + 4] === 0x4A && bytes[offset + 5] === 0x46 && bytes[offset + 6] === 0x49 && bytes[offset + 7] === 0x46 && bytes[offset + 8] === 0x00) {
        bytes[offset + 11] = 1;
        bytes[offset + 12] = (density >> 8) & 0xFF;
        bytes[offset + 13] = density & 0xFF;
        bytes[offset + 14] = (density >> 8) & 0xFF;
        bytes[offset + 15] = density & 0xFF;
        return new Blob([bytes], { type: 'image/jpeg' });
      }
      if (length < 2) break;
      offset += 2 + length;
    }
    return blob;
  }

  async function encodeImageCanvas(canvas, settings) {
    if (settings.format === 'tiff') return canvasToTiffBlob(canvas, settings.dpi || 96, settings.grayscale);
    if (settings.format === 'jpeg') {
      let blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      if (settings.sizeMode === 'print') blob = await jpegBlobWithDpi(blob, settings.dpi);
      return blob;
    }
    let blob = await canvasToBlob(canvas, 'image/png');
    if (settings.sizeMode === 'print') blob = await pngBlobWithDpi(blob, settings.dpi);
    return blob;
  }

  function buildImageSegments(totalHeight, safeBreaks, maxLogicalHeight) {
    if (totalHeight <= maxLogicalHeight) return [{ start: 0, end: totalHeight }];
    const candidates = [...new Set(safeBreaks.map(v => Math.round(v)).filter(v => v > 0 && v < totalHeight))].sort((a, b) => a - b);
    candidates.push(totalHeight);
    const parts = [];
    let start = 0;
    let guard = 0;
    while (start < totalHeight && guard++ < 500) {
      const target = start + maxLogicalHeight;
      let end = candidates.filter(v => v > start && v <= target).pop();
      if (!end) end = candidates.find(v => v > start) || totalHeight;
      if (end <= start) end = Math.min(totalHeight, start + maxLogicalHeight);
      parts.push({ start, end });
      start = end;
    }
    return parts;
  }

  function paintRasterConversationBackground(ctx, width, height) {
    const background = normalizeConversationBackground(state.conversationBackground);
    if (background.mode === 'solid') {
      ctx.fillStyle = background.solid;
    } else if (background.mode === 'gradient') {
      const [x0, y0, x1, y1] = backgroundDirectionPoints(background.direction, width, height);
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      const colors = background.colors.length >= 2 ? background.colors : ['#f4f4f7', '#d9e6ff'];
      colors.forEach((color, index) => gradient.addColorStop(colors.length === 1 ? 0 : index / (colors.length - 1), color));
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = normalizeConversationStyle(state.conversationStyle) === 'chat' ? '#f4f4f7' : '#ffffff';
    }
    ctx.fillRect(0, 0, width, height);
  }

  async function renderThreadImagePart(segment, settings, imageMap) {
    const scale = settings.targetWidth / 1080;
    const logicalHeight = Math.max(1, segment.end - segment.start);
    const canvas = document.createElement('canvas');
    canvas.width = settings.targetWidth;
    canvas.height = Math.max(1, Math.ceil(logicalHeight * scale));
    const ctx = canvas.getContext('2d');
    paintRasterConversationBackground(ctx, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(0, -segment.start);
    paintPngThread(ctx, true, imageMap);
    ctx.restore();
    if (settings.grayscale) applyCanvasGrayscale(canvas);
    return canvas;
  }

  async function exportImageFromDialog() {
    const settings = imageExportSettings();
    let imageMap = new Map();
    const oldLabel = els.runImageExportBtn.textContent;
    els.runImageExportBtn.disabled = true;
    els.runImageExportBtn.textContent = 'Exporting…';
    try {
      if (els.saveStatus) els.saveStatus.textContent = 'Preparing image export…';
      imageMap = await loadCanvasImagesForState(state);
      const measure = document.createElement('canvas');
      measure.width = 1080;
      measure.height = 100;
      const measureCtx = measure.getContext('2d');
      const safeBreaks = [];
      const totalLogicalHeight = Math.ceil(paintPngThread(measureCtx, false, imageMap, { safeBreaks }));
      const scale = settings.targetWidth / 1080;
      const totalPhysicalHeight = Math.ceil(totalLogicalHeight * scale);
      const SAFE_MAX_DIMENSION = 12000;
      const SAFE_MAX_PIXELS = 16000000;
      const safePartHeight = Math.max(640, Math.min(SAFE_MAX_DIMENSION, Math.floor(SAFE_MAX_PIXELS / settings.targetWidth)));
      let segments;
      if (settings.split) {
        segments = buildImageSegments(totalLogicalHeight, safeBreaks, safePartHeight / scale);
      } else {
        if (totalPhysicalHeight > safePartHeight) {
          throw new Error(`This export would exceed the browser-safe canvas budget at ${settings.targetWidth.toLocaleString()} px wide. Turn on automatic splitting or choose a smaller width.`);
        }
        segments = [{ start: 0, end: totalLogicalHeight }];
      }

      const format = settings.format;
      const extension = format === 'jpeg' ? 'jpg' : format === 'tiff' ? 'tif' : 'png';
      const base = safeName(state.title);
      const files = {};
      let singleBlob = null;
      for (let i = 0; i < segments.length; i += 1) {
        if (els.saveStatus) els.saveStatus.textContent = `Rendering image ${i + 1} of ${segments.length}…`;
        const canvas = await renderThreadImagePart(segments[i], settings, imageMap);
        const blob = await encodeImageCanvas(canvas, settings);
        if (segments.length === 1) {
          singleBlob = blob;
        } else {
          const number = String(i + 1).padStart(2, '0');
          files[`${base}-part-${number}.${extension}`] = new Uint8Array(await blob.arrayBuffer());
        }
        canvas.width = 1; canvas.height = 1;
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      if (segments.length === 1) {
        downloadBlob(singleBlob, `${base}.${extension}`);
      } else {
        const zip = makeStoredZip(files);
        downloadBlob(new Blob([zip], { type: 'application/zip' }), `${base}-${extension}-parts.zip`);
      }
      els.imageExportDialog.close();
      if (els.saveStatus) els.saveStatus.textContent = segments.length === 1 ? `${extension.toUpperCase()} exported` : `${segments.length} image parts exported`;
    } catch (err) {
      console.error(err);
      alert(err.message || 'Image export failed in this browser.');
      if (els.saveStatus) els.saveStatus.textContent = 'Image export failed';
    } finally {
      closeCanvasImages(imageMap);
      els.runImageExportBtn.disabled = false;
      els.runImageExportBtn.textContent = oldLabel;
    }
  }

  function htmlEscape(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function htmlMultiline(value) {
    return htmlEscape(value).replace(/\n/g, '<br>');
  }

  async function mediaDataUrlsForState(project) {
    const map = new Map();
    for (const id of imageIdsForState(project)) {
      const record = await getMediaRecord(id);
      if (record?.blob) map.set(id, await blobToDataUrl(record.blob));
    }
    return map;
  }

  function htmlAttachment(attachment, mediaMap, alignmentClass = '') {
    const normalized = normalizeImageAttachment(attachment);
    if (!normalized) return '';
    const src = mediaMap.get(normalized.id) || '';
    const alt = htmlEscape(normalized.altText || normalized.caption || normalized.name || 'Image attachment');
    const image = src
      ? `<img src="${src}" alt="${alt}">`
      : `<div class="missing-image">[Image unavailable: ${htmlEscape(normalized.name)}]</div>`;
    const caption = normalized.caption ? `<figcaption>${htmlMultiline(normalized.caption)}</figcaption>` : '';
    return `<figure class="attachment ${alignmentClass}">${image}${caption}</figure>`;
  }

  function htmlLinkPreview(previewValue, mediaMap, alignmentClass = '') {
    const preview = normalizeLinkPreview(previewValue);
    if (!preview) return '';
    let thumb = '';
    if (preview.thumbnail) {
      const src = mediaMap.get(preview.thumbnail.id) || '';
      if (src) thumb = `<img class="preview-thumb" src="${src}" alt="${htmlEscape(preview.thumbnail.altText || '')}">`;
    }
    return `<div class="link-preview ${alignmentClass}">${thumb}<div class="preview-copy">${preview.site ? `<div class="preview-site">${htmlEscape(preview.site)}</div>` : ''}${preview.title ? `<div class="preview-title">${htmlMultiline(preview.title)}</div>` : ''}${preview.description ? `<div class="preview-description">${htmlMultiline(preview.description)}</div>` : ''}${preview.displayUrl ? `<div class="preview-url">${htmlEscape(preview.displayUrl)}</div>` : ''}</div></div>`;
  }

  async function buildHtmlExport() {
    const mediaMap = await mediaDataUrlsForState(state);
    const style = normalizeConversationStyle(state.conversationStyle);
    const plainDraft = style !== 'chat';
    const background = normalizeConversationBackground(state.conversationBackground);
    const customBackground = background.mode !== 'default';
    const darkBackground = customBackground && customBackgroundIsDark(background);
    const backgroundCss = conversationBackgroundCss(background) || (style === 'chat' ? '#f4f4f7' : '#ffffff');
    const documentText = darkBackground ? '#f7f7fa' : '#17171b';
    const documentMuted = darkBackground ? '#dedee6' : '#6d6d78';
    const highContrastLabels = state.highContrastLabels === true;
    const widthMode = normalizeConversationWidth(state.conversationWidth);
    const documentMaxWidth = widthMode === 'phone' ? 440 : (widthMode === 'tablet' ? 680 : 820);
    const body = [];
    let previousSpeaker = null;
    for (const item of state.messages) {
      if (isNarrative(item)) {
        body.push(`<section class="narrative ${item.narrativeStyle === 'system' ? 'system' : 'prose'}"><div class="narrative-text">${htmlMultiline(item.text)}</div>${htmlAttachment(item.imageAttachment, mediaMap, 'center')}${htmlLinkPreview(item.linkPreview, mediaMap, 'center')}</section>`);
        previousSpeaker = null;
        continue;
      }
      const p = getParticipant(item.speakerId);
      if (!p) continue;
      const continues = previousSpeaker === item.speakerId;
      const side = p.side === 'right' ? 'right' : 'left';
      const showSpeaker = plainDraft || !continues;
      const speaker = showSpeaker ? `<div class="speaker">${htmlEscape(plainDraft ? p.name.toLocaleUpperCase() : p.name)}</div>` : '';
      const timestamp = item.displayTimestamp ? `<div class="timestamp">${htmlEscape(item.displayTimestamp)}</div>` : '';
      const bubbleStyle = plainDraft ? '' : ` style="--bubble:${htmlEscape(p.color || '#e5e5ea')};--bubble-text:${htmlEscape(participantBubbleTextColor(p))}"`;
      const bubble = `<div class="bubble"${bubbleStyle}>${htmlMultiline(item.text)}</div>`;
      const annotation = item.annotation ? `<div class="annotation">${htmlMultiline(item.annotation)}</div>` : '';
      const mediaAlign = style === 'screen' ? 'center' : (plainDraft ? 'left' : side);
      body.push(`<section class="message ${side}${continues && !plainDraft ? ' continuation' : ''}"><div class="message-card">${speaker}${timestamp}${bubble}${htmlAttachment(item.imageAttachment, mediaMap, mediaAlign)}${htmlLinkPreview(item.linkPreview, mediaMap, mediaAlign)}${annotation}</div></section>`);
      previousSpeaker = item.speakerId;
    }
    const sceneHeader = state.sceneHeader ? `<div class="scene-header ${htmlEscape(state.headerFont || 'rounded')}">${htmlMultiline(state.sceneHeader)}</div>` : '';
    const title = htmlEscape(state.title || 'Untitled Thread');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:${backgroundCss};color:${documentText};font-family:ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,-apple-system,sans-serif}.document{width:min(100%,${documentMaxWidth}px);margin:0 auto;padding:34px 18px 60px}h1{font-size:28px;margin:0 0 24px}.scene-header{text-align:center;font-weight:720;font-size:21px;line-height:1.3;margin:0 auto 30px;white-space:pre-wrap}.scene-header.serif{font-family:Georgia,"Times New Roman",serif}.scene-header.mono{font-family:ui-monospace,Consolas,monospace}.message{display:flex;margin:11px 0}.message.continuation{margin-top:-7px}.message.left{justify-content:flex-start}.message.right{justify-content:flex-end}.message-card{max-width:${plainDraft ? '100%' : '67%'}}.speaker{font-size:12px;color:${documentMuted};margin:0 10px 4px}.high-contrast-labels .speaker{display:block;width:max-content;padding:2px 7px;border-radius:999px;background:rgba(0,0,0,.78);color:#fff!important}.high-contrast-labels .right .speaker{margin-left:auto}.high-contrast-labels.transcript .right .speaker{margin-left:10px;margin-right:10px}.high-contrast-labels.theater .speaker,.high-contrast-labels.screen .speaker{margin-left:auto!important;margin-right:auto!important}.right .speaker,.right .timestamp,.right .annotation,.right figcaption{text-align:right}.timestamp{font-size:10.5px;color:${documentMuted};margin:0 10px 4px}.bubble{background:${plainDraft ? 'transparent' : 'var(--bubble,#e5e5ea)'};padding:${plainDraft ? '0' : '10px 13px'};border-radius:${plainDraft ? '0' : '18px'};color:${plainDraft ? documentText : 'var(--bubble-text,#151518)'};line-height:1.42;white-space:pre-wrap;overflow-wrap:anywhere}.annotation{margin:7px 10px 0;color:${documentMuted};font-size:12px;font-style:italic;line-height:1.4}.narrative{width:min(78%,680px);margin:24px auto;color:${documentMuted};font:italic 14px/1.5 Georgia,"Times New Roman",serif}.narrative.system{font-family:ui-rounded,"Segoe UI",system-ui,sans-serif;font-style:normal;font-weight:560}.narrative-text{text-align:center}.attachment{margin:9px 0 0;max-width:610px}.attachment.center{margin-left:auto;margin-right:auto}.attachment.right{margin-left:auto}.attachment img{display:block;max-width:100%;max-height:70vh;border-radius:12px}.attachment figcaption{margin-top:6px;color:${documentMuted};font-size:12px;line-height:1.4}.attachment.right img{margin-left:auto}.attachment.center img{margin-left:auto;margin-right:auto}.link-preview{display:flex;gap:12px;margin-top:10px;max-width:620px;padding:12px;border:1px solid #d8d8df;border-radius:14px;background:#f7f7f9;color:#17171b;font-family:ui-rounded,"Segoe UI",system-ui,sans-serif;text-align:left}.link-preview.right{margin-left:auto}.link-preview.center{margin-left:auto;margin-right:auto}.preview-thumb{width:min(31%,150px);object-fit:cover;align-self:stretch;max-height:130px}.preview-copy{min-width:0}.preview-site,.preview-url{font-size:11px;color:#777780}.preview-title{font-size:16px;font-weight:750;line-height:1.28;margin:3px 0}.preview-description{font-size:13px;color:#555560;line-height:1.35;margin:3px 0}.missing-image{padding:20px;background:#e5e5ea;color:#686872;text-align:center;border-radius:12px}.transcript .message,.theater .message,.screen .message{justify-content:flex-start;margin:18px 0}.transcript .message-card,.theater .message-card,.screen .message-card{width:100%;max-width:100%}.transcript .right .speaker,.transcript .right .timestamp,.transcript .right .annotation,.transcript .right figcaption,.theater .right .annotation,.screen .right .annotation{text-align:left}.transcript .attachment.right,.transcript .link-preview.right,.theater .attachment.right,.theater .link-preview.right{margin-left:0;margin-right:auto}.theater .speaker,.screen .speaker{text-align:center!important;text-transform:uppercase;font-weight:800;letter-spacing:.07em}.theater .timestamp,.screen .timestamp{text-align:center!important}.theater .bubble{text-align:left}.theater .narrative{margin-left:8%;margin-right:auto}.theater .narrative-text{text-align:left}.screen .bubble{width:min(62%,520px);margin:0 auto;text-align:left}.screen .annotation{width:min(62%,520px);margin-left:auto;margin-right:auto;text-align:left!important}.screen .narrative{width:min(76%,650px)}.screen .narrative-text{text-align:left}@media(max-width:600px){.document{padding:24px 12px 42px}.message-card{max-width:${plainDraft ? '100%' : '78%'}.attachment,.link-preview{max-width:100%}.screen .bubble,.screen .annotation{width:min(76%,520px)}}@media print{@page{margin:.55in}body{background:#fff!important;color:#17171b}.document{width:100%;padding:0}.message-card,.narrative,.attachment,.link-preview{break-inside:avoid}.narrative{color:#000!important}.bubble{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body><main class="document ${style}${highContrastLabels ? ' high-contrast-labels' : ''}"><h1>${title}</h1>${sceneHeader}${body.join('')}</main></body>
</html>`;
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

  function documentPackage(documentXml, stylesXml, mediaFiles = {}, imageRelationships = []) {
    const imageRels = imageRelationships.map(rel => `  <Relationship Id="${rel.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${rel.target}"/>`).join('\n');
    const files = {
      '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
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
${imageRels}
</Relationships>`,
      ...mediaFiles
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

  function wordNarrativeParagraph(text, narrativeStyle = 'narrative') {
    const systemStyle = narrativeStyle === 'system';
    const runProps = systemStyle
      ? '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="33333A"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>'
      : '<w:rPr><w:i/><w:color w:val="666670"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>';
    const runs = String(text).split('\n').map((line, index) => {
      const br = index ? '<w:r><w:br/></w:r>' : '';
      return `${br}<w:r>${runProps}<w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
    }).join('');
    const style = normalizeConversationStyle(state.conversationStyle);
    if (style === 'theater') return `<w:p><w:pPr><w:jc w:val="left"/><w:ind w:left="720" w:right="1080"/><w:spacing w:before="160" w:after="200"/></w:pPr>${runs}</w:p>`;
    if (style === 'screen') return `<w:p><w:pPr><w:jc w:val="left"/><w:ind w:left="1080" w:right="1080"/><w:spacing w:before="160" w:after="200"/></w:pPr>${runs}</w:p>`;
    return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="160" w:after="200"/></w:pPr>${runs}</w:p>`;
  }

  function wordAnnotationParagraph(text, side = 'left') {
    const runs = String(text).split('\n').map((line, index) => {
      const br = index ? '<w:r><w:br/></w:r>' : '';
      return `${br}<w:r><w:rPr><w:i/><w:color w:val="6D6D78"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
    }).join('');
    return `<w:p><w:pPr><w:jc w:val="${side === 'right' ? 'right' : 'left'}"/><w:spacing w:before="0" w:after="180"/></w:pPr>${runs}</w:p>`;
  }

  function wordPortableLinkPreview(previewValue, align = 'left', trailingAfter = 180) {
    const preview = normalizeLinkPreview(previewValue);
    if (!preview) return [];
    const makePreviewParagraph = (text, { italic = false, bold = false, size = 18, color = '666670', after = 50 } = {}) => {
      const runs = String(text).split('\n').map((line, index) => {
        const br = index ? '<w:r><w:br/></w:r>' : '';
        return `${br}<w:r><w:rPr>${italic ? '<w:i/>' : ''}${bold ? '<w:b/>' : ''}<w:color w:val="${color}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
      }).join('');
      return `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="0" w:after="${after}"/></w:pPr>${runs}</w:p>`;
    };
    const paragraphs = [makePreviewParagraph('[Link preview]', { italic: true, size: 17, color: '777780', after: 35 })];
    if (preview.site) paragraphs.push(makePreviewParagraph(`Source: ${preview.site}`, { size: 18, after: 25 }));
    if (preview.title) paragraphs.push(makePreviewParagraph(preview.title, { bold: true, size: 21, color: '33333A', after: 25 }));
    if (preview.description) paragraphs.push(makePreviewParagraph(preview.description, { size: 19, color: '555560', after: 25 }));
    if (preview.displayUrl) paragraphs.push(makePreviewParagraph(preview.displayUrl, { size: 17, color: '777780', after: preview.thumbnail ? 25 : trailingAfter }));
    if (preview.thumbnail) paragraphs.push(makePreviewParagraph(`[Thumbnail: ${preview.thumbnail.name || 'image'}]`, { italic: true, size: 17, color: '777780', after: trailingAfter }));
    return paragraphs;
  }

  function wordPortableImageMetadata(attachment, align = 'left', trailingAfter = 180) {
    const image = normalizeImageAttachment(attachment);
    if (!image) return [];
    const paragraphs = [];
    const makeParagraph = (text, { italic = false, size = 18, color = '666670', after = 50 } = {}) => {
      const runs = String(text).split('\n').map((line, index) => {
        const br = index ? '<w:r><w:br/></w:r>' : '';
        return `${br}<w:r><w:rPr>${italic ? '<w:i/>' : ''}<w:color w:val="${color}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
      }).join('');
      return `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="0" w:after="${after}"/></w:pPr>${runs}</w:p>`;
    };
    paragraphs.push(makeParagraph(`[Image attachment: ${image.name || 'image'}]`, { italic: true, size: 18, color: '777780', after: image.caption || image.altText ? 45 : trailingAfter }));
    if (image.caption) paragraphs.push(makeParagraph(`Caption: ${image.caption}`, { size: 19, color: '555560', after: image.altText ? 45 : trailingAfter }));
    if (image.altText) paragraphs.push(makeParagraph(`Alt text: ${image.altText}`, { italic: true, size: 17, color: '777780', after: trailingAfter }));
    return paragraphs;
  }

  async function buildPortableDocx() {
    const paragraphs = [];
    paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${xmlEscape(state.title || 'Untitled Thread')}</w:t></w:r></w:p>`);
    if (state.sceneHeader) paragraphs.push(wordSceneHeaderParagraph());
    for (const item of state.messages) {
      if (isNarrative(item)) {
        paragraphs.push(wordNarrativeParagraph(item.text, item.narrativeStyle));
        paragraphs.push(...wordPortableImageMetadata(item.imageAttachment, 'center', item.linkPreview ? 60 : 180));
        paragraphs.push(...wordPortableLinkPreview(item.linkPreview, 'center', 180));
        continue;
      }
      const p = getParticipant(item.speakerId);
      const timestampRun = item.displayTimestamp ? `<w:r><w:rPr><w:i/><w:color w:val="6D6D78"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t xml:space="preserve">  ${xmlEscape(item.displayTimestamp)}</w:t></w:r>` : '';
      paragraphs.push(`<w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${xmlEscape(p?.name || 'Unknown')}</w:t></w:r>${timestampRun}</w:p>`);
      paragraphs.push(`<w:p><w:pPr><w:spacing w:after="${item.imageAttachment || item.linkPreview || item.annotation ? 60 : 180}"/></w:pPr>${textRuns(item.text)}</w:p>`);
      paragraphs.push(...wordPortableImageMetadata(item.imageAttachment, 'left', (item.linkPreview || item.annotation) ? 60 : 180));
      paragraphs.push(...wordPortableLinkPreview(item.linkPreview, 'left', item.annotation ? 60 : 180));
      if (item.annotation) paragraphs.push(wordAnnotationParagraph(item.annotation, 'left'));
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

  function richTextRuns(text, color = '111116') {
    const safeColor = sanitizeHexColor(color);
    return String(text).split('\n').map((line, idx) => {
      const run = `<w:r><w:rPr><w:color w:val="${safeColor}"/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
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

  function bubbleCell(width, text, fill, textColor = '111116') {
    return `<w:tc>
      <w:tcPr>
        <w:tcW w:w="${width}" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
        <w:tcMar><w:top w:w="115" w:type="dxa"/><w:left w:w="165" w:type="dxa"/><w:bottom w:w="115" w:type="dxa"/><w:right w:w="165" w:type="dxa"/></w:tcMar>
        <w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>
        <w:vAlign w:val="center"/>
      </w:tcPr>
      <w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="300" w:lineRule="auto"/></w:pPr>${richTextRuns(text, textColor)}</w:p>
    </w:tc>`;
  }

  function timestampCell(width, text, side) {
    return `<w:tc>
      <w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>
      <w:p><w:pPr><w:jc w:val="${side === 'right' ? 'right' : 'left'}"/><w:spacing w:before="0" w:after="35"/></w:pPr><w:r><w:rPr><w:color w:val="7A7A84"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>${xmlEscape(text)}</w:t></w:r></w:p>
    </w:tc>`;
  }

  function annotationCell(width, text, side) {
    const runs = String(text).split('\n').map((line, index) => {
      const br = index ? '<w:r><w:br/></w:r>' : '';
      return `${br}<w:r><w:rPr><w:i/><w:color w:val="6D6D78"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
    }).join('');
    return `<w:tc>
      <w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>
      <w:p><w:pPr><w:jc w:val="${side === 'right' ? 'right' : 'left'}"/><w:spacing w:before="55" w:after="0"/></w:pPr>${runs}</w:p>
    </w:tc>`;
  }

  function richMessageTable(message, participant, continuesSpeaker, includeAnnotation = true) {
    const CONTENT_WIDTH = 10080;
    const bubbleWidth = Math.round(CONTENT_WIDTH * estimateBubblePercent(message.text) / 100);
    const spacerWidth = CONTENT_WIDTH - bubbleWidth;
    const side = participant?.side === 'right' ? 'right' : 'left';
    const fill = sanitizeHexColor(participant?.color);
    const textColor = sanitizeHexColor(participantBubbleTextColor(participant));
    const name = participant?.name || 'Unknown';
    const firstWidth = side === 'left' ? bubbleWidth : spacerWidth;
    const secondWidth = CONTENT_WIDTH - firstWidth;
    const grid = `<w:tblGrid><w:gridCol w:w="${firstWidth}"/><w:gridCol w:w="${secondWidth}"/></w:tblGrid>`;
    const labelRow = continuesSpeaker ? '' : `<w:tr><w:trPr><w:cantSplit/></w:trPr>${labelCell(name, side)}</w:tr>`;
    const bubbleRow = `<w:tr><w:trPr><w:cantSplit/></w:trPr>${side === 'left' ? `${bubbleCell(bubbleWidth, message.text, fill, textColor)}${emptyCell(spacerWidth)}` : `${emptyCell(spacerWidth)}${bubbleCell(bubbleWidth, message.text, fill, textColor)}`}</w:tr>`;
    const timestampRow = message.displayTimestamp ? `<w:tr><w:trPr><w:cantSplit/></w:trPr>${side === 'left' ? `${timestampCell(bubbleWidth, message.displayTimestamp, side)}${emptyCell(spacerWidth)}` : `${emptyCell(spacerWidth)}${timestampCell(bubbleWidth, message.displayTimestamp, side)}`}</w:tr>` : '';
    const annotationRow = includeAnnotation && message.annotation ? `<w:tr><w:trPr><w:cantSplit/></w:trPr>${side === 'left' ? `${annotationCell(bubbleWidth, message.annotation, side)}${emptyCell(spacerWidth)}` : `${emptyCell(spacerWidth)}${annotationCell(bubbleWidth, message.annotation, side)}`}</w:tr>` : '';
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
  ${annotationRow}
</w:tbl>`;
  }

  function richTranscriptMessage(message, participant, includeAnnotation = true) {
    const name = participant?.name || 'Unknown';
    const timestamp = message.displayTimestamp
      ? `<w:r><w:rPr><w:color w:val="7A7A84"/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr><w:t xml:space="preserve">  ${xmlEscape(message.displayTimestamp)}</w:t></w:r>`
      : '';
    const annotation = includeAnnotation && message.annotation ? wordAnnotationParagraph(message.annotation, 'left') : '';
    return `<w:p><w:pPr><w:spacing w:before="180" w:after="45"/></w:pPr><w:r><w:rPr><w:b/><w:smallCaps/><w:color w:val="6D6D78"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>${xmlEscape(name)}</w:t></w:r>${timestamp}</w:p>
<w:p><w:pPr><w:spacing w:before="0" w:after="${message.annotation ? 35 : 90}"/></w:pPr>${richTextRuns(message.text)}</w:p>${annotation}`;
  }

  function richDraftMessage(message, participant, style = 'theater', includeAnnotation = true) {
    const name = (participant?.name || 'Unknown').toLocaleUpperCase();
    const cue = `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="190" w:after="45"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="6D6D78"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>${xmlEscape(name)}</w:t></w:r></w:p>`;
    const timestamp = message.displayTimestamp ? `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="45"/></w:pPr><w:r><w:rPr><w:color w:val="7A7A84"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>${xmlEscape(message.displayTimestamp)}</w:t></w:r></w:p>` : '';
    const dialoguePr = style === 'screen'
      ? '<w:pPr><w:ind w:left="1800" w:right="1800"/><w:spacing w:before="0" w:after="90"/></w:pPr>'
      : '<w:pPr><w:spacing w:before="0" w:after="90"/></w:pPr>';
    const annotation = includeAnnotation && message.annotation
      ? (style === 'screen'
        ? `<w:p><w:pPr><w:ind w:left="1800" w:right="1800"/><w:spacing w:before="0" w:after="180"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="6D6D78"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t xml:space="preserve">${xmlEscape(message.annotation)}</w:t></w:r></w:p>`
        : wordAnnotationParagraph(message.annotation, 'left'))
      : '';
    return `${cue}${timestamp}<w:p>${dialoguePr}${richTextRuns(message.text)}</w:p>${annotation}`;
  }

  async function prepareDocxImages(project) {
    const images = new Map();
    const mediaFiles = {};
    const relationships = [];
    let index = 1;
    for (const id of imageIdsForState(project)) {
      const record = await getMediaRecord(id);
      if (!record?.blob) continue;
      const ext = record.mime === 'image/png' ? 'png' : 'jpg';
      const relId = `rIdImage${index}`;
      const target = `media/image${index}.${ext}`;
      const packagePath = `word/${target}`;
      const bytes = new Uint8Array(await record.blob.arrayBuffer());
      const info = {
        relId,
        target,
        packagePath,
        name: record.name || `image${index}.${ext}`,
        mime: record.mime || (ext === 'png' ? 'image/png' : 'image/jpeg'),
        width: Number(record.width) || 1,
        height: Number(record.height) || 1,
        docPrId: index
      };
      images.set(id, info);
      mediaFiles[packagePath] = bytes;
      relationships.push({ id: relId, target });
      index += 1;
    }
    return { images, mediaFiles, relationships };
  }

  function wordImageParagraph(info, align = 'left', maxWidthInches = 5.4, maxHeightInches = 6.5, altText = '') {
    if (!info) return '';
    const EMU_PER_INCH = 914400;
    const intrinsicWidth = Math.max(1, info.width) / 96 * EMU_PER_INCH;
    const intrinsicHeight = Math.max(1, info.height) / 96 * EMU_PER_INCH;
    const scale = Math.min(1, maxWidthInches * EMU_PER_INCH / intrinsicWidth, maxHeightInches * EMU_PER_INCH / intrinsicHeight);
    const cx = Math.max(1, Math.round(intrinsicWidth * scale));
    const cy = Math.max(1, Math.round(intrinsicHeight * scale));
    return `<w:p>
  <w:pPr><w:jc w:val="${align}"/><w:spacing w:before="70" w:after="120"/></w:pPr>
  <w:r><w:drawing>
    <wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="${cx}" cy="${cy}"/>
      <wp:effectExtent l="0" t="0" r="0" b="0"/>
      <wp:docPr id="${info.docPrId}" name="${xmlEscape(info.name)}" descr="${xmlEscape(altText || '')}"/>
      <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:pic>
            <pic:nvPicPr><pic:cNvPr id="0" name="${xmlEscape(info.name)}" descr="${xmlEscape(altText || '')}"/><pic:cNvPicPr/></pic:nvPicPr>
            <pic:blipFill><a:blip r:embed="${info.relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
            <pic:spPr>
              <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            </pic:spPr>
          </pic:pic>
        </a:graphicData>
      </a:graphic>
    </wp:inline>
  </w:drawing></w:r>
</w:p>`;
  }

  function wordImageCaptionParagraph(text, align = 'left') {
    if (!text) return '';
    const runs = String(text).split('\n').map((line, index) => {
      const br = index ? '<w:r><w:br/></w:r>' : '';
      return `${br}<w:r><w:rPr><w:color w:val="5F5F68"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
    }).join('');
    return `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="0" w:after="120"/></w:pPr>${runs}</w:p>`;
  }

  function wordLinkPreviewBlock(previewValue, imageInfo = null, align = 'left') {
    const preview = normalizeLinkPreview(previewValue);
    if (!preview) return '';
    const parts = [];
    if (preview.site) parts.push(`<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:after="20"/></w:pPr><w:r><w:rPr><w:b/><w:smallCaps/><w:color w:val="777780"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>${xmlEscape(preview.site)}</w:t></w:r></w:p>`);
    if (preview.title) parts.push(`<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:after="35"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="24242A"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>${xmlEscape(preview.title)}</w:t></w:r></w:p>`);
    if (preview.description) parts.push(`<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:after="30"/></w:pPr>${richTextRuns(preview.description)}</w:p>`);
    if (preview.displayUrl) parts.push(`<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:after="35"/></w:pPr><w:r><w:rPr><w:color w:val="777780"/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr><w:t>${xmlEscape(preview.displayUrl)}</w:t></w:r></w:p>`);
    if (imageInfo) parts.push(wordImageParagraph(imageInfo, align, 2.25, 1.75, ''));
    return `<w:tbl><w:tblPr><w:tblW w:w="7600" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="D6D6DE"/><w:left w:val="single" w:sz="6" w:color="D6D6DE"/><w:bottom w:val="single" w:sz="6" w:color="D6D6DE"/><w:right w:val="single" w:sz="6" w:color="D6D6DE"/></w:tblBorders><w:tblCellMar><w:top w:w="110" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="110" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tr><w:tc><w:tcPr><w:tcW w:w="7600" w:type="dxa"/></w:tcPr>${parts.join('')}</w:tc></w:tr></w:tbl><w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>`;
  }

  async function buildRichDocx() {
    const prepared = await prepareDocxImages(state);
    const blocks = [];
    blocks.push(`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${xmlEscape(state.title || 'Untitled Thread')}</w:t></w:r></w:p>`);
    if (state.sceneHeader) blocks.push(wordSceneHeaderParagraph());
    state.messages.forEach((item, index) => {
      const imageInfo = item.imageAttachment ? prepared.images.get(item.imageAttachment.id) : null;
      const preview = normalizeLinkPreview(item.linkPreview);
      const previewImageInfo = preview?.thumbnail ? prepared.images.get(preview.thumbnail.id) : null;
      if (isNarrative(item)) {
        blocks.push(wordNarrativeParagraph(item.text, item.narrativeStyle));
        if (imageInfo) {
          blocks.push(wordImageParagraph(imageInfo, 'center', 5.4, 6.5, item.imageAttachment?.altText || ''));
          if (item.imageAttachment?.caption) blocks.push(wordImageCaptionParagraph(item.imageAttachment.caption, 'center'));
        }
        if (preview) blocks.push(wordLinkPreviewBlock(preview, previewImageInfo, 'center'));
        return;
      }
      const p = getParticipant(item.speakerId);
      const previous = state.messages[index - 1];
      const continuesSpeaker = isMessage(previous) && previous?.speakerId === item.speakerId;
      const includeAnnotation = !imageInfo;
      const docStyle = normalizeConversationStyle(state.conversationStyle);
      blocks.push(docStyle === 'transcript'
        ? richTranscriptMessage(item, p, includeAnnotation)
        : (docStyle === 'theater' || docStyle === 'screen'
          ? richDraftMessage(item, p, docStyle, includeAnnotation)
          : richMessageTable(item, p, continuesSpeaker, includeAnnotation)));
      if (imageInfo) {
        const align = docStyle === 'screen' ? 'center' : (docStyle === 'transcript' || docStyle === 'theater' ? 'left' : (p?.side === 'right' ? 'right' : 'left'));
        blocks.push(wordImageParagraph(imageInfo, align, docStyle === 'chat' ? 4.7 : 5.4, 6.3, item.imageAttachment?.altText || ''));
        if (item.imageAttachment?.caption) blocks.push(wordImageCaptionParagraph(item.imageAttachment.caption, align));
        if (item.annotation) blocks.push(wordAnnotationParagraph(item.annotation, align));
      }
      if (preview) {
        const previewAlign = docStyle === 'screen' ? 'center' : (docStyle === 'transcript' || docStyle === 'theater' ? 'left' : (p?.side === 'right' ? 'right' : 'left'));
        blocks.push(wordLinkPreviewBlock(preview, previewImageInfo, previewAlign));
      }
    });

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${blocks.join('\n')}
    <w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    return documentPackage(documentXml, baseStylesXml, prepared.mediaFiles, prepared.relationships);
  }

  function makeStoredZip(files) {
    const encoder = new TextEncoder();
    const entries = [];
    let offset = 0;
    const localParts = [];

    for (const [name, content] of Object.entries(files)) {
      const nameBytes = encoder.encode(name);
      const data = content instanceof Uint8Array
        ? content
        : content instanceof ArrayBuffer
          ? new Uint8Array(content)
          : encoder.encode(String(content));
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
    navigator.serviceWorker.register('./sw.js?v=0.10.7').catch(() => {});
  }

  if (els.runtimeVersion) els.runtimeVersion.textContent = `v${APP_VERSION}`;
  render();
  autoSizeComposer();
})();
