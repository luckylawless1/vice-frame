// The VICE FRAME cover renderer: paints a full cover from editor state —
// graded photo panels with white frames, the gradient masthead, the pink
// caption bar, stickers, grain and a vignette — at any of the post sizes.

import { LAYOUTS } from './layouts.js';
import { gradedPhoto } from './effects.js';
import { drawPalmTree, drawStarburst, drawSunDisc, drawWantedStars, wantedStarsWidth } from './stickers.js';

export const SIZES = {
  square: { width: 1080, height: 1080, label: 'Square 1080x1080' },
  portrait: { width: 1080, height: 1350, label: 'Portrait 1080x1350' },
  landscape: { width: 1920, height: 1080, label: 'Landscape 1920x1080' },
};

const WANTED_STAR_COUNT = 5;
const STARBURST_TEXT = 'NEW!';

let noiseTile = null;

// A small tile of random grey noise, generated once and repeated as a
// pattern whenever the film grain option is on.
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const imageData = tctx.createImageData(140, 140);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.floor(Math.random() * 256);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  tctx.putImageData(imageData, 0, 0);
  noiseTile = tile;
  return tile;
}

// Where a photo lands inside its panel: cover-fit scaled by the panel's
// zoom, centred, then shifted by the panel's pan (fractions of the panel).
function coverFitRect(img, panel, slot) {
  const zoom = slot.zoom || 1;
  const scale = Math.max(panel.w / img.naturalWidth, panel.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  return {
    dx: panel.x + (panel.w - dw) / 2 + (slot.panX || 0) * panel.w,
    dy: panel.y + (panel.h - dh) / 2 + (slot.panY || 0) * panel.h,
    dw,
    dh,
  };
}

function drawPanel(ctx, state, panel, slot, unit) {
  const border = Math.max(3, unit * 0.009);
  ctx.save();
  ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
  ctx.rotate(((panel.rot || 0) * Math.PI) / 180);
  ctx.translate(-(panel.x + panel.w / 2), -(panel.y + panel.h / 2));

  // White frame with a soft drop shadow.
  ctx.shadowColor = 'rgba(2, 0, 12, 0.55)';
  ctx.shadowBlur = unit * 0.028;
  ctx.shadowOffsetY = unit * 0.012;
  ctx.fillStyle = '#f5f2ea';
  ctx.fillRect(panel.x - border, panel.y - border, panel.w + border * 2, panel.h + border * 2);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.beginPath();
  ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.clip();

  const photo = slot && slot.photoId ? state.photoById[slot.photoId] : null;
  if (photo) {
    const fit = coverFitRect(photo.img, panel, slot);
    const graded = gradedPhoto(photo, slot.grade || 'clean', fit.dw, fit.dh);
    ctx.drawImage(graded, fit.dx, fit.dy, fit.dw, fit.dh);
  } else {
    // Empty slot: dark glass with a quiet invitation, visible only while
    // editing, since exported covers are made from filled layouts.
    ctx.fillStyle = '#1b1440';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = unit * 0.012;
    const step = unit * 0.09;
    ctx.beginPath();
    for (let x = panel.x - panel.h; x < panel.x + panel.w; x += step) {
      ctx.moveTo(x, panel.y + panel.h);
      ctx.lineTo(x + panel.h, panel.y);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.font = `${Math.max(13, unit * 0.028)}px "Archivo Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', panel.x + panel.w / 2, panel.y + panel.h / 2);
  }
  ctx.restore();
}

// The masthead: the title in Anton, filled with a pink-to-teal gradient
// and a heavy dark outline, tilted a couple of degrees; the tagline in
// letter-spaced Archivo Black beneath it.
function drawMasthead(ctx, state, box) {
  const title = (state.title || '').trim();
  const tagline = (state.tagline || '').trim();
  if (!title && !tagline) return;
  ctx.save();
  ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (title) {
    let size = box.h * (tagline ? 0.78 : 0.95);
    const setFont = () => {
      ctx.font = `${size}px Anton, "Archivo Black", sans-serif`;
    };
    setFont();
    const text = title.toUpperCase();
    const measured = ctx.measureText(text).width;
    const maxW = box.w * 0.99;
    if (measured > maxW) {
      size *= maxW / measured;
      setFont();
    }
    const gradient = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
    gradient.addColorStop(0, '#ff5da2');
    gradient.addColorStop(0.55, '#c86bff');
    gradient.addColorStop(1, '#2ee6c8');
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0a0a1c';
    ctx.lineWidth = size * 0.15;
    ctx.strokeText(text, 0, tagline ? -box.h * 0.1 : 0);
    ctx.fillStyle = gradient;
    ctx.fillText(text, 0, tagline ? -box.h * 0.1 : 0);
  }
  if (tagline) {
    const size = Math.max(13, box.h * 0.19);
    ctx.font = `${size}px "Archivo Black", sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * 0.3}px`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = size * 0.35;
    ctx.shadowOffsetY = size * 0.1;
    ctx.fillStyle = '#fdf7ff';
    ctx.fillText(tagline.toUpperCase(), 0, box.h * 0.36);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  ctx.restore();
}

// The caption: a bold Archivo Black line on a tilted pink bar across the
// foot of the cover.
function drawCaptionBar(ctx, state, box) {
  const caption = (state.caption || '').trim();
  if (!caption) return;
  ctx.save();
  ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
  ctx.rotate((-1 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(2, 0, 12, 0.5)';
  ctx.shadowBlur = box.h * 0.3;
  ctx.shadowOffsetY = box.h * 0.1;
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.roundRect(-box.w / 2, -box.h / 2, box.w, box.h, box.h * 0.2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  let size = box.h * 0.5;
  const setFont = () => {
    ctx.font = `${size}px "Archivo Black", sans-serif`;
  };
  setFont();
  const text = caption.toUpperCase();
  const measured = ctx.measureText(text).width;
  const maxW = box.w * 0.94;
  if (measured > maxW) {
    size *= maxW / measured;
    setFont();
  }
  ctx.fillStyle = '#160a2e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.05);
  ctx.restore();
}

// Paint the whole cover. options.selectedIndex, when given, outlines that
// panel in teal — the editor passes it, exports never do.
export function renderCover(ctx, state, width, height, options = {}) {
  const layout = LAYOUTS[state.layout](width, height);
  const unit = Math.min(width, height);

  // Deep navy-to-purple ground with a warm glow at the top.
  const ground = ctx.createLinearGradient(0, 0, 0, height);
  ground.addColorStop(0, '#131a3e');
  ground.addColorStop(0.55, '#2a1052');
  ground.addColorStop(1, '#0a0618');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width / 2, -height * 0.25, 0, width / 2, -height * 0.25, height * 0.95);
  glow.addColorStop(0, 'rgba(255, 93, 162, 0.28)');
  glow.addColorStop(1, 'rgba(255, 93, 162, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  layout.panels.forEach((panel, index) => {
    drawPanel(ctx, state, panel, state.panels[index], unit);
  });

  drawMasthead(ctx, state, layout.masthead);
  drawCaptionBar(ctx, state, layout.caption);

  // Stickers, each in its corner of the poster.
  if (state.stickers.sun) {
    drawSunDisc(ctx, width * 0.948, height * 0.93, unit * 0.06);
  }
  if (state.stickers.palm) {
    drawPalmTree(ctx, width * 0.014, height * 0.997, height * 0.21, '#12082b');
  }
  if (state.stickers.starburst && layout.panels.length > 0) {
    const first = layout.panels[0];
    drawStarburst(ctx, first.x + unit * 0.015, first.y + unit * 0.015, unit * 0.052, STARBURST_TEXT);
  }
  if (state.stickers.wanted) {
    const starSize = unit * 0.026;
    const rowWidth = wantedStarsWidth(starSize, WANTED_STAR_COUNT);
    drawWantedStars(ctx, width - rowWidth - width * 0.02, height * 0.042, starSize, WANTED_STAR_COUNT);
  }

  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = ctx.createPattern(getNoiseTile(), 'repeat');
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // Vignette to seat the edges.
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.78,
  );
  vignette.addColorStop(0, 'rgba(4, 2, 10, 0)');
  vignette.addColorStop(1, 'rgba(4, 2, 10, 0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  if (options.selectedIndex != null) {
    const panel = layout.panels[options.selectedIndex];
    if (panel) {
      ctx.save();
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(((panel.rot || 0) * Math.PI) / 180);
      ctx.strokeStyle = '#2ee6c8';
      ctx.lineWidth = Math.max(2, unit * 0.006);
      ctx.setLineDash([unit * 0.02, unit * 0.012]);
      ctx.strokeRect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
      ctx.restore();
    }
  }
}

// Render the current state at a post size and hand back the PNG blob.
export function exportCoverPng(state, sizeKey) {
  const size = SIZES[sizeKey] ?? SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  renderCover(canvas.getContext('2d'), state, size.width, size.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))),
      'image/png',
    );
  });
}
