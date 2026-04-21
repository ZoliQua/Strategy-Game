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
    hint: 'WASD / nyilak — kamera · Egér-kerék — zoom · Bal klikk — kijelölés · Jobb klikk — mozgás',
  },
  resources: {
    food: 'Étel',
    wood: 'Fa',
    gold: 'Arany',
  },
  ages: {
    roman: 'Római kor',
    medieval: 'Középkor',
    enlightenment: 'Felvilágosodás',
  },
  population: 'Népesség',
  units: {
    villager: 'Falusi',
    scout: 'Felderítő',
    swordsman: 'Kardforgató',
    archer: 'Íjász',
    knight: 'Lovag',
    pikeman: 'Lándzsás',
    crossbowman: 'Számszeríjász',
    musketeer: 'Muskétás',
    cannon: 'Ágyú',
    cavalry: 'Lovasság',
  },
  buildings: {
    town_center: 'Városháza',
    house: 'Ház',
    farm: 'Farm',
    lumber_camp: 'Faraktár',
    mining_camp: 'Bányászkunyhó',
    barracks: 'Laktanya',
    archery_range: 'Lőtér',
    stable: 'Istálló',
    blacksmith: 'Kovácsműhely',
    tower: 'Őrtorony',
    wall: 'Fal',
    wonder: 'Csoda',
  },
  hud: {
    noSelection: 'Nincs kijelölés',
    hp: 'HP',
  },
  loading: 'Betöltés…',
} as const;

export type I18nKey = keyof typeof hu;
