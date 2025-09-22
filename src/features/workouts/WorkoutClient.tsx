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
import axiosInstance from "@/services/axios-public.instance";

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

	const {
		isOnline,
		pendingWorkouts,
		submitWorkout,
		manualSync,
		isClient,
		onSyncComplete,
		updateOfflineWorkout,
	} = useOfflineWorkouts();

	useEffect(() => {
		const unregister = onSyncComplete(() => {
			console.log("Sync završen - refreshujemo workouts");
			refreshWorkouts();
		});

		return unregister;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (pendingWorkouts.length > 0 && isClient) {
			console.log("Dodajem offline workouts u listu:", pendingWorkouts);

			const offlineWorkouts: Workout[] = pendingWorkouts.map((pending) => ({
				_id: pending.id,
				userId: pending.id,
				...pending.data,
				createdAt: new Date(pending.timestamp),
				updatedAt: new Date(pending.timestamp),
				synced: false,
			}));

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
			const { data } = await axiosInstance.get(
				`/api/workouts?t=${Date.now()}`,
				{
					withCredentials: true,
					headers: { "Cache-Control": "no-cache" },
				}
			);
			console.log("Učitao workouts sa servera:", data.workouts.length);

			if (pendingWorkouts.length > 0) {
				const offlineWorkouts: Workout[] = pendingWorkouts.map((pending) => ({
					_id: pending.id,
					userId: pending.id,
					...pending.data,
					createdAt: new Date(pending.timestamp),
					updatedAt: new Date(pending.timestamp),
					synced: false,
				}));

				setWorkouts([...offlineWorkouts, ...data.workouts]);
			} else {
				setWorkouts(data.workouts);
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
					if (editingWorkout.synced && isOnline) {
						await axiosInstance.put("/api/workouts", {
							workoutId: editingWorkout._id,
							...formData,
						});

						await refreshWorkouts();
						showSnackbar("Trening je uspešno ažuriran!", "success");
					} else if (!editingWorkout.synced) {
						if (!editingWorkout._id) {
							showSnackbar(
								"Greška: Nedostaje ID treninga za offline ažuriranje",
								"error"
							);
							return;
						}
						const success = updateOfflineWorkout(editingWorkout._id, formData);

						if (success) {
							setWorkouts((prev) =>
								prev.map((w) =>
									w._id === editingWorkout._id
										? {
												...w,
												...formData,
												exercises: formData.exercises.map((ex) => ({
													...ex,
													sets: ex.sets.map((set) => ({
														reps: set.reps.toString(),
														rest: set.rest.toString(),
													})),
												})),
												updatedAt: new Date(),
										  }
										: w
								)
							);
							showSnackbar("Offline trening je ažuriran!", "success");
						} else {
							showSnackbar("Greška pri ažuriranju offline treninga", "error");
							return;
						}
					} else {
						showSnackbar(
							"Editovanje sinhronizovanih treninga nije dostupno offline",
							"warning"
						);
						return;
					}
				} else {
					const result = await submitWorkout(formData);

					if (result.offline) {
						showSnackbar(
							"Trening sačuvan offline - sinhronizaće se kad se vrati internet",
							"warning"
						);
					} else {
						await refreshWorkouts();
						showSnackbar("Trening je uspešno dodat!", "success");
					}
				}

				setShowForm(false);
				setEditingWorkout(null);
			} catch (error: any) {
				console.error("Error saving workout:", error);
				showSnackbar(
					error.response?.data?.message ||
						error.message ||
						"Greška pri čuvanju treninga",
					"error"
				);
			} finally {
				setIsLoading(false);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[editingWorkout, isOnline, submitWorkout, updateOfflineWorkout]
	);

	const handleDeleteWorkout = useCallback(
		async (workoutId: string) => {
			const workout = workouts.find((w) => w._id === workoutId);

			if (workout && !workout.synced) {
				try {
					const storedPending = localStorage.getItem("pendingWorkouts");
					if (storedPending) {
						const pending = JSON.parse(storedPending);
						const updated = pending.filter((p: any) => p.id !== workoutId);
						localStorage.setItem("pendingWorkouts", JSON.stringify(updated));
					}
					setWorkouts((prev) => prev.filter((w) => w._id !== workoutId));
					showSnackbar("Offline trening je obrisan!", "success");
					return;
				} catch (error) {
					console.error("Greška pri brisanju offline workout:", error);
					showSnackbar("Greška pri brisanju treninga", "error");
					return;
				}
			}

			if (!isOnline) {
				showSnackbar("Brisanje nije dostupno offline", "warning");
				throw new Error("Offline mode - delete not available");
			}

			try {
				await axiosInstance.delete(`/api/workouts`, {
					params: { id: workoutId },
				});

				setWorkouts((prev) => prev.filter((w) => w._id !== workoutId));
				showSnackbar("Trening je uspešno obrisan!", "success");
			} catch (error: any) {
				console.error("Error deleting workout:", error);
				showSnackbar(
					error.response?.data?.message ||
						error.message ||
						"Greška pri brisanju treninga",
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
			<ConnectionStatus />

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

			{showForm && (
				<WorkoutForm
					workout={editingWorkout || undefined}
					onSubmit={handleSubmitWorkout}
					onCancel={handleCancelForm}
					isLoading={isLoading}
					workouts={workouts}
				/>
			)}

			{!showForm && (
				<WorkoutList
					workouts={workouts}
					onEdit={handleEditWorkout}
					onDelete={handleDeleteWorkout}
					isLoading={false}
				/>
			)}

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
