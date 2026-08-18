<template>
  <n-card title="丹药炼制">
    <n-space vertical>
      <div class="alchemy-summary">
        <div>
          <span>已炼制</span>
          <b>{{ playerStore.pillsCrafted }}</b>
          <small>炉</small>
        </div>
        <div>
          <span>丹药库存</span>
          <b>{{ pillStockCount }}</b>
          <small>枚</small>
        </div>
        <div>
          <span>炼丹加成</span>
          <b>{{ (alchemyBonus * 100).toFixed(0) }}%</b>
          <small>成功率</small>
        </div>
      </div>
      <template v-if="unlockedRecipes.length > 0">
        <n-divider>丹方选择</n-divider>
        <!-- 丹方选择 -->
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item v-for="recipe in unlockedRecipes" :key="recipe.id">
            <n-card :title="recipe.name" size="small">
              <n-space vertical>
                <n-text depth="3">{{ recipe.description }}</n-text>
                <n-space>
                  <n-tag type="info">{{ pillGrades[recipe.grade].name }}</n-tag>
                  <n-tag type="warning">{{ pillTypes[recipe.type].name }}</n-tag>
                </n-space>
                <n-space justify="space-between" align="center">
                  <n-tag :type="checkMaterials(recipe) ? 'success' : 'warning'" size="small">
                    {{ checkMaterials(recipe) ? '材料齐全' : '材料不足' }}
                  </n-tag>
                  <n-text depth="3" class="material-summary">{{ getRecipeMaterialSummary(recipe) }}</n-text>
                </n-space>
                <n-button
                  @click="selectRecipe(recipe)"
                  block
                  :type="selectedRecipe?.id === recipe.id ? 'primary' : 'default'"
                >
                  {{ selectedRecipe?.id === recipe.id ? '已选择' : '选择' }}
                </n-button>
              </n-space>
            </n-card>
          </n-grid-item>
        </n-grid>
      </template>
      <n-space vertical v-else>
        <n-empty description="暂未掌握任何丹方" />
      </n-space>
      <!-- 材料需求 -->
      <template v-if="selectedRecipe">
        <n-divider>材料需求</n-divider>
        <n-list>
          <n-list-item v-for="material in selectedRecipe.materials" :key="material.herb">
            <n-space justify="space-between">
              <n-space>
                <span>{{ getHerbName(material.herb) }}</span>
                <n-tag size="small">需要数量: {{ material.count }}</n-tag>
              </n-space>
              <n-tag
                :type="getMaterialStatus(material) === `${material.count}/${material.count}` ? 'success' : 'warning'"
              >
                拥有: {{ getMaterialStatus(material) }}
              </n-tag>
            </n-space>
          </n-list-item>
        </n-list>
      </template>
      <!-- 效果预览 -->
      <template v-if="selectedRecipe">
        <n-divider>效果预览</n-divider>
        <n-descriptions bordered :column="2">
          <n-descriptions-item label="丹药介绍">
            {{ selectedRecipe.description }}
          </n-descriptions-item>
          <n-descriptions-item label="效果数值">+{{ (currentEffect.value * 100).toFixed(1) }}%</n-descriptions-item>
          <n-descriptions-item label="持续时间">{{ Math.floor(currentEffect.duration / 60) }}分钟</n-descriptions-item>
          <n-descriptions-item label="成功率">{{ (currentSuccessRate * 100).toFixed(1) }}%</n-descriptions-item>
        </n-descriptions>
      </template>
      <!-- 炼制按钮 -->
      <n-button
        class="craft-button"
        type="primary"
        block
        v-if="selectedRecipe"
        :disabled="!selectedRecipe || !checkMaterials(selectedRecipe)"
        @click="craftPill"
      >
        {{ !checkMaterials(selectedRecipe) ? '材料不足' : '开始炼制' }}
      </n-button>
    </n-space>
    <log-panel v-if="selectedRecipe" ref="logRef" title="炼丹日志" />
  </n-card>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { usePlayerStore } from '../stores/player'
  import { pillRecipes, pillGrades, pillTypes, calculatePillEffect } from '../plugins/pills'
  import { herbs } from '../plugins/herbs'
  import LogPanel from '../components/LogPanel.vue'

  const playerStore = usePlayerStore()
  const logRef = ref(null)

  // 当前选择的丹方
  const selectedRecipe = ref(null)

  // 已解锁的丹方列表
  const unlockedRecipes = computed(() => {
    return pillRecipes.filter(recipe => playerStore.pillRecipes.includes(recipe.id))
  })

  // 进入丹室时默认展示第一张已掌握丹方
  watch(
    unlockedRecipes,
    recipes => {
      if (!recipes.length) {
        selectedRecipe.value = null
        return
      }
      if (!selectedRecipe.value || !recipes.some(recipe => recipe.id === selectedRecipe.value.id)) {
        selectedRecipe.value = recipes[0]
      }
    },
    { immediate: true }
  )

  // 选择丹方
  const selectRecipe = recipe => {
    selectedRecipe.value = recipe
  }

  // 检查材料是否充足
  const checkMaterials = recipe => {
    if (!recipe) return false
    return recipe.materials.every(material => {
      const count = playerStore.herbs.filter(h => h.id === material.herb).length
      return count >= material.count
    })
  }

  // 获取材料状态文本
  const getMaterialStatus = material => {
    const count = playerStore.herbs.filter(h => h.id === material.herb).length
    return `${count}/${material.count}`
  }

  // 获取丹方卡片上的材料摘要
  const getRecipeMaterialSummary = recipe => {
    return recipe.materials.map(material => `${getHerbName(material.herb)} ×${material.count}`).join(' · ')
  }

  // 获取灵草名称
  const getHerbName = herbId => {
    const herb = herbs.find(h => h.id === herbId)
    return herb ? herb.name : herbId
  }

  // 计算当前效果
  const currentEffect = computed(() => {
    if (!selectedRecipe.value) return null
    return calculatePillEffect(selectedRecipe.value, playerStore.level)
  })

  // 显示计入幸运与炼丹加成后的实际成功率
  const currentSuccessRate = computed(() => {
    if (!selectedRecipe.value) return 0
    const baseRate = pillGrades[selectedRecipe.value.grade]?.successRate || 0
    const multiplier = (playerStore.luck ?? 1) * (playerStore.alchemyRate ?? 1)
    return Math.min(1, baseRate * multiplier)
  })

  const pillStockCount = computed(() => (playerStore.items || []).filter(item => item.type === 'pill').length)
  const alchemyBonus = computed(() => {
    const multiplier = (playerStore.luck ?? 1) * (playerStore.alchemyRate ?? 1)
    return Math.max(0, multiplier - 1)
  })

  // 炼制丹药
  const craftPill = () => {
    if (!selectedRecipe.value) return
    const result = playerStore.craftPill(selectedRecipe.value.id)
    if (result.success) {
      logRef.value?.addLog('success', `炼制成功：${selectedRecipe.value.name}，已收入行囊。`)
      // 播放成功动画效果
      const btn = document.querySelector('.craft-button')
      if (btn) {
        btn.classList.add('success-animation')
        setTimeout(() => {
          btn.classList.remove('success-animation')
        }, 1000)
      }
    } else {
      logRef.value?.addLog('error', `炼制失败：${result.message}（当前成功率约 ${(currentSuccessRate.value * 100).toFixed(1)}%）`)
      // 播放失败动画效果
      const btn = document.querySelector('.craft-button')
      if (btn) {
        btn.classList.add('fail-animation')
        setTimeout(() => {
          btn.classList.remove('fail-animation')
        }, 1000)
      }
    }
  }
</script>

<style scoped>
  .n-space {
    width: 100%;
  }

  .n-button {
    margin-bottom: 12px;
  }

  .n-collapse {
    margin-top: 12px;
  }

  .alchemy-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 6px;
  }

  .alchemy-summary > div {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 10px 12px;
    border: 1px solid rgba(163, 93, 68, 0.18);
    border-radius: 8px;
    background: rgba(163, 93, 68, 0.05);
  }

  .alchemy-summary span,
  .alchemy-summary small {
    color: #7c857b;
  }

  .alchemy-summary b {
    margin-left: auto;
    color: #a35d44;
    font-size: 18px;
  }

  .material-summary {
    max-width: 72%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .craft-button {
    position: relative;
    overflow: hidden;
  }

  @keyframes success-ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes fail-shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-10px);
    }
    75% {
      transform: translateX(10px);
    }
  }

  .success-animation::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    background: rgba(0, 255, 0, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: success-ripple 1s ease-out;
  }

  .fail-animation {
    animation: fail-shake 0.5s ease-in-out;
  }
</style>
