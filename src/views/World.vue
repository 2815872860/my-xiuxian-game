<template>
  <main class="world-page">
    <section class="world-intro">
      <div>
        <p class="world-kicker">{{ chapterStage.kicker }}</p>
        <h1>{{ worldTitle }}</h1>
        <p class="world-lead">{{ worldLead }}</p>
      </div>
      <div class="day-marker"><span>行旅日</span><b>{{ worldState.day }}</b><small>{{ worldState.season }}</small></div>
    </section>

    <section class="world-layout">
      <article class="story-column">
        <div class="story-heading"><span class="story-seal">叙</span><div><p>当前章节</p><h2>{{ chapterStage.title }}</h2></div></div>
        <div class="character-status">
          <div class="character-portrait" :class="{ 'character-portrait--loaded': portraitReady }">
            <img :src="playerPortraitUrl" alt="玩家命相" @load="portraitReady = true" @error="portraitReady = false" />
            <span>{{ playerStore.race === 'demon' ? '妖' : playerStore.race === 'immortal' ? '仙' : '人' }}</span>
          </div>
          <div class="character-status-copy">
            <p>此身命相</p>
            <h3>{{ playerStore.name || '无名修士' }}</h3>
            <span>{{ raceName }} · {{ playerStore.realm || '未入境' }}</span>
          </div>
        </div>
        <div class="region-vignette" :class="{ 'region-vignette--loaded': regionImageReady }">
          <img :src="currentRegionAssetUrl" :alt="`${currentRegion.name}环境`" @load="regionImageReady = true" @error="regionImageReady = false" />
          <div><p>当前所在</p><b>{{ currentRegion.name }}</b><span>{{ currentRegion.subtitle }}</span></div>
        </div>
        <p class="story-text">{{ storyText }}</p>
        <div class="story-choice-list">
          <button v-for="choice in storyChoices" :key="choice.id" type="button" :class="{ selected: selectedChoice === choice.id }" @click="chooseStory(choice)">
            <span>{{ choice.mark }}</span><b>{{ choice.title }}</b><small>{{ choice.description }}</small>
          </button>
        </div>
        <div class="story-foot"><span>线索进度</span><div class="clue-progress"><i :style="{ width: `${Math.min((worldState.discoveredClues?.length || 0) / 3 * 100, 100)}%` }"></i></div><b>{{ worldState.discoveredClues?.length || 0 }} / 3</b></div>
      </article>

      <article class="map-column">
        <div class="map-heading"><div><p class="world-kicker">可见山河</p><h2>云岫一隅</h2></div><span><i></i>在线行旅</span></div>
        <div class="map-canvas">
          <img class="map-asset" :class="{ visible: mapImageReady }" :src="mapAssetUrl" alt="" @load="mapImageReady = true" @error="mapImageReady = false" />
          <div class="map-paper-noise"></div>
          <div class="map-mountain map-mountain--one"></div><div class="map-mountain map-mountain--two"></div><div class="map-mountain map-mountain--three"></div>
          <div class="map-river"></div><div class="map-river map-river--two"></div>
          <div class="map-route map-route--one"></div><div class="map-route map-route--two"></div><div class="map-route map-route--three"></div>
          <button v-for="region in regions" :key="region.id" type="button" class="map-region" :class="[{ active: currentRegion.id === region.id, visited: isVisited(region.id), locked: isRegionLocked(region) }, `map-region--${region.id}`]" :disabled="isRegionLocked(region)" @click="selectRegion(region)">
            <span class="region-dot"><i></i></span><b>{{ region.name }}</b><small>{{ isRegionLocked(region) ? '待寻' : region.subtitle }}</small>
          </button>
          <div class="map-compass"><span>北</span><i></i><b>山河图</b></div>
          <div class="map-scale">一寸山河 · 约三日行</div>
        </div>
        <div class="map-caption"><span>所在</span><b>{{ currentRegion.name }}</b><i></i><span>{{ currentRegion.description }}</span></div>
      </article>

      <aside class="decision-column">
        <div class="decision-heading"><p>今日行程</p><span>可暂停</span></div>
        <section class="daily-panel">
          <div class="daily-heading"><div><b>今日命课</b><small>完成三件小事，领取修行资源</small></div><span>{{ dailyState.claimed ? '已领取' : `${dailyCompletedCount}/${dailyState.tasks.length}` }}</span></div>
          <div v-for="task in dailyState.tasks" :key="task.id" class="daily-task">
            <div class="daily-task-copy"><b>{{ task.name }}</b><small>{{ task.description }}</small></div>
            <span>{{ task.progress }}/{{ task.target }}</span>
          </div>
          <button class="daily-claim" type="button" :disabled="!dailyReady || dailyState.claimed" @click="claimDailyRewards">{{ dailyState.claimed ? '今日奖励已领取' : dailyReady ? '领取今日奖励' : '完成命课后领取' }}</button>
        </section>
        <section class="new-player-guide">
          <div class="guide-heading"><span>初</span><div><b>第一日修行路线</b><small>{{ nextGoal.description }}</small></div></div>
          <ol>
            <li><b>引气吐纳</b><span>免费获得灵力，解锁后续行动</span></li>
            <li><b>静修一刻</b><span>消耗灵力换修为，积满后突破境界</span></li>
            <li><b>探索与采药</b><span>移动地图、采集灵草，逐步解锁山河</span></li>
            <li><b>丹室与秘境</b><span>用灵草炼丹、装备法器，再去秘境挑战</span></li>
          </ol>
          <div class="guide-goal"><span>当前建议</span><b>{{ nextGoal.title }}</b></div>
          <button class="guide-link" type="button" @click="followGuide">{{ nextGoal.actionLabel }} →</button>
        </section>
        <div class="action-list">
          <button v-for="action in actions" :key="action.id" type="button" :disabled="action.disabled" @click="performAction(action)">
            <span class="action-mark">{{ action.mark }}</span><span class="action-copy"><b>{{ action.name }}</b><small>{{ action.description }}</small></span><em>{{ action.cost ? `耗 ${action.cost} 灵力` : '不耗灵力' }}</em>
          </button>
        </div>
        <div class="relation-panel"><div class="relation-heading"><span>附近的人</span><button type="button" @click="showAllRelations = !showAllRelations">{{ showAllRelations ? '收起' : '展开' }}</button></div><div v-for="npc in visibleNpcs" :key="npc.id" class="npc-row"><span class="npc-avatar" :class="{ loaded: npcImageReady[npc.id] }"><img :src="npcAsset(npc.id)" :alt="npc.name" @load="npcImageReady[npc.id] = true" @error="npcImageReady[npc.id] = false" /><b>{{ npc.name.slice(0, 1) }}</b></span><div><b>{{ npc.name }}</b><small>{{ npc.role }}</small></div><i :class="npc.mood">{{ npc.attitude }}</i></div></div>
      </aside>
    </section>

    <section class="world-bottom">
      <div class="resource-strip"><span class="resource-title">行囊</span><div><i>灵石 <b>{{ playerStore.spiritStones }}</b></i><i>灵力 <b>{{ Math.floor(playerStore.spirit) }}</b></i><i>食物 <b>{{ foodCount }}</b></i><i>药材 <b>{{ playerStore.herbs?.length || 0 }}</b></i></div></div>
      <div class="journal-strip"><span>最近一笔</span><p>{{ latestJournal }}</p><button type="button" @click="router.push('/inventory')">查看行囊 →</button></div>
    </section>
    <section class="quest-strip">
      <div class="quest-heading"><p>修行主线</p><b>{{ nextQuest.title }}</b><small>{{ nextQuest.description }}</small></div>
      <div class="quest-steps">
        <div v-for="quest in questSteps" :key="quest.id" class="quest-step" :class="{ done: quest.done, active: quest.id === nextQuest.id }">
          <span>{{ quest.done ? '✓' : '·' }}</span><div><b>{{ quest.title }}</b><small>{{ quest.short }}</small></div>
        </div>
      </div>
    </section>
    <transition name="notice"><p v-if="notice" class="world-notice">{{ notice }}</p></transition>
  </main>
</template>

<script setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePlayerStore } from '../stores/player'

  const router = useRouter()
  const playerStore = usePlayerStore()
  const selectedChoice = ref(playerStore.worldState?.selectedChoice || null)
  const mapImageReady = ref(false)
  const portraitReady = ref(false)
  const regionImageReady = ref(false)
  const mapAssetUrl = './assets/characters/map-cloud-ridge.png'
  const showAllRelations = ref(false)
  const npcImageReady = reactive({})
  const notice = ref('')
  let noticeTimer
  const regions = [
    { id: 'village', name: '青石村', subtitle: '雨中灯火', description: '旧屋、石桥与一条通往山外的路', x: 0 },
    { id: 'sect', name: '云岑宗', subtitle: '晨钟未歇', description: '外门试剑台与藏经楼', x: 0 },
    { id: 'ferry', name: '听潮渡', subtitle: '潮声入梦', description: '商旅、散修与不问来处的旧渡', x: 0 },
    { id: 'demon', name: '万妖岭', subtitle: '月照深林', description: '妖族故土，暂以墨印标记', locked: true, x: 0 }
  ]
  const validRegionIds = new Set(regions.map(region => region.id))
  const storyChoices = [
    { id: 'listen', mark: '听', title: '先听雨里的声音', description: '静下来，辨认灵炁从何处来' },
    { id: 'door', mark: '推', title: '推开通往山外的门', description: '把未知当作第一件要做的事' },
    { id: 'wait', mark: '等', title: '等一个主动出现的人', description: '关系有时比机缘更早到来' }
  ]
  const npcData = [
    { id: 'qingluo', name: '沈青萝', role: '村中药师', attitude: '中立', mood: 'neutral' },
    { id: 'shuyin', name: '谢疏影', role: '游方剑客', attitude: '观望', mood: 'watch' },
    { id: 'oldman', name: '守桥老人', role: '渡口看守', attitude: '友善', mood: 'warm' }
  ]
  const regionalHerbs = {
    village: { id: 'spirit_grass', name: '青露草', description: '带着雨意的基础灵草' },
    sect: { id: 'cloud_flower', name: '云岑竹叶', description: '吸收晨钟灵音的清苦竹叶' },
    ferry: { id: 'frost_lotus', name: '潮生花', description: '在潮声里开合的水属性灵花' },
    demon: { id: 'dark_yin_grass', name: '月魄藤', description: '只在月光下显出纹路的妖岭藤' }
  }
  const npcAsset = id => ({
    qingluo: './assets/characters/npc-qingluo.png',
    shuyin: './assets/characters/npc-shuying.png',
    oldman: './assets/characters/npc-bridge-keeper.png'
  }[id] || './assets/characters/npc-qingluo.png')
  const storyText = computed(() => {
    const selected = storyChoices.find(choice => choice.id === selectedChoice.value)
    if (selected) return `你选择${selected.title}。${selected.description}。雨声没有停，山中的那点光却离你更近了。`
    return playerStore.birthStory || '雨声打在瓦上，像有人在很远的地方叩门。你握住那枚旧玉时，村外的山忽然亮了一瞬。'
  })
  const raceName = computed(() => ({ human: '人族', immortal: '仙族', demon: '妖族' }[playerStore.race] || '人族'))
  const playerPortraitUrl = computed(() => {
    const appearanceId = playerStore.characterProfile?.appearanceId || playerStore.appearanceId
    const assetId = appearanceId === 'I-M-03' ? 'I-M-01' : appearanceId
    return assetId && assetId !== 'custom'
      ? `./assets/characters/character-card-${assetId}.png`
      : './assets/characters/character-hero-placeholder.png'
  })
  const currentRegionAssetUrl = computed(() => `./assets/characters/region-${currentRegion.value.id}.png`)
  const currentHerb = computed(() => regionalHerbs[currentRegion.value.id] || regionalHerbs.village)
  const worldState = computed(() => playerStore.worldState || { day: 1, season: '初春', currentRegion: playerStore.origin || 'village', visitedRegions: [], daily: { day: 1, claimed: false, tasks: [] } })
  const currentRegion = computed(() => regions.find(region => region.id === worldState.value.currentRegion) || regions[0])
  const chapterStage = computed(() => {
    const visited = worldState.value.visitedRegions || []
    if (visited.includes('demon')) return { kicker: '第三章 · 妖岭月照', title: '月下见真形' }
    if (visited.includes('sect') && visited.includes('ferry')) return { kicker: '第二章 · 山门与潮声', title: '路尽处有人等' }
    return { kicker: '第一章 · 山河初醒', title: '雨夜问心' }
  })
  const worldTitle = computed(() => currentRegion.value.name === '青石村' ? '雨停之前，先找到自己的路' : `从${currentRegion.value.name}望出去`)
  const worldLead = computed(() => currentRegion.value.description)
  const preferredNpcByRegion = {
    village: 'qingluo',
    sect: 'shuyin',
    ferry: 'oldman',
    demon: 'shuyin'
  }
  const visibleNpcs = computed(() => {
    const preferredId = preferredNpcByRegion[currentRegion.value.id]
    const orderedNpcs = [...npcData].sort((a, b) => Number(b.id === preferredId) - Number(a.id === preferredId))
    const relations = orderedNpcs.map(npc => ({
      ...npc,
      attitude: playerStore.worldState?.relationshipLedger?.[npc.id] > 0 ? '渐亲' : npc.attitude
    }))
    return showAllRelations.value ? relations : relations.slice(0, 2)
  })
  const foodCount = computed(() => (playerStore.items || []).filter(item => item.type === 'food').length)
  const latestJournal = computed(() => {
    const journal = playerStore.worldState?.journal || []
    return journal.length ? journal[journal.length - 1].text : '你刚刚翻开命书，第一道风从门前经过。'
  })
  const dailyState = computed(() => worldState.value.daily || { day: worldState.value.day, claimed: false, tasks: [] })
  const dailyCompletedCount = computed(() => dailyState.value.tasks.filter(task => task.progress >= task.target).length)
  const dailyReady = computed(() => dailyState.value.tasks.length > 0 && dailyCompletedCount.value === dailyState.value.tasks.length)
  const isRegionLocked = region => {
    if (region.id !== 'demon') return Boolean(region.locked)
    if (playerStore.origin === 'demon') return false
    const visited = worldState.value.visitedRegions || []
    return !visited.includes('sect') || !visited.includes('ferry')
  }
  const actions = computed(() => [
    { id: 'breathe', mark: '引', name: '引气吐纳', description: '顺着雨声吸纳第一缕可用灵炁', cost: 0, disabled: false },
    { id: 'cultivate', mark: '静', name: '静修一刻', description: '让灵炁沿着新生经脉走一周天', cost: 10, disabled: playerStore.spirit < 10 },
    { id: 'gather', mark: '采', name: '寻一味药材', description: `在${currentRegion.value.name}寻找${currentHerb.value.name}`, cost: 5, disabled: playerStore.spirit < 5 },
    { id: 'meet', mark: '访', name: '拜访附近的人', description: '把一段关系写进今日的因果', cost: 0, disabled: false },
    { id: 'rest', mark: '息', name: '整理行囊', description: '检查食物、药材与法器耗损', cost: 0, disabled: false }
  ])
  const nextGoal = computed(() => {
    if (Number(playerStore.spirit) < 10) {
      return { title: '先引气吐纳', description: '先积攒灵力，静修和远行都需要它。', actionLabel: '在此引气', actionId: 'breathe' }
    }
    if (Number(playerStore.totalCultivationTime) < 1) {
      return { title: '静修一刻', description: '灵力达到 10 点后，可以把灵力转成修为。', actionLabel: '去修炼', path: '/cultivation' }
    }
    if (!Object.values(playerStore.equippedArtifacts || {}).some(Boolean)) {
      return { title: '整理背包', description: '先检查装备和丹药，再挑战更危险的地方。', actionLabel: '打开背包', path: '/inventory' }
    }
    if (Number(playerStore.explorationCount) < 1) {
      return { title: '去探索采药', description: '灵草可以用于炼丹，也是早期最稳定的成长资源。', actionLabel: '去探索', path: '/exploration' }
    }
    const spiritGrassCount = (playerStore.herbs || []).filter(herb => herb.id === 'spirit_grass').length
    const cloudFlowerCount = (playerStore.herbs || []).filter(herb => herb.id === 'cloud_flower').length
    if (Number(playerStore.pillsCrafted) < 1 && spiritGrassCount >= 2 && cloudFlowerCount >= 1) {
      return { title: '炼制第一炉聚灵丹', description: '材料已经备齐，炼成丹药后能让后续修行更稳定。', actionLabel: '去丹室', path: '/alchemy' }
    }
    if (Number(playerStore.pillsCrafted) < 1) {
      return { title: '补齐炼丹材料', description: '聚灵丹需要两株青露草和一朵云岑竹叶，继续探索青石村附近。', actionLabel: '去采药', path: '/exploration' }
    }
    if (Number(playerStore.dungeonHighestFloor) < 1) {
      return { title: '挑战第一层秘境', description: '战斗会产出强化资源，胜利后继续逐层深入。', actionLabel: '进入秘境', path: '/dungeon' }
    }
    return { title: '继续探索山河', description: '解锁云岑宗、听潮渡，再前往万妖岭寻找主线线索。', actionLabel: '去探索', path: '/exploration' }
  })
  const questSteps = computed(() => {
    const state = worldState.value
    const choiceMade = Boolean(state.selectedChoice) || (state.storyFlags || []).some(flag => String(flag).startsWith('choice-'))
    return [
      { id: 'choice', title: '留下第一笔因果', short: '完成雨夜选择', description: '在雨夜做出第一道选择', done: choiceMade },
      { id: 'cultivation', title: '让灵炁入脉', short: '完成一次静修', description: '让灵力真正转化为修为', done: Number(playerStore.totalCultivationTime) > 0 },
      { id: 'equipment', title: '背剑出门', short: '装备一件法器', description: '装备木剑或其他法器', done: Object.values(playerStore.equippedArtifacts || {}).some(Boolean) },
      { id: 'journey', title: '走过两处山河', short: '解锁新的地点', description: '移动地图，留下新的足迹', done: (state.visitedRegions || []).length >= 2 },
      { id: 'alchemy', title: '炉火照见道心', short: '炼制第一枚丹药', description: '用探索得到的灵草炼成聚灵丹', done: Number(playerStore.pillsCrafted) > 0 },
      { id: 'dungeon', title: '秘境初战', short: '通关第一层', description: '击败第一层秘境敌人', done: Number(playerStore.dungeonHighestFloor) >= 1 }
    ]
  })
  const nextQuest = computed(() => questSteps.value.find(quest => !quest.done) || questSteps.value[questSteps.value.length - 1])

  const flash = message => {
    notice.value = message
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => (notice.value = ''), 2600)
  }
  const isVisited = id => worldState.value.visitedRegions?.includes(id)
  const persist = () => playerStore.saveData()
  const ensureWorldState = () => {
    if (!playerStore.worldState || typeof playerStore.worldState !== 'object') {
      playerStore.worldState = {
        day: 1,
        season: '初春',
        currentRegion: playerStore.origin || 'village',
        visitedRegions: [],
        discoveredClues: [],
        relationshipLedger: {},
        storyFlags: [],
        journal: []
      }
    }
    const state = playerStore.worldState
    if (typeof state.currentRegion !== 'string' || !validRegionIds.has(state.currentRegion)) {
      state.currentRegion = validRegionIds.has(playerStore.origin) ? playerStore.origin : 'village'
    }
    state.day = Math.max(1, Math.floor(Number(state.day) || 1))
    if (!Array.isArray(state.discoveredClues)) state.discoveredClues = []
    if (!Array.isArray(state.visitedRegions)) state.visitedRegions = []
    state.visitedRegions = [...new Set(state.visitedRegions.filter(region => validRegionIds.has(region)))]
    if (!state.visitedRegions.includes(state.currentRegion)) state.visitedRegions.push(state.currentRegion)
    if (!state.relationshipLedger || typeof state.relationshipLedger !== 'object') state.relationshipLedger = {}
    if (!Array.isArray(state.storyFlags)) state.storyFlags = []
    if (!Array.isArray(state.journal)) state.journal = []
    playerStore.ensureDailyState()
    if (!Array.isArray(playerStore.unlockedLocations)) playerStore.unlockedLocations = []
    return state
  }
  const appendJournal = (text, title = '行旅札记') => {
    const state = ensureWorldState()
    state.journal = [...state.journal, { id: `${Date.now()}-${Math.random()}`, title, text, day: state.day }].slice(-12)
  }
  const selectRegion = region => {
    ensureWorldState()
    if (isRegionLocked(region)) return
    if (region.id === currentRegion.value.id) {
      flash(`你正在${region.name}，风从这里起。`)
      return
    }
    const cost = 8
    const spirit = Number(playerStore.spirit) || 0
    if (spirit < cost) {
      flash('灵力不够，先在原地调息片刻。')
      return
    }
    playerStore.spirit = Math.max(0, spirit - cost)
    playerStore.explorationCount += 1
    playerStore.worldState.currentRegion = region.id
    playerStore.advanceDay()
    playerStore.recordDailyAction('explore')
    if (!playerStore.worldState.visitedRegions.includes(region.id)) playerStore.worldState.visitedRegions.push(region.id)
    if (!playerStore.unlockedLocations.includes(region.name)) playerStore.unlockedLocations.push(region.name)
    appendJournal(`你沿着旧路走到${region.name}。${region.description}。`, '换一处山河')
    persist()
    flash(`已抵达${region.name}，耗用 ${cost} 灵力。`)
  }
  const chooseStory = choice => {
    const state = ensureWorldState()
    selectedChoice.value = choice.id
    state.selectedChoice = choice.id
    const choiceFlag = `choice-${choice.id}`
    const isFirstChoice = !state.storyFlags.includes(choiceFlag)
    if (isFirstChoice) state.storyFlags.push(choiceFlag)
    if (isFirstChoice && choice.id === 'listen') {
      if (!state.discoveredClues.includes('old-jade')) state.discoveredClues.push('old-jade')
      playerStore.gainSpirit(2)
      flash('你听见旧玉回应，灵力 +2')
    }
    if (isFirstChoice && choice.id === 'door') {
      playerStore.spiritStones += 6
      flash('你在门槛下找到 6 枚灵石')
    }
    if (isFirstChoice && choice.id === 'wait') {
      state.relationshipLedger.qingluo = (state.relationshipLedger.qingluo || 0) + 1
      flash('有人注意到了你的等待，关系 +1')
    }
    appendJournal(`你决定${choice.title}。${choice.description}。`, '第一道选择')
    persist()
  }
  const performAction = action => {
    if (!action || action.disabled) return
    ensureWorldState()
    const cost = Number(action.cost) || 0
    if (cost > 0) {
      const spirit = Number(playerStore.spirit) || 0
      if (spirit < cost) {
        flash('灵力不够，先在原地调息片刻。')
        return
      }
      playerStore.spirit = Math.max(0, spirit - cost)
    }
    if (action.id === 'breathe') {
      playerStore.gainSpirit(6)
      playerStore.recordDailyAction('breathe')
      appendJournal('你跟着雨声调整呼吸，终于捕捉到第一缕愿意靠近你的灵炁。', '引气入体')
      flash('灵力 +6，今日已向前一步')
    }
    if (action.id === 'cultivate') {
      playerStore.cultivate(4)
      appendJournal('你在屋檐下静坐，第一次感到灵炁不再只是传说。', '静修')
      flash('修为 +4，灵力 -10')
    }
    if (action.id === 'gather') {
      playerStore.herbs.push({ id: `herb-${Date.now()}`, ...currentHerb.value })
      playerStore.recordDailyAction('gather')
      appendJournal(`你在${currentRegion.value.name}找到${currentHerb.value.name}，${currentHerb.value.description}。`, '采药')
      flash(`获得${currentHerb.value.name}，灵力 -5`)
    }
    if (action.id === 'meet') {
      const id = currentRegion.value.id === 'ferry' ? 'oldman' : currentRegion.value.id === 'sect' ? 'shuyin' : 'qingluo'
      playerStore.worldState.relationshipLedger[id] = (playerStore.worldState.relationshipLedger[id] || 0) + 1
      playerStore.recordDailyAction('meet')
      appendJournal(`你与${npcData.find(npc => npc.id === id).name}交谈片刻，关系向前走了一小步。`, '人间相逢')
      flash('关系发生了微小变化')
    }
    if (action.id === 'rest') {
      appendJournal('你打开行囊，重新确认食物、药材与法器都还在。', '行囊')
      flash('行囊已整理，世界静止于此刻')
    }
    persist()
  }
  const claimDailyRewards = () => {
    const result = playerStore.claimDailyRewards()
    if (!result.success) {
      flash(result.message)
      return
    }
    const reward = result.reward
    flash(`今日命课完成，获得 ${reward.spirit} 灵力与 ${reward.spiritStones} 灵石`)
  }
  onMounted(() => {
    ensureWorldState()
    playerStore.saveData()
  })
  const followGuide = () => {
    if (nextGoal.value.actionId) {
      const action = actions.value.find(item => item.id === nextGoal.value.actionId)
      if (action) performAction(action)
      return
    }
    router.push(nextGoal.value.path)
  }
</script>

<style scoped>
  .world-page { --ink: #27322e; --muted: #7c857b; --paper: #f4efe4; --line: rgba(39, 50, 46, .15); --accent: #a35d44; position: relative; min-height: 100%; padding: 42px clamp(18px, 4vw, 64px) 48px; color: var(--ink); background: #e9e4d9; font-family: 'Noto Serif SC', 'Songti SC', Georgia, serif; }
  .world-page::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .27; background-image: radial-gradient(rgba(39, 50, 46, .12) .6px, transparent .7px); background-size: 5px 5px; mix-blend-mode: multiply; }
  .world-intro, .world-layout, .world-bottom, .quest-strip { position: relative; z-index: 1; max-width: 1440px; margin: 0 auto; }
  .world-intro { display: flex; justify-content: space-between; align-items: end; margin-bottom: 31px; }
  .world-kicker, .decision-heading p, .map-caption span, .resource-title { color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; letter-spacing: .17em; }
  .world-intro h1 { margin: 12px 0 8px; font-size: clamp(25px, 3vw, 39px); font-weight: 600; letter-spacing: .05em; }
  .world-lead { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; }
  .day-marker { display: grid; grid-template-columns: auto auto; align-items: end; gap: 2px 11px; min-width: 90px; padding: 9px 0 0 20px; border-left: 1px solid var(--line); }
  .day-marker span, .day-marker small { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .day-marker b { grid-row: 1 / 3; color: var(--accent); font-family: Georgia, serif; font-size: 34px; font-weight: 400; }
  .world-layout { display: grid; grid-template-columns: minmax(210px, .68fr) minmax(430px, 1.7fr) minmax(250px, .82fr); gap: 21px; align-items: stretch; }
  .story-column, .decision-column { padding: 22px 20px; background: rgba(247, 243, 234, .53); border: 1px solid var(--line); }
  .story-heading { display: flex; align-items: center; gap: 13px; padding-bottom: 20px; border-bottom: 1px solid var(--line); }
  .story-seal { display: grid; place-items: center; width: 34px; height: 34px; color: var(--paper); background: var(--accent); font-size: 17px; }
  .story-heading p { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .story-heading h2 { margin-top: 5px; font-size: 18px; }
  .character-status { display: flex; gap: 12px; align-items: center; margin: 18px 0 17px; padding: 10px; background: rgba(255, 252, 244, .56); border: 1px solid var(--line); }
  .character-portrait { position: relative; flex: none; width: 58px; height: 72px; overflow: hidden; background: linear-gradient(145deg, #a6b8aa, #6b7e76); border: 1px solid rgba(39, 50, 46, .17); }
  .character-portrait::after { content: ''; position: absolute; inset: 0; opacity: .28; background-image: radial-gradient(rgba(255, 251, 240, .7) .7px, transparent .8px); background-size: 4px 4px; mix-blend-mode: screen; }
  .character-portrait img { position: absolute; z-index: 1; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .25s ease; }
  .character-portrait--loaded img { opacity: 1; }
  .character-portrait span { position: absolute; z-index: 2; right: 6px; bottom: 5px; display: grid; place-items: center; width: 20px; height: 20px; color: var(--paper); background: rgba(39, 50, 46, .72); font-size: 10px; }
  .character-status-copy p, .character-status-copy h3, .character-status-copy span { display: block; }
  .character-status-copy p { color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; letter-spacing: .12em; }
  .character-status-copy h3 { margin: 6px 0 5px; color: var(--ink); font-size: 16px; font-weight: 600; }
  .character-status-copy span { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }
  .region-vignette { position: relative; display: flex; min-height: 78px; margin: 0 0 17px; overflow: hidden; background: #c1cdbf; border: 1px solid var(--line); }
  .region-vignette::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, rgba(39, 50, 46, .16), rgba(39, 50, 46, .02) 65%, rgba(39, 50, 46, .2)); }
  .region-vignette img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; filter: saturate(.82) sepia(.08); transition: opacity .25s ease; }
  .region-vignette--loaded img { opacity: 1; }
  .region-vignette > div { position: relative; z-index: 1; align-self: end; display: grid; gap: 3px; padding: 10px 12px; color: var(--paper); text-shadow: 0 1px 5px rgba(39, 50, 46, .7); }
  .region-vignette p, .region-vignette b, .region-vignette span { display: block; }
  .region-vignette p { font-family: 'Microsoft YaHei', sans-serif; font-size: 8px; letter-spacing: .14em; }
  .region-vignette b { font-size: 17px; font-weight: 600; }
  .region-vignette span { font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }
  .story-text { margin: 22px 0; color: #5f6b62; font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; line-height: 2; }
  .story-choice-list { display: grid; gap: 8px; }
  .story-choice-list button { display: grid; grid-template-columns: 22px 1fr; gap: 4px 9px; padding: 11px 10px; color: var(--muted); background: transparent; border: 1px solid var(--line); text-align: left; cursor: pointer; transition: .2s ease; }
  .story-choice-list button:hover, .story-choice-list button.selected { color: var(--ink); border-color: var(--accent); background: rgba(255, 252, 244, .54); }
  .story-choice-list button > span { grid-row: 1 / 3; color: var(--accent); font-size: 14px; }
  .story-choice-list b { font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; font-weight: 600; }
  .story-choice-list small { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; line-height: 1.6; }
  .story-foot { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; margin-top: 29px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }
  .clue-progress { height: 2px; background: var(--line); }
  .clue-progress i { display: block; height: 100%; background: var(--accent); transition: width .25s ease; }
  .story-foot b { color: var(--accent); font-weight: 400; }
  .map-column { min-width: 0; }
  .map-heading { display: flex; justify-content: space-between; align-items: end; padding: 0 6px 15px; }
  .map-heading h2 { margin-top: 8px; font-size: 24px; }
  .map-heading > span { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .map-heading > span i { display: inline-block; width: 5px; height: 5px; margin-right: 5px; border-radius: 50%; background: #73967d; }
  .map-canvas { position: relative; height: 495px; overflow: hidden; background: #d8dccd; border: 1px solid rgba(39, 50, 46, .16); box-shadow: 9px 10px 0 rgba(39, 50, 46, .09); }
  .map-asset { position: absolute; z-index: 1; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .35s ease; }
  .map-asset.visible { opacity: .78; }
  .map-canvas::before { content: ''; position: absolute; inset: 0; opacity: .17; background: radial-gradient(ellipse at 42% 40%, #f7f1de 0, transparent 53%), radial-gradient(ellipse at 78% 22%, #8fa79a 0, transparent 40%); }
  .map-paper-noise { position: absolute; inset: 0; opacity: .35; background-image: radial-gradient(rgba(50, 57, 48, .19) .5px, transparent .7px); background-size: 4px 4px; mix-blend-mode: multiply; }
  .map-mountain { position: absolute; width: 54%; height: 39%; opacity: .44; background: #65766b; clip-path: polygon(0 100%, 13% 59%, 25% 68%, 42% 22%, 54% 68%, 70% 46%, 100% 100%); }
  .map-mountain--one { top: 2%; left: 2%; transform: scale(.75); }
  .map-mountain--two { top: 18%; right: -4%; opacity: .27; transform: scale(1.2); }
  .map-mountain--three { bottom: -5%; left: 17%; opacity: .25; transform: rotate(3deg) scale(1.25); }
  .map-river { position: absolute; top: -10%; left: 44%; width: 22%; height: 125%; border-right: 3px solid rgba(96, 139, 140, .5); border-radius: 52% 48% 57% 43%; transform: rotate(23deg); }
  .map-river--two { top: 27%; left: 58%; width: 36%; height: 85%; opacity: .5; border-right-width: 1px; transform: rotate(-42deg); }
  .map-route { position: absolute; height: 1px; border-top: 1px dashed rgba(106, 75, 55, .48); transform-origin: left; }
  .map-route--one { left: 19%; top: 61%; width: 43%; transform: rotate(-20deg); }
  .map-route--two { left: 47%; top: 42%; width: 30%; transform: rotate(15deg); }
  .map-route--three { left: 21%; top: 61%; width: 37%; transform: rotate(23deg); }
  .map-region { position: absolute; z-index: 2; display: grid; justify-items: center; gap: 4px; min-width: 78px; padding: 4px 6px; color: var(--ink); background: transparent; border: 0; cursor: pointer; transform: translate(-50%, -50%); }
  .map-region--village { left: 22%; top: 63%; }.map-region--sect { left: 48%; top: 38%; }.map-region--ferry { left: 68%; top: 72%; }.map-region--demon { left: 76%; top: 20%; }
  .map-region:hover:not(:disabled) { color: var(--accent); }
  .region-dot { display: grid; place-items: center; width: 23px; height: 23px; border: 1px solid var(--accent); border-radius: 50%; background: rgba(244, 239, 228, .78); }
  .region-dot i { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  .map-region.active .region-dot { border-width: 2px; box-shadow: 0 0 0 5px rgba(163, 93, 68, .13); }
  .map-region.active .region-dot i { width: 9px; height: 9px; }
  .map-region.visited:not(.active) .region-dot { border-color: #6c8978; }.map-region.visited:not(.active) .region-dot i { background: #6c8978; }
  .map-region.locked { opacity: .55; cursor: not-allowed; filter: grayscale(.35); }
  .map-region b { font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; font-weight: 600; }.map-region small { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }
  .map-compass { position: absolute; top: 21px; right: 22px; display: grid; justify-items: center; gap: 3px; color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }.map-compass i { display: block; width: 29px; height: 29px; border: 1px solid var(--accent); border-radius: 50%; transform: rotate(45deg); }.map-compass i::after { content: ''; display: block; width: 1px; height: 41px; margin: -7px auto; background: var(--accent); transform: rotate(-45deg); }.map-compass b { margin-top: 8px; color: var(--muted); font-weight: 400; }
  .map-scale { position: absolute; right: 22px; bottom: 19px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }
  .map-caption { display: flex; align-items: center; gap: 9px; padding: 15px 6px 0; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }.map-caption b { color: var(--ink); font-size: 12px; }.map-caption i { width: 3px; height: 3px; border-radius: 50%; background: var(--accent); }
  .decision-column { padding: 23px 16px; }.decision-heading { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--line); }.decision-heading span { color: #70917a; font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }
  .daily-panel { padding: 13px 0 15px; border-bottom: 1px solid var(--line); }
  .daily-heading { display: flex; align-items: start; justify-content: space-between; gap: 10px; }
  .daily-heading b, .daily-heading small { display: block; font-family: 'Microsoft YaHei', sans-serif; }
  .daily-heading b { color: var(--accent); font-size: 11px; }
  .daily-heading small { margin-top: 4px; color: var(--muted); font-size: 8px; }
  .daily-heading > span { color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; white-space: nowrap; }
  .daily-task { display: grid; grid-template-columns: 1fr auto; gap: 9px; align-items: center; padding: 9px 0 0; }
  .daily-task-copy b, .daily-task-copy small { display: block; font-family: 'Microsoft YaHei', sans-serif; }
  .daily-task-copy b { color: var(--ink); font-size: 9px; font-weight: 600; }
  .daily-task-copy small { margin-top: 2px; color: var(--muted); font-size: 8px; }
  .daily-task > span { color: var(--muted); font-family: Georgia, serif; font-size: 11px; }
  .daily-claim { width: 100%; margin-top: 12px; padding: 7px 8px; color: var(--accent); background: transparent; border: 1px solid rgba(163, 93, 68, .35); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; cursor: pointer; }
  .daily-claim:disabled { color: var(--muted); border-color: var(--line); cursor: not-allowed; opacity: .65; }
  .new-player-guide { margin: 14px 0 4px; padding: 13px 12px 12px; background: rgba(255, 252, 244, .66); border: 1px solid rgba(163, 93, 68, .22); }
  .guide-heading { display: flex; align-items: center; gap: 9px; padding-bottom: 10px; border-bottom: 1px solid var(--line); }
  .guide-heading > span { display: grid; place-items: center; width: 25px; height: 25px; color: var(--paper); background: var(--accent); font-size: 13px; }
  .guide-heading b, .guide-heading small { display: block; font-family: 'Microsoft YaHei', sans-serif; }
  .guide-heading b { font-size: 11px; }.guide-heading small { margin-top: 3px; color: var(--muted); font-size: 8px; }
  .new-player-guide ol { display: grid; gap: 7px; margin: 11px 0 9px; padding: 0 0 0 17px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; line-height: 1.45; }
  .new-player-guide li::marker { color: var(--accent); }.new-player-guide li b, .new-player-guide li span { display: block; }.new-player-guide li b { color: var(--ink); font-size: 10px; font-weight: 600; }.new-player-guide li span { margin-top: 1px; }
  .guide-goal { display: flex; align-items: baseline; gap: 7px; margin: 10px 0 8px; padding-top: 9px; border-top: 1px solid var(--line); font-family: 'Microsoft YaHei', sans-serif; }.guide-goal span { color: var(--muted); font-size: 8px; }.guide-goal b { color: var(--accent); font-size: 10px; }
  .guide-link { padding: 0; color: var(--accent); background: transparent; border: 0; font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; cursor: pointer; }
  .action-list { display: grid; gap: 6px; padding: 14px 0 20px; border-bottom: 1px solid var(--line); }.action-list button { display: grid; grid-template-columns: 28px 1fr auto; gap: 8px; align-items: center; padding: 9px 4px; color: var(--ink); background: transparent; border: 0; text-align: left; cursor: pointer; }.action-list button:hover:not(:disabled) { background: rgba(255, 252, 244, .58); }.action-list button:disabled { opacity: .35; cursor: not-allowed; }.action-mark { display: grid; place-items: center; width: 27px; height: 27px; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent); font-size: 13px; }.action-copy b, .action-copy small { display: block; }.action-copy b { font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; }.action-copy small { margin-top: 3px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }.action-list em { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 8px; font-style: normal; white-space: nowrap; }
  .relation-panel { padding-top: 17px; }.relation-heading { display: flex; justify-content: space-between; align-items: center; color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }.relation-heading button { color: var(--muted); background: transparent; border: 0; font-family: inherit; font-size: 9px; cursor: pointer; }.npc-row { display: grid; grid-template-columns: 29px 1fr auto; gap: 8px; align-items: center; padding: 12px 0 0; }.npc-avatar { position: relative; display: grid; place-items: center; width: 29px; height: 29px; overflow: hidden; color: var(--paper); background: #6d8276; font-size: 12px; }.npc-row:nth-child(3) .npc-avatar { background: #a36b53; }.npc-avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .2s ease; }.npc-avatar.loaded img { opacity: 1; }.npc-avatar b { position: relative; z-index: 1; font-weight: 400; }.npc-avatar.loaded b { opacity: 0; }.npc-row b, .npc-row small { display: block; }.npc-row b { font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }.npc-row small { margin-top: 2px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 8px; }.npc-row i { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; font-style: normal; }.npc-row i.warm { color: #a35d44; }.npc-row i.watch { color: #6a8585; }
  .world-bottom { display: grid; grid-template-columns: 1.2fr 1fr; gap: 21px; margin-top: 21px; }.resource-strip, .journal-strip { display: flex; align-items: center; gap: 20px; min-height: 63px; padding: 13px 20px; background: rgba(247, 243, 234, .53); border: 1px solid var(--line); }.resource-strip > div { display: flex; flex-wrap: wrap; gap: 15px; }.resource-strip i { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; font-style: normal; }.resource-strip b { margin-left: 4px; color: var(--ink); font-family: Georgia, serif; font-size: 16px; font-weight: 400; }.journal-strip { gap: 13px; }.journal-strip > span { flex: none; color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }.journal-strip p { overflow: hidden; flex: 1; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.journal-strip button { flex: none; color: var(--accent); background: transparent; border: 0; font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; cursor: pointer; }.world-notice { position: fixed; z-index: 8; right: 22px; bottom: 24px; padding: 13px 19px; color: var(--paper); background: var(--ink); box-shadow: 5px 5px 0 rgba(163, 93, 68, .45); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; }.notice-enter-active, .notice-leave-active { transition: opacity .25s, transform .25s; }.notice-enter-from, .notice-leave-to { opacity: 0; transform: translateY(9px); }
  .quest-strip { display: grid; grid-template-columns: minmax(230px, .72fr) minmax(0, 1.8fr); gap: 25px; align-items: stretch; margin-top: 21px; padding: 18px 20px; background: rgba(247, 243, 234, .7); border: 1px solid var(--line); }
  .quest-heading { display: grid; align-content: center; gap: 6px; padding-right: 22px; border-right: 1px solid var(--line); }
  .quest-heading p { color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; letter-spacing: .14em; }
  .quest-heading b { color: var(--ink); font-size: 17px; font-weight: 600; }
  .quest-heading small { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; line-height: 1.65; }
  .quest-steps { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
  .quest-step { position: relative; display: grid; grid-template-columns: 19px 1fr; gap: 7px; align-content: start; min-width: 0; padding: 3px 5px 4px; color: var(--muted); }
  .quest-step:not(:last-child)::after { content: ''; position: absolute; top: 12px; right: -6px; width: 12px; border-top: 1px dashed var(--line); }
  .quest-step > span { display: grid; place-items: center; width: 19px; height: 19px; color: var(--muted); border: 1px solid var(--line); border-radius: 50%; font-family: Georgia, serif; font-size: 11px; }
  .quest-step b, .quest-step small { display: block; font-family: 'Microsoft YaHei', sans-serif; }
  .quest-step b { overflow: hidden; color: var(--muted); font-size: 10px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .quest-step small { margin-top: 4px; color: rgba(124, 133, 123, .75); font-size: 8px; line-height: 1.45; }
  .quest-step.done { color: #6d8977; }
  .quest-step.done > span { color: #6d8977; border-color: rgba(109, 137, 119, .55); background: rgba(109, 137, 119, .1); }
  .quest-step.done b { color: #6d8977; }
  .quest-step.active { padding: 3px 8px 4px; background: rgba(163, 93, 68, .08); box-shadow: inset 2px 0 0 var(--accent); }
  .quest-step.active > span { color: var(--paper); border-color: var(--accent); background: var(--accent); }
  .quest-step.active b { color: var(--accent); }
  .quest-step.active small { color: var(--muted); }
  .world-notice { position: fixed; z-index: 8; right: 22px; bottom: 24px; padding: 13px 19px; color: var(--paper); background: var(--ink); box-shadow: 5px 5px 0 rgba(163, 93, 68, .45); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; }
  .notice-enter-active, .notice-leave-active { transition: opacity .25s, transform .25s; }.notice-enter-from, .notice-leave-to { opacity: 0; transform: translateY(9px); }
  @media (max-width: 1120px) { .world-layout { grid-template-columns: minmax(190px, .65fr) minmax(380px, 1.4fr); }.decision-column { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }.action-list { grid-template-columns: repeat(2, 1fr); border-bottom: 0; }.relation-panel { padding-top: 0; }.quest-strip { grid-template-columns: 1fr; gap: 15px; }.quest-heading { padding: 0 0 13px; border-right: 0; border-bottom: 1px solid var(--line); } }
  @media (max-width: 720px) { .world-page { padding: 26px 15px 28px; }.world-intro { margin-bottom: 23px; }.world-intro h1 { font-size: 25px; line-height: 1.35; }.world-lead { max-width: 230px; font-size: 10px; line-height: 1.7; }.day-marker { min-width: 69px; padding-left: 12px; }.day-marker b { font-size: 28px; }.world-layout { display: flex; flex-direction: column; gap: 13px; }.story-column, .decision-column { padding: 17px 15px; }.map-column { order: -1; }.map-heading { padding-bottom: 10px; }.map-heading h2 { font-size: 20px; }.map-canvas { height: 370px; }.map-region--village { left: 19%; top: 64%; }.map-region--sect { left: 49%; top: 37%; }.map-region--ferry { left: 73%; top: 72%; }.map-region--demon { left: 75%; top: 19%; }.decision-column { display: block; }.action-list { grid-template-columns: repeat(2, 1fr); gap: 3px; padding-bottom: 13px; }.action-list button { grid-template-columns: 25px 1fr; padding: 8px 2px; }.action-list em { display: none; }.relation-panel { padding-top: 14px; }.world-bottom { display: block; margin-top: 13px; }.resource-strip { display: block; padding: 12px 15px; }.resource-strip > div { margin-top: 10px; gap: 9px 14px; }.journal-strip { margin-top: 8px; padding: 12px 15px; }.journal-strip p { font-size: 9px; }.journal-strip button { display: none; }.quest-strip { display: block; margin-top: 13px; padding: 15px; }.quest-heading { padding-bottom: 12px; }.quest-heading b { font-size: 15px; }.quest-steps { grid-template-columns: 1fr; gap: 5px; padding-top: 12px; }.quest-step { grid-template-columns: 22px 1fr; padding: 6px 5px; }.quest-step:not(:last-child)::after { top: auto; right: auto; bottom: -7px; left: 14px; width: 1px; height: 9px; border-top: 0; border-left: 1px dashed var(--line); }.quest-step.active { padding: 6px 8px; }.quest-step > span { width: 20px; height: 20px; }.quest-step b { white-space: normal; }.world-notice { right: 15px; bottom: 75px; left: 15px; text-align: center; } }
</style>
