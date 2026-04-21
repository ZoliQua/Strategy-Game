import Phaser from 'phaser';
import { gameConfig } from './config/game';

const game = new Phaser.Game(gameConfig);

if (import.meta.env.DEV) {
  // Dev-only: expose the game instance for preview / console debugging.
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
