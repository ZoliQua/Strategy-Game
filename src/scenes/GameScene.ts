import Phaser from 'phaser';
import { DEFAULT_MAP_SIZE } from '../config/constants';
import { hu } from '../i18n/hu';
import { TileMap } from '../map/TileMap';
import { CameraController } from './systems/CameraController';

export class GameScene extends Phaser.Scene {
  private tileMap!: TileMap;
  private cameraController!: CameraController;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0d1016');

    this.tileMap = new TileMap(this, {
      width: DEFAULT_MAP_SIZE,
      height: DEFAULT_MAP_SIZE,
    });

    const bounds = this.tileMap.getWorldBounds();
    const padding = 200;
    this.cameras.main.setBounds(
      bounds.minX - padding,
      bounds.minY - padding,
      bounds.maxX - bounds.minX + padding * 2,
      bounds.maxY - bounds.minY + padding * 2,
    );

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    this.cameras.main.centerOn(centerX, centerY);

    this.cameraController = new CameraController(this);
    this.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);

    this.createOverlayText();
  }

  private onUpdate(_time: number, delta: number): void {
    this.cameraController.update(delta);
  }

  private createOverlayText(): void {
    const { width, height } = this.scale;
    const sceneActive = this.add
      .text(width / 2, 20, hu.game.sceneActive, {
        fontFamily: 'system-ui',
        fontSize: '18px',
        color: '#c9c2a6',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10_000);
    const hint = this.add
      .text(width / 2, height - 24, hu.game.hint, {
        fontFamily: 'system-ui',
        fontSize: '13px',
        color: '#7e7a6b',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(10_000);

    // Avoid unused lint noise; these objects live for the scene's lifetime.
    void sceneActive;
    void hint;
  }
}
