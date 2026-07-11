‎const CACHE_NAME = 'kasir-toko-v1';
‎const ASSETS = [
‎  'index.html',
‎  'style.css',
‎  'app.js',
‎  'manifest.json',
‎  'https://cdn.tailwindcss.com',
‎  'https://unpkg.com/lucide@0.400.0/dist/umd/lucide.min.js'
‎];
‎
‎// Install Service Worker & Simpan Aset ke Cache
‎self.addEventListener('install', (e) => {
‎  e.waitUntil(
‎    caches.open(CACHE_NAME).then((cache) => {
‎      return cache.addAll(ASSETS);
‎    })
‎  );
‎});
‎
‎// Aktivasi & Hapus Cache Lama jika ada perubahan
‎self.addEventListener('activate', (e) => {
‎  e.waitUntil(
‎    caches.keys().then((keys) => {
‎      return Promise.all(
‎        keys.map((key) => {
‎          if (key !== CACHE_NAME) {
‎            return caches.delete(key);
‎          }
‎        })
‎      );
‎    })
‎  );
‎});
‎
‎// Ambil data dari Cache dulu, jika gagal baru ambil dari internet (Offline Mode)
‎self.addEventListener('fetch', (e) => {
‎  e.respondWith(
‎    caches.match(e.request).then((cachedResponse) => {
‎      return cachedResponse || fetch(e.request);
‎    })
‎  );
‎});
‎
