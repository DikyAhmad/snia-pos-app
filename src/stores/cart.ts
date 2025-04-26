import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Product } from '@/types/product'

export const useCartStore = defineStore('cart', () => {
  const items = ref<{product: Product, quantity: number}[]>([])

  const totalItems = computed(() => 
    items.value.reduce((total, item) => total + item.quantity, 0)
  )

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => 
      total + (item.product.price * item.quantity), 0)
  })

  function addToCart(product: Product) {
    const existingItem = items.value.find(item => item.product.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      items.value.push({ product, quantity: 1 })
    }
    updateTotalItems()
  }

  function removeFromCart(productId: number) {
    const index = items.value.findIndex(item => item.product.id === productId)
    if (index !== -1) {
      items.value.splice(index, 1)
      updateTotalItems()
    }
  }

  function updateTotalItems() {
    // This method can be used to trigger any side effects when cart changes
  }

  function clearCart() {
    items.value = []
    updateTotalItems()
  }

  function updateItemQuantity(productId: number, quantity: number) {
    const existingItemIndex = items.value.findIndex(
      item => item.product.id === productId
    )

    if (existingItemIndex !== -1) {
      // Update the quantity of the existing item
      items.value[existingItemIndex].quantity = quantity
      updateTotalItems()
    }
  }

  return { 
    items, 
    totalItems, 
    totalPrice,
    addToCart, 
    removeFromCart, 
    updateTotalItems,
    clearCart,
    updateItemQuantity
  }
})
