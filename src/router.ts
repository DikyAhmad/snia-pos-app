import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import ProductList from './components/ProductList.vue'
import CartView from './components/CartView.vue'
import Login from './components/Login.vue'


const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: ProductList },
  { path: '/cart', name: 'Cart', component: CartView },
  { path: '/login', name: 'Login', component: Login },

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
