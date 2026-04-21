import Phaser from 'phaser';
import { DEFAULT_MAP_SIZE } from '../config/constants';
import { createVillager } from '../ecs/archetypes/villager';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { PathfindingSystem } from '../ecs/systems/PathfindingSystem';
import { RenderSystem } from '../ecs/systems/RenderSystem';
import { SelectionSystem } from '../ecs/systems/SelectionSystem';
import { createEcsWorld, type EcsWorld } from '../ecs/world';
import type { TileCoord } from '../iso/coordinates';
import { tileEquals } from '../iso/coordinates';
import { pickTile } from '../iso/picking';
import { hu } from '../i18n/hu';
import { generateMap } from '../map/generator';
import { TileMap } from '../map/TileMap';
import { CameraController } from './systems/CameraController';

export class GameScene extends Phaser.Scene {
  private tileMap!: TileMap;
  private cameraController!: CameraController;
  private world!: EcsWorld;
  private renderSystem!: RenderSystem;
  private selectionSystem!: SelectionSystem;
  private pathfindingSystem!: PathfindingSystem;
  private movementSystem!: MovementSystem;
  private mapData!: import('../map/MapData').MapData;
  private hoverTile: TileCoord | null = null;
  private playerStart: TileCoord = { tx: 10, ty: 10 };

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0d1016');

    const generated = generateMap({
      template: 'meadow',
      width: DEFAULT_MAP_SIZE,
      height: DEFAULT_MAP_SIZE,
      seed: 42,
      playerCount: 4,
    });
    this.mapData = generated.map;
    this.tileMap = new TileMap(this, this.mapData);
    this.playerStart = generated.playerStarts[0] ?? { tx: 10, ty: 10 };

    const bounds = this.tileMap.getWorldBounds();
    const padding = 200;
    this.cameras.main.setBounds(
      bounds.minX - padding,
      bounds.minY - padding,
      bounds.maxX - bounds.minX + padding * 2,
      bounds.maxY - bounds.minY + padding * 2,
    );

    const startScreen = this.playerStartScreen();
    this.cameras.main.centerOn(startScreen.sx, startScreen.sy);

    this.cameraController = new CameraController(this);

    this.world = createEcsWorld();
    this.renderSystem = new RenderSystem(this, this.world);
    this.selectionSystem = new SelectionSystem(this, this.world);
    this.pathfindingSystem = new PathfindingSystem(this.world, this.mapData);
    this.movementSystem = new MovementSystem(this.world);

    createVillager(this.world, { tile: this.playerStart });
    createVillager(this.world, {
      tile: { tx: this.playerStart.tx + 1, ty: this.playerStart.ty + 1 },
    });
    createVillager(this.world, {
      tile: { tx: this.playerStart.tx - 1, ty: this.playerStart.ty + 1 },
    });

    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene');
    }

    this.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);

    this.input.mouse?.disableContextMenu();
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);

    this.createOverlayText();
  }

  private playerStartScreen(): { sx: number; sy: number } {
    const { tx, ty } = this.playerStart;
    return {
      sx: (tx - ty) * 32,
      sy: (tx + ty) * 16,
    };
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
      if (selected) {
        this.world.addComponent(selected, 'moveIntent', { target: tile });
      }
    }
  }

  private onUpdate(_time: number, delta: number): void {
    this.cameraController.update(delta);
    this.pathfindingSystem.update();
    this.movementSystem.update(delta);
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
