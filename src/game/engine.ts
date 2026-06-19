// ============================================================
// Aethelgard's Shadow — Game Engine
// ============================================================
import type { Player, Enemy, CharacterStats, InventoryItem } from '@/types/game';
import { ENEMIES, ITEMS } from '@/data/gameData';

// --- Dice rolling ---
export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

// --- Combat Calculations ---
export function calculatePhysicalDamage(attacker: { str: number; agi: number }, defender: { def: number; agi: number }, weaponBonus: number = 0): { damage: number; isCritical: boolean } {
  const critRoll = rollD20();
  const isCritical = critRoll >= (20 - Math.floor(attacker.agi / 4));
  const baseDamage = Math.max(1, Math.floor(attacker.str * 1.2 + weaponBonus + rollD6() - defender.def * 0.5));
  const damage = isCritical ? Math.floor(baseDamage * 2) : baseDamage;
  return { damage, isCritical };
}

export function calculateMagicDamage(attacker: { int: number }, defender: { def: number }, spellPower: number): number {
  return Math.max(1, Math.floor(attacker.int * spellPower + rollD6() - defender.def * 0.3));
}

export function calculateHealing(caster: { int: number }): number {
  return Math.floor(caster.int * 2 + rollD6() + 5);
}

export function canFlee(playerAgi: number, enemyAgi: number): boolean {
  const chance = Math.min(90, Math.max(20, (playerAgi / (playerAgi + enemyAgi)) * 100));
  return Math.random() * 100 < chance;
}

// --- Combat Turn Resolution ---
export function resolvePlayerAttack(player: Player, enemy: Enemy): { damage: number; isCritical: boolean; log: string } {
  const weaponBonus = player.equipment.weapon?.statBonus?.str || 0;
  const result = calculatePhysicalDamage(
    { str: player.stats.str, agi: player.stats.agi },
    { def: enemy.defense, agi: enemy.agi },
    weaponBonus
  );
  enemy.hp = Math.max(0, enemy.hp - result.damage);
  const log = result.isCritical
    ? `💥 CRITICAL! You strike for ${result.damage} damage!`
    : `You attack for ${result.damage} damage.`;
  return { ...result, log };
}

export function resolvePlayerMagic(player: Player, enemy: Enemy, spellPower: number): { damage: number; log: string } {
  const damage = calculateMagicDamage(
    { int: player.stats.int },
    { def: enemy.defense },
    spellPower
  );
  enemy.hp = Math.max(0, enemy.hp - damage);
  return { damage, log: `Your spell deals ${damage} magic damage!` };
}

export function resolveEnemyAttack(enemy: Enemy, player: Player): { damage: number; log: string } {
  const damage = Math.max(1, Math.floor(enemy.attack - player.stats.def * 0.5 - rollD6() * 0.5));
  const actualDamage = Math.max(1, damage);
  player.hp = Math.max(0, player.hp - actualDamage);
  return { damage: actualDamage, log: `${enemy.name} attacks for ${actualDamage} damage!` };
}

// --- Stat Point Allocation ---
export function allocateStatPoint(player: Player, stat: keyof CharacterStats): boolean {
  const cost = getStatCostForValue(player.stats[stat]);
  if (player.statPoints < cost) return false;
  player.statPoints -= cost;
  player.stats[stat] += 1;
  // Recalc derived stats
  recalcDerivedStats(player);
  return true;
}

export function deallocateStatPoint(player: Player, stat: keyof CharacterStats): boolean {
  if (player.stats[stat] <= player.baseStats[stat]) return false;
  player.stats[stat] -= 1;
  const refund = getStatCostForValue(player.stats[stat]);
  player.statPoints += refund;
  recalcDerivedStats(player);
  return true;
}

function getStatCostForValue(value: number): number {
  if (value <= 10) return 1;
  if (value <= 15) return 2;
  if (value <= 20) return 3;
  return 4;
}

export function recalcDerivedStats(player: Player): void {
  // Max HP = base + VIT * 8 + level * 5
  const oldMaxHp = player.maxHp;
  player.maxHp = 50 + player.stats.vit * 8 + player.level * 5;
  // Max MP = base + INT * 5 + level * 3
  player.maxMp = 20 + player.stats.int * 5 + player.level * 3;
  // Heal proportionally if max increased
  if (player.maxHp > oldMaxHp) {
    player.hp = Math.min(player.maxHp, player.hp + (player.maxHp - oldMaxHp));
  }
  // Ensure HP doesn't exceed max
  player.hp = Math.min(player.hp, player.maxHp);
  player.mp = Math.min(player.mp, player.maxMp);
}

// --- Level Up ---
export function levelUp(player: Player): void {
  player.level += 1;
  player.xp = 0;
  player.statPoints += 3; // 3 points to allocate per level
  player.maxHp += 5; // Bonus HP per level
  player.maxMp += 3; // Bonus MP per level
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  recalcDerivedStats(player);
}

// --- Inventory Management ---
export function addItem(player: Player, itemId: string, count: number = 1): void {
  const existing = player.inventory.find(i => i.id === itemId);
  if (existing && existing.type === 'consumable') {
    existing.count += count;
  } else {
    const template = ITEMS[itemId];
    if (template) {
      player.inventory.push({ ...template, count });
    }
  }
}

export function removeItem(player: Player, index: number, count: number = 1): void {
  const item = player.inventory[index];
  if (!item) return;
  item.count -= count;
  if (item.count <= 0) {
    player.inventory.splice(index, 1);
  }
}

export function equipItem(player: Player, index: number): void {
  const item = player.inventory[index];
  if (!item || item.type !== 'equipment' || !item.equipSlot) return;

  // Unequip current
  const current = player.equipment[item.equipSlot];
  if (current) {
    // Remove stat bonuses
    removeEquipBonuses(player, current);
    player.inventory.push({ ...current, count: 1 });
  }

  // Equip new
  player.equipment[item.equipSlot] = { ...item, count: 1 };
  applyEquipBonuses(player, item);
  removeItem(player, index, 1);
}

export function unequipItem(player: Player, slot: 'weapon' | 'armor' | 'accessory'): void {
  const item = player.equipment[slot];
  if (!item) return;
  removeEquipBonuses(player, item);
  player.inventory.push({ ...item, count: 1 });
  delete player.equipment[slot];
}

function applyEquipBonuses(player: Player, item: InventoryItem): void {
  if (!item.statBonus) return;
  for (const [key, value] of Object.entries(item.statBonus)) {
    if (key in player.stats && value) {
      player.stats[key] += value;
    }
  }
  recalcDerivedStats(player);
}

function removeEquipBonuses(player: Player, item: InventoryItem): void {
  if (!item.statBonus) return;
  for (const [key, value] of Object.entries(item.statBonus)) {
    if (key in player.stats && value) {
      player.stats[key] -= value;
    }
  }
  recalcDerivedStats(player);
}

// --- Loot ---
export function generateLoot(enemy: Enemy): string[] {
  const loot: string[] = [];
  for (const itemId of enemy.lootTable) {
    if (Math.random() < 0.4) {
      loot.push(itemId);
    }
  }
  // Always at least a small potion
  if (loot.length === 0) {
    loot.push('potion_small');
  }
  return loot;
}

// --- Get random enemy from location ---
export function getRandomEnemy(locationEnemyIds: string[]): Enemy {
  const id = locationEnemyIds[Math.floor(Math.random() * locationEnemyIds.length)];
  const template = ENEMIES[id];
  if (!template) return ENEMIES['wolf'];
  return { ...template, hp: template.maxHp }; // Fresh copy with full HP
}

// --- Auto-distribute stat points ---
export function autoDistributeStats(player: Player): void {
  const priorities: (keyof CharacterStats)[] = player.class === 'warrior'
    ? ['str', 'vit', 'def', 'agi', 'int']
    : player.class === 'mage'
    ? ['int', 'vit', 'agi', 'def', 'str']
    : ['agi', 'str', 'vit', 'def', 'int'];

  while (player.statPoints > 0) {
    let spent = false;
    for (const stat of priorities) {
      const cost = getStatCostForValue(player.stats[stat]);
      if (player.statPoints >= cost) {
        player.statPoints -= cost;
        player.stats[stat] += 1;
        spent = true;
        break;
      }
    }
    if (!spent) break;
  }
  recalcDerivedStats(player);
}
