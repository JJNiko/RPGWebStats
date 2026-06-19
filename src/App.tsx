import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { GameScreen, Player, GameState, Toast, WorldMap, CharacterClass, CombatState } from '@/types/game';
import { CLASS_STATS, LOCATIONS, QUESTS, SHOP_ITEMS, ITEMS, ENEMIES, getStatCost, getXpForLevel, generateWorldMap, CLASS_ABILITIES, ABILITIES } from '@/data/gameData';
import { resolvePlayerAttack, resolvePlayerMagic, resolveEnemyAttack, canFlee, levelUp, allocateStatPoint, deallocateStatPoint, addItem, removeItem, equipItem, unequipItem, generateLoot, getRandomEnemy, autoDistributeStats, recalcDerivedStats } from '@/game/engine';
import './App.css';

// ============================================================
// INITIAL STATE
// ============================================================
function createInitialState(): GameState {
  return {
    screen: 'title',
    player: null,
    currentLocation: 'village',
    currentNodeId: null,
    combat: null,
    showInventory: false,
    showQuests: false,
    showMap: false,
    toast: null,
    saveSlot: 'slot1',
  };
}

// ============================================================
// SAVE / LOAD
// ============================================================
function saveGame(state: GameState): void {
  if (!state.player) return;
  const saveData = {
    player: state.player,
    currentLocation: state.currentLocation,
    currentNodeId: state.currentNodeId,
    storyChoices: state.player.storyChoices,
    questsCompleted: state.player.questsCompleted,
    timestamp: Date.now(),
  };
  localStorage.setItem(`aethelgard_save_${state.saveSlot}`, JSON.stringify(saveData));
}

function loadGame(slot: string): Partial<GameState> | null {
  const raw = localStorage.getItem(`aethelgard_save_${slot}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch { return null; }
}

function hasSave(slot: string): boolean {
  return !!localStorage.getItem(`aethelgard_save_${slot}`);
}

// ============================================================
// TOAST
// ============================================================
function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success', duration = 3000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, duration });
    const timeoutId = setTimeout(() => setToast(null), duration);
    timerRef.current = timeoutId;
  }, []);

  return { toast, showToast };
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [charName, setCharName] = useState('');
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [currentStory, setCurrentStory] = useState<{ title: string; text: string } | null>(null);
  const { toast, showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }>>([]);

  // --- Check for save on load ---
  useEffect(() => {
    const save = loadGame('slot1');
    if (save && save.player) {
      // Show continue option
    }
  }, []);

  // --- Auto-save ---
  useEffect(() => {
    if (state.player && state.screen !== 'title' && state.screen !== 'characterCreation') {
      saveGame(state);
    }
  }, [state]);

  // ============================================================
  // TITLE SCREEN — Canvas particle animation
  // ============================================================
  useEffect(() => {
    if (state.screen !== 'title' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    // Initialize particles
    particlesRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: h + Math.random() * 200,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.3 - Math.random() * 0.6,
      life: 0,
      maxLife: 200 + Math.random() * 150,
      size: 2 + Math.random() * 3,
    }));

    const animate = () => {
      ctx.fillStyle = '#050E1A';
      ctx.fillRect(0, 0, w, h);

      // Draw faint ruins silhouette
      ctx.fillStyle = 'rgba(74, 222, 128, 0.03)';
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h);
      ctx.lineTo(w * 0.25, h * 0.6);
      ctx.lineTo(w * 0.35, h * 0.55);
      ctx.lineTo(w * 0.4, h * 0.65);
      ctx.lineTo(w * 0.45, h * 0.5);
      ctx.lineTo(w * 0.55, h * 0.5);
      ctx.lineTo(w * 0.6, h * 0.65);
      ctx.lineTo(w * 0.75, h * 0.6);
      ctx.lineTo(w * 0.8, h);
      ctx.closePath();
      ctx.fill();

      // Draw particles
      for (const p of particlesRef.current) {
        p.x += p.vx + Math.sin(p.life * 0.02) * 0.3;
        p.y += p.vy;
        p.life++;

        const alpha = p.life < 30 ? p.life / 30 : p.life > p.maxLife - 60 ? (p.maxLife - p.life) / 60 : 1;
        ctx.fillStyle = `rgba(74, 222, 128, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) {
          p.x = Math.random() * w;
          p.y = h + 10;
          p.life = 0;
          p.vy = -0.3 - Math.random() * 0.6;
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [state.screen]);

  // ============================================================
  // WORLD MAP CANVAS
  // ============================================================
  useEffect(() => {
    if (state.screen !== 'exploration' || !canvasRef.current || !worldMap) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const tileSize = 32;
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;

    const cameraX = worldMap.playerX * tileSize - w / 2 + tileSize / 2;
    const cameraY = worldMap.playerY * tileSize - h / 2 + tileSize / 2;

    const animate = () => {
      ctx.fillStyle = '#050E1A';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(-cameraX, -cameraY);

      // Draw tiles
      for (let y = 0; y < worldMap.height; y++) {
        for (let x = 0; x < worldMap.width; x++) {
          const tile = worldMap.tiles[y][x];
          if (!tile.explored) {
            ctx.fillStyle = '#050E1A';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            continue;
          }

          // Draw terrain
          switch (tile.type) {
            case 'grass':
              ctx.fillStyle = '#0F1F14';
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              ctx.fillStyle = '#1A3A2A';
              ctx.fillRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
              break;
            case 'forest':
              ctx.fillStyle = '#0F1F14';
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              ctx.fillStyle = '#0F291E';
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              // Tree
              ctx.fillStyle = '#1A4A2E';
              ctx.beginPath();
              ctx.moveTo(x * tileSize + tileSize / 2, y * tileSize + 4);
              ctx.lineTo(x * tileSize + tileSize - 4, y * tileSize + tileSize - 4);
              ctx.lineTo(x * tileSize + 4, y * tileSize + tileSize - 4);
              ctx.closePath();
              ctx.fill();
              break;
            case 'water':
              ctx.fillStyle = '#0A1622';
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
              ctx.fillRect(x * tileSize, y * tileSize + tileSize * 0.6 + Math.sin(Date.now() * 0.002 + x) * 3, tileSize, 2);
              break;
            case 'mountain':
              ctx.fillStyle = '#1A1A2E';
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              ctx.fillStyle = '#2D3748';
              ctx.beginPath();
              ctx.moveTo(x * tileSize + tileSize / 2, y * tileSize + 2);
              ctx.lineTo(x * tileSize + tileSize - 2, y * tileSize + tileSize - 2);
              ctx.lineTo(x * tileSize + 2, y * tileSize + tileSize - 2);
              ctx.closePath();
              ctx.fill();
              break;
            case 'ruins':
              ctx.fillStyle = '#0F1F14';
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              // Broken wall
              ctx.fillStyle = '#3D4A3A';
              ctx.fillRect(x * tileSize + 4, y * tileSize + 4, tileSize - 8, 4);
              ctx.fillRect(x * tileSize + 4, y * tileSize + tileSize - 8, 8, 4);
              break;
            case 'road':
              ctx.fillStyle = '#1F1A14';
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              ctx.fillStyle = '#2D2518';
              ctx.fillRect(x * tileSize + 4, y * tileSize + 4, tileSize - 8, tileSize - 8);
              break;
            case 'village':
              ctx.fillStyle = '#0F1F14';
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              ctx.fillStyle = '#2A3A1A';
              ctx.fillRect(x * tileSize + 4, y * tileSize + 8, tileSize - 8, tileSize - 12);
              ctx.fillStyle = '#4A5A2A';
              ctx.fillRect(x * tileSize + 6, y * tileSize + 4, 6, 6);
              break;
          }

          // Fog overlay for explored but distant tiles
          const playerDist = Math.abs(x - worldMap.playerX) + Math.abs(y - worldMap.playerY);
          if (playerDist > 3) {
            ctx.fillStyle = 'rgba(5, 14, 26, 0.6)';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          }

          // Location icons
          if (tile.locationId) {
            const loc = LOCATIONS[tile.locationId];
            if (loc) {
              ctx.font = '18px serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(loc.icon, x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
            }
          }
        }
      }

      // Draw player
      const px = worldMap.playerX * tileSize + tileSize / 2;
      const py = worldMap.playerY * tileSize + tileSize / 2;
      ctx.shadowColor = '#4ADE80';
      ctx.shadowBlur = 15;
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡️', px, py);
      ctx.shadowBlur = 0;

      // Draw connection lines
      const currentLoc = LOCATIONS[state.currentLocation];
      if (currentLoc) {
        const locPos = {
          village: { x: 6, y: 8 }, forest: { x: 11, y: 6 }, plains: { x: 4, y: 12 },
          cave: { x: 15, y: 4 }, ruins: { x: 18, y: 9 }, mountain: { x: 7, y: 15 }, dungeon: { x: 20, y: 5 },
        };
        const fromPos = locPos[state.currentLocation as keyof typeof locPos];
        if (fromPos) {
          for (const connId of currentLoc.connections) {
            const toPos = locPos[connId as keyof typeof locPos];
            if (toPos) {
              ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.moveTo(fromPos.x * tileSize + tileSize / 2, fromPos.y * tileSize + tileSize / 2);
              ctx.lineTo(toPos.x * tileSize + tileSize / 2, toPos.y * tileSize + tileSize / 2);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state.screen, worldMap, state.currentLocation]);

  // ============================================================
  // COMBAT LOGIC
  // ============================================================
  const startCombat = useCallback((enemyId: string) => {
    if (!state.player) return;
    const enemy = enemyId === 'random'
      ? getRandomEnemy(LOCATIONS[state.currentLocation].enemies)
      : { ...ENEMIES[enemyId], hp: ENEMIES[enemyId].maxHp };

    if (!enemy) return;

    const combat: CombatState = {
      enemy,
      round: 1,
      log: [`A ${enemy.name} appears!`],
      isPlayerTurn: true,
      fleeAttempted: false,
    };

    setState(s => ({ ...s, screen: 'combat', combat }));
    setCombatLog(combat.log);
  }, [state.player, state.currentLocation]);

  const executeCombatAction = useCallback((action: string, abilityId?: string) => {
    if (!state.player || !state.combat) return;
    const player = { ...state.player };
    const combat = { ...state.combat, enemy: { ...state.combat.enemy } };
    const newLog = [...combatLog];

    if (!combat.isPlayerTurn) return;

    switch (action) {
      case 'attack': {
        const result = resolvePlayerAttack(player, combat.enemy);
        newLog.push(result.log);
        if (result.isCritical) {
          setShake(true);
          setTimeout(() => setShake(false), 300);
        }
        break;
      }
      case 'magic': {
        if (abilityId) {
          const ability = ABILITIES.find(a => a.id === abilityId);
          if (ability && player.mp >= ability.mpCost) {
            player.mp -= ability.mpCost;
            if (ability.type === 'heal') {
              const healAmount = Math.floor(player.stats.int * 2 + Math.random() * 10 + 5);
              player.hp = Math.min(player.maxHp, player.hp + healAmount);
              newLog.push(`💚 Healed for ${healAmount} HP!`);
            } else if (ability.type === 'magical') {
              const result = resolvePlayerMagic(player, combat.enemy, ability.power);
              newLog.push(`${ability.name} deals ${result.damage} damage!`);
            } else if (ability.type === 'buff') {
              newLog.push(`Used ${ability.name}!`);
            }
          } else {
            showToast('Not enough MP!', 'error');
            return;
          }
        } else {
          showToast('Select a spell!', 'error');
          return;
        }
        break;
      }
      case 'heal': {
        if (player.mp >= 15) {
          player.mp -= 15;
          const healAmount = Math.floor(player.stats.int * 2 + Math.random() * 10 + 5);
          player.hp = Math.min(player.maxHp, player.hp + healAmount);
          newLog.push(`💚 Healed for ${healAmount} HP!`);
        } else {
          showToast('Not enough MP!', 'error');
          return;
        }
        break;
      }
      case 'flee': {
        if (canFlee(player.stats.agi, combat.enemy.agi)) {
          newLog.push('You escaped!');
          setState(s => ({ ...s, screen: 'exploration', combat: null, player }));
          setCombatLog([]);
          showToast('Escaped successfully!');
          return;
        } else {
          newLog.push('Failed to escape!');
        }
        break;
      }
    }

    // Check enemy defeated
    if (combat.enemy.hp <= 0) {
      const xpGain = combat.enemy.xp;
      const goldGain = combat.enemy.gold;
      player.xp += xpGain;
      player.gold += goldGain;
      newLog.push(`Victory! +${xpGain} XP, +${goldGain} gold`);

      // Loot
      const loot = generateLoot(combat.enemy);
      for (const itemId of loot) {
        addItem(player, itemId);
        const itemName = ITEMS[itemId]?.name || itemId;
        newLog.push(`Loot: ${itemName}`);
      }

      // Check quests
      if (combat.enemy.id === 'dragon') {
        player.questsCompleted.push('dragon_slayer');
        showToast('Quest: Dragon Slayer completed!', 'loot');
      }
      if (combat.enemy.id === 'lich') {
        player.questsCompleted.push('lich_hunter');
        showToast('Quest: Lich Hunter completed!', 'loot');
      }
      if (!player.questsCompleted.includes('first_blood')) {
        player.questsCompleted.push('first_blood');
        player.xp += 30;
        player.gold += 15;
        showToast('Quest: First Blood completed! +30 XP', 'loot');
      }

      // Check level up
      let screen: GameScreen = 'exploration';
      while (player.xp >= player.maxXp) {
        player.xp -= player.maxXp;
        levelUp(player);
        player.maxXp = getXpForLevel(player.level);
        newLog.push(`🎉 LEVEL UP! You are now level ${player.level}!`);
        screen = 'levelUp';
        confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 }, colors: ['#4ADE80', '#F59E0B'] });
      }

      setState(s => ({ ...s, screen, combat: screen === 'exploration' ? null : s.combat, player }));
      setCombatLog(newLog);
      if (screen === 'exploration') {
        showToast(`Victory! +${xpGain} XP, +${goldGain}g`, 'success');
      }
      return;
    }

    // Enemy turn
    combat.isPlayerTurn = false;
    setState(s => ({ ...s, player, combat }));
    setCombatLog(newLog);

    setTimeout(() => {
      const enemyResult = resolveEnemyAttack(combat.enemy, player);
      const finalLog = [...newLog, enemyResult.log];
      combat.round += 1;
      combat.isPlayerTurn = true;

      if (player.hp <= 0) {
        player.hp = 0;
        setState(s => ({ ...s, player, screen: 'gameOver', combat: null }));
        setCombatLog(finalLog);
        return;
      }

      setState(s => ({ ...s, player, combat: { ...combat } }));
      setCombatLog(finalLog);
    }, 800);
  }, [state.player, state.combat, combatLog, showToast]);

  // ============================================================
  // CHARACTER CREATION
  // ============================================================
  const createCharacter = useCallback(() => {
    if (!selectedClass || !charName.trim()) {
      showToast('Enter a name and choose a class!', 'error');
      return;
    }

    const classData = CLASS_STATS[selectedClass];
    const startingAbilities = CLASS_ABILITIES[selectedClass]
      .map(id => ABILITIES.find(a => a.id === id))
      .filter((a): a is NonNullable<typeof a> => a !== undefined);

    const player: Player = {
      name: charName.trim(),
      class: selectedClass,
      level: 1,
      xp: 0,
      maxXp: 100,
      hp: classData.hp,
      maxHp: classData.hp,
      mp: classData.mp,
      maxMp: classData.mp,
      stats: { ...classData.stats },
      baseStats: { ...classData.stats },
      statPoints: 0,
      gold: 20,
      inventory: [
        { ...ITEMS.potion_small, count: 3 },
        { ...ITEMS.ether, count: 2 },
      ],
      equipment: {},
      abilities: startingAbilities,
      visitedLocations: ['village'],
      storyChoices: {},
      questsCompleted: [],
    };

    const map = generateWorldMap();
    setWorldMap(map);
    setState(s => ({ ...s, screen: 'exploration', player, currentLocation: 'village' }));
    showToast(`Welcome, ${player.name} the ${selectedClass}!`, 'success');
  }, [selectedClass, charName, showToast]);

  // ============================================================
  // STORY / EXPLORATION ACTIONS
  // ============================================================
  const handleStoryChoice = useCallback((consequence: import('@/types/game').Consequence) => {
    if (!state.player) return;
    const player = { ...state.player };

    // Apply consequence
    if (consequence.xp) {
      player.xp += consequence.xp;
      showToast(`+${consequence.xp} XP`, 'success');
    }
    if (consequence.gold) {
      player.gold += consequence.gold;
      showToast(`+${consequence.gold} gold`, 'loot');
    }
    if (consequence.items) {
      for (const itemId of consequence.items) {
        addItem(player, itemId);
        const itemName = ITEMS[itemId]?.name || itemId;
        showToast(`Found: ${itemName}`, 'loot');
      }
    }
    if (consequence.statChanges) {
      for (const [key, value] of Object.entries(consequence.statChanges)) {
        if (value && key in player.stats) {
          (player.stats as Record<string, number>)[key] += value;
        }
      }
      recalcDerivedStats(player);
    }
    if (consequence.maxHpChange) {
      player.maxHp += consequence.maxHpChange;
      player.hp = Math.min(player.hp, player.maxHp);
    }
    if (consequence.storyFlag) {
      player.storyChoices[consequence.storyFlag] = 'taken';
    }
    if (consequence.healPercent) {
      const healAmount = Math.floor(player.maxHp * consequence.healPercent / 100);
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      player.mp = player.maxMp;
      showToast(`Restored ${consequence.healPercent}% HP!`, 'success');
    }
    if (consequence.damage) {
      // For flee damage etc
    }

    // Check level up
    let screen: GameScreen = 'exploration';
    while (player.xp >= player.maxXp) {
      player.xp -= player.maxXp;
      levelUp(player);
      player.maxXp = getXpForLevel(player.level);
      confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 }, colors: ['#4ADE80', '#F59E0B'] });
      screen = 'levelUp';
    }

    if (consequence.type === 'combat' && consequence.enemyId) {
      setState(s => ({ ...s, player }));
      setCurrentStory(null);
      startCombat(consequence.enemyId);
      return;
    }

    if (consequence.type === 'shop') {
      setShowShop(true);
      setState(s => ({ ...s, player, screen }));
      return;
    }

    if (consequence.nextNodeId) {
      const location = LOCATIONS[state.currentLocation];
      const nextNode = location.storyNodes.find(n => n.id === consequence.nextNodeId);
      if (nextNode) {
        setState(s => ({ ...s, player, screen }));
        setCurrentStory({ title: nextNode.title, text: nextNode.text });
        return;
      }
    }

    setState(s => ({ ...s, player, screen }));
    setCurrentStory(null);
  }, [state.player, state.currentLocation, showToast, startCombat]);

  // ============================================================
  // TRAVEL
  // ============================================================
  const travelTo = useCallback((locationId: string) => {
    if (!state.player || !worldMap) return;
    const player = { ...state.player };

    if (!player.visitedLocations.includes(locationId)) {
      player.visitedLocations.push(locationId);
      // Check explorer quest
      if (player.visitedLocations.length >= 5 && !player.questsCompleted.includes('explorer')) {
        player.questsCompleted.push('explorer');
        player.xp += 80;
        player.gold += 40;
        showToast('Quest: Explorer completed! +80 XP', 'loot');
      }
    }

    // Update world map player position
    const locPositions: Record<string, { x: number; y: number }> = {
      village: { x: 6, y: 8 }, forest: { x: 11, y: 6 }, plains: { x: 4, y: 12 },
      cave: { x: 15, y: 4 }, ruins: { x: 18, y: 9 }, mountain: { x: 7, y: 15 }, dungeon: { x: 20, y: 5 },
    };
    const newPos = locPositions[locationId];
    if (newPos) {
      const newMap = { ...worldMap, tiles: worldMap.tiles.map(row => row.map(t => ({ ...t }))) };
      newMap.playerX = newPos.x;
      newMap.playerY = newPos.y;
      // Explore around new position
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const nx = newPos.x + dx;
          const ny = newPos.y + dy;
          if (nx >= 0 && nx < newMap.width && ny >= 0 && ny < newMap.height) {
            newMap.tiles[ny][nx].explored = true;
          }
        }
      }
      setWorldMap(newMap);
    }

    // Random encounter chance
    const location = LOCATIONS[locationId];
    const encounterChance = 0.2 + (location.danger * 0.1);

    setState(s => ({ ...s, player, currentLocation: locationId }));
    setCurrentStory(null);
    showToast(`Traveled to ${location.name}`);

    if (location.enemies.length > 0 && Math.random() < encounterChance) {
      setTimeout(() => startCombat('random'), 800);
    }
  }, [state.player, worldMap, startCombat, showToast]);

  // ============================================================
  // SHOP
  // ============================================================
  const buyItem = useCallback((itemId: string) => {
    if (!state.player) return;
    const item = ITEMS[itemId];
    if (!item) return;
    if (state.player.gold < item.price) {
      showToast('Not enough gold!', 'error');
      return;
    }
    const player = { ...state.player, gold: state.player.gold - item.price };
    addItem(player, itemId);
    setState(s => ({ ...s, player }));
    showToast(`Bought ${item.name}!`, 'success');
  }, [state.player, showToast]);

  // ============================================================
  // USE ITEM
  // ============================================================
  const useItemHandler = useCallback((index: number) => {
    if (!state.player) return;
    const player = { ...state.player };
    const item = player.inventory[index];
    if (!item) return;

    if (item.type === 'equipment') {
      equipItem(player, index);
      setState(s => ({ ...s, player }));
      showToast(`Equipped ${item.name}!`, 'success');
      return;
    }

    if (item.type === 'consumable') {
      if (item.effect === 'heal') {
        const healAmount = item.value || 20;
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        showToast(`+${healAmount} HP`, 'success');
      } else if (item.effect === 'mana') {
        const manaAmount = item.value || 25;
        player.mp = Math.min(player.maxMp, player.mp + manaAmount);
        showToast(`+${manaAmount} MP`, 'success');
      } else if (item.effect === 'xp') {
        const xpAmount = item.value || 50;
        player.xp += xpAmount;
        showToast(`+${xpAmount} XP!`, 'success');
      }
      removeItem(player, index, 1);

      // Check level up
      let screen: GameScreen = state.screen;
      while (player.xp >= player.maxXp) {
        player.xp -= player.maxXp;
        levelUp(player);
        player.maxXp = getXpForLevel(player.level);
        confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 }, colors: ['#4ADE80', '#F59E0B'] });
        screen = 'levelUp';
      }

      setState(s => ({ ...s, player, screen }));
    }
  }, [state.player, state.screen, showToast]);

  // ============================================================
  // RENDER SCREENS
  // ============================================================

  // --- TITLE SCREEN ---
  if (state.screen === 'title') {
    const canContinue = hasSave('slot1');
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <h1 className="text-5xl md:text-6xl font-bold tracking-wider text-[#4ADE80] mb-2"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', textShadow: '0 0 30px rgba(74,222,128,0.3)' }}>
            Aethelgard's Shadow
          </h1>
          <p className="text-[#64748B] text-base mb-12" style={{ fontFamily: 'Crimson Text, Georgia, serif' }}>
            A Dark Fantasy RPG
          </p>
          <div className="flex flex-col gap-3 w-56">
            <button
              onClick={() => setState(s => ({ ...s, screen: 'characterCreation' }))}
              className="py-3 px-6 border border-[#4ADE80] text-[#4ADE80] text-sm uppercase tracking-widest font-semibold rounded-sm
                         hover:bg-[#4ADE80] hover:text-[#050E1A] transition-all duration-200 active:scale-95"
            >
              ⚔️ New Game
            </button>
            {canContinue && (
              <button
                onClick={() => {
                  const save = loadGame('slot1');
                  if (save && save.player) {
                    const map = generateWorldMap();
                    const positions: Record<string, { x: number; y: number }> = {
                      village: { x: 6, y: 8 }, forest: { x: 11, y: 6 }, plains: { x: 4, y: 12 },
                      cave: { x: 15, y: 4 }, ruins: { x: 18, y: 9 }, mountain: { x: 7, y: 15 }, dungeon: { x: 20, y: 5 },
                    };
                    // Restore explored tiles
                    for (const locId of save.player.visitedLocations) {
                      const pos = positions[locId];
                      if (pos) {
                        for (let dy = -3; dy <= 3; dy++) {
                          for (let dx = -3; dx <= 3; dx++) {
                            const nx = pos.x + dx;
                            const ny = pos.y + dy;
                            if (nx >= 0 && nx < map.width && ny >= 0 && ny < map.height) {
                              map.tiles[ny][nx].explored = true;
                            }
                          }
                        }
                      }
                    }
                    const currentPos = positions[save.currentLocation || 'village'];
                    if (currentPos) {
                      map.playerX = currentPos.x;
                      map.playerY = currentPos.y;
                    }
                    setWorldMap(map);
                    setState(s => ({ ...s, screen: 'exploration', player: save.player as Player, currentLocation: save.currentLocation || 'village' }));
                    showToast('Game loaded!');
                  }
                }}
                className="py-3 px-6 border border-[#64748B] text-[#64748B] text-sm uppercase tracking-widest font-semibold rounded-sm
                           hover:border-[#4ADE80] hover:text-[#4ADE80] transition-all duration-200 active:scale-95"
              >
                📜 Continue
              </button>
            )}
          </div>
          <p className="absolute bottom-4 right-4 text-[10px] text-[#64748B]">v1.0</p>
        </div>
      </div>
    );
  }

  // --- CHARACTER CREATION ---
  if (state.screen === 'characterCreation') {
    const classes: { id: CharacterClass; name: string; icon: string; image: string }[] = [
      { id: 'warrior', name: 'WARRIOR', icon: '⚔️', image: '/assets/warrior.png' },
      { id: 'mage', name: 'MAGE', icon: '🔮', image: '/assets/mage.png' },
      { id: 'rogue', name: 'ROGUE', icon: '🗡️', image: '/assets/rogue.png' },
    ];

    return (
      <div className="w-full h-screen overflow-auto" style={{ background: '#050E1A' }}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-[#4ADE80] mb-2 text-center" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
            Forge Your Hero
          </h2>
          <p className="text-[#64748B] text-center mb-8">Choose your path wisely, adventurer.</p>

          {/* Name Input */}
          <div className="max-w-md mx-auto mb-10">
            <label className="block text-xs uppercase tracking-widest text-[#64748B] mb-2">Character Name</label>
            <input
              type="text"
              value={charName}
              onChange={e => setCharName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full py-3 px-4 bg-[#0A1628] border border-[#2E5C4F] text-[#E2E8F0] rounded-sm
                         focus:outline-none focus:border-[#4ADE80] transition-colors"
              style={{ fontFamily: 'Crimson Text, Georgia, serif', fontSize: '16px' }}
            />
          </div>

          {/* Class Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {classes.map(cls => {
              const stats = CLASS_STATS[cls.id];
              const isSelected = selectedClass === cls.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`relative p-5 rounded-sm border transition-all duration-300 text-left
                    ${isSelected ? 'border-[#4ADE80] shadow-[0_0_20px_rgba(74,222,128,0.2)]' : 'border-[#2E5C4F] hover:border-[#4ADE80]/50'}
                    active:scale-[0.98]`}
                  style={{ background: 'rgba(5, 14, 26, 0.95)' }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img src={cls.image} alt={cls.name} className="w-16 h-20 object-contain" />
                    <div>
                      <div className="text-2xl mb-1">{cls.icon}</div>
                      <h3 className="text-lg font-bold text-[#E2E8F0] tracking-wider">{cls.name}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B] mb-4 leading-relaxed">{stats.description}</p>
                  <div className="space-y-1.5 text-xs">
                    {(['str', 'agi', 'int', 'vit', 'def'] as const).map(stat => (
                      <div key={stat} className="flex justify-between items-center">
                        <span className="text-[#64748B] uppercase tracking-wider">{stat}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-[#0A1628] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(stats.stats[stat] / 20) * 100}%`,
                                background: stat === 'str' ? '#EF4444' : stat === 'agi' ? '#F59E0B' : stat === 'int' ? '#3B82F6' : stat === 'vit' ? '#4ADE80' : '#64748B'
                              }}
                            />
                          </div>
                          <span className="text-[#E2E8F0] font-bold w-5 text-right">{stats.stats[stat]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-[#64748B]">
                    <span>HP: <strong className="text-[#4ADE80]">{stats.hp}</strong></span>
                    <span>MP: <strong className="text-[#3B82F6]">{stats.mp}</strong></span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Begin Button */}
          <div className="text-center">
            <button
              onClick={createCharacter}
              disabled={!selectedClass || !charName.trim()}
              className={`py-4 px-12 text-sm uppercase tracking-widest font-bold rounded-sm transition-all duration-200
                ${selectedClass && charName.trim()
                  ? 'border border-[#4ADE80] text-[#4ADE80] hover:bg-[#4ADE80] hover:text-[#050E1A] active:scale-95'
                  : 'border border-[#2E5C4F] text-[#64748B] cursor-not-allowed'}`}
            >
              Begin Journey
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- GAME OVER ---
  if (state.screen === 'gameOver') {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center" style={{ background: '#050E1A' }}>
        <h1 className="text-5xl font-bold text-[#EF4444] mb-4" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
          You Have Fallen
        </h1>
        <p className="text-[#64748B] mb-2">{state.player?.name || 'The hero'} lies defeated in the darkness.</p>
        <p className="text-[#64748B] mb-8">Reached Level {state.player?.level || 1}</p>
        <div className="flex gap-4">
          <button
            onClick={() => {
              localStorage.removeItem('aethelgard_save_slot1');
              setState(createInitialState());
              setWorldMap(null);
              setSelectedClass(null);
              setCharName('');
            }}
            className="py-3 px-8 border border-[#4ADE80] text-[#4ADE80] text-sm uppercase tracking-widest font-semibold rounded-sm
                       hover:bg-[#4ADE80] hover:text-[#050E1A] transition-all duration-200 active:scale-95"
          >
            ⚔️ New Game
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN GAME (EXPLORATION / COMBAT / LEVELUP) ---
  const player = state.player!;
  const currentLoc = LOCATIONS[state.currentLocation];
  const hpPercent = (player.hp / player.maxHp) * 100;
  const mpPercent = (player.mp / player.maxMp) * 100;
  const xpPercent = (player.xp / player.maxXp) * 100;

  return (
    <div className={`w-full h-screen flex flex-col overflow-hidden ${shake ? 'animate-shake' : ''}`} style={{ background: '#050E1A' }}>
      {/* ============ HUD ============ */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2E5C4F]" style={{ background: 'rgba(5, 14, 26, 0.95)', height: '56px' }}>
        {/* Left: Name + Level */}
        <div className="flex items-center gap-3">
          <span className="text-xl">
            {player.class === 'warrior' ? '⚔️' : player.class === 'mage' ? '🔮' : '🗡️'}
          </span>
          <div>
            <span className="text-sm font-bold text-[#E2E8F0]">{player.name}</span>
            <span className="text-xs text-[#64748B] ml-2">Lv.{player.level}</span>
          </div>
        </div>

        {/* Center: HP/MP Bars */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#EF4444] font-bold uppercase tracking-wider">HP</span>
            <div className="w-32 h-2.5 bg-[#0A1628] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#EF4444] to-[#f87171] rounded-full transition-all duration-500" style={{ width: `${hpPercent}%` }} />
            </div>
            <span className="text-xs text-[#E2E8F0] font-mono">{player.hp}/{player.maxHp}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#3B82F6] font-bold uppercase tracking-wider">MP</span>
            <div className="w-24 h-2.5 bg-[#0A1628] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full transition-all duration-500" style={{ width: `${mpPercent}%` }} />
            </div>
            <span className="text-xs text-[#E2E8F0] font-mono">{player.mp}/{player.maxMp}</span>
          </div>
        </div>

        {/* Right: Gold + Location */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#F59E0B] font-bold">💰 {player.gold}g</span>
          <span className="text-[#64748B]">🗺️ {currentLoc.name}</span>
          <button onClick={() => setState(s => ({ ...s, showInventory: !s.showInventory, showQuests: false }))}
            className="text-[#64748B] hover:text-[#4ADE80] transition-colors">🎒</button>
          <button onClick={() => setState(s => ({ ...s, showQuests: !s.showQuests, showInventory: false }))}
            className="text-[#64748B] hover:text-[#4ADE80] transition-colors">📜</button>
        </div>
      </div>

      {/* ============ MAIN AREA ============ */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Canvas */}
        <canvas ref={canvasRef} className="flex-1" style={{ background: '#050E1A' }} />

        {/* Screen Shake wrapper */}
        <div className={`absolute inset-0 pointer-events-none ${shake ? 'animate-shake' : ''}`} />

        {/* ============ COMBAT OVERLAY ============ */}
        {state.screen === 'combat' && state.combat && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(5, 14, 26, 0.92)' }}>
            {/* Combat Header */}
            <div className="flex items-center justify-between w-full max-w-2xl px-8 mb-6">
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {player.class === 'warrior' ? '⚔️' : player.class === 'mage' ? '🔮' : '🗡️'}
                </div>
                <p className="text-sm font-bold text-[#E2E8F0]">{player.name}</p>
                <div className="w-40 h-3 bg-[#0A1628] rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-[#4ADE80] rounded-full transition-all" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
                </div>
                <p className="text-xs text-[#64748B] mt-1">{player.hp}/{player.maxHp} HP</p>
                <div className="w-32 h-2 bg-[#0A1628] rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-[#3B82F6] rounded-full transition-all" style={{ width: `${(player.mp / player.maxMp) * 100}%` }} />
                </div>
                <p className="text-xs text-[#64748B]">{player.mp}/{player.maxMp} MP</p>
              </div>

              <div className="text-center">
                <p className="text-xs text-[#64748B] uppercase tracking-widest mb-2">VS</p>
                <p className="text-xs text-[#F59E0B]">Round {state.combat.round}</p>
              </div>

              <div className="text-center">
                <img src={state.combat.enemy.image} alt={state.combat.enemy.name}
                  className="w-20 h-20 object-contain mx-auto mb-2" />
                <p className="text-sm font-bold text-[#EF4444]">{state.combat.enemy.name}</p>
                <div className="w-40 h-3 bg-[#0A1628] rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-[#EF4444] rounded-full transition-all" style={{ width: `${(state.combat.enemy.hp / state.combat.enemy.maxHp) * 100}%` }} />
                </div>
                <p className="text-xs text-[#64748B] mt-1">{state.combat.enemy.hp}/{state.combat.enemy.maxHp} HP</p>
              </div>
            </div>

            {/* Combat Log */}
            <div className="w-full max-w-2xl mx-4 mb-6 p-4 rounded-sm border border-[#2E5C4F]"
              style={{ background: 'rgba(5, 14, 26, 0.95)', maxHeight: '150px', overflowY: 'auto' }}>
              {combatLog.slice(-6).map((entry, i) => (
                <p key={i} className={`text-sm py-0.5 ${entry.includes('CRITICAL') ? 'text-[#F59E0B] font-bold' : entry.includes('Victory') ? 'text-[#4ADE80] font-bold' : entry.includes('attacks') ? 'text-[#EF4444]' : 'text-[#E2E8F0]'}`}>
                  {entry}
                </p>
              ))}
            </div>

            {/* Combat Actions */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-2xl px-4">
              <button
                onClick={() => executeCombatAction('attack')}
                disabled={!state.combat.isPlayerTurn}
                className="py-4 border border-[#EF4444] text-[#EF4444] rounded-sm text-sm uppercase tracking-wider font-bold
                           hover:bg-[#EF4444] hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ⚔️ Attack
              </button>
              <button
                onClick={() => {
                  // Quick magic - use most powerful available spell
                  const availableSpells = player.abilities
                    .filter(a => a.type === 'magical' && a.mpCost <= player.mp)
                    .sort((a, b) => b.power - a.power);
                  if (availableSpells.length > 0) {
                    executeCombatAction('magic', availableSpells[0].id);
                  } else if (player.mp >= 10) {
                    executeCombatAction('magic', 'arcane_bolt');
                  } else {
                    showToast('Not enough MP!', 'error');
                  }
                }}
                disabled={!state.combat.isPlayerTurn || player.mp < 10}
                className="py-4 border border-[#3B82F6] text-[#3B82F6] rounded-sm text-sm uppercase tracking-wider font-bold
                           hover:bg-[#3B82F6] hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🔮 Spell
              </button>
              <button
                onClick={() => executeCombatAction('heal')}
                disabled={!state.combat.isPlayerTurn || player.mp < 15}
                className="py-4 border border-[#4ADE80] text-[#4ADE80] rounded-sm text-sm uppercase tracking-wider font-bold
                           hover:bg-[#4ADE80] hover:text-[#050E1A] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                💚 Heal
              </button>
              <button
                onClick={() => executeCombatAction('flee')}
                disabled={!state.combat.isPlayerTurn}
                className="py-4 border border-[#64748B] text-[#64748B] rounded-sm text-sm uppercase tracking-wider font-bold
                           hover:bg-[#64748B] hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🏃 Flee
              </button>
            </div>

            {/* Abilities Row */}
            {player.abilities.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap justify-center max-w-2xl px-4">
                {player.abilities
                  .filter(a => player.level >= a.unlockLevel)
                  .map(ability => (
                    <button
                      key={ability.id}
                      onClick={() => {
                        if (ability.type === 'magical' || ability.type === 'physical') {
                          executeCombatAction('magic', ability.id);
                        } else if (ability.type === 'heal') {
                          executeCombatAction('heal');
                        }
                      }}
                      disabled={!state.combat?.isPlayerTurn || (ability.mpCost > 0 && player.mp < ability.mpCost)}
                      title={ability.description}
                      className="px-3 py-1.5 border border-[#2E5C4F] text-[#E2E8F0] text-xs rounded-sm
                                 hover:border-[#4ADE80] hover:text-[#4ADE80] transition-all active:scale-95
                                 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {ability.icon} {ability.name} ({ability.mpCost}MP)
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ============ LEVEL UP OVERLAY ============ */}
        {state.screen === 'levelUp' && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(5, 14, 26, 0.95)' }}>
            <div className="w-full max-w-md p-8 rounded-sm border border-[#F59E0B]" style={{ background: 'rgba(5, 14, 26, 0.98)' }}>
              <h2 className="text-3xl font-bold text-[#F59E0B] text-center mb-2" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                ✨ Level Up! ✨
              </h2>
              <p className="text-center text-[#E2E8F0] mb-6">
                {player.name} is now <strong className="text-[#F59E0B]">Level {player.level}</strong>!
              </p>

              <p className="text-sm text-[#4ADE80] text-center mb-4">
                🎁 You have <strong>{player.statPoints}</strong> Stat Points to distribute
              </p>

              <div className="space-y-3 mb-6">
                {(['str', 'agi', 'int', 'vit', 'def'] as const).map(stat => {
                  const cost = getStatCost(player.stats[stat]);
                  const canAdd = player.statPoints >= cost;
                  const canRemove = player.stats[stat] > player.baseStats[stat];
                  const colors: Record<string, string> = { str: '#EF4444', agi: '#F59E0B', int: '#3B82F6', vit: '#4ADE80', def: '#8B5CF6' };
                  return (
                    <div key={stat} className="flex items-center justify-between py-2 px-3 rounded-sm" style={{ background: 'rgba(10, 22, 40, 0.8)' }}>
                      <span className="text-xs uppercase tracking-wider text-[#64748B] w-8">{stat}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const p = { ...player, stats: { ...player.stats } };
                            if (deallocateStatPoint(p, stat)) {
                              setState(s => ({ ...s, player: p }));
                            }
                          }}
                          disabled={!canRemove}
                          className="w-7 h-7 flex items-center justify-center border border-[#EF4444] text-[#EF4444] rounded-sm
                                     hover:bg-[#EF4444] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >−</button>
                        <span className="text-lg font-bold w-6 text-center" style={{ color: colors[stat] }}>
                          {player.stats[stat]}
                        </span>
                        <button
                          onClick={() => {
                            const p = { ...player, stats: { ...player.stats } };
                            if (allocateStatPoint(p, stat)) {
                              setState(s => ({ ...s, player: p }));
                            }
                          }}
                          disabled={!canAdd}
                          className="w-7 h-7 flex items-center justify-center border border-[#4ADE80] text-[#4ADE80] rounded-sm
                                     hover:bg-[#4ADE80] hover:text-[#050E1A] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >+</button>
                      </div>
                      <span className="text-xs text-[#64748B] w-16 text-right">Cost: {cost}</span>
                    </div>
                  );
                })}
              </div>

              {/* New abilities */}
              {player.abilities.filter(a => a.unlockLevel === player.level).length > 0 && (
                <div className="mb-4 p-3 rounded-sm border border-[#4ADE80]/30">
                  <p className="text-xs uppercase tracking-wider text-[#4ADE80] mb-2">New Abilities Unlocked:</p>
                  {player.abilities.filter(a => a.unlockLevel === player.level).map(a => (
                    <p key={a.id} className="text-sm text-[#E2E8F0]">{a.icon} <strong>{a.name}</strong> — {a.description}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setState(s => ({ ...s, screen: 'exploration', combat: null }))}
                  className="flex-1 py-3 border border-[#4ADE80] text-[#4ADE80] text-sm uppercase tracking-widest font-bold rounded-sm
                             hover:bg-[#4ADE80] hover:text-[#050E1A] transition-all active:scale-95"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    const p = { ...player, stats: { ...player.stats } };
                    autoDistributeStats(p);
                    setState(s => ({ ...s, player: p }));
                  }}
                  className="py-3 px-4 border border-[#64748B] text-[#64748B] text-xs uppercase tracking-wider rounded-sm
                             hover:border-[#4ADE80] hover:text-[#4ADE80] transition-all"
                >
                  Auto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ INVENTORY PANEL ============ */}
        {state.showInventory && (
          <div className="absolute right-0 top-0 bottom-0 w-80 border-l border-[#2E5C4F] overflow-y-auto"
            style={{ background: 'rgba(5, 14, 26, 0.97)' }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#F59E0B]">🎒 Inventory</h3>
                <button onClick={() => setState(s => ({ ...s, showInventory: false }))}
                  className="text-[#64748B] hover:text-[#E2E8F0]">✕</button>
              </div>

              {/* Equipment */}
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider text-[#64748B] mb-2">Equipped</p>
                {(['weapon', 'armor', 'accessory'] as const).map(slot => {
                  const equipped = player.equipment[slot];
                  return (
                    <div key={slot} className="flex items-center justify-between py-2 px-3 mb-1 rounded-sm"
                      style={{ background: 'rgba(10, 22, 40, 0.8)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{equipped ? equipped.icon : '⚪'}</span>
                        <div>
                          <p className="text-xs text-[#E2E8F0]">{equipped ? equipped.name : `No ${slot}`}</p>
                          {equipped?.statBonus && (
                            <p className="text-[10px] text-[#4ADE80]">
                              {Object.entries(equipped.statBonus).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      {equipped && (
                        <button onClick={() => {
                          const p = { ...player, equipment: { ...player.equipment } };
                          unequipItem(p, slot);
                          setState(s => ({ ...s, player: p }));
                        }} className="text-[10px] text-[#EF4444] hover:text-[#f87171]">Remove</button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[#64748B] mb-2">Items</p>
                {player.inventory.length === 0 && <p className="text-xs text-[#64748B]">Empty</p>}
                {player.inventory.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center justify-between py-2 px-3 mb-1 rounded-sm"
                    style={{ background: 'rgba(10, 22, 40, 0.8)' }}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm">{item.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-[#E2E8F0] truncate">{item.name} {item.count > 1 ? `×${item.count}` : ''}</p>
                        {item.statBonus && (
                          <p className="text-[10px] text-[#4ADE80]">
                            {Object.entries(item.statBonus).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => useItemHandler(index)}
                      className="px-2 py-1 text-[10px] border border-[#4ADE80]/50 text-[#4ADE80] rounded-sm
                                 hover:bg-[#4ADE80] hover:text-[#050E1A] transition-all ml-2"
                    >
                      {item.type === 'equipment' ? 'Equip' : item.type === 'consumable' ? 'Use' : 'View'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Abilities */}
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-[#64748B] mb-2">Abilities</p>
                {player.abilities.map(a => (
                  <div key={a.id} className="py-1.5 px-3 mb-1 rounded-sm" style={{ background: 'rgba(10, 22, 40, 0.8)' }}>
                    <p className="text-xs text-[#E2E8F0]">{a.icon} <strong>{a.name}</strong></p>
                    <p className="text-[10px] text-[#64748B]">{a.description} ({a.mpCost} MP)</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ QUESTS PANEL ============ */}
        {state.showQuests && (
          <div className="absolute left-0 top-0 bottom-0 w-80 border-r border-[#2E5C4F] overflow-y-auto"
            style={{ background: 'rgba(5, 14, 26, 0.97)' }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#F59E0B]">📜 Quests</h3>
                <button onClick={() => setState(s => ({ ...s, showQuests: false }))}
                  className="text-[#64748B] hover:text-[#E2E8F0]">✕</button>
              </div>
              {QUESTS.map(quest => {
                const isCompleted = player.questsCompleted.includes(quest.id);
                const progress = isCompleted ? quest.target : quest.id === 'explorer' ? player.visitedLocations.length :
                  quest.id === 'treasure_hunter' ? Math.min(player.gold, quest.target) :
                  quest.type === 'kill' ? (isCompleted ? quest.target : 0) : 0;
                return (
                  <div key={quest.id} className={`p-3 mb-2 rounded-sm border-l-2 ${isCompleted ? 'border-[#4ADE80] opacity-60' : 'border-[#F59E0B]'}`}
                    style={{ background: 'rgba(10, 22, 40, 0.8)' }}>
                    <p className="text-sm font-bold text-[#E2E8F0]">{quest.title} {isCompleted && '✓'}</p>
                    <p className="text-xs text-[#64748B] mt-1">{quest.description}</p>
                    {quest.target > 1 && (
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-[#0A1628] rounded-full overflow-hidden">
                          <div className="h-full bg-[#4ADE80] rounded-full transition-all" style={{ width: `${(progress / quest.target) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-[#64748B] mt-0.5">{progress}/{quest.target}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-[#F59E0B] mt-1">Reward: {quest.reward.xp} XP{quest.reward.gold > 0 ? `, ${quest.reward.gold}g` : ''}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============ SHOP OVERLAY ============ */}
        {showShop && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(5, 14, 26, 0.92)' }}>
            <div className="w-full max-w-lg p-6 rounded-sm border border-[#F59E0B]" style={{ background: 'rgba(5, 14, 26, 0.98)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#F59E0B]">🏪 Merchant's Shop</h3>
                <button onClick={() => setShowShop(false)} className="text-[#64748B] hover:text-[#E2E8F0]">✕</button>
              </div>
              <p className="text-xs text-[#64748B] mb-4">Your gold: <strong className="text-[#F59E0B]">{player.gold}g</strong></p>
              <div className="grid grid-cols-2 gap-2">
                {SHOP_ITEMS.map(itemId => {
                  const item = ITEMS[itemId];
                  if (!item) return null;
                  const canAfford = player.gold >= item.price;
                  return (
                    <button
                      key={itemId}
                      onClick={() => canAfford && buyItem(itemId)}
                      disabled={!canAfford}
                      className={`flex items-center gap-3 p-3 rounded-sm border transition-all text-left
                        ${canAfford
                          ? 'border-[#2E5C4F] hover:border-[#4ADE80] active:scale-[0.98]'
                          : 'border-[#2E5C4F]/30 opacity-40 cursor-not-allowed'}`}
                      style={{ background: 'rgba(10, 22, 40, 0.8)' }}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#E2E8F0] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#F59E0B]">{item.price}g</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ BOTTOM STORY / ACTION PANEL ============ */}
      {state.screen === 'exploration' && (
        <div className="border-t border-[#2E5C4F] overflow-y-auto" style={{ background: 'rgba(5, 14, 26, 0.97)', maxHeight: '260px', minHeight: '180px' }}>
          <div className="p-4 max-w-4xl mx-auto">
            {/* XP Bar */}
            <div className="mb-3">
              <div className="w-full h-1.5 bg-[#0A1628] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
              </div>
              <p className="text-[10px] text-[#64748B] mt-0.5 text-center">{player.xp} / {player.maxXp} XP to Level {player.level + 1}</p>
            </div>

            {/* Story Text */}
            {currentStory ? (
              <div>
                <h4 className="text-sm font-bold text-[#4ADE80] mb-2" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                  {currentStory.title}
                </h4>
                <p className="text-sm text-[#E2E8F0] leading-relaxed mb-4" style={{ fontFamily: 'Crimson Text, Georgia, serif' }}>
                  {currentStory.text}
                </p>
                <button
                  onClick={() => setCurrentStory(null)}
                  className="px-4 py-2 border border-[#64748B] text-[#64748B] text-xs uppercase tracking-wider rounded-sm
                             hover:border-[#4ADE80] hover:text-[#4ADE80] transition-all"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div>
                {/* Location Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{currentLoc.icon}</span>
                  <h4 className="text-base font-bold text-[#4ADE80]" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                    {currentLoc.name}
                  </h4>
                  {currentLoc.danger > 0 && (
                    <span className="text-xs text-[#EF4444]">{'⚠️'.repeat(currentLoc.danger)}</span>
                  )}
                </div>
                <p className="text-sm text-[#64748B] leading-relaxed mb-3" style={{ fontFamily: 'Crimson Text, Georgia, serif' }}>
                  {currentLoc.description}
                </p>

                {/* Story Node Choices OR Default Actions */}
                <div className="flex flex-wrap gap-2">
                  {currentLoc.storyNodes.map(node => {
                    const isRepeatable = node.repeatable;
                    const wasVisited = !!(!isRepeatable && player.storyChoices[node.id]);
                    return (
                      <button
                        key={node.id}
                        onClick={() => {
                          setCurrentStory({ title: node.title, text: node.text });
                          setState(s => ({ ...s, currentNodeId: node.id }));
                        }}
                        disabled={wasVisited}
                        className={`px-3 py-2 border rounded-sm text-xs uppercase tracking-wider font-semibold transition-all active:scale-95
                          ${wasVisited
                            ? 'border-[#2E5C4F]/30 text-[#64748B]/30 cursor-not-allowed'
                            : 'border-[#4ADE80] text-[#4ADE80] hover:bg-[#4ADE80] hover:text-[#050E1A]'}`}
                      >
                        {node.title}
                      </button>
                    );
                  })}

                  {/* Travel buttons */}
                  {currentLoc.connections.map(connId => {
                    const conn = LOCATIONS[connId];
                    return (
                      <button
                        key={connId}
                        onClick={() => travelTo(connId)}
                        className="px-3 py-2 border border-[#64748B] text-[#64748B] rounded-sm text-xs uppercase tracking-wider
                                   hover:border-[#4ADE80] hover:text-[#4ADE80] transition-all active:scale-95"
                      >
                        🚶 {conn.name}
                      </button>
                    );
                  })}
                </div>

                {/* Story choices if a node is active */}
                {state.currentNodeId && currentLoc.storyNodes.find(n => n.id === state.currentNodeId)?.choices && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {currentLoc.storyNodes.find(n => n.id === state.currentNodeId)!.choices.map(choice => (
                      <button
                        key={choice.id}
                        onClick={() => handleStoryChoice(choice.consequence)}
                        className="px-3 py-2 border border-[#F59E0B] text-[#F59E0B] rounded-sm text-xs uppercase tracking-wider
                                   hover:bg-[#F59E0B] hover:text-[#050E1A] transition-all active:scale-95"
                      >
                        {choice.icon} {choice.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ TOAST ============ */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-sm border-l-4 shadow-lg z-50 animate-slide-in
          ${toast.type === 'error' ? 'border-[#EF4444] bg-[#1A0A0A]' :
            toast.type === 'loot' ? 'border-[#F59E0B] bg-[#1A1400]' :
            toast.type === 'levelup' ? 'border-[#4ADE80] bg-[#0A1A0A]' :
            'border-[#4ADE80] bg-[#0A1A14]'}`}>
          <p className={`text-sm font-semibold
            ${toast.type === 'error' ? 'text-[#EF4444]' :
              toast.type === 'loot' ? 'text-[#F59E0B]' :
              'text-[#4ADE80]'}`}>
            {toast.message}
          </p>
        </div>
      )}
    </div>
  );
}
