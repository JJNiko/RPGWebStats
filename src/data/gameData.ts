// ============================================================
// Aethelgard's Shadow — Game Data
// ============================================================
import type { CharacterStats, Enemy, InventoryItem, Ability, Location, Quest } from '@/types/game';

// --- Class Base Stats ---
export const CLASS_STATS: Record<string, { stats: CharacterStats; hp: number; mp: number; description: string }> = {
  warrior: {
    stats: { str: 14, agi: 8, int: 4, vit: 12, def: 8 },
    hp: 120,
    mp: 30,
    description: 'A hardened soldier trained in the art of war. High HP and Strength make them formidable front-line fighters.',
  },
  mage: {
    stats: { str: 5, agi: 8, int: 16, vit: 6, def: 4 },
    hp: 70,
    mp: 100,
    description: 'A wielder of arcane forces, shaping reality through sheer will. Devastating magic power at the cost of physical frailty.',
  },
  rogue: {
    stats: { str: 10, agi: 15, int: 8, vit: 8, def: 5 },
    hp: 90,
    mp: 50,
    description: 'A shadow in the night, striking from the darkness with lethal precision. Unmatched agility and critical strike potential.',
  },
};

// --- Abilities ---
export const ABILITIES: Ability[] = [
  {
    id: 'shield_bash',
    name: 'Shield Bash',
    icon: '🛡️',
    description: 'A stunning strike that deals 1.5× STR damage.',
    mpCost: 8,
    power: 1.5,
    type: 'physical',
    unlockLevel: 1,
  },
  {
    id: 'arcane_bolt',
    name: 'Arcane Bolt',
    icon: '⚡',
    description: 'A bolt of pure magic dealing 2× INT damage.',
    mpCost: 12,
    power: 2,
    type: 'magical',
    unlockLevel: 1,
  },
  {
    id: 'shadow_strike',
    name: 'Shadow Strike',
    icon: '🗡️',
    description: 'A swift strike from the shadows. 2× AGI damage, high crit chance.',
    mpCost: 10,
    power: 2,
    type: 'physical',
    unlockLevel: 1,
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    icon: '🌪️',
    description: 'Spinning attack dealing 1.2× STR to all enemies.',
    mpCost: 20,
    power: 1.2,
    type: 'physical',
    unlockLevel: 3,
  },
  {
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    description: 'Explosive fire dealing 2.5× INT damage.',
    mpCost: 25,
    power: 2.5,
    type: 'magical',
    unlockLevel: 3,
  },
  {
    id: 'poison_blade',
    name: 'Poison Blade',
    icon: '☠️',
    description: 'Coat your weapon in poison. Deals 1.8× AGI damage over time.',
    mpCost: 18,
    power: 1.8,
    type: 'physical',
    unlockLevel: 3,
  },
  {
    id: 'berserker_rage',
    name: 'Berserker Rage',
    icon: '😤',
    description: 'Enter a rage — +5 STR for 3 turns, but -3 DEF.',
    mpCost: 15,
    power: 0,
    type: 'buff',
    unlockLevel: 5,
  },
  {
    id: 'frost_nova',
    name: 'Frost Nova',
    icon: '❄️',
    description: 'Freeze the enemy for 2× INT damage. May stun.',
    mpCost: 30,
    power: 2,
    type: 'magical',
    unlockLevel: 5,
  },
  {
    id: 'shadow_cloak',
    name: 'Shadow Cloak',
    icon: '👤',
    description: 'Become invisible. Next attack is guaranteed critical.',
    mpCost: 22,
    power: 0,
    type: 'buff',
    unlockLevel: 5,
  },
];

export const CLASS_ABILITIES: Record<string, string[]> = {
  warrior: ['shield_bash', 'whirlwind', 'berserker_rage'],
  mage: ['arcane_bolt', 'fireball', 'frost_nova'],
  rogue: ['shadow_strike', 'poison_blade', 'shadow_cloak'],
};

// --- Enemies ---
export const ENEMIES: Record<string, Enemy> = {
  wolf: {
    id: 'wolf', name: 'Forest Wolf', icon: '🐺', image: '/assets/enemy-wolf.png',
    hp: 35, maxHp: 35, attack: 8, defense: 3, agi: 10, xp: 15, gold: 5,
    lootTable: ['potion_small', 'wolf_fang'],
  },
  goblin: {
    id: 'goblin', name: 'Goblin Scout', icon: '👺', image: '/assets/enemy-goblin.png',
    hp: 28, maxHp: 28, attack: 7, defense: 2, agi: 12, xp: 12, gold: 6,
    lootTable: ['potion_small', 'goblin_dagger'],
  },
  skeleton: {
    id: 'skeleton', name: 'Undead Skeleton', icon: '💀', image: '/assets/enemy-skeleton.png',
    hp: 40, maxHp: 40, attack: 11, defense: 5, agi: 6, xp: 22, gold: 10,
    lootTable: ['potion', 'rusty_sword'],
  },
  spider: {
    id: 'spider', name: 'Giant Spider', icon: '🕷️', image: '/assets/enemy-spider.png',
    hp: 25, maxHp: 25, attack: 9, defense: 2, agi: 14, xp: 14, gold: 4,
    lootTable: ['potion_small', 'spider_silk'],
  },
  troll: {
    id: 'troll', name: 'Cave Troll', icon: '👹', image: '/assets/enemy-troll.png',
    hp: 70, maxHp: 70, attack: 16, defense: 10, agi: 4, xp: 55, gold: 30,
    lootTable: ['potion', 'troll_hide'],
  },
  ghost: {
    id: 'ghost', name: 'Restless Spirit', icon: '👻', image: '/assets/enemy-ghost.png',
    hp: 35, maxHp: 35, attack: 14, defense: 0, agi: 10, xp: 35, gold: 15,
    lootTable: ['ether', 'spirit_essence'],
  },
  golem: {
    id: 'golem', name: 'Stone Golem', icon: '🗿', image: '/assets/enemy-golem.png',
    hp: 90, maxHp: 90, attack: 18, defense: 18, agi: 3, xp: 85, gold: 45,
    lootTable: ['potion_large', 'golem_core'],
  },
  lich: {
    id: 'lich', name: 'Dark Lich', icon: '🧟', image: '/assets/enemy-lich.png',
    hp: 110, maxHp: 110, attack: 20, defense: 8, agi: 8, xp: 160, gold: 100,
    lootTable: ['ether_large', 'lich_phylactery'],
  },
  dragon: {
    id: 'dragon', name: 'Ancient Dragon', icon: '🐉', image: '/assets/enemy-dragon.png',
    hp: 180, maxHp: 180, attack: 28, defense: 18, agi: 10, xp: 600, gold: 300,
    lootTable: ['dragon_scale', 'crown_of_aethelgard'],
  },
  bandit: {
    id: 'bandit', name: 'Highway Bandit', icon: '🥷', image: '/assets/enemy-bandit.png',
    hp: 45, maxHp: 45, attack: 12, defense: 5, agi: 10, xp: 28, gold: 20,
    lootTable: ['potion', 'bandit_blade'],
  },
  boar: {
    id: 'boar', name: 'Wild Boar', icon: '🐗', image: '/assets/enemy-boar.png',
    hp: 40, maxHp: 40, attack: 10, defense: 6, agi: 8, xp: 20, gold: 8,
    lootTable: ['boar_meat'],
  },
};

// --- Items ---
export const ITEMS: Record<string, InventoryItem> = {
  potion_small: { id: 'potion_small', name: 'Small Health Potion', icon: '🧪', type: 'consumable', effect: 'heal', value: 20, count: 1, price: 8 },
  potion: { id: 'potion', name: 'Health Potion', icon: '🧪', type: 'consumable', effect: 'heal', value: 40, count: 1, price: 15 },
  potion_large: { id: 'potion_large', name: 'Large Health Potion', icon: '🧪', type: 'consumable', effect: 'heal', value: 80, count: 1, price: 30 },
  ether: { id: 'ether', name: 'Mana Ether', icon: '💧', type: 'consumable', effect: 'mana', value: 30, count: 1, price: 18 },
  ether_large: { id: 'ether_large', name: 'Greater Ether', icon: '💧', type: 'consumable', effect: 'mana', value: 60, count: 1, price: 35 },
  iron_sword: { id: 'iron_sword', name: 'Iron Longsword', icon: '⚔️', type: 'equipment', equipSlot: 'weapon', statBonus: { str: 4 }, count: 1, price: 45 },
  steel_sword: { id: 'steel_sword', name: 'Steel Broadsword', icon: '⚔️', type: 'equipment', equipSlot: 'weapon', statBonus: { str: 8, def: 2 }, count: 1, price: 90 },
  enchanted_staff: { id: 'enchanted_staff', name: 'Enchanted Staff', icon: '🔮', type: 'equipment', equipSlot: 'weapon', statBonus: { int: 6, agi: 2 }, count: 1, price: 80 },
  shadow_blade: { id: 'shadow_blade', name: 'Shadow Blade', icon: '🗡️', type: 'equipment', equipSlot: 'weapon', statBonus: { agi: 8, str: 3 }, count: 1, price: 85 },
  leather_armor: { id: 'leather_armor', name: 'Leather Vest', icon: '🛡️', type: 'equipment', equipSlot: 'armor', statBonus: { def: 4, vit: 2 }, count: 1, price: 40 },
  chain_mail: { id: 'chain_mail', name: 'Chain Mail', icon: '🛡️', type: 'equipment', equipSlot: 'armor', statBonus: { def: 8, vit: 4 }, count: 1, price: 85 },
  mage_robes: { id: 'mage_robes', name: 'Arcane Robes', icon: '🥼', type: 'equipment', equipSlot: 'armor', statBonus: { int: 6, def: 3 }, count: 1, price: 75 },
  jade_ring: { id: 'jade_ring', name: 'Jade Ring', icon: '💍', type: 'equipment', equipSlot: 'accessory', statBonus: { int: 3 }, count: 1, price: 60 },
  power_ring: { id: 'power_ring', name: 'Ring of Power', icon: '💍', type: 'equipment', equipSlot: 'accessory', statBonus: { str: 3 }, count: 1, price: 55 },
  swift_ring: { id: 'swift_ring', name: 'Swift Ring', icon: '💍', type: 'equipment', equipSlot: 'accessory', statBonus: { agi: 4 }, count: 1, price: 55 },
  ancient_scroll: { id: 'ancient_scroll', name: 'Ancient Scroll', icon: '📜', type: 'scroll', effect: 'xp', value: 50, count: 1, price: 40 },
  rusty_key: { id: 'rusty_key', name: 'Rusty Key', icon: '🗝️', type: 'quest', count: 1, price: 0 },
  wolf_fang: { id: 'wolf_fang', name: 'Wolf Fang', icon: '🦷', type: 'quest', count: 1, price: 5 },
  goblin_dagger: { id: 'goblin_dagger', name: 'Goblin Dagger', icon: '🔪', type: 'equipment', equipSlot: 'weapon', statBonus: { agi: 3 }, count: 1, price: 15 },
  rusty_sword: { id: 'rusty_sword', name: 'Rusty Sword', icon: '⚔️', type: 'equipment', equipSlot: 'weapon', statBonus: { str: 2 }, count: 1, price: 10 },
  spider_silk: { id: 'spider_silk', name: 'Spider Silk', icon: '🕸️', type: 'quest', count: 1, price: 8 },
  troll_hide: { id: 'troll_hide', name: 'Troll Hide', icon: '🟤', type: 'quest', count: 1, price: 20 },
  spirit_essence: { id: 'spirit_essence', name: 'Spirit Essence', icon: '✨', type: 'quest', count: 1, price: 25 },
  golem_core: { id: 'golem_core', name: 'Golem Core', icon: '💎', type: 'quest', count: 1, price: 35 },
  lich_phylactery: { id: 'lich_phylactery', name: 'Phylactery', icon: '🏺', type: 'quest', count: 1, price: 50 },
  dragon_scale: { id: 'dragon_scale', name: 'Dragon Scale', icon: '🔷', type: 'quest', count: 1, price: 100 },
  crown_of_aethelgard: { id: 'crown_of_aethelgard', name: 'Crown of Aethelgard', icon: '👑', type: 'equipment', equipSlot: 'accessory', statBonus: { str: 5, int: 5, agi: 5, vit: 5, def: 5 }, count: 1, price: 500 },
  bandit_blade: { id: 'bandit_blade', name: 'Bandit Blade', icon: '⚔️', type: 'equipment', equipSlot: 'weapon', statBonus: { str: 5, agi: 2 }, count: 1, price: 35 },
  boar_meat: { id: 'boar_meat', name: 'Boar Meat', icon: '🍖', type: 'consumable', effect: 'heal', value: 25, count: 1, price: 5 },
};

// --- Shop Inventory ---
export const SHOP_ITEMS = ['potion', 'potion_large', 'ether', 'ether_large', 'iron_sword', 'leather_armor', 'jade_ring'];

// --- Locations ---
export const LOCATIONS: Record<string, Location> = {
  village: {
    id: 'village',
    name: 'Ashen Village',
    icon: '🏘️',
    description: 'A small settlement huddled at the edge of the wilderness. Smoke rises from chimneys, but the streets are eerily quiet.',
    danger: 0,
    connections: ['forest', 'plains'],
    enemies: [],
    storyNodes: [
      {
        id: 'village_entry',
        title: '🏘️ Ashen Village',
        text: 'You arrive at Ashen Village. The Elder approaches you with a worried expression. "Traveler, our village is beset by monsters from the Dark Forest. Will you help us?"',
        choices: [
          { id: 'accept', text: 'I will help', icon: '⚔️', consequence: { type: 'story', storyFlag: 'helped_village', text: 'The Elder smiles. "Thank you, brave one. Start by clearing the forest to the east."' } },
          { id: 'demand_pay', text: 'What is the reward?', icon: '💰', consequence: { type: 'reward', gold: 20, storyFlag: 'mercenary_path', text: 'The Elder frowns but hands you 20 gold. "Half now, half when the job is done."' } },
          { id: 'refuse', text: 'Not my problem', icon: '🚶', consequence: { type: 'story', storyFlag: 'refused_village', text: 'The Elder\'s face darkens. "Then leave this place. We have no need of your kind."' } },
        ],
      },
      {
        id: 'village_shop',
        title: '🏪 Village Shop',
        text: 'The village merchant shows you his wares. "Fine goods for a brave adventurer!"',
        choices: [
          { id: 'open_shop', text: 'Browse wares', icon: '🛒', consequence: { type: 'shop', text: 'The merchant arranges his goods before you.' } },
          { id: 'leave', text: 'Leave', icon: '🚶', consequence: { type: 'none', text: 'You leave the shop.' } },
        ],
        repeatable: true,
      },
      {
        id: 'village_rest',
        title: '🛌 Rest at the Inn',
        text: 'The inn offers a warm bed and hot stew. Rest here to recover your strength?',
        choices: [
          { id: 'rest', text: 'Rest (free)', icon: '🛌', consequence: { type: 'heal', healPercent: 100, text: 'You sleep soundly and wake fully refreshed. HP and MP restored!' } },
          { id: 'leave', text: 'Leave', icon: '🚶', consequence: { type: 'none', text: 'You decide to keep moving.' } },
        ],
        repeatable: true,
      },
    ],
  },
  forest: {
    id: 'forest',
    name: 'Dark Forest',
    icon: '🌲',
    description: 'Ancient trees block out the sun. Twisted roots grasp at your boots, and somewhere in the darkness, something watches.',
    danger: 2,
    connections: ['village', 'cave', 'ruins'],
    enemies: ['wolf', 'goblin', 'spider'],
    storyNodes: [
      {
        id: 'forest_entry',
        title: '🌲 The Dark Forest',
        text: 'You push through the undergrowth. The forest is alive with unseen creatures. What do you do?',
        choices: [
          { id: 'hunt', text: 'Hunt for monsters', icon: '🏹', consequence: { type: 'combat', enemyId: 'random', text: 'You encounter a monster!' } },
          { id: 'explore', text: 'Explore deeper', icon: '🔦', consequence: { type: 'story', nextNodeId: 'forest_deep', text: 'You venture deeper into the woods...' } },
          { id: 'gather', text: 'Gather herbs', icon: '🌿', consequence: { type: 'reward', items: ['potion_small'], text: 'You gather medicinal herbs and craft a small potion.' } },
          { id: 'leave', text: 'Return to village', icon: '🚶', consequence: { type: 'none', text: 'You head back to Ashen Village.' } },
        ],
        repeatable: true,
      },
      {
        id: 'forest_deep',
        title: '🌲 Deep Woods',
        text: 'You discover an ancient shrine overgrown with moss. A faint jade light pulses within. Strange whispers echo in your mind.',
        choices: [
          { id: 'touch_shrine', text: 'Touch the shrine', icon: '✋', consequence: { type: 'reward', xp: 30, storyFlag: 'touched_shrine', text: 'Energy surges through you! You gain 30 XP and feel... different.' } },
          { id: 'search', text: 'Search around', icon: '🔍', consequence: { type: 'combat', enemyId: 'goblin', text: 'A goblin was hiding nearby! It attacks!' } },
          { id: 'dark_power', text: 'Embrace the whispers', icon: '🌑', consequence: { type: 'reward', xp: 50, maxHpChange: -10, storyFlag: 'dark_whispers', text: 'Dark knowledge floods your mind. +50 XP, but your soul feels heavier... Max HP reduced by 10.' } },
          { id: 'leave', text: 'Back away', icon: '🚶', consequence: { type: 'none', text: 'You wisely retreat from the strange shrine.' } },
        ],
      },
    ],
  },
  plains: {
    id: 'plains',
    name: 'Golden Plains',
    icon: '🌾',
    description: 'Endless grasslands stretch before you. The wind carries the scent of wildflowers and distant rain.',
    danger: 1,
    connections: ['village', 'mountain'],
    enemies: ['boar', 'bandit'],
    storyNodes: [
      {
        id: 'plains_entry',
        title: '🌾 Golden Plains',
        text: 'The open plains are peaceful but dangerous. Bandits prey on travelers, and wild boars roam the tall grass.',
        choices: [
          { id: 'hunt', text: 'Hunt beasts', icon: '🏹', consequence: { type: 'combat', enemyId: 'random', text: 'You encounter a wild beast!' } },
          { id: 'explore', text: 'Follow the road', icon: '🛤️', consequence: { type: 'story', nextNodeId: 'plains_road', text: 'You follow the winding dirt road...' } },
          { id: 'rest', text: 'Rest in the grass', icon: '🛌', consequence: { type: 'heal', healPercent: 30, text: 'The warm sun and gentle breeze restore some of your energy.' } },
        ],
        repeatable: true,
      },
      {
        id: 'plains_road',
        title: '🛤️ The Winding Road',
        text: 'You spot a wounded traveler being robbed by bandits! They have not seen you yet.',
        choices: [
          { id: 'help', text: 'Rescue the traveler', icon: '⚔️', consequence: { type: 'combat', enemyId: 'bandit', storyFlag: 'saved_traveler', text: 'You charge in to save the traveler!' } },
          { id: 'sneak', text: 'Sneak past', icon: '👤', consequence: { type: 'reward', gold: 10, storyFlag: 'coward_path', text: 'You loot what the bandits dropped and slip away. +10 gold, but at what cost?' } },
          { id: 'ignore', text: 'Walk away', icon: '🚶', consequence: { type: 'none', text: 'Not your fight. You continue on your way.' } },
        ],
      },
    ],
  },
  cave: {
    id: 'cave',
    name: 'Whispering Cave',
    icon: '🕸️',
    description: 'Darkness swallows the light. The walls seem to whisper secrets in a language forgotten by mortals.',
    danger: 3,
    connections: ['forest', 'dungeon'],
    enemies: ['spider', 'troll'],
    storyNodes: [
      {
        id: 'cave_entry',
        title: '🕸️ Whispering Cave',
        text: 'The cave entrance yawns before you like a mouth. Bats flutter overhead, and the air smells of damp stone.',
        choices: [
          { id: 'explore', text: 'Enter the cave', icon: '🔦', consequence: { type: 'story', nextNodeId: 'cave_interior', text: 'You venture into the darkness, torch in hand...' } },
          { id: 'mine', text: 'Mine for ore', icon: '⛏️', consequence: { type: 'reward', gold: 15, xp: 10, text: 'You find a vein of silver ore! +15 gold, +10 XP' } },
          { id: 'leave', text: 'Leave', icon: '🚶', consequence: { type: 'none', text: 'Some places are best left unexplored.' } },
        ],
        repeatable: true,
      },
      {
        id: 'cave_interior',
        title: '🕸️ Cave Depths',
        text: 'In the deepest chamber, you find ancient murals depicting a great war. A troll guards a chest in the corner.',
        choices: [
          { id: 'fight_troll', text: 'Fight the troll', icon: '⚔️', consequence: { type: 'combat', enemyId: 'troll', storyFlag: 'defeated_troll', text: 'The troll roars and charges!' } },
          { id: 'sneak_chest', text: 'Sneak to the chest', icon: '🥷', consequence: { type: 'reward', items: ['steel_sword', 'potion_large'], gold: 30, storyFlag: 'stole_treasure', text: 'You slip past the sleeping troll! Found a Steel Broadsword and 30 gold!' } },
          { id: 'leave', text: 'Back away slowly', icon: '🚶', consequence: { type: 'none', text: 'Live to fight another day.' } },
        ],
      },
    ],
  },
  ruins: {
    id: 'ruins',
    name: 'Ancient Ruins',
    icon: '🏛️',
    description: 'Crumbling stone structures hint at a lost civilization. Jade runes flicker with residual magic.',
    danger: 4,
    connections: ['forest', 'dungeon'],
    enemies: ['skeleton', 'ghost'],
    storyNodes: [
      {
        id: 'ruins_entry',
        title: '🏛️ Ancient Ruins',
        text: 'Crumbling arches rise from moss-covered ground. The air hums with ancient magic.',
        choices: [
          { id: 'search', text: 'Search the ruins', icon: '🔍', consequence: { type: 'story', nextNodeId: 'ruins_library', text: 'You discover a hidden chamber...' } },
          { id: 'listen', text: 'Listen to the whispers', icon: '👂', consequence: { type: 'story', nextNodeId: 'ruins_whispers', text: 'The whispers grow louder, forming words...' } },
          { id: 'fight', text: 'Draw weapon', icon: '⚔️', consequence: { type: 'combat', enemyId: 'skeleton', text: 'A skeleton rises from the rubble!' } },
        ],
        repeatable: true,
      },
      {
        id: 'ruins_library',
        title: '📚 Hidden Library',
        text: 'An ancient library! Dusty tomes line the walls. Most are illegible, but one pulses with energy.',
        choices: [
          { id: 'read_tome', text: 'Read the tome', icon: '📖', consequence: { type: 'reward', xp: 40, items: ['ancient_scroll'], statChanges: { int: 2 }, storyFlag: 'read_tome', text: 'The tome teaches you arcane secrets! +40 XP, +2 INT, found Ancient Scroll!' } },
          { id: 'take_tome', text: 'Take the tome', icon: '📜', consequence: { type: 'combat', enemyId: 'ghost', storyFlag: 'stole_tome', text: 'A spirit guardian appears to protect the knowledge!' } },
          { id: 'leave', text: 'Leave it', icon: '🚶', consequence: { type: 'none', text: 'Some knowledge is dangerous.' } },
        ],
      },
      {
        id: 'ruins_whispers',
        title: '👂 The Whispering Voice',
        text: '"Aethelgard... the shadow rises... only the worthy may claim the crown..." The voice offers you a choice.',
        choices: [
          { id: 'accept_power', text: 'Accept the shadow\'s gift', icon: '🌑', consequence: { type: 'reward', xp: 60, items: ['shadow_blade'], maxHpChange: -15, storyFlag: 'shadow_path', text: 'Dark power flows through you! Gained Shadow Blade, +60 XP, but -15 Max HP.' } },
          { id: 'resist', text: 'Resist the darkness', icon: '✨', consequence: { type: 'reward', xp: 40, statChanges: { vit: 3, def: 2 }, storyFlag: 'light_path', text: 'You resist! Your will grows stronger. +40 XP, +3 VIT, +2 DEF.' } },
          { id: 'flee', text: 'Run!', icon: '🏃', consequence: { type: 'damage', text: 'The whispers lash out as you flee! You take 15 damage!' } },
        ],
      },
    ],
  },
  mountain: {
    id: 'mountain',
    name: 'Dragon Peak',
    icon: '🏔️',
    description: 'Snow-capped and treacherous. Legends say an Ancient Dragon sleeps at the summit, guarding the Crown of Aethelgard.',
    danger: 5,
    connections: ['plains'],
    enemies: ['golem'],
    storyNodes: [
      {
        id: 'mountain_entry',
        title: '🏔️ Dragon Peak',
        text: 'The air grows thin and cold. Above the clouds, you see the dragon\'s lair — a cave wreathed in smoke.',
        choices: [
          { id: 'climb', text: 'Climb to the lair', icon: '🧗', consequence: { type: 'story', nextNodeId: 'dragon_lair', text: 'You scale the treacherous cliff face...' } },
          { id: 'golem_fight', text: 'Fight the stone golem', icon: '⚔️', consequence: { type: 'combat', enemyId: 'golem', text: 'A Stone Golem blocks the path!' } },
          { id: 'leave', text: 'Turn back', icon: '🚶', consequence: { type: 'none', text: 'The mountain will wait. You descend.' } },
        ],
        repeatable: true,
      },
      {
        id: 'dragon_lair',
        title: '🐉 The Dragon\'s Lair',
        text: 'The Ancient Dragon opens one amber eye. "Mortal," it rumbles, "why disturb my slumber?"',
        choices: [
          { id: 'fight_dragon', text: 'For glory!', icon: '⚔️', consequence: { type: 'combat', enemyId: 'dragon', storyFlag: 'fought_dragon', text: 'The dragon rises, filling the cavern with fire!' } },
          { id: 'bargain', text: 'I seek knowledge', icon: '🗣️', consequence: { type: 'reward', xp: 200, items: ['crown_of_aethelgard'], storyFlag: 'dragon_wisdom', text: 'The dragon studies you. "You are... different." It grants you the Crown of Aethelgard and 200 XP!' } },
          { id: 'flee_dragon', text: 'Wrong cave!', icon: '🏃', consequence: { type: 'combat', enemyId: 'dragon', text: 'The dragon is not amused. It attacks!' } },
        ],
      },
    ],
  },
  dungeon: {
    id: 'dungeon',
    name: 'The Void Dungeon',
    icon: '⚫',
    description: 'The final challenge. A labyrinth of darkness where the Dark Lich awaits. Only the truly prepared survive.',
    danger: 5,
    connections: ['cave', 'ruins'],
    enemies: ['lich'],
    storyNodes: [
      {
        id: 'dungeon_entry',
        title: '⚫ The Void Dungeon',
        text: 'The dungeon swallows all light. At its heart, the Dark Lich commands armies of the dead.',
        choices: [
          { id: 'descend', text: 'Descend into darkness', icon: '⬇️', consequence: { type: 'story', nextNodeId: 'lich_chamber', text: 'You descend into the abyss...' } },
          { id: 'prepare', text: 'Prepare first', icon: '🛡️', consequence: { type: 'heal', healPercent: 50, text: 'You fortify yourself. +50% HP restored.' } },
        ],
        repeatable: true,
      },
      {
        id: 'lich_chamber',
        title: '🧟 The Lich\'s Chamber',
        text: 'The Dark Lich sits on a throne of bones. "So, a hero comes to challenge me? How... quaint."',
        choices: [
          { id: 'fight_lich', text: 'This ends now!', icon: '⚔️', consequence: { type: 'combat', enemyId: 'lich', storyFlag: 'defeated_lich', text: 'The Lich raises its staff. "Then perish!"' } },
          { id: 'seal_lich', text: 'Seal him away', icon: '🔮', consequence: { type: 'reward', xp: 500, gold: 300, items: ['lich_phylactery'], storyFlag: 'sealed_lich', text: 'Using ancient magic, you seal the Lich! +500 XP, +300 gold!' } },
        ],
      },
    ],
  },
};

// --- Quests ---
export const QUESTS: Quest[] = [
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Defeat your first enemy in combat.',
    type: 'kill',
    target: 1,
    progress: 0,
    reward: { xp: 30, gold: 15 },
    completed: false,
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Visit 5 different locations.',
    type: 'explore',
    target: 5,
    progress: 1,
    reward: { xp: 80, gold: 40 },
    completed: false,
  },
  {
    id: 'treasure_hunter',
    title: 'Treasure Hunter',
    description: 'Collect 200 gold.',
    type: 'collect',
    target: 200,
    progress: 0,
    reward: { xp: 100, gold: 50 },
    completed: false,
  },
  {
    id: 'dragon_slayer',
    title: 'Dragon Slayer',
    description: 'Defeat the Ancient Dragon atop Dragon Peak.',
    type: 'kill',
    target: 1,
    progress: 0,
    reward: { xp: 300, gold: 200 },
    completed: false,
  },
  {
    id: 'lich_hunter',
    title: 'Lich Hunter',
    description: 'Defeat the Dark Lich in the Void Dungeon.',
    type: 'kill',
    target: 1,
    progress: 0,
    reward: { xp: 400, gold: 250 },
    completed: false,
  },
  {
    id: 'shadow_path',
    title: 'The Shadow Path',
    description: 'Embrace the darkness and discover its secrets.',
    type: 'choice',
    target: 1,
    progress: 0,
    reward: { xp: 150, gold: 0 },
    completed: false,
    branches: [
      { id: 'embrace', text: 'Embrace the shadows', consequence: 'Gain dark power at a cost' },
      { id: 'resist', text: 'Resist temptation', consequence: 'Prove your inner strength' },
    ],
  },
];

// --- Stat Cost Formula ---
export function getStatCost(currentValue: number): number {
  if (currentValue <= 10) return 1;
  if (currentValue <= 15) return 2;
  if (currentValue <= 20) return 3;
  return 4;
}

// --- XP Requirements ---
export function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// --- Map generation ---
export function generateWorldMap(): import('@/types/game').WorldMap {
  const width = 24;
  const height = 18;
  const tiles: import('@/types/game').MapTile[][] = [];

  // Location positions
  const locationPositions: Record<string, { x: number; y: number }> = {
    village: { x: 6, y: 8 },
    forest: { x: 11, y: 6 },
    plains: { x: 4, y: 12 },
    cave: { x: 15, y: 4 },
    ruins: { x: 18, y: 9 },
    mountain: { x: 7, y: 15 },
    dungeon: { x: 20, y: 5 },
  };

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      let type: import('@/types/game').MapTile['type'] = 'grass';
      let locationId: string | undefined;

      // Check if this is a location tile
      for (const [id, pos] of Object.entries(locationPositions)) {
        const dist = Math.abs(x - pos.x) + Math.abs(y - pos.y);
        if (dist === 0) {
          type = id === 'village' ? 'village' : 'ruins';
          locationId = id;
        } else if (dist <= 2) {
          // Area around location
          if (id === 'forest') type = 'forest';
          else if (id === 'mountain') type = 'mountain';
          else if (id === 'cave' || id === 'dungeon') type = 'mountain';
          else type = 'road';
        }
      }

      // Random terrain variation
      if (!locationId && type === 'grass') {
        const noise = Math.random();
        if (noise < 0.15) type = 'forest';
        else if (noise < 0.2) type = 'water';
        else if (noise < 0.28) type = 'mountain';
      }

      // Road connections between locations
      const roadConnections = [
        ['village', 'forest'],
        ['village', 'plains'],
        ['forest', 'cave'],
        ['forest', 'ruins'],
        ['plains', 'mountain'],
        ['cave', 'dungeon'],
        ['ruins', 'dungeon'],
      ];

      for (const [from, to] of roadConnections) {
        const fromPos = locationPositions[from];
        const toPos = locationPositions[to];
        if (fromPos && toPos) {
          // Simple line check
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const steps = Math.max(Math.abs(dx), Math.abs(dy));
          for (let s = 0; s <= steps; s++) {
            const rx = Math.round(fromPos.x + (dx * s) / steps);
            const ry = Math.round(fromPos.y + (dy * s) / steps);
            if (rx === x && ry === y && !locationId) {
              type = 'road';
            }
          }
        }
      }

      tiles[y][x] = {
        x,
        y,
        type,
        explored: false,
        locationId,
      };
    }
  }

  // Set starting position at village
  const playerX = locationPositions.village.x;
  const playerY = locationPositions.village.y;

  // Mark explored tiles around player
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const nx = playerX + dx;
      const ny = playerY + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        tiles[ny][nx].explored = true;
      }
    }
  }

  return { width, height, tiles, playerX, playerY };
}
