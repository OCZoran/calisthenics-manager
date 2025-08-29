// components/ServiceWorkerRegister.tsx
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker
				.register("/sw.js")
				.then((registration) => {
					console.log("Service Worker registrovan uspešno:", registration);
				})
				.catch((error) => {
					console.error("Service Worker registracija neuspešna:", error);
				});
		}
	}, []);

	return null; // Ne renderuje ništa
}
