document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    fetchBillboards(); // 🖼️ বিলবোর্ড কল করার ফাংশন
    if (document.getElementById('products-container')) { fetchProducts(); }
});

const dbURL = "https://bustan-seeds-and-plants-default-rtdb.firebaseio.com/products.json";
const authURL = "https://bustan-seeds-and-plants-default-rtdb.firebaseio.com/adminSettings.json";
const catURL = "https://bustan-seeds-and-plants-default-rtdb.firebaseio.com/categories.json"; 
const orderURL = "https://bustan-seeds-and-plants-default-rtdb.firebaseio.com/categoryOrder.json";
const billboardAPI = "https://bustan-seeds-and-plants-default-rtdb.firebaseio.com/billboards.json";

let cart = JSON.parse(localStorage.getItem('bustan_cart')) || [];
let allProductsData = {}; 
let selectedVariantsGlobal = {}; 
let selectedSizesGlobal = {};
let activeCategories = []; 
let visibleCategoryCount = 7;

/* --- 🖼️ BILLBOARD SLIDER FUNCTION --- */
let currentSlide = 0;
let slideInterval;
let totalSlides = 0;

async function fetchBillboards() {
    try {
        const res = await fetch(billboardAPI);
        const data = await res.json();
        const container = document.getElementById('billboard-container');
        const wrapper = document.getElementById('slider-wrapper');
        const dotsContainer = document.getElementById('slider-dots');

        if (!container || !wrapper || !data || Object.keys(data).length === 0) {
            if (container) container.style.display = 'none';
            return;
        }

        const billboards = Object.keys(data).map(key => data[key]).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        totalSlides = billboards.length;

        let slidesHTML = "";
        let dotsHTML = "";

        billboards.forEach((bb, index) => {
            const mediaSrc = bb.mediaUrl || bb.imageUrl;
            const isVideo = bb.mediaType === 'video' || (mediaSrc && mediaSrc.includes('data:video'));
            
            slidesHTML += `
                <div class="slide">
                    ${isVideo ? `<video src="${mediaSrc}" autoplay muted loop playsinline></video>` : `<img src="${mediaSrc}" alt="Billboard">`}
                </div>
            `;
            dotsHTML += `<div class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`;
        });

        wrapper.innerHTML = slidesHTML;
        if(dotsContainer) dotsContainer.innerHTML = dotsHTML;
        container.style.display = 'block';

        if (totalSlides > 1) {
            startSlider();
        }
    } catch (e) { console.error("Slider Load Error:", e); }
}

function startSlider() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSliderPosition();
    }, 4000);
}

function goToSlide(index) {
    currentSlide = index;
    updateSliderPosition();
    startSlider(); 
}

function updateSliderPosition() {
    const wrapper = document.getElementById('slider-wrapper');
    const dots = document.querySelectorAll('.dot');
    if(wrapper) wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}
/* ------------------------------------- */

function saveCartToStorage() { localStorage.setItem('bustan_cart', JSON.stringify(cart)); }

function toggleCart() {
    const sidebarIndex = document.getElementById('cart-sidebar');
    const sidebarProduct = document.getElementById('cartSidebar');
    if (sidebarIndex) sidebarIndex.classList.toggle('open');
    if (sidebarProduct) sidebarProduct.classList.toggle('open');
}

function toggleShopsSidebar() {
    const shopsSidebar = document.getElementById('shops-sidebar');
    if (shopsSidebar) shopsSidebar.classList.toggle('open');
}

function updateCartUI() {
    const countIndex = document.getElementById('cart-count');
    const countProduct = document.getElementById('cartCount');
    if (countIndex) countIndex.innerText = cart.length;
    if (countProduct) countProduct.innerText = cart.length;

    let total = 0, itemsHTML = "";
    cart.forEach((item, index) => {
        total += item.price;
        itemsHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${item.image || 'logo.JPG'}" style="width:38px; height:38px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1;">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small>৳${item.price} ${item.variant && item.variant !== 'Standard' ? '| ' + item.variant : ''} ${item.size ? '| ' + item.size : ''}</small>
                    </div>
                </div>
                <span onclick="removeCartItem(${index})" style="color:red; cursor:pointer; font-weight:bold; font-size:18px;">×</span>
            </div>`;
    });

    const listIndex = document.getElementById('cart-items-container');
    const totalIndex = document.getElementById('cart-total-price');
    if (listIndex) listIndex.innerHTML = itemsHTML || "<p style='text-align:center;'>কার্ট খালি!</p>";
    if (totalIndex) totalIndex.innerText = total;

    const listProduct = document.getElementById('cartItemsList');
    const totalProduct = document.getElementById('cartTotalAmount');
    if (listProduct) listProduct.innerHTML = itemsHTML || "<p style='text-align:center;'>কার্ট খালি!</p>";
    if (totalProduct) totalProduct.innerText = total;
}

function removeCartItem(index) { cart.splice(index, 1); saveCartToStorage(); updateCartUI(); }

function addToCart(id, name, price, image = "") {
    let cleanPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : parseFloat(price);
    let variant = selectedVariantsGlobal[id] || "Standard";
    let size = selectedSizesGlobal[id] || "";
    if (!image && allProductsData[id]) image = allProductsData[id].mainImage || "";
    cart.push({ id, name, price: cleanPrice, variant, size, image });
    saveCartToStorage(); alert(`🛒 "${name}" কার্টে যোগ করা হয়েছে!`); updateCartUI();
}

function buyNow(id, name, price, image = "") {
    let cleanPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : parseFloat(price);
    let variant = selectedVariantsGlobal[id] || "Standard";
    let size = selectedSizesGlobal[id] || "";
    if (!image && allProductsData[id]) image = allProductsData[id].mainImage || "";
    cart = [{ id, name, price: cleanPrice, variant, size, image }];
    saveCartToStorage(); updateCartUI(); openOrderModal();
}

function openOrderModal() {
    if (cart.length === 0) return alert("আপনার কার্টটি খালি!");
    const modalIndex = document.getElementById('order-modal');
    if (modalIndex) modalIndex.style.display = 'flex';
}
function closeOrderModal() { document.getElementById('order-modal').style.display = 'none'; }

function sendOrderToWhatsApp() {
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const address = document.getElementById('customer-address').value;
    const deliveryCharge = parseFloat(document.getElementById('delivery-charge-select').value);
    const deliveryText = (deliveryCharge === 80) ? "ঢাকার ভেতরে (৳৮০)" : "ঢাকার বাইরে (৳১৫০)";

    if (!name || !phone || !address) return alert("সম্পূর্ণ তথ্য দিন!");

    let subtotal = 0;
    
    let message = `*📦 নতুন অর্ডার (MAAN Seeds & Plants)*\n👤 *নাম:* ${name}\n📞 *মোবাইল:* ${phone}\n🏠 *ঠিকানা:* ${address}\n🚚 *ডেলিভারি:* ${deliveryText}\n\n🛍️ *প্রোডাক্টসমূহ:*\n`;
    
    cart.forEach((item, index) => {
        message += `\n${index + 1}. *${item.name}*\n   - দাম: ৳${item.price}\n`;
        if (item.variant && item.variant !== 'Standard') message += `   - প্যাকেজ: ${item.variant}\n`;
        if (item.size) message += `   - ওজন: ${item.size}\n`;
        subtotal += item.price;
    });

    message += `\n💰 *ডেলিভারি সহ মোট:* ৳${subtotal + deliveryCharge}`;
    window.open(`https://wa.me/8801922790663?text=${encodeURIComponent(message)}`, '_blank');
    cart = []; saveCartToStorage(); updateCartUI(); closeOrderModal();
}

function getCategoryIcon(catName) {
    const name = catName.toLowerCase();
    if (name.includes('seed') || name.includes('বীজ')) return 'fas fa-seedling';
    if (name.includes('plant') || name.includes('গাছ') || name.includes('চারা')) return 'fas fa-leaf';
    if (name.includes('flower') || name.includes('ফুল')) return 'fas fa-fan'; 
    if (name.includes('fruit') || name.includes('ফল')) return 'fas fa-apple-alt';
    if (name.includes('veg') || name.includes('সবজী') || name.includes('সবজি')) return 'fas fa-carrot';
    if (name.includes('decor') || name.includes('সাজসজ্জা')) return 'fas fa-home';
    if (name.includes('tool') || name.includes('সরঞ্জাম')) return 'fas fa-tools';
    return 'fas fa-tag';
}

function renderDynamicCategoryTabs() {
    const swipeContainer = document.getElementById('swipeCategoryBar');
    if (!swipeContainer) return;

    let html = `<a href="javascript:void(0)" class="cat-icon-item active" onclick="switchCategory('All', this)"><i class="fas fa-layer-group"></i><span>সব দেখুন</span></a>`;

    activeCategories.forEach(category => {
        const safeCat = category.replace(/'/g, "\\'");
        html += `<a href="javascript:void(0)" class="cat-icon-item" onclick="switchCategory('${safeCat}', this)"><i class="${getCategoryIcon(category)}"></i><span>${category}</span></a>`;
    });
    swipeContainer.innerHTML = html;
}

async function fetchProducts() {
    try {
        const [prodRes, orderRes] = await Promise.all([fetch(dbURL), fetch(orderURL)]);
        allProductsData = await prodRes.json() || {}; 
        const savedOrder = await orderRes.json() || [];

        let foundCategories = [];
        Object.keys(allProductsData).forEach(key => {
            if (allProductsData[key].category && !foundCategories.includes(allProductsData[key].category)) foundCategories.push(allProductsData[key].category);
        });

        activeCategories = savedOrder.filter(c => foundCategories.includes(c));
        foundCategories.forEach(c => { if (!activeCategories.includes(c)) activeCategories.push(c); });

        renderDynamicCategoryTabs();
        renderCategoryWiseColumns(); 

        const urlParams = new URLSearchParams(window.location.search);
        const catFromUrl = urlParams.get('cat');
        if(catFromUrl) {
            setTimeout(() => switchCategory(catFromUrl, null, false), 100);
        }

    } catch (err) { console.error(err); }
}

function renderCategoryWiseColumns() {
    const mainGrid = document.getElementById('products-container'); 
    if (!mainGrid) return;
    mainGrid.innerHTML = ""; 

    activeCategories.slice(0, visibleCategoryCount).forEach((category) => {
        let count = 0;
        const safeId = category.replace(/[^a-zA-Z0-9]/g, '-');
        let html = `<div class="category-section" id="sec-${safeId}" data-cat-name="${category.toLowerCase()}"><div class="category-header"><div class="category-title">${category}</div><div class="see-more-link" onclick="viewFullCategory('${category}')">আরও দেখুন</div></div><div class="products-grid" id="grid-${safeId}">`;

        let prods = Object.keys(allProductsData).map(k => ({ key: k, ...allProductsData[k] })).filter(p => p.category === category).sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999));

        prods.forEach(prod => {
            count++;
            const salePrice = parseFloat(prod.price) || 0;
            const regPrice = parseFloat(prod.regularPrice) || salePrice;
            let badge = regPrice > salePrice ? `<div class="card-badges-top"><span class="badge-discount">-${Math.round(((regPrice-salePrice)/regPrice)*100)}%</span></div>` : "";
            let priceHTML = regPrice > salePrice ? `<span class="price">৳ ${salePrice}</span> <span class="old-price">৳ ${regPrice}</span>` : `<span class="price">৳ ${salePrice}</span>`;

            html += `
                <div class="product-card" data-name="${prod.name.toLowerCase()}" data-category="${category.toLowerCase()}" onclick="window.location.href='product.html?id=${prod.key}'">
                    ${badge}
                    <div class="image-wrapper"><img src="${prod.mainImage || 'logo.JPG'}"></div>
                    <div class="info-wrapper">
                        <h3 class="product-title">${prod.name}</h3>
                        <div class="card-footer-row"><div class="price-box">${priceHTML}</div></div>
                    </div>
                </div>`;
        });
        html += `</div></div>`;
        if (count > 0) mainGrid.innerHTML += html;
    });

    if (visibleCategoryCount < activeCategories.length) {
        mainGrid.innerHTML += `<div id="load-more-btn-wrap"><button class="neumorphic-load-btn" onclick="visibleCategoryCount+=7; renderCategoryWiseColumns();">Load More</button></div>`;
    }
}

function searchProducts(query) {
    query = query.trim().toLowerCase();
    if (!query) { visibleCategoryCount = 7; renderCategoryWiseColumns(); return; }
    visibleCategoryCount = activeCategories.length; renderCategoryWiseColumns();
    document.querySelectorAll('.category-section').forEach(sec => {
        let match = 0;
        sec.querySelectorAll('.product-card').forEach(card => {
            if (card.dataset.name.includes(query) || card.dataset.category.includes(query)) { card.style.display = ''; match++; } 
            else { card.style.display = 'none'; }
        });
        sec.style.display = match > 0 ? 'block' : 'none';
    });
}

function switchCategory(cat, element = null, saveHistory = true) {
    if (!element) {
        document.querySelectorAll('.cat-icon-item').forEach(el => {
            let spanText = el.querySelector('span').innerText.trim().toLowerCase();
            if (spanText === cat.toLowerCase() || (cat === 'All' && spanText === 'সব দেখুন')) {
                element = el;
            }
        });
    }

    document.querySelectorAll('.cat-icon-item').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');

    if (saveHistory) {
        let urlParams = new URLSearchParams(window.location.search);
        if (cat === 'All') {
            urlParams.delete('cat');
        } else {
            urlParams.set('cat', cat);
        }
        let newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.pushState({ category: cat }, '', newUrl);
    }

    if (cat === 'All') { 
        visibleCategoryCount = 7; 
        renderCategoryWiseColumns(); 
        return; 
    }
    
    visibleCategoryCount = activeCategories.length; 
    renderCategoryWiseColumns();
    
    document.querySelectorAll('.category-section').forEach(sec => {
        sec.style.display = sec.dataset.catName === cat.toLowerCase() ? 'block' : 'none';
    });
}

window.addEventListener('popstate', function(event) {
    if (event.state && event.state.category) {
        switchCategory(event.state.category, null, false);
    } else {
        switchCategory('All', null, false);
    }
});

function viewFullCategory(cat) { 
    switchCategory(cat, null); 
    setTimeout(() => {
        let grid = document.getElementById(`grid-${cat.replace(/[^a-zA-Z0-9]/g, '-')}`);
        if(grid) grid.classList.add('full-view');
    }, 50);
}

function goBackPage() { window.history.back(); }
function goForwardPage() { window.history.forward(); }