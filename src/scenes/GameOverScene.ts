import Phaser from 'phaser';
import { hu } from '../i18n/hu';

export interface GameOverData {
  victory: boolean;
  durationMs: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;

    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0, 0);

    this.add
      .text(width / 2, height / 2 - 120, data.victory ? hu.gameOver.victoryTitle : hu.gameOver.defeatTitle, {
        fontFamily: 'system-ui',
        fontSize: '64px',
        color: data.victory ? '#8bc34a' : '#d04a4a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 40, data.victory ? hu.gameOver.victoryBody : hu.gameOver.defeatBody, {
        fontFamily: 'system-ui',
        fontSize: '18px',
        color: '#c9c2a6',
      })
      .setOrigin(0.5);

    const minutes = Math.floor(data.durationMs / 60000);
    const seconds = Math.floor((data.durationMs % 60000) / 1000);
    this.add
      .text(
        width / 2,
        height / 2 + 20,
        `${hu.gameOver.durationLabel}: ${minutes}:${seconds.toString().padStart(2, '0')}`,
        {
          fontFamily: 'system-ui',
          fontSize: '16px',
          color: '#9a9a9a',
        },
      )
      .setOrigin(0.5);

    this.createMenuButton(width / 2, height / 2 + 90, hu.gameOver.backToMenu, () => {
      this.scene.stop('GameScene');
      this.scene.stop('HUDScene');
      this.scene.start('MainMenuScene');
    });
  }

  private createMenuButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const bg = this.add
      .rectangle(0, 0, 280, 44, 0x333840, 1)
      .setStrokeStyle(2, 0x8bc34a);
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
}
