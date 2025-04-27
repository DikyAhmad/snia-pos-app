<template>
  <v-container class="py-4">
    <v-row align="center">
      <v-col cols="12" lg="8" class="d-flex justify-end mx-auto">
        <v-btn color="primary" @click="handleLogout">Logout</v-btn>
      </v-col>
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
              <v-card-title class="px-6 mt-4">Edit Produk</v-card-title>
              <v-card-text>
                <v-form>
                  <v-select :items="categories" v-model="selectedProduct.category" label="Kategori" outlined></v-select>
                  <v-text-field label="Nama" v-model="selectedProduct.name"></v-text-field>
                  <v-text-field label="Harga" v-model="selectedProduct.price" type="number"></v-text-field>
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
      dialog.value = true
    }
  }
}

onMounted(fetchProducts)

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}

const saveProduct = async () => {
  if (!selectedProduct.value.id) return;
  // Pastikan price adalah number
  const updatePayload = {
    name: selectedProduct.value.name,
    price: Number(selectedProduct.value.price),
    category: selectedProduct.value.category
  };
  console.log('SAVING PRODUCT:', updatePayload);
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
