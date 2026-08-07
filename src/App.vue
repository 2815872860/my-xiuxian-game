<template>
  <n-config-provider :theme="playerStore.isDarkMode ? darkTheme : null">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-shell" :class="{ 'app-shell--dark': playerStore.isDarkMode }">
          <div v-if="!isReady" class="app-loading"><span class="loading-seal">问</span><p>正在展开命书</p></div>
          <template v-else>
            <header v-if="!playerStore.isNewPlayer" class="world-header">
              <button class="world-brand" type="button" @click="router.push('/world')">
                <span class="world-brand-seal">问</span><span><b>问道修行录</b><small>山河自选 · 命由己定</small></span>
              </button>
              <nav class="world-nav" aria-label="主导航">
                <button v-for="item in navItems" :key="item.path" type="button" :class="{ active: route.path === item.path }" @click="router.push(item.path)"><span>{{ item.mark }}</span>{{ item.name }}</button>
              </nav>
              <div class="header-player"><span class="header-avatar">{{ playerStore.name?.slice(0, 1) || '问' }}</span><div><b>{{ playerStore.name || '无名修士' }}</b><small>{{ playerStore.realm }}</small></div><button class="header-menu" type="button" aria-label="打开设置" @click="router.push('/settings')">···</button></div>
            </header>
            <main class="app-content"><router-view /></main>
            <nav v-if="!playerStore.isNewPlayer" class="mobile-nav" aria-label="移动端主导航">
              <button v-for="item in mobileNavItems" :key="item.path" type="button" :class="{ active: route.path === item.path }" @click="router.push(item.path)"><span>{{ item.mark }}</span><small>{{ item.name }}</small></button>
            </nav>
          </template>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
  import { onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { darkTheme } from 'naive-ui'
  import { usePlayerStore } from './stores/player'

  const router = useRouter()
  const route = useRoute()
  const playerStore = usePlayerStore()
  const isReady = ref(false)
  const navItems = [
    { path: '/world', name: '问道', mark: '山' },
    { path: '/cultivation', name: '修炼', mark: '息' },
    { path: '/exploration', name: '探索', mark: '游' },
    { path: '/inventory', name: '行囊', mark: '藏' },
    { path: '/alchemy', name: '丹室', mark: '炉' }
  ]
  const mobileNavItems = navItems.slice(0, 4)
  let spiritWorker

  const syncRoute = () => {
    if (!playerStore.isNewPlayer && route.path === '/') router.replace('/world')
    if (playerStore.isNewPlayer && route.path !== '/') router.replace('/')
  }
  const startOnlineCultivation = () => {
    if (playerStore.isNewPlayer || spiritWorker) return
    spiritWorker = new Worker(new URL('./workers/spirit.js', import.meta.url))
    spiritWorker.onmessage = event => {
      if (event.data.type === 'gain') {
        playerStore.totalCultivationTime += 1
        playerStore.gainSpirit(1)
      }
    }
    spiritWorker.postMessage({ type: 'start' })
  }
  onMounted(async () => {
    await playerStore.initializePlayer()
    isReady.value = true
    syncRoute()
    startOnlineCultivation()
  })
  watch(() => playerStore.isNewPlayer, value => {
    if (isReady.value) {
      if (value) router.replace('/')
      else {
        router.replace('/world')
        startOnlineCultivation()
      }
    }
  })
  onUnmounted(() => spiritWorker?.terminate())
</script>

<style>
  :root { color-scheme: light; font-family: 'Noto Serif SC', 'Songti SC', Georgia, serif; background: #e9e4d9; }
  * { box-sizing: border-box; }
  html, body, #app { min-width: 320px; min-height: 100%; margin: 0; }
  body { margin: 0; background: #e9e4d9; }
  button, input, textarea { font: inherit; }
  button { -webkit-tap-highlight-color: transparent; }
  .app-shell { min-height: 100vh; background: #e9e4d9; }
  .app-shell--dark { filter: sepia(.08) brightness(.83); }
  .app-loading { display: grid; place-items: center; min-height: 100vh; color: #7e817a; font-family: 'Microsoft YaHei', sans-serif; font-size: 12px; }
  .loading-seal { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 14px; color: #f2eadc; background: #28302d; font-family: serif; font-size: 23px; animation: loading-breathe 1.6s ease-in-out infinite; }
  .world-header { position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 28px; min-height: 72px; padding: 12px clamp(15px, 4vw, 64px); background: rgba(244, 239, 228, .92); border-bottom: 1px solid rgba(39, 50, 46, .12); backdrop-filter: blur(12px); }
  .world-brand { display: flex; align-items: center; gap: 10px; min-width: 175px; padding: 0; color: #28302d; background: transparent; border: 0; text-align: left; cursor: pointer; }
  .world-brand-seal { display: grid; place-items: center; width: 34px; height: 34px; color: #f2eadc; background: #28302d; font-size: 17px; }
  .world-brand b, .world-brand small { display: block; }
  .world-brand b { font-size: 15px; letter-spacing: .08em; }
  .world-brand small { margin-top: 4px; color: #82867c; font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }
  .world-nav { display: flex; align-items: stretch; gap: 20px; height: 72px; }
  .world-nav button { position: relative; display: flex; align-items: center; gap: 5px; padding: 0; color: #899087; background: transparent; border: 0; font-family: 'Microsoft YaHei', sans-serif; font-size: 11px; cursor: pointer; }
  .world-nav button span { color: #a35d44; font-family: serif; font-size: 14px; }
  .world-nav button::after { content: ''; position: absolute; right: 0; bottom: 14px; left: 0; height: 2px; background: transparent; }
  .world-nav button.active { color: #28302d; }
  .world-nav button.active::after { background: #a35d44; }
  .header-player { display: flex; align-items: center; gap: 8px; min-width: 175px; justify-content: end; }
  .header-avatar { display: grid; place-items: center; width: 29px; height: 29px; color: #f2eadc; background: #a35d44; font-size: 13px; }
  .header-player b, .header-player small { display: block; }
  .header-player b { max-width: 70px; overflow: hidden; font-family: 'Microsoft YaHei', sans-serif; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
  .header-player small { margin-top: 3px; color: #899087; font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }
  .header-menu { margin-left: 8px; padding: 8px; color: #899087; background: transparent; border: 0; letter-spacing: 2px; cursor: pointer; }
  .app-content { min-height: calc(100vh - 72px); }
  .mobile-nav { display: none; }
  @keyframes loading-breathe { 0%, 100% { transform: scale(.94); opacity: .72; } 50% { transform: scale(1); opacity: 1; } }
  @media (max-width: 800px) {
    .world-header { min-height: 58px; padding: 9px 15px; }
    .world-brand { min-width: 0; }
    .world-brand b { font-size: 13px; }
    .world-brand small { display: none; }
    .world-brand-seal { width: 30px; height: 30px; font-size: 15px; }
    .world-nav { display: none; }
    .header-player { min-width: auto; }
    .header-player small { display: none; }
    .header-menu { margin-left: 0; }
    .app-content { min-height: calc(100vh - 58px); padding-bottom: 61px; }
    .mobile-nav { position: fixed; z-index: 20; right: 0; bottom: 0; left: 0; display: grid; grid-template-columns: repeat(4, 1fr); height: 61px; padding-bottom: env(safe-area-inset-bottom); background: rgba(244, 239, 228, .94); border-top: 1px solid rgba(39, 50, 46, .13); backdrop-filter: blur(13px); }
    .mobile-nav button { display: grid; place-items: center; align-content: center; gap: 3px; color: #92988c; background: transparent; border: 0; cursor: pointer; }
    .mobile-nav button span { color: #8f9c8c; font-size: 17px; }
    .mobile-nav button small { font-family: 'Microsoft YaHei', sans-serif; font-size: 9px; }
    .mobile-nav button.active { color: #a35d44; }.mobile-nav button.active span { color: #a35d44; }
  }
</style>
