import Phaser from 'phaser';
import { generatePlaceholderTextures } from '../iso/textures';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(
      width / 2,
      height / 2,
      420,
      28,
      0x222222,
    );
    const bar = this.add.rectangle(
      width / 2 - 208,
      height / 2,
      4,
      20,
      0x8bc34a,
    ).setOrigin(0, 0.5);
    this.add
      .text(width / 2, height / 2 - 40, 'Betöltés…', {
        fontFamily: 'system-ui',
        fontSize: '20px',
        color: '#eeeeee',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 4 + 412 * value;
    });
    this.load.on('complete', () => {
      barBg.destroy();
      bar.destroy();
    });
  }

  create(): void {
    generatePlaceholderTextures(this);
    this.time.delayedCall(600, () => this.scene.start('MainMenuScene'));
  }
}
