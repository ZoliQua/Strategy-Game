import type { AIContext, AIStrategy } from '../AIPlayer';

export class NullStrategy implements AIStrategy {
  readonly name = 'null';
  update(_ctx: AIContext, _deltaMs: number): void {
    // No-op.
  }
}
