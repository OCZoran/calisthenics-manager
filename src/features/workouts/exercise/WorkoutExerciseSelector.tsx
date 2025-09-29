"use client";

import React, { useState, useEffect } from "react";
import {
	Box,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Typography,
	Divider,
	Alert,
	CircularProgress,
} from "@mui/material";
import { ExerciseDefinition } from "@/global/interfaces/training-plan.interface";
import {
	ExerciseGroup,
	getWorkoutTypeLabel,
	groupExercisesForWorkoutType,
	WorkoutType,
} from "./exercise.interface";

interface WorkoutExerciseSelectorProps {
	workoutType: WorkoutType;
	selectedExercise: string;
	onExerciseChange: (exerciseName: string) => void;
	disabled?: boolean;
}

const WorkoutExerciseSelector: React.FC<WorkoutExerciseSelectorProps> = ({
	workoutType,
	selectedExercise,
	onExerciseChange,
	disabled = false,
}) => {
	const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);

	useEffect(() => {
		fetchExercises();
	}, []);

	useEffect(() => {
		if (exercises.length > 0) {
			const groups = groupExercisesForWorkoutType(exercises, workoutType);
			setExerciseGroups(groups);
		}
	}, [exercises, workoutType]);

	const fetchExercises = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/exercises");

			if (!response.ok) {
				throw new Error("Greška pri učitavanju vježbi");
			}

			const data = await response.json();
			setExercises(data.exercises || []);
		} catch (error) {
			console.error("Error fetching exercises:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri učitavanju vježbi"
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
				<CircularProgress size={24} />
			</Box>
		);
	}

	if (error) {
		return (
			<Alert severity="error" sx={{ mb: 2 }}>
				{error}
			</Alert>
		);
	}

	if (exerciseGroups.length === 0) {
		return (
			<Alert severity="warning" sx={{ mb: 2 }}>
				Nema dostupnih vježbi za tip treninga:{" "}
				<strong>{getWorkoutTypeLabel(workoutType)}</strong>. Dodajte vježbe u
				bazu.
			</Alert>
		);
	}

	return (
		<FormControl fullWidth disabled={disabled}>
			<InputLabel>Odaberi vježbu</InputLabel>
			<Select
				value={selectedExercise}
				onChange={(e) => onExerciseChange(e.target.value)}
				label="Odaberi vježbu"
			>
				<MenuItem value="">
					<em>-- Odaberi vježbu --</em>
				</MenuItem>

				{exerciseGroups.map((group, groupIndex) => [
					// Group header
					<MenuItem
						key={`header-${groupIndex}`}
						disabled
						sx={{
							opacity: 1,
							backgroundColor: group.isSpecial
								? "secondary.light"
								: "primary.light",
							fontWeight: "bold",
							color: "white",
							"&.Mui-disabled": {
								opacity: 1,
							},
						}}
					>
						{group.label}
					</MenuItem>,

					// Group exercises
					...group.exercises.map((exercise) => (
						<MenuItem key={exercise._id} value={exercise.name} sx={{ pl: 4 }}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Typography>{exercise.name}</Typography>
								{exercise.isBodyweight && (
									<Typography
										variant="caption"
										sx={{
											ml: 1,
											px: 0.5,
											backgroundColor: "grey.200",
											borderRadius: 0.5,
										}}
									>
										BW
									</Typography>
								)}
								{exercise.tags.length > 0 && (
									<Typography
										variant="caption"
										sx={{
											ml: 0.5,
											px: 0.5,
											backgroundColor: "secondary.light",
											color: "white",
											borderRadius: 0.5,
										}}
									>
										{exercise.tags[0]}
									</Typography>
								)}
							</Box>
						</MenuItem>
					)),

					// Divider between groups (except last)
					groupIndex < exerciseGroups.length - 1 && (
						<Divider key={`divider-${groupIndex}`} />
					),
				])}
			</Select>
		</FormControl>
	);
};

export default WorkoutExerciseSelector;
