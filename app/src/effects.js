// Photo grades for VICE FRAME.
//
// Each grade turns a source photo into a processed offscreen canvas at a
// requested size. Processed canvases are cached in a Map keyed by photo
// id, grade and rounded dimensions, so panning, lettering and re-renders
// never pay the per-pixel cost twice.

export const GRADE_ORDER = ['clean', 'vice-sunset', 'neon-night', 'ink-poster'];

export const GRADE_LABELS = {
  clean: 'Clean',
  'vice-sunset': 'Vice Sunset',
  'neon-night': 'Neon Night',
  'ink-poster': 'Ink Poster',
};

const gradeCache = new Map();

function clampByte(value) {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// Colour stops for the gradient-map grades: [luminance, [r, g, b]] pairs.
const SUNSET_STOPS = [
  [0.0, [24, 7, 48]],
  [0.35, [110, 24, 104]],
  [0.6, [226, 72, 110]],
  [0.82, [246, 143, 60]],
  [1.0, [255, 216, 130]],
];

const NEON_STOPS = [
  [0.0, [3, 44, 54]],
  [0.4, [10, 96, 110]],
  [0.65, [146, 54, 140]],
  [1.0, [255, 120, 180]],
];

function gradientMapColor(stops, t) {
  for (let i = 1; i < stops.length; i += 1) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const f = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      return [
        c0[0] + (c1[0] - c0[0]) * f,
        c0[1] + (c1[1] - c0[1]) * f,
        c0[2] + (c1[2] - c0[2]) * f,
      ];
    }
  }
  return stops[stops.length - 1][1];
}

// Shared finish for the photographic grades: saturation around the pixel's
// own average, then a contrast S-curve around mid-grey.
function finishPixel(data, i, saturation, contrast) {
  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
  for (let c = 0; c < 3; c += 1) {
    let v = avg + (data[i + c] - avg) * saturation;
    v = (v - 128) * contrast + 128;
    data[i + c] = clampByte(v);
  }
}

function passClean(data) {
  for (let i = 0; i < data.length; i += 4) finishPixel(data, i, 1.18, 1.07);
}

function passGradientMap(data, stops, mix, saturation, contrast) {
  for (let i = 0; i < data.length; i += 4) {
    const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    const mapped = gradientMapColor(stops, lum);
    data[i] = data[i] * (1 - mix) + mapped[0] * mix;
    data[i + 1] = data[i + 1] * (1 - mix) + mapped[1] * mix;
    data[i + 2] = data[i + 2] * (1 - mix) + mapped[2] * mix;
    finishPixel(data, i, saturation, contrast);
  }
}

// Ink Poster: saturate, posterize to a handful of levels per channel, then
// darken along luminance edges so the photo reads as printed illustration.
function passInkPoster(data, width, height) {
  const levels = 5;
  const luminance = new Float32Array(width * height);
  for (let p = 0, i = 0; p < luminance.length; p += 1, i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    for (let c = 0; c < 3; c += 1) {
      let v = avg + (data[i + c] - avg) * 1.32;
      v = Math.round((v / 255) * (levels - 1)) / (levels - 1);
      data[i + c] = clampByte(v * 255);
    }
    luminance[p] = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  const ink = [16, 13, 30];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = y * width + x;
      const right = x + 1 < width ? luminance[p + 1] : luminance[p];
      const below = y + 1 < height ? luminance[p + width] : luminance[p];
      const edge = Math.max(Math.abs(right - luminance[p]), Math.abs(below - luminance[p]));
      if (edge > 34) {
        const f = Math.min(0.82, (edge - 34) / 110);
        const i = p * 4;
        data[i] = data[i] * (1 - f) + ink[0] * f;
        data[i + 1] = data[i + 1] * (1 - f) + ink[1] * f;
        data[i + 2] = data[i + 2] * (1 - f) + ink[2] * f;
      }
    }
  }
}

// A faint halftone dot screen, laid over ink-graded panels so they feel
// like ink on paper rather than a photograph.
export function drawHalftoneDots(ctx, width, height) {
  const spacing = 8;
  const radius = 1.6;
  ctx.save();
  ctx.fillStyle = 'rgba(12, 8, 24, 0.10)';
  let row = 0;
  for (let y = spacing / 2; y < height; y += spacing, row += 1) {
    const offset = row % 2 === 0 ? 0 : spacing / 2;
    for (let x = offset + spacing / 2; x < width; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// The graded canvas for a photo at a drawn size. The photo is drawn
// stretched to exactly width x height; the caller computes those from its
// cover-fit, so the aspect is already right and nothing is distorted.
export function gradedPhoto(photo, grade, width, height) {
  const w = Math.max(2, Math.round(width));
  const h = Math.max(2, Math.round(height));
  const key = `${photo.id}|${grade}|${w}x${h}`;
  const cached = gradeCache.get(key);
  if (cached) return cached;

  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(photo.img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  if (grade === 'vice-sunset') passGradientMap(data, SUNSET_STOPS, 0.58, 1.12, 1.06);
  else if (grade === 'neon-night') passGradientMap(data, NEON_STOPS, 0.5, 1.18, 1.12);
  else if (grade === 'ink-poster') passInkPoster(data, w, h);
  else passClean(data);
  ctx.putImageData(imageData, 0, 0);
  if (grade === 'ink-poster') drawHalftoneDots(ctx, w, h);

  gradeCache.set(key, canvas);
  return canvas;
}
