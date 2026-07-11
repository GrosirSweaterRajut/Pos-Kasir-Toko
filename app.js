let products = JSON.parse(localStorage.getItem('pos_products')) || [];
let cart = [];
let transactions = JSON.parse(localStorage.getItem('pos_transactions')) || [];
let kategoriList = JSON.parse(localStorage.getItem('pos_kategori')) || ["Baju", "Celana", "Aksesoris", "Lainnya"];
let currentTab = 'aktif';
let filterKategoriAktif = '';
let storeInfo = JSON.parse(localStorage.getItem('pos_store')) || {
    nama: "GROSIR BAJU RAJUT", alamat: "jln inspeksi citarum", hp: "08886225629", pajak: 10, kertas: "58mm", footer: "Terima kasih atas kunjungan Anda!"
};

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons(); loadStoreInfo(); renderKategoriList(); renderProducts(); renderSaleProducts(); updateDashboardMetrics(); switchPage('home');
});

function switchPage(pageId) {
    const pages = ['home', 'penjualan', 'produk', 'infotoko'];
    pages.forEach(p => {
        document.getElementById(`page-${p}`).classList.toggle('hidden', p!== pageId);
        document.getElementById(`nav-${p}`).className = p === pageId? "flex flex-col items-center p-1 text-gray-700 font-bold bg-gray-100 px-4 py-1.5 rounded-xl" : "flex flex-col items-center p-1 text-slate-400";
    });
    lucide.createIcons();
}

function openModal() { renderDropdownKategori(); document.getElementById('product-modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('product-modal').classList.add('hidden'); document.getElementById('product-form').reset(); }

function saveProduct(e) {
    e.preventDefault();
    products.push({ id: Date.now(), name: document.getElementById('prod-name').value, kategori: document.getElementById('prod-kategori').value, price: parseInt(document.getElementById('prod-price').value), stock: parseInt(document.getElementById('prod-stock').value), status: 'aktif' });
    localStorage.setItem('pos_products', JSON.stringify(products)); closeModal(); renderProducts(); renderSaleProducts();
}

function switchProductTab(tab) {
    currentTab = tab;
    document.getElementById('btn-tab-aktif').className = tab === 'aktif'? "flex-1 py-2 text-center text-sm font-medium rounded-md bg-gray-700 text-white" : "flex-1 py-2 text-center text-sm font-medium rounded-md text-gray-700";
    document.getElementById('btn-tab-arsip').className = tab === 'arsip'? "flex-1 py-2 text-center text-sm font-medium rounded-md bg-gray-700 text-white" : "flex-1 py-2 text-center text-sm font-medium rounded-md text-gray-700";
    renderProducts();
}

function filterKategori(kategori) {
    filterKategoriAktif = kategori;
    document.querySelectorAll('#filter-kategori-container.pill').forEach(p => p.classList.remove('active', 'bg-gray-700', 'text-white'));
    document.querySelectorAll('#filter-kategori-container.pill').forEach(p => p.classList.add('bg-gray-200', 'text-gray-700'));
    event.target.classList.add('active', 'bg-gray-700', 'text-white');
    renderProducts();
}

function renderProducts() {
    const container = document.getElementById('product-container');
    const searchVal = document.getElementById('product-search').value.toLowerCase();
    let filterData = products.filter(p => p.status === currentTab && p.name.toLowerCase().includes(searchVal) && (filterKategoriAktif === '' || p.kategori === filterKategoriAktif));
    container.innerHTML = filterData.length === 0? `<p class="text-slate-400 text-center text-xs py-8">Belum ada produk</p>` : '';
    filterData.forEach(p => {
        container.innerHTML += `<div class="bg-white p-4 rounded-2xl border flex justify-between"><div><span class="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">${p.kategori || 'Lainnya'}</span><h4 class="font-bold text-sm mt-1">${p.name}</h4><p class="text-gray-600 font-extrabold text-xs">Rp ${p.price.toLocaleString('id-ID')}</p><span class="text-[9px] bg-slate-100 px-2 py-0.5 rounded-sm">Stok: ${p.stock}</span></div><button onclick="toggleArchive(${p.id})" class="text-xs ${currentTab === 'aktif'? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'} px-3 py-1.5 rounded-xl font-bold h-fit">${currentTab === 'aktif'? 'Arsipkan' : 'Aktifkan'}</button></div>`;
    });
}

function toggleArchive(id) { const idx = products.findIndex(p => p.id === id); if (idx!== -1) { products[idx].status = products[idx].status === 'aktif'? 'arsip' : 'aktif'; localStorage.setItem('pos_products', JSON.stringify(products)); renderProducts(); renderSaleProducts(); } }

function renderSaleProducts() {
    const container = document.getElementById('sale-product-list');
    const searchVal = document.getElementById('sale-search').value.toLowerCase();
    let filterData = products.filter(p => p.status === 'aktif' && p.name.toLowerCase().includes(searchVal));
    container.innerHTML = '';
    filterData.forEach(p => { container.innerHTML += `<div onclick="addToCart(${p.id})" class="bg-white p-3 rounded-xl border flex justify-between cursor-pointer"><div><span class="text-[9px] bg-gray-100 px-1.5 rounded-sm">${p.kategori}</span><h4 class="font-bold text-xs mt-0.5">${p.name}</h4><p class="text-gray-600 font-black text-xs">Rp ${p.price.toLocaleString('id-ID')}</p><span class="text-[9px] text-slate-400">Stok: ${p.stock}</span></div><span class="text-gray-600 font-bold text-xs bg-gray-100 px-2 py-1 rounded-lg">+ Pilih</span></div>`; });
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
        container.innerHTML += `<div class="flex justify-between items-center py-2 text-xs"><div><p class="font-bold">${item.name}</p><p class="text- text-slate-400">Rp ${item.price.toLocaleString('id-ID')} x ${item.qty}</p></div><div class="flex items-center gap-2"><button onclick="changeQty(${item.id}, -1)" class="w-6 h-6 bg-slate-100 rounded-md font-bold">-</button><span class="font-bold">${item.qty}</span><button onclick="changeQty(${item.id}, 1)" class="w-6 h-6 bg-slate-100 rounded-md font-bold">+</button></div></div>`;
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
    const now = new Date();
    transactions.push({ id: Date.now(), total, totalQty, date: now.toISOString() });
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));
    showReceipt(subtotal, taxValue, total, now); cart = []; updateCartUI(); renderProducts(); renderSaleProducts(); updateDashboardMetrics();
}

function showReceipt(subtotal, tax, total, tanggal) {
    document.getElementById('rec-store-name').innerText = storeInfo.nama;
    document.getElementById('rec-store-address').innerText = storeInfo.alamat;
    document.getElementById('rec-customer').innerText = document.getElementById('cart-customer').value || "Umum";
    document.getElementById('rec-date').innerText = tanggal.toLocaleDateString('id-ID');
    document.getElementById('rec-time').innerText = tanggal.toLocaleTimeString('id-ID');
    document.getElementById('rec-footer').innerText = storeInfo.footer;
    const itemsContainer = document.getElementById('rec-items'); itemsContainer.innerHTML = '';
    cart.forEach(item => { itemsContainer.innerHTML += `<div class="flex justify-between"><span>${item.name} x${item.qty}</span><span>Rp ${(item.price * item.qty).toLocaleString('id-ID')}</span></div>`; });
    document.getElementById('rec-subtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('rec-tax').innerText = `Rp ${tax.toLocaleString('id-ID')}`;
    document.getElementById('rec-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('receipt-modal').classList.remove('hidden');
}

function updateDashboardMetrics() {
    const filter = document.getElementById('filter-tanggal').value;
    const now = new Date();
    let startDate = new Date();
    if(filter === 'hari') { startDate.setHours(0,0,0,0); document.getElementById('label-omset').innerText = 'Omset Hari Ini'; }
    if(filter === 'minggu') { startDate.setDate(now.getDate() - 7); document.getElementById('label-omset').innerText = 'Omset 7 Hari'; }
    if(filter === 'bulan') { startDate.setMonth(now.getMonth(), 1); document.getElementById('label-omset').innerText = 'Omset Bulan Ini'; }
    if(filter === 'semua') { startDate = new Date(0); document.getElementById('label-omset').innerText = 'Total Omset'; }
    let filteredTrx = transactions.filter(t => new Date(t.date) >= startDate);
    let totalOmset = filteredTrx.reduce((sum, t) => sum + t.total, 0); let totalTerjual = filteredTrx.reduce((sum, t) => sum + t.totalQty, 0);
    document.getElementById('dash-omset').innerText = `Rp ${totalOmset.toLocaleString('id-ID')}`;
    document.getElementById('dash-transaksi').innerText = filteredTrx.length;
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

function renderKategoriList() {
    const container = document.getElementById('list-kategori'); container.innerHTML = '';
    kategoriList.forEach((kat, index) => {
        container.innerHTML += `<div class="bg-gray-100 px-3 py-1.5 rounded-full text-xs flex items-center gap-2">${kat} <span onclick="editKategori(${index})" class="text-blue-500 font-bold cursor-pointer">✏️</span><span onclick="hapusKategori(${index})" class="text-red-500 font-bold cursor-pointer">x</span></div>`;
    });
    renderDropdownKategori();
}
function tambahKategori() {
    const inp = document.getElementById('inp-kategori-baru');
    const nama = inp.value.trim();
    if(nama === '' || kategoriList.includes(nama)) return alert('Kategori kosong atau sudah ada');
    kategoriList.push(nama);
    localStorage.setItem('pos_kategori', JSON.stringify(kategoriList));
    inp.value = ''; renderKategoriList();
}
function editKategori(index) {
    const namaBaru = prompt('Edit nama kategori:', kategoriList[index]);
    if(namaBaru &&!kategoriList.includes(namaBaru)) {
        kategoriList[index] = namaBaru.trim();
        localStorage.setItem('pos_kategori', JSON.stringify(kategoriList));
        renderKategoriList();
    }
}
function hapusKategori(index) {
    if(confirm('Hapus kategori ini?')) {
        kategoriList.splice(index, 1);
        localStorage.setItem('pos_kategori', JSON.stringify(kategoriList));
        renderKategoriList();
    }
}
function renderDropdownKategori() {
    const select = document.getElementById('prod-kategori');
    select.innerHTML = '<option value="">Pilih Kategori</option>';
    kategoriList.forEach(kat => { select.innerHTML += `<option value="${kat}">${kat}</option>`; });
    const filterContainer = document.getElementById('filter-kategori-container');
    filterContainer.innerHTML = `<button onclick="filterKategori('')" class="pill active px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">Semua</button>`;
    kategoriList.forEach(kat => { filterContainer.innerHTML += `<button onclick="filterKategori('${kat}')" class="pill px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">${kat}</button>`; });
}
