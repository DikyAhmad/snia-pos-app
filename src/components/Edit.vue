<template>
  <v-container class="py-8">
    <v-row align="center" class="mx-auto" justify="space-between">
  <v-row cols="6" class="">
    <v-col cols="7" lg="6" class="d-flex justify-center">
      <v-btn color="success"  @click="openAddProduct">Add Product</v-btn>
    </v-col>
    <v-col cols="4" lg="5" class="d-flex justify-center ms-4">
      <v-btn color="primary" @click="handleLogout">Logout</v-btn>
    </v-col>
  </v-row>
</v-row>
    <v-row class="d-flex justify-center mx-auto">
      <v-col cols="12" lg="8">
        <div style="max-height: calc(130vh - 300px); overflow-y:auto;">
          <v-data-table
            :headers="headers"
            :items="products"
            :loading="loading"
            class="elevation-2 custom-table-grey"
            loading-text="Memuat data produk..."
            no-data-text="Tidak ada produk ditemukan"
            item-value="id"
            hide-default-footer
            fixed-header
            height="500"
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

          <v-dialog v-model="dialog" max-width="500px">
            <v-card>
              <v-card-title class="px-6 mt-4">{{ isAddMode ? 'Add Product' : 'Edit Produk' }}</v-card-title>
              <v-card-text>
                <v-form>
                  <v-select :items="categories" v-model="selectedProduct.category" label="Kategori" outlined></v-select>
                  <v-text-field label="Nama" v-model="selectedProduct.name"></v-text-field>
                  <v-text-field label="Harga" v-model="selectedProduct.price" type="number"></v-text-field>
                  <v-text-field label="Image URL" v-model="selectedProduct.image"></v-text-field>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="dialog = false">Tutup</v-btn>
                <v-btn color="success" text @click="saveProduct">Save</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const products = ref<any[]>([])
const loading = ref(false)

const dialog = ref(false)
const selectedProduct = ref<any>({})

const categories = [
  'Album',
  'Bingkai',
  'Cetak Foto Glossy',
  'Cetak Foto Silky'
]

const headers = [
  { title: 'Nama Produk', value: 'displayName' },
  { title: 'Harga', value: 'price' }
]

const fetchProducts = async () => {
  loading.value = true
  const { data, error } = await supabase.from('products').select('id, name, price, category')
  if (!error && data) {
    // Tambahkan displayName untuk tampilan tabel, data asli tetap dipertahankan
    products.value = data
      .sort((a: any, b: any) => (a.category > b.category ? 1 : a.category < b.category ? -1 : 0))
      .map((item: any) => ({
        ...item,
        displayName: `${item.category} ${item.name}`.trim()
      }))
  }
  loading.value = false
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

onMounted(fetchProducts)

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}

const isAddMode = ref(false)
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


const saveProduct = async () => {
  // ADD PRODUCT
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
      console.error('SUPABASE ERROR:', error);
      alert('Gagal menambah produk!\n' + (error.message || ''));
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
    console.error('SUPABASE ERROR:', error);
    alert('Gagal menyimpan perubahan produk!\n' + (error.message || ''));
  }
};

</script>

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
