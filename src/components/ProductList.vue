<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'
import { storeToRefs } from 'pinia'

const cartStore = useCartStore()
const productStore = useProductStore()
const { products, loading, error } = storeToRefs(productStore)

const categories = ['Album', 'Bingkai', 'Cetak Foto Glossy', 'Cetak Foto Silky']
const selectedCategory = ref('Cetak Foto Glossy')

const filteredProducts = computed(() => {
  let filtered = selectedCategory.value === 'Semua'
    ? products.value
    : products.value.filter(p => p.category === selectedCategory.value)
  return filtered.slice().sort((a, b) => a.name.localeCompare(b.name))
})

const addToCart = (product: any) => {
  cartStore.addToCart(product)
  cartStore.updateTotalItems()
}

onMounted(() => {
  productStore.fetchProducts()
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
              <v-lazy :min-height="200" :options="{ threshold: 0.5 }">
                <v-img 
                  :src="product.image" 
                  height="200" 
                  cover 
                  class="align-end"
                  :style="{ backgroundColor: '#eeeeee' }"
                />
              </v-lazy>
              <v-card-title>{{ product.name }}</v-card-title>
              <v-card-subtitle class="mb-2">
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
