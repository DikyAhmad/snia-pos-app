<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { storeToRefs } from 'pinia'
import { useAdminPanelStore } from '@/stores/adminPanel'

const username = ref('')
const password = ref('')
const error = ref('')
import { onMounted, onBeforeUnmount } from 'vue'
const isLoggedIn = ref(false)
const showSearch = ref(false)
const showEditTable = ref(false)

const adminPanelStore = useAdminPanelStore()
const { show } = storeToRefs(adminPanelStore)

// Product management states
const products = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const selectedProduct = ref<any>({})
const isAddMode = ref(false)
const categories = [
  'Album',
  'Frame',
  'Glossy Photo Print',
  'Silky Photo Print'
]
const headers = [
  { title: 'Product Name', value: 'displayName' },
  { title: 'Price', value: 'price' }
]

const searchQuery = ref('')
const searchResult = ref<null | { found: boolean; url?: string }> (null)

const handleSearch = async () => {
  searchResult.value = null
  if (!searchQuery.value) return
  const fileName = searchQuery.value.endsWith('.pdf') ? searchQuery.value : searchQuery.value + '.pdf'
  // Search in 'receipts' bucket, 'private' folder
  const { data, error } = await supabase.storage.from('receipts').list('private', { search: fileName })
  if (error) {
    searchResult.value = { found: false }
    return
  }
  const found = data?.some((file: any) => file.name === fileName)
  if (found) {
    const { data: urlData } = await supabase.storage.from('receipts').createSignedUrl(`private/${fileName}`, 60)
    searchResult.value = { found: true, url: urlData?.signedUrl }
  } else {
    searchResult.value = { found: false }
  }
}

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
    error.value = loginError.message || 'Login failed. Check username/password.'
    return
  }
  isLoggedIn.value = true
  adminPanelStore.showPanel()
}

const fetchProducts = async () => {
  loading.value = true
  const { data, error } = await supabase.from('products').select('id, name, price, category, image')
  if (!error && data) {
    products.value = data
      .sort((a: any, b: any) => (a.category > b.category ? 1 : a.category < b.category ? -1 : 0))
      .map((item: any) => ({
        ...item,
        displayName: `${item.category} ${item.name}`.trim()
      }))
  }
  loading.value = false
}
const openAddProduct = () => {
  selectedProduct.value = {
    name: '',
    price: '',
    category: '',
    image: ''
  }
  isAddMode.value = true
  dialog.value = true
}
const onRowClick = async (item: any) => {
  if (item && item.id) {
    const { data, error } = await supabase.from('products').select('*').eq('id', item.id).single()
    if (!error && data) {
      selectedProduct.value = data
      isAddMode.value = false
      dialog.value = true
    }
  }
}
const saveProduct = async () => {
  if (!selectedProduct.value.id) {
    const insertPayload = {
      name: selectedProduct.value.name,
      price: Number(selectedProduct.value.price),
      category: selectedProduct.value.category,
      image: selectedProduct.value.image
    };
    const { error } = await supabase
      .from('products')
      .insert([insertPayload]);
    if (!error) {
      await fetchProducts();
      dialog.value = false;
    } else {
      alert('Failed to add product!\n' + (error.message || ''));
    }
    return;
  }
  // EDIT PRODUCT
  const updatePayload = {
    name: selectedProduct.value.name,
    price: Number(selectedProduct.value.price),
    category: selectedProduct.value.category,
    image: selectedProduct.value.image
  };
  const { error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', selectedProduct.value.id);
  if (!error) {
    await fetchProducts();
    dialog.value = false;
  } else {
    alert('Failed to save product changes!\n' + (error.message || ''));
  }
};
const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
  } catch (e: any) {
    // Ignore 403 Forbidden error on logout
    if (e?.status !== 403) {
      console.error('Logout error:', e);
    }
  }
  const { data } = await supabase.auth.getSession();
  isLoggedIn.value = !!data.session;
  username.value = '';
  password.value = '';
  error.value = '';
  adminPanelStore.hidePanel();
}

watch(isLoggedIn, (val) => { if (val) fetchProducts() })

// Supabase session auto-refresh
let authListener: any = null
onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  isLoggedIn.value = !!data.session
  authListener = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      isLoggedIn.value = true
    }
    if (event === 'SIGNED_OUT') {
      isLoggedIn.value = false
    }
  })
})
onBeforeUnmount(() => {
  if (authListener && typeof authListener.subscription?.unsubscribe === 'function') {
    authListener.subscription.unsubscribe()
  }
})
</script>

<template>
  <v-container class="d-flex flex-column align-center" style="min-height: 80vh;">
    <v-card v-if="!isLoggedIn && !show" class="mx-auto pa-6 d-flex flex-column justify-center my-auto" max-width="400" min-width="320" min-height="300" elevation="8">
      <v-card-title class="text-center text-h5 mb-2">Admin Login</v-card-title>
      <v-card-text>
        <v-text-field label="Username" v-model="username" outlined density="comfortable" class="mb-3" />
        <v-text-field label="Password" v-model="password" outlined density="comfortable" type="password" class="mb-3" />
        <div v-if="error" class="red--text text-caption mt-2">{{ error }}</div>
      </v-card-text>
      <div>
        <v-btn color="primary" block @click="handleLogin">Login</v-btn>
      </div>
    </v-card>

    <div v-if="isLoggedIn || show" style="width:100%;max-width:500px;" class="my-8">
      <template v-if="showEditTable">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Edit Products</span>
            <v-btn icon color="error" @click="showEditTable = false" size="x-small" style="min-width:28px;height:28px;"><v-icon size="16">mdi-close</v-icon></v-btn>
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="products"
            :loading="loading"
            class="elevation-2 custom-table-grey"
            :loading-text="'Loading products...'"
            :no-data-text="'No products'"
            item-value="id"
            hide-default-footer
            fixed-header
            height="400"
            :items-per-page="20"
            style="cursor:pointer"
          >
            <template #item="{ item, index }">
              <tr @click="onRowClick(item)" style="cursor:pointer">
                <td>{{ item.displayName }}</td>
                <td>{{ item.price }}</td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </template>
      <template v-else-if="showSearch">
        <v-card class="mx-auto pa-4 d-flex flex-column justify-center mt-0" max-width="400" min-width="320" min-height="100" elevation="6">
          <v-card-title class="d-flex align-start" style="justify-content: start; position: relative; min-height: 40px;">
            <span style="font-weight:500;">Search Transaction</span>
            <v-btn icon color="error" @click="showSearch = false" size="x-small" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);min-width:28px;height:28px;"><v-icon size="16">mdi-close</v-icon></v-btn>
          </v-card-title>
          <v-form @submit.prevent="handleSearch" class="pa-4">
            <v-text-field
              v-model="searchQuery"
              label="Search PDF..."
              outlined
              density="comfortable"
              class="mb-3"
            />
            <v-btn color="secondary" type="submit" block>Search</v-btn>
            <div v-if="searchResult">
              <div v-if="searchResult.found" class="mt-3 green--text">
                PDF found.
                <a :href="searchResult.url" target="_blank" style="color:#388e3c;font-weight:bold;">Download PDF</a>
              </div>
              <div v-else class="mt-3 red--text">PDF not found.</div>
            </div>
          </v-form>
        </v-card>
      </template>
      <template v-else>
        <v-btn color="primary" class="mb-4" block @click="handleLogout" height="64" style="font-size:1.25rem;font-weight:bold;">Logout</v-btn>
        <v-btn color="success" class="mb-4" block @click="openAddProduct" height="64" style="font-size:1.25rem;font-weight:bold;">Add Product</v-btn>
        <v-btn color="info" class="mb-4" block @click="showEditTable = true" height="64" style="font-size:1.25rem;font-weight:bold;">Edit Products</v-btn>
        <v-btn color="secondary" class="mb-4" block @click="showSearch = true" height="64" style="font-size:1.25rem;font-weight:bold;">Search</v-btn>
      </template>
      <v-dialog v-model="dialog" max-width="500px">
        <v-card>
          <v-card-title class="px-6 mt-4">{{ isAddMode ? 'Add Product' : 'Edit Product' }}</v-card-title>
          <v-card-text>
            <v-form>
              <v-select :items="categories" v-model="selectedProduct.category" label="Category" outlined></v-select>
              <v-text-field label="Name" v-model="selectedProduct.name"></v-text-field>
              <v-text-field label="Price" v-model="selectedProduct.price" type="number"></v-text-field>
              <v-text-field label="Image URL" v-model="selectedProduct.image"></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="dialog = false">Close</v-btn>
            <v-btn color="success" text @click="saveProduct">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-container>
</template>

<style scoped>
.custom-table-grey {
  background-color: #f5f5f5 !important;
}
.custom-table-grey .v-data-table__wrapper {
  background-color: #f5f5f5 !important;
}
.custom-table-grey .v-data-table-header th {
  background-color: #e0e0e0 !important;
}
</style>
