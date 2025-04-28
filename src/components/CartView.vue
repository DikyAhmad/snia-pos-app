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

import jsPDF from 'jspdf'

// Dialog state dan data pembayaran
const showCheckoutDialog = ref(false)
const paymentMethod = ref<'cash' | 'qris'>('cash')
const paymentAmount = ref<number>(0)
const paymentError = ref<string>('')

const openCheckoutDialog = () => {
  paymentMethod.value = 'cash'
  paymentAmount.value = totalPrice.value
  paymentError.value = ''
  showCheckoutDialog.value = true
}

const handlePaymentInput = (val: string) => {
  const num = parseInt(val.replace(/[^0-9]/g, ''), 10)
  paymentAmount.value = isNaN(num) ? 0 : num
}

const handleCheckout = () => {
  if (paymentMethod.value === 'cash' && paymentAmount.value < totalPrice.value) {
    paymentError.value = 'Jumlah pembayaran kurang dari total belanja.'
    return
  }
  if (paymentMethod.value === 'qris') {
    paymentAmount.value = totalPrice.value
  }
  showCheckoutDialog.value = false
  paymentError.value = ''
  generateReceiptPDF()
}

const generateReceiptPDF = () => {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  let y = 15
  doc.setFontSize(22)
  doc.setFontSize(16)
  doc.text('SNIA PHOTO STUDIO',75, y, { align: 'center' })
  doc.setFontSize(10)
  y += 6
  doc.text('Jl. Kodiklat TNI no 174, Buaran, Tangerang Selatan', 75, y, { align: 'center' })
  y += 5
  doc.text('Banten', 75, y, { align: 'center' })
  y += 5
  doc.text('No. Telp 08815344795', 75, y, { align: 'center' })
  y += 6
  doc.line(10, y, 140, y)
  y += 6
  // Tanggal & jam sesuai waktu checkout
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const tanggal = `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${pad(now.getFullYear())}`
  const jam = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  doc.text(tanggal, 20, y, { align: 'left', maxWidth: 35 })
  doc.text('SNIA PHOTO', 125, y, { align: 'right', maxWidth: 35 })
  y += 6
  doc.text(jam, 20, y, { align: 'left', maxWidth: 35 })
  doc.text('No.01', 125, y, { align: 'right', maxWidth: 35 })
  y += 4
  // Garis tengah sejajar
  doc.line(10, y, 140, y)
  y += 7

  // Product list dari cart
  let totalQty = 0
  items.value.forEach((item, idx) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${idx + 1}. ${item.product.category + ' - ' + item.product.name}`, 20, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    doc.text(`${item.quantity} x ${item.product.price.toLocaleString('id-ID')}`, 32, y)
    doc.text('Rp ' + (item.product.price * item.quantity).toLocaleString('id-ID'), 125, y, { align: 'right', maxWidth: 35 })
    y += 6
    totalQty += item.quantity
  })
  y += 2
  doc.line(10, y, 140, y)
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Total', 80, y)
  doc.text('Rp ' + totalPrice.value.toLocaleString('id-ID'), 125, y, { align: 'right', maxWidth: 35 })
  doc.setFont('helvetica', 'normal')
  y += 6
  doc.text('Bayar (' + (paymentMethod.value === 'cash' ? 'Cash' : 'QRIS') + ')', 80, y)
  doc.text('Rp ' + paymentAmount.value.toLocaleString('id-ID'), 125, y, { align: 'right', maxWidth: 35 })
  y += 6
  doc.text('Kembali', 80, y)
  doc.text('Rp ' + (paymentAmount.value - totalPrice.value).toLocaleString('id-ID'), 125 , y, { align: 'right', maxWidth: 35 })
  y += 10
  doc.setFontSize(12)
  y += 10
  doc.text('Terimakasih Telah Berbelanja', 75, y, { align: 'center' })
  y += 8
  doc.setFontSize(10)
  doc.save(`struk-${pad(now.getSeconds())}${pad(now.getMinutes())}${pad(now.getHours())}${pad(now.getDate())}${pad(now.getMonth())}${pad(now.getFullYear())}.pdf`)
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
        <v-card elevation="3">
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
                        {{ item.product.category + ' - ' + item.product.name }}
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
          @click="openCheckoutDialog"
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
      <!-- Dialog Checkout -->
    <v-dialog v-model="showCheckoutDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6 text-center">Checkout</v-card-title>
        <v-card-text>
          <v-radio-group v-model="paymentMethod" row>
            <v-radio label="Cash" value="cash" />
            <v-radio label="QRIS" value="qris" />
          </v-radio-group>

          <div class="my-2">Jumlah Bayar:</div>
          <v-text-field
            v-model="paymentAmount"
            type="number"
            min="0"
            :rules="[v => v >= totalPrice || 'Jumlah harus >= total']"
            @input="handlePaymentInput($event.target.value)"
            prepend-inner-icon="mdi-calculator"
            placeholder="Masukkan jumlah bayar"
            hide-details="auto"
            :disabled="paymentMethod === 'qris'"
          />
          <div v-if="paymentError" class="red--text text-caption">{{ paymentError }}</div>
          <div class="d-flex justify-space-between mt-2">
            <span>Total: </span>
            <span>Rp {{ totalPrice.toLocaleString() }}</span>
          </div>
          <div class="d-flex justify-space-between mt-1">
            <span>Kembali: </span>
            <span>Rp {{ paymentMethod === 'qris' ? 0 : (paymentAmount - totalPrice).toLocaleString() }}</span>
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text @click="showCheckoutDialog = false">Batal</v-btn>
          <v-btn color="primary" @click="handleCheckout">Bayar & Cetak</v-btn>
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
