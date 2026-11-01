import Phaser from 'phaser';
import { COLORS, HUD } from '../config.js';

/**
 * HUD drawn over GameScene. Session 2: the mass counter only.
 * Drawn inside the canvas (not HTML) so it will show up in recorded clips later.
 * Styled HUD panels come in Session 6.
 */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const x = HUD.margin;
    let y = HUD.margin;

    this.add
      .text(x, y, 'MASS', {
        fontFamily: HUD.fontMono,
        fontSize: `${HUD.labelSize}px`,
        color: COLORS.textMutedCss,
      })
      .setLetterSpacing(HUD.labelSpacing);
    y += HUD.labelSize * 1.3;

    this.massText = this.add.text(x, y, '', {
      fontFamily: HUD.fontMono,
      fontSize: `${HUD.metricSize}px`,
      fontStyle: 'bold',
      color: COLORS.textCss,
    });

    this.showMass(this.registry.get('mass') ?? 0);
    this.registry.events.on('changedata-mass', this.onMassChanged, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off('changedata-mass', this.onMassChanged, this);
    });
  }

  onMassChanged(_parent, value) {
    this.showMass(value);
  }

  showMass(mass) {
    this.massText.setText(Math.floor(mass).toLocaleString('en-US'));
  }
}
