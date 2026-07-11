// Ganti fungsi-fungsi di bagian paling bawah app.js Anda dengan kode di bawah ini:

function showReceipt(subtotal, tax, total) {
    document.getElementById('rec-store-name').innerText = document.getElementById('inp-nama-toko').value;
    document.getElementById('rec-store-address').innerText = document.getElementById('inp-alamat-toko').value;
    document.getElementById('rec-customer').innerText = document.getElementById('cart-customer').value || "Umum";
    document.getElementById('rec-time').innerText = new Date().toLocaleString('id-ID');
    
    // Tarik teks kustom footer
    document.getElementById('rec-footer').innerText = document.getElementById('inp-footer-toko').value || "Terima kasih atas kunjungan Anda!";

    const itemsContainer = document.getElementById('rec-items');
    itemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        itemsContainer.innerHTML += `
            <div class="flex justify-between items-start gap-1">
                <span class="flex-1">${item.name} (x${item.qty})</span>
                <span class="whitespace-nowrap">Rp ${(item.price * item.qty).toLocaleString('id-ID')}</span>
            </div>
        `;
    });

    document.getElementById('rec-subtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('rec-tax').innerText = `Rp ${tax.toLocaleString('id-ID')}`;
    document.getElementById('rec-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('receipt-modal').classList.remove('hidden');
}

function saveStoreInfo() {
    const storeProfile = {
        nama: document.getElementById('inp-nama-toko').value,
        alamat: document.getElementById('inp-alamat-toko').value,
        pajak: document.getElementById('inp-pajak-toko').value,
        kertas: document.getElementById('inp-kertas-toko').value,
        footer: document.getElementById('inp-footer-toko').value // Menyimpan input baru
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
        if(saved.footer !== undefined) {
            document.getElementById('inp-footer-toko').value = saved.footer;
        }
        syncStoreInfo();
    }
    const savedLogo = localStorage.getItem('pos_store_logo');
    if (savedLogo) {
        document.getElementById('logo-img').src = savedLogo;
        document.getElementById('logo-img').classList.remove('hidden');
        document.getElementById('logo-placeholder').classList.add('hidden');
    }
}
