<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { VAppBar, VAppBarTitle, VBtn, VIcon, VBadge } from 'vuetify/components'
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const { totalItems } = storeToRefs(cartStore)
const router = useRouter()

const handleCartClick = () => {
  router.push('/cart')
}

const handleTitleClick = () => {
  router.push('/')
}

import { supabase } from '@/lib/supabase'

import { useAdminPanelStore } from '@/stores/adminPanel'

const goToLogin = async () => {
  const { data } = await supabase.auth.getSession()
  const adminPanelStore = useAdminPanelStore()
  if (data.session) {
    // User is logged in, show admin panel directly
    adminPanelStore.showPanel()
    if (router.currentRoute.value.path !== '/login') {
      router.push('/login')
    }
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <v-app-bar color="primary" dark>
    <v-app-bar-title 
      class="v-app-bar-title"
      @click="handleTitleClick"
    >
      SNIA POS
    </v-app-bar-title>
    
    <Popover class="relativ mr-4">
      <v-btn icon class="mr-2 no-border" @click="goToLogin">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
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
