<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { VCard, VCardTitle, VCardText, VCardActions, VTextField, VBtn } from 'vuetify/components'
import { supabase } from '@/lib/supabase'

const username = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Username and password are required.'
    return
  }
  error.value = ''
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: username.value,
    password: password.value
  })
  if (loginError) {
    error.value = loginError.message || 'Login gagal. Cek username/password.'
    return
  }
  router.push('/edit')
}
</script>

<template>
  <v-container class="d-flex align-center justify-center" style="height: 80vh;">
    <v-card class="mx-auto pa-6 d-flex flex-column justify-center" max-width="400" min-width="320" min-height="300" elevation="8">
      <v-card-title class="text-center text-h5 mb-2">Admin</v-card-title>
      <v-card-text>
        <v-text-field label="Username" v-model="username" outlined density="comfortable" class="mb-3" />
        <v-text-field label="Password" v-model="password" outlined density="comfortable" type="password" class="mb-3" />
        <div v-if="error" class="red--text text-caption mt-2">{{ error }}</div>
      </v-card-text>
      <div>
        <v-btn 
          color="primary"
          block
          @click="handleLogin"
        >
          Login
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>
