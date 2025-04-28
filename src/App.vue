<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import ProductList from './components/ProductList.vue'
import CartView from './components/CartView.vue'
import { VApp, VMain, VContainer, VRow, VCol } from 'vuetify/components'
import { useCartStore } from '@/stores/cart'
import { useRoute } from 'vue-router'

const cartStore = useCartStore()
const isCartView = ref(false)
const route = useRoute()

const toggleView = () => {
  isCartView.value = !isCartView.value
}

const returnHome = () => {
  isCartView.value = false
}

onMounted(() => {
  cartStore.$subscribe(() => {
    // Optional: Add any side effects if needed
  })
})

</script>

<template>
  <v-app>
    <AppHeader 
      @toggle-cart="toggleView" 
      @return-home="returnHome" 
    />
    <v-main class="overflow-hidden">
      <template v-if="route.path === '/login' || route.path === '/edit'">
        <router-view />
      </template>
      <template v-else>
        <v-container fluid class="pa-2">
          <v-row v-if="!isCartView">
            <ProductList />
          </v-row>
          <v-row v-else >
            <v-col cols="12" sm="12" md="12" lg="8" class="mx-auto">
              <CartView />
            </v-col>
          </v-row>
        </v-container>
      </template>
    </v-main>
  </v-app>
</template>

<style>
/* Reset default margins and paddings */
body, html {
  margin: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5; /* Light grey background */
}

/* Prevent scrolling on mobile */
body {
  position: fixed;
  width: 100%;
  height: 100%;
}

/* Remove any potential scrollbars */
::-webkit-scrollbar {
  width: 0;
  background: transparent;
}
</style>
