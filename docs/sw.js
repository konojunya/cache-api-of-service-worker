var CACHE_VERSION = 1;
var CURRENT_CACHES = {
  offline: 'offline-v' + CACHE_VERSION
};
var OFFLINE_URL = "offline.html"

function createCacheBustedRequest(url) {
    var request = new Request(url, { cache: 'reload' })
    if('cache' in request) {
        return request
    }

    var bustedUrl = new URL(url, self.location.href)
    bustedUrl.search += (bustedUrl.search ? "$" : "") + 'cachebust=' + Date.now()
    return new Request(bustedUrl)
}

// install
self.addEventListener("install", function(event){
    event.waitUntil(
        fetch(createCacheBustedRequest(OFFLINE_URL)).then(function(response){
            return caches.open(CURRENT_CACHES.offline).then(function(cache){
                return cache.put(OFFLINE_URL, response)
            })
        })
    )
})

// activate
self.addEventListener("activate", function(event){
    console.log(event)
    var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key){
        return CURRENT_CACHES[key]
    })
    event.waitUntil(
        caches.keys().then(function(cacheNames){
            return Promise.all(
                cacheNames.map(function(cacheName){
                    if(expectedCacheNames.indexOf(cacheName) === -1) {
                        console.log("Deleting out of data cache:", cacheName);
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
})

// fetch
self.addEventListener("fetch", function(event){
    if(event.request.mode === 'navigate' || (event.request.method === "GET" && event.request.headers.get("accept").includes("text/html"))) {
        console.log("Handling fetch event for", event.request.url);
        event.respondWith(
            fetch(event.request).catch(function(err){
                console.log("Fetch failing; returning offline page instead", err)
                return caches.match(OFFLINE_URL)
            })
        )
    }
})