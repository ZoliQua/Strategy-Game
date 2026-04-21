import Phaser from 'phaser';
import { DEFAULT_MAP_SIZE } from '../config/constants';
import { createBuilding } from '../ecs/archetypes/building';
import {
  createResourceNode,
  TERRAIN_RESOURCE,
} from '../ecs/archetypes/resource';
import { createVillager } from '../ecs/archetypes/villager';
import { GatheringSystem } from '../ecs/systems/GatheringSystem';
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
  private gatheringSystem!: GatheringSystem;
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
    this.gatheringSystem = new GatheringSystem(this.world, this.mapData);

    const resourceNodes = this.world.with('position', 'resourceNode');
    resourceNodes.onEntityRemoved.subscribe((entity) => {
      if (entity.position) {
        this.tileMap.refreshTile(entity.position.tx, entity.position.ty);
      }
    });

    this.spawnResourceNodes();

    const tcOrigin = {
      tx: this.playerStart.tx - 1,
      ty: this.playerStart.ty - 1,
    };
    createBuilding(this.world, {
      type: 'town_center',
      origin: tcOrigin,
      playerId: 1,
      mapData: this.mapData,
    });
    // Villagers spawn south of the town center so they don't overlap.
    createVillager(this.world, {
      tile: { tx: this.playerStart.tx, ty: this.playerStart.ty + 3 },
    });
    createVillager(this.world, {
      tile: { tx: this.playerStart.tx + 1, ty: this.playerStart.ty + 3 },
    });
    createVillager(this.world, {
      tile: { tx: this.playerStart.tx - 1, ty: this.playerStart.ty + 3 },
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

  private spawnResourceNodes(): void {
    this.mapData.forEachTile(({ tx, ty }, terrain) => {
      const type = TERRAIN_RESOURCE[terrain];
      if (!type) return;
      createResourceNode(this.world, { tile: { tx, ty }, type });
    });
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
      if (!selected) return;
      const node = this.findResourceNodeAt(tile.tx, tile.ty);
      if (node && selected.gatherer) {
        this.world.addComponent(selected, 'gatherIntent', {
          nodeId: node.id ?? 0,
        });
      } else {
        this.world.addComponent(selected, 'moveIntent', { target: tile });
      }
    }
  }

  private findResourceNodeAt(tx: number, ty: number): import('../ecs/components').Entity | null {
    const nodes = this.world.with('position', 'resourceNode');
    for (const n of nodes) {
      if (n.position.tx === tx && n.position.ty === ty) return n;
    }
    return null;
  }

  private onUpdate(_time: number, delta: number): void {
    this.cameraController.update(delta);
    this.pathfindingSystem.update();
    this.gatheringSystem.update(delta);
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
