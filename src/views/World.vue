<template>
  <main class="world-page">
    <section class="world-intro">
      <div>
        <p class="world-kicker">第一章 · 山河初醒</p>
        <h1>{{ worldTitle }}</h1>
        <p class="world-lead">{{ worldLead }}</p>
      </div>
      <div class="day-marker"><span>行旅日</span><b>{{ worldState.day }}</b><small>{{ worldState.season }}</small></div>
    </section>

    <section class="world-layout">
      <article class="story-column">
        <div class="story-heading"><span class="story-seal">叙</span><div><p>当前章节</p><h2>雨夜问心</h2></div></div>
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
          <button v-for="region in regions" :key="region.id" type="button" class="map-region" :class="[{ active: currentRegion.id === region.id, visited: isVisited(region.id), locked: region.locked }, `map-region--${region.id}`]" :disabled="region.locked" @click="selectRegion(region)">
            <span class="region-dot"><i></i></span><b>{{ region.name }}</b><small>{{ region.subtitle }}</small>
          </button>
          <div class="map-compass"><span>北</span><i></i><b>山河图</b></div>
          <div class="map-scale">一寸山河 · 约三日行</div>
        </div>
        <div class="map-caption"><span>所在</span><b>{{ currentRegion.name }}</b><i></i><span>{{ currentRegion.description }}</span></div>
      </article>

      <aside class="decision-column">
        <div class="decision-heading"><p>今日行程</p><span>可暂停</span></div>
        <div class="action-list">
          <button v-for="action in actions" :key="action.id" type="button" :disabled="action.disabled" @click="performAction(action)">
            <span class="action-mark">{{ action.mark }}</span><span class="action-copy"><b>{{ action.name }}</b><small>{{ action.description }}</small></span><em>{{ action.cost ? `耗 ${action.cost} 灵力` : '不耗灵力' }}</em>
          </button>
        </div>
        <div class="relation-panel"><div class="relation-heading"><span>附近的人</span><button type="button" @click="showAllRelations = !showAllRelations">{{ showAllRelations ? '收起' : '展开' }}</button></div><div v-for="npc in visibleNpcs" :key="npc.id" class="npc-row"><span class="npc-avatar">{{ npc.name.slice(0, 1) }}</span><div><b>{{ npc.name }}</b><small>{{ npc.role }}</small></div><i :class="npc.mood">{{ npc.attitude }}</i></div></div>
      </aside>
    </section>

    <section class="world-bottom">
      <div class="resource-strip"><span class="resource-title">行囊</span><div><i>灵石 <b>{{ playerStore.spiritStones }}</b></i><i>灵力 <b>{{ Math.floor(playerStore.spirit) }}</b></i><i>食物 <b>{{ foodCount }}</b></i><i>药材 <b>{{ playerStore.herbs?.length || 0 }}</b></i></div></div>
      <div class="journal-strip"><span>最近一笔</span><p>{{ latestJournal }}</p><button type="button" @click="router.push('/inventory')">查看行囊 →</button></div>
    </section>
    <transition name="notice"><p v-if="notice" class="world-notice">{{ notice }}</p></transition>
  </main>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePlayerStore } from '../stores/player'

  const router = useRouter()
  const playerStore = usePlayerStore()
  const selectedChoice = ref(playerStore.worldState?.storyFlags?.includes('choice-listen') ? 'listen' : null)
  const mapImageReady = ref(false)
  const mapAssetUrl = './assets/characters/map-cloud-ridge.png'
  const showAllRelations = ref(false)
  const notice = ref('')
  let noticeTimer
  const regions = [
    { id: 'village', name: '青石村', subtitle: '雨中灯火', description: '旧屋、石桥与一条通往山外的路', x: 0 },
    { id: 'sect', name: '云岑宗', subtitle: '晨钟未歇', description: '外门试剑台与藏经楼', x: 0 },
    { id: 'ferry', name: '听潮渡', subtitle: '潮声入梦', description: '商旅、散修与不问来处的旧渡', x: 0 },
    { id: 'demon', name: '万妖岭', subtitle: '月照深林', description: '妖族故土，暂以墨印标记', locked: true, x: 0 }
  ]
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
  const storyText = computed(() => {
    const selected = storyChoices.find(choice => choice.id === selectedChoice.value)
    if (selected) return `你选择${selected.title}。${selected.description}。雨声没有停，山中的那点光却离你更近了。`
    return playerStore.birthStory || '雨声打在瓦上，像有人在很远的地方叩门。你握住那枚旧玉时，村外的山忽然亮了一瞬。'
  })
  const worldState = computed(() => playerStore.worldState || { day: 1, season: '初春', currentRegion: playerStore.origin || 'village', visitedRegions: [] })
  const currentRegion = computed(() => regions.find(region => region.id === worldState.value.currentRegion) || regions[0])
  const worldTitle = computed(() => currentRegion.value.name === '青石村' ? '雨停之前，先找到自己的路' : `从${currentRegion.value.name}望出去`)
  const worldLead = computed(() => currentRegion.value.description)
  const visibleNpcs = computed(() => (showAllRelations.value ? npcData : npcData.slice(0, 2)).map(npc => ({ ...npc, attitude: playerStore.worldState?.relationshipLedger?.[npc.id] > 0 ? '渐亲' : npc.attitude })))
  const foodCount = computed(() => (playerStore.items || []).filter(item => item.type === 'food').length + 3)
  const latestJournal = computed(() => {
    const journal = playerStore.worldState?.journal || []
    return journal.length ? journal[journal.length - 1].text : '你刚刚翻开命书，第一道风从门前经过。'
  })
  const actions = computed(() => [
    { id: 'cultivate', mark: '静', name: '静修一刻', description: '让灵炁沿着新生经脉走一周天', cost: 10, disabled: playerStore.spirit < 10 },
    { id: 'gather', mark: '采', name: '寻一味药材', description: '在当前区域寻找可入丹炉的草木', cost: 5, disabled: playerStore.spirit < 5 },
    { id: 'meet', mark: '访', name: '拜访附近的人', description: '把一段关系写进今日的因果', cost: 0, disabled: false },
    { id: 'rest', mark: '息', name: '整理行囊', description: '检查食物、药材与法器耗损', cost: 0, disabled: false }
  ])

  const flash = message => {
    notice.value = message
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => (notice.value = ''), 2600)
  }
  const isVisited = id => worldState.value.visitedRegions?.includes(id)
  const persist = () => playerStore.saveData()
  const appendJournal = (text, title = '行旅札记') => {
    if (!playerStore.worldState) playerStore.worldState = { day: 1, season: '初春', currentRegion: 'village', visitedRegions: [], discoveredClues: [], relationshipLedger: {}, storyFlags: [], journal: [] }
    if (!playerStore.worldState.discoveredClues) playerStore.worldState.discoveredClues = []
    if (!playerStore.worldState.visitedRegions) playerStore.worldState.visitedRegions = []
    if (!playerStore.worldState.relationshipLedger) playerStore.worldState.relationshipLedger = {}
    if (!playerStore.worldState.storyFlags) playerStore.worldState.storyFlags = []
    if (!playerStore.worldState.journal) playerStore.worldState.journal = []
    playerStore.worldState.journal = [...(playerStore.worldState.journal || []), { id: `${Date.now()}-${Math.random()}`, title, text, day: playerStore.worldState.day }].slice(-12)
  }
  const selectRegion = region => {
    if (region.locked) return
    if (region.id === currentRegion.value.id) {
      flash(`你正在${region.name}，风从这里起。`)
      return
    }
    const cost = 8
    if (playerStore.spirit < cost) {
      flash('灵力不够，先在原地调息片刻。')
      return
    }
    playerStore.spirit -= cost
    playerStore.explorationCount += 1
    playerStore.worldState.currentRegion = region.id
    playerStore.worldState.day += 1
    if (!playerStore.worldState.visitedRegions.includes(region.id)) playerStore.worldState.visitedRegions.push(region.id)
    if (!playerStore.unlockedLocations.includes(region.name)) playerStore.unlockedLocations.push(region.name)
    appendJournal(`你沿着旧路走到${region.name}。${region.description}。`, '换一处山河')
    persist()
    flash(`已抵达${region.name}，耗用 ${cost} 灵力。`)
  }
  const chooseStory = choice => {
    selectedChoice.value = choice.id
    if (!playerStore.worldState) playerStore.worldState = { day: 1, season: '初春', currentRegion: 'village', visitedRegions: [], discoveredClues: [], relationshipLedger: {}, storyFlags: [], journal: [] }
    if (!playerStore.worldState.storyFlags) playerStore.worldState.storyFlags = []
    if (!playerStore.worldState.discoveredClues) playerStore.worldState.discoveredClues = []
    if (!playerStore.worldState.storyFlags.includes(`choice-${choice.id}`)) playerStore.worldState.storyFlags.push(`choice-${choice.id}`)
    if (choice.id === 'listen' && !playerStore.worldState.discoveredClues.includes('old-jade')) playerStore.worldState.discoveredClues.push('old-jade')
    appendJournal(`你决定${choice.title}。${choice.description}。`, '第一道选择')
    persist()
  }
  const performAction = action => {
    if (action.id === 'cultivate') {
      playerStore.spirit -= action.cost
      playerStore.cultivate(4)
      appendJournal('你在屋檐下静坐，第一次感到灵炁不再只是传说。', '静修')
      flash('修为 +4，灵力 -10')
    }
    if (action.id === 'gather') {
      playerStore.spirit -= action.cost
      playerStore.herbs.push({ id: `herb-${Date.now()}`, name: '青露草', description: '带着雨意的基础灵草' })
      appendJournal('你在潮湿石缝里找到一株青露草，根须还带着微光。', '采药')
      flash('获得青露草，灵力 -5')
    }
    if (action.id === 'meet') {
      const id = currentRegion.value.id === 'ferry' ? 'oldman' : 'qingluo'
      playerStore.worldState.relationshipLedger[id] = (playerStore.worldState.relationshipLedger[id] || 0) + 1
      appendJournal(`你与${npcData.find(npc => npc.id === id).name}交谈片刻，关系向前走了一小步。`, '人间相逢')
      flash('关系发生了微小变化')
    }
    if (action.id === 'rest') {
      appendJournal('你打开行囊，重新确认食物、药材与法器都还在。', '行囊')
      flash('行囊已整理，世界静止于此刻')
    }
    persist()
  }
</script>

<style scoped>
  .world-page { --ink: #27322e; --muted: #7c857b; --paper: #f4efe4; --line: rgba(39, 50, 46, .15); --accent: #a35d44; position: relative; min-height: 100%; padding: 42px clamp(18px, 4vw, 64px) 48px; color: var(--ink); background: #e9e4d9; font-family: 'Noto Serif SC', 'Songti SC', Georgia, serif; }
  .world-page::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .27; background-image: radial-gradient(rgba(39, 50, 46, .12) .6px, transparent .7px); background-size: 5px 5px; mix-blend-mode: multiply; }
  .world-intro, .world-layout, .world-bottom { position: relative; z-index: 1; max-width: 1440px; margin: 0 auto; }
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
  .action-list { display: grid; gap: 6px; padding: 14px 0 20px; border-bottom: 1px solid var(--line); }.action-list button { display: grid; grid-template-columns: 28px 1fr auto; gap: 8px; align-items: center; padding: 9px 4px; color: var(--ink); background: transparent; border: 0; text-align: left; cursor: pointer; }.action-list button:hover:not(:disabled) { background: rgba(255, 252, 244, .58); }.action-list button:disabled { opacity: .35; cursor: not-allowed; }.action-mark { display: grid; place-items: center; width: 27px; height: 27px; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent); font-size: 13px; }.action-copy b, .action-copy small { display: block; }.action-copy b { font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; }.action-copy small { margin-top: 3px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }.action-list em { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 8px; font-style: normal; white-space: nowrap; }
  .relation-panel { padding-top: 17px; }.relation-heading { display: flex; justify-content: space-between; align-items: center; color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }.relation-heading button { color: var(--muted); background: transparent; border: 0; font-family: inherit; font-size: 9px; cursor: pointer; }.npc-row { display: grid; grid-template-columns: 29px 1fr auto; gap: 8px; align-items: center; padding: 12px 0 0; }.npc-avatar { display: grid; place-items: center; width: 29px; height: 29px; color: var(--paper); background: #6d8276; font-size: 12px; }.npc-row:nth-child(3) .npc-avatar { background: #a36b53; }.npc-row b, .npc-row small { display: block; }.npc-row b { font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }.npc-row small { margin-top: 2px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 8px; }.npc-row i { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; font-style: normal; }.npc-row i.warm { color: #a35d44; }.npc-row i.watch { color: #6a8585; }
  .world-bottom { display: grid; grid-template-columns: 1.2fr 1fr; gap: 21px; margin-top: 21px; }.resource-strip, .journal-strip { display: flex; align-items: center; gap: 20px; min-height: 63px; padding: 13px 20px; background: rgba(247, 243, 234, .53); border: 1px solid var(--line); }.resource-strip > div { display: flex; flex-wrap: wrap; gap: 15px; }.resource-strip i { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; font-style: normal; }.resource-strip b { margin-left: 4px; color: var(--ink); font-family: Georgia, serif; font-size: 16px; font-weight: 400; }.journal-strip { gap: 13px; }.journal-strip > span { flex: none; color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }.journal-strip p { overflow: hidden; flex: 1; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.journal-strip button { flex: none; color: var(--accent); background: transparent; border: 0; font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; cursor: pointer; }.world-notice { position: fixed; z-index: 8; right: 22px; bottom: 24px; padding: 13px 19px; color: var(--paper); background: var(--ink); box-shadow: 5px 5px 0 rgba(163, 93, 68, .45); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; }.notice-enter-active, .notice-leave-active { transition: opacity .25s, transform .25s; }.notice-enter-from, .notice-leave-to { opacity: 0; transform: translateY(9px); }
  @media (max-width: 1120px) { .world-layout { grid-template-columns: minmax(190px, .65fr) minmax(380px, 1.4fr); }.decision-column { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }.action-list { grid-template-columns: repeat(2, 1fr); border-bottom: 0; }.relation-panel { padding-top: 0; } }
  @media (max-width: 720px) { .world-page { padding: 26px 15px 28px; }.world-intro { margin-bottom: 23px; }.world-intro h1 { font-size: 25px; line-height: 1.35; }.world-lead { max-width: 230px; font-size: 10px; line-height: 1.7; }.day-marker { min-width: 69px; padding-left: 12px; }.day-marker b { font-size: 28px; }.world-layout { display: flex; flex-direction: column; gap: 13px; }.story-column, .decision-column { padding: 17px 15px; }.map-column { order: -1; }.map-heading { padding-bottom: 10px; }.map-heading h2 { font-size: 20px; }.map-canvas { height: 370px; }.map-region--village { left: 19%; top: 64%; }.map-region--sect { left: 49%; top: 37%; }.map-region--ferry { left: 73%; top: 72%; }.map-region--demon { left: 75%; top: 19%; }.decision-column { display: block; }.action-list { grid-template-columns: repeat(2, 1fr); gap: 3px; padding-bottom: 13px; }.action-list button { grid-template-columns: 25px 1fr; padding: 8px 2px; }.action-list em { display: none; }.relation-panel { padding-top: 14px; }.world-bottom { display: block; margin-top: 13px; }.resource-strip { display: block; padding: 12px 15px; }.resource-strip > div { margin-top: 10px; gap: 9px 14px; }.journal-strip { margin-top: 8px; padding: 12px 15px; }.journal-strip p { font-size: 9px; }.journal-strip button { display: none; }.world-notice { right: 15px; bottom: 75px; left: 15px; text-align: center; } }
</style>
