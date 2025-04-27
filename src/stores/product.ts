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
        // Online: fetch dari Supabase
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
          this.error = error.message;
        } else {
          this.products = data || [];
          await saveProducts(this.products); // simpan ke IndexedDB
        }
      } else {
        // Offline: fetch dari IndexedDB
        this.products = await getProducts();
      }
      this.loading = false;
    },
  },
});
