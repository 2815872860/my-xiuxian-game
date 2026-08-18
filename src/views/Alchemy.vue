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
            <n-card
              :title="recipe.name"
              size="small"
              hoverable
              :class="{ 'recipe-card--selected': selectedRecipe?.id === recipe.id }"
              @click="selectRecipe(recipe)"
            >
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
      <!-- 分阶段炼丹：先备材，再控火，最后收丹，避免只有一次点击。 -->
      <section v-if="selectedRecipe" class="alchemy-workbench">
        <div class="workbench-heading">
          <div>
            <p>丹炉三诀</p>
            <h3>{{ alchemyPhase === 'select' ? '第一步 · 备材入炉' : alchemyPhase === 'fire' ? '第二步 · 控火炼化' : '第三步 · 凝丹收火' }}</h3>
          </div>
          <span>{{ hasMaterials ? '材料齐备' : '材料未齐' }}</span>
        </div>
        <div class="alchemy-steps" aria-label="炼丹进度">
          <span :class="{ active: alchemyPhase === 'select', done: alchemyPhase !== 'select' }">备材</span>
          <i></i>
          <span :class="{ active: alchemyPhase === 'fire', done: alchemyPhase === 'finish' }">控火</span>
          <i></i>
          <span :class="{ active: alchemyPhase === 'finish' }">凝丹</span>
        </div>

        <div v-if="alchemyPhase === 'select'" class="workbench-stage">
          <p>先确认灵草是否齐全。材料不足时可以直接去探索采集，不会消耗现有材料。</p>
          <n-space>
            <n-button type="primary" @click="prepareFurnace">检查材料并起炉</n-button>
            <n-button v-if="!hasMaterials" @click="router.push('/exploration')">去探索补材</n-button>
          </n-space>
        </div>

        <div v-else-if="alchemyPhase === 'fire'" class="workbench-stage">
          <div class="fire-meter"><span>火候 {{ firePower }}%</span><i><b :style="{ width: `${firePower}%` }"></b></i></div>
          <n-slider v-model:value="firePower" :min="20" :max="100" :step="5" />
          <div class="fire-modes">
            <button v-for="mode in fireModes" :key="mode.id" type="button" :class="{ selected: fireMode === mode.id }" @click="fireMode = mode.id">
              <b>{{ mode.name }}</b><small>{{ mode.description }}</small>
            </button>
          </div>
          <p class="fire-hint">火候评分：<b>{{ fireScore }}</b> · {{ fireHint }}</p>
          <n-button type="primary" @click="lockFire">锁定火候，凝丹</n-button>
        </div>

        <div v-else class="workbench-stage workbench-stage--result">
          <div class="result-seal">丹</div>
          <div><p>炉火已稳，当前成丹把握</p><strong>{{ (effectiveSuccessRate * 100).toFixed(1) }}%</strong><small>火候评分 {{ fireScore }} · {{ fireModes.find(mode => mode.id === fireMode)?.name }}</small></div>
          <n-space>
            <n-button class="craft-button" type="primary" @click="craftPill">收丹入囊</n-button>
            <n-button @click="resetAlchemy">重新控火</n-button>
          </n-space>
        </div>
      </section>
    </n-space>
    <log-panel v-if="selectedRecipe" ref="logRef" title="炼丹日志" />
  </n-card>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePlayerStore } from '../stores/player'
  import { pillRecipes, pillGrades, pillTypes, calculatePillEffect } from '../plugins/pills'
  import { herbs } from '../plugins/herbs'
  import LogPanel from '../components/LogPanel.vue'

  const playerStore = usePlayerStore()
  const router = useRouter()
  const logRef = ref(null)

  // 当前选择的丹方
  const selectedRecipe = ref(null)
  const alchemyPhase = ref('select')
  const firePower = ref(60)
  const fireMode = ref('steady')
  const fireModes = [
    { id: 'slow', name: '文火', description: '温养药性，失误较少' },
    { id: 'steady', name: '中火', description: '火力均衡，适合聚灵丹' },
    { id: 'fierce', name: '猛火', description: '缩短时间，但更难驾驭' }
  ]

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
    resetAlchemy()
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

  const hasMaterials = computed(() => checkMaterials(selectedRecipe.value))
  const fireTarget = computed(() => {
    const grade = Number(selectedRecipe.value?.grade?.replace('grade', '')) || 1
    return Math.min(86, 56 + grade * 4)
  })
  const fireScore = computed(() => {
    const modeBonus = { slow: 6, steady: 12, fierce: -4 }[fireMode.value] || 0
    return Math.max(0, Math.min(100, Math.round(100 - Math.abs(firePower.value - fireTarget.value) * 1.8 + modeBonus)))
  })
  const fireQualityBonus = computed(() => Math.min(0.2, Math.max(0, (fireScore.value - 60) / 350)))
  const effectiveSuccessRate = computed(() => Math.min(1, currentSuccessRate.value * (1 + fireQualityBonus.value)))
  const fireHint = computed(() => {
    if (fireScore.value >= 88) return '炉火与药性相合，适合凝丹。'
    if (fireScore.value >= 70) return '火候尚稳，成丹机会不错。'
    return '火候偏离丹方，仍可尝试，但要承担失败风险。'
  })

  const pillStockCount = computed(() => (playerStore.items || []).filter(item => item.type === 'pill').length)
  const alchemyBonus = computed(() => {
    const multiplier = (playerStore.luck ?? 1) * (playerStore.alchemyRate ?? 1)
    return Math.max(0, multiplier - 1)
  })

  // 炼制丹药
  const prepareFurnace = () => {
    if (!hasMaterials.value) {
      logRef.value?.addLog('error', `无法起炉：还缺少${getRecipeMaterialSummary(selectedRecipe.value)}。`)
      return
    }
    alchemyPhase.value = 'fire'
  }
  const lockFire = () => {
    alchemyPhase.value = 'finish'
  }
  const resetAlchemy = () => {
    alchemyPhase.value = 'select'
    firePower.value = 60
    fireMode.value = 'steady'
  }
  const craftPill = () => {
    if (!selectedRecipe.value || alchemyPhase.value !== 'finish' || !hasMaterials.value) return
    const result = playerStore.craftPill(selectedRecipe.value.id, fireQualityBonus.value)
    if (result.success) {
      logRef.value?.addLog('success', `炼制成功：${selectedRecipe.value.name}，火候评分 ${fireScore.value}，已收入行囊。`)
      // 播放成功动画效果
      const btn = document.querySelector('.craft-button')
      if (btn) {
        btn.classList.add('success-animation')
        setTimeout(() => {
          btn.classList.remove('success-animation')
        }, 1000)
      }
    } else {
      logRef.value?.addLog('error', `炼制失败：${result.message}（火候评分 ${fireScore.value}，当前成功率约 ${(effectiveSuccessRate.value * 100).toFixed(1)}%）`)
      // 播放失败动画效果
      const btn = document.querySelector('.craft-button')
      if (btn) {
        btn.classList.add('fail-animation')
        setTimeout(() => {
          btn.classList.remove('fail-animation')
        }, 1000)
      }
    }
    resetAlchemy()
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

  .recipe-card--selected { border-color: #a35d44; box-shadow: 0 0 0 1px rgba(163, 93, 68, .28); }
  .alchemy-workbench { padding: 16px; border: 1px solid rgba(163, 93, 68, .24); border-radius: 10px; background: linear-gradient(135deg, rgba(163, 93, 68, .08), rgba(255, 252, 244, .72)); }
  .workbench-heading { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
  .workbench-heading p { margin: 0; color: #a35d44; font-size: 11px; letter-spacing: .1em; }
  .workbench-heading h3 { margin: 6px 0 0; font-size: 17px; }
  .workbench-heading > span { color: #7c857b; font-size: 11px; }
  .alchemy-steps { display: flex; align-items: center; gap: 7px; margin: 15px 0; color: #9aa095; font-size: 11px; }
  .alchemy-steps span { padding: 4px 8px; border: 1px solid rgba(39, 50, 46, .14); border-radius: 999px; }
  .alchemy-steps span.active, .alchemy-steps span.done { color: #a35d44; border-color: rgba(163, 93, 68, .45); background: rgba(163, 93, 68, .08); }
  .alchemy-steps i { width: 18px; border-top: 1px dashed rgba(39, 50, 46, .2); }
  .workbench-stage { display: grid; gap: 13px; }
  .workbench-stage > p { margin: 0; color: #7c857b; font-size: 12px; line-height: 1.8; }
  .fire-meter { display: flex; justify-content: space-between; color: #7c857b; font-size: 12px; }
  .fire-meter i { display: block; width: 58%; height: 5px; margin-top: 6px; overflow: hidden; border-radius: 99px; background: rgba(39, 50, 46, .12); }
  .fire-meter i b { display: block; height: 100%; background: linear-gradient(90deg, #6e9a86, #d46b45); transition: width .2s ease; }
  .fire-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .fire-modes button { min-height: 58px; padding: 8px; color: #7c857b; background: rgba(255, 252, 244, .58); border: 1px solid rgba(39, 50, 46, .14); border-radius: 7px; text-align: left; cursor: pointer; }
  .fire-modes button.selected { color: #a35d44; border-color: #a35d44; background: rgba(163, 93, 68, .08); }
  .fire-modes b, .fire-modes small { display: block; }.fire-modes b { font-size: 13px; }.fire-modes small { margin-top: 5px; font-size: 10px; }
  .fire-hint { color: #a35d44 !important; }.fire-hint b { font-size: 18px; }
  .workbench-stage--result { grid-template-columns: auto 1fr auto; align-items: center; }
  .result-seal { display: grid; place-items: center; width: 43px; height: 43px; color: #f4efe4; background: #a35d44; font-size: 21px; }
  .workbench-stage--result p, .workbench-stage--result strong, .workbench-stage--result small { display: block; margin: 0; }.workbench-stage--result p, .workbench-stage--result small { color: #7c857b; font-size: 11px; }.workbench-stage--result strong { margin: 3px 0; color: #a35d44; font-size: 22px; }

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

  @media (max-width: 600px) {
    .fire-modes { grid-template-columns: 1fr; }
    .workbench-stage--result { grid-template-columns: auto 1fr; }
    .workbench-stage--result > .n-space { grid-column: 1 / -1; }
  }
</style>
