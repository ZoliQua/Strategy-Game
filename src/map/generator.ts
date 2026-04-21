import { generateMeadow, type MeadowOptions, type GeneratedMap } from './generators/meadow';

export type MapTemplate = 'meadow';

export interface GenerateMapOptions {
  readonly template: MapTemplate;
  readonly width: number;
  readonly height: number;
  readonly seed: number;
  readonly playerCount: number;
}

export function generateMap(options: GenerateMapOptions): GeneratedMap {
  switch (options.template) {
    case 'meadow':
      return generateMeadow(options satisfies MeadowOptions);
  }
}

export type { GeneratedMap, MeadowOptions };
