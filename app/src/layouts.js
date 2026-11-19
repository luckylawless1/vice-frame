// Panel layouts for VICE FRAME covers.
//
// Each layout is a function of the canvas size (width, height in pixels)
// returning the panels to fill with photos, the masthead band the title is
// lettered into, and the caption bar band. A panel is { x, y, w, h, rot }
// with rot in degrees. Everything is proportional, so the square, portrait
// and landscape post sizes all stay composed with the same code.

// The masthead and caption bands shared by the multi-panel layouts: the
// title sits in a band above the panels, the caption bar crosses the foot.
function topAndTailBands(width, height) {
  return {
    masthead: { x: width * 0.04, y: height * 0.016, w: width * 0.92, h: height * 0.12 },
    caption: { x: width * 0.09, y: height * 0.898, w: width * 0.82, h: height * 0.064 },
  };
}

export const LAYOUTS = {
  // One full-bleed hero panel: the photo is the whole cover, lettering and
  // the caption bar ride on top of it.
  'cover-star': (width, height) => ({
    panels: [{ x: 0, y: 0, w: width, h: height, rot: 0 }],
    masthead: { x: width * 0.05, y: height * 0.038, w: width * 0.9, h: height * 0.17 },
    caption: { x: width * 0.08, y: height * 0.882, w: width * 0.84, h: height * 0.07 },
  }),

  // One large panel on the left, two stacked panels on the right, and one
  // wide strip along the bottom: a magazine-collage read.
  'collage-four': (width, height) => {
    const left = width * 0.035;
    const right = width * 0.965;
    const top = height * 0.152;
    const stripY = height * 0.648;
    const bottom = height * 0.868;
    const splitX = width * 0.575;
    const gutterX = width * 0.014;
    const stackH = stripY - top;
    return {
      panels: [
        { x: left, y: top, w: splitX - left - gutterX, h: stackH - height * 0.02, rot: 0 },
        { x: splitX + gutterX, y: top, w: right - splitX - gutterX, h: stackH * 0.465, rot: 0 },
        { x: splitX + gutterX, y: top + stackH * 0.535, w: right - splitX - gutterX, h: stackH * 0.465, rot: 0 },
        { x: left, y: stripY, w: right - left, h: bottom - stripY, rot: 0 },
      ],
      ...topAndTailBands(width, height),
    };
  },

  // Six panels in a three-column grid with white frames and slight
  // alternating tilts: the classic multi-panel game cover.
  'panel-grid': (width, height) => {
    const left = width * 0.032;
    const right = width * 0.968;
    const top = height * 0.15;
    const bottom = height * 0.866;
    const gapX = width * 0.017;
    const gapY = height * 0.024;
    const cellW = (right - left - gapX * 2) / 3;
    const cellH = (bottom - top - gapY) / 2;
    const tilts = [-1.1, 0.7, -0.5, 0.6, -0.8, 1.0];
    const panels = [];
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        panels.push({
          x: left + col * (cellW + gapX),
          y: top + row * (cellH + gapY),
          w: cellW,
          h: cellH,
          rot: tilts[row * 3 + col],
        });
      }
    }
    return { panels, ...topAndTailBands(width, height) };
  },

  // One wide cinematic panel across the top and three equal panels under
  // it: the crew lined up beneath their establishing shot.
  'crew-wide': (width, height) => {
    const left = width * 0.035;
    const right = width * 0.965;
    const top = height * 0.152;
    const wideH = height * 0.398;
    const rowY = top + wideH + height * 0.024;
    const rowH = height * 0.866 - rowY;
    const gapX = width * 0.017;
    const cellW = (right - left - gapX * 2) / 3;
    const panels = [{ x: left, y: top, w: right - left, h: wideH, rot: 0 }];
    for (let col = 0; col < 3; col += 1) {
      panels.push({ x: left + col * (cellW + gapX), y: rowY, w: cellW, h: rowH, rot: 0 });
    }
    return { panels, ...topAndTailBands(width, height) };
  },
};

// The layout names in the order the editor lists them.
export const LAYOUT_ORDER = ['cover-star', 'collage-four', 'panel-grid', 'crew-wide'];

// Panels of a layout at a given size, for hit-testing and slot counting.
export function layoutPanels(layoutName, width, height) {
  const layout = LAYOUTS[layoutName] ?? LAYOUTS['panel-grid'];
  return layout(width, height).panels;
}
