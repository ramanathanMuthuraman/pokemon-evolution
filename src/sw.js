const version = '1';

const CacheArray = [
  '/ball.png',
  '/index.html',
  '/offline.html',
  '/style.css',
];
const offlineHtml = '/offline.html';

self.addEventListener('install', function (event) {
  console.log('SW installed ', version, ' -> ', new Date().toLocaleString());
  self.skipWaiting();
  event.waitUntil(
    caches.open(version)
      .then(function (cache) {
        return cache.addAll(CacheArray);
      }));
});

self.addEventListener('activate', function (event) {
  console.log('SW activated ', version, ' -> ', new Date().toLocaleString());
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          return key !== version;
        }).map(function (key) {
          return caches.delete(key);
        }));
    }));
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (res) {
        if (res) {
          return res;
        }
        if (!navigator.onLine) {
          return caches.match(new Request(offlineHtml));
        }
        return fetch(event.request);
      }));
});