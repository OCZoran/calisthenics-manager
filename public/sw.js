const CACHE_NAME = "workout-tracker-v1";
const urlsToCache = ["/", "/workouts", "/login", "/manifest.json"];

// Instalacija SW
self.addEventListener("install", (event) => {
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
			.then(() => self.skipWaiting())
	);
});

// Aktivacija SW
self.addEventListener("activate", (event) => {
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
			.then(() => self.clients.claim())
	);
});

// 👈 OVDE IDE novi fetch listener
self.addEventListener("fetch", (event) => {
	const { request } = event;

	if (
		request.method !== "GET" ||
		new URL(request.url).origin !== self.location.origin
	) {
		return;
	}

	event.respondWith(
		caches.match(request).then((cachedResponse) => {
			if (cachedResponse) return cachedResponse;

			return fetch(request)
				.then((response) => {
					if (response.status === 200 && !request.url.includes("/api/")) {
						const responseClone = response.clone();
						caches
							.open(CACHE_NAME)
							.then((cache) => cache.put(request, responseClone));
					}
					return response;
				})
				.catch(() => {
					if (request.mode === "navigate") return caches.match("/");
				});
		})
	);
});

// Background sync i ostalo ostaje isto
self.addEventListener("sync", (event) => {
	if (event.tag === "workout-sync") {
		event.waitUntil(syncWorkouts());
	}
});

async function syncWorkouts() {
	try {
		const clients = await self.clients.matchAll();
		clients.forEach((client) => {
			client.postMessage({ type: "SYNC_WORKOUTS" });
		});
	} catch (error) {
		console.error("SW: Sync failed:", error);
	}
}
