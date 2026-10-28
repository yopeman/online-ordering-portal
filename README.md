# Yope Order — Online Ordering Portal for Businesses

> Turn your products into orders with a fast, modern online storefront designed for businesses of all sizes.

**Yope Order** empowers business owners and merchants to launch their digital catalog, share custom storefront links with customers, take tailored orders effortlessly, and receive instant notifications.

---

## 🌟 Why Yope Order for Your Business?

- **🚀 Instant Branded Storefront:** Get a clean, fast public store link (`/store/your-business-slug`) and appear in the central marketplace with zero website-building headaches.
- **📱 Mobile-First & Multilingual:** Built for everyone. Supports **English**, **Amharic (አማርኛ)**, **Afaan Oromoo**, **Tigrinya (ትግርኛ)**, and **Afar (Qafaraf)**, with seamless mobile navigation and custom themes (Light, Dark, Night, and System).
- **📋 Tailored Order Forms:** Don't settle for rigid checkouts. Customize your order form fields (delivery addresses, special instructions, contact preferences, custom dimensions) to match exactly what your business needs.
- **⚡ Real-Time Telegram Order Alerts:** Connect your Telegram account to receive instant notifications the moment a customer submits an order—never miss a sale!
- **📸 High-Quality Product Showcase:** Upload and organize product photos, categories, descriptions, and pricing in an intuitive catalog manager.
- **📊 Activity & Order Tracking:** Review incoming orders, mark them as read/fulfilled, and trace audit activity across all your stores.

---

## 🚀 How to Get Started (for Business Owners)

### Step 1: Sign In & Claim Your Space
- Navigate to the portal and sign in with your **Google** or **Telegram** account.

### Step 2: Set Up Your Business Profile
- Head to **My Businesses** and create your store profile.
- Choose your unique **store slug** (this will be your shareable URL, e.g., `yopeorder.com/store/your-shop`).
- Add your primary contact phone numbers and business description.

### Step 3: Build Your Product Catalog
- Open the **Catalog** tab inside your business workspace.
- Add products, set pricing, assign categories, and upload high-resolution product photos.

### Step 4: Customize Your Customer Order Form
- Open the **Settings** tab to define your **Order Form Template**.
- Add the exact questions and fields you need your customers to fill out when placing an order (e.g., Delivery Location, Preferred Time, Alternative Phone).

### Step 5: Connect Telegram for Instant Alerts
- Link your Telegram chat ID in your profile settings.
- Get pinged instantly by the Yope Order Bot whenever a new customer places an order.

### Step 6: Share & Sell
- Copy your store link (`/store/[your-slug]`) or individual product links (`/products/[id]`).
- Share them across Telegram channels, WhatsApp, Instagram, TikTok, or print them on QR codes in your physical shop!

---

## 🏢 Business Management Features

| Feature | Description |
| :--- | :--- |
| **Catalog Manager** | Add, edit, organize, and showcase products with image galleries. |
| **Orders Dashboard** | View new incoming customer orders, inspect custom form answers, and mark orders as processed. |
| **Activity Feed** | Transparent history log tracking catalog modifications, business updates, and order events. |
| **Custom Settings** | Manage store details, update phone contacts, adjust order form schemas, or delete inactive businesses. |

---

## 🛠️ For Administrators & Technical Setup

If you are hosting or deploying Yope Order for your organization:

### Tech Stack
- **Framework:** Next.js (App Router, Turbopack, React 19)
- **Styling:** Tailwind CSS v4
- **Database:** MongoDB with Mongoose
- **Authentication:** Sessions via JWT (`jose`), Google OAuth, and Telegram Login
- **Media Hosting:** Cloudinary
- **Notifications:** Telegram Bot via Neogram

### Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   # Update MongoDB URI, Cloudinary keys, Google OAuth, and Telegram Bot tokens
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Seed sample data (optional):**
   ```bash
   npm run seed
   ```

---

## 📖 Specifications & Reference
- [Pages Specification](pages.md)
- [Database Schema](schema.md)
- [Agent Rules & Localization](AGENTS.md)