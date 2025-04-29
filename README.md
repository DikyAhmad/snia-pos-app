# SNIA POS App

A modern, responsive Point of Sale (POS) web application for photo studios, built with Vue 3, TypeScript, Pinia, Vue Router, Vuetify, and Supabase.

---

## ✨ Features

- **Product Catalog:**
  - Browse and filter a list of photo products by category
  - Add products to a shopping cart
- **Cart Management:**
  - View, update, and remove items from the cart
  - Real-time cart total calculation
- **Authentication:**
  - Login system for admin access (with Supabase)
- **Checkout & Receipt:**
  - Checkout process with payment options
  - Generate PDF receipts with QR code
- **Admin Panel:**
  - (Optional) Manage products and view sales (extendable)
- **Responsive Design:**
  - Fully mobile-friendly and desktop-ready UI with Vuetify

---

## 🛠️ Tech Stack

- **Vue 3** + **TypeScript**
- **Vuetify** (Material Design UI)
- **Pinia** (state management)
- **Vue Router** (routing)
- **Supabase** (database & authentication)
- **Vite** (build tool)
- **pnpm** (package manager)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/dikyahmad/snia-pos-app.git
cd snia-pos-app
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment
- Copy `.env.example` to `.env` and fill in your Supabase credentials.

### 4. Run the App in Development
```bash
pnpm dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

### 5. Build for Production
```bash
pnpm build
```

---

## 📦 Folder Structure

- `src/components/` — Reusable UI components (ProductList, CartView, AppHeader, etc)
- `src/pages/` — Page-level views (Homepage, Login)
- `src/stores/` — Pinia stores (cart, product, adminPanel)
- `src/lib/` — Supabase client config
- `src/router.ts` — Vue Router setup

---

## 💡 Customization & Extensibility
- Add new product categories via Supabase
- Extend the admin panel for sales analytics
- Customize the UI with Vuetify themes

---

## 🙌 Credits
Developed by [dikyahmad](https://github.com/dikyahmad)

---

## 📝 License
MIT
