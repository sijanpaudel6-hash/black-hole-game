import Phaser from 'phaser';
import { GAME, STARFIELD, LOW_GRAPHICS } from '../config.js';

/**
 * Parallax starfield: each layer is a seamless tiling star texture on a screen-sized
 * TileSprite fixed to the camera. Scrolling the tile offset by a fraction of the camera
 * scroll gives parallax. The sprite is counter-scaled so camera zoom never uncovers edges.
 */
export default class Starfield {
  constructor(scene, low = false) {
    this.scene = scene;
    const size = STARFIELD.tileSize;
    this.layers = STARFIELD.layers.map((layer, i) => {
      const key = `stars-${i}`;
      if (!scene.textures.exists(key)) paintStarTexture(scene, key, size, layer);
      const sprite = scene.add
        .tileSprite(GAME.width / 2, GAME.height / 2, GAME.width, GAME.height, key)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(0);
      return { sprite, scrollFactor: layer.scrollFactor };
    });
    this.setLow(low);
  }

  setLow(low) {
    this.layers.forEach((l, i) => l.sprite.setVisible(!low || i < LOW_GRAPHICS.starLayers));
  }

  /** Call once per frame. `drift` adds a slow sideways float (screen px per frame). */
  update(cam = this.scene.cameras.main, drift = 0) {
    const z = cam.zoom;
    const cx = cam.scrollX + cam.width / 2;
    const cy = cam.scrollY + cam.height / 2;
    if (this.lastX === undefined) {
      this.lastX = cx;
      this.lastY = cy;
    }
    // Move by how far the camera moved on screen, so zooming never slides the stars.
    const dx = (cx - this.lastX) * z;
    const dy = (cy - this.lastY) * z;
    this.lastX = cx;
    this.lastY = cy;
    for (const { sprite, scrollFactor } of this.layers) {
      sprite.setScale(1 / z);
      sprite.tilePositionX += (dx + drift) * scrollFactor;
      sprite.tilePositionY += dy * scrollFactor;
    }
  }

  /** Forget the last camera position (after a teleport). */
  resetTracking() {
    this.lastX = undefined;
  }
}

function paintStarTexture(scene, key, size, layer) {
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const amber = '255, 154, 77';
  const white = '237, 234, 228';
  for (let n = 0; n < layer.count; n++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Phaser.Math.FloatBetween(layer.minRadius, layer.maxRadius);
    const a = Phaser.Math.FloatBetween(layer.minAlpha, layer.maxAlpha);
    ctx.fillStyle = `rgba(${Math.random() < STARFIELD.amberShare ? amber : white}, ${a})`;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const px = x + ox;
        const py = y + oy;
        if (px < -r || px > size + r || py < -r || py > size + r) continue;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  tex.refresh();
}
