import { defineStore } from 'pinia';
import { saveProducts, getProducts } from '@/utils/idb';
import { createClient } from '@supabase/supabase-js';
import type { Product } from '@/types/product';

const supabaseUrl = process.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing! Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diisi di file .env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as Product[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchProducts() {
      this.loading = true;
      this.error = null;
      if (navigator.onLine) {
        // Ambil hash/etag produk terakhir yang disimpan
        const lastHash = localStorage.getItem('products_hash');
        // Fetch produk dari Supabase
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
          this.error = error.message;
        } else {
          // Hitung hash sederhana dari data (bisa pakai JSON.stringify().length atau hash lain)
          const newHash = data ? JSON.stringify(data).length.toString() : '';
          if (newHash !== lastHash) {
            this.products = data || [];
            await saveProducts(this.products); // simpan ke IndexedDB
            localStorage.setItem('products_hash', newHash);
          } else {
            // Tidak ada perubahan, ambil dari IndexedDB
            this.products = await getProducts();
          }
        }
      } else {
        // Offline: fetch dari IndexedDB
        this.products = await getProducts();
      }
      this.loading = false;
    },
  },
});
