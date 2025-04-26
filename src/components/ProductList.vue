<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/stores/cart'
import { type Product } from '@/types/product'

const cartStore = useCartStore()

const products = ref<Product[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const categories = ['Album', 'Bingkai', 'Cetak Foto Glossy', 'Cetak Foto Silky']
const selectedCategory = ref('Cetak Foto Glossy')

const fetchProducts = async () => {
  loading.value = true
  error.value = null
  try {
    // Detailed error handling for Supabase query
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('id, name, price, category, image')
      .order('id', { ascending: true })

    // Handle potential errors
    if (fetchError) {
      console.error('Supabase fetch error:', fetchError)
      error.value = `Gagal mengambil produk: ${fetchError.message}`
      return
    }

    // Check if data exists and is an array
    if (!Array.isArray(data)) {
      console.warn('Received non-array data:', data)
      error.value = 'Data produk tidak valid'
      return
    }

    // Validate products with stricter type checking
    const validProducts = data.filter(product => 
      product && 
      typeof product.id !== 'undefined' && 
      product.name && 
      typeof product.price === 'number' &&
      product.image
    )

    if (validProducts.length === 0) {
      console.warn('No valid products found')
      error.value = 'Tidak ada produk valid'
      return
    }

    // Set products
    products.value = validProducts
  } catch (err) {
    console.error('Unexpected error in fetchProducts:', err)
    error.value = err instanceof Error 
      ? `Kesalahan: ${err.message}` 
      : 'Terjadi kesalahan tidak terduga'
  } finally {
    loading.value = false
  }
}

const filteredProducts = computed(() => {
  if (selectedCategory.value === 'Semua') return products.value
  return products.value.filter(p => p.category === selectedCategory.value)
})

const addToCart = (product: Product) => {
  cartStore.addToCart(product)
  cartStore.updateTotalItems()
}

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <v-container fluid class="pa-2">
    <v-col cols="12" lg="8" class="px-8 pt-6 mx-auto">
        <v-select
          v-model="selectedCategory"
          :items="categories"
          label="Kategori"
          variant="outlined"
          density="comfortable"
          class="category-select"
        ></v-select>
      </v-col>

    <v-row v-if="loading">
      <v-col class="text-center">
        <v-progress-circular 
          indeterminate 
          color="primary"
        ></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-else-if="error" class="text-center">
      <v-col>
        <v-alert type="error">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-else-if="products.length === 0">
      <v-col class="text-center">
        <v-alert type="info">
          Tidak ada produk ditemukan
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" class="pa-0">
        <v-row 
          class="px-4 ma-0" 
          style="max-height: calc(110vh - 250px); overflow-y: auto; scrollbar-width: thin;"
        >
          <v-col 
            v-for="product in filteredProducts" 
            :key="product.id" 
            cols="6" 
            md="3"
            class="pa-2"
          >
            <v-card 
              @click="addToCart(product)"
              hover
              class="cursor-pointer"
            >
              <v-img 
                :src="product.image" 
                height="200" 
                cover 
                class="align-end"
              >
              </v-img>
              <v-card-title>{{ product.name }}</v-card-title>
              <v-card-subtitle>
                Rp {{ product.price.toLocaleString() }}
              </v-card-subtitle>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
