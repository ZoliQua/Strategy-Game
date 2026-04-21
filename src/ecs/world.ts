import { World } from 'miniplex';
import type { Entity } from './components';

export type EcsWorld = World<Entity>;

let _nextId = 1;

export function createEcsWorld(): EcsWorld {
  _nextId = 1;
  return new World<Entity>();
}

export function assignEntityId(entity: Entity): Entity {
  entity.id = _nextId++;
  return entity;
}
