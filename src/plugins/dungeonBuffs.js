// 副本增益效果管理器
const dungeonBuffs = {
  // 存储当前应用的增益效果
  activeBuffs: [],
  // 应用增益效果
  apply(player, option) {
    // 添加到活跃增益列表
    this.activeBuffs.push({
      id: option.id,
      name: option.name,
      effect: option.effect
    })
  },
  // 清除所有增益效果
  clear() {
    // 增益只存在于当前战斗实体，退出副本时直接清空即可。
    this.activeBuffs = []
  },
  // 获取当前活跃的增益效果
  getActiveBuffs() {
    return this.activeBuffs
  }
}

export default dungeonBuffs
