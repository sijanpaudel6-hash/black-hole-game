// Feed Your Hometown: draws Earth as seen from space, turned so a chosen city faces you
// (orthographic projection of Natural Earth's land outlines), into a Phaser canvas texture.

const RAD = Math.PI / 180;

/**
 * Project lon/lat onto a globe centred on (lon0, lat0).
 * @returns {{x:number, y:number, front:boolean}} x, y in −1…1
 */
export function project(lon, lat, lon0, lat0) {
  const l = (lon - lon0) * RAD;
  const p = lat * RAD;
  const p0 = lat0 * RAD;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return {
    x: Math.cos(p) * Math.sin(l),
    y: -(Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)),
    front: cosc >= 0,
  };
}

/**
 * Draw the globe into a canvas texture.
 * @param {Phaser.Scene} scene
 * @param {string} key texture key (replaced if it exists)
 * @param {number[][]} land flat [lon, lat, …] polygons (src/data/land.js)
 * @param {number} lon0 centre longitude
 * @param {number} lat0 centre latitude
 * @param {number} size texture size in px
 */
export function drawGlobeTexture(scene, key, land, lon0, lat0, size = 512) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const pad = Math.round(size * 0.08);
  const S = size + pad * 2;
  const tex = scene.textures.createCanvas(key, S, S);
  const ctx = tex.getContext();
  const R = size / 2;
  const cx = S / 2;
  const cy = S / 2;

  // Atmosphere glow
  const atm = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.15);
  atm.addColorStop(0, 'rgba(127,180,255,0.55)');
  atm.addColorStop(1, 'rgba(127,180,255,0)');
  ctx.fillStyle = atm;
  ctx.fillRect(0, 0, S, S);

  // Ocean
  const sea = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
  sea.addColorStop(0, '#4f8fe0');
  sea.addColorStop(0.7, '#2a5fb0');
  sea.addColorStop(1, '#173a78');
  ctx.fillStyle = sea;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  // Land: project each ring; points on the far side are pushed to the rim so shapes stay closed.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#5d9b4a';
  ctx.strokeStyle = 'rgba(30,60,25,0.5)';
  ctx.lineWidth = Math.max(1, size / 400);
  for (const poly of land) {
    let any = false;
    ctx.beginPath();
    for (let i = 0; i < poly.length; i += 2) {
      const p = project(poly[i], poly[i + 1], lon0, lat0);
      let { x, y } = p;
      if (!p.front) {
        const len = Math.hypot(x, y) || 1;
        x /= len;
        y /= len;
      } else any = true;
      const px = cx + x * R;
      const py = cy + y * R;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (any) {
      ctx.fill();
      ctx.stroke();
    }
  }
  // Ice caps: the polar circles (above 72°), projected like the land.
  ctx.fillStyle = 'rgba(240,246,255,0.9)';
  for (const sign of [1, -1]) {
    ctx.beginPath();
    let any = false;
    for (let lon = -180; lon <= 180; lon += 6) {
      const p = project(lon, 72 * sign, lon0, lat0);
      let { x, y } = p;
      if (!p.front) {
        const len = Math.hypot(x, y) || 1;
        x /= len;
        y /= len;
      } else any = true;
      if (lon === -180) ctx.moveTo(cx + x * R, cy + y * R);
      else ctx.lineTo(cx + x * R, cy + y * R);
    }
    ctx.closePath();
    // The cap is the side of the circle that contains the pole.
    const pole = project(0, 90 * sign, lon0, lat0);
    if (any || pole.front) ctx.fill('evenodd');
  }
  // Night-side shading
  const shade = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.2, cx, cy, R * 1.05);
  shade.addColorStop(0, 'rgba(255,255,255,0.10)');
  shade.addColorStop(0.6, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();
  tex.refresh();
  return { key, radius: R, size: S };
}
