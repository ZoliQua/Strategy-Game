import Phaser from 'phaser';
import { BUILDING_SPECS } from '../ecs/archetypes/building';
import { UNIT_SPECS } from '../ecs/archetypes/unit';
import { hu } from '../i18n/hu';
import type { AgeId, BuildingType, ResourceType, UnitType } from '../types';
import { dispatchCommand } from '../ui/events';
import { Minimap } from '../ui/Minimap';
import { uiStore, type SelectedEntityInfo, type UiStore } from '../ui/store';
import type { MapData } from '../map/MapData';
import type { EcsWorld } from '../ecs/world';

const BUILDABLE_BY_VILLAGER: readonly BuildingType[] = [
  'house',
  'farm',
  'lumber_camp',
  'mining_camp',
  'barracks',
];

const PANEL_COLOR = 0x141922;
const PANEL_STROKE = 0x2a3140;
const LABEL_COLOR = '#c9c2a6';
const VALUE_COLOR = '#ffe28b';

const TOP_BAR_HEIGHT = 48;
const BOTTOM_PANEL_HEIGHT = 140;

export class HUDScene extends Phaser.Scene {
  private resourceTexts: Partial<Record<ResourceType, Phaser.GameObjects.Text>> = {};
  private popText!: Phaser.GameObjects.Text;
  private ageText!: Phaser.GameObjects.Text;
  private selectionName!: Phaser.GameObjects.Text;
  private selectionHp!: Phaser.GameObjects.Text;
  private buildButtons: Phaser.GameObjects.Container[] = [];
  private trainButtons: Phaser.GameObjects.Container[] = [];
  private queueText!: Phaser.GameObjects.Text;
  private placementHint!: Phaser.GameObjects.Text;
  private minimap: Minimap | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    this.buildTopBar();
    this.buildBottomPanel();
    this.buildBuildPanel();
    this.render(uiStore.getState());
    this.unsubscribe = uiStore.subscribe((state) => this.render(state));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.minimap?.destroy();
      this.minimap = null;
    });
  }

  setupMinimap(
    world: EcsWorld,
    mapData: MapData,
    gameCamera: Phaser.Cameras.Scene2D.Camera,
    onJumpTo: (tx: number, ty: number) => void,
  ): void {
    this.minimap?.destroy();
    this.minimap = new Minimap(this, world, mapData, gameCamera, onJumpTo);
    this.events.on(Phaser.Scenes.Events.UPDATE, (_t: number, d: number) => {
      this.minimap?.update(d);
    });
  }

  private buildBuildPanel(): void {
    const startX = this.scale.width - 160;
    const startY = this.scale.height - BOTTOM_PANEL_HEIGHT + 16;
    BUILDABLE_BY_VILLAGER.forEach((type, i) => {
      const container = this.makeBuildButton(
        startX,
        startY + i * 22,
        type,
      );
      container.setVisible(false);
      this.buildButtons.push(container);
    });

    this.placementHint = this.add
      .text(this.scale.width / 2, TOP_BAR_HEIGHT + 12, '', {
        fontFamily: 'system-ui',
        fontSize: '14px',
        color: '#ffe28b',
      })
      .setOrigin(0.5, 0);

    this.queueText = this.add
      .text(240, this.scale.height - BOTTOM_PANEL_HEIGHT + 18, '', {
        fontFamily: 'system-ui',
        fontSize: '14px',
        color: LABEL_COLOR,
      })
      .setOrigin(0, 0);
  }

  private makeBuildButton(
    x: number,
    y: number,
    type: BuildingType,
  ): Phaser.GameObjects.Container {
    const spec = BUILDING_SPECS[type];
    const bg = this.add
      .rectangle(0, 0, 150, 20, 0x232a36, 1)
      .setStrokeStyle(1, 0x4a5565)
      .setOrigin(0, 0);
    const label = this.add
      .text(6, 2, hu.buildings[type], {
        fontFamily: 'system-ui',
        fontSize: '13px',
        color: LABEL_COLOR,
      })
      .setOrigin(0, 0);
    const cost = this.add
      .text(
        144,
        2,
        `${spec.cost.wood} ${hu.resources.wood.slice(0, 1)}`,
        {
          fontFamily: 'system-ui',
          fontSize: '12px',
          color: VALUE_COLOR,
        },
      )
      .setOrigin(1, 0);
    const container = this.add.container(x, y, [bg, label, cost]);
    container.setSize(150, 20);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(0x2f3a4e));
    container.on('pointerout', () => bg.setFillStyle(0x232a36));
    container.on('pointerdown', () => {
      uiStore.getState().setPlacementBuilding(type);
    });
    container.setData('type', type);
    return container;
  }

  private buildTopBar(): void {
    const width = this.scale.width;
    const bg = this.add.rectangle(0, 0, width, TOP_BAR_HEIGHT, PANEL_COLOR, 0.92);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, PANEL_STROKE);

    let x = 20;
    const resources: ResourceType[] = ['food', 'wood', 'gold'];
    const colors: Record<ResourceType, string> = {
      food: '#ff8f6a',
      wood: '#a06a3c',
      gold: '#ffd85c',
    };
    for (const r of resources) {
      this.add
        .text(x, 14, '●', {
          fontFamily: 'system-ui',
          fontSize: '18px',
          color: colors[r],
        })
        .setOrigin(0, 0);
      this.add
        .text(x + 20, 14, hu.resources[r] + ':', {
          fontFamily: 'system-ui',
          fontSize: '16px',
          color: LABEL_COLOR,
        })
        .setOrigin(0, 0);
      const val = this.add
        .text(x + 80, 14, '0', {
          fontFamily: 'system-ui',
          fontSize: '16px',
          color: VALUE_COLOR,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0);
      this.resourceTexts[r] = val;
      x += 150;
    }

    this.popText = this.add
      .text(x + 20, 14, `${hu.population}: 0 / 0`, {
        fontFamily: 'system-ui',
        fontSize: '16px',
        color: LABEL_COLOR,
      })
      .setOrigin(0, 0);

    this.ageText = this.add
      .text(width - 20, 14, hu.ages.roman, {
        fontFamily: 'system-ui',
        fontSize: '16px',
        color: VALUE_COLOR,
        fontStyle: 'italic',
      })
      .setOrigin(1, 0);
  }

  private buildBottomPanel(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const y = height - BOTTOM_PANEL_HEIGHT;

    const bg = this.add.rectangle(
      0,
      y,
      width,
      BOTTOM_PANEL_HEIGHT,
      PANEL_COLOR,
      0.92,
    );
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, PANEL_STROKE);

    this.selectionName = this.add
      .text(24, y + 18, hu.hud.noSelection, {
        fontFamily: 'system-ui',
        fontSize: '18px',
        color: LABEL_COLOR,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    this.selectionHp = this.add
      .text(24, y + 50, '', {
        fontFamily: 'system-ui',
        fontSize: '14px',
        color: VALUE_COLOR,
      })
      .setOrigin(0, 0);
  }

  private render(state: UiStore): void {
    for (const r of ['food', 'wood', 'gold'] as const) {
      this.resourceTexts[r]?.setText(String(Math.floor(state.resources[r])));
    }
    this.popText.setText(
      `${hu.population}: ${state.population.current} / ${state.population.cap}`,
    );
    this.ageText.setText(this.ageName(state.currentAge));
    this.updateSelection(state.selectedEntity);
    this.updateBuildPanel(state);
    this.updateTrainPanel(state);
    this.updatePlacementHint(state);
  }

  private updateBuildPanel(state: UiStore): void {
    const showing = state.selectedEntity?.kind === 'unit';
    for (const btn of this.buildButtons) {
      const type = btn.getData('type') as BuildingType;
      btn.setVisible(showing);
      const affordable =
        state.resources.wood >= BUILDING_SPECS[type].cost.wood;
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(affordable ? 0x232a36 : 0x1a1f29);
      const label = btn.list[1] as Phaser.GameObjects.Text;
      label.setColor(affordable ? LABEL_COLOR : '#6a6a6a');
    }
  }

  private updateTrainPanel(state: UiStore): void {
    const sel = state.selectedEntity;
    const isTrainer =
      sel?.kind === 'building' && sel.trainable && sel.trainable.length > 0;

    // Recreate train buttons based on trainable units.
    for (const btn of this.trainButtons) btn.destroy();
    this.trainButtons = [];
    if (!isTrainer) {
      this.queueText.setText('');
      return;
    }
    const startX = this.scale.width - 160;
    const startY = this.scale.height - BOTTOM_PANEL_HEIGHT + 16;
    sel.trainable!.forEach((u, i) => {
      const btn = this.makeTrainButton(startX, startY + i * 22, sel.id, u);
      const spec = UNIT_SPECS[u];
      const affordable =
        state.resources.food >= spec.cost.food &&
        state.resources.wood >= spec.cost.wood &&
        state.resources.gold >= spec.cost.gold &&
        state.population.current + spec.populationCost <= state.population.cap;
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(affordable ? 0x2a3628 : 0x1a1f29);
      const label = btn.list[1] as Phaser.GameObjects.Text;
      label.setColor(affordable ? LABEL_COLOR : '#6a6a6a');
      this.trainButtons.push(btn);
    });
    const q = sel.queue ?? [];
    this.queueText.setText(
      q.length === 0
        ? ''
        : q
            .map((e, i) => {
              const pct = Math.round(e.progress * 100);
              return `${i + 1}. ${hu.units[e.unitType]} ${pct}%`;
            })
            .join('  '),
    );
  }

  private makeTrainButton(
    x: number,
    y: number,
    trainerId: number,
    unitType: UnitType,
  ): Phaser.GameObjects.Container {
    const spec = UNIT_SPECS[unitType];
    const bg = this.add
      .rectangle(0, 0, 150, 20, 0x2a3628, 1)
      .setStrokeStyle(1, 0x4a6a38)
      .setOrigin(0, 0);
    const label = this.add
      .text(6, 2, hu.units[unitType], {
        fontFamily: 'system-ui',
        fontSize: '13px',
        color: LABEL_COLOR,
      })
      .setOrigin(0, 0);
    const cost = this.add
      .text(144, 2, `${spec.cost.food} É`, {
        fontFamily: 'system-ui',
        fontSize: '12px',
        color: VALUE_COLOR,
      })
      .setOrigin(1, 0);
    const container = this.add.container(x, y, [bg, label, cost]);
    container.setSize(150, 20);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(0x3a4638));
    container.on('pointerout', () => bg.setFillStyle(0x2a3628));
    container.on('pointerdown', () => {
      dispatchCommand({ type: 'queue-unit', trainerId, unitType });
    });
    return container;
  }

  private updatePlacementHint(state: UiStore): void {
    if (state.placementBuilding) {
      this.placementHint.setText(
        `${hu.buildings[state.placementBuilding]} — kattints a térképre az elhelyezéshez (ESC mégse)`,
      );
    } else {
      this.placementHint.setText('');
    }
  }

  private updateSelection(selected: SelectedEntityInfo | null): void {
    if (!selected) {
      this.selectionName.setText(hu.hud.noSelection);
      this.selectionHp.setText('');
      return;
    }
    const label =
      selected.kind === 'unit'
        ? hu.units[selected.unitType]
        : hu.buildings[selected.buildingType];
    this.selectionName.setText(label);
    const hp = `${hu.hud.hp}: ${selected.hp.current} / ${selected.hp.max}`;
    const at = `(${selected.tile.tx}, ${selected.tile.ty})`;
    const extra =
      selected.kind === 'unit' && selected.carrying
        ? `  ·  ${hu.resources[selected.carrying.type]}: ${selected.carrying.amount}`
        : '';
    this.selectionHp.setText(`${hp}  ·  ${at}${extra}`);
  }

  private ageName(age: AgeId): string {
    switch (age) {
      case 1:
        return hu.ages.roman;
      case 2:
        return hu.ages.medieval;
      case 3:
        return hu.ages.enlightenment;
    }
  }
}
