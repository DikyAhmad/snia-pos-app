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
import { useLocale } from '@/composables/useLocale'

const cartStore = useCartStore()
const { items, totalPrice } = storeToRefs(cartStore)
const { t } = useLocale()

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
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'

// Function to upload PDF to Supabase Storage
const uploadPdfToSupabase = async (pdf: { blob?: Blob, filename?: string }) => {
  if (!pdf || !pdf.blob || !pdf.filename) {
    console.error('Invalid PDF object for upload:', pdf)
    return
  }
  try {
    // Upload to receipts/private/receipt-name.pdf
    const privatePath = `private/${pdf.filename}`
    const { data, error } = await supabase.storage.from('receipts').upload(privatePath, pdf.blob, {
      cacheControl: '3600',
      contentType: 'application/pdf',
      upsert: false
    })
    if (error) {
      console.error('Upload PDF failed (SDK):', error)
    }
  } catch (e) {
    console.error('Upload PDF failed (SDK, exception):', e)
  }
}


// Dialog state and payment data
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

// Print button in footer with login validation
const handlePrintFooter = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    showAuthWarningDialog.value = true;
    return;
  }
  openCheckoutDialog();
}

const handlePaymentInput = (val: string) => {
  const num = parseInt(val.replace(/[^0-9]/g, ''), 10)
  paymentAmount.value = isNaN(num) ? 0 : num
}

// Warning dialog if not logged in
const showAuthWarningDialog = ref(false)

const handleCheckout = async () => {
  if (paymentMethod.value === 'cash' && paymentAmount.value < totalPrice.value) {
    paymentError.value = 'Payment amount is less than the total purchase.'
    return
  }
  if (paymentMethod.value === 'qris') {
    paymentAmount.value = totalPrice.value
  }
  showCheckoutDialog.value = false
  paymentError.value = ''
  try {
    const pdfFile = await generateReceiptPDF()
    if (pdfFile && pdfFile.doc && pdfFile.filename) {
      await uploadPdfToSupabase(pdfFile)
      pdfFile.doc.save(pdfFile.filename)
      cartStore.clearCart()
    }
  } catch (err) {
    // Optionally, show an error message to the user
    paymentError.value = 'Failed to generate or save PDF.'
  }
}

// Handle print button with login validation
const handlePrint = async () => {
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    showAuthWarningDialog.value = true
    return
  }
  handleCheckout()
}

const generateReceiptPDF = async () => {
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
  // Date and time based on checkout time
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  // Date on the left, SNIA PHOTO on the right
  doc.text(`Tanggal: ${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`, 20, y, { align: 'left', maxWidth: 40 })
  doc.text('SNIA PHOTO', 125, y, { align: 'right', maxWidth: 40 })
  y += 6
  // Time on the left, empty on the right
  doc.text(`Jam: ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`, 20, y, { align: 'left', maxWidth: 40 })
  y += 3
  doc.line(10, y, 140, y)
  y += 6
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
  // Generate QR code from filename
  const filename = `sniaphoto-${pad(now.getSeconds())}${pad(now.getMinutes())}${pad(now.getHours())}${pad(now.getDate())}${pad(now.getMonth())}${pad(now.getFullYear())}.pdf`
  const filenameQR = `sniaphoto/${pad(now.getSeconds())}${pad(now.getMinutes())}${pad(now.getHours())}${pad(now.getDate())}${pad(now.getMonth())}${pad(now.getFullYear())}`
  try {
    const qrDataUrl = await QRCode.toDataURL(filenameQR, { margin: 1, width: 80 })
    doc.addImage(qrDataUrl, 'PNG', 55, y, 35, 35)
    y += 42
  } catch (err) {
    // QR generation failed, skip
    y += 2
  }
  doc.setFontSize(10)
  // Save to Blob instead of saving to disk
  const pdfBlob = doc.output('blob')
  return { blob: pdfBlob, filename, doc }
}
</script>

<template>
  <v-dialog v-model="showAuthWarningDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6 mx-4 mt-4">{{ t('auth_warning_title') }}</v-card-title>
      <v-card-text>
        <v-alert type="warning" variant="tonal">
          {{ t('auth_warning_message') }}
        </v-alert>
      </v-card-text>
      <v-card-actions class="mx-4 mb-4">
        <v-btn color="primary" @click="showAuthWarningDialog = false" class="">{{ t('close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-container fluid class="grey lighten-4">
    <v-row v-if="items.length === 0" class="justify-center align-center" style="height: 50vh;">
      <v-col cols="12" class="text-center">
        <v-icon size="large" class="mb-4">mdi-cart-off</v-icon>
        <div class="text-h6 grey--text">{{ t('cart_empty') }}</div>
      </v-col>
    </v-row>

    <v-row v-else justify-center align-center style="min-height: calc(100vh - 200px)">
      <v-col cols="12" sm="10" md="8" lg="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h2 class="text-h5">{{ t('cart') }}</h2>
          <v-btn 
            color="error" 
            variant="outlined"
            size="small"
            @click="confirmClearCart"
          >
            {{ t('clear_cart') }}
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
          @click="handlePrintFooter"
        >
          {{ t('pay_and_print') }}
        </v-btn>
      </div>
    </v-footer>

    <v-dialog 
      v-model="showClearCartDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-h6 text-center">
            {{ t('empty_cart') }}
          </v-card-title>
        <v-card-text class="text-center">
            {{ t('empty_cart_confirm') }}
          </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn 
              color="primary" 
              @click="showClearCartDialog = false"
              class="mr-2"
            >
              {{ t('cancel') }}
            </v-btn>
          <v-btn 
              color="error" 
              variant="outlined"
              @click="handleClearCart"
            >
              {{ t('delete') }}
            </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
      <!-- Dialog Checkout -->
    <v-dialog v-model="showCheckoutDialog" max-width="400">
      <v-card>
        <v-card-text>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-subtitle-1 font-weight-medium">{{ t('payment_method') }}</span>
          </div>
          <v-radio-group v-model="paymentMethod" row>
            <v-radio :label="t('cash')" value="cash" />
            <v-radio label="QRIS" value="qris" />
          </v-radio-group>

          <div class="my-2">{{ t('payment_amount') }}:</div>
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
            <span>{{ t('total') }}: </span>
            <span>Rp {{ totalPrice.toLocaleString() }}</span>
          </div>
          <div class="d-flex justify-space-between mt-1">
            <span>{{ t('payment_amount') }}:</span>
            <span>Rp {{ paymentAmount.toLocaleString() }}</span>
          </div>
          <div class="d-flex justify-space-between mt-1">
            <span>{{ t('change') }}:</span>
            <span>Rp {{ paymentMethod === 'qris' ? 0 : (paymentAmount - totalPrice).toLocaleString() }}</span>
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text @click="showCheckoutDialog = false">{{ t('cancel') }}</v-btn>
          <v-btn color="primary" @click="handlePrint">{{ t('pay_and_print') }}</v-btn>
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
