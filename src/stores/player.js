import { defineStore } from 'pinia'
import { GameDB } from './db'
import { pillRecipes, tryCreatePill, calculatePillEffect } from '../plugins/pills'
import { encryptData, decryptData, validateData } from '../plugins/crypto'
import { getRealmName, getRealmLength } from '../plugins/realm'

const ARRAY_FIELDS = [
  'pills',
  'pillRecipes',
  'activeEffects',
  'herbs',
  'items',
  'artifacts',
  'unlockedRealms',
  'unlockedLocations',
  'unlockedSkills',
  'completedAchievements',
  'autoSellQualities',
  'autoReleaseRarities'
]

const NUMBER_FIELDS = [
  'level',
  'cultivation',
  'maxCultivation',
  'spirit',
  'spiritRate',
  'luck',
  'cultivationRate',
  'herbRate',
  'alchemyRate',
  'petEssence',
  'spiritStones',
  'reinforceStones',
  'refinementStones',
  'nameChangeCount',
  'pillsCrafted',
  'pillsConsumed',
  'totalCultivationTime',
  'breakthroughCount',
  'explorationCount',
  'itemsFound',
  'eventTriggered',
  'unlockedPillRecipes',
  'dungeonDifficulty',
  'dungeonHighestFloor',
  'dungeonHighestFloor_2',
  'dungeonHighestFloor_5',
  'dungeonHighestFloor_10',
  'dungeonHighestFloor_100',
  'dungeonLastFailedFloor',
  'dungeonTotalRuns',
  'dungeonBossKills',
  'dungeonEliteKills',
  'dungeonTotalKills',
  'dungeonDeathCount',
  'dungeonTotalRewards'
]

const WORLD_REGION_IDS = new Set(['village', 'sect', 'ferry', 'demon'])
const WORLD_SEASONS = ['初春', '春深', '初夏', '长夏', '初秋', '深秋', '初冬', '寒冬']

const readDarkMode = () => {
  try {
    return localStorage.getItem('darkMode') === 'true'
  } catch (error) {
    console.warn('主题设置读取失败:', error)
    return false
  }
}

const writeDarkMode = value => {
  try {
    localStorage.setItem('darkMode', String(value))
  } catch (error) {
    console.warn('主题设置保存失败:', error)
  }
}

const DAILY_TASK_SETS = [
  [
    { id: 'breathe', name: '引气吐纳', description: '在世界页完成两次引气', action: 'breathe', target: 2, reward: { spirit: 12, spiritStones: 8 } },
    { id: 'cultivate', name: '静修一刻', description: '完成一次修炼', action: 'cultivate', target: 1, reward: { spirit: 16, reinforceStones: 2 } },
    { id: 'gather', name: '寻一味药材', description: '采集一株灵草', action: 'gather', target: 1, reward: { spiritStones: 18 } }
  ],
  [
    { id: 'explore', name: '走过山河', description: '完成一次探索或迁徙', action: 'explore', target: 1, reward: { spirit: 18, spiritStones: 12 } },
    { id: 'meet', name: '人间相逢', description: '拜访一位附近的人', action: 'meet', target: 1, reward: { spirit: 12, spiritStones: 10 } },
    { id: 'cultivate', name: '稳住根基', description: '完成两次修炼', action: 'cultivate', target: 2, reward: { spirit: 20, reinforceStones: 2 } }
  ],
  [
    { id: 'alchemy', name: '炉火照见道心', description: '成功炼制一枚丹药', action: 'alchemy', target: 1, reward: { spirit: 20, spiritStones: 20 } },
    { id: 'dungeon', name: '秘境初战', description: '通关一层秘境', action: 'dungeon', target: 1, reward: { spirit: 25, refinementStones: 2 } },
    { id: 'explore', name: '寻觅机缘', description: '完成一次探索或迁徙', action: 'explore', target: 1, reward: { spiritStones: 25 } }
  ]
]

const createDailyState = day => {
  const safeDay = Math.max(1, Math.floor(Number(day) || 1))
  const taskSet = DAILY_TASK_SETS[(safeDay - 1) % DAILY_TASK_SETS.length]
  return {
    day: safeDay,
    claimed: false,
    tasks: taskSet.map(task => ({ ...task, reward: { ...task.reward }, progress: 0 }))
  }
}

const normalizeDailyState = (value, day) => {
  const fresh = createDailyState(day)
  if (!value || typeof value !== 'object' || Number(value.day) !== fresh.day) return fresh
  const savedTasks = Array.isArray(value.tasks) ? value.tasks : []
  fresh.tasks = fresh.tasks.map(task => {
    const saved = savedTasks.find(item => item?.id === task.id)
    const progress = Number(saved?.progress)
    return {
      ...task,
      progress: Number.isFinite(progress) ? Math.min(task.target, Math.max(0, Math.floor(progress))) : 0
    }
  })
  fresh.claimed = Boolean(value.claimed)
  return fresh
}

const createStarterWeapon = () => ({
  id: `starter-wood-sword-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '制式木剑',
  type: 'weapon',
  slot: 'weapon',
  equipType: 'weapon',
  quality: 'common',
  qualityInfo: { name: '凡品', color: '#9e9e9e' },
  level: 1,
  requiredRealm: 1,
  enhanceLevel: 0,
  stats: { attack: 4, critRate: 0.01 }
})

const createStarterHerbs = () => [
  {
    id: 'spirit_grass',
    name: '青露草',
    description: '带着雨意的基础灵草',
    quality: 'common',
    baseValue: 10,
    value: 10,
    category: 'spirit'
  },
  {
    id: 'spirit_grass',
    name: '青露草',
    description: '带着雨意的基础灵草',
    quality: 'common',
    baseValue: 10,
    value: 10,
    category: 'spirit'
  },
  {
    id: 'cloud_flower',
    name: '云岑竹叶',
    description: '吸收晨钟灵音的清苦竹叶',
    quality: 'common',
    baseValue: 15,
    value: 15,
    category: 'cultivation'
  }
]

const finiteOrDefault = (value, fallback, minimum = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(minimum, number) : fallback
}

const mergeNumericObject = (value, defaults) => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return Object.keys(defaults).reduce(
    (result, key) => {
      result[key] = finiteOrDefault(source[key], defaults[key])
      return result
    },
    { ...source }
  )
}

const normalizePlayerData = (data, defaults) => {
  const source = data && typeof data === 'object' ? data : {}
  const normalized = { ...source }

  ARRAY_FIELDS.forEach(field => {
    normalized[field] = Array.isArray(source[field]) ? [...source[field]] : [...(defaults[field] || [])]
  })
  NUMBER_FIELDS.forEach(field => {
    normalized[field] = finiteOrDefault(source[field], defaults[field] ?? 0)
  })
  normalized.level = Math.min(getRealmLength(), Math.max(1, Math.floor(normalized.level)))
  normalized.maxCultivation = Math.max(1, normalized.maxCultivation)
  normalized.cultivation = Math.min(normalized.maxCultivation, normalized.cultivation)
  normalized.realm = typeof source.realm === 'string' && source.realm ? source.realm : getRealmName(normalized.level).name
  normalized.name = typeof source.name === 'string' && source.name.trim() ? source.name : defaults.name
  normalized.baseAttributes = mergeNumericObject(source.baseAttributes, defaults.baseAttributes)
  normalized.combatAttributes = mergeNumericObject(source.combatAttributes, defaults.combatAttributes)
  normalized.combatResistance = mergeNumericObject(source.combatResistance, defaults.combatResistance)
  normalized.specialAttributes = mergeNumericObject(source.specialAttributes, defaults.specialAttributes)
  normalized.artifactBonuses = mergeNumericObject(source.artifactBonuses, defaults.artifactBonuses)
  const sourceEquipment = source.equippedArtifacts && typeof source.equippedArtifacts === 'object' && !Array.isArray(source.equippedArtifacts)
    ? source.equippedArtifacts
    : {}
  normalized.equippedArtifacts = Object.keys(defaults.equippedArtifacts).reduce((result, slot) => {
    result[slot] = sourceEquipment[slot] && typeof sourceEquipment[slot] === 'object'
      ? sourceEquipment[slot]
      : null
    return result
  }, {})
  normalized.bodyProfile = {
    ...defaults.bodyProfile,
    ...(source.bodyProfile && typeof source.bodyProfile === 'object' ? source.bodyProfile : {})
  }
  normalized.worldState = {
    ...defaults.worldState,
    ...(source.worldState && typeof source.worldState === 'object' ? source.worldState : {})
  }
  normalized.worldState.day = Math.max(1, Math.floor(finiteOrDefault(normalized.worldState.day, defaults.worldState.day, 1)))
  normalized.worldState.season =
    typeof normalized.worldState.season === 'string' && normalized.worldState.season
      ? normalized.worldState.season
      : defaults.worldState.season
  const savedRegion = normalized.worldState.currentRegion
  normalized.worldState.currentRegion = typeof savedRegion === 'string' && WORLD_REGION_IDS.has(savedRegion)
    ? savedRegion
    : defaults.worldState.currentRegion
  const savedVisitedRegions = Array.isArray(normalized.worldState.visitedRegions)
    ? normalized.worldState.visitedRegions
    : defaults.worldState.visitedRegions
  normalized.worldState.visitedRegions = [...new Set(savedVisitedRegions.filter(region => WORLD_REGION_IDS.has(region)))]
  if (!normalized.worldState.visitedRegions.includes(normalized.worldState.currentRegion)) {
    normalized.worldState.visitedRegions.push(normalized.worldState.currentRegion)
  }
  normalized.worldState.discoveredClues = Array.isArray(normalized.worldState.discoveredClues)
    ? [...normalized.worldState.discoveredClues]
    : [...defaults.worldState.discoveredClues]
  normalized.worldState.selectedChoice = ['listen', 'door', 'wait'].includes(normalized.worldState.selectedChoice)
    ? normalized.worldState.selectedChoice
    : null
  normalized.worldState.storyFlags = Array.isArray(normalized.worldState.storyFlags)
    ? [...normalized.worldState.storyFlags]
    : [...defaults.worldState.storyFlags]
  normalized.worldState.journal = Array.isArray(normalized.worldState.journal)
    ? [...normalized.worldState.journal]
    : [...defaults.worldState.journal]
  normalized.worldState.relationshipLedger = {
    ...defaults.worldState.relationshipLedger,
    ...(normalized.worldState.relationshipLedger && typeof normalized.worldState.relationshipLedger === 'object'
      ? normalized.worldState.relationshipLedger
      : {})
  }
  normalized.worldState.daily = normalizeDailyState(normalized.worldState.daily, normalized.worldState.day)
  normalized.pillFragments =
    source.pillFragments && typeof source.pillFragments === 'object' && !Array.isArray(source.pillFragments)
      ? { ...source.pillFragments }
      : { ...defaults.pillFragments }
  normalized.starterPackGranted = Boolean(source.starterPackGranted || normalized.items.length || normalized.herbs.length)
  const savedActivePetId = source.activePet?.id
  normalized.activePet = normalized.items.find(item =>
    item && item.type === 'pet' && savedActivePetId && item.id === savedActivePetId
  ) || null
  normalized.petConfig = {
    ...defaults.petConfig,
    ...(source.petConfig && typeof source.petConfig === 'object' ? source.petConfig : {})
  }
  normalized.petConfig.rarityMap = {
    ...defaults.petConfig.rarityMap,
    ...(source.petConfig?.rarityMap && typeof source.petConfig.rarityMap === 'object'
      ? source.petConfig.rarityMap
      : {})
  }
  return normalized
}

let saveTimer = null
let pendingSave = null
let latestStore = null
let saveChain = Promise.resolve()
let equipmentOperationBusy = false

const persistPlayerState = store => {
  const encryptedData = encryptData(store.$state)
  if (!encryptedData) {
    console.error('数据加密失败')
    return Promise.resolve(false)
  }
  return GameDB.setData('playerData', encryptedData)
    .then(() => true)
    .catch(error => {
      console.error('数据保存失败:', error)
      return false
    })
}

const flushPendingSave = () => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  const request = pendingSave
  pendingSave = null
  if (!request || !latestStore) return Promise.resolve(false)
  saveChain = saveChain.then(() => persistPlayerState(latestStore))
  saveChain.then(request.resolve, request.resolve)
  return request.promise
}

const requestSave = (store, { immediate = false } = {}) => {
  latestStore = store
  if (!pendingSave) {
    let resolve
    const promise = new Promise(done => {
      resolve = done
    })
    pendingSave = { promise, resolve }
  }
  if (immediate) {
    return flushPendingSave()
  }
  if (!saveTimer) {
    saveTimer = setTimeout(() => {
      flushPendingSave()
    }, 250)
  }
  return pendingSave.promise
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    // 是否新玩家
    isNewPlayer: true,
    // 第一阶段角色命书
    race: 'human',
    gender: 'female',
    origin: 'village',
    appearanceId: '',
    appearancePrompt: '',
    bodyProfile: {
      physique: 'clear-bone',
      complexion: 'pale-ink',
      hair: 'half-tied',
      bearing: 'quiet'
    },
    spiritRoot: '未觉醒',
    startingTechnique: '无',
    birthStory: '',
    characterProfile: null,
      worldState: {
        day: 1,
        season: '初春',
        currentRegion: 'village',
        visitedRegions: ['village'],
        discoveredClues: [],
        selectedChoice: null,
        relationshipLedger: {},
        storyFlags: [],
        journal: [],
        daily: createDailyState(1)
      },
    // GM模式开关
    isGMMode: false,
    // 主题设置
    isDarkMode: readDarkMode(),
    // 灵宠系统
    activePet: null, // 当前出战的灵宠
    petEssence: 0, // 灵宠精华
    petConfig: {
      rarityMap: {
        divine: { name: '神品', color: '#FF0000', probability: 0.02, essenceBonus: 50 },
        celestial: { name: '仙品', color: '#FFD700', probability: 0.08, essenceBonus: 30 },
        mystic: { name: '玄品', color: '#9932CC', probability: 0.15, essenceBonus: 20 },
        spiritual: { name: '灵品', color: '#1E90FF', probability: 0.25, essenceBonus: 10 },
        mortal: { name: '凡品', color: '#32CD32', probability: 0.5, essenceBonus: 5 }
      }
    },
    // 基础属性
    name: '无名修士',
    nameChangeCount: 0, // 道号修改次数
    level: 1, // 境界等级
    realm: '练气期一层', // 当前境界名称
    cultivation: 0, // 当前修为值
    maxCultivation: 100, // 当前境界最大修为值
    spirit: 0, // 灵力值
    spiritRate: 1, // 灵力获取倍率
    luck: 1, // 幸运值
    cultivationRate: 1, // 修炼速率
    herbRate: 1, // 灵草获取倍率
    alchemyRate: 1, // 炼丹成功率加成
    // 丹药系统
    pills: [], // 丹药库存
    pillFragments: {}, // 丹方残页（key为丹方ID，value为数量）
    pillRecipes: [], // 已获得的完整丹方
    activeEffects: [], // 当前生效的丹药效果列表
    pillsCrafted: 0, // 炼制丹药次数
    pillsConsumed: 0, // 服用丹药次数
    // 基础战斗属性
    baseAttributes: {
      attack: 10, // 攻击
      health: 100, // 生命
      defense: 5, // 防御
      speed: 10 // 速度
    },
    // 战斗属性
    combatAttributes: {
      critRate: 0, // 暴击率
      comboRate: 0, // 连击率
      counterRate: 0, // 反击率
      stunRate: 0, // 眩晕率
      dodgeRate: 0, // 闪避率
      vampireRate: 0 // 吸血率
    },
    // 战斗抗性
    combatResistance: {
      critResist: 0, // 抗暴击
      comboResist: 0, // 抗连击
      counterResist: 0, // 抗反击
      stunResist: 0, // 抗眩晕
      dodgeResist: 0, // 抗闪避
      vampireResist: 0 // 抗吸血
    },
    // 特殊属性
    specialAttributes: {
      healBoost: 0, // 强化治疗
      critDamageBoost: 0, // 强化爆伤
      critDamageReduce: 0, // 弱化爆伤
      finalDamageBoost: 0, // 最终增伤
      finalDamageReduce: 0, // 最终减伤
      combatBoost: 0, // 战斗属性提升
      resistanceBoost: 0 // 战斗抗性提升
    },
    // 资源
    spiritStones: 0, // 灵石数量
    reinforceStones: 0, // 强化石数量
    refinementStones: 0, // 洗练石数量
    herbs: [], // 灵草库存
    items: [], // 物品库存
    starterPackGranted: false,
    artifacts: [], // 法宝装备
    // 装备栏位
    equippedArtifacts: {
      weapon: null, // 武器
      head: null, // 头部
      body: null, // 衣服
      legs: null, // 裤子
      feet: null, // 鞋子
      shoulder: null, // 肩甲
      hands: null, // 手套
      wrist: null, // 护腕
      necklace: null, // 项链
      ring1: null, // 戒指1
      ring2: null, // 戒指2
      belt: null, // 腰带
      artifact: null // 法宝
    },
    // 装备加成属性
    artifactBonuses: {
      // 基础属性加成
      attack: 0,
      health: 0,
      defense: 0,
      speed: 0,
      // 战斗属性加成
      critRate: 0,
      comboRate: 0,
      counterRate: 0,
      stunRate: 0,
      dodgeRate: 0,
      vampireRate: 0,
      // 抗性加成
      critResist: 0,
      comboResist: 0,
      counterResist: 0,
      stunResist: 0,
      dodgeResist: 0,
      vampireResist: 0,
      // 特殊属性加成
      healBoost: 0,
      critDamageBoost: 0,
      critDamageReduce: 0,
      finalDamageBoost: 0,
      finalDamageReduce: 0,
      combatBoost: 0,
      resistanceBoost: 0,
      // 修炼相关加成
      cultivationRate: 1,
      spiritRate: 1
    },
    // 统计数据
    totalCultivationTime: 0, // 总修炼时间
    breakthroughCount: 0, // 突破次数
    explorationCount: 0, // 探索次数
    itemsFound: 0, // 获得物品数量
    eventTriggered: 0, // 触发事件次数
    unlockedPillRecipes: 0, // 解锁丹方数量
    // 秘境相关数据
    dungeonDifficulty: 1, // 难度选择
    dungeonHighestFloor: 0, // 最高通关层数
    dungeonHighestFloor_2: 0, // 最高通关层数
    dungeonHighestFloor_5: 0, // 最高通关层数
    dungeonHighestFloor_10: 0, // 最高通关层数
    dungeonHighestFloor_100: 0, // 最高通关层数
    dungeonLastFailedFloor: 0, // 最后失败层数
    dungeonTotalRuns: 0, // 总探索次数
    dungeonBossKills: 0, // Boss击杀数
    dungeonEliteKills: 0, // 精英击杀数
    dungeonTotalKills: 0, // 总击杀数
    dungeonDeathCount: 0, // 死亡次数
    dungeonTotalRewards: 0, // 获得奖励次数
    // 自动出售相关设置
    autoSellQualities: [], // 选中的装备品质
    autoReleaseRarities: [], // 选中的灵宠品质
    // 心愿单相关设置
    wishlistEnabled: false, // 心愿单开关
    selectedWishEquipQuality: null,
    selectedWishPetRarity: null,
    // 成就与解锁项
    unlockedRealms: ['练气一层'], // 已解锁境界
    unlockedLocations: ['新手村'], // 已解锁地点
    unlockedSkills: [], // 已解锁功法
    completedAchievements: [] // 已完成成就
  }),
  getters: {
    // 获取灵宠的属性加成
    getPetBonus() {
      if (!this.activePet)
        return {
          attack: 0,
          defense: 0,
          health: 0,
          critRate: 0,
          comboRate: 0,
          counterRate: 0,
          stunRate: 0,
          dodgeRate: 0,
          vampireRate: 0,
          critResist: 0,
          comboResist: 0,
          counterResist: 0,
          stunResist: 0,
          dodgeResist: 0,
          vampireResist: 0,
          healBoost: 0,
          critDamageBoost: 0,
          critDamageReduce: 0,
          finalDamageBoost: 0,
          finalDamageReduce: 0,
          combatBoost: 0,
          resistanceBoost: 0
        }
      const qualityBonusMap = {
        divine: 0.15, // 神品基础加成15%
        celestial: 0.12, // 仙品基础加成12%
        mystic: 0.09, // 玄品基础加成9%
        spiritual: 0.06, // 灵品基础加成6%
        mortal: 0.03 // 凡品基础加成3%
      }
      const starBonusPerQuality = {
        divine: 0.02, // 神品每星+2%
        celestial: 0.01, // 仙品每星+1%
        mystic: 0.01, // 玄品每星+1%
        spiritual: 0.01, // 灵品每星+1%
        mortal: 0.01 // 凡品每星+1%
      }
      const baseBonus = qualityBonusMap[this.activePet.rarity] || 0
      const starBonus = (this.activePet.star || 0) * (starBonusPerQuality[this.activePet.rarity] || 0)
      const levelBonus = ((this.activePet.level || 1) - 1) * (baseBonus * 0.1)
      const totalBonus = baseBonus + starBonus + levelBonus
      const phase = Math.floor((this.activePet.star || 0) / 5)
      const phaseBonus = phase * (baseBonus * 0.5)
      const finalBonus = totalBonus + phaseBonus
      const combatBonus = finalBonus * 0.5
      return {
        attack: finalBonus,
        defense: finalBonus,
        health: finalBonus,
        critRate: combatBonus,
        comboRate: combatBonus,
        counterRate: combatBonus,
        stunRate: combatBonus,
        dodgeRate: combatBonus,
        vampireRate: combatBonus,
        critResist: combatBonus,
        comboResist: combatBonus,
        counterResist: combatBonus,
        stunResist: combatBonus,
        dodgeResist: combatBonus,
        vampireResist: combatBonus,
        healBoost: combatBonus,
        critDamageBoost: combatBonus,
        critDamageReduce: combatBonus,
        finalDamageBoost: combatBonus,
        finalDamageReduce: combatBonus,
        combatBoost: combatBonus,
        resistanceBoost: combatBonus
      }
    }
  },
  actions: {
    // 创建完成后一次性写入命书与第一张地图的初始状态
    async beginJourney(profile) {
      // 新命书必须从完整初始状态开始，避免旧角色的装备、灵宠和副本统计残留
      this.$reset()
      const originRules = {
        village: { level: 1, realm: '无修为', maxCultivation: 100 },
        sect: { level: 1, realm: '练气一重', maxCultivation: 200 },
        family: { level: 2, realm: '练气二重', maxCultivation: 300 },
        rogue: { level: 1, realm: '练气一重', maxCultivation: 200 },
        demon: { level: 2, realm: '练气二重', maxCultivation: 300 }
      }
      const originRule = originRules[profile.origin] || originRules.village
      const origin = profile.originData || {}
      const startingLevel = Math.min(Math.max(Number(origin.level) || originRule.level, 1), getRealmLength())
      const startingRealm = profile.origin === 'village' ? '无修为' : getRealmName(startingLevel).name
      const startingMaxCultivation = getRealmName(startingLevel).maxCultivation

      this.name = profile.name || '无名修士'
      this.race = profile.race || 'human'
      this.gender = profile.gender || 'female'
      this.origin = profile.origin || 'village'
      this.appearanceId = profile.appearanceId || ''
      this.appearancePrompt = profile.appearancePrompt || ''
      this.bodyProfile = { ...this.bodyProfile, ...(profile.bodyProfile || {}) }
      this.spiritRoot = profile.spiritRoot || '未觉醒'
      this.startingTechnique = profile.startingTechnique || '无'
      this.birthStory = profile.birthStory || origin.opening || ''
      this.characterProfile = {
        ...profile,
        createdAt: Date.now()
      }
      this.level = startingLevel
      this.realm = startingRealm
      this.cultivation = Number(origin.cultivation || 0)
      this.maxCultivation = startingMaxCultivation
      this.spirit = Number(origin.spirit || 0)
      this.spiritStones = Number(origin.spiritStones || 0)
      this.baseAttributes = {
        ...this.baseAttributes,
        ...(origin.stats || {})
      }
      this.herbs = createStarterHerbs()
      this.pills = []
      this.items = [createStarterWeapon()]
      this.starterPackGranted = true
      this.pillFragments = {}
      this.pillRecipes = ['spirit_gathering']
      this.unlockedPillRecipes = 1
      this.unlockedLocations = [origin.place || '青石村']
      const startingRegionByOrigin = {
        village: 'village',
        sect: 'sect',
        family: 'sect',
        rogue: 'ferry',
        demon: 'demon'
      }
      const startingRegion = startingRegionByOrigin[this.origin] || 'village'
      this.worldState = {
        day: 1,
        season: '初春',
        currentRegion: startingRegion,
        visitedRegions: [startingRegion],
        discoveredClues: [],
        selectedChoice: null,
        relationshipLedger: {},
        storyFlags: ['chapter-one-open'],
        journal: [
          {
            id: `opening-${Date.now()}`,
            title: '命书初开',
            text: this.birthStory,
            day: 1
          }
        ],
        daily: createDailyState(1)
      }
      this.isNewPlayer = false
      await this.saveData({ immediate: true })
    },
    // 更新HTML暗黑模式类
    updateHtmlDarkMode(isDarkMode) {
      const htmlEl = document.documentElement
      if (isDarkMode) {
        htmlEl.classList.add('dark')
      } else {
        htmlEl.classList.remove('dark')
      }
    },
    // 初始化玩家数据
    async initializePlayer() {
      let savedData = null
      let decryptedData = null
      try {
        savedData = await GameDB.getData('playerData')
        decryptedData = savedData ? decryptData(savedData) : null
      } catch (error) {
        console.error('加载主存档失败，尝试本地备份:', error)
      }

      // 主存档损坏或被清空时，回退到最近一次成功写入的本地备份。
      if (!decryptedData || !validateData(decryptedData)) {
        try {
          const backupData = await GameDB.getBackup('playerData')
          if (backupData && backupData !== savedData) {
            const backupDecryptedData = decryptData(backupData)
            if (backupDecryptedData && validateData(backupDecryptedData)) {
              savedData = backupData
              decryptedData = backupDecryptedData
              await GameDB.setData('playerData', backupData)
              console.warn('主存档不可用，已恢复最近一次有效本地备份')
            }
          }
        } catch (error) {
          console.error('恢复本地备份失败:', error)
        }
      }

      if (decryptedData && validateData(decryptedData)) {
        this.$reset()
        Object.assign(this.$state, normalizePlayerData(decryptedData, this.$state))
        // 旧版存档没有命书字段，进入新版时重新走角色创建，避免半套数据直接进入地图。
        this.isNewPlayer = !decryptedData.characterProfile
        if (
          !this.isNewPlayer &&
          !this.starterPackGranted &&
          !this.items.length &&
          !this.herbs.length &&
          !Object.values(this.equippedArtifacts || {}).some(Boolean)
        ) {
          this.herbs = createStarterHerbs()
          this.items = [createStarterWeapon()]
          this.starterPackGranted = true
          await this.saveData({ immediate: true })
        }
      } else if (savedData) {
        console.error('主存档和本地备份均无法验证，使用初始数据')
      }
      // 初始化主题设置
      this.isDarkMode = readDarkMode()
      // 同步暗黑模式状态到HTML标签
      this.updateHtmlDarkMode(this.isDarkMode)
    },
    // 切换暗黑模式
    toggle() {
      this.isDarkMode = !this.isDarkMode
      writeDarkMode(this.isDarkMode)
      // 更新html标签的class
      this.updateHtmlDarkMode(this.isDarkMode)
      this.saveData()
    },
    // 保存数据到本地存档（IndexedDB + localStorage 双重备份）
    async saveData(options = {}) {
      return requestSave(this, options)
    },
    ensureDailyState() {
      if (!this.worldState || typeof this.worldState !== 'object') return null
      const normalized = normalizeDailyState(this.worldState.daily, this.worldState.day)
      if (!this.worldState.daily || JSON.stringify(this.worldState.daily) !== JSON.stringify(normalized)) {
        this.worldState.daily = normalized
      }
      return this.worldState.daily
    },
    advanceDay(amount = 1) {
      if (!this.worldState || typeof this.worldState !== 'object') return
      const safeAmount = Math.max(1, Math.floor(Number(amount) || 1))
      this.worldState.day = Math.max(1, Math.floor(Number(this.worldState.day) || 1) + safeAmount)
      this.worldState.season = WORLD_SEASONS[(this.worldState.day - 1) % WORLD_SEASONS.length]
      this.worldState.daily = createDailyState(this.worldState.day)
    },
    recordDailyAction(action, amount = 1) {
      const daily = this.ensureDailyState()
      const safeAmount = Math.max(0, Math.floor(Number(amount) || 0))
      const task = daily?.tasks?.find(item => item.action === action)
      if (!task || safeAmount <= 0) return false
      const previous = task.progress
      task.progress = Math.min(task.target, task.progress + safeAmount)
      return task.progress !== previous
    },
    claimDailyRewards() {
      const daily = this.ensureDailyState()
      if (!daily) return { success: false, message: '今日命课尚未生成' }
      if (daily.claimed) return { success: false, message: '今日命课奖励已经领取' }
      if (!daily.tasks.every(task => task.progress >= task.target)) {
        return { success: false, message: '今日命课尚未完成' }
      }
      const reward = daily.tasks.reduce(
        (total, task) => ({
          spirit: total.spirit + (Number(task.reward?.spirit) || 0),
          spiritStones: total.spiritStones + (Number(task.reward?.spiritStones) || 0),
          reinforceStones: total.reinforceStones + (Number(task.reward?.reinforceStones) || 0),
          refinementStones: total.refinementStones + (Number(task.reward?.refinementStones) || 0)
        }),
        { spirit: 0, spiritStones: 0, reinforceStones: 0, refinementStones: 0 }
      )
      this.spirit += reward.spirit
      this.spiritStones += reward.spiritStones
      this.reinforceStones += reward.reinforceStones
      this.refinementStones += reward.refinementStones
      daily.claimed = true
      this.saveData()
      return { success: true, reward }
    },
    // 导出存档数据
    async exportData() {
      try {
        // 导出前强制冲刷防抖保存，避免用户刚完成的动作还留在内存队列中。
        await this.saveData({ immediate: true })
        const data = await GameDB.getData('playerData')
        return data
      } catch (error) {
        console.error('导出存档失败:', error)
        throw error
      }
    },
    // 导入存档数据
    async importData(encryptedData) {
      try {
        const importedData = decryptData(encryptedData)
        if (!importedData || !validateData(importedData)) {
          throw new Error('存档数据无效或已损坏')
        }
        await this.saveData({ immediate: true })
        await GameDB.setData('playerData', encryptedData)
        this.$reset()
        await this.initializePlayer()
      } catch (error) {
        console.error('导入存档失败:', error)
        throw error
      }
    },
    // 手动恢复最近一次有效的本地存档，不依赖账号服务。
    async restoreLocalBackup() {
      const backupData = await GameDB.getBackup('playerData')
      const restoredData = backupData ? decryptData(backupData) : null
      if (!restoredData || !validateData(restoredData)) {
        throw new Error('没有找到可恢复的本地备份')
      }
      await GameDB.setData('playerData', backupData)
      this.$reset()
      await this.initializePlayer()
      return true
    },
    // 清除存档数据
    async clearData() {
      try {
        await this.saveData({ immediate: true })
        await GameDB.setData('playerData', null)
        await GameDB.clearBackup('playerData')
        this.$reset()
      } catch (error) {
        console.error('清除存档失败:', error)
        throw error
      }
    },
    // 获取灵力
    gainSpirit(amount) {
      const value = Number(amount) || 0
      const pillRate = 1 + Math.max(0, this.getActiveEffectValue('spiritRate'))
      this.spirit += value * this.spiritRate * pillRate
      this.saveData()
    },
    // 修炼增加修为
    cultivate(amount) {
      // 确保amount是数字类型
      const baseAmount = Number(String(amount).replace(/[^0-9.-]/g, '')) || 0
      const pillRate = 1 + Math.max(
        0,
        this.getActiveEffectValue('cultivationRate') + this.getActiveEffectValue('cultivationEfficiency')
      )
      const numAmount = baseAmount * pillRate
      this.cultivation = Number(String(this.cultivation).replace(/[^0-9.-]/g, '')) || 0
      this.cultivation += numAmount
      this.totalCultivationTime += 1 // 增加修炼时间统计
      if (this.cultivation >= this.maxCultivation) {
        this.tryBreakthrough()
      }
      this.recordDailyAction('cultivate')
      this.saveData()
    },
    // 尝试突破
    tryBreakthrough() {
      // 境界等级对应的境界名称和修为上限
      const realmsLength = getRealmLength()
      // 检查是否可以突破到下一个境界
      if (this.level < realmsLength) {
        const nextLevel = this.realm === '无修为' ? this.level : this.level + 1
        const nextRealm = getRealmName(nextLevel)
        // 更新境界信息
        this.level = nextLevel
        this.realm = nextRealm.name // 使用完整的境界名称（如：练气一层）
        this.maxCultivation = nextRealm.maxCultivation
        this.cultivation = 0 // 重置修为值
        this.breakthroughCount += 1 // 增加突破次数
        // 解锁新境界
        if (!this.unlockedRealms.includes(nextRealm.name)) {
          this.unlockedRealms.push(nextRealm.name)
        }
        // 突破奖励
        this.spirit += 100 * this.level // 获得灵力奖励
        this.spiritRate *= 1.2 // 提升灵力获取倍率
        this.saveData()
        return true
      }
      return false
    },
    // 获得物品
    gainItem(item) {
      this.items.push(item)
      this.itemsFound++ // 增加获得物品统计
      this.saveData()
    },
    // 使用物品（丹药或灵宠）
    useItem(item) {
      if (item.type === 'pill') {
        return this.usePill(item)
      } else if (item.type === 'pet') {
        return this.usePet(item)
      }
      return { success: false, message: '无法使用该物品' }
    },
    // 卖出装备
    async sellEquipment(equipment) {
      if (equipmentOperationBusy) return { success: false, message: '正在处理上一件装备，请稍候' }
      const index = this.items.findIndex(i => i?.id === equipment?.id && i.type !== 'pill' && i.type !== 'pet')
      if (index === -1) {
        return { success: false, message: '装备不存在' }
      }
      equipmentOperationBusy = true
      return new Promise(resolve => {
        let worker
        let timeoutId
        try {
          worker = new Worker(new URL('../workers/equipment.js', import.meta.url))
        } catch (error) {
          equipmentOperationBusy = false
          console.error('创建装备出售 Worker 失败:', error)
          resolve({ success: false, message: '装备出售模块暂时失效，请稍后重试' })
          return
        }
        let finished = false
        const finish = result => {
          if (finished) return
          finished = true
          clearTimeout(timeoutId)
          equipmentOperationBusy = false
          worker.terminate()
          resolve(result)
        }
        worker.onmessage = e => {
          const { stoneAmount, itemId } = e.data || {}
          const currentIndex = this.items.findIndex(i => i?.id === itemId)
          if (itemId !== equipment.id || currentIndex === -1 || !Number.isFinite(Number(stoneAmount))) {
            finish({ success: false, message: '装备出售结果无效' })
            return
          }
          this.reinforceStones += Number(stoneAmount)
          this.items.splice(currentIndex, 1)
          this.saveData()
          finish({ success: true, message: `成功卖出装备，获得${stoneAmount}个强化石` })
        }
        worker.onerror = () => {
          finish({ success: false, message: '装备出售失败，请稍后重试' })
        }
        // 只传递必要的数据
        timeoutId = setTimeout(() => finish({ success: false, message: '装备出售超时，请稍后重试' }), 10000)
        try {
          worker.postMessage({
            type: 'single',
            equipment: {
              id: equipment.id,
              quality: equipment.quality
            }
          })
        } catch (error) {
          console.error('发送装备出售请求失败:', error)
          finish({ success: false, message: '装备出售失败，请稍后重试' })
        }
      })
    },
    // 批量卖出装备
    async batchSellEquipments(quality = null, equipmentType = null) {
      if (equipmentOperationBusy) return { success: false, message: '正在处理上一批装备，请稍候' }
      const itemsToSell = this.items
        .filter(item => {
          if (!item || !item.type || item.type === 'pill' || item.type === 'pet' || !item.id) return false
          if (equipmentType && item.type !== equipmentType) return false
          if (quality && item.quality !== quality) return false
          return true
        })
        .map(item => ({ id: item.id, type: item.type, quality: item.quality }))
      if (!itemsToSell.length) return { success: false, message: '没有符合条件的装备' }
      equipmentOperationBusy = true
      return new Promise(resolve => {
        let worker
        let timeoutId
        try {
          worker = new Worker(new URL('../workers/equipment.js', import.meta.url))
        } catch (error) {
          equipmentOperationBusy = false
          console.error('创建批量出售 Worker 失败:', error)
          resolve({ success: false, message: '装备出售模块暂时失效，请稍后重试' })
          return
        }
        let finished = false
        const finish = result => {
          if (finished) return
          finished = true
          clearTimeout(timeoutId)
          equipmentOperationBusy = false
          worker.terminate()
          resolve(result)
        }
        worker.onmessage = e => {
          const { totalStones, itemsToRemove, count } = e.data || {}
          const validIds = new Set(itemsToSell.map(item => item.id))
          if (!Number.isFinite(Number(totalStones)) || !Array.isArray(itemsToRemove) || itemsToRemove.some(id => !validIds.has(id))) {
            finish({ success: false, message: '批量出售结果无效' })
            return
          }
          this.reinforceStones += Number(totalStones)
          this.items = this.items.filter(item => !itemsToRemove.includes(item.id))
          this.saveData()
          finish({
            success: true,
            message: `成功卖出${count}件装备，获得${totalStones}个强化石`
          })
        }
        worker.onerror = () => {
          finish({ success: false, message: '批量出售失败，请稍后重试' })
        }
        // 发送简化后的数据
        timeoutId = setTimeout(() => finish({ success: false, message: '批量出售超时，请稍后重试' }), 10000)
        try {
          worker.postMessage({
            type: 'batch',
            items: JSON.parse(JSON.stringify(itemsToSell)),
            quality,
            equipmentType
          })
        } catch (error) {
          console.error('发送批量出售请求失败:', error)
          finish({ success: false, message: '批量出售失败，请稍后重试' })
        }
      })
    },
    // 使用丹药
    usePill(pill) {
      if (!pill?.id || pill.type !== 'pill') {
        return { success: false, message: '丹药数据无效' }
      }
      const index = this.items.findIndex(i => i.id === pill.id && i.type === 'pill')
      if (index === -1) {
        return { success: false, message: '丹药不存在或已使用' }
      }
      const ownedPill = this.items[index]
      if (!ownedPill.effect || !ownedPill.effect.type) {
        return { success: false, message: '丹药效果数据无效' }
      }
      const duration = Number(ownedPill.effect.duration)
      const value = Number(ownedPill.effect.value)
      if (!Number.isFinite(duration) || duration <= 0) {
        return { success: false, message: '丹药效果数据无效' }
      }
      if (!Number.isFinite(value)) {
        return { success: false, message: '丹药效果数值无效' }
      }
      const now = Date.now()
      // 添加效果
      this.activeEffects.push({
        ...ownedPill.effect,
        value,
        startTime: now,
        endTime: now + duration * 1000
      })
      // 移除已使用的丹药
      this.items.splice(index, 1)
      this.pillsConsumed++
      // 清理过期效果
      this.activeEffects = this.activeEffects.filter(effect => effect.endTime > now)
      this.saveData()
      return { success: true, message: '使用丹药成功' }
    },
    // 使用灵宠（出战/召回）
    usePet(pet) {
      const inventoryPet = this.items.find(item => item?.id === pet?.id && item.type === 'pet')
      if (!inventoryPet) {
        return { success: false, message: '灵宠不存在于背包中' }
      }
      pet = inventoryPet
      // 如果当前没有出战灵宠，直接出战新灵宠
      if (!this.activePet) {
        return this.deployPet(pet)
      }
      // 如果点击的是当前出战灵宠，则召回
      if (this.activePet.id === pet.id) {
        return this.recallPet()
      }
      // 如果点击的是其他灵宠，先召回当前灵宠，再出战新灵宠
      this.recallPet()
      return this.deployPet(pet)
    },
    // 召回灵宠
    recallPet() {
      if (!this.activePet) {
        return { success: false, message: '当前没有出战的灵宠' }
      }
      // 重置所有属性加成
      this.resetPetBonuses()
      this.activePet = null
      this.saveData()
      return { success: true, message: '召回成功' }
    },
    // 出战灵宠
    deployPet(pet) {
      const inventoryPet = this.items.find(item => item?.id === pet?.id && item.type === 'pet')
      if (!inventoryPet) {
        return { success: false, message: '灵宠不存在于背包中' }
      }
      if (this.activePet?.id === inventoryPet.id) {
        return { success: false, message: '该灵宠已经出战' }
      }
      // 如果已有灵宠出战，先召回
      if (this.activePet) {
        this.recallPet()
      }
      // 出战新灵宠
      this.activePet = inventoryPet
      // 应用灵宠属性加成
      this.applyPetBonuses()
      this.saveData()
      return { success: true, message: '出战成功' }
    },
    // 重置灵宠属性加成
    resetPetBonuses() {
      const petBonus = this.activePet?.combatAttributes || {}
      // 保存原始属性值
      const originalBaseAttributes = { ...this.baseAttributes }
      const originalCombatAttributes = { ...this.combatAttributes }
      const originalCombatResistance = { ...this.combatResistance }
      const originalSpecialAttributes = { ...this.specialAttributes }
      // 更新基础属性
      this.baseAttributes.attack = originalBaseAttributes.attack - (petBonus.attack || 0)
      this.baseAttributes.defense = originalBaseAttributes.defense - (petBonus.defense || 0)
      this.baseAttributes.health = originalBaseAttributes.health - (petBonus.health || 0)
      this.baseAttributes.speed = originalBaseAttributes.speed - (petBonus.speed || 0)
      // 更新战斗属性
      Object.keys(this.combatAttributes).forEach(key => {
        this.combatAttributes[key] = originalCombatAttributes[key] - (petBonus[key] || 0)
      })
      // 更新战斗抗性
      Object.keys(this.combatResistance).forEach(key => {
        this.combatResistance[key] = originalCombatResistance[key] - (petBonus[key] || 0)
      })
      // 更新特殊属性
      Object.keys(this.specialAttributes).forEach(key => {
        this.specialAttributes[key] = originalSpecialAttributes[key] - (petBonus[key] || 0)
      })
    },
    // 应用灵宠属性加成
    applyPetBonuses() {
      if (!this.activePet) return
      const petBonus = this.activePet.combatAttributes || {}
      // 保存原始属性值
      const originalBaseAttributes = { ...this.baseAttributes }
      const originalCombatAttributes = { ...this.combatAttributes }
      const originalCombatResistance = { ...this.combatResistance }
      const originalSpecialAttributes = { ...this.specialAttributes }
      // 更新基础属性
      this.baseAttributes.attack = originalBaseAttributes.attack + (petBonus.attack || 0)
      this.baseAttributes.defense = originalBaseAttributes.defense + (petBonus.defense || 0)
      this.baseAttributes.health = originalBaseAttributes.health + (petBonus.health || 0)
      this.baseAttributes.speed = originalBaseAttributes.speed + (petBonus.speed || 0)
      // 更新战斗属性
      Object.keys(this.combatAttributes).forEach(key => {
        this.combatAttributes[key] = originalCombatAttributes[key] + (petBonus[key] || 0)
      })
      // 更新战斗抗性
      Object.keys(this.combatResistance).forEach(key => {
        this.combatResistance[key] = originalCombatResistance[key] + (petBonus[key] || 0)
      })
      // 更新特殊属性
      Object.keys(this.specialAttributes).forEach(key => {
        this.specialAttributes[key] = originalSpecialAttributes[key] + (petBonus[key] || 0)
      })
    },
    // 穿上装备
    equipArtifact(artifact, slot) {
      const validSlots = Object.keys(this.equippedArtifacts)
      if (!artifact?.id || !validSlots.includes(slot)) {
        return { success: false, message: '装备或装备栏位无效' }
      }
      const index = this.items.findIndex(item => item?.id === artifact.id)
      if (index === -1) {
        return { success: false, message: '装备不存在于背包中' }
      }
      const inventoryArtifact = this.items[index]
      if (inventoryArtifact.type !== slot || (inventoryArtifact.slot && inventoryArtifact.slot !== slot)) {
        return { success: false, message: '装备类型与装备栏位不匹配' }
      }
      const requiredRealm = Number(inventoryArtifact.requiredRealm)
      if (Number.isFinite(requiredRealm) && this.level < requiredRealm) {
        return { success: false, message: '境界不足，无法装备此装备' }
      }
      if (this.equippedArtifacts[slot]?.id === inventoryArtifact.id) {
        return { success: false, message: '该装备已经装备' }
      }
      // 先卸下当前装备
      if (this.equippedArtifacts[slot]) {
        this.unequipArtifact(slot)
      }
      // 从背包中移除装备
      const equippedArtifact = this.items.splice(index, 1)[0]
      // 穿上新装备
      this.equippedArtifacts[slot] = equippedArtifact
      // 应用装备加成
      if (equippedArtifact.stats) {
        Object.entries(equippedArtifact.stats).forEach(([key, rawValue]) => {
          const value = Number(rawValue)
          if (!Number.isFinite(value)) return
          // 先更新artifactBonuses
          if (this.artifactBonuses[key] !== undefined) {
            this.artifactBonuses[key] += value
            // 根据属性类型应用到对应的属性组
            if (key in this.baseAttributes) {
              this.baseAttributes[key] += value
            } else if (key in this.combatAttributes) {
              this.combatAttributes[key] += value
            } else if (key in this.combatResistance) {
              this.combatResistance[key] += value
            } else if (key in this.specialAttributes) {
              this.specialAttributes[key] += value
            } else if (key === 'cultivationRate' || key === 'spiritRate') {
              this[key] += value
            }
          }
        })
      }
      this.saveData()
      return { success: true, message: '装备成功' }
    },
    // 卸下装备
    unequipArtifact(slot) {
      if (!Object.prototype.hasOwnProperty.call(this.equippedArtifacts, slot)) return false
      const artifact = this.equippedArtifacts[slot]
      if (artifact) {
        // 移除装备加成
        if (artifact.stats) {
          Object.entries(artifact.stats).forEach(([key, rawValue]) => {
            const value = Number(rawValue)
            if (!Number.isFinite(value)) return
            if (this.artifactBonuses[key] !== undefined) {
              this.artifactBonuses[key] -= value
              // 从对应的属性组中移除加成
              if (key in this.baseAttributes) {
                this.baseAttributes[key] -= value
              } else if (key in this.combatAttributes) {
                this.combatAttributes[key] -= value
              } else if (key in this.combatResistance) {
                this.combatResistance[key] -= value
              } else if (key in this.specialAttributes) {
                this.specialAttributes[key] -= value
              } else if (key === 'cultivationRate' || key === 'spiritRate') {
                this[key] -= value
              }
            }
          })
        }
        // 将装备返回到背包
        this.items.push(artifact)
        this.equippedArtifacts[slot] = null
        this.saveData()
        return true
      }
      return false
    },
    // 获取装备总加成
    getArtifactBonus(type) {
      return this.artifactBonuses[type] ?? 0
    },
    // 根据当前装备栏重新计算装备加成，避免强化或洗练已装备法宝后属性不同步
    recalculateArtifactBonuses() {
      const bonusDefaults = {
        attack: 0,
        health: 0,
        defense: 0,
        speed: 0,
        critRate: 0,
        comboRate: 0,
        counterRate: 0,
        stunRate: 0,
        dodgeRate: 0,
        vampireRate: 0,
        critResist: 0,
        comboResist: 0,
        counterResist: 0,
        stunResist: 0,
        dodgeResist: 0,
        vampireResist: 0,
        healBoost: 0,
        critDamageBoost: 0,
        critDamageReduce: 0,
        finalDamageBoost: 0,
        finalDamageReduce: 0,
        combatBoost: 0,
        resistanceBoost: 0,
        cultivationRate: 1,
        spiritRate: 1
      }
      Object.entries(this.artifactBonuses || {}).forEach(([key, rawValue]) => {
        const value = Number(rawValue)
        if (!Number.isFinite(value)) return
        const actualValue = key === 'cultivationRate' || key === 'spiritRate' ? value - 1 : value
        if (key in this.baseAttributes) this.baseAttributes[key] -= actualValue
        else if (key in this.combatAttributes) this.combatAttributes[key] -= actualValue
        else if (key in this.combatResistance) this.combatResistance[key] -= actualValue
        else if (key in this.specialAttributes) this.specialAttributes[key] -= actualValue
        else if (key === 'cultivationRate' || key === 'spiritRate') this[key] -= actualValue
      })
      this.artifactBonuses = { ...bonusDefaults }
      Object.values(this.equippedArtifacts || {}).forEach(artifact => {
        Object.entries(artifact?.stats || {}).forEach(([key, rawValue]) => {
          const value = Number(rawValue)
          if (!Number.isFinite(value) || this.artifactBonuses[key] === undefined) return
          this.artifactBonuses[key] += value
          if (key in this.baseAttributes) this.baseAttributes[key] += value
          else if (key in this.combatAttributes) this.combatAttributes[key] += value
          else if (key in this.combatResistance) this.combatResistance[key] += value
          else if (key in this.specialAttributes) this.specialAttributes[key] += value
          else if (key === 'cultivationRate' || key === 'spiritRate') this[key] += value
        })
      })
      this.saveData()
    },
    // 获得丹方残页
    gainPillFragment(recipeId) {
      if (!this.pillFragments[recipeId]) {
        this.pillFragments[recipeId] = 0
      }
      this.pillFragments[recipeId]++
      // 检查是否可以合成完整丹方
      const recipe = pillRecipes.find(r => r.id === recipeId)
      if (recipe && this.pillFragments[recipeId] >= recipe.fragmentsNeeded) {
        this.pillFragments[recipeId] -= recipe.fragmentsNeeded
        if (!this.pillRecipes.includes(recipeId)) {
          this.pillRecipes.push(recipeId)
          this.unlockedPillRecipes++
        }
      }
      this.saveData()
    },
    // 炼制丹药
    craftPill(recipeId, processBonus = 0) {
      const recipe = pillRecipes.find(r => r.id === recipeId)
      if (!recipe || !this.pillRecipes.includes(recipeId)) {
        return { success: false, message: '未掌握丹方' }
      }
      const fragments = this.pillFragments[recipeId] || 0
      const safeProcessBonus = Math.min(0.2, Math.max(0, Number(processBonus) || 0))
      const result = tryCreatePill(recipe, this.herbs, this, fragments, this.luck * this.alchemyRate * (1 + safeProcessBonus))
      if (result.success) {
        // 消耗材料
        recipe.materials.forEach(material => {
          for (let i = 0; i < material.count; i++) {
            const index = this.herbs.findIndex(h => h.id === material.herb)
            if (index > -1) {
              this.herbs.splice(index, 1)
            }
          }
        })
        // 创建丹药
        const effect = calculatePillEffect(recipe, this.level)
        const pill = {
          id: `${recipe.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: recipe.name,
          description: recipe.description,
          type: 'pill',
          effect
        }
        this.items.push(pill)
        this.pillsCrafted++
        this.recordDailyAction('alchemy')
        this.saveData()
      }
      return result
    },
    // 获取当前有效的丹药效果
    getActiveEffects() {
      const now = Date.now()
      return this.activeEffects.filter(effect => effect.endTime > now)
    },
    getActiveEffectValue(type) {
      return this.getActiveEffects()
        .filter(effect => effect.type === type)
        .reduce((total, effect) => total + (Number(effect.value) || 0), 0)
    },
    // 添加装备到背包
    addEquipment(equipment) {
      if (!this.items) {
        this.items = []
      }
      this.items.push(equipment)
      this.saveData()
    },
    // 升级灵宠
    upgradePet(pet, essenceCount) {
      const petIndex = this.items.findIndex(item => item.id === pet?.id && item.type === 'pet')
      const cost = Number(essenceCount)
      if (petIndex === -1) {
        return { success: false, message: '灵宠不存在' }
      }
      if (!Number.isFinite(cost) || cost <= 0) {
        return { success: false, message: '升级消耗无效' }
      }
      if (this.petEssence < cost) {
        return { success: false, message: '灵宠精华不足' }
      }
      const isActivePet = this.activePet?.id === pet.id
      if (isActivePet) this.resetPetBonuses()
      // 消耗精华并提升等级
      this.petEssence -= cost
      const currentPet = this.items[petIndex]
      currentPet.level = (currentPet.level || 1) + 1
      // 根据品质和等级提升战斗属性
      const qualityMultiplier =
        {
          divine: 2.0,
          celestial: 1.8,
          mystic: 1.6,
          spiritual: 1.4,
          mortal: 1.2
        }[currentPet.rarity] || 1.2
      const stats = currentPet.combatAttributes || {}
      const rate = 0.01 * qualityMultiplier
      // 更新战斗属性
      currentPet.combatAttributes = {
        attack: Math.floor((stats.attack || 0) * (1 + rate)),
        health: Math.floor((stats.health || 0) * (1 + rate)),
        defense: Math.floor((stats.defense || 0) * (1 + rate)),
        speed: Math.floor((stats.speed || 0) * (1 + rate)),
        critRate: (stats.critRate || 0) + rate,
        comboRate: (stats.comboRate || 0) + rate,
        counterRate: (stats.counterRate || 0) + rate,
        stunRate: (stats.stunRate || 0) + rate,
        dodgeRate: (stats.dodgeRate || 0) + rate,
        vampireRate: (stats.vampireRate || 0) + rate,
        critResist: (stats.critResist || 0) + rate,
        comboResist: (stats.comboResist || 0) + rate,
        counterResist: (stats.counterResist || 0) + rate,
        stunResist: (stats.stunResist || 0) + rate,
        dodgeResist: (stats.dodgeResist || 0) + rate,
        vampireResist: (stats.vampireResist || 0) + rate,
        healBoost: (stats.healBoost || 0) + rate,
        critDamageBoost: (stats.critDamageBoost || 0) + rate,
        critDamageReduce: (stats.critDamageReduce || 0) + rate,
        finalDamageBoost: (stats.finalDamageBoost || 0) + rate,
        finalDamageReduce: (stats.finalDamageReduce || 0) + rate,
        combatBoost: (stats.combatBoost || 0) + rate,
        resistanceBoost: (stats.resistanceBoost || 0) + rate
      }
      // 出战灵宠先撤销旧加成，再应用升级后的新加成
      if (isActivePet) {
        this.activePet = currentPet
        this.applyPetBonuses()
      }
      this.saveData()
      return { success: true, message: '升级成功' }
    },
    // 升星灵宠
    evolvePet(pet, foodPet) {
      // 检查是否是相同品质和名字的灵宠
      if (
        !pet?.id ||
        !foodPet?.id ||
        pet.id === foodPet.id ||
        pet.type !== 'pet' ||
        foodPet.type !== 'pet' ||
        pet.rarity !== foodPet.rarity ||
        pet.name !== foodPet.name ||
        (pet.star || 0) !== (foodPet.star || 0)
      ) {
        return { success: false, message: '只能使用相同品质和名字的灵宠进行升星' }
      }
      if (this.activePet?.id === foodPet.id) {
        return { success: false, message: '出战中的灵宠不能作为升星材料' }
      }
      const petIndex = this.items.findIndex(item => item.id === pet.id)
      const foodPetIndex = this.items.findIndex(item => item.id === foodPet.id)
      if (petIndex > -1 && foodPetIndex > -1) {
        const targetPet = this.items[petIndex]
        const materialPet = this.items[foodPetIndex]
        const isActivePet = this.activePet?.id === targetPet.id
        if (isActivePet) this.resetPetBonuses()
        // 返还作为升星材料的灵宠已消耗的精华
        const returnEssence = Math.max(0, ((materialPet.level || 1) - 1) * 10) // 假设每级消耗10精华
        this.petEssence += returnEssence
        // 移除作为材料的灵宠
        this.items.splice(foodPetIndex, 1)
        // 提升目标灵宠星级
        targetPet.star = (targetPet.star || 0) + 1
        if (isActivePet) {
          this.activePet = targetPet
          this.applyPetBonuses()
        }
        this.saveData()
        return { success: true, message: '升星成功' }
      }
      return { success: false, message: '升星失败' }
    }
  }
})
