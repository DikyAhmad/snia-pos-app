import { defineStore } from 'pinia';
import { saveProducts, getProducts } from '@/utils/idb';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/product';

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
        // Get the last saved hash/etag of products
        const lastHash = localStorage.getItem('products_hash');
        // Fetch products from Supabase
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
          this.error = error.message;
        } else {
          // Calculate simple hash from data (can use JSON.stringify().length or other hash)
          const newHash = data ? JSON.stringify(data).length.toString() : '';
          if (newHash !== lastHash) {
            this.products = data || [];
            await saveProducts(this.products); // save to IndexedDB
            localStorage.setItem('products_hash', newHash);
          } else {
            // No changes, fetch from IndexedDB
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
