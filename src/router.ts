import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Homepage from './pages/Homepage.vue'

import CartView from './components/CartView.vue'
import Login from './pages/Login.vue'


const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Homepage },
  { path: '/cart', name: 'Cart', component: CartView },
  { path: '/login', name: 'Login', component: Login },

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
