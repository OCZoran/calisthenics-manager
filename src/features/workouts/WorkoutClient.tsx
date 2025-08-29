/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
	Box,
	Typography,
	Button,
	Alert,
	Snackbar,
	Fab,
	Slide,
	useScrollTrigger,
	Badge,
	IconButton,
} from "@mui/material";
import { Add, KeyboardArrowUp, WifiOff, Wifi, Sync } from "@mui/icons-material";
import { Workout } from "@/global/interfaces/workout.interface";
import WorkoutList from "./WorkoutList";
import WorkoutForm from "./WorkoutForm";
import { useOfflineWorkouts } from "@/features/OfflineManager";

interface WorkoutClientProps {
	initialWorkouts: Workout[];
}

interface HideOnScrollProps {
	children: React.ReactElement;
}

function HideOnScroll({ children }: HideOnScrollProps) {
	const trigger = useScrollTrigger();
	return (
		<Slide appear={false} direction="up" in={!trigger}>
			{children}
		</Slide>
	);
}

const WorkoutClient = ({ initialWorkouts }: WorkoutClientProps) => {
	const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
	const [showForm, setShowForm] = useState(false);
	const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error" | "warning";
	}>({ open: false, message: "", severity: "success" });

	// Koristi offline hook
	const {
		isOnline,
		pendingWorkouts,
		submitWorkout,
		manualSync,
		isClient,
		onSyncComplete,
	} = useOfflineWorkouts();

	// Registruj callback za kada se završi sync
	useEffect(() => {
		const unregister = onSyncComplete(() => {
			console.log("Sync završen - refreshujemo workouts");
			refreshWorkouts();
		});

		return unregister;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Dodaj offline workouts u listu kada se učitaju
	useEffect(() => {
		if (pendingWorkouts.length > 0 && isClient) {
			console.log("Dodajem offline workouts u listu:", pendingWorkouts);

			// Kreiraj workout objekte iz pending workouts
			const offlineWorkouts: Workout[] = pendingWorkouts.map((pending) => ({
				_id: pending.id,
				userId: pending.id, // Koristimo temporary ID
				...pending.data,
				createdAt: new Date(pending.timestamp),
				updatedAt: new Date(pending.timestamp),
				synced: false, // Označava da nije sinhronizovano
			}));

			// Dodaj ih na početak liste ali samo ako već nisu tu
			setWorkouts((prev) => {
				const existingIds = new Set(prev.map((w) => w._id));
				const newWorkouts = offlineWorkouts.filter(
					(w) => !existingIds.has(w._id)
				);

				if (newWorkouts.length > 0) {
					console.log(`Dodajem ${newWorkouts.length} novih offline workouts`);
					return [...newWorkouts, ...prev];
				}
				return prev;
			});
		}
	}, [pendingWorkouts, isClient]);

	const refreshWorkouts = async () => {
		if (!isOnline) return;

		try {
			console.log("Refreshujem workouts sa servera");
			const response = await fetch("/api/workouts");
			if (response.ok) {
				const { workouts: serverWorkouts } = await response.json();
				console.log("Učitao workouts sa servera:", serverWorkouts.length);

				// Kombinuj server workouts sa offline workouts
				if (pendingWorkouts.length > 0) {
					const offlineWorkouts: Workout[] = pendingWorkouts.map((pending) => ({
						_id: pending.id,
						userId: pending.id,
						...pending.data,
						createdAt: new Date(pending.timestamp),
						updatedAt: new Date(pending.timestamp),
						synced: false,
					}));

					setWorkouts([...offlineWorkouts, ...serverWorkouts]);
				} else {
					setWorkouts(serverWorkouts);
				}
			}
		} catch (error) {
			console.error("Greška pri refresh workouts:", error);
		}
	};

	const showSnackbar = (
		message: string,
		severity: "success" | "error" | "warning"
	) => {
		setSnackbar({ open: true, message, severity });
	};

	const handleAddWorkout = () => {
		setEditingWorkout(null);
		setShowForm(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleEditWorkout = (workout: Workout) => {
		// Ne dozvoljavaj edit offline workouts
		if (!workout.synced) {
			showSnackbar("Ne možete editovati nesinhronizovane treninge", "warning");
			return;
		}

		setEditingWorkout(workout);
		setShowForm(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleCancelForm = () => {
		setShowForm(false);
		setEditingWorkout(null);
	};

	// Manualni sync
	const handleManualSync = async () => {
		if (!isOnline) {
			showSnackbar("Nema internet konekcije", "warning");
			return;
		}

		if (pendingWorkouts.length === 0) {
			// showSnackbar("Nema treninga za sinhronizaciju", "info");
			return;
		}

		setIsSyncing(true);
		try {
			await manualSync();
			showSnackbar("Sinhronizacija uspešna!", "success");
		} catch (error) {
			console.error("Greška pri sync:", error);
			showSnackbar("Greška pri sinhronizaciji", "error");
		} finally {
			setIsSyncing(false);
		}
	};

	interface WorkoutFormData {
		date: string;
		type: string;
		notes: string;
		synced: boolean;
		exercises: Array<{
			name: string;
			sets: Array<{
				reps: number;
				rest: number;
			}>;
		}>;
	}

	const handleSubmitWorkout = useCallback(
		async (formData: WorkoutFormData) => {
			setIsLoading(true);
			try {
				if (editingWorkout) {
					// Za edit - pokušaj online prvo
					if (isOnline) {
						const response = await fetch("/api/workouts", {
							method: "PUT",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								workoutId: editingWorkout._id,
								...formData,
							}),
						});

						if (!response.ok) {
							throw new Error("Failed to update workout");
						}

						await refreshWorkouts();
						showSnackbar("Trening je uspešno ažuriran!", "success");
					} else {
						showSnackbar("Offline mode - edit nije dostupan", "warning");
						return;
					}
				} else {
					// Za novi workout - koristi offline hook
					const result = await submitWorkout(formData);

					if (result.offline) {
						showSnackbar(
							"Trening sačuvan offline - sinhronizaće se kad se vrati internet",
							"warning"
						);
						// Ne dodajemo ručno u workouts - useEffect će to uraditi
					} else {
						await refreshWorkouts();
						showSnackbar("Trening je uspešno dodat!", "success");
					}
				}

				setShowForm(false);
				setEditingWorkout(null);
			} catch (error) {
				console.error("Error saving workout:", error);
				showSnackbar(
					error instanceof Error
						? error.message
						: "Greška pri čuvanju treninga",
					"error"
				);
			} finally {
				setIsLoading(false);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[editingWorkout, isOnline, submitWorkout]
	);

	const handleDeleteWorkout = useCallback(
		async (workoutId: string) => {
			// Pronađi workout da vidiš da li je offline
			const workout = workouts.find((w) => w._id === workoutId);

			if (workout && !workout.synced) {
				// Ovo je offline workout - obriši iz localStorage
				try {
					const storedPending = localStorage.getItem("pendingWorkouts");
					if (storedPending) {
						const pending = JSON.parse(storedPending);
						const updated = pending.filter((p: any) => p.id !== workoutId);
						localStorage.setItem("pendingWorkouts", JSON.stringify(updated));
					}

					// Ukloni iz lokalne liste
					setWorkouts((prev) => prev.filter((w) => w._id !== workoutId));
					showSnackbar("Offline trening je obrisan!", "success");
					return;
				} catch (error) {
					console.error("Greška pri brisanju offline workout:", error);
					showSnackbar("Greška pri brisanju treninga", "error");
					return;
				}
			}

			// Standardno brisanje online workout-a
			if (!isOnline) {
				showSnackbar("Brisanje nije dostupno offline", "warning");
				throw new Error("Offline mode - delete not available");
			}

			try {
				const response = await fetch(`/api/workouts?id=${workoutId}`, {
					method: "DELETE",
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to delete workout");
				}

				setWorkouts((prev) => prev.filter((w) => w._id !== workoutId));
				showSnackbar("Trening je uspešno obrisan!", "success");
			} catch (error) {
				console.error("Error deleting workout:", error);
				showSnackbar(
					error instanceof Error
						? error.message
						: "Greška pri brisanju treninga",
					"error"
				);
				throw error;
			}
		},
		[isOnline, workouts]
	);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	// Online/Offline status indicator
	const ConnectionStatus = () => {
		if (!isClient) return null;

		return (
			<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
				{isOnline ? (
					<>
						<Wifi color="success" />
						<Typography variant="body2" color="success.main">
							Online
						</Typography>
					</>
				) : (
					<>
						<WifiOff color="warning" />
						<Typography variant="body2" color="warning.main">
							Offline Mode
						</Typography>
					</>
				)}
				{pendingWorkouts.length > 0 && (
					<>
						<Typography variant="body2" color="warning.main">
							({pendingWorkouts.length} čeka sync)
						</Typography>
						{isOnline && (
							<IconButton
								size="small"
								onClick={handleManualSync}
								disabled={isSyncing}
								color="primary"
							>
								<Sync className={isSyncing ? "rotate" : ""} />
							</IconButton>
						)}
					</>
				)}
			</Box>
		);
	};

	return (
		<Box>
			{/* Connection Status */}
			<ConnectionStatus />

			{/* Header */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 4,
				}}
			>
				<Box>
					<Typography
						variant="h3"
						component="h1"
						gutterBottom
						fontWeight="bold"
					>
						Moji treninzi
					</Typography>
					<Typography variant="subtitle1" color="textSecondary">
						Pratite i upravljajte svojim treninzima
					</Typography>
				</Box>

				{!showForm && (
					<Badge badgeContent={pendingWorkouts.length} color="warning">
						<Button
							variant="contained"
							startIcon={<Add />}
							onClick={handleAddWorkout}
							size="large"
							sx={{
								px: 3,
								py: 1.5,
								fontSize: "1.1rem",
								boxShadow: 3,
								"&:hover": {
									boxShadow: 6,
									transform: "translateY(-2px)",
								},
								transition: "all 0.2s ease-in-out",
							}}
						>
							Dodaj trening
						</Button>
					</Badge>
				)}
			</Box>

			{/* Workout Form */}
			{showForm && (
				<WorkoutForm
					workout={editingWorkout || undefined}
					onSubmit={handleSubmitWorkout}
					onCancel={handleCancelForm}
					isLoading={isLoading}
				/>
			)}

			{/* Workout List */}
			{!showForm && (
				<WorkoutList
					workouts={workouts}
					onEdit={handleEditWorkout}
					onDelete={handleDeleteWorkout}
					isLoading={false}
				/>
			)}

			{/* Floating Action Button for Add */}
			{!showForm && (
				<HideOnScroll>
					<Badge badgeContent={pendingWorkouts.length} color="warning">
						<Fab
							color="primary"
							aria-label="add workout"
							sx={{
								position: "fixed",
								bottom: 80,
								right: 16,
								zIndex: 1000,
								boxShadow: 6,
								"&:hover": {
									boxShadow: 8,
									transform: "scale(1.05)",
								},
								transition: "all 0.2s ease-in-out",
							}}
							onClick={handleAddWorkout}
						>
							<Add />
						</Fab>
					</Badge>
				</HideOnScroll>
			)}

			{/* Scroll to top button */}
			<Fab
				size="medium"
				color="secondary"
				aria-label="scroll to top"
				sx={{
					position: "fixed",
					bottom: 16,
					right: 16,
					zIndex: 1000,
					opacity: 0.7,
					"&:hover": {
						opacity: 1,
						transform: "scale(1.05)",
					},
					transition: "all 0.2s ease-in-out",
				}}
				onClick={scrollToTop}
			>
				<KeyboardArrowUp />
			</Fab>

			{/* Snackbar for notifications */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
				anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
			>
				<Alert
					onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
					severity={snackbar.severity}
					sx={{ width: "100%" }}
					variant="filled"
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default WorkoutClient;
