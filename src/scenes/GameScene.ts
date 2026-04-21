import Phaser from 'phaser';
import { DEFAULT_MAP_SIZE } from '../config/constants';
import { createVillager } from '../ecs/archetypes/villager';
import { MoveIntentSystem } from '../ecs/systems/MoveIntentSystem';
import { RenderSystem } from '../ecs/systems/RenderSystem';
import { SelectionSystem } from '../ecs/systems/SelectionSystem';
import { createEcsWorld, type EcsWorld } from '../ecs/world';
import type { TileCoord } from '../iso/coordinates';
import { tileEquals } from '../iso/coordinates';
import { pickTile } from '../iso/picking';
import { hu } from '../i18n/hu';
import { TileMap } from '../map/TileMap';
import { CameraController } from './systems/CameraController';

export class GameScene extends Phaser.Scene {
  private tileMap!: TileMap;
  private cameraController!: CameraController;
  private world!: EcsWorld;
  private renderSystem!: RenderSystem;
  private selectionSystem!: SelectionSystem;
  private moveIntentSystem!: MoveIntentSystem;
  private hoverTile: TileCoord | null = null;

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

    this.world = createEcsWorld();
    this.renderSystem = new RenderSystem(this, this.world);
    this.selectionSystem = new SelectionSystem(this, this.world);
    this.moveIntentSystem = new MoveIntentSystem(this.world);

    createVillager(this.world, { tile: { tx: 10, ty: 10 } });
    createVillager(this.world, { tile: { tx: 12, ty: 14 } });

    this.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);

    this.input.mouse?.disableContextMenu();
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);

    this.createOverlayText();
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    const tile = pickTile(
      pointer.x,
      pointer.y,
      this.cameras.main,
      this.tileMap.width,
      this.tileMap.height,
    );
    if (tile === null && this.hoverTile !== null) {
      this.hoverTile = null;
      this.tileMap.setHoverTile(null);
      return;
    }
    if (tile && (!this.hoverTile || !tileEquals(tile, this.hoverTile))) {
      this.hoverTile = tile;
      this.tileMap.setHoverTile(tile);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const tile = pickTile(
      pointer.x,
      pointer.y,
      this.cameras.main,
      this.tileMap.width,
      this.tileMap.height,
    );
    if (pointer.leftButtonDown()) {
      this.tileMap.setSelectedTile(tile);
      if (tile) this.selectionSystem.selectAtTile(tile.tx, tile.ty);
      else this.selectionSystem.clearSelection();
    } else if (pointer.rightButtonDown() && tile) {
      const selected = this.selectionSystem.getSelected();
      if (selected) selected.moveIntent = { target: tile };
    }
  }

  private onUpdate(_time: number, delta: number): void {
    this.cameraController.update(delta);
    this.moveIntentSystem.update();
    this.selectionSystem.update();
    this.renderSystem.update();
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
