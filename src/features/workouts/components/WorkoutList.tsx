"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
	Box,
	Typography,
	Button,
	Chip,
	Alert,
	CircularProgress,
	Stack,
	Backdrop,
	useTheme,
} from "@mui/material";
import { Add, Timeline, History, Visibility } from "@mui/icons-material";
import { Workout } from "@/global/interfaces/workout.interface";
import { TrainingPlan } from "@/global/interfaces/training-plan.interface";
import { DeleteWorkoutDialog } from "./DeleteWorkoutDialog";
import { WorkoutCard } from "./WorkoutCard";
import { WorkoutHeader } from "./WorkoutHeader";
import EnhancedWorkoutDashboard from "./WorkoutStatisticsDashboard";

type ViewMode = "current" | "history" | "all";

interface WorkoutListProps {
	workouts: Workout[];
	onEdit: (workout: Workout) => void;
	onDelete: (workoutId: string) => Promise<void>;
	onCreateWorkout?: () => void;
	onCreatePlan?: () => void;
	trainingPlans?: TrainingPlan[];
	activePlan?: TrainingPlan | null;
	viewMode?: ViewMode;
	planId?: string;
	planName?: string;
}

export const getWorkoutTypeColor = (type: string) => {
	const colors = {
		push: "primary",
		pull: "secondary",
		legs: "success",
		upper: "warning",
		lower: "error",
		"full-body": "info",
		cardio: "secondary",
	} as const;
	return colors[type as keyof typeof colors] || "default";
};

const WorkoutList: React.FC<WorkoutListProps> = ({
	workouts,
	onEdit,
	onDelete,
	onCreateWorkout,
	onCreatePlan,
	activePlan,
	viewMode = "current",
	planId,
	planName,
}) => {
	const theme = useTheme();

	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		workout: Workout | null;
	}>({ open: false, workout: null });
	const [isDeleting, setIsDeleting] = useState(false);

	const hasActivePlan = activePlan !== null;

	const workoutStats = useMemo(() => {
		return workouts.reduce(
			(stats, workout) => {
				const totalSets = workout.exercises.reduce(
					(sum, ex) => sum + ex.sets.length,
					0
				);
				const totalReps = workout.exercises.reduce(
					(sum, ex) =>
						sum + ex.sets.reduce((repSum, set) => repSum + Number(set.reps), 0),
					0
				);
				const totalWeight = workout.exercises.reduce(
					(sum, ex) =>
						sum +
						ex.sets.reduce(
							(weightSum, set) => weightSum + (Number(set.weight) || 0),
							0
						),
					0
				);

				return {
					totalWorkouts: stats.totalWorkouts + 1,
					totalSets: stats.totalSets + totalSets,
					totalReps: stats.totalReps + totalReps,
					totalWeight: stats.totalWeight + totalWeight,
					avgSetsPerWorkout: 0,
					avgRepsPerWorkout: 0,
				};
			},
			{
				totalWorkouts: 0,
				totalSets: 0,
				totalReps: 0,
				totalWeight: 0,
				avgSetsPerWorkout: 0,
				avgRepsPerWorkout: 0,
			}
		);
	}, [workouts]);

	workoutStats.avgSetsPerWorkout =
		workoutStats.totalWorkouts > 0
			? Math.round(workoutStats.totalSets / workoutStats.totalWorkouts)
			: 0;
	workoutStats.avgRepsPerWorkout =
		workoutStats.totalWorkouts > 0
			? Math.round(workoutStats.totalReps / workoutStats.totalWorkouts)
			: 0;

	const filteredAndSortedWorkouts = useMemo(() => {
		return [...workouts].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);
	}, [workouts]);

	const handleDeleteClick = useCallback((workout: Workout) => {
		setDeleteDialog({ open: true, workout });
	}, []);

	const handleDeleteConfirm = useCallback(async () => {
		if (!deleteDialog.workout?._id) return;

		setIsDeleting(true);
		try {
			await onDelete(deleteDialog.workout._id);
			setDeleteDialog({ open: false, workout: null });
		} catch (error) {
			console.error("Error deleting workout:", error);
		} finally {
			setIsDeleting(false);
		}
	}, [deleteDialog.workout, onDelete]);

	// Empty state message based on view mode
	const getEmptyStateMessage = () => {
		if (viewMode === "current" && !hasActivePlan) {
			return {
				title: "Nema aktivnog trening plana",
				subtitle: "Kreirajte novi plan da biste počeli sa treniranjem",
				showCreatePlan: true,
			};
		}

		if (viewMode === "current" && hasActivePlan) {
			return {
				title: "Još nema treninga u aktivnom planu",
				subtitle: `Dodajte prvi trening u plan "${activePlan?.name}"`,
				showCreateWorkout: true,
			};
		}

		if (viewMode === "history") {
			return {
				title: "Nema treninga u selektovanom planu",
				subtitle: planName
					? `Plan "${planName}" nema zabilježene treninge`
					: "Selektovani plan nema treninge",
				showCreatePlan: false,
			};
		}

		return {
			title: "Nema treninga",
			subtitle: "Počnite sa kreiranjem trening plana",
			showCreatePlan: true,
		};
	};

	const emptyState = getEmptyStateMessage();

	if (workouts.length === 0) {
		return (
			<Box sx={{ textAlign: "center", py: 8 }}>
				<Box sx={{ mb: 4 }}>
					{viewMode === "current" ? (
						<Timeline sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
					) : (
						<History sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
					)}
					<Typography variant="h5" gutterBottom fontWeight="bold">
						{emptyState.title}
					</Typography>
					<Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
						{emptyState.subtitle}
					</Typography>
				</Box>

				<Stack spacing={2} direction="row" justifyContent="center">
					{emptyState.showCreatePlan && onCreatePlan && (
						<Button
							variant="outlined"
							startIcon={<Timeline />}
							onClick={onCreatePlan}
							size="large"
						>
							Kreiraj trening plan
						</Button>
					)}
					{emptyState.showCreateWorkout && onCreateWorkout && (
						<Button
							variant="contained"
							startIcon={<Add />}
							onClick={onCreateWorkout}
							size="large"
						>
							Dodaj trening
						</Button>
					)}
				</Stack>
			</Box>
		);
	}

	// Alert message for different view modes
	const getViewModeAlert = () => {
		if (viewMode === "current" && hasActivePlan) {
			return null;
		}

		if (viewMode === "history" && planName) {
			return (
				<Alert
					severity="info"
					sx={{ mb: 3 }}
					icon={<History />}
					action={
						<Chip
							label="PREGLED"
							color="primary"
							size="small"
							icon={<Visibility />}
						/>
					}
				>
					<Typography variant="subtitle1" fontWeight="bold">
						Istorija: {planName}
					</Typography>
					<Typography variant="body2">
						Pregled prethodnih treninga - editovanje nije dostupno
					</Typography>
				</Alert>
			);
		}

		if (viewMode === "all") {
			return (
				<Alert
					severity="info"
					sx={{ mb: 3 }}
					icon={<Visibility />}
					action={
						<Chip
							label={`${workouts.length} TRENINGA`}
							color="secondary"
							size="small"
						/>
					}
				>
					<Typography variant="subtitle1" fontWeight="bold">
						Svi treninzi
					</Typography>
					<Typography variant="body2">
						Pregled svih treninga kroz sve planove
					</Typography>
				</Alert>
			);
		}

		return null;
	};

	return (
		<Box>
			{getViewModeAlert()}

			<WorkoutHeader
				workouts={workouts}
				filteredWorkoutsCount={filteredAndSortedWorkouts.length}
				workoutStats={workoutStats}
			/>
			<DeleteWorkoutDialog
				open={deleteDialog.open}
				isDeleting={isDeleting}
				onClose={() => setDeleteDialog({ open: false, workout: null })}
				onConfirm={handleDeleteConfirm}
			/>
			<Stack spacing={2}>
				{filteredAndSortedWorkouts.map((workout) => (
					<WorkoutCard
						key={workout._id}
						workout={workout}
						onEdit={onEdit}
						onDelete={() => handleDeleteClick(workout)}
					/>
				))}
			</Stack>

			{workouts.length > 0 && planId && (
				<Box sx={{ mt: 6 }}>
					<EnhancedWorkoutDashboard
						workouts={workouts}
						planId={planId}
						planName={planName}
					/>
				</Box>
			)}

			<Backdrop open={isDeleting} sx={{ zIndex: theme.zIndex.modal + 1 }}>
				<CircularProgress color="inherit" />
			</Backdrop>
		</Box>
	);
};

export default WorkoutList;
