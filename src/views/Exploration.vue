<template>
  <n-layout>
    <n-layout-header bordered>
      <n-page-header>
        <template #title>探索</template>
      </n-page-header>
    </n-layout-header>
    <n-layout-content>
      <n-card :bordered="false">
        <n-space vertical>
          <n-alert type="info" show-icon>
            <template #icon>
              <n-icon>
                <compass-outline />
              </n-icon>
            </template>
            探索各处秘境，寻找机缘造化。小心谨慎，危险与机遇并存。
          </n-alert>
          <n-grid :cols="2" :x-gap="12">
            <n-grid-item v-for="location in availableLocations" :key="location.id">
              <n-card :title="location.name" size="small">
                <n-space vertical>
                  <n-text depth="3">{{ location.description }}</n-text>
                  <n-space justify="space-between">
                    <n-text>消耗灵力：{{ location.spiritCost }}</n-text>
                    <n-text>最低境界：{{ getRealmName(location.minLevel).name }}</n-text>
                  </n-space>
                  <n-space>
                    <n-button
                      type="primary"
                      @click="exploreLocation(location)"
                      :disabled="playerStore.spirit < location.spiritCost || isAutoExploring || isExplorationPending"
                    >
                      探索
                    </n-button>
                    <n-button
                      :type="exploringLocations[location.id] ? 'warning' : 'success'"
                      @click="
                        exploringLocations[location.id] ? stopAutoExploration(location) : startAutoExploration(location)
                      "
                      :disabled="
                        playerStore.spirit < location.spiritCost ||
                        (isAutoExploring && !exploringLocations[location.id])
                      "
                    >
                      {{ exploringLocations[location.id] ? '停止' : '自动' }}
                    </n-button>
                  </n-space>
                </n-space>
              </n-card>
            </n-grid-item>
          </n-grid>
          <n-divider>探索统计</n-divider>
          <n-descriptions :column="2" bordered>
            <n-descriptions-item label="探索次数">
              {{ playerStore.explorationCount }}
            </n-descriptions-item>
            <n-descriptions-item label="灵石数量">
              {{ playerStore.spiritStones }}
            </n-descriptions-item>
            <n-descriptions-item label="灵草数量">
              {{ playerStore.herbs.length }}
            </n-descriptions-item>
            <n-descriptions-item label="丹方残页">
              {{ Object.values(playerStore.pillFragments || {}).reduce((a, b) => a + b, 0) }}
            </n-descriptions-item>
          </n-descriptions>
        </n-space>
      </n-card>
      <n-space justify="end" style="margin-bottom: 8px">
        <n-button size="small" @click="clearLogPanel" type="error" secondary>清空日志</n-button>
      </n-space>
      <log-panel ref="logRef" title="探索日志" />
    </n-layout-content>
  </n-layout>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { usePlayerStore } from '../stores/player'
  import { CompassOutline } from '@vicons/ionicons5'
  import { getRealmName } from '../plugins/realm'
  import { locations } from '../plugins/locations'
  import { triggerRandomEvent, getRandomReward, handleReward } from '../plugins/events'
  import LogPanel from '../components/LogPanel.vue'

  const logRef = ref(null)
  const playerStore = usePlayerStore()
  // 探索相关数值
  const explorationInterval = 3000 // 探索间隔（毫秒）
  const exploringLocations = ref({}) // 记录每个地点的探索状态
  const explorationTimers = ref({}) // 记录每个地点的定时器
  const isAutoExploring = ref(false) // 是否有地点正在自动探索
  const autoExploringLocationId = ref(null) // 正在自动探索的地点ID
  const explorationWorker = ref(null)
  const isExplorationPending = ref(false)
  let explorationPendingTimer = null
  let workerRestartTimer = null

  const clearExplorationPending = () => {
    if (explorationPendingTimer) {
      clearTimeout(explorationPendingTimer)
      explorationPendingTimer = null
    }
    isExplorationPending.value = false
  }

  // 初始化 Web Worker
  const initWorker = () => {
    if (explorationWorker.value) return
    try {
      explorationWorker.value = new Worker(new URL('../workers/exploration.js', import.meta.url), { type: 'module' })
    } catch (error) {
      console.error('创建探索 Worker 失败:', error)
      explorationWorker.value = null
      showMessage('error', '探索模块暂时失效，请刷新页面重试')
      return
    }
    explorationWorker.value.onmessage = ({ data }) => {
      if (data.type === 'exploration_result') {
        handleExplorationResult(data)
      } else if (data.type === 'error') {
        clearExplorationPending()
        showMessage('error', data.message)
      }
    }
    explorationWorker.value.onerror = error => {
      console.error('探索 Worker 异常:', error)
      clearExplorationPending()
      showMessage('error', '探索模块暂时失效，请重试')
      explorationWorker.value?.terminate()
      explorationWorker.value = null
      if (isAutoExploring.value) stopAutoExploration({ id: autoExploringLocationId.value })
      clearTimeout(workerRestartTimer)
      workerRestartTimer = setTimeout(() => {
        workerRestartTimer = null
        if (!explorationWorker.value) initWorker()
      }, 300)
    }
  }

  // 处理探索结果
  const handleExplorationResult = result => {
    clearExplorationPending()
    const spiritCost = Number(result?.spiritCost)
    const location = availableLocations.value.find(loc => loc.id === result?.locationId)
    if (!location || !Number.isFinite(spiritCost) || spiritCost !== Number(location.spiritCost) || spiritCost < 0) {
      showMessage('error', '探索结果无效，本次探索已取消')
      return
    }
    if (playerStore.spirit < spiritCost) {
      showMessage('error', '当前灵力不足，本次探索已取消')
      return
    }
    playerStore.spirit = Math.max(0, playerStore.spirit - spiritCost)
    playerStore.explorationCount++
    playerStore.recordDailyAction('explore')

    if (result.eventTriggered) {
      if (triggerRandomEvent(playerStore, showMessage)) {
        showMessage('info', '你的福缘不错，触发了一个特殊事件！')
      }
    } else {
      if (location && Array.isArray(location.rewards)) {
        const reward = getRandomReward(location.rewards)
        if (reward) {
          if (result.rewardMultiplier > 1) {
            reward.amount = Math.floor(reward.amount * result.rewardMultiplier)
            showMessage('success', '福缘加持，获得了更多奖励！')
          }
          handleReward(reward, playerStore, showMessage)
        }
      } else {
        showMessage('error', '无法获取探索奖励，请检查地点配置')
      }
    }
    playerStore.saveData()
  }

  // 探索指定地点
  const exploreLocation = location => {
    if (isExplorationPending.value) return
    if (playerStore.spirit < location.spiritCost) {
      showMessage('error', '灵力不足！')
      return
    }
    if (!explorationWorker.value) {
      showMessage('error', '探索模块尚未准备好，请稍后再试')
      return
    }
    isExplorationPending.value = true
    try {
      explorationWorker.value.postMessage({
        type: 'explore',
        playerData: { luck: playerStore.luck },
        location
      })
      explorationPendingTimer = setTimeout(() => {
        clearExplorationPending()
        showMessage('error', '探索计算超时，本次探索未扣除灵力')
      }, 10000)
    } catch (error) {
      console.error('发送探索请求失败:', error)
      clearExplorationPending()
      showMessage('error', '探索模块暂时失效，请稍后重试')
    }
  }

  // 组件挂载时初始化 Worker
  onMounted(() => {
    initWorker()
  })

  // 组件卸载时清理 Worker 和定时器
  onUnmounted(() => {
    clearExplorationPending()
    clearTimeout(workerRestartTimer)
    workerRestartTimer = null
    if (explorationWorker.value) {
      explorationWorker.value.terminate()
    }
    Object.values(explorationTimers.value).forEach(timer => clearInterval(timer))
    explorationTimers.value = {}
    exploringLocations.value = {}
  })

  // 获取可用地点列表
  const availableLocations = computed(() => {
    return locations.filter(loc => playerStore.level >= loc.minLevel)
  })

  // 显示消息并处理重复
  const showMessage = (type, content) => {
    return logRef.value?.addLog(type, content)
  }

  // 开始自动探索
  const startAutoExploration = location => {
    if (exploringLocations.value[location.id] || isAutoExploring.value) return
    isAutoExploring.value = true
    autoExploringLocationId.value = location.id
    exploringLocations.value[location.id] = true
    explorationTimers.value[location.id] = setInterval(() => {
      if (isExplorationPending.value) return
      if (playerStore.spirit >= location.spiritCost) {
        exploreLocation(location)
      } else {
        stopAutoExploration(location)
        showMessage('warning', '灵力不足，自动探索已停止！')
      }
    }, explorationInterval)
  }

  // 停止自动探索
  const stopAutoExploration = location => {
    if (explorationTimers.value[location.id]) {
      clearInterval(explorationTimers.value[location.id])
      delete explorationTimers.value[location.id]
    }
    exploringLocations.value[location.id] = false
    isAutoExploring.value = false
    autoExploringLocationId.value = null
  }

  // 组件卸载时清理所有定时器
  onUnmounted(() => {
    Object.values(explorationTimers.value).forEach(timer => clearInterval(timer))
    explorationTimers.value = {}
    exploringLocations.value = {}
  })

  const clearLogPanel = () => {
    logRef.value?.clearLogs()
  }
</script>

<style scoped>
  .n-space {
    width: 100%;
  }

  .n-card {
    margin-bottom: 12px;
  }

  .n-collapse {
    margin-top: 12px;
  }
</style>
