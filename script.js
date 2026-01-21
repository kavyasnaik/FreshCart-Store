/* ============================================================
PRODUCT DATA (From uploaded products.json)
============================================================ */
const products = [
  { id: 0, name: "Apples", price: 120, img: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=600&q=80", unit: "kg", type: "Fruit", tags: ["fruit"] },
  { id: 1, name: "Bananas", price: 50, img: "https://nutritionsource.hsph.harvard.edu/wp-content/uploads/2018/08/bananas-1354785_1920-1024x683.jpg", unit: "dozen", type: "Fruit", tags: ["fruit"] },
  { id: 2, name: "Grapes", price: 90, img: "https://www.aishcart.in/6098/sweet-green-grapes-box-5kg.jpg", unit: "500 g", type: "Fruit", tags: ["fruit"] },
  { id: 3, name: "Oranges", price: 80, img: "https://www.dole.com/sites/default/files/media/2025-01/oranges.png", unit: "kg", type: "Fruit", tags: ["fruit"] },
  { id: 4, name: "Tomatoes", price: 40, img: "https://img.etimg.com/thumb/msid-95423731,width-650,height-488,imgsize-56196,resizemode-75/tomatoes-canva.jpg", unit: "kg", type: "Vegetable", tags: ["vegetable"] },
  { id: 5, name: "Potatoes", price: 35, img: "https://images.apollo247.in/pd-cms/cms/2025-05/AdobeStock_1291706602_Preview.webp", unit: "kg", type: "Vegetable", tags: ["vegetable"] },
  { id: 6, name: "Carrots", price: 60, img: "https://bcfresh.ca/wp-content/uploads/2021/11/Carrots.jpg", unit: "kg", type: "Vegetable", tags: ["vegetable"] },
  { id: 7, name: "Spinach", price: 30, img: "https://gogarden.co.in/cdn/shop/files/spinach-seed.jpg?v=1741857888", unit: "bunch", type: "Vegetable", tags: ["vegetable"] }
];

/* ============================================================
STATE & INITIALIZATION
============================================================ */
let cart = JSON.parse(localStorage.getItem("freshcart_cart")) || [];
let quantities = JSON.parse(localStorage.getItem("freshcart_quantities")) || {};
let currentFilter = "all";

products.forEach(p => {
  if (quantities[p.id] === undefined) quantities[p.id] = 0;
});

document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  updateCartDisplay();
  setupCartToggle();
  setupFeedbackForm();
});

/* ============================================================
PRODUCT RENDERING & CART
============================================================ */
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  grid.innerHTML = products
    .filter(p => currentFilter === "all" || p.tags.includes(currentFilter))
    .map(p => `
      <div class="product-card">
        <div class="product-image">
          <img src="${p.img}" alt="${p.name}">
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <div class="product-tag">${p.type}</div>
          <div class="price-row">
            <span class="price">₹${p.price}</span>
            <span class="unit">/${p.unit}</span>
          </div>
          <div class="qty-row">
            <span class="qty-label">Qty:</span>
            <div class="qty-controls">
              <button class="qty-btn" onclick="changeQty(${p.id}, -1)">−</button>
              <span class="qty-display">${quantities[p.id]}</span>
              <button class="qty-btn" onclick="changeQty(${p.id}, 1)">+</button>
            </div>
          </div>
        </div>
      </div>
    `).join("");
}

function changeQty(id, delta) {
  let item = cart.find(i => i.id === id);
  let newQty = Math.max(0, (item?.qty || 0) + delta);

  if (newQty === 0) cart = cart.filter(i => i.id !== id);
  else if (item) item.qty = newQty;
  else cart.push({ ...products.find(p => p.id === id), qty: newQty });

  quantities[id] = newQty;
  saveAndSync();
}

function saveAndSync() {
  localStorage.setItem("freshcart_cart", JSON.stringify(cart));
  localStorage.setItem("freshcart_quantities", JSON.stringify(quantities));
  updateCartDisplay();
  renderProducts();
}

function updateCartDisplay() {
  const countEl = document.getElementById("cartCount");
  const itemsEl = document.getElementById("orderItems");
  const totalEl = document.getElementById("orderTotal");

  let totalQty = 0, totalPrice = 0;
  cart.forEach(item => {
    totalQty += item.qty;
    totalPrice += item.qty * item.price;
  });

  if (countEl) countEl.textContent = totalQty;
  if (itemsEl) itemsEl.textContent = totalQty;
  if (totalEl) totalEl.textContent = `₹${totalPrice}`;
}

/* ============================================================
CART UI
============================================================ */
function setupCartToggle() {
  document.getElementById("cartIcon")?.addEventListener("click", openCartModal);
}

function openCartModal() {
  const list = document.getElementById("cartList");
  const total = document.getElementById("cartModalTotal");

  list.innerHTML = cart.length === 0
    ? "<li>Your cart is empty</li>"
    : cart.map(i => `<li>${i.name} x${i.qty} - ₹${i.qty * i.price}</li>`).join("");

  total.textContent = `₹${cart.reduce((s, i) => s + i.qty * i.price, 0)}`;
  document.getElementById("cartModal").style.display = "flex";
}

function closeCartModal() {
  document.getElementById("cartModal").style.display = "none";
}

/* ============================================================
ORDER FLOW
============================================================ */
function confirmOrder() {
  if (!cart.length) {
    alert("Your cart is empty");
    return;
  }
  closeCartModal();
  document.getElementById("orderConfirmModal").style.display = "flex";
}

function closeOrderConfirmModal() {
  document.getElementById("orderConfirmModal").style.display = "none";
}

function finalizeOrder() {
  document.getElementById("orderConfirmModal").style.display = "none";
  alert("Order placed successfully!");
  cart = [];
  quantities = {};
  saveAndSync();
  document.getElementById("feedbackModal").style.display = "flex";
}

/* ============================================================
FEEDBACK → GOOGLE SHEETS
============================================================ */
function setupFeedbackForm() {
  const form = document.getElementById("feedbackForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("feedbackEmail").value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email");
      return;
    }

    const phone = document.getElementById("feedbackPhone").value.trim();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      alert("Please enter a valid phone number");
      return;
    }

    const data = {
      timestamp: new Date().toLocaleString("en-IN"),
      email: email,
      phone: phone,
      productRating: document.getElementById("productRating").value,
      deliveryRating: document.getElementById("deliveryRating").value,
      source: document.getElementById("feedbackSource").value,
      comments: document.getElementById("feedbackMessage").value
    };

    const SCRIPT_URL =
            "https://script.google.com/macros/s/AKfycbzCC-xdh2-hdeGgD34-6EvD_LmZd5edsHchlufo7YFKf7V6I6YEct17Vsryitp5aQ8Erw/exec"
    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    alert("Thank you for your feedback ❤️");
    form.reset();
    document.getElementById("feedbackModal").style.display = "none";
  });
}

/* ============================================================
EXIT TAB → GO BACK TO HOME
============================================================ */
function exitTab() {
  document.getElementById("feedbackModal").style.display = "none";
  document.getElementById("home").scrollIntoView({ behavior: "smooth" });
}
