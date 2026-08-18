// 计算当前境界的修炼消耗
const getCurrentCultivationCost = level => {
  const baseCultivationCost = 10
  return Math.floor(baseCultivationCost * Math.pow(1.5, level - 1))
}

// 计算当前境界的修炼获得
const getCurrentCultivationGain = level => {
  const baseCultivationGain = 1
  return Math.floor(baseCultivationGain * Math.pow(1.2, level - 1))
}

// 计算实际获得的修为
const calculateCultivationGain = (level, luck) => {
  const extraCultivationChance = 0.3
  let gain = getCurrentCultivationGain(level)
  if (Math.random() < Math.min(1, Math.max(0, extraCultivationChance * (Number(luck) || 0)))) {
    gain *= 2
  }
  return gain
}

self.onmessage = ({ data }) => {
  const { type, playerData } = data
  if (type === 'cultivateUntilBreakthrough') {
    try {
      const safeLevel = Math.max(1, Math.floor(Number(playerData.level) || 1))
      const safeSpirit = Math.max(0, Number(playerData.spirit) || 0)
      const safeCultivation = Math.max(0, Number(playerData.cultivation) || 0)
      const safeMaxCultivation = Math.max(safeCultivation, Number(playerData.maxCultivation) || 0)
      const safeLuck = Number(playerData.luck) || 0
      const currentCost = getCurrentCultivationCost(safeLevel)
      const gain = getCurrentCultivationGain(safeLevel)
      if (gain <= 0) {
        self.postMessage({ type: 'error', message: '修炼效率异常' })
        return
      }
      const remainingCultivation = Math.max(0, safeMaxCultivation - safeCultivation)
      const times = Math.ceil(remainingCultivation / gain)
      if (times > 100000) {
        self.postMessage({ type: 'error', message: '本次修炼跨度过大，请分段修炼' })
        return
      }
      const totalCost = times * currentCost
      if (safeSpirit < totalCost) {
        self.postMessage({
          type: 'error',
          message: `灵力不足！突破需要${totalCost}灵力，当前灵力：${safeSpirit.toFixed(1)}`
        })
        return
      }
      let totalGain = 0
      let doubleGainTimes = 0
      for (let i = 0; i < times; i++) {
        const currentGain = calculateCultivationGain(safeLevel, safeLuck)
        if (currentGain > gain) doubleGainTimes++
        totalGain += currentGain
      }
      self.postMessage({
        type: 'success',
        result: {
          spiritCost: totalCost,
          cultivationGain: totalGain,
          doubleGainTimes
        }
      })
    } catch (error) {
      self.postMessage({ type: 'error', message: '修炼计算出错' })
    }
  }
}
