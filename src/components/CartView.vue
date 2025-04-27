<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  VContainer, 
  VRow, 
  VCol, 
  VCard, 
  VCardTitle, 
  VCardText, 
  VCardActions,
  VBtn,
  VDivider,
  VIcon,
  VFooter,
  VSheet,
  VDialog
} from 'vuetify/components'
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'
import { type CartItem } from '@/types/cart'

const cartStore = useCartStore()
const { items, totalPrice } = storeToRefs(cartStore)

const getItemTotalPrice = (item: CartItem) => {
  return item.product.price * item.quantity
}

const removeItem = (productId: number) => {
  cartStore.removeFromCart(productId)
  cartStore.updateTotalItems()
}

const incrementQuantity = (productId: number) => {
  const item = items.value.find(i => i.product.id === productId)
  if (item) {
    item.quantity += 1
    cartStore.updateTotalItems()
  }
}

const decrementQuantity = (productId: number) => {
  const itemIndex = items.value.findIndex(i => i.product.id === productId)
  if (itemIndex !== -1) {
    if (items.value[itemIndex].quantity > 1) {
      items.value[itemIndex].quantity -= 1
    } else {
      items.value.splice(itemIndex, 1)
    }
    cartStore.updateTotalItems()
  }
}

const updateQuantity = (item: CartItem, event: Event) => {
  const inputElement = event.target as HTMLInputElement
  const newQuantity = inputElement.value ? parseInt(inputElement.value, 10) : 1
  
  // Ensure quantity is a positive number
  const quantity = Math.max(1, newQuantity)
  
  // Update the cart store with the new quantity
  cartStore.updateItemQuantity(item.product.id, quantity)
}

const showClearCartDialog = ref(false)

const confirmClearCart = () => {
  showClearCartDialog.value = true
}

const handleClearCart = () => {
  cartStore.clearCart()
  showClearCartDialog.value = false
}

const checkout = () => {
  // Add checkout logic here
}
</script>

<template>
  <v-container fluid class="grey lighten-4">
    <v-row v-if="items.length === 0" class="justify-center align-center" style="height: 50vh;">
      <v-col cols="12" class="text-center">
        <v-icon size="large" class="mb-4">mdi-cart-off</v-icon>
        <div class="text-h6 grey--text">Keranjang kosong</div>
      </v-col>
    </v-row>

    <v-row v-else justify-center align-center style="min-height: calc(100vh - 200px)">
      <v-col cols="12" sm="10" md="8" lg="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h2 class="text-h5">Keranjang</h2>
          <v-btn 
            color="error" 
            variant="outlined"
            size="small"
            @click="confirmClearCart"
          >
            Clear Cart
          </v-btn>
        </div>
        <v-card>
          <v-card-text class="pa-0">
            <v-sheet 
              class="overflow-y-auto" 
              style="max-height: calc(100vh - 200px)"
            >
              <v-row 
                v-for="item in items" 
                :key="item.product.id" 
                class="align-center ma-4"
              >
               
                <v-col cols="12">
                  <div class="d-flex justify-space-between align-center">
                      <div>
                      <div class="text-subtitle-1 font-weight-bold">
                        {{ item.product.name + ' - ' + item.product.category }}
                      </div>
                      <div class="text-caption grey--text">
                        Rp {{ item.product.price.toLocaleString() }}
                      </div>
                      <div class="text-caption grey--text">
                        Subtotal: Rp {{ getItemTotalPrice(item).toLocaleString() }}
                      </div>
                    </div>
                    <div class="d-flex align-center">
                      <v-btn 
                        icon 
                        variant="text" 
                        size="small"
                        @click="decrementQuantity(item.product.id)"
                      >
                        <v-icon>mdi-minus</v-icon>
                      </v-btn>
                      <input 
                        type="number" 
                        :value="item.quantity" 
                        @input="updateQuantity(item, $event)"
                        style="width: 40px; text-align: center;"
                      />
                      <v-btn 
                        icon 
                        variant="text" 
                        size="small"
                        @click="incrementQuantity(item.product.id)"
                      >
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                      <v-btn 
                        icon 
                        variant="text" 
                        size="small"
                        color="red"
                        @click="removeItem(item.product.id)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-sheet>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-footer 
      v-if="items.length > 0"
      app 
      elevation="10" 
      class="pa-4 d-flex justify-space-between align-center"
    >
      <div class="text-h6">
        Total: Rp {{ totalPrice.toLocaleString() }}
      </div>
      <div>
        <v-btn 
          color="primary"
          @click="checkout"
        >
          Checkout
        </v-btn>
      </div>
    </v-footer>

    <v-dialog 
      v-model="showClearCartDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-h6 text-center">
          Empty Cart
        </v-card-title>
        <v-card-text class="text-center">
          Are you sure you want to empty your cart?
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn 
            color="primary" 
            @click="showClearCartDialog = false"
            class="mr-2"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="error" 
            variant="outlined"
            @click="handleClearCart"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}
</style>
