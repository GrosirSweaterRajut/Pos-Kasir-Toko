let products = JSON.parse(localStorage.getItem('pos_products')) || [];
let cart = [];
let transactions = JSON.parse(localStorage.getItem('pos_transactions')) || [];
let currentTab = 'aktif';
let storeInfo = JSON.parse(localStorage.getItem('pos_store')) || {
    nama: "GROSIR BAJU RAJUT", alamat: "jln inspeksi citarum", hp: "08886225629", pajak: 10, kertas: "58mm", footer: "Terima kasih atas kunjungan Anda!"
};

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons(); loadStoreInfo(); renderProducts(); renderSaleProducts(); updateDashboardMetrics(); switchPage('home');
});

function switchPage(pageId) {
    const pages = ['home', 'penjualan', 'produk', 'infotoko'];
    pages.forEach(p => {
        document.getElementById(`page-${p}`).classList.toggle('hidden', p!== pageId);
        document.getElementById(`nav-${p}`).className = p === pageId? "flex flex-col items-center p-1 text-gray-700 font-bold bg-gray-100 px-4 py-1.5 rounded-xl" : "flex flex-col items-center p-1 text-slate-400";
    });
    lucide.createIcons();
}

function openModal() { document.getElementById('product-modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('product-modal').classList.add('hidden'); document.getElementById('product-form').reset(); }

function saveProduct(e) {
    e.preventDefault();
    products.push({ id: Date.now(), name: document.getElementById('prod-name').value, price: parseInt(document.getElementById('prod-price').value), stock: parseInt(document.getElementById('prod-stock').value), status: 'aktif' });
    localStorage.setItem('pos_products', JSON.stringify(products)); closeModal(); renderProducts(); renderSaleProducts();
}

function switchProductTab(tab) {
    currentTab = tab;
    document.getElementById('btn-tab-aktif').className = tab === 'aktif'? "flex-1 py-2 text-center text-sm font-medium rounded-md bg-gray-700 text-white" : "flex-1 py-2 text-center text-sm font-medium rounded-md text-gray-700";
    document.getElementById('btn-tab-arsip').className = tab === 'arsip'? "flex-1 py-2 text-center text-sm font-medium rounded-md bg-gray-700 text-white" : "flex-1 py-2 text-center text-sm font-medium rounded-md text-gray-700";
    renderProducts();
}

function renderProducts() {
    const container = document.getElementById('product-container');
    const searchVal = document.getElementById('product-search').value.toLowerCase();
    let filterData = products.filter(p => p.status === currentTab && p.name.toLowerCase().includes(searchVal));
    container.innerHTML = filterData.length === 0? `<p class="text-slate-400 text-center text-xs py-8">Tidak ada produk</p>` : '';
    filterData.forEach(p => {
        container.innerHTML += `<div class="bg-white p-4 rounded-2xl border flex justify-between"><div><h4 class="font-bold text-sm">${p.name}</h4><p class="text-gray-600 font-extrabold text-xs">Rp ${p.price.toLocaleString('id-ID')}</p><span class="text-[10px] bg-slate-100 px-2 py-0.5 rounded-sm">Stok: ${p.stock}</span></div><button onclick="toggleArchive(${p.id})" class="text-xs ${currentTab === 'aktif'? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'} px-3 py-1.5 rounded-xl font-bold">${currentTab === 'aktif'? 'Arsipkan' : 'Aktifkan'}</button></div>`;
    });
}

function toggleArchive(id) { const idx = products.findIndex(p => p.id === id); if (idx!== -1) { products[idx].status = products[idx].status === 'aktif'? 'arsip' : 'aktif'; localStorage.setItem('pos_products', JSON.stringify(products)); renderProducts(); renderSaleProducts(); } }

function renderSaleProducts() {
    const container = document.getElementById('sale-product-list');
    const searchVal = document.getElementById('sale-search').value.toLowerCase();
    let filterData = products.filter(p => p.status === 'aktif' && p.name.toLowerCase().includes(searchVal));
    container.innerHTML = '';
    filterData.forEach(p => { container.innerHTML += `<div onclick="addToCart(${p.id})" class="bg-white p-3 rounded-xl border flex justify-between cursor-pointer"><div><h4 class="font-bold text-xs">${p.name}</h4><p class="text-gray-600 font-black text-xs">Rp ${p.price.toLocaleString('id-ID')}</p><span class="text-[9px] text-slate-400">Stok: ${p.stock}</span></div><span class="text-gray-600 font-bold text-xs bg-gray-100 px-2 py-1 rounded-lg">+ Pilih</span></div>`; });
    updateCartUI();
}

function addToCart(id) { const product = products.find(p => p.id === id); if (!product || product.stock <= 0) return alert('Stok habis!'); const cartItem = cart.find(item => item.id === id); if (cartItem) { if (cartItem.qty >= product.stock) return alert('Stok maksimum!'); cartItem.qty++; } else { cart.push({...product, qty: 1 }); } updateCartUI(); }
function changeQty(id, delta) { const cartItem = cart.find(item => item.id === id); const product = products.find(p => p.id === id); if (!cartItem) return; cartItem.qty += delta; if (cartItem.qty > product.stock) { alert('Stok tidak cukup'); cartItem.qty = product.stock; } if (cartItem.qty <= 0) cart = cart.filter(item => item.id!== id); updateCartUI(); }
function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    if (cart.length === 0) { container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Keranjang kosong.</p>'; } else { container.innerHTML = ''; }
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.qty;
        container.innerHTML += `<div class="flex justify-between items-center py-2 text-xs"><div><p class="font-bold">${item.name}</p><p class="text-[10px] text-slate-400">Rp ${item.price.toLocaleString('id-ID')} x ${item.qty}</p></div><div class="flex items-center gap-2"><button onclick="changeQty(${item.id}, -1)" class="w-6 h-6 bg-slate-100 rounded-md font-bold">-</button><span class="font-bold">${item.qty}</span><button onclick="changeQty(${item.id}, 1)" class="w-6 h-6 bg-slate-100 rounded-md font-bold">+</button></div></div>`;
    });
    const taxValue = Math.round(subtotal * (storeInfo.pajak / 100)); const total = subtotal + taxValue;
    document.getElementById('cart-subtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('cart-tax').innerText = `Rp ${taxValue.toLocaleString('id-ID')}`;
    document.getElementById('cart-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

function clearCart() { cart = []; updateCartUI(); }
function checkoutTransaction() {
    if (cart.length === 0) return alert('Keranjang kosong!');
    cart.forEach(item => { const prod = products.find(p => p.id === item.id); if (prod) prod.stock -= item.qty; });
    localStorage.setItem('pos_products', JSON.stringify(products));
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxValue = Math.round(subtotal * (storeInfo.pajak / 100)); const total = subtotal + taxValue; const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    transactions.push({ id: Date.now(), total, totalQty, date: new Date().toLocaleDateString('id-ID') });
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));
    showReceipt(subtotal, taxValue, total); cart = []; updateCartUI(); renderProducts(); renderSaleProducts(); updateDashboardMetrics();
}

function showReceipt(subtotal, tax, total) {
    document.getElementById('rec-store-name').innerText = storeInfo.nama;
    document.getElementById('rec-store-address').innerText = storeInfo.alamat;
    document.getElementById('rec-customer').innerText = document.getElementById('cart-customer').value || "Umum";
    document.getElementById('rec-time').innerText = new Date().toLocaleString('id-ID');
    document.getElementById('rec-footer').innerText = storeInfo.footer;
    const itemsContainer = document.getElementById('rec-items'); itemsContainer.innerHTML = '';
    cart.forEach(item => { itemsContainer.innerHTML += `<div class="flex justify-between"><span>${item.name} x${item.qty}</span><span>Rp ${(item.price * item.qty).toLocaleString('id-ID')}</span></div>`; });
    document.getElementById('rec-subtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('rec-tax').innerText = `Rp ${tax.toLocaleString('id-ID')}`;
    document.getElementById('rec-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('receipt-modal').classList.remove('hidden');
}

function updateDashboardMetrics() {
    let totalOmset = transactions.reduce((sum, t) => sum + t.total, 0); let totalTerjual = transactions.reduce((sum, t) => sum + t.totalQty, 0);
    document.getElementById('dash-omset').innerText = `Rp ${totalOmset.toLocaleString('id-ID')}`;
    document.getElementById('dash-transaksi').innerText = transactions.length;
    document.getElementById('dash-terjual').innerText = totalTerjual;
}

function syncStoreInfo() {
    storeInfo.nama = document.getElementById('inp-nama-toko').value; storeInfo.alamat = document.getElementById('inp-alamat-toko').value; storeInfo.hp = document.getElementById('inp-hp-toko').value; storeInfo.pajak = parseInt(document.getElementById('inp-pajak-toko').value); storeInfo.kertas = document.getElementById('inp-kertas-toko').value; storeInfo.footer = document.getElementById('inp-footer-toko').value;
    document.getElementById('lbl-nama-toko').innerText = storeInfo.nama; document.getElementById('lbl-alamat-toko').innerText = storeInfo.alamat; document.getElementById('dash-nama-toko').innerText = storeInfo.nama;
}
function saveStoreInfo() { localStorage.setItem('pos_store', JSON.stringify(storeInfo)); alert('Info Toko berhasil disimpan!'); }
function loadStoreInfo() {
    const saved = JSON.parse(localStorage.getItem('pos_store')); if (saved) { storeInfo = saved; document.getElementById('inp-nama-toko').value = saved.nama; document.getElementById('inp-alamat-toko').value = saved.alamat; document.getElementById('inp-hp-toko').value = saved.hp; document.getElementById('inp-pajak-toko').value = saved.pajak; document.getElementById('inp-kertas-toko').value = saved.kertas; document.getElementById('inp-footer-toko').value = saved.footer; syncStoreInfo(); }
    const savedLogo = localStorage.getItem('pos_store_logo'); if (savedLogo) { document.getElementById('logo-img').src = savedLogo; document.getElementById('logo-img').classList.remove('hidden'); document.getElementById('logo-placeholder').classList.add('hidden'); }
}
function handleLogoUpload(e) { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = function(event) { localStorage.setItem('pos_store_logo', event.target.result); loadStoreInfo(); }; reader.readAsDataURL(file); } }
function removeLogo() { localStorage.removeItem('pos_store_logo'); document.getElementById('logo-img').classList.add('hidden'); document.getElementById('logo-placeholder').classList.remove('hidden'); }
