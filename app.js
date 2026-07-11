// DATABASE STATE UTAMA (LocalStorage Terintegrasi)
let products = JSON.parse(localStorage.getItem('pos_products')) || [
    { id: 1, name: 'Baju Rajut olo pikoli', price: 65000, stock: 45, status: 'aktif' },
    { id: 2, name: 'Cardigan Rajut Premium', price: 89000, stock: 20, status: 'aktif' }
];

let cart = [];
let transactions = JSON.parse(localStorage.getItem('pos_transactions')) || [];
let currentTab = 'aktif';

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    loadStoreInfo();
    renderProducts();
    renderSaleProducts();
    updateDashboardMetrics();
});

// ROUTING ANTAR HALAMAN SPA
function switchPage(pageId) {
    const pages = ['home', 'penjualan', 'menu', 'produk', 'infotoko'];
    pages.forEach(p => {
        const pageEl = document.getElementById(`page-${p}`);
        const navEl = document.getElementById(`nav-${p}`);
        if (p === pageId) {
            pageEl.classList.remove('hidden');
            navEl.className = "flex flex-col items-center p-1 text-blue-600 font-bold bg-blue-50/70 px-4 py-1.5 rounded-xl transition-all";
        } else {
            pageEl.classList.add('hidden');
            navEl.className = "flex flex-col items-center p-1 text-slate-400";
        }
    });
    lucide.createIcons();
}

// LOGIKA HALAMAN DATA PRODUK
function openModal() { document.getElementById('product-modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('product-modal').classList.add('hidden'); document.getElementById('product-form').reset(); }

function saveProduct(e) {
    e.preventDefault();
    const name = document.getElementById('prod-name').value;
    const price = parseInt(document.getElementById('prod-price').value);
    const stock = parseInt(document.getElementById('prod-stock').value);

    products.push({ id: Date.now(), name, price, stock, status: 'aktif' });
    localStorage.setItem('pos_products', JSON.stringify(products));
    closeModal();
    renderProducts();
    renderSaleProducts();
}

function switchProductTab(tab) {
    currentTab = tab;
    document.getElementById('btn-tab-aktif').className = tab === 'aktif' ? "flex-1 py-2 text-center text-sm font-medium rounded-md bg-[#1e62b4] text-white cursor-pointer" : "flex-1 py-2 text-center text-sm font-medium rounded-md text-gray-700 cursor-pointer";
    document.getElementById('btn-tab-arsip').className = tab === 'arsip' ? "flex-1 py-2 text-center text-sm font-medium rounded-md bg-[#1e62b4] text-white cursor-pointer" : "flex-1 py-2 text-center text-sm font-medium rounded-md text-gray-700 cursor-pointer";
    renderProducts();
}

function toggleArchive(id) {
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
        products[idx].status = products[idx].status === 'aktif' ? 'arsip' : 'aktif';
        localStorage.setItem('pos_products', JSON.stringify(products));
        renderProducts();
        renderSaleProducts();
    }
}

function renderProducts() {
    const container = document.getElementById('product-container');
    const searchVal = document.getElementById('product-search').value.toLowerCase();
    let filterData = products.filter(p => p.status === currentTab && p.name.toLowerCase().includes(searchVal));

    container.innerHTML = filterData.length === 0 ? `<p class="text-slate-400 text-center text-xs py-8">Tidak ada produk</p>` : '';
    filterData.forEach(p => {
        container.innerHTML += `
            <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${p.name}</h4>
                    <p class="text-blue-600 font-extrabold text-xs mt-0.5">Rp ${p.price.toLocaleString('id-ID')}</p>
                    <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm mt-1 inline-block font-bold">Stok: ${p.stock}</span>
                </div>
                <button onclick="toggleArchive(${p.id})" class="text-xs ${currentTab === 'aktif' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'} px-3 py-1.5 rounded-xl font-bold cursor-pointer">
                    ${currentTab === 'aktif' ? 'Arsipkan' : 'Aktifkan'}
                </button>
            </div>
        `;
    });
}

// LOGIKA TRANSAKSI PENJUALAN (KASIR)
function renderSaleProducts() {
    const container = document.getElementById('sale-product-list');
    const searchVal = document.getElementById('sale-search').value.toLowerCase();
    let filterData = products.filter(p => p.status === 'aktif' && p.name.toLowerCase().includes(searchVal));

    container.innerHTML = '';
    filterData.forEach(p => {
        container.innerHTML += `
            <div onclick="addToCart(${p.id})" class="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs flex justify-between items-center cursor-pointer active:bg-slate-50">
                <div>
                    <h4 class="font-bold text-slate-800 text-xs">${p.name}</h4>
                    <p class="text-blue-600 font-black text-xs">Rp ${p.price.toLocaleString('id-ID')}</p>
                    <span class="text-[9px] text-slate-400">Sisa Stok: ${p.stock}</span>
                </div>
                <span class="text-blue-500 font-bold text-xs bg-blue-50 px-2 py-1 rounded-lg">+ Pilih</span>
            </div>
        `;
    });
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product || product.stock <= 0) { alert('Stok produk habis!'); return; }

    const cartItem = cart.find(item => item.id === id);
    if (cartItem) {
        if (cartItem.qty >= product.stock) { alert('Batas stok maksimum tercapai!'); return; }
        cartItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function changeQty(id, delta) {
    const cartItem = cart.find(item => item.id === id);
    const product = products.find(p => p.id === id);
    if (!cartItem) return;

    cartItem.qty += delta;
    if (cartItem.qty > product.stock) { alert('Stok tidak mencukupi'); cartItem.qty = product.stock; }
    if (cartItem.qty <= 0) cart = cart.filter(item => item.id !== id);
    
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    if (cart.length === 0) { container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Keranjang masih kosong.</p>'; } else { container.innerHTML = ''; }

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.qty;
        container.innerHTML += `
            <div class="flex justify-between items-center py-2 text-xs">
                <div class="flex-1 pr-2">
                    <p class="font-bold text-slate-800">${item.name}</p>
                    <p class="text-[10px] text-slate-400">Rp ${item.price.toLocaleString('id-ID')} x ${item.qty}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="changeQty(${item.id}, -1)" class="w-6 h-6 bg-slate-100 rounded-md font-bold">-</button>
                    <span class="font-bold text-slate-800">${item.qty}</span>
                    <button onclick="changeQty(${item.id}, 1)" class="w-6 h-6 bg-slate-100 rounded-md font-bold">+</button>
                </div>
            </div>
        `;
    });

    const taxPercent = parseInt(document.getElementById('inp-pajak-toko').value) || 0;
    const taxValue = Math.round(subtotal * (taxPercent / 100));
    const total = subtotal + taxValue;

    document.getElementById('cart-subtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('cart-tax').innerText = `Rp ${taxValue.toLocaleString('id-ID')}`;
    document.getElementById('cart-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

function clearCart() { cart = []; updateCartUI(); }

function checkoutTransaction() {
    if (cart.length === 0) { alert('Keranjang masih kosong!'); return; }

    // Potong stok produk asli secara permanen
    cart.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        if (prod) prod.stock -= item.qty;
    });
    localStorage.setItem('pos_products', JSON.stringify(products));

    // Hitung keuangan transaksi
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxPercent = parseInt(document.getElementById('inp-pajak-toko').value) || 0;
    const taxValue = Math.round(subtotal * (taxPercent / 100));
    const total = subtotal + taxValue;
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

    // Simpan ke database laporan penjualan
    transactions.push({ id: Date.now(), total, totalQty, date: new Date().toLocaleDateString('id-ID') });
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));

    // Buka Tampilan Cetak Struk
    showReceipt(subtotal, taxValue, total);

    // Bersihkan State Keranjang Kasir
    cart = [];
    updateCartUI();
    renderProducts();
    renderSaleProducts();
    updateDashboardMetrics();
}

// LOGIKA STRUK PENJUALAN
function showReceipt(subtotal, tax, total) {
    document.getElementById('rec-store-name').innerText = document.getElementById('inp-nama-toko').value;
    document.getElementById('rec-store-address').innerText = document.getElementById('inp-alamat-toko').value;
    document.getElementById('rec-customer').innerText = document.getElementById('cart-customer').value || "Umum";
    document.getElementById('rec-time').innerText = new Date().toLocaleString('id-ID');

    const itemsContainer = document.getElementById('rec-items');
    itemsContainer.innerHTML = '';
    cart.forEach(item => {
        itemsContainer.innerHTML += `
            <div class="flex justify-between">
                <span>${item.name} (x${item.qty})</span>
                <span>Rp ${(item.price * item.qty).toLocaleString('id-ID')}</span>
            </div>
        `;
    });

    document.getElementById('rec-subtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('rec-tax').innerText = `Rp ${tax.toLocaleString('id-ID')}`;
    document.getElementById('rec-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('receipt-modal').classList.remove('hidden');
}

// LOGIKA METRIK DASHBOARD UTAMA
function updateDashboardMetrics() {
    let totalOmset = transactions.reduce((sum, t) => sum + t.total, 0);
    let totalTerjual = transactions.reduce((sum, t) => sum + t.totalQty, 0);

    document.getElementById('dash-omset').innerText = `Rp ${totalOmset.toLocaleString('id-ID')}`;
    document.getElementById('dash-transaksi').innerText = transactions.length;
    document.getElementById('dash-terjual').innerText = totalTerjual;
}

// LOGIKA INFO TOKO & LOGO PHOTO
function syncStoreInfo() {
    const nama = document.getElementById('inp-nama-toko').value;
    const alamat = document.getElementById('inp-alamat-toko').value;
    document.getElementById('lbl-nama-toko').innerText = nama || "NAMA TOKO";
    document.getElementById('lbl-alamat-toko').innerText = alamat || "ALAMAT TOKO";
    document.getElementById('dash-nama-toko').innerText = nama || "NAMA TOKO";
}

function saveStoreInfo() {
    const storeProfile = {
        nama: document.getElementById('inp-nama-toko').value,
        alamat: document.getElementById('inp-alamat-toko').value,
        pajak: document.getElementById('inp-pajak-toko').value,
        kertas: document.getElementById('inp-kertas-toko').value
    };
    localStorage.setItem('pos_store_profile', JSON.stringify(storeProfile));
    alert('Informasi Toko berhasil disimpan permanen!');
}

function loadStoreInfo() {
    const saved = JSON.parse(localStorage.getItem('pos_store_profile'));
    if (saved) {
        document.getElementById('inp-nama-toko').value = saved.nama;
        document.getElementById('inp-alamat-toko').value = saved.alamat;
        document.getElementById('inp-pajak-toko').value = saved.pajak;
        document.getElementById('inp-kertas-toko').value = saved.kertas;
        syncStoreInfo();
    }
    const savedLogo = localStorage.getItem('pos_store_logo');
    if (savedLogo) {
        document.getElementById('logo-img').src = savedLogo;
        document.getElementById('logo-img').classList.remove('hidden');
        document.getElementById('logo-placeholder').classList.add('hidden');
    }
}

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            localStorage.setItem('pos_store_logo', event.target.result);
            loadStoreInfo();
        };
        reader.readAsDataURL(file);
    }
}

function removeLogo() {
    localStorage.removeItem('pos_store_logo');
    document.getElementById('logo-img').classList.add('hidden');
    document.getElementById('logo-placeholder').classList.remove('hidden');
}
