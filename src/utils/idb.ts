import { openDB } from 'idb';
import type { Product } from '@/types/product';

const DB_NAME = 'snia-pos-db';
const STORE_NAME = 'products';

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function saveProducts(products: Product[]) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const product of products) {
    // Hindari DataCloneError: pastikan plain object
    const plainProduct = JSON.parse(JSON.stringify(product));
    tx.store.put(plainProduct);
  }
  await tx.done;
}

export async function getProducts(): Promise<Product[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}
