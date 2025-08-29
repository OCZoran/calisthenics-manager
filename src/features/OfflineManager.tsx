/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

interface OfflineWorkout {
	id: string;
	data: any;
	timestamp: number;
}

interface OfflineUser {
	id: string;
	email: string;
	name: string;
}

// Utility funkcije - van hook-a
export const saveUserOffline = (userData: any) => {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem("offlineUser", JSON.stringify(userData));
		localStorage.setItem("isLoggedInOffline", "true");
	} catch (error) {
		console.error("Greška pri čuvanju korisnika offline:", error);
	}
};

export const getOfflineUser = (): OfflineUser | null => {
	if (typeof window === "undefined") return null;

	try {
		const userData = localStorage.getItem("offlineUser");
		const isLoggedIn = localStorage.getItem("isLoggedInOffline");
		return isLoggedIn === "true" && userData ? JSON.parse(userData) : null;
	} catch (error) {
		console.error("Greška pri učitavanju offline korisnika:", error);
		return null;
	}
};

export const clearOfflineUser = () => {
	if (typeof window === "undefined") return;

	try {
		localStorage.removeItem("offlineUser");
		localStorage.removeItem("isLoggedInOffline");
	} catch (error) {
		console.error("Greška pri brisanju offline korisnika:", error);
	}
};

export const useOfflineWorkouts = () => {
	const [isOnline, setIsOnline] = useState(true);
	const [pendingWorkouts, setPendingWorkouts] = useState<OfflineWorkout[]>([]);
	const [isClient, setIsClient] = useState(false);
	const [syncCallbacks, setSyncCallbacks] = useState<Array<() => void>>([]);

	useEffect(() => {
		setIsClient(true);
		setIsOnline(navigator.onLine);

		// Učitaj pending workouts iz localStorage
		loadPendingWorkouts();

		// Online/offline event listeners
		const handleOnline = () => {
			console.log("Povratila se konekcija - pokrećemo sync");
			setIsOnline(true);
			// Dodajemo kratku pauzu da se konekcija stabilizuje
			setTimeout(() => {
				syncPendingWorkouts();
			}, 1000);
		};

		const handleOffline = () => {
			console.log("Izguljena konekcija");
			setIsOnline(false);
		};

		// Service Worker message listener
		const handleSWMessage = (event: MessageEvent) => {
			if (event.data?.type === "SYNC_WORKOUTS") {
				console.log("Primljena poruka od SW za sync");
				syncPendingWorkouts();
			}
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		// Registruj SW message listener
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.addEventListener("message", handleSWMessage);
		}

		// Takođe pokretaj sync periodično kada smo online
		const syncInterval = setInterval(() => {
			if (navigator.onLine && pendingWorkouts.length > 0) {
				console.log("Periodični sync check");
				syncPendingWorkouts();
			}
		}, 30000); // Svakih 30 sekundi

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
			if ("serviceWorker" in navigator) {
				navigator.serviceWorker.removeEventListener("message", handleSWMessage);
			}
			clearInterval(syncInterval);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pendingWorkouts.length]); // Dodaj dependency

	const loadPendingWorkouts = () => {
		if (!isClient) return;

		try {
			const stored = localStorage.getItem("pendingWorkouts");
			if (stored) {
				const parsed = JSON.parse(stored);
				console.log("Učitani pending workouts:", parsed);
				setPendingWorkouts(parsed);
			}
		} catch (error) {
			console.error("Greška pri učitavanju offline treninga:", error);
		}
	};

	const saveWorkoutOffline = async (workoutData: any) => {
		if (!isClient) return null;

		const offlineWorkout: OfflineWorkout = {
			id: Date.now().toString(),
			data: {
				...workoutData,
				synced: false, // Eksplicitno markiranje kao nesinhovano
			},
			timestamp: Date.now(),
		};

		const newPending = [...pendingWorkouts, offlineWorkout];
		setPendingWorkouts(newPending);

		// Sačuvaj u localStorage
		try {
			localStorage.setItem("pendingWorkouts", JSON.stringify(newPending));
			console.log("Workout sačuvan offline:", offlineWorkout);

			// Registruj background sync ako je dostupan
			if (
				"serviceWorker" in navigator &&
				"sync" in window.ServiceWorkerRegistration.prototype
			) {
				const registration = await navigator.serviceWorker.ready;
				// Type assertion to allow 'sync' property
				await (
					registration as ServiceWorkerRegistration & { sync: any }
				).sync.register("workout-sync");
				console.log("Background sync registrovan");
			}
		} catch (error) {
			console.error("Greška pri čuvanju offline:", error);
		}

		return offlineWorkout.id;
	};

	const syncPendingWorkouts = async () => {
		if (!isOnline || pendingWorkouts.length === 0 || !isClient) {
			console.log("Sync preskočen - offline ili nema pending workouts");
			return;
		}

		console.log(`Pokretamo sync za ${pendingWorkouts.length} treninga`);
		const successfulSyncs: string[] = [];
		const failedSyncs: OfflineWorkout[] = [];

		for (const workout of pendingWorkouts) {
			try {
				console.log("Sinhronizujemo workout:", workout.id);
				const response = await fetch("/api/workouts", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(workout.data),
				});

				if (response.ok) {
					console.log("Workout uspešno sinhronizovan:", workout.id);
					successfulSyncs.push(workout.id);
				} else {
					console.error(
						"Sync neuspešan:",
						response.status,
						response.statusText
					);
					failedSyncs.push(workout);
				}
			} catch (error) {
				console.error("Greška pri sinhronizaciji:", error);
				failedSyncs.push(workout);
			}
		}

		// Ažuriraj pending workouts - ukloni uspešno sinhronizovane
		const remaining = pendingWorkouts.filter(
			(w) => !successfulSyncs.includes(w.id)
		);

		console.log(
			`Sync završen. Uspešno: ${successfulSyncs.length}, Preostalo: ${remaining.length}`
		);

		setPendingWorkouts(remaining);

		try {
			localStorage.setItem("pendingWorkouts", JSON.stringify(remaining));
		} catch (error) {
			console.error("Greška pri ažuriranju localStorage:", error);
		}

		// Pozovi callback funkcije da obaveste komponente o sync-u
		syncCallbacks.forEach((callback) => callback());
	};

	// Dodaj callback funkciju koji će komponente moći da registruju
	const onSyncComplete = (callback: () => void) => {
		setSyncCallbacks((prev) => [...prev, callback]);

		// Vrati cleanup funkciju
		return () => {
			setSyncCallbacks((prev) => prev.filter((cb) => cb !== callback));
		};
	};

	const submitWorkout = async (workoutData: any) => {
		if (!isClient) {
			throw new Error("Funkcija dostupna samo na klijentskoj strani");
		}

		if (isOnline) {
			// Online - slanje direktno
			try {
				const response = await fetch("/api/workouts", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...workoutData,
						synced: true, // Online je odmah sinhronizovano
					}),
				});

				if (!response.ok) {
					throw new Error("Network error");
				}

				const result = await response.json();
				console.log("Workout uspešno poslat online:", result);
				return result;
			} catch (error) {
				console.log("Online slanje neuspešno, čuvam offline:", error);
				// Ako ne uspe online, sačuvaj offline
				const offlineId = await saveWorkoutOffline(workoutData);
				return { id: offlineId, offline: true };
			}
		} else {
			// Offline - sačuvaj lokalno
			console.log("Offline mode - čuvam lokalno");
			const offlineId = await saveWorkoutOffline(workoutData);
			return { id: offlineId, offline: true };
		}
	};

	// Dodaj funkciju za manuelni sync
	const manualSync = async () => {
		console.log("Manualni sync pokrenut");
		await syncPendingWorkouts();
	};

	return {
		isOnline: isClient ? isOnline : true,
		pendingWorkouts,
		submitWorkout,
		syncPendingWorkouts,
		manualSync, // Dodaj za testiranje
		isClient,
		saveUserOffline,
		getOfflineUser,
		clearOfflineUser,
		onSyncComplete, // Dodaj callback registraciju
	};
};
