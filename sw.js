importScripts('workbox-sw.js');
const appName = 'my-app';
const version = 'v1';
const runtimeCache = 'runtime-cache';
const evolutionIndexCacheName = `${appName}-evolution-index-${runtimeCache}-${version}`;
const evolutionCacheName = `${appName}-evolution-${runtimeCache}-${version}`;
const pokemonCacheName = `${appName}-pokemon-${runtimeCache}-${version}`;
const pokemonImageCacheName = `${appName}-pokemon-image-${runtimeCache}-${version}`;
const MAX_CACHE_SIZE = 3;
workbox.core.setCacheNameDetails({
  prefix: appName,
  suffix: version
});
workbox.skipWaiting();
workbox.clientsClaim();
workbox.precaching.precacheAndRoute([]);

const evolutionMatchCb = ({url}) => {
  return (url.search.includes('evolutionId'));
};

workbox.routing.registerRoute(
  new RegExp('evolution-chain(\/)*$'),
  workbox.strategies.cacheFirst({
    cacheName: evolutionIndexCacheName
  })
);

workbox.routing.registerRoute(
  new RegExp('species/'),
  workbox.strategies.cacheFirst({
      cacheName: pokemonCacheName,
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: MAX_CACHE_SIZE
        })
      ]
    }
  )
);

workbox.routing.registerRoute(
  new RegExp('https://raw.githubusercontent.com.*/sprites/.*\.png'),
  workbox.strategies.cacheFirst({
      cacheName: pokemonImageCacheName,
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: MAX_CACHE_SIZE
        }),
        new workbox.cacheableResponse.Plugin({
          statuses: [0, 200]
        })
      ]
    }
  )
);

const getRandomItem = (items) => {
  return items[Math.floor(Math.random() * items.length)];
};

const removeRequestFromCache = (request, cache) => {
  return cache.delete(request);
};

const evolutionHandlerCb = ({event}) => {
  event.respondWith(async function () {
    // Try to get the response from a network.
    try {
      const response = await fetch(event.request);
      if (!response.ok) {
        throw Error(response.statusText);
      }
      const cache = await caches.open(evolutionCacheName);
      // Before adding to cache remove older cache entries after a threshold
      const cachedRequests = await cache.keys();
      if (cachedRequests.length >= MAX_CACHE_SIZE) {
        const promises = cachedRequests.map((request) => removeRequestFromCache(request, cache));
        await Promise.all(promises);
      }
      cache.put(event.request, response.clone());
      return response;
    }
    catch (err) {
      // If there are any network errors, use cache.
      const cache = await caches.open(evolutionCacheName);
      const cachedResponses = await cache.matchAll(event.request, {
        ignoreSearch: true
      });
      // Return it if we found one.
      if (cachedResponses && cachedResponses.length) return getRandomItem(cachedResponses);
      // if not reject the promise
      return Promise.reject(err);
    }
  }());
};

workbox.routing.registerRoute(evolutionMatchCb, evolutionHandlerCb);


