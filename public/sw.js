// public/sw.js

const CACHE_NAME = "workout-tracker-v1";
const urlsToCache = ["/", "/workouts", "/login", "/manifest.json"];

// Instalacija SW
self.addEventListener("install", (event) => {
	console.log("SW: Installing...");
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				return Promise.allSettled(
					urlsToCache.map((url) =>
						cache.add(url).catch((err) => {
							console.error(`SW: Failed to cache ${url}:`, err);
						})
					)
				);
			})
			.then(() => {
				console.log("SW: Install complete");
				self.skipWaiting();
			})
	);
});

// Aktivacija SW
self.addEventListener("activate", (event) => {
	console.log("SW: Activating...");
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.map((key) => {
						if (key !== CACHE_NAME) return caches.delete(key);
					})
				)
			)
			.then(() => {
				console.log("SW: Activated");
				return self.clients.claim();
			})
	);
});

// Fetch listener
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Preskačemo non-GET i vanjski origin
	if (request.method !== "GET" || url.origin !== self.location.origin) {
		return;
	}

	// Network-first za navigaciju (osigurava svježi HTML/SSR kada je moguće)
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((networkRes) => {
					return networkRes;
				})
				.catch(() => caches.match("/"))
		);
		return;
	}

	// Cache-first za ostale assete
	event.respondWith(
		caches.match(request).then((cachedResponse) => {
			if (cachedResponse) return cachedResponse;

			return fetch(request)
				.then((response) => {
					// Ne keširamo API pozive
					if (
						response &&
						response.status === 200 &&
						!request.url.includes("/api/")
					) {
						const responseClone = response.clone();
						caches
							.open(CACHE_NAME)
							.then((cache) => cache.put(request, responseClone));
					}
					return response;
				})
				.catch(() => {
					// Fallback za navigaciju (ako nešto krene po zlu)
					if (request.mode === "navigate") return caches.match("/");
				});
		})
	);
});

// Background sync - SW event
self.addEventListener("sync", (event) => {
	console.log("SW: Background sync event:", event.tag);
	if (event.tag === "workout-sync") {
		event.waitUntil(syncWorkouts());
	}
});

async function syncWorkouts() {
	try {
		const clients = await self.clients.matchAll();
		clients.forEach((client) => {
			// Pošalji poruku glavnoj stranici koja će pokrenuti syncPendingWorkouts()
			client.postMessage({ type: "SYNC_WORKOUTS" });
		});
	} catch (error) {
		console.error("SW: Sync failed:", error);
	}
}
