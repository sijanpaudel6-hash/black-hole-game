import Phaser from 'phaser';
import { GAME, COLORS } from './config.js';
import GameScene from './scenes/GameScene.js';

// Phaser game setup: WebGL, portrait 720×1280 design size, scaled to fit and
// letterboxed on wide screens.
const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: GAME.width,
  height: GAME.height,
  backgroundColor: COLORS.voidCss,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    powerPreference: 'high-performance',
  },
  scene: [GameScene],
});

export default game;
