"use client";

import React from "react";
import { Box, Paper, CardContent, Typography, Chip } from "@mui/material";
import { FitnessCenter } from "@mui/icons-material";
import { Exercise, Workout } from "@/global/interfaces/workout.interface";

interface WorkoutFormHeaderProps {
	workoutType: string;
	workout?: Workout;
	exercisesCount: number;
	getWorkoutTypeColor: (type: string) => string;
	workoutTypes: { value: string; label: string; color: string }[];
}

const WorkoutFormHeader: React.FC<WorkoutFormHeaderProps> = ({
	workoutType,
	workout,
	exercisesCount,
	getWorkoutTypeColor,
	workoutTypes,
}) => {
	const totalSets = (exercises: Exercise[]) =>
		exercises.reduce((total, ex) => total + ex.sets.length, 0);

	return (
		<Paper
			elevation={0}
			sx={{
				mb: 3,
				background: `linear-gradient(135deg, ${getWorkoutTypeColor(
					workoutType
				)}20, ${getWorkoutTypeColor(workoutType)}10)`,
				border: `2px solid ${getWorkoutTypeColor(workoutType)}40`,
				borderRadius: 3,
			}}
		>
			<CardContent sx={{ pb: 3 }}>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						flexWrap: "wrap",
						gap: 2,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<Box
							sx={{
								p: 1.5,
								borderRadius: 2,
								backgroundColor: getWorkoutTypeColor(workoutType),
								color: "white",
								display: "flex",
								alignItems: "center",
							}}
						>
							<FitnessCenter />
						</Box>
						<Box>
							<Typography variant="h4" fontWeight="bold" color="text.primary">
								{workout ? "Uredi trening" : "Novi trening"}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{exercisesCount > 0 &&
									`${exercisesCount} vježbi • ${totalSets(
										workout?.exercises || []
									)} setova`}
							</Typography>
						</Box>
					</Box>
					{workoutType && (
						<Chip
							label={
								workoutTypes.find((wt) => wt.value === workoutType)?.label ||
								workoutType
							}
							sx={{
								backgroundColor: getWorkoutTypeColor(workoutType),
								color: "white",
								fontWeight: "bold",
								fontSize: "0.875rem",
								px: 2,
								py: 1,
							}}
						/>
					)}
				</Box>
			</CardContent>
		</Paper>
	);
};

export default WorkoutFormHeader;
