import Phaser from 'phaser';
import { GAME, COLORS, WORLD, CAMERA, STARFIELD } from '../config.js';
import BlackHole from '../objects/BlackHole.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.createStarfield();
    this.drawWorldEdge();

    this.blackHole = new BlackHole(this, 0, 0);

    const cam = this.cameras.main;
    cam.setBackgroundColor(COLORS.void);
    cam.centerOn(0, 0);
    cam.startFollow(this.blackHole, false, CAMERA.lerp, CAMERA.lerp);

    this.input.mouse?.disableContextMenu();
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    }
  }

  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, GAME.maxFrameDelta);

    this.blackHole.move(dt, this.getPointerTarget(), this.getKeyboardDirection());
    this.updateStarfield();
  }

  // World point under the finger/mouse while it is held down, else null.
  // Recomputed every frame because the camera moves under a still finger.
  getPointerTarget() {
    const pointer = this.input.activePointer;
    if (!pointer.isDown) return null;
    return this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }

  getKeyboardDirection() {
    if (!this.cursors) return null;
    const c = this.cursors;
    const k = this.wasd;
    const x = (c.right.isDown || k.D.isDown ? 1 : 0) - (c.left.isDown || k.A.isDown ? 1 : 0);
    const y = (c.down.isDown || k.S.isDown ? 1 : 0) - (c.up.isDown || k.W.isDown ? 1 : 0);
    return x === 0 && y === 0 ? null : { x, y };
  }

  // ---- Starfield --------------------------------------------------------

  // Each layer is a seamless tiling star texture on a screen-sized TileSprite.
  // Scrolling the tile offset by a fraction of the camera scroll gives parallax.
  createStarfield() {
    const size = STARFIELD.tileSize;
    this.starLayers = STARFIELD.layers.map((layer, i) => {
      const key = `stars-${i}`;
      if (!this.textures.exists(key)) this.paintStarTexture(key, size, layer);
      const sprite = this.add
        .tileSprite(0, 0, GAME.width, GAME.height, key)
        .setOrigin(0, 0)
        .setScrollFactor(0);
      return { sprite, scrollFactor: layer.scrollFactor };
    });
  }

  paintStarTexture(key, size, layer) {
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();
    const amber = '255, 154, 77';
    const white = '237, 234, 228';
    for (let n = 0; n < layer.count; n++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Phaser.Math.FloatBetween(layer.minRadius, layer.maxRadius);
      const a = Phaser.Math.FloatBetween(layer.minAlpha, layer.maxAlpha);
      ctx.fillStyle = `rgba(${Math.random() < STARFIELD.amberShare ? amber : white}, ${a})`;
      // Draw wrapped copies near the edges so the tile repeats without seams.
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

  updateStarfield() {
    const cam = this.cameras.main;
    for (const { sprite, scrollFactor } of this.starLayers) {
      sprite.tilePositionX = cam.scrollX * scrollFactor;
      sprite.tilePositionY = cam.scrollY * scrollFactor;
    }
  }

  // Thin hairline ring marking the edge of the circular play area.
  drawWorldEdge() {
    this.add
      .graphics()
      .lineStyle(WORLD.edgeLineWidth, COLORS.hairline, WORLD.edgeLineAlpha)
      .strokeCircle(0, 0, WORLD.radius);
  }
}
