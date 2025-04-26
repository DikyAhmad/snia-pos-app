<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { VAppBar, VAppBarTitle, VBtn, VIcon, VBadge } from 'vuetify/components'
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'

const emit = defineEmits(['toggle-cart', 'return-home'])

const cartStore = useCartStore()
const { totalItems } = storeToRefs(cartStore)

const handleCartClick = () => {
  emit('toggle-cart')
}

const handleTitleClick = () => {
  emit('return-home')
}
</script>

<template>
  <v-app-bar color="primary" dark>
    <v-app-bar-title 
      class="v-app-bar-title"
      @click="handleTitleClick"
    >
      SNIA POS App
    </v-app-bar-title>
    
    <Popover class="relative">
      <v-btn 
          icon 
          class="no-border"
          @click="handleCartClick"
        >
        <v-badge 
          :content="totalItems" 
          :model-value="totalItems > 0"
          color="red"
        >
          <v-icon>mdi-cart</v-icon>
        </v-badge>
      </v-btn>
    </Popover>
  </v-app-bar>
</template>

<style scoped>
.no-border {
  border: none !important;
  box-shadow: none !important;
}

.v-app-bar-title {
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.v-app-bar-title:hover {
  opacity: 0.8;
}
</style>
