import Phaser from 'phaser';
import { hu } from '../i18n/hu';
import type { AgeId, ResourceType } from '../types';
import { uiStore, type SelectedEntityInfo, type UiStore } from '../ui/store';

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
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    this.buildTopBar();
    this.buildBottomPanel();
    this.render(uiStore.getState());
    this.unsubscribe = uiStore.subscribe((state) => this.render(state));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
    });
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
  }

  private updateSelection(selected: SelectedEntityInfo | null): void {
    if (!selected) {
      this.selectionName.setText(hu.hud.noSelection);
      this.selectionHp.setText('');
      return;
    }
    this.selectionName.setText(hu.units[selected.unitType]);
    this.selectionHp.setText(
      `${hu.hud.hp}: ${selected.hp.current} / ${selected.hp.max}  ·  (${selected.tile.tx}, ${selected.tile.ty})`,
    );
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
