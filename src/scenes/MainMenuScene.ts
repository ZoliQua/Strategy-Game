import Phaser from 'phaser';
import { hu } from '../i18n/hu';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 140, hu.title, {
        fontFamily: 'system-ui',
        fontSize: '72px',
        color: '#f5e7a3',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 70, hu.subtitle, {
        fontFamily: 'system-ui',
        fontSize: '20px',
        color: '#c9c2a6',
      })
      .setOrigin(0.5);

    this.createMenuButton(width / 2, height / 2 + 20, hu.menu.newGame, () =>
      this.scene.start('GameScene'),
    );
    this.createDisabledButton(
      width / 2,
      height / 2 + 80,
      hu.menu.loadGame,
    );
    this.createDisabledButton(
      width / 2,
      height / 2 + 140,
      hu.menu.settings,
    );
  }

  private createMenuButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, 280, 44, 0x333840, 1).setStrokeStyle(2, 0x8bc34a);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: 'system-ui',
        fontSize: '20px',
        color: '#eeeeee',
      })
      .setOrigin(0.5);
    const container = this.add.container(x, y, [bg, text]);
    container.setSize(280, 44);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(0x444b55));
    container.on('pointerout', () => bg.setFillStyle(0x333840));
    container.on('pointerdown', onClick);
    return container;
  }

  private createDisabledButton(
    x: number,
    y: number,
    label: string,
  ): Phaser.GameObjects.Container {
    const bg = this.add
      .rectangle(0, 0, 280, 44, 0x222529, 1)
      .setStrokeStyle(1, 0x4a4a4a);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: 'system-ui',
        fontSize: '20px',
        color: '#666666',
      })
      .setOrigin(0.5);
    return this.add.container(x, y, [bg, text]);
  }
}
