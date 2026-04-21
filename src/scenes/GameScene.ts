import Phaser from 'phaser';
import { hu } from '../i18n/hu';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, 40, hu.game.sceneActive, {
        fontFamily: 'system-ui',
        fontSize: '22px',
        color: '#c9c2a6',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height - 30, hu.game.hint, {
        fontFamily: 'system-ui',
        fontSize: '14px',
        color: '#777777',
      })
      .setOrigin(0.5);
  }
}
