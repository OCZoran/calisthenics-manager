// features/OfflineManager.tsx
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import axiosInstance from "@/services/axios-public.instance";

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

	// loadPendingWorkouts defined before useEffect so we can call it there
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

	useEffect(() => {
		setIsClient(true);
		setIsOnline(navigator.onLine);

		// Učitaj pending workouts iz localStorage
		loadPendingWorkouts();

		const handleOnline = () => {
			console.log("Povratila se konekcija - pokrećemo sync");
			setIsOnline(true);
			setTimeout(() => {
				syncPendingWorkouts();
			}, 1000);
		};

		const handleOffline = () => {
			console.log("Izguljena konekcija");
			setIsOnline(false);
		};

		const handleSWMessage = (event: MessageEvent) => {
			if (event.data?.type === "SYNC_WORKOUTS") {
				console.log("Primljena poruka od SW za sync");
				syncPendingWorkouts();
			}
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.addEventListener("message", handleSWMessage);
		}

		const syncInterval = setInterval(() => {
			if (navigator.onLine && pendingWorkouts.length > 0) {
				console.log("Periodični sync check");
				syncPendingWorkouts();
			}
		}, 30000); // 30s

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
			if ("serviceWorker" in navigator) {
				navigator.serviceWorker.removeEventListener("message", handleSWMessage);
			}
			clearInterval(syncInterval);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pendingWorkouts.length, isClient]);

	const saveWorkoutOffline = async (workoutData: any) => {
		if (!isClient) return null;

		const offlineWorkout: OfflineWorkout = {
			id: Date.now().toString(),
			data: {
				...workoutData,
				synced: false,
			},
			timestamp: Date.now(),
		};

		const newPending = [...pendingWorkouts, offlineWorkout];
		setPendingWorkouts(newPending);

		try {
			localStorage.setItem("pendingWorkouts", JSON.stringify(newPending));
			console.log("Workout sačuvan offline:", offlineWorkout);

			// Registruj background sync ako je dostupan
			if (
				"serviceWorker" in navigator &&
				"sync" in window.ServiceWorkerRegistration.prototype
			) {
				const registration = await navigator.serviceWorker.ready;
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

	// NOVA FUNKCIJA ZA AŽURIRANJE OFFLINE WORKOUTS
	const updateOfflineWorkout = (workoutId: string, updatedData: any) => {
		if (!isClient) return false;

		try {
			const stored = localStorage.getItem("pendingWorkouts");
			if (!stored) return false;

			const pending = JSON.parse(stored);
			const workoutIndex = pending.findIndex(
				(w: OfflineWorkout) => w.id === workoutId
			);

			if (workoutIndex === -1) {
				console.error("Offline workout sa ID", workoutId, "nije pronađen");
				return false;
			}

			// Ažuriraj workout podaci
			pending[workoutIndex] = {
				...pending[workoutIndex],
				data: {
					...pending[workoutIndex].data,
					...updatedData,
					synced: false, // Ensure it stays marked as unsynced
				},
				timestamp: Date.now(), // Update timestamp for latest changes
			};

			// Sačuvaj u localStorage
			localStorage.setItem("pendingWorkouts", JSON.stringify(pending));

			// Ažuriraj state
			setPendingWorkouts(pending);

			console.log("Offline workout ažuriran:", pending[workoutIndex]);
			return true;
		} catch (error) {
			console.error("Greška pri ažuriranju offline workout:", error);
			return false;
		}
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

				// Koristimo axiosInstance sa withCredentials: true
				const resp = await axiosInstance.post(
					"/api/workouts",
					{ ...workout.data, synced: true },
					{
						headers: { "Cache-Control": "no-cache" },
					}
				);

				// resp.data očekivano: { message, workoutId }
				console.log("SYNC response json:", resp.data);

				if (resp.status >= 200 && resp.status < 300) {
					successfulSyncs.push(workout.id);
				} else {
					console.error("Sync neuspešan:", resp.status, resp.statusText);
					failedSyncs.push(workout);
				}
			} catch (error: any) {
				console.error("Greška pri sinhronizaciji:", error);
				failedSyncs.push(workout);
			}
		}

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

	const onSyncComplete = (callback: () => void) => {
		setSyncCallbacks((prev) => [...prev, callback]);
		return () => {
			setSyncCallbacks((prev) => prev.filter((cb) => cb !== callback));
		};
	};

	const submitWorkout = async (workoutData: any) => {
		if (!isClient) {
			throw new Error("Funkcija dostupna samo na klijentskoj strani");
		}

		if (isOnline) {
			try {
				const resp = await axiosInstance.post(
					"/api/workouts",
					{ ...workoutData, synced: true },
					{
						headers: { "Cache-Control": "no-cache" },
					}
				);

				if (resp.status < 200 || resp.status >= 300) {
					throw new Error("Network error");
				}

				console.log("Workout uspešno poslat online:", resp.data);
				return resp.data;
			} catch (error) {
				console.log("Online slanje neuspešno, čuvam offline:", error);
				const offlineId = await saveWorkoutOffline(workoutData);
				return { id: offlineId, offline: true };
			}
		} else {
			console.log("Offline mode - čuvam lokalno");
			const offlineId = await saveWorkoutOffline(workoutData);
			return { id: offlineId, offline: true };
		}
	};

	const manualSync = async () => {
		console.log("Manualni sync pokrenut");
		await syncPendingWorkouts();
	};

	return {
		isOnline: isClient ? isOnline : true,
		pendingWorkouts,
		submitWorkout,
		syncPendingWorkouts,
		manualSync,
		isClient,
		saveUserOffline,
		getOfflineUser,
		clearOfflineUser,
		onSyncComplete,
		updateOfflineWorkout, // Izvezemo novu funkciju
	};
};
