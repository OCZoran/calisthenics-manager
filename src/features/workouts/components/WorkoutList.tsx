"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
	Box,
	Card,
	Typography,
	Button,
	Grid,
	Chip,
	IconButton,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Alert,
	CircularProgress,
	Stack,
	Divider,
	Paper,
	LinearProgress,
	Backdrop,
	useTheme,
	useMediaQuery,
	Tooltip,
} from "@mui/material";
import {
	Edit,
	Delete,
	ExpandMore,
	FitnessCenter,
	CalendarToday,
	CloudDone,
	CloudOff,
	Repeat,
	MonitorWeight,
	Add,
	Timeline,
	Analytics,
} from "@mui/icons-material";
import { Workout } from "@/global/interfaces/workout.interface";
import { TrainingPlan } from "@/global/interfaces/training-plan.interface";
import { DeleteWorkoutDialog } from "./DeleteWorkoutDialog";
import { WorkoutCard } from "./WorkoutCard";
import { EmptyWorkoutState } from "./EmptyWorkout";
import { WorkoutHeader } from "./WorkoutHeader";

interface WorkoutListProps {
	workouts: Workout[];
	onEdit: (workout: Workout) => void;
	onDelete: (workoutId: string) => Promise<void>;
	onCreateWorkout?: () => void;
	onCreatePlan?: () => void;
	trainingPlans?: TrainingPlan[];
	activePlan?: TrainingPlan | null;
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
	trainingPlans = [],
	activePlan,
}) => {
	const theme = useTheme();

	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		workout: Workout | null;
	}>({ open: false, workout: null });
	const [isDeleting, setIsDeleting] = useState(false);

	const hasTrainingPlans = trainingPlans.length > 0;
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

	if (workouts.length === 0) {
		return (
			<EmptyWorkoutState
				hasTrainingPlans={hasTrainingPlans}
				hasActivePlan={hasActivePlan}
				trainingPlans={trainingPlans}
				activePlan={activePlan}
				onCreatePlan={onCreatePlan}
				onCreateWorkout={onCreateWorkout}
			/>
		);
	}

	return (
		<Box>
			{hasActivePlan && (
				<Alert
					severity="info"
					sx={{ mb: 3 }}
					action={
						<Box sx={{ display: "flex", gap: 1 }}>
							<Chip
								label="AKTIVAN"
								color="success"
								size="small"
								icon={<Timeline />}
							/>
							{onCreateWorkout && (
								<Button
									variant="contained"
									size="small"
									startIcon={<Add />}
									onClick={onCreateWorkout}
								>
									Dodaj trening
								</Button>
							)}
						</Box>
					}
				>
					<Typography variant="subtitle1" fontWeight="bold">
						Aktivni plan: {activePlan?.name}
					</Typography>
					<Typography variant="body2">
						{activePlan?.description || "Nema opisa"}
					</Typography>
				</Alert>
			)}
			<WorkoutHeader
				workouts={workouts}
				filteredWorkoutsCount={filteredAndSortedWorkouts.length}
				workoutStats={workoutStats}
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

			<DeleteWorkoutDialog
				open={deleteDialog.open}
				isDeleting={isDeleting}
				onClose={() => setDeleteDialog({ open: false, workout: null })}
				onConfirm={handleDeleteConfirm}
			/>

			<Backdrop open={isDeleting} sx={{ zIndex: theme.zIndex.modal + 1 }}>
				<CircularProgress color="inherit" />
			</Backdrop>
		</Box>
	);
};

export default WorkoutList;
