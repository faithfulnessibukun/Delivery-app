// Seeds localStorage with demo accounts + a sample restaurant/menu on
// first load, so the app is immediately testable without signing up.
// Runs once — guarded by a flag key — and never overwrites data a real
// session has since created or changed.

const SEED_FLAG = "mock_db_seeded_v1";

const CUSTOMER_ID = "00000000-0000-4000-8000-000000000001";
const VENDOR_ID = "00000000-0000-4000-8000-000000000002";
const RIDER_ID = "00000000-0000-4000-8000-000000000003";
const RESTAURANT_ID = "00000000-0000-4000-8000-000000000010";

const MENU_ITEM_IDS = [
  "00000000-0000-4000-8000-000000000101",
  "00000000-0000-4000-8000-000000000102",
  "00000000-0000-4000-8000-000000000103",
];

export const DEMO_CREDENTIALS = {
  customer: { email: "customer@demo.com", password: "password123" },
  vendor: { email: "vendor@demo.com", password: "password123" },
  rider: { email: "rider@demo.com", password: "password123" },
};

export function seedDemoData() {
  if (localStorage.getItem(SEED_FLAG)) return;

  localStorage.setItem(
    "mock_db__auth_users",
    JSON.stringify([
      { id: CUSTOMER_ID, email: DEMO_CREDENTIALS.customer.email, password: DEMO_CREDENTIALS.customer.password },
      { id: VENDOR_ID, email: DEMO_CREDENTIALS.vendor.email, password: DEMO_CREDENTIALS.vendor.password },
      { id: RIDER_ID, email: DEMO_CREDENTIALS.rider.email, password: DEMO_CREDENTIALS.rider.password },
    ])
  );

  localStorage.setItem(
    "mock_db_users",
    JSON.stringify([
      { id: CUSTOMER_ID, full_name: "Demo Customer", email: DEMO_CREDENTIALS.customer.email, phone: "555-0100", role: "customer" },
      { id: VENDOR_ID, full_name: "Demo Vendor", email: DEMO_CREDENTIALS.vendor.email, phone: "555-0200", role: "vendor" },
      { id: RIDER_ID, full_name: "Demo Rider", email: DEMO_CREDENTIALS.rider.email, phone: "555-0300", role: "rider" },
    ])
  );

  localStorage.setItem(
    "mock_db_customers",
    JSON.stringify([{ customer_id: CUSTOMER_ID, lat: null, lng: null }])
  );

  localStorage.setItem(
    "mock_db_vendors",
    JSON.stringify([{ vendor_id: VENDOR_ID, business_name: "Demo Kitchen" }])
  );

  localStorage.setItem(
    "mock_db_riders",
    JSON.stringify([
      { rider_id: RIDER_ID, license_number: "DL-12345", vehicle_type: "Motorcycle", vehicle_plate: "ABC-123" },
    ])
  );

  localStorage.setItem(
    "mock_db_restaurants",
    JSON.stringify([
      {
        restaurant_id: RESTAURANT_ID,
        vendor_id: VENDOR_ID,
        name: "Demo Kitchen",
        address_line: "123 Market Street, Demo City",
        logo_url: null,
      },
    ])
  );

  localStorage.setItem(
    "mock_db_categories",
    JSON.stringify([
      { category_id: "cat-1", restaurant_id: RESTAURANT_ID, name: "Mains" },
      { category_id: "cat-2", restaurant_id: RESTAURANT_ID, name: "Drinks" },
    ])
  );

  localStorage.setItem(
    "mock_db_menu_items",
    JSON.stringify([
      {
        menu_item_id: MENU_ITEM_IDS[0],
        restaurant_id: RESTAURANT_ID,
        name: "Jollof Rice & Chicken",
        category: "Mains",
        price: 12.5,
        description: "Smoky party jollof rice with grilled chicken.",
        image_url: null,
        is_available: true,
      },
      {
        menu_item_id: MENU_ITEM_IDS[1],
        restaurant_id: RESTAURANT_ID,
        name: "Suya Wrap",
        category: "Mains",
        price: 9.0,
        description: "Spicy grilled beef wrap with onions and pepper.",
        image_url: null,
        is_available: true,
      },
      {
        menu_item_id: MENU_ITEM_IDS[2],
        restaurant_id: RESTAURANT_ID,
        name: "Chapman",
        category: "Drinks",
        price: 4.0,
        description: "Classic Nigerian fruit cocktail.",
        image_url: null,
        is_available: true,
      },
    ])
  );

  localStorage.setItem("mock_db_cart_items", JSON.stringify([]));
  localStorage.setItem("mock_db_orders", JSON.stringify([]));
  localStorage.setItem("mock_db_order_items", JSON.stringify([]));
  localStorage.setItem("mock_db_courier_orders", JSON.stringify([]));
  localStorage.setItem("mock_db_user_settings", JSON.stringify([]));

  localStorage.setItem(SEED_FLAG, "1");
}
