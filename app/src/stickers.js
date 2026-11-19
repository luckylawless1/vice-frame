// Original stickers for VICE FRAME covers, drawn from canvas paths only:
// a palm silhouette, a spiky starburst badge, a retro striped sun and a
// row of wanted stars. Nothing here is traced or copied from any game.

function starPath(ctx, cx, cy, outerRadius, innerRadius, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// A leaning palm: tapered curved trunk, a fan of drooping fronds and two
// coconuts. (x, y) is the base of the trunk, size is the tree's height.
export function drawPalmTree(ctx, x, y, size, color) {
  const crownX = x + size * 0.17;
  const crownY = y - size * 0.97;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';

  // Trunk: two quadratic edges meeting at the crown, filled as one shape.
  ctx.beginPath();
  ctx.moveTo(x - size * 0.05, y);
  ctx.quadraticCurveTo(x + size * 0.02, y - size * 0.55, crownX - size * 0.028, crownY + size * 0.05);
  ctx.lineTo(crownX + size * 0.028, crownY + size * 0.05);
  ctx.quadraticCurveTo(x + size * 0.1, y - size * 0.55, x + size * 0.05, y);
  ctx.closePath();
  ctx.fill();

  // Fronds: arcs fanning up and out of the crown, each drooping at the tip.
  const fronds = [
    { angle: -2.85, length: 0.52, droop: 0.16 },
    { angle: -2.35, length: 0.6, droop: 0.2 },
    { angle: -1.85, length: 0.62, droop: 0.24 },
    { angle: -1.35, length: 0.6, droop: 0.26 },
    { angle: -0.85, length: 0.56, droop: 0.24 },
    { angle: -0.4, length: 0.46, droop: 0.18 },
  ];
  ctx.lineWidth = size * 0.032;
  for (const frond of fronds) {
    const endX = crownX + Math.cos(frond.angle) * size * frond.length;
    const endY = crownY + Math.sin(frond.angle) * size * frond.length + size * frond.droop;
    const midX = crownX + Math.cos(frond.angle) * size * frond.length * 0.55;
    const midY = crownY + Math.sin(frond.angle) * size * frond.length * 0.55 - size * 0.05;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
  }

  // Coconuts tucked under the crown.
  for (const dx of [-0.035, 0.04]) {
    ctx.beginPath();
    ctx.arc(crownX + size * dx, crownY + size * 0.045, size * 0.032, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// A spiky round badge with short text in the middle, tilted like a price
// sticker slapped on the corner of a poster.
export function drawStarburst(ctx, cx, cy, radius, text) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-10 * (Math.PI / 180));
  const spikes = 14;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 === 0 ? radius : radius * 0.78;
    const angle = (i * Math.PI) / spikes;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffc93c';
  ctx.fill();
  ctx.lineWidth = radius * 0.07;
  ctx.strokeStyle = '#160a2e';
  ctx.stroke();
  ctx.fillStyle = '#160a2e';
  ctx.font = `${radius * 0.52}px "Archivo Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, radius * 0.04);
  ctx.restore();
}

// A retro sun disc: a pink-to-gold gradient circle whose lower half is
// cut into horizontal stripes. Rendered on its own small canvas first, so
// the stripes erase to transparency instead of painting over the cover.
export function drawSunDisc(ctx, cx, cy, radius) {
  const size = Math.ceil(radius * 2);
  const disc = document.createElement('canvas');
  disc.width = size;
  disc.height = size;
  const dctx = disc.getContext('2d');
  dctx.beginPath();
  dctx.arc(radius, radius, radius, 0, Math.PI * 2);
  dctx.clip();
  const gradient = dctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#ffd319');
  gradient.addColorStop(0.55, '#ff2975');
  gradient.addColorStop(1, '#8c1eff');
  dctx.fillStyle = gradient;
  dctx.fillRect(0, 0, size, size);
  dctx.globalCompositeOperation = 'destination-out';
  let stripeY = radius * 1.02;
  let stripeH = radius * 0.045;
  while (stripeY < size) {
    dctx.fillRect(0, stripeY, size, stripeH);
    stripeY += stripeH + radius * 0.14;
    stripeH *= 1.45;
  }
  dctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(disc, cx - radius, cy - radius);
}

// A row of wanted stars: `count` gold stars (1 to 5), drawn left to right
// from (x, y) as the row's left-centre, each star `size` in outer radius.
export function drawWantedStars(ctx, x, y, size, count, color = '#ffc93c') {
  const n = Math.max(1, Math.min(5, Math.round(count)));
  ctx.save();
  for (let i = 0; i < n; i += 1) {
    const cx = x + size + i * size * 2.45;
    starPath(ctx, cx, y, size, size * 0.48);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = size * 0.14;
    ctx.strokeStyle = '#160a2e';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

// Total width of a wanted-stars row, so callers can right-align it.
export function wantedStarsWidth(size, count) {
  const n = Math.max(1, Math.min(5, Math.round(count)));
  return size * 2 + (n - 1) * size * 2.45;
}
