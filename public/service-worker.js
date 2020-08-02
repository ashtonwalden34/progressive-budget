console.log("service worker hit!!")

// variable to hold files being cached
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/style.css", 
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];

// names for caches
const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

// install service worker
self.addEventListener("install", function(evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
          console.log("files pre-cached")
        return cache.addAll(FILES_TO_CACHE);
      })
    );

    self.skipWaiting();
});

// activate service worker
self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
    // becomes the service worker if there are any others active
    self.clients.claim();
  });

  // fetches
  self.addEventListener("fetch", function(evt) {
    // if the request includes the route "/api/"
    if (evt.request.url.includes("/api/")) {
      evt.respondWith(
          // function opens the data cache
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)
            .then(response => {
              // stores request in cache if succesful
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
              return response;
            })
            .catch(err => {
              // if the request fails, check the cache for a matching request
              return cache.match(evt.request);
            });
            // displays error if one is caught
        }).catch(err => console.log(err))
      );
  
      return;
    }
    // if the request does not include "/api/ then it will serve up what's in the cache"
    evt.respondWith(
        caches.match(evt.request).then(function(response) {
          return response || fetch(evt.request);
        })
      );
    });