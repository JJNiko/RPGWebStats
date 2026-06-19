// ============================================================
// Aethelgard's Shadow — Game Type Definitions
// ============================================================

export type GameScreen = 'title' | 'characterCreation' | 'exploration' | 'combat' | 'levelUp' | 'gameOver' | 'victory';

export type CharacterClass = 'warrior' | 'mage' | 'rogue';

export type StatKey = 'str' | 'agi' | 'int' | 'vit' | 'def';

export interface CharacterStats {
  str: number;  // Strength — physical damage
  agi: number;  // Agility — crit, dodge, speed
  int: number;  // Intelligence — magic damage, MP
  vit: number;  // Vitality — HP pool
  def: number;  // Defense — damage reduction
  [key: string]: number;  // Allow indexing for dynamic stat access
}

export interface Player {
  name: string;
  class: CharacterClass;
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: CharacterStats;
  baseStats: CharacterStats;
  statPoints: number;
  gold: number;
  inventory: InventoryItem[];
  equipment: Equipment;
  abilities: Ability[];
  visitedLocations: string[];
  storyChoices: Record<string, string>;
  questsCompleted: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  type: 'consumable' | 'equipment' | 'quest' | 'scroll';
  effect?: string;
  value?: number;
  equipSlot?: EquipSlot;
  statBonus?: Partial<CharacterStats>;
  count: number;
  price: number;
}

export type EquipSlot = 'weapon' | 'armor' | 'accessory';

export interface Equipment {
  weapon?: InventoryItem;
  armor?: InventoryItem;
  accessory?: InventoryItem;
}

export interface Ability {
  id: string;
  name: string;
  icon: string;
  description: string;
  mpCost: number;
  power: number;
  type: 'physical' | 'magical' | 'heal' | 'buff';
  unlockLevel: number;
}

export interface Enemy {
  id: string;
  name: string;
  icon: string;
  image: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  agi: number;
  xp: number;
  gold: number;
  lootTable: string[];
}

export interface Location {
  id: string;
  name: string;
  icon: string;
  description: string;
  danger: number;
  connections: string[];
  enemies: string[];
  storyNodes: StoryNode[];
}

export interface StoryNode {
  id: string;
  title: string;
  text: string;
  choices: StoryChoice[];
  requires?: string;
  repeatable?: boolean;
}

export interface StoryChoice {
  id: string;
  text: string;
  icon: string;
  consequence: Consequence;
  requires?: string;
}

export interface Consequence {
  type: 'combat' | 'reward' | 'story' | 'shop' | 'heal' | 'damage' | 'none';
  enemyId?: string;
  xp?: number;
  gold?: number;
  items?: string[];
  statChanges?: Partial<CharacterStats>;
  maxHpChange?: number;
  storyFlag?: string;
  nextNodeId?: string;
  healPercent?: number;
  damage?: number;
  text: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'kill' | 'explore' | 'collect' | 'choice';
  target: number;
  progress: number;
  reward: { xp: number; gold: number; items?: string[] };
  completed: boolean;
  branches?: QuestBranch[];
}

export interface QuestBranch {
  id: string;
  text: string;
  consequence: string;
}

export interface CombatState {
  enemy: Enemy;
  round: number;
  log: string[];
  isPlayerTurn: boolean;
  fleeAttempted: boolean;
}

export interface GameState {
  screen: GameScreen;
  player: Player | null;
  currentLocation: string;
  currentNodeId: string | null;
  combat: CombatState | null;
  showInventory: boolean;
  showQuests: boolean;
  showMap: boolean;
  toast: Toast | null;
  saveSlot: string;
}

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'loot' | 'levelup';
  duration: number;
}

export interface MapTile {
  x: number;
  y: number;
  type: 'grass' | 'forest' | 'water' | 'mountain' | 'ruins' | 'road' | 'village';
  explored: boolean;
  locationId?: string;
}

export interface WorldMap {
  width: number;
  height: number;
  tiles: MapTile[][];
  playerX: number;
  playerY: number;
}
