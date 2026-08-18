<template>
  <main class="creation" :class="`creation--${selectedRace.tone}`">
    <div class="ink-wash ink-wash--one"></div>
    <div class="ink-wash ink-wash--two"></div>
    <header class="creation-header">
      <div class="brand-lockup">
        <span class="brand-seal">问</span>
        <div>
          <p class="brand-title">问道修行录</p>
          <p class="brand-subtitle">一卷命书 · 一场自选的长生</p>
        </div>
      </div>
      <div class="save-note"><span class="save-dot"></span>游历将自动保存</div>
    </header>

    <div class="creation-layout">
      <aside class="ritual-rail" aria-label="创建进度">
        <p class="rail-kicker">命书初开</p>
        <div class="rail-line"></div>
        <button
          v-for="(item, index) in steps"
          :key="item.id"
          class="rail-step"
          :class="{ active: stepIndex === index, passed: stepIndex > index }"
          type="button"
          :disabled="index > stepIndex"
          @click="jumpTo(index)"
        >
          <span class="rail-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="rail-name">{{ item.name }}</span>
          <span class="rail-mark">{{ stepIndex > index ? '已定' : item.mark }}</span>
        </button>
        <div class="rail-caption">写下你的名字<br />剩下的交给山河</div>
      </aside>

      <section class="creation-stage">
        <div class="stage-heading">
          <div>
            <p class="stage-eyebrow">第 {{ String(Math.min(stepIndex + 1, 8)).padStart(2, '0') }} / 08 卷</p>
            <h1>{{ currentStep.title }}</h1>
            <p class="stage-description">{{ currentStep.description }}</p>
          </div>
          <div class="stage-progress" aria-label="创建进度">
            <span v-for="(_, index) in steps" :key="index" :class="{ filled: index <= stepIndex }"></span>
          </div>
        </div>

        <section v-if="stepIndex === 0" class="welcome-panel">
          <div class="welcome-art" aria-hidden="true">
            <img class="hero-asset" :class="{ visible: heroImageReady }" :src="heroAssetUrl" alt="" @load="heroImageReady = true" @error="heroImageReady = false" />
            <div class="welcome-moon"></div>
            <div class="mountain mountain--back"></div>
            <div class="mountain mountain--front"></div>
            <div class="welcome-figure"><i></i><b></b><em></em></div>
            <div class="welcome-branch"><span></span><span></span><span></span></div>
          </div>
          <div class="welcome-copy">
            <p class="seal-line">天地有缺 · 人心自渡</p>
            <h2>先写下一个<br /><strong>属于你的名字</strong></h2>
            <p>你会从一处出生地醒来，携带固定的命格、资源与开场因果。没有唯一的正道，只有你愿意承担的下一步。</p>
            <div class="welcome-facts">
              <span><b>05</b> 种出生</span>
              <span><b>27</b> 张命相</span>
              <span><b>∞</b> 种结局</span>
            </div>
            <button class="ink-button ink-button--large" type="button" @click="nextStep">
              <span>翻开命书</span><i>→</i>
            </button>
          </div>
        </section>

        <section v-else-if="stepIndex === 1" class="choice-panel choice-panel--race">
          <button
            v-for="race in races"
            :key="race.id"
            type="button"
            class="choice-tile race-tile"
            :class="{ selected: selectedRace.id === race.id, [`race-tile--${race.tone}`]: true }"
            @click="selectRace(race)"
          >
            <span class="tile-number">{{ race.id === 'human' ? '壹' : race.id === 'immortal' ? '贰' : '叁' }}</span>
            <span class="race-glyph">{{ race.mark }}</span>
            <span class="tile-title">{{ race.name }}</span>
            <span class="tile-subtitle">{{ race.short }}</span>
            <span class="tile-copy">{{ race.description }}</span>
            <span class="tile-arrow">进入此脉 <b>↗</b></span>
          </button>
        </section>

        <section v-else-if="stepIndex === 2" class="choice-panel choice-panel--gender">
          <div class="selection-intro">
            <span class="intro-seal">{{ selectedRace.mark }}</span>
            <p>你选择了 <b>{{ selectedRace.name }}</b>。性别只决定命相的表达，不会限制你与任何人的关系。</p>
          </div>
          <div class="gender-row">
            <button
              v-for="gender in genders"
              :key="gender.id"
              type="button"
              class="gender-tile"
              :class="{ selected: selectedGender.id === gender.id }"
              @click="selectedGender = gender"
            >
              <span class="gender-mark">{{ gender.id === 'male' ? '乾' : gender.id === 'female' ? '坤' : '合' }}</span>
              <span class="tile-title">{{ gender.name }}</span>
              <span class="tile-subtitle">{{ gender.description }}</span>
              <span class="check-mark">✓</span>
            </button>
          </div>
          <div class="ink-quote">“形由心生，命由己定。”</div>
        </section>

        <section v-else-if="stepIndex === 3" class="name-panel">
          <div class="name-surface">
            <span class="paper-stamp">名</span>
            <p class="name-label">道号 / 本名</p>
            <input v-model="playerName" maxlength="12" autofocus placeholder="写下你想被山河记住的名字" @keyup.enter="nextStep" />
            <div class="name-underline"><span :style="{ width: `${Math.min(playerName.length / 12, 1) * 100}%` }"></span></div>
            <p class="name-hint">最多十二字。你可以先以游客身份游历，日后再绑定手机号。</p>
          </div>
          <div class="name-preview">
            <p>命书将这样称呼你</p>
            <h2>{{ playerName || '无名修士' }}</h2>
            <span>{{ selectedRace.name }} · {{ selectedGender.name }}</span>
          </div>
        </section>

        <section v-else-if="stepIndex === 4" class="origin-panel">
          <div class="origin-list">
            <button
              v-for="origin in allowedOrigins"
              :key="origin.id"
              type="button"
              class="origin-row"
              :class="{ selected: selectedOrigin.id === origin.id }"
              @click="selectedOrigin = origin"
            >
              <span class="origin-mark">{{ origin.id === 'village' ? '村' : origin.id === 'sect' ? '宗' : origin.id === 'family' ? '世' : origin.id === 'rogue' ? '散' : '化' }}</span>
              <span class="origin-main"><b>{{ origin.name }}</b><small>{{ origin.place }}</small></span>
              <span class="origin-copy">{{ origin.eyebrow }}</span>
              <span class="origin-realm">{{ origin.realm }}</span>
              <span class="check-mark">✓</span>
            </button>
          </div>
          <div class="origin-detail">
            <p class="detail-kicker">命格注</p>
            <h2>{{ selectedOrigin.name }}</h2>
            <p>{{ selectedOrigin.description }}</p>
            <div class="keyword-list"><span v-for="word in selectedOrigin.keywords" :key="word">{{ word }}</span></div>
            <div class="origin-footnote"><span>出生地</span><b>{{ selectedOrigin.place }}</b><i></i><span>起始境界</span><b>{{ selectedOrigin.realm }}</b></div>
          </div>
        </section>

        <section v-else-if="stepIndex === 5" class="appearance-panel">
          <div class="appearance-head">
            <div>
              <p class="detail-kicker">命相择一</p>
              <h2>{{ selectedCard ? selectedCard.id : '自绘命相' }}</h2>
              <p>{{ selectedCard ? selectedCard.shortDescription : '把你想成为的样子写进命书，作为此世第一笔。' }}</p>
            </div>
            <button v-if="selectedCard" class="text-button" type="button" @click="clearCard">改为自由描写</button>
          </div>
          <div class="card-carousel" role="listbox" aria-label="角色卡选择">
            <button
              v-for="card in visibleCards"
              :key="card.id"
              type="button"
              class="character-card"
              :class="{ selected: selectedCard?.id === card.id }"
              @click="selectCard(card)"
            >
              <span class="mini-art" :class="`mini-art--${card.accent}`"><img class="card-asset" :class="{ visible: cardImageReady[card.id] }" :src="cardAsset(card.id)" alt="" @load="cardImageReady[card.id] = true" @error="cardImageReady[card.id] = false" /><i></i><b></b><em></em></span>
              <span class="card-id">{{ card.id }}</span>
              <span class="card-name">{{ card.displayName }}</span>
              <span class="card-rarity">{{ card.shortDescription }}</span>
              <span class="check-mark">✓</span>
            </button>
          </div>
          <div class="carousel-control">
            <button type="button" class="round-button" :disabled="cardIndex === 0" aria-label="上一组角色卡" @click="cardIndex--">←</button>
            <span>{{ cardIndex + 1 }} / {{ cardPages.length }}</span>
            <button type="button" class="round-button" :disabled="cardIndex === cardPages.length - 1" aria-label="下一组角色卡" @click="cardIndex++">→</button>
          </div>
          <textarea v-if="!selectedCard" v-model="appearanceText" maxlength="160" placeholder="自由描写外貌、服饰、气质或身体构造……"></textarea>
          <p class="field-count" v-if="!selectedCard">{{ appearanceText.length }} / 160</p>
        </section>

        <section v-else-if="stepIndex === 6" class="body-panel">
          <div class="body-group">
            <p class="detail-kicker">身体构造</p>
            <div class="body-options">
              <button v-for="option in bodyOptions" :key="option.id" type="button" class="body-option" :class="{ selected: bodyProfile.physique === option.id }" @click="bodyProfile.physique = option.id">
                <span>{{ option.mark }}</span><b>{{ option.name }}</b><small>{{ option.description }}</small>
              </button>
            </div>
          </div>
          <div class="body-group">
            <p class="detail-kicker">气色与发式</p>
            <div class="compact-options">
              <button v-for="option in appearanceOptions" :key="option.id" type="button" :class="{ selected: bodyProfile.complexion === option.id }" @click="bodyProfile.complexion = option.id">{{ option.name }}</button>
              <button v-for="option in hairOptions" :key="option.id" type="button" :class="{ selected: bodyProfile.hair === option.id }" @click="bodyProfile.hair = option.id">{{ option.name }}</button>
            </div>
          </div>
          <div class="body-note"><span class="note-symbol">坎</span><p>外貌与身体构造会进入你的命书与叙事，但不会改写固定的境界、灵根品质与死亡规则。</p></div>
        </section>

        <section v-else-if="stepIndex === 7" class="fate-panel">
          <div class="fate-hero">
            <span class="fate-seal">命</span>
            <div><p class="detail-kicker">此世命书</p><h2>{{ playerName || '无名修士' }}</h2><p>{{ selectedRace.name }} · {{ selectedGender.name }} · {{ selectedOrigin.name }}</p></div>
          </div>
          <div class="fate-grid">
            <div class="fate-stat"><span>起始境界</span><b>{{ selectedOrigin.realm }}</b><small>{{ selectedOrigin.place }}</small></div>
            <div class="fate-stat"><span>灵根</span><b>{{ spiritRoot }}</b><small>固定命格</small></div>
            <div class="fate-stat"><span>功法品质</span><b>{{ techniqueQuality }}</b><small>{{ startingTechnique }}</small></div>
            <div class="fate-stat"><span>死亡规则</span><b>真实生死</b><small>一念皆有代价</small></div>
          </div>
          <div class="fate-resources"><span>初始行囊</span><b>{{ selectedOrigin.resourceText }}</b><div><i>灵石 {{ selectedOrigin.spiritStones }}</i><i>灵力 {{ selectedOrigin.spirit }}</i><i>体魄 {{ selectedOrigin.stats.health }}</i></div></div>
          <div class="fate-reading"><span>开篇</span><p>{{ selectedOrigin.opening }}</p></div>
          <button class="ink-button ink-button--wide" type="button" @click="nextStep"><span>确认命书，听雨入世</span><i>→</i></button>
        </section>

        <section v-else class="opening-panel">
          <div class="opening-ink"><div class="ink-ring"></div><span>{{ selectedOrigin.name.slice(0, 1) }}</span></div>
          <p class="detail-kicker">第一章 · {{ selectedOrigin.name }}</p>
          <h2>{{ playerName || '无名修士' }}，山河已记名</h2>
          <p class="opening-lead">{{ selectedOrigin.opening }}</p>
          <div class="opening-lines"><p v-for="line in openingLines" :key="line">{{ line }}</p></div>
          <button class="ink-button ink-button--large" type="button" :disabled="isEnteringWorld" @click="enterWorld"><span>{{ isEnteringWorld ? '正在写入命书' : '推门，走进第一张地图' }}</span><i>{{ isEnteringWorld ? '…' : '→' }}</i></button>
        </section>

        <footer v-if="stepIndex > 0 && stepIndex < 8" class="creation-footer">
          <button class="back-button" type="button" @click="previousStep">← <span>回看上一页</span></button>
          <span class="footer-hint">{{ footerHint }}</span>
          <button class="ink-button" type="button" :disabled="!canContinue" @click="nextStep"><span>{{ stepIndex === 7 ? '确认命书' : '继续' }}</span><i>→</i></button>
        </footer>
      </section>

      <aside class="fate-slip" aria-label="命书预览">
        <div class="slip-top"><span>命书预览</span><span>NO. {{ String(stepIndex + 1).padStart(2, '0') }}</span></div>
        <div class="slip-seal">{{ selectedRace.mark }}</div>
        <div class="slip-name">{{ playerName || '未命名' }}</div>
        <div class="slip-line"></div>
        <dl>
          <div><dt>种族</dt><dd>{{ selectedRace.name }}</dd></div>
          <div><dt>性别</dt><dd>{{ selectedGender.name }}</dd></div>
          <div><dt>出生</dt><dd>{{ selectedOrigin.name }}</dd></div>
          <div><dt>灵根</dt><dd>{{ spiritRoot }}</dd></div>
        </dl>
        <div class="slip-bottom"><span>固定规则</span><p>境界 · 灵根 · 功法 · 生死 · 资源</p></div>
      </aside>
    </div>
  </main>
</template>

<script setup>
  import { computed, reactive, ref, watch } from 'vue'
  import { useMessage } from 'naive-ui'
  import { useRouter } from 'vue-router'
  import { usePlayerStore } from '../stores/player'
  import {
    APPEARANCE_OPTIONS,
    BODY_OPTIONS,
    CHARACTER_CARDS,
    GENDERS,
    HAIR_OPTIONS,
    ORIGINS,
    RACES,
    findOrigin
  } from '../data/characterData'

  const router = useRouter()
  const playerStore = usePlayerStore()
  const message = useMessage()
  const steps = [
    { id: 'race', name: '种族', title: '你从哪一脉醒来？', description: '三种血脉，三种看山河的方式。', mark: '择脉' },
    { id: 'gender', name: '性别', title: '形由心生', description: '命相并非枷锁，只是你此刻的回声。', mark: '定形' },
    { id: 'name', name: '姓名', title: '留一个名字在世间', description: '道号可以后来再改，第一声呼唤由你写下。', mark: '落笔' },
    { id: 'origin', name: '出生', title: '你的故事，从哪里开始？', description: '出生地决定你会先看见什么，也决定谁愿意先相信你。', mark: '寻根' },
    { id: 'appearance', name: '命相', title: '让山河记住你的样子', description: '选择一张原创命相，或亲自写下外貌。', mark: '照影' },
    { id: 'body', name: '构造', title: '确认这副身体', description: '身体构造影响叙事语气，不改写世界的固定规则。', mark: '塑身' },
    { id: 'fate', name: '命书', title: '把初始命格读完', description: '所有固定规则会在此落印，之后便由你做决定。', mark: '读命' },
    { id: 'opening', name: '开篇', title: '雨落之前，先听见自己的心', description: '开场剧情会随你的出生地改变。', mark: '入世' }
  ]
  const stepIndex = ref(0)
  const races = RACES
  const genders = GENDERS
  const bodyOptions = BODY_OPTIONS
  const appearanceOptions = APPEARANCE_OPTIONS
  const hairOptions = HAIR_OPTIONS
  const playerName = ref('')
  const appearanceText = ref('')
  const selectedRace = ref(races[0])
  const selectedGender = ref(genders[1])
  const selectedOrigin = ref(findOrigin('village'))
  const selectedCard = ref(null)
  const cardIndex = ref(0)
  const bodyProfile = ref({ physique: 'clear-bone', complexion: 'pale-ink', hair: 'half-tied', bearing: 'quiet' })
  const heroAssetUrl = './assets/characters/character-hero-placeholder.png'
  const heroImageReady = ref(false)
  const cardImageReady = reactive({})

  const isEnteringWorld = ref(false)
  const currentStep = computed(() => steps[Math.min(stepIndex.value, steps.length - 1)])
  const allowedOrigins = computed(() => ORIGINS.filter(origin => selectedRace.value.origins.includes(origin.id)))
  const cardPool = computed(() => CHARACTER_CARDS.filter(card => card.raceId === selectedRace.value.id && card.genderId === selectedGender.value.id))
  const cardPages = computed(() => {
    const pages = []
    for (let index = 0; index < cardPool.value.length; index += 3) pages.push(cardPool.value.slice(index, index + 3))
    return pages.length ? pages : [[]]
  })
  const visibleCards = computed(() => cardPages.value[cardIndex.value] || [])
  const spiritRoot = computed(() => {
    if (selectedRace.value.id === 'immortal') return '天青灵根'
    if (selectedRace.value.id === 'demon') return '赤脉妖根'
    if (selectedOrigin.value.id === 'family') return '双生灵根'
    if (selectedOrigin.value.id === 'sect') return '木火灵根'
    return '未觉醒'
  })
  const startingTechnique = computed(() => {
    const names = { village: '未入门', sect: '云岑引气诀', family: '沈氏归元法', rogue: '听潮吐纳术', demon: '月蚀炼形篇' }
    return names[selectedOrigin.value.id] || '未入门'
  })
  const techniqueQuality = computed(() => (selectedOrigin.value.id === 'family' || selectedRace.value.id === 'immortal' ? '上品' : selectedOrigin.value.id === 'village' ? '未定' : '中品'))
  const openingLines = computed(() => [
    '你还不知道这枚印记意味着什么。',
    `${selectedOrigin.value.place}的风从门缝里进来，带着陌生的草木香。`,
    '前方有路，身后也有未说完的话。'
  ])
  const footerHint = computed(() => {
    if (stepIndex.value === 2) return '道号会显示在世界页与战斗记录中'
    if (stepIndex.value === 3) return '出生地会决定初始境界与开场剧情'
    if (stepIndex.value === 4) return selectedCard.value ? '已选定原创命相' : '请选择命相卡，或留下自由描写'
    return '所有选择都会写入你的命书'
  })
  const canContinue = computed(() => {
    if (stepIndex.value === 2) return playerName.value.trim().length > 0
    if (stepIndex.value === 3) return Boolean(selectedOrigin.value)
    if (stepIndex.value === 4) return Boolean(selectedCard.value || appearanceText.value.trim())
    return true
  })

  watch(selectedRace, race => {
    if (!race.origins.includes(selectedOrigin.value.id)) selectedOrigin.value = findOrigin(race.origins[0])
    selectedCard.value = null
    cardIndex.value = 0
  })
  watch(selectedGender, () => {
    selectedCard.value = null
    cardIndex.value = 0
  })

  const selectRace = race => {
    selectedRace.value = race
  }
  const selectCard = card => {
    selectedCard.value = card
    appearanceText.value = ''
  }
  const clearCard = () => {
    selectedCard.value = null
  }
  const cardAsset = cardId => {
    const assetId = cardId === 'I-M-03' ? 'I-M-01' : cardId
    return `./assets/characters/character-card-${assetId}.png`
  }
  const nextStep = () => {
    if (!canContinue.value) return
    if (stepIndex.value === steps.length - 1) {
      enterWorld()
      return
    }
    if (stepIndex.value < steps.length - 1) stepIndex.value += 1
  }
  const previousStep = () => {
    if (stepIndex.value > 0) stepIndex.value -= 1
  }
  const jumpTo = index => {
    if (index <= stepIndex.value) stepIndex.value = index
  }
  const enterWorld = async () => {
    if (isEnteringWorld.value) return
    isEnteringWorld.value = true
    try {
      await playerStore.beginJourney({
        name: playerName.value.trim() || '无名修士',
        race: selectedRace.value.id,
        gender: selectedGender.value.id,
        origin: selectedOrigin.value.id,
        originData: selectedOrigin.value,
        appearanceId: selectedCard.value?.id || 'custom',
        appearancePrompt: selectedCard.value?.prompt || appearanceText.value.trim(),
        bodyProfile: bodyProfile.value,
        spiritRoot: spiritRoot.value,
        startingTechnique: startingTechnique.value,
        birthStory: selectedOrigin.value.opening
      })
      await router.replace('/world')
    } catch (error) {
      console.error('进入世界失败:', error)
      message.error(`写入命书失败，请重试或先导出备份${error?.message ? `：${error.message}` : ''}`)
    } finally {
      isEnteringWorld.value = false
    }
  }
</script>

<style scoped>
  .creation {
    --paper: #f3eee4;
    --paper-deep: #e8dfd0;
    --ink: #28302d;
    --muted: #7b8178;
    --line: rgba(45, 54, 48, 0.16);
    --accent: #a55e43;
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    color: var(--ink);
    background: var(--paper);
    font-family: 'Noto Serif SC', 'Songti SC', Georgia, serif;
  }
  .creation--jade { --accent: #5d807b; }
  .creation--cinnabar { --accent: #aa5144; }
  .creation::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .3; background-image: radial-gradient(rgba(51, 45, 37, .11) .6px, transparent .7px); background-size: 5px 5px; mix-blend-mode: multiply; }
  .ink-wash { position: absolute; pointer-events: none; opacity: .15; filter: blur(2px); background: var(--accent); border-radius: 50%; }
  .ink-wash--one { width: 36vw; height: 26vw; right: -12vw; top: 17vh; transform: rotate(-17deg); }
  .ink-wash--two { width: 28vw; height: 22vw; left: -15vw; bottom: 3vh; transform: rotate(24deg); }
  .creation-header { position: relative; z-index: 2; max-width: 1500px; margin: 0 auto; padding: 28px clamp(20px, 4vw, 68px) 12px; display: flex; justify-content: space-between; align-items: center; }
  .brand-lockup { display: flex; align-items: center; gap: 13px; }
  .brand-seal, .fate-seal { display: grid; place-items: center; width: 42px; height: 42px; color: #f4ecdc; background: var(--ink); font-size: 22px; line-height: 1; box-shadow: 4px 4px 0 rgba(40, 48, 45, .1); }
  .brand-title { font-size: 18px; font-weight: 700; letter-spacing: .12em; }
  .brand-subtitle, .save-note { margin-top: 4px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; letter-spacing: .08em; }
  .save-note { margin: 0; display: flex; align-items: center; gap: 8px; }
  .save-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 12%, transparent); }
  .creation-layout { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(150px, 220px) minmax(480px, 770px) minmax(210px, 260px); gap: clamp(28px, 4vw, 78px); max-width: 1500px; min-height: calc(100vh - 92px); margin: 0 auto; padding: 35px clamp(20px, 4vw, 68px) 55px; align-items: stretch; }
  .ritual-rail { position: relative; padding: 34px 0 8px; }
  .rail-kicker, .detail-kicker, .stage-eyebrow { color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; letter-spacing: .18em; }
  .rail-kicker { margin-bottom: 29px; writing-mode: vertical-rl; letter-spacing: .32em; }
  .rail-line { position: absolute; left: 25px; top: 75px; bottom: 80px; width: 1px; background: var(--line); }
  .rail-step { position: relative; display: grid; grid-template-columns: 51px 1fr; grid-template-rows: 18px 18px; width: 100%; min-height: 65px; padding: 10px 0; color: var(--muted); background: none; border: 0; text-align: left; cursor: pointer; transition: color .25s ease, transform .25s ease; }
  .rail-step:disabled { cursor: default; }
  .rail-step.active, .rail-step.passed { color: var(--ink); }
  .rail-step.active { transform: translateX(7px); }
  .rail-index { grid-row: 1 / 3; display: grid; place-items: center; width: 26px; height: 26px; margin-top: 3px; color: var(--muted); font-family: Georgia, serif; font-size: 11px; border: 1px solid var(--line); background: var(--paper); }
  .rail-step.active .rail-index { color: var(--paper); border-color: var(--accent); background: var(--accent); }
  .rail-step.passed .rail-index { color: var(--accent); border-color: var(--accent); }
  .rail-name { font-size: 14px; font-weight: 700; }
  .rail-mark { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .rail-step.active .rail-mark { color: var(--accent); }
  .rail-caption { position: absolute; bottom: 0; left: 0; color: var(--muted); font-size: 12px; line-height: 1.8; }
  .creation-stage { min-width: 0; display: flex; flex-direction: column; }
  .stage-heading { display: flex; justify-content: space-between; gap: 24px; align-items: end; margin-bottom: 28px; }
  .stage-eyebrow { margin-bottom: 10px; }
  .stage-heading h1 { font-size: clamp(26px, 3vw, 38px); font-weight: 600; letter-spacing: .04em; }
  .stage-description { margin-top: 9px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 13px; }
  .stage-progress { display: flex; gap: 5px; align-items: center; padding-bottom: 4px; }
  .stage-progress span { display: block; width: 18px; height: 2px; background: var(--line); }
  .stage-progress span.filled { background: var(--accent); }
  .welcome-panel { flex: 1; display: grid; grid-template-columns: minmax(250px, .96fr) minmax(260px, .8fr); gap: clamp(30px, 5vw, 80px); align-items: center; }
  .welcome-art { position: relative; height: min(64vh, 570px); min-height: 360px; overflow: hidden; background: #d9dfd3; border: 1px solid rgba(40, 48, 45, .1); box-shadow: 12px 12px 0 rgba(40, 48, 45, .08); }
  .hero-asset { position: absolute; z-index: 5; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .35s ease; }
  .hero-asset.visible { opacity: 1; }
  .welcome-art::after, .portrait-art::after, .mini-art::after { content: ''; position: absolute; inset: 0; opacity: .28; background-image: radial-gradient(rgba(255, 251, 240, .5) .7px, transparent .8px); background-size: 4px 4px; mix-blend-mode: screen; }
  .welcome-moon { position: absolute; width: 190px; height: 190px; right: 17%; top: 13%; border-radius: 50%; background: rgba(245, 238, 208, .78); box-shadow: 0 0 60px rgba(244, 236, 202, .55); }
  .mountain { position: absolute; left: -12%; width: 125%; height: 45%; clip-path: polygon(0 100%, 16% 53%, 30% 72%, 47% 20%, 63% 65%, 78% 43%, 100% 100%); }
  .mountain--back { bottom: 17%; background: rgba(63, 91, 84, .27); }
  .mountain--front { bottom: 5%; background: rgba(36, 55, 51, .56); clip-path: polygon(0 100%, 14% 58%, 27% 73%, 46% 35%, 60% 71%, 78% 22%, 100% 100%); }
  .welcome-figure { position: absolute; left: 48%; bottom: 7%; width: 90px; height: 280px; transform: translateX(-50%); filter: drop-shadow(15px 12px 0 rgba(28, 43, 39, .1)); }
  .welcome-figure::before { content: ''; position: absolute; left: 25px; top: 0; width: 43px; height: 43px; border-radius: 50%; background: #b98567; box-shadow: inset -9px -3px 0 rgba(63, 45, 39, .14); }
  .welcome-figure i { position: absolute; left: 19px; top: 34px; width: 57px; height: 190px; background: #f2e8d2; clip-path: polygon(25% 0, 77% 0, 100% 100%, 0 100%); }
  .welcome-figure b { position: absolute; left: 7px; top: 55px; width: 74px; height: 164px; background: #304a47; clip-path: polygon(30% 0, 70% 0, 100% 100%, 0 100%); }
  .welcome-figure em { position: absolute; right: -15px; top: 56px; width: 7px; height: 188px; background: #a65e43; transform: rotate(-5deg); }
  .welcome-branch { position: absolute; top: 0; right: 4%; width: 150px; height: 90%; border-left: 3px solid rgba(46, 61, 52, .44); transform: rotate(22deg); }
  .welcome-branch span { position: absolute; width: 33px; height: 17px; border-radius: 70% 0 70% 0; background: #9b4e44; }
  .welcome-branch span:nth-child(1) { top: 22%; left: 15px; transform: rotate(24deg); }
  .welcome-branch span:nth-child(2) { top: 38%; left: 45px; transform: rotate(-23deg); }
  .welcome-branch span:nth-child(3) { top: 51%; left: 4px; transform: rotate(35deg); }
  .welcome-copy { padding: 22px 0; }
  .seal-line { color: var(--accent); font-size: 13px; letter-spacing: .22em; }
  .welcome-copy h2 { margin: 25px 0 22px; font-size: clamp(32px, 4.2vw, 54px); font-weight: 500; line-height: 1.3; letter-spacing: .03em; }
  .welcome-copy h2 strong { color: var(--accent); font-weight: 700; }
  .welcome-copy > p:not(.seal-line) { max-width: 380px; color: #697169; font-family: 'Microsoft YaHei', sans-serif; font-size: 13px; line-height: 2.05; }
  .welcome-facts { display: flex; gap: 25px; margin: 33px 0 40px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; }
  .welcome-facts b { margin-right: 3px; color: var(--accent); font-family: Georgia, serif; font-size: 22px; font-weight: 500; }
  .ink-button { display: inline-flex; align-items: center; justify-content: space-between; gap: 24px; min-width: 138px; min-height: 47px; padding: 0 17px 0 22px; color: var(--paper); background: var(--ink); border: 0; box-shadow: 5px 5px 0 color-mix(in srgb, var(--accent) 46%, transparent); font-family: 'Microsoft YaHei', sans-serif; font-size: 13px; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease, background .2s ease; }
  .ink-button:hover { transform: translate(-2px, -2px); box-shadow: 7px 7px 0 color-mix(in srgb, var(--accent) 50%, transparent); }
  .ink-button:disabled { opacity: .38; cursor: not-allowed; transform: none; box-shadow: none; }
  .ink-button i { color: #e9bb88; font-family: Georgia, serif; font-size: 21px; font-style: normal; }
  .ink-button--large { min-width: 180px; min-height: 54px; font-size: 14px; }
  .ink-button--wide { width: 100%; margin-top: 10px; }
  .choice-panel { flex: 1; }
  .choice-panel--race { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; align-items: stretch; }
  .choice-tile { position: relative; min-height: 380px; padding: 33px 26px 24px; color: var(--ink); background: rgba(255, 252, 244, .42); border: 1px solid var(--line); text-align: left; cursor: pointer; transition: transform .25s ease, box-shadow .25s ease, background .25s ease; }
  .choice-tile::before { content: ''; position: absolute; inset: 0; opacity: .1; background: radial-gradient(ellipse at 50% 25%, var(--accent) 0, transparent 55%); pointer-events: none; }
  .choice-tile:hover { transform: translateY(-8px); box-shadow: 8px 10px 0 rgba(40, 48, 45, .08); }
  .choice-tile.selected { color: #f6f0e4; background: var(--ink); border-color: var(--ink); box-shadow: 9px 12px 0 color-mix(in srgb, var(--accent) 45%, transparent); transform: translateY(-6px); }
  .choice-tile.selected::before { opacity: .25; }
  .tile-number { position: absolute; top: 15px; right: 18px; color: var(--muted); font-size: 14px; }
  .selected .tile-number { color: #aebbae; }
  .race-glyph { display: block; margin-top: 45px; color: var(--accent); font-size: 58px; line-height: 1; }
  .selected .race-glyph { color: #e8bb86; }
  .tile-title { display: block; margin-top: 26px; font-size: 22px; font-weight: 700; }
  .tile-subtitle { display: block; margin-top: 7px; color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; letter-spacing: .08em; }
  .selected .tile-subtitle { color: #d9b987; }
  .tile-copy { display: block; margin-top: 27px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; line-height: 1.9; }
  .selected .tile-copy { color: #bac2b6; }
  .tile-arrow { position: absolute; left: 26px; bottom: 25px; color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; }
  .selected .tile-arrow { color: #e8bb86; }
  .tile-arrow b { margin-left: 7px; font-size: 16px; font-weight: 400; }
  .selection-intro { display: flex; align-items: center; gap: 17px; max-width: 540px; margin: 16px auto 36px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 13px; line-height: 1.8; }
  .selection-intro b { color: var(--ink); }
  .intro-seal { display: grid; flex: none; place-items: center; width: 48px; height: 48px; color: #f4ecdc; background: var(--accent); font-family: serif; font-size: 25px; }
  .gender-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .gender-tile { position: relative; min-height: 250px; padding: 30px 24px; color: var(--ink); background: rgba(255, 252, 244, .5); border: 1px solid var(--line); text-align: left; cursor: pointer; transition: .25s ease; }
  .gender-tile:hover, .gender-tile.selected { transform: translateY(-5px); box-shadow: 7px 8px 0 rgba(40, 48, 45, .08); }
  .gender-tile.selected { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .gender-mark { display: block; color: var(--accent); font-size: 37px; }
  .gender-tile.selected .gender-mark { color: #e9bb88; }
  .gender-tile .tile-title { margin-top: 43px; font-size: 20px; }
  .gender-tile .tile-subtitle { margin-top: 7px; }
  .check-mark { display: grid; place-items: center; position: absolute; top: 15px; right: 15px; width: 20px; height: 20px; color: transparent; border: 1px solid var(--line); border-radius: 50%; font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; }
  .selected .check-mark { color: var(--paper); border-color: var(--accent); background: var(--accent); }
  .ink-quote { margin-top: 55px; color: var(--accent); text-align: center; font-size: 19px; letter-spacing: .12em; }
  .name-panel { display: grid; grid-template-columns: 1fr .72fr; gap: 30px; align-items: center; flex: 1; }
  .name-surface { padding: 54px 42px; background: rgba(255, 252, 244, .6); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  .paper-stamp { display: grid; place-items: center; width: 38px; height: 38px; margin-bottom: 46px; color: #f7f0e4; background: var(--accent); font-size: 21px; }
  .name-label { color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; letter-spacing: .15em; }
  .name-surface input { width: 100%; margin-top: 24px; padding: 0 0 14px; color: var(--ink); background: transparent; border: 0; outline: 0; font-family: inherit; font-size: clamp(24px, 3vw, 36px); }
  .name-surface input::placeholder { color: #a8aaa0; font-size: 16px; }
  .name-underline { height: 1px; background: var(--line); }
  .name-underline span { display: block; height: 2px; background: var(--accent); transition: width .25s ease; }
  .name-hint { margin-top: 18px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; line-height: 1.8; }
  .name-preview { position: relative; padding: 34px 28px; border-left: 1px solid var(--line); }
  .name-preview::before { content: '名'; position: absolute; top: -40px; right: 7px; color: var(--accent); opacity: .12; font-size: 160px; line-height: 1; }
  .name-preview p, .name-preview span { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; }
  .name-preview h2 { position: relative; margin: 28px 0 9px; font-size: 32px; font-weight: 600; }
  .origin-panel { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(240px, .75fr); gap: 28px; align-items: center; flex: 1; }
  .origin-list { border-top: 1px solid var(--line); }
  .origin-row { position: relative; display: grid; grid-template-columns: 47px 120px 1fr 85px 20px; align-items: center; gap: 12px; width: 100%; min-height: 75px; padding: 10px 14px 10px 0; color: var(--ink); background: transparent; border: 0; border-bottom: 1px solid var(--line); text-align: left; cursor: pointer; }
  .origin-row:hover { background: rgba(255, 252, 244, .5); }
  .origin-row.selected { color: var(--ink); background: rgba(255, 252, 244, .72); }
  .origin-mark { display: grid; place-items: center; width: 36px; height: 36px; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent); font-size: 16px; }
  .origin-main b, .origin-main small { display: block; }
  .origin-main b { font-size: 13px; }
  .origin-main small, .origin-copy, .origin-realm { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .origin-copy { line-height: 1.6; }
  .origin-realm { color: var(--accent); text-align: right; }
  .origin-detail { padding: 33px 28px; background: rgba(255, 252, 244, .52); border: 1px solid var(--line); }
  .origin-detail h2 { margin: 13px 0 16px; font-size: 26px; }
  .origin-detail > p:not(.detail-kicker) { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; line-height: 2; }
  .keyword-list { display: flex; gap: 8px; margin: 24px 0; }
  .keyword-list span { padding: 5px 8px; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .origin-footnote { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 7px 10px; align-items: center; padding-top: 18px; border-top: 1px solid var(--line); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .origin-footnote span { color: var(--muted); }
  .origin-footnote b { color: var(--ink); font-weight: 400; }
  .origin-footnote i { width: 3px; height: 3px; background: var(--accent); border-radius: 50%; }
  .appearance-panel { flex: 1; min-width: 0; }
  .appearance-head { display: flex; justify-content: space-between; gap: 20px; align-items: end; margin-bottom: 19px; }
  .appearance-head h2 { margin: 8px 0; font-size: 25px; }
  .appearance-head p:not(.detail-kicker) { max-width: 500px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; line-height: 1.7; }
  .text-button, .back-button { color: var(--accent); background: transparent; border: 0; font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; cursor: pointer; }
  .card-carousel { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .character-card { position: relative; min-width: 0; padding: 0 0 17px; overflow: hidden; color: var(--ink); background: rgba(255, 252, 244, .55); border: 1px solid var(--line); text-align: left; cursor: pointer; transition: .22s ease; }
  .character-card:hover, .character-card.selected { transform: translateY(-5px); box-shadow: 6px 8px 0 rgba(40, 48, 45, .08); }
  .character-card.selected { border: 2px solid var(--accent); }
  .mini-art { position: relative; display: block; height: 220px; overflow: hidden; background: #b5c1b0; }
  .card-asset { position: absolute; z-index: 3; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .25s ease; }
  .card-asset.visible { opacity: 1; }
  .mini-art--jade { background: #a6c0b5; }
  .mini-art--cinnabar { background: #bea59a; }
  .mini-art::before { content: ''; position: absolute; left: 15%; right: 11%; bottom: -10%; height: 77%; background: rgba(40, 48, 45, .45); clip-path: polygon(14% 100%, 25% 39%, 35% 33%, 41% 7%, 58% 7%, 65% 34%, 78% 42%, 92% 100%); }
  .mini-art i { position: absolute; left: 39%; top: 19%; width: 24%; aspect-ratio: 1; border-radius: 50%; background: #d6a982; z-index: 1; box-shadow: inset -5px -2px 0 rgba(50, 37, 31, .12); }
  .mini-art b { position: absolute; left: 27%; bottom: 1%; width: 49%; height: 66%; background: rgba(225, 236, 215, .86); clip-path: polygon(27% 0, 74% 0, 100% 100%, 0 100%); }
  .mini-art em { position: absolute; left: 63%; top: 33%; width: 3px; height: 54%; background: #9e5441; transform: rotate(8deg); z-index: 2; }
  .card-id, .card-name, .card-rarity { display: block; margin-left: 14px; }
  .card-id { margin-top: 13px; color: var(--accent); font-family: Georgia, serif; font-size: 11px; letter-spacing: .08em; }
  .card-name { overflow: hidden; margin-top: 6px; color: var(--ink); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .card-rarity { margin-top: 6px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .character-card .check-mark { top: 14px; right: 13px; }
  .carousel-control { display: flex; align-items: center; justify-content: center; gap: 15px; margin: 17px 0 20px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; }
  .round-button { display: grid; place-items: center; width: 30px; height: 30px; color: var(--ink); background: transparent; border: 1px solid var(--line); border-radius: 50%; font-size: 17px; cursor: pointer; }
  .round-button:disabled { opacity: .35; cursor: default; }
  .appearance-panel textarea { width: 100%; min-height: 88px; padding: 15px; resize: vertical; color: var(--ink); background: rgba(255, 252, 244, .58); border: 1px solid var(--line); outline: 0; font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; line-height: 1.8; }
  .appearance-panel textarea:focus { border-color: var(--accent); }
  .field-count { margin-top: 5px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; text-align: right; }
  .body-panel { display: grid; grid-template-columns: 1fr .85fr; gap: 30px; align-items: center; flex: 1; }
  .body-group { padding: 27px 0; border-bottom: 1px solid var(--line); }
  .body-options { display: grid; gap: 10px; margin-top: 20px; }
  .body-option { display: grid; grid-template-columns: 34px 65px 1fr; align-items: center; gap: 12px; min-height: 53px; padding: 8px 12px; color: var(--ink); background: rgba(255, 252, 244, .42); border: 1px solid var(--line); text-align: left; cursor: pointer; }
  .body-option.selected { color: var(--paper); background: var(--ink); border-color: var(--ink); }
  .body-option > span { color: var(--accent); font-size: 20px; }
  .body-option.selected > span { color: #e9bb88; }
  .body-option b { font-size: 13px; }
  .body-option small { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .body-option.selected small { color: #b9c2b6; }
  .compact-options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
  .compact-options button { min-height: 40px; padding: 0 13px; color: var(--muted); background: transparent; border: 1px solid var(--line); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; cursor: pointer; }
  .compact-options button.selected { color: var(--paper); background: var(--accent); border-color: var(--accent); }
  .body-note { display: flex; align-items: center; gap: 20px; padding: 25px 0; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; line-height: 1.9; }
  .note-symbol { display: grid; flex: none; place-items: center; width: 60px; height: 60px; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent); font-family: serif; font-size: 28px; }
  .fate-panel { flex: 1; padding: 9px 0; }
  .fate-hero { display: flex; align-items: center; gap: 20px; padding: 0 0 20px; border-bottom: 1px solid var(--line); }
  .fate-seal { width: 52px; height: 52px; background: var(--accent); box-shadow: none; }
  .fate-hero h2 { margin: 7px 0 3px; font-size: 29px; }
  .fate-hero p:last-child { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; }
  .fate-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin: 22px 0; }
  .fate-stat { min-height: 105px; padding: 15px 13px; background: rgba(255, 252, 244, .57); border: 1px solid var(--line); }
  .fate-stat span, .fate-stat small { display: block; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .fate-stat b { display: block; margin: 15px 0 6px; color: var(--accent); font-size: 16px; font-weight: 600; }
  .fate-resources { padding: 17px 0; color: var(--muted); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; line-height: 1.7; }
  .fate-resources > b { display: block; margin-top: 7px; color: var(--ink); font-weight: 400; }
  .fate-resources > div { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .fate-resources i { padding: 4px 8px; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent); font-style: normal; font-size: 10px; }
  .fate-reading { display: grid; grid-template-columns: 42px 1fr; gap: 16px; padding: 25px 0 17px; }
  .fate-reading > span { color: var(--accent); font-size: 12px; }
  .fate-reading p { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; line-height: 2; }
  .opening-panel { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 600px; margin: 0 auto; text-align: center; }
  .opening-ink { position: relative; display: grid; place-items: center; width: 122px; height: 122px; margin-bottom: 31px; color: var(--accent); font-size: 40px; }
  .opening-ink::before, .opening-ink::after, .ink-ring { content: ''; position: absolute; border: 1px solid color-mix(in srgb, var(--accent) 56%, transparent); border-radius: 50%; }
  .opening-ink::before { inset: 0; transform: rotate(10deg) scaleX(.87); }
  .opening-ink::after { inset: 11px -6px 6px 9px; opacity: .45; transform: rotate(-17deg); }
  .ink-ring { inset: 22px; opacity: .35; border-style: dashed; }
  .opening-panel h2 { margin: 17px 0 18px; font-size: clamp(24px, 3vw, 35px); }
  .opening-lead { max-width: 480px; color: var(--accent); font-size: 17px; line-height: 2; }
  .opening-lines { margin: 26px 0 37px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; line-height: 2.2; }
  .creation-footer { display: flex; align-items: center; justify-content: space-between; gap: 17px; margin-top: 28px; padding-top: 17px; border-top: 1px solid var(--line); }
  .back-button { color: var(--muted); }
  .back-button:hover { color: var(--accent); }
  .footer-hint { color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; text-align: center; }
  .fate-slip { align-self: center; width: 100%; padding: 23px 21px 20px; color: var(--ink); background: rgba(249, 245, 235, .58); border: 1px solid var(--line); box-shadow: 10px 12px 0 rgba(40, 48, 45, .07); transform: rotate(1.4deg); }
  .slip-top { display: flex; justify-content: space-between; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; letter-spacing: .08em; }
  .slip-seal { display: grid; place-items: center; width: 46px; height: 46px; margin: 36px auto 18px; color: var(--paper); background: var(--accent); font-size: 24px; }
  .slip-name { overflow: hidden; color: var(--ink); font-size: 26px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
  .slip-line { width: 70%; height: 1px; margin: 15px auto 24px; background: var(--line); }
  .fate-slip dl { display: grid; gap: 13px; margin: 0; }
  .fate-slip dl div { display: flex; justify-content: space-between; gap: 12px; font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .fate-slip dt { color: var(--muted); }
  .fate-slip dd { overflow: hidden; margin: 0; color: var(--ink); text-overflow: ellipsis; white-space: nowrap; }
  .slip-bottom { margin-top: 31px; padding-top: 15px; border-top: 1px solid var(--line); }
  .slip-bottom span { color: var(--accent); font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; }
  .slip-bottom p { margin-top: 7px; color: var(--muted); font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; line-height: 1.7; }
  @media (max-width: 1120px) {
    .creation-layout { grid-template-columns: 145px minmax(420px, 1fr); gap: 30px; }
    .fate-slip { display: none; }
  }
  @media (max-width: 760px) {
    .creation { min-height: 100svh; overflow: auto; }
    .creation-header { padding: 18px 18px 7px; }
    .brand-title { font-size: 16px; }
    .brand-subtitle { font-size: 9px; }
    .brand-seal { width: 36px; height: 36px; font-size: 18px; }
    .save-note { font-size: 9px; }
    .creation-layout { display: block; min-height: auto; padding: 17px 18px 25px; }
    .ritual-rail { display: none; }
    .stage-heading { align-items: start; margin-bottom: 20px; }
    .stage-heading h1 { font-size: 26px; }
    .stage-description { max-width: 270px; font-size: 11px; line-height: 1.7; }
    .stage-progress { gap: 3px; padding-top: 9px; }
    .stage-progress span { width: 8px; }
    .welcome-panel { display: flex; flex-direction: column; gap: 23px; align-items: stretch; }
    .welcome-art { height: 45svh; min-height: 285px; }
    .welcome-moon { width: 130px; height: 130px; }
    .welcome-figure { transform: translateX(-50%) scale(.78); transform-origin: bottom; }
    .welcome-copy { padding: 0; }
    .welcome-copy h2 { margin: 16px 0 13px; font-size: 34px; }
    .welcome-copy > p:not(.seal-line) { font-size: 12px; line-height: 1.9; }
    .welcome-facts { margin: 22px 0 25px; gap: 16px; }
    .welcome-facts b { font-size: 19px; }
    .ink-button--large { min-height: 48px; }
    .choice-panel--race, .gender-row { grid-template-columns: 1fr; gap: 10px; }
    .choice-tile { min-height: 196px; padding: 20px 21px; }
    .race-glyph { margin-top: 0; font-size: 43px; }
    .tile-title { margin-top: 12px; font-size: 19px; }
    .tile-copy { max-width: 260px; margin-top: 12px; font-size: 11px; line-height: 1.7; }
    .tile-arrow { left: auto; right: 20px; bottom: 21px; }
    .selection-intro { margin: 6px 0 17px; font-size: 11px; }
    .gender-tile { min-height: 106px; padding: 16px 56px 15px 74px; }
    .gender-mark { position: absolute; left: 22px; top: 25px; font-size: 30px; }
    .gender-tile .tile-title { margin-top: 0; font-size: 18px; }
    .gender-tile .tile-subtitle { margin-top: 5px; }
    .ink-quote { margin-top: 27px; font-size: 15px; }
    .name-panel, .origin-panel, .body-panel { display: block; }
    .name-surface { padding: 32px 22px; }
    .paper-stamp { margin-bottom: 27px; }
    .name-surface input { font-size: 26px; }
    .name-surface input::placeholder { font-size: 13px; }
    .name-preview { margin-top: 17px; padding: 22px 5px; border-left: 0; border-top: 1px solid var(--line); }
    .name-preview::before { display: none; }
    .name-preview h2 { margin: 12px 0 6px; font-size: 25px; }
    .origin-panel { display: flex; flex-direction: column; gap: 16px; align-items: stretch; }
    .origin-row { grid-template-columns: 36px 93px 1fr 20px; gap: 9px; min-height: 69px; padding-right: 4px; }
    .origin-copy, .origin-realm { display: none; }
    .origin-detail { padding: 22px 18px; }
    .origin-detail h2 { margin: 9px 0 10px; font-size: 22px; }
    .origin-footnote { grid-template-columns: auto 1fr auto 1fr; }
    .card-carousel { grid-template-columns: repeat(3, minmax(118px, 1fr)); gap: 8px; overflow: hidden; }
    .mini-art { height: 170px; }
    .card-name { margin-left: 10px; font-size: 9px; }
    .card-id, .card-rarity { margin-left: 10px; font-size: 9px; }
    .appearance-head { align-items: start; }
    .appearance-head h2 { font-size: 21px; }
    .text-button { flex: none; }
    .body-group { padding: 18px 0; }
    .body-option { grid-template-columns: 30px 56px 1fr; padding: 7px 9px; }
    .body-note { align-items: flex-start; padding-top: 18px; }
    .fate-panel { padding-top: 0; }
    .fate-hero h2 { font-size: 25px; }
    .fate-grid { grid-template-columns: repeat(2, 1fr); gap: 7px; margin: 16px 0; }
    .fate-stat { min-height: 91px; padding: 12px 10px; }
    .fate-stat b { margin: 11px 0 5px; font-size: 14px; }
    .fate-reading { padding-top: 18px; }
    .opening-panel { padding: 22px 0 6px; }
    .opening-ink { width: 90px; height: 90px; margin-bottom: 22px; font-size: 30px; }
    .opening-panel h2 { font-size: 23px; }
    .opening-lead { font-size: 15px; line-height: 1.9; }
    .opening-lines { margin: 20px 0 28px; font-size: 11px; }
    .creation-footer { position: sticky; bottom: 0; z-index: 3; margin: 21px -18px -25px; padding: 11px 18px max(11px, env(safe-area-inset-bottom)); background: color-mix(in srgb, var(--paper) 92%, transparent); backdrop-filter: blur(12px); }
    .footer-hint { display: none; }
    .back-button span { display: none; }
    .back-button { font-size: 18px; min-width: 44px; }
  }
</style>
