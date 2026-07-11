// Database state menggunakan LocalStorage bawaan PWA
let products = JSON.parse(localStorage.getItem('pos_products')) || [
    { id: 1, name: 'olo pikoli', price: 65000, stock: 12, status: 'aktif', timestamp: Date.now() - 10000 }
];
let checkoutCart = [];
let currentTab = 'aktif';
let currentFilter = 'terbaru';

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    renderProducts();
    renderSaleProducts();
    updateDashboardMetrics();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
    }
});

// ROUTING SPA (Single Page Application Switcher)
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
            navEl.className = "flex flex-col items-center p-1 text-slate-400 hover:text-slate-700";
        }
    });
    
    // Refresh view saat perpindahan halaman terjadi
    if (pageId === 'produk') renderProducts();
    if (pageId === 'penjualan') renderSaleProducts();
    if (pageId === 'home') updateDashboardMetrics();
    
    lucide.createIcons();
}

// LOGIKA HALAMAN INFO TOKO
function syncStoreInfo() {
    const nama = document.getElementById('inp-nama-toko').value;
    const alamat = document.getElementById('inp-alamat-toko').value;
    document.getElementById('lbl-nama-toko').innerText = nama || "NAMA TOKO";
    document.getElementById('lbl-alamat-toko').innerText = alamat || "alamat toko";
}

// LOGIKA MODEL POP-UP PRODUK
function openModal() { document.getElementById('product-modal').classList.remove('hidden'); }
function closeModal() {
    document.getElementById('product-modal').classList.add('hidden');
    document.getElementById('product-form').reset();
}

function saveProduct(e) {
    e.preventDefault();
    const name = document.getElementById('prod-name').value;
    const price = parseInt(document.getElementById('prod-price').value);
    const stockInput = document.getElementById('prod-stock').value;
    const stock = stockInput === '' ? 0 : parseInt(stockInput);

    products.push({
        id: Date.now(),
        name: name,
        price: price,
        stock: stock,
        status: 'aktif',
        timestamp: Date.now()
    });
    
    localStorage.setItem('pos_products', JSON.stringify(products));
    closeModal();
    renderProducts();
    updateDashboardMetrics();
}

// FILTER & TABS PADA DATA PRODUK
function switchProductTab(tab) {
    currentTab = tab;
    const btnAktif = document.getElementById('btn-tab-aktif');
    const btnArsip = document.getElementById('btn-tab-arsip');
    btnAktif.className = tab === 'aktif' ? "flex-1 py-2 text-center text-sm font-medium rounded-md bg-[#1e62b4] text-white transition-all cursor-pointer" : "flex-1 py-2 text-center text-sm font-medium rounded-md text-gray-700 transition-all cursor-pointer";
    btnArsip.className = tab === 'arsip' ? "flex-1 py-2 text-center text-sm font-medium rounded-md bg-[#1e62b4] text-white transition-all cursor-pointer" : "flex-1 py-2 text-center text-sm font-medium rounded-md text-gray-700 transition-all cursor-pointer";
    renderProducts();
}

function setFilter(type) {
    currentFilter = type;
    ['terbaru', 'az', 'za', 'termurah'].forEach(f => {
        document.getElementById(`chip-${f}`).className = f === type ? "px-4 py-2 rounded-full font-medium bg-[#1e62b4] text-white whitespace-nowrap" : "px-4 py-2 rounded-full font-medium border border-blue-600 text-blue-700 bg-white whitespace-nowrap";
    });
    renderProducts();
}

function liveSearch() { renderProducts(); }
function searchSaleProduct() { renderSaleProducts(); }

function toggleArchive(id) {
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
        products[idx].status = products[idx].status === 'aktif' ? 'arsip' : 'aktif';
        localStorage.setItem('pos_products', JSON.stringify(products));
        renderProducts();
    }
}

// RENDERING ENGINE UNTUK HALAMAN DATA PRODUK
function renderProducts() {
    const container = document.getElementById('product-container');
    const searchVal = document.getElementById('product-search').value.toLowerCase();
    let displayData = products.filter(p => p.status === currentTab && p.name.toLowerCase().includes(searchVal));

    if (currentFilter === 'terbaru') displayData.sort((a,b) => b.timestamp - a.timestamp);
    else if (currentFilter === 'az') displayData.sort((a,b) => a.name.localeCompare(b.name));
    else if (currentFilter === 'za') displayData.sort((a,b) => b.name.localeCompare(a.name));
    else if (currentFilter === 'termurah') displayData.sort((a,b) => a.price - b.price);

    container.innerHTML = displayData.length === 0 ? `<p class="text-gray-400 text-center text-xs py-12">Produk tidak ditemukan</p>` : '';
    displayData.forEach(p => {
        container.innerHTML += `
            <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${p.name}</h4>
                    <p class="text-blue-600 font-extrabold text-xs mt-0.5">Rp ${p.price.toLocaleString('id-ID')}</p>
                    <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm mt-1 inline-block font-bold">Stok: ${p.stock}</span>
                </div>
                <button onclick="toggleArchive(${p.id})" class="text-xs ${currentTab === 'aktif' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'} px-3 py-1.5 rounded-xl font-bold">
                    ${currentTab === 'aktif' ? 'Arsipkan' : 'Aktifkan'}
                </button>
            </div>
        `;
    });
    lucide.createIcons();
}

// RENDERING ENGINE UNTUK TRANSAKSI DI KASIR
function renderSaleProducts() {
    const container = document.getElementById('sale-product-list');
    const searchVal = document.getElementById('sale-search').value.toLowerCase();
    let displayData = products.filter(p => p.status === 'aktif' && p.name.toLowerCase().includes(searchVal));

    container.innerHTML = displayData.length === 0 ? `<p class="text-gray-400 text-center text-xs py-8">Produk tidak tersedia</p>` : '';
    displayData.forEach(p => {
        container.innerHTML += `
            <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex justify-between items-center cursor-pointer" onclick="processSale(${p.id})">
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${p.name}</h4>
                    <p class="text-xs text-slate-400 font-medium">${currentTab === 'aktif' ? 'Non Kategori' : ''}</p>
                    <p class="text-blue-600 font-black text-sm mt-1">Rp ${p.price.toLocaleString('id-ID')}</p>
                </div>
                <button class="text-slate-400 p-1"><i data-lucide="more-vertical" class="w-5 h-5"></i></button>
            </div>
        `;
    });
    lucide.createIcons();
}

// SIMULASI AKSI KASIR & PENJUALAN
function processSale(id) {
    const prod = products.find(p => p.id === id);
    if (prod && prod.stock > 0) {
        prod.stock -= 1;
        checkoutCart.push(prod);
        localStorage.setItem('pos_products', JSON.stringify(products));
        alert(`Berhasil menambahkan 1 ${prod.name} ke keranjang kasir!`);
        updateDashboardMetrics();
        renderSaleProducts();
    } else {
        alert('Stok produk habis!');
    }
}

// UPDATE REALTIME METRICS DI DASHBOARD
function updateDashboardMetrics() {
    const totalOmset = checkoutCart.reduce((sum, item) => sum + item.price, 0);
    const totalTerjual = checkoutCart.length;
    
    document.getElementById('dash-omset').innerText = `Rp ${totalOmset.toLocaleString('id-ID')}`;
    document.getElementById('dash-transaksi').innerText = totalTerjual > 0 ? "1" : "0";
    document.getElementById('dash-terjual').innerText = totalTerjual.toString();
}
