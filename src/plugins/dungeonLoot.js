const qualityConfig = {
  common: { name: '凡品', color: '#9e9e9e', statMod: 1 },
  uncommon: { name: '下品', color: '#4caf50', statMod: 1.2 },
  rare: { name: '中品', color: '#2196f3', statMod: 1.5 },
  epic: { name: '上品', color: '#9c27b0', statMod: 2 }
}

const equipmentConfig = {
  weapon: {
    name: '武器',
    prefixes: ['沉星', '听雨', '青岑', '照夜', '归潮'],
    stats: {
      attack: [8, 14],
      critRate: [0.02, 0.06]
    }
  },
  artifact: {
    name: '法宝',
    prefixes: ['云纹', '玄玉', '照骨', '渡厄', '镇岳'],
    stats: {
      attack: [4, 8],
      finalDamageBoost: [0.03, 0.08]
    }
  }
}

const randomBetween = (min, max) => min + Math.random() * (max - min)

const generateDungeonEquipment = ({ floor = 1, level = 1, type = 'weapon', quality = 'common' } = {}) => {
  const config = equipmentConfig[type] || equipmentConfig.weapon
  const qualityInfo = qualityConfig[quality] || qualityConfig.common
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1))
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1))
  const levelScale = 1 + Math.min(safeFloor, 20) * 0.03 + Math.min(safeLevel, 20) * 0.05
  const stats = Object.fromEntries(
    Object.entries(config.stats).map(([stat, [min, max]]) => {
      const value = randomBetween(min, max) * qualityInfo.statMod * levelScale
      const isPercentage = ['critRate', 'finalDamageBoost'].includes(stat)
      return [stat, isPercentage ? Number(value.toFixed(2)) : Math.max(1, Math.round(value))]
    })
  )
  const prefix = config.prefixes[Math.floor(Math.random() * config.prefixes.length)]
  const suffix = quality === 'epic' ? '·上品' : quality === 'rare' ? '·中品' : quality === 'uncommon' ? '·下品' : ''
  const requiredRealm = Math.max(1, Math.min(safeLevel, Math.ceil(safeFloor / 5)))

  return {
    id: `dungeon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${prefix}${config.name}${suffix}`,
    type,
    slot: type,
    equipType: type,
    quality,
    qualityInfo,
    level: requiredRealm,
    requiredRealm,
    enhanceLevel: 0,
    stats
  }
}

const getDungeonLootQuality = floor => {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1))
  if (safeFloor % 10 === 0) return 'epic'
  if (safeFloor % 5 === 0) return 'rare'
  if (safeFloor % 3 === 0) return 'uncommon'
  return 'common'
}

export { generateDungeonEquipment, getDungeonLootQuality }
