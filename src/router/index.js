import { createRouter, createWebHashHistory } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import CharacterCreation from '../views/CharacterCreation.vue'
import World from '../views/World.vue'

const Cultivation = () => import('../views/Cultivation.vue')
const Inventory = () => import('../views/Inventory.vue')
const Exploration = () => import('../views/Exploration.vue')
const Achievements = () => import('../views/Achievements.vue')
const Settings = () => import('../views/Settings.vue')
const GM = () => import('../views/GM.vue')
const Alchemy = () => import('../views/Alchemy.vue')
const Dungeon = () => import('../views/Dungeon.vue')
const Gacha = () => import('../views/Gacha.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: CharacterCreation
  },
  {
    path: '/world',
    name: 'World',
    component: World
  },
  {
    path: '/cultivation',
    name: 'Cultivation',
    component: Cultivation
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: Inventory
  },
  {
    path: '/exploration',
    name: 'Exploration',
    component: Exploration
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: Achievements
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/gm',
    name: 'gm',
    component: GM,
    beforeEnter: (to, from, next) => {
      const playerStore = usePlayerStore()
      if (!playerStore.isGMMode) {
        next('/cultivation')
      } else {
        next()
      }
    }
  },
  {
    path: '/alchemy',
    name: 'alchemy',
    component: Alchemy
  },
  {
    path: '/dungeon',
    name: 'Dungeon',
    component: Dungeon
  },
  {
    path: '/gacha',
    name: 'Gacha',
    component: Gacha
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
