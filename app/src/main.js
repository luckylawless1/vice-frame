// VICE FRAME editor: wires the rails to the cover renderer.
//
// State holds the photos, one slot per panel (photo, grade, zoom, pan),
// the layout and post size, the lettering, the stickers and the grain.
// The preview re-renders the cover on every change; Export renders it at
// full post size and downloads the PNG. Shot hooks at the bottom let a
// headless browser pull finished covers for the entry screenshots.

import { LAYOUTS, layoutPanels } from './layouts.js';
import { GRADE_ORDER, GRADE_LABELS } from './effects.js';
import { SIZES, renderCover, exportCoverPng } from './cover.js';

const SAMPLE_PHOTOS = [
  { id: 'duo-rooftop', src: './samples/duo-rooftop.jpg', name: 'Duo Rooftop' },
  { id: 'woman-pink-car', src: './samples/woman-pink-car.jpg', name: 'Woman & Pink Car' },
  { id: 'man-boardwalk', src: './samples/man-boardwalk.jpg', name: 'Man on Boardwalk' },
  { id: 'boulevard', src: './samples/boulevard.jpg', name: 'Boulevard' },
  { id: 'pier', src: './samples/pier.jpg', name: 'Pier' },
];

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
const photoStrip = document.getElementById('photoStrip');
const photoUpload = document.getElementById('photoUpload');
const gradeSelected = document.getElementById('gradeSelected');
const gradeAll = document.getElementById('gradeAll');
const titleInput = document.getElementById('titleInput');
const taglineInput = document.getElementById('taglineInput');
const captionInput = document.getElementById('captionInput');
const zoomSlider = document.getElementById('zoomSlider');

const state = {
  layout: 'panel-grid',
  size: 'landscape',
  title: 'VICE CITY HEAT',
  tagline: 'TWO CREWS. ONE CITY.',
  caption: 'EVERY SUNSET HAS A PRICE',
  stickers: { palm: true, starburst: true, wanted: true, sun: true },
  grain: true,
  panels: [],
  photoById: {},
};

const photos = [];
let selectedPanel = 0;
let uploadCount = 0;

function defaultSlot(photoId = null, grade = 'vice-sunset') {
  return { photoId, grade, zoom: 1, panX: 0, panY: 0 };
}

function currentPanelCount() {
  const size = SIZES[state.size];
  return layoutPanels(state.layout, size.width, size.height).length;
}

function ensureSlots() {
  const count = currentPanelCount();
  while (state.panels.length < count) state.panels.push(defaultSlot());
  state.panels.length = count;
  if (selectedPanel >= count) selectedPanel = 0;
}

// Panels left empty by a layout switch borrow photos in strip order, so
// the preview never shows a hole after switching.
function fillEmptyPanels() {
  ensureSlots();
  if (photos.length === 0) return;
  state.panels.forEach((slot, index) => {
    if (!slot.photoId) slot.photoId = photos[index % photos.length].id;
  });
}

// The preview renders at export aspect, capped at 1280 px wide.
function previewDims() {
  const size = SIZES[state.size];
  const scale = Math.min(1, 1280 / size.width);
  return { w: Math.round(size.width * scale), h: Math.round(size.height * scale) };
}

function render() {
  ensureSlots();
  const { w, h } = previewDims();
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  renderCover(ctx, state, w, h, { selectedIndex: selectedPanel });
  syncControls();
}

function syncControls() {
  const slot = state.panels[selectedPanel];
  if (slot) {
    gradeSelected.value = slot.grade;
    zoomSlider.value = String(Math.round((slot.zoom || 1) * 100));
  }
  document.querySelectorAll('[data-layout]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.layout === state.layout);
  });
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.size === state.size);
  });
  document.querySelectorAll('.thumb').forEach((thumb) => {
    thumb.classList.toggle('active', slot != null && thumb.dataset.photoId === slot.photoId);
  });
}

// ---------------------------------------------------------------- photos

function addThumb(photo) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'thumb';
  button.dataset.photoId = photo.id;
  button.title = photo.name;
  const img = document.createElement('img');
  img.src = photo.thumbSrc;
  img.alt = photo.name;
  button.append(img);
  button.addEventListener('click', () => {
    const slot = state.panels[selectedPanel];
    if (slot) slot.photoId = photo.id;
    render();
  });
  photoStrip.append(button);
}

function addPhoto(photo) {
  photos.push(photo);
  state.photoById[photo.id] = photo;
  addThumb(photo);
}

function loadSample(sample) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      addPhoto({ id: sample.id, img, name: sample.name, thumbSrc: sample.src });
      resolve();
    };
    img.onerror = () => resolve();
    img.src = sample.src;
  });
}

function handleUploads(files) {
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      uploadCount += 1;
      const photo = { id: `upload-${uploadCount}`, img, name: file.name, thumbSrc: url };
      addPhoto(photo);
      const slot = state.panels[selectedPanel];
      if (slot && !slot.photoId) slot.photoId = photo.id;
      render();
    };
    img.src = url;
  }
}

// ---------------------------------------------------------------- presets

// The flattering arrangements the editor opens with and the shot hooks
// export: one per post size, each with its grades mixed across panels.
function applyPreset(kind) {
  if (kind === 'portrait') {
    state.layout = 'cover-star';
    state.size = 'portrait';
    state.panels = [defaultSlot('woman-pink-car', 'vice-sunset')];
  } else if (kind === 'square') {
    state.layout = 'collage-four';
    state.size = 'square';
    state.panels = [
      defaultSlot('man-boardwalk', 'neon-night'),
      defaultSlot('duo-rooftop', 'vice-sunset'),
      defaultSlot('pier', 'neon-night'),
      defaultSlot('boulevard', 'vice-sunset'),
    ];
  } else {
    state.layout = 'panel-grid';
    state.size = 'landscape';
    state.panels = [
      defaultSlot('duo-rooftop', 'ink-poster'),
      defaultSlot('woman-pink-car', 'vice-sunset'),
      defaultSlot('man-boardwalk', 'neon-night'),
      defaultSlot('boulevard', 'vice-sunset'),
      defaultSlot('pier', 'neon-night'),
      defaultSlot('duo-rooftop', 'vice-sunset'),
    ];
  }
  selectedPanel = 0;
}

function snapshotState() {
  return {
    layout: state.layout,
    size: state.size,
    title: state.title,
    tagline: state.tagline,
    caption: state.caption,
    stickers: { ...state.stickers },
    grain: state.grain,
    panels: state.panels.map((slot) => ({ ...slot })),
    selectedPanel,
  };
}

function restoreState(saved) {
  state.layout = saved.layout;
  state.size = saved.size;
  state.title = saved.title;
  state.tagline = saved.tagline;
  state.caption = saved.caption;
  state.stickers = saved.stickers;
  state.grain = saved.grain;
  state.panels = saved.panels;
  selectedPanel = saved.selectedPanel;
}

// ---------------------------------------------------------------- wiring

function buildGradeOptions() {
  for (const select of [gradeSelected, gradeAll]) {
    for (const grade of GRADE_ORDER) {
      const option = document.createElement('option');
      option.value = grade;
      option.textContent = GRADE_LABELS[grade];
      select.append(option);
    }
  }
}

function wireControls() {
  document.querySelectorAll('[data-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.layout = btn.dataset.layout;
      fillEmptyPanels();
      render();
    });
  });
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.size = btn.dataset.size;
      fillEmptyPanels();
      render();
    });
  });

  photoUpload.addEventListener('change', () => {
    handleUploads([...photoUpload.files]);
    photoUpload.value = '';
  });

  gradeSelected.addEventListener('change', () => {
    const slot = state.panels[selectedPanel];
    if (slot) slot.grade = gradeSelected.value;
    render();
  });
  gradeAll.addEventListener('change', () => {
    for (const slot of state.panels) slot.grade = gradeAll.value;
    render();
  });

  const bindText = (input, key) => {
    input.addEventListener('input', () => {
      state[key] = input.value;
      render();
    });
  };
  bindText(titleInput, 'title');
  bindText(taglineInput, 'tagline');
  bindText(captionInput, 'caption');

  const bindSticker = (id, key) => {
    const box = document.getElementById(id);
    box.checked = state.stickers[key];
    box.addEventListener('change', () => {
      state.stickers[key] = box.checked;
      render();
    });
  };
  bindSticker('stickerPalm', 'palm');
  bindSticker('stickerBurst', 'starburst');
  bindSticker('stickerWanted', 'wanted');
  bindSticker('stickerSun', 'sun');

  const grainBox = document.getElementById('grainCheck');
  grainBox.checked = state.grain;
  grainBox.addEventListener('change', () => {
    state.grain = grainBox.checked;
    render();
  });

  zoomSlider.addEventListener('input', () => {
    const slot = state.panels[selectedPanel];
    if (slot) slot.zoom = Number(zoomSlider.value) / 100;
    render();
  });

  document.getElementById('exportBtn').addEventListener('click', async () => {
    const blob = await exportCoverPng(state, state.size);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vice-frame-${state.size}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });

  wireCanvasGestures();
  wireKeyboardNudge();
}

// Arrow keys nudge the selected panel's photo by a hundredth of the
// panel (a twentieth with Shift) — finer control than dragging when a
// face sits almost, but not quite, where it should. Keystrokes aimed at
// a form field are left alone.
function wireKeyboardNudge() {
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  window.addEventListener('keydown', (event) => {
    const step = arrows[event.key];
    if (!step) return;
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;
    const slot = state.panels[selectedPanel];
    if (!slot) return;
    const amount = event.shiftKey ? 0.05 : 0.01;
    slot.panX = clampPan((slot.panX || 0) + step[0] * amount);
    slot.panY = clampPan((slot.panY || 0) + step[1] * amount);
    event.preventDefault();
    render();
  });
}

// Click selects a panel; dragging pans its photo; the wheel zooms it.
function wireCanvasGestures() {
  let drag = null;

  const toCanvasPoint = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const panelAt = (point) => {
    const layout = LAYOUTS[state.layout](canvas.width, canvas.height);
    for (let i = layout.panels.length - 1; i >= 0; i -= 1) {
      const p = layout.panels[i];
      if (point.x >= p.x && point.x <= p.x + p.w && point.y >= p.y && point.y <= p.y + p.h) return i;
    }
    return -1;
  };

  canvas.addEventListener('pointerdown', (event) => {
    const point = toCanvasPoint(event);
    const index = panelAt(point);
    if (index === -1) return;
    selectedPanel = index;
    drag = { lastX: point.x, lastY: point.y };
    canvas.setPointerCapture(event.pointerId);
    render();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const point = toCanvasPoint(event);
    const layout = LAYOUTS[state.layout](canvas.width, canvas.height);
    const panel = layout.panels[selectedPanel];
    const slot = state.panels[selectedPanel];
    if (!panel || !slot) return;
    slot.panX = clampPan((slot.panX || 0) + (point.x - drag.lastX) / panel.w);
    slot.panY = clampPan((slot.panY || 0) + (point.y - drag.lastY) / panel.h);
    drag.lastX = point.x;
    drag.lastY = point.y;
    render();
  });

  const endDrag = () => {
    drag = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const slot = state.panels[selectedPanel];
    if (!slot) return;
    const factor = Math.exp(-event.deltaY * 0.0012);
    slot.zoom = Math.min(4, Math.max(1, (slot.zoom || 1) * factor));
    render();
  }, { passive: false });
}

function clampPan(value) {
  return Math.min(0.6, Math.max(-0.6, value));
}

// ---------------------------------------------------------------- shot hooks

// Render a finished cover for a post size with that size's preset and
// hand it back as a PNG data URL; the editor state is restored after.
window.__exportCover = async (sizeKey) => {
  await document.fonts.ready;
  const saved = snapshotState();
  applyPreset(sizeKey === 'portrait' ? 'portrait' : sizeKey === 'square' ? 'square' : 'landscape');
  const size = SIZES[sizeKey] ?? SIZES.landscape;
  const offscreen = document.createElement('canvas');
  offscreen.width = size.width;
  offscreen.height = size.height;
  renderCover(offscreen.getContext('2d'), state, size.width, size.height);
  const dataUrl = offscreen.toDataURL('image/png');
  restoreState(saved);
  render();
  return dataUrl;
};

// ---------------------------------------------------------------- init

async function init() {
  buildGradeOptions();
  wireControls();
  titleInput.value = state.title;
  taglineInput.value = state.tagline;
  captionInput.value = state.caption;
  await Promise.all(SAMPLE_PHOTOS.map(loadSample));

  const shot = new URLSearchParams(location.search).get('shot');
  if (shot === 'portrait' || shot === 'square') applyPreset(shot);
  else applyPreset('landscape');

  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('40px "Archivo Black"'),
    ]);
  } catch {
    // Fonts fall back to sans-serif; the cover still renders.
  }
  await document.fonts.ready;
  render();
  window.__SHOT_READY = true;
}

init();
