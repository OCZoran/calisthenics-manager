// public/sw.js - Popravljen Service Worker
const CACHE_NAME = "workout-tracker-v1";
const urlsToCache = [
	"/",
	"/workouts",
	"/login",
	"/manifest.json",
	// Uklonili smo nepostojeće statičke fajlove
];

// Instalacija Service Worker-a
self.addEventListener("install", (event) => {
	console.log("SW: Installing...");
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log("SW: Caching files");
				// Dodajemo ih jedan po jedan da vidimo koji pravi problem
				return Promise.allSettled(
					urlsToCache.map((url) =>
						cache.add(url).catch((err) => {
							console.error(`SW: Failed to cache ${url}:`, err);
							return null;
						})
					)
				);
			})
			.then(() => {
				console.log("SW: Install complete");
				self.skipWaiting(); // Aktivira odmah novi SW
			})
			.catch((error) => {
				console.error("SW: Install failed:", error);
			})
	);
});

// Aktivacija Service Worker-a
self.addEventListener("activate", (event) => {
	console.log("SW: Activating...");
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME) {
							console.log("SW: Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log("SW: Activated");
				return self.clients.claim(); // Preuzima kontrolu odmah
			})
	);
});

// Fetch interceptor za offline funkcionalnost
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Preskačemo non-GET zahteve i eksterni sadržaj
	if (request.method !== "GET" || !url.origin === self.location.origin) {
		return;
	}

	event.respondWith(
		caches.match(request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(request)
				.then((response) => {
					// Ne kešujemo API pozive
					if (url.pathname.startsWith("/api/")) {
						return response;
					}

					// Kešujemo ostale uspešne odgovore
					if (response.status === 200) {
						const responseToCache = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(request, responseToCache);
						});
					}

					return response;
				})
				.catch(() => {
					// Vraćamo offline stranicu za navigation zahteve
					if (request.mode === "navigate") {
						return caches.match("/");
					}
					throw error;
				});
		})
	);
});

// Background sync za offline treninge
self.addEventListener("sync", (event) => {
	console.log("SW: Background sync event:", event.tag);
	if (event.tag === "workout-sync") {
		event.waitUntil(syncWorkouts());
	}
});

// Funkcija za sinhronizaciju treninga
async function syncWorkouts() {
	console.log("SW: Starting workout sync...");

	try {
		// Šaljemo poruku main thread-u da pokrene sync
		const clients = await self.clients.matchAll();
		clients.forEach((client) => {
			client.postMessage({
				type: "SYNC_WORKOUTS",
			});
		});
	} catch (error) {
		console.error("SW: Sync failed:", error);
	}
}
