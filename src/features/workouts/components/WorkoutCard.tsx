"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
	Card,
	Grid,
	Box,
	Chip,
	IconButton,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Paper,
	Stack,
	Typography,
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
} from "@mui/icons-material";
import { Workout } from "@/global/interfaces/workout.interface";
import { formatDate } from "@/global/utils/format-date";

interface WorkoutCardProps {
	workout: Workout;
	onEdit: (workout: Workout) => void;
	onDelete: (workout: Workout) => void;
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

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
	workout,
	onEdit,
	onDelete,
}) => {
	const [expanded, setExpanded] = useState(false);

	const toggleAccordion = useCallback(() => {
		setExpanded((prev) => !prev);
	}, []);

	// Memoized calculations for better performance
	const workoutStats = useMemo(() => {
		const totalSets = workout.exercises.reduce(
			(total, ex) => total + ex.sets.length,
			0
		);
		const totalReps = workout.exercises.reduce(
			(total, ex) =>
				total + ex.sets.reduce((sum, set) => sum + Number(set.reps || 0), 0),
			0
		);
		const totalWeight = workout.exercises.reduce(
			(total, ex) =>
				total +
				ex.sets.reduce((sum, set) => sum + (Number(set.weight) || 0), 0),
			0
		);
		const totalRestTime = workout.exercises.reduce(
			(total, ex) =>
				total + ex.sets.reduce((sum, set) => sum + (Number(set.rest) || 0), 0),
			0
		);

		return { totalSets, totalReps, totalWeight, totalRestTime };
	}, [workout]);

	const handleEdit = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onEdit(workout);
		},
		[onEdit, workout]
	);

	const handleDelete = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onDelete(workout);
		},
		[onDelete, workout]
	);

	return (
		<Card
			elevation={0}
			sx={{
				position: "relative",
				border: "1px solid",
				borderColor: "divider",
				borderRadius: 2,
				transition: "all 0.2s ease-in-out",
				"&:hover": {
					borderColor: "primary.main",
					boxShadow: 1,
				},
			}}
		>
			<Accordion
				expanded={expanded}
				onChange={toggleAccordion}
				disableGutters
				sx={{
					boxShadow: "none",
					"&.Mui-expanded": { margin: 0 },
					"&:before": { display: "none" },
					"& .MuiAccordionSummary-root": {
						minHeight: 64,
						"&.Mui-expanded": { minHeight: 64 },
					},
				}}
			>
				<AccordionSummary
					expandIcon={<ExpandMore />}
					sx={{
						px: { xs: 2, sm: 3 },
						py: 1,
					}}
				>
					<Grid container alignItems="center" spacing={{ xs: 1, sm: 2 }}>
						{/* Date and Type - Always visible */}
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: { xs: 1, sm: 2 },
									flexWrap: "wrap",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<CalendarToday
										sx={{ fontSize: 18, color: "text.secondary" }}
									/>
									<Typography
										variant="subtitle1"
										fontWeight="600"
										color={expanded ? "primary.main" : "inherit"}
										sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
									>
										{formatDate(workout.date)}
									</Typography>
								</Box>
								<Chip
									label={workout.type.toUpperCase()}
									color={getWorkoutTypeColor(workout.type)}
									variant="filled"
									size="small"
									sx={{
										fontWeight: "600",
										fontSize: "0.75rem",
									}}
								/>
							</Box>
						</Grid>

						{/* Stats - Hidden on mobile when collapsed */}
						<Grid size={{ xs: 12, sm: 6, md: 6 }}>
							<Box
								sx={{
									display: "flex",
									gap: { xs: 0.5, sm: 1 },
									flexWrap: "wrap",
									alignItems: "center",
									justifyContent: {
										xs: "flex-start",
										sm: "flex-end",
										md: "flex-start",
									},
								}}
							>
								<Chip
									icon={<FitnessCenter sx={{ fontSize: "16px !important" }} />}
									label={`${workout.exercises.length}`}
									size="small"
									variant="outlined"
									sx={{ fontSize: "0.7rem" }}
								/>
								<Chip
									icon={<Repeat sx={{ fontSize: "16px !important" }} />}
									label={workoutStats.totalSets}
									size="small"
									variant="outlined"
									sx={{ fontSize: "0.7rem" }}
								/>
								{workoutStats.totalWeight > 0 && (
									<Chip
										icon={
											<MonitorWeight sx={{ fontSize: "16px !important" }} />
										}
										label={`${workoutStats.totalWeight}kg`}
										size="small"
										variant="outlined"
										color="success"
										sx={{ fontSize: "0.7rem" }}
									/>
								)}
							</Box>
						</Grid>

						{/* Actions */}
						<Grid size={{ xs: 12, sm: 12, md: 2 }}>
							<Box
								sx={{
									display: "flex",
									gap: 0.5,
									justifyContent: { xs: "space-between", md: "flex-end" },
									alignItems: "center",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
									{workout.synced ? (
										<Tooltip title="Sinhronizovano">
											<CloudDone sx={{ color: "success.main", fontSize: 18 }} />
										</Tooltip>
									) : (
										<Tooltip title="Offline">
											<CloudOff sx={{ color: "warning.main", fontSize: 18 }} />
										</Tooltip>
									)}
								</Box>

								<Box sx={{ display: "flex", gap: 0.5 }}>
									<Tooltip title="Uredi">
										<IconButton
											size="small"
											onClick={handleEdit}
											color="primary"
											sx={{ p: 0.5 }}
										>
											<Edit fontSize="small" />
										</IconButton>
									</Tooltip>
									<Tooltip title="Obriši">
										<IconButton
											size="small"
											onClick={handleDelete}
											color="error"
											sx={{ p: 0.5 }}
										>
											<Delete fontSize="small" />
										</IconButton>
									</Tooltip>
								</Box>
							</Box>
						</Grid>
					</Grid>
				</AccordionSummary>

				<AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
					{/* Quick Stats */}
					<Paper
						variant="outlined"
						sx={{
							p: 2,
							mb: 3,
							bgcolor: "grey.50",
						}}
					>
						<Grid container spacing={2}>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Box sx={{ textAlign: "center" }}>
									<Typography
										variant="h5"
										color="primary.main"
										fontWeight="600"
									>
										{workout.exercises.length}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Vježbe
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Box sx={{ textAlign: "center" }}>
									<Typography
										variant="h5"
										color="secondary.main"
										fontWeight="600"
									>
										{workoutStats.totalSets}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Setovi
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Box sx={{ textAlign: "center" }}>
									<Typography
										variant="h5"
										color="success.main"
										fontWeight="600"
									>
										{workoutStats.totalReps}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Ponavljanja
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Box sx={{ textAlign: "center" }}>
									<Typography
										variant="h5"
										color={
											workoutStats.totalWeight > 0
												? "warning.main"
												: "text.disabled"
										}
										fontWeight="600"
									>
										{workoutStats.totalWeight || 0}kg
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Težina
									</Typography>
								</Box>
							</Grid>
						</Grid>
					</Paper>

					{/* Exercises */}
					<Typography
						variant="h6"
						gutterBottom
						fontWeight="600"
						sx={{
							mb: 2,
							display: "flex",
							alignItems: "center",
							gap: 1,
							fontSize: { xs: "1.1rem", sm: "1.25rem" },
						}}
					>
						<FitnessCenter />
						Vježbe ({workout.exercises.length})
					</Typography>

					<Stack spacing={2}>
						{workout.exercises.map((exercise, exerciseIndex) => (
							<Paper
								key={exerciseIndex}
								variant="outlined"
								sx={{
									p: 2,
									bgcolor: "background.paper",
									transition: "all 0.2s ease",
									"&:hover": {
										bgcolor: "grey.50",
									},
								}}
							>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "flex-start",
										mb: 2,
										flexWrap: "wrap",
										gap: 1,
									}}
								>
									<Typography
										variant="subtitle1"
										fontWeight="600"
										sx={{
											flex: 1,
											fontSize: { xs: "0.95rem", sm: "1rem" },
										}}
									>
										{exercise.name}
									</Typography>
									<Chip
										label={`${exercise.sets.length} ${
											exercise.sets.length === 1 ? "set" : "setova"
										}`}
										size="small"
										color="primary"
										variant="outlined"
									/>
								</Box>

								{/* Sets Grid - Responsive */}
								<Box sx={{ mb: 2 }}>
									<Grid container spacing={1}>
										{exercise.sets.map((set, setIndex) => (
											<Grid key={setIndex} size={{ xs: 12, sm: 6, md: 4 }}>
												<Chip
													label={`Set ${setIndex + 1}: ${set.reps}${
														set.weight ? ` × ${set.weight}kg` : ""
													}${set.rest ? ` | ${set.rest}s` : ""}`}
													size="small"
													sx={{
														width: "100%",
														justifyContent: "flex-start",
														backgroundColor: "grey.100",
														borderColor: "grey.300",
														fontFamily: "monospace",
														fontSize: "0.7rem",
													}}
												/>
											</Grid>
										))}
									</Grid>
								</Box>

								{/* Exercise Summary */}
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										flexWrap: "wrap",
										gap: 1,
										pt: 1,
										borderTop: "1px solid",
										borderColor: "divider",
									}}
								>
									<Typography variant="body2" color="text.secondary">
										<strong>
											{exercise.sets.reduce(
												(total, set) => total + Number(set.reps || 0),
												0
											)}
										</strong>{" "}
										ukupno ponavljanja
									</Typography>
									{exercise.sets.some((set) => set.weight) && (
										<Typography
											variant="body2"
											color="success.main"
											fontWeight="500"
										>
											{exercise.sets.reduce(
												(total, set) => total + (Number(set.weight) || 0),
												0
											)}
											kg ukupno
										</Typography>
									)}
								</Box>
							</Paper>
						))}
					</Stack>
				</AccordionDetails>
			</Accordion>
		</Card>
	);
};
