importScripts('workbox-sw.js');
workbox.skipWaiting();
workbox.clientsClaim();
workbox.precaching.precacheAndRoute([]);