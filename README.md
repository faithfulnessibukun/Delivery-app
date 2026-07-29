# NewAge

A food delivery web app with two experiences in one codebase: a **customer** side (browse restaurants, order food, book a package rider, track orders) and a **vendor** side (manage menu, categories, orders from a dashboard).

Built with React, React Router, Tailwind CSS, and Vite. There is no backend — all data (users, menus, cart, orders) lives in the browser's `localStorage`, so it's a fully client-side demo/prototype.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
npm run lint      # run ESLint
```

## Accounts

Registration and login are self-contained — no external auth provider. On first load, a seed vendor account is created automatically:

- **Email:** `moyo@gmail.com`
- **Password:** `admin123`

"Logged in" simply means `currentUser` exists in `localStorage`. There's no expiry — once logged in, you stay logged in until you log out (Account page → Log out), which just clears that key. Landing on `/` with no `currentUser` opens straight into the Register tab; landing on `/` while already logged in redirects you straight past the login screen.

## Routes

| Path | Page | Audience |
|---|---|---|
| `/` | Login / Register | Public |
| `/customer-home` | Home feed — search, video hero with embedded services, categories, restaurants, rider booking | Customer |
| `/restaurant/:vendorId` | Restaurant menu — quick add-to-cart with quantity per item | Customer |
| `/restaurant/:vendorId/menu/:itemId` | Menu item detail — add-ons, quantity, add to cart | Customer |
| `/cart` | Legacy link — opens the cart drawer and lands on the home feed | Customer |
| `/orders` | Placed order history | Customer |
| `/account` | Account info + logout | Customer |
| `/dashboard` | Vendor dashboard | Vendor |
| `/menu` | Vendor menu & category management | Vendor |
| `/vendor-image-upload` | Restaurant profile picture upload | Vendor |
| `*` (any other path) | 404 page | Public |

Customer-facing pages share a fixed bottom tab bar (`src/components/CustomerNav.jsx`: Home / Orders / Account). Vendor pages share a sidebar (`src/components/Sidebar.jsx`). The cart itself is a slide-in drawer (`src/components/CartDrawer.jsx`) that can be opened from any customer page via the cart icon — its open/closed state and contents live in `src/context/CartContext.jsx` so every page can reach it the same way.

## Data model (localStorage keys)

- `users` — all registered accounts (`{ id, fullName, email, phone, password, role, restaurantName, restaurantAddress }`), `role` is `"customer"` or `"vendor"`
- `currentUser` — the logged-in user object; its presence *is* the login state
- `menus` — vendor menu items, each carrying its own `restaurantName`/`restaurantAddress`/`category`/`image` so restaurant listings can be derived from the menu list
- `useMockData` — `"true"`/`"false"`, toggles customer pages between real `menus` and a small built-in sample dataset (`src/data/mockMenus.js`) for demoing
- `cart` — items added from the menu list or item detail page (`{ vendorId, itemId, name, price, quantity, restaurantName, addOns, addedAt }`); `addOns` is a list of `{ name, price }` picked on the detail page (see `src/data/addOns.js`)
- `orders` — placed orders (`{ id, items, total, status, placedAt, customerName }`), created from the cart drawer's "Place Order" (no payment integration)
- `categories` — vendor-defined menu categories

Notifications use `react-hot-toast` (mounted globally in `src/App.jsx`) instead of native `alert()`.

## Project structure

```
src/
  pages/                  Route-level screens (customer + vendor)
  pages/Authentication/   Login.jsx (combined login/register)
  components/             Shared UI: nav bars, forms, upload widgets, cart drawer
  context/                CartContext.jsx — shared cart state + drawer open/close
  data/                   Sample data: mockMenus.js, addOns.js
  assets/                 Video/image assets
```
