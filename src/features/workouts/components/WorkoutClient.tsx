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
	Badge,
	IconButton,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Tabs,
	Tab,
	Paper,
	Chip,
} from "@mui/material";
import {
	Add,
	KeyboardArrowUp,
	WifiOff,
	Wifi,
	Sync,
	Timeline,
	FitnessCenter,
	History,
	TrendingUp,
	FitnessCenterOutlined,
} from "@mui/icons-material";
import {
	Workout,
	WorkoutFormData,
} from "@/global/interfaces/workout.interface";
import WorkoutList from "./WorkoutList";
import WorkoutForm from "./form/Workout";
import { useOfflineWorkouts } from "@/features/OfflineManager";
import axiosInstance from "@/services/axios-public.instance";
import { TrainingPlan } from "@/global/interfaces/training-plan.interface";
import TrainingPlans from "./training-plan/TrainingPlan";
import ExerciseClient from "../exercise/ExerciseClient";

interface WorkoutClientProps {
	initialWorkouts: Workout[];
}

type ViewMode = "current" | "history" | "all";
type PlanManagerView = "plans" | "exercises"; // Novi tip za upravljanje viewom

const WorkoutClient = ({ initialWorkouts }: WorkoutClientProps) => {
	const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
	const [showForm, setShowForm] = useState(false);
	const [showPlanManager, setShowPlanManager] = useState(false);
	const [planManagerView, setPlanManagerView] =
		useState<PlanManagerView>("plans"); // Novi state
	const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error" | "warning";
	}>({ open: false, message: "", severity: "success" });
	const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
	const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);

	// State-ovi za plan filtering
	const [viewMode, setViewMode] = useState<ViewMode>("current");
	const [selectedPlanId, setSelectedPlanId] = useState<string>("");

	const {
		isOnline,
		pendingWorkouts,
		submitWorkout,
		manualSync,
		isClient,
		onSyncComplete,
		updateOfflineWorkout,
	} = useOfflineWorkouts();

	// Load training plans
	useEffect(() => {
		fetchTrainingPlans();
	}, []);

	// Automatski postavi selectedPlanId kada se učita aktivni plan
	useEffect(() => {
		if (activePlan && viewMode === "current") {
			setSelectedPlanId(activePlan._id || "");
		}
	}, [activePlan, viewMode]);

	const fetchTrainingPlans = async () => {
		try {
			const response = await axiosInstance.get("/api/training-plans", {
				withCredentials: true,
			});
			setTrainingPlans(response.data.plans || []);

			const active = response.data.plans?.find(
				(p: TrainingPlan) => p.status === "active"
			);
			setActivePlan(active || null);
		} catch (error) {
			console.error("Error fetching training plans:", error);
		}
	};

	const getFilteredWorkouts = useCallback(() => {
		switch (viewMode) {
			case "current":
				return activePlan
					? workouts.filter((w) => w.planId === activePlan._id)
					: [];
			case "history":
				return selectedPlanId
					? workouts.filter((w) => w.planId === selectedPlanId)
					: [];
			case "all":
				return workouts;
			default:
				return workouts;
		}
	}, [workouts, viewMode, activePlan, selectedPlanId]);

	const getCurrentPlanStats = useCallback(() => {
		const filteredWorkouts = getFilteredWorkouts();
		let currentPlan: TrainingPlan | null = null;
		if (viewMode === "current") {
			currentPlan = activePlan;
		} else if (viewMode === "history" && selectedPlanId) {
			currentPlan = trainingPlans.find((p) => p._id === selectedPlanId) || null;
		}

		return {
			plan: currentPlan,
			workouts: filteredWorkouts,
			planId: currentPlan?._id,
			planName: currentPlan?.name,
		};
	}, [
		getFilteredWorkouts,
		viewMode,
		activePlan,
		selectedPlanId,
		trainingPlans,
	]);

	const handleViewModeChange = (newMode: ViewMode) => {
		setViewMode(newMode);

		if (newMode === "current") {
			setSelectedPlanId(activePlan?._id || "");
		} else if (newMode === "history" && trainingPlans.length > 0) {
			const completedPlan = trainingPlans.find((p) => p.status === "completed");
			const planToSelect = completedPlan || trainingPlans[0];
			setSelectedPlanId(planToSelect._id || "");
		} else if (newMode === "all") {
			setSelectedPlanId("");
		}
	};

	const handlePlanSelectionChange = (planId: string) => {
		setSelectedPlanId(planId);
	};

	useEffect(() => {
		const unregister = onSyncComplete(() => {
			refreshWorkouts();
		});
		return unregister;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (pendingWorkouts.length > 0 && isClient) {
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
					return [...newWorkouts, ...prev];
				}
				return prev;
			});
		}
	}, [pendingWorkouts, isClient]);

	const refreshWorkouts = async () => {
		if (!isOnline) return;

		try {
			const { data } = await axiosInstance.get(
				`/api/workouts?t=${Date.now()}`,
				{
					withCredentials: true,
					headers: { "Cache-Control": "no-cache" },
				}
			);

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
		if (!activePlan) {
			setShowPlanManager(true);
			showSnackbar("Potrebno je prvo kreirati trening plan", "warning");
			return;
		}

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

	const handleCreatePlan = () => {
		setShowPlanManager(true);
		setPlanManagerView("plans"); // Postavi na plans view
	};

	const handleManageExercises = () => {
		setShowPlanManager(true);
		setPlanManagerView("exercises"); // Postavi na exercises view
	};

	const handleCreateWorkout = () => {
		if (!activePlan) {
			setShowPlanManager(true);
			showSnackbar("Potrebno je prvo kreirati aktivni trening plan", "warning");
			return;
		}
		handleAddWorkout();
	};

	const handlePlanSelect = () => {
		fetchTrainingPlans();
	};

	const handleClosePlanManager = () => {
		setShowPlanManager(false);
		setPlanManagerView("plans"); // Reset view
		fetchTrainingPlans();
		refreshWorkouts();
	};

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
														weight: set.weight?.toString() || "",
														hold: set.hold?.toString() || "",
														band: set.band?.toString() || "",
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

	const PlanSelector = () => {
		const completedPlans = trainingPlans.filter(
			(p) => p.status === "completed"
		);
		const { plan: currentPlan, workouts: filteredWorkouts } =
			getCurrentPlanStats();

		return (
			<Paper sx={{ p: 3, mb: 3 }}>
				<Box sx={{ mb: 2 }}>
					<Tabs
						value={viewMode}
						onChange={(_, newValue) => handleViewModeChange(newValue)}
						variant="scrollable"
						scrollButtons="auto"
						sx={{ borderBottom: 1, borderColor: "divider" }}
					>
						<Tab
							icon={<FitnessCenter />}
							iconPosition="start"
							label={
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									Aktivni plan
									{activePlan && (
										<Chip
											label="AKTIVAN"
											color="success"
											size="small"
											sx={{ ml: 1 }}
										/>
									)}
								</Box>
							}
							value="current"
						/>
						<Tab
							icon={<History />}
							iconPosition="start"
							label={
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									Istorija planova
									<Chip
										label={completedPlans.length}
										color="primary"
										size="small"
										sx={{ ml: 1 }}
									/>
								</Box>
							}
							value="history"
							disabled={completedPlans.length === 0}
						/>
						<Tab
							icon={<TrendingUp />}
							iconPosition="start"
							label={
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									Svi treninzi
									<Chip
										label={workouts.length}
										color="secondary"
										size="small"
										sx={{ ml: 1 }}
									/>
								</Box>
							}
							value="all"
						/>
					</Tabs>
				</Box>

				{viewMode === "current" && activePlan && (
					<Alert severity="info" sx={{ mt: 2 }}>
						<Typography variant="subtitle2" fontWeight="bold">
							Aktivni plan: {activePlan.name}
						</Typography>
						<Typography variant="body2">
							{activePlan.description || "Nema opisa"} | Treninzi:{" "}
							{filteredWorkouts.length}
						</Typography>
					</Alert>
				)}

				{viewMode === "current" && !activePlan && (
					<Alert severity="warning" sx={{ mt: 2 }}>
						<Typography variant="subtitle2" fontWeight="bold">
							Nema aktivnog plana
						</Typography>
						<Typography variant="body2">
							Kreirajte novi trening plan za početak treniranja.
						</Typography>
					</Alert>
				)}

				{viewMode === "history" && (
					<Box sx={{ mt: 2 }}>
						<FormControl fullWidth>
							<InputLabel>Izaberite plan za pregled</InputLabel>
							<Select
								value={selectedPlanId}
								onChange={(e) => handlePlanSelectionChange(e.target.value)}
								label="Izaberite plan za pregled"
							>
								{trainingPlans.map((plan) => (
									<MenuItem key={plan._id} value={plan._id}>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 2,
												width: "100%",
											}}
										>
											<Typography>{plan.name}</Typography>
											<Chip
												label={plan.status}
												color={
													plan.status === "completed" ? "success" : "warning"
												}
												size="small"
											/>
											<Typography
												variant="caption"
												color="text.secondary"
												sx={{ ml: "auto" }}
											>
												{workouts.filter((w) => w.planId === plan._id).length}{" "}
												treninga
											</Typography>
										</Box>
									</MenuItem>
								))}
							</Select>
						</FormControl>

						{currentPlan && (
							<Alert severity="info" sx={{ mt: 2 }}>
								<Typography variant="subtitle2" fontWeight="bold">
									{currentPlan.name} - {currentPlan.status}
								</Typography>
								<Typography variant="body2">
									{currentPlan.description || "Nema opisa"} | Treninzi:{" "}
									{filteredWorkouts.length}
									{currentPlan.startDate &&
										` | Početak: ${new Date(
											currentPlan.startDate
										).toLocaleDateString("sr-RS")}`}
									{currentPlan.endDate &&
										` | Završetak: ${new Date(
											currentPlan.endDate
										).toLocaleDateString("sr-RS")}`}
								</Typography>
							</Alert>
						)}
					</Box>
				)}

				{viewMode === "all" && (
					<Alert severity="info" sx={{ mt: 2 }}>
						<Typography variant="subtitle2" fontWeight="bold">
							Pregled svih treninga
						</Typography>
						<Typography variant="body2">
							Ukupno {workouts.length} treninga kroz sve planove
						</Typography>
					</Alert>
				)}
			</Paper>
		);
	};

	// Ako je showPlanManager aktivan, prikaži Plan Manager ili Exercise Manager
	if (showPlanManager) {
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
							{planManagerView === "plans" ? (
								<>
									<Timeline
										sx={{ mr: 2, color: "primary.main", fontSize: 32 }}
									/>
									Trening planovi
								</>
							) : (
								<>
									<FitnessCenterOutlined
										sx={{ mr: 2, color: "primary.main", fontSize: 32 }}
									/>
									Baza vježbi
								</>
							)}
						</Typography>
						<Typography variant="subtitle1" color="textSecondary">
							{planManagerView === "plans"
								? "Upravljajte svojim trening planovima"
								: "Kreirajte i upravljajte vašim vježbama"}
						</Typography>
					</Box>

					<Box sx={{ display: "flex", gap: 2 }}>
						{/* Tab switcher unutar Plan Manager-a */}
						<Button
							variant={planManagerView === "plans" ? "contained" : "outlined"}
							onClick={() => setPlanManagerView("plans")}
							startIcon={<Timeline />}
							size="large"
						>
							Planovi
						</Button>
						<Button
							variant={
								planManagerView === "exercises" ? "contained" : "outlined"
							}
							onClick={() => setPlanManagerView("exercises")}
							startIcon={<FitnessCenterOutlined />}
							size="large"
						>
							Vježbe
						</Button>
						<Button
							variant="outlined"
							onClick={handleClosePlanManager}
							size="large"
						>
							Nazad na treninge
						</Button>
					</Box>
				</Box>

				{/* Prikaži odgovarajući content */}
				{planManagerView === "plans" ? (
					<TrainingPlans onPlanSelect={handlePlanSelect} />
				) : (
					<ExerciseClient />
				)}
			</Box>
		);
	}

	const {
		plan: displayPlan,
		workouts: filteredWorkouts,
		planId,
		planName,
	} = getCurrentPlanStats();

	return (
		<Box>
			<ConnectionStatus />

			<Box
				sx={{
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					justifyContent: "space-between",
					alignItems: { xs: "flex-start", md: "center" },
					gap: { xs: 2, md: 0 },
					mb: 4,
				}}
			>
				<Box>
					<Typography
						variant="h3"
						component="h1"
						gutterBottom
						fontWeight="bold"
						sx={{
							fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem" },
							display: "flex",
							alignItems: "center",
							flexWrap: "wrap",
						}}
					>
						<FitnessCenter
							sx={{
								mr: 2,
								color: "primary.main",
								fontSize: { xs: 24, sm: 28, md: 32 },
							}}
						/>
						Moji treninzi
					</Typography>
					<Typography
						variant="subtitle1"
						color="textSecondary"
						sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
					>
						Pratite i upravljajte svojim treninzima
					</Typography>
				</Box>

				{!showForm && (
					<Box
						sx={{
							display: "flex",
							flexDirection: { xs: "column", sm: "row" },
							gap: 2,
							width: { xs: "100%", md: "auto" },
						}}
					>
						<Button
							variant="outlined"
							startIcon={<FitnessCenterOutlined />}
							onClick={handleManageExercises}
							size="large"
							fullWidth
							sx={{
								px: { xs: 2, sm: 3 },
								py: 1.5,
								fontSize: { xs: "1rem", sm: "1.1rem" },
							}}
						>
							Vježbe
						</Button>
						<Button
							variant="outlined"
							startIcon={<Timeline />}
							onClick={handleCreatePlan}
							size="large"
							fullWidth
							sx={{
								px: { xs: 2, sm: 3 },
								py: 1.5,
								fontSize: { xs: "1rem", sm: "1.1rem" },
							}}
						>
							Planovi
						</Button>
						<Badge badgeContent={pendingWorkouts.length} color="warning">
							<Button
								variant="contained"
								startIcon={<Add />}
								onClick={handleAddWorkout}
								size="large"
								disabled={!activePlan || viewMode !== "current"}
								fullWidth
								sx={{
									px: { xs: 2, sm: 3 },
									py: 1.5,
									fontSize: { xs: "1rem", sm: "1.1rem" },
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
					</Box>
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
				<>
					<PlanSelector />

					<WorkoutList
						workouts={filteredWorkouts}
						onEdit={handleEditWorkout}
						onDelete={handleDeleteWorkout}
						onCreateWorkout={
							viewMode === "current" ? handleCreateWorkout : undefined
						}
						onCreatePlan={handleCreatePlan}
						trainingPlans={trainingPlans}
						activePlan={displayPlan}
						viewMode={viewMode}
						// isHistoryMode={viewMode === "history" || viewMode === "all"}
						planId={planId}
						planName={planName}
					/>
				</>
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
