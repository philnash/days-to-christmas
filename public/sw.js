"use strict";

importScripts('/js/serviceworker-cache-polyfill.js');

const mainCache = "dtc-cache";
const fontCache = "dtc-font-cache";

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(mainCache).then(function(cache) {
      return cache.addAll([
        "/css/bootstrap.css",
        "/css/main.css",
        "/css/soon.css",
        "/js/soon/custom.js",
        "/js/soon/jquery.themepunch.revolution.min.js",
        "/js/soon/plugins.js",
        "/js/bootstrap.min.js",
        "/js/jquery.min.js",
        "/js/modernizr.custom.js",
        "/js/respond.min.js"
      ]);
    })
  );
});

self.addEventListener("fetch", function(event) {
  const requestURL = new URL(event.request.url);

  if (/^(\/css\/|\/js\/)/.test(requestURL.pathname)) {
    event.respondWith(returnFromCacheOrFetch(event.request, mainCache));
  } else if (requestURL.hostname === "fonts.gstatic.com" || requestURL.hostname === "fonts.googleapis.com") {
    event.respondWith(returnFromCacheOrFetch(event.request, fontCache));
  } else if (requestURL.pathname === "/advert") {
    event.respondWith(timeoutRequest(event.request));
  } else if (/^\/images.*\.(jpg|png)$/.test(requestURL.pathname)) {
    event.respondWith(returnWebpOrOriginal(event.request));
  }
});

function timeoutRequest(request) {
  var timeoutPromise = new Promise(function(resolve) {
    setTimeout(resolve, 500);
  });

  var load = fetch(request);

  return Promise.race([timeoutPromise, load]).then(function(winner) {
    if (winner instanceof Response) {
      return winner;
    } else {
      return new Response('');
    }
  });
}

function returnWebpOrOriginal(request) {
  let supportsWebp = false;

  if (request.headers.has('accept')) {
    supportsWebp = request.headers.get('accept').includes('webp');
  }

  if (supportsWebp) {
    const webpUrl = request.url.replace(/(jpg|png)$/, "webp");
    return fetch(webpUrl).then(function(response) {
      return response.status === 404 ? fetch(request) : response;
    });
  } else {
    return fetch(request);
  }
}

function returnFromCacheOrFetch(request, cacheName) {
  return cacheAndMatch(request, mainCache).then(function([cache, cacheResponse]) {
    const fetchPromise = fetch(request).then(function(fetchResponse) {
      cache.put(request, fetchResponse.clone());
      return fetchResponse;
    });
    return cacheResponse || fetchPromise;
  });
}

function cacheAndMatch(request, cacheName) {
  let cachePromise = caches.open(cacheName);
  let matchPromise = cachePromise.then(function(cache) {
    return cache.match(request);
  });
  return Promise.all([cachePromise, matchPromise]);
}
