export const hu = {
  title: 'IsoRTS',
  subtitle: 'Izometrikus történelmi stratégia',
  menu: {
    newGame: 'Új játék',
    loadGame: 'Betöltés',
    settings: 'Beállítások',
    credits: 'Készítők',
  },
  game: {
    sceneActive: 'GameScene aktív',
    hint: 'WASD / nyilak — kamera · Egér-kerék — zoom · Bal klikk — kijelölés',
  },
  loading: 'Betöltés…',
} as const;

export type I18nKey = keyof typeof hu;
