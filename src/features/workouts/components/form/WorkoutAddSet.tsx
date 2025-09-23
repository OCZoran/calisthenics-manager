"use client";

import React from "react";
import {
	Box,
	Grid,
	TextField,
	IconButton,
	Button,
	Stack,
	Paper,
	InputAdornment,
	Typography,
	Tooltip,
	Chip,
} from "@mui/material";
import {
	Add,
	Delete,
	Repeat,
	MonitorWeight,
	Timer,
	FitnessCenter,
} from "@mui/icons-material";

interface Set {
	reps: string;
	weight?: string;
	rest?: string;
}

interface Exercise {
	name: string;
	sets: Set[];
}

interface WorkoutAddSetProps {
	exercise: Exercise;
	exerciseIndex: number;
	isMobile?: boolean;
	addSet: (exerciseIndex: number) => void;
	updateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: "reps" | "weight" | "rest",
		value: string
	) => void;
	removeSet: (exerciseIndex: number, setIndex: number) => void;
}

const WorkoutAddSet: React.FC<WorkoutAddSetProps> = ({
	exercise,
	exerciseIndex,
	isMobile = false,
	addSet,
	updateSet,
	removeSet,
}) => {
	return (
		<Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 3,
				}}
			>
				<Typography variant="subtitle1" fontWeight="medium">
					Setovi
				</Typography>
				<Button
					size="small"
					variant="outlined"
					startIcon={<Add />}
					onClick={() => addSet(exerciseIndex)}
					sx={{ borderRadius: 2 }}
				>
					Dodaj set
				</Button>
			</Box>

			<Stack spacing={2}>
				{exercise.sets.map((set, setIndex) => (
					<Paper
						key={setIndex}
						sx={{
							p: 2.5,
							backgroundColor: "grey.50",
							border: "1px solid",
							borderColor: "grey.200",
							borderRadius: 2,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								mb: 2,
							}}
						>
							<Chip
								label={`Set ${setIndex + 1}`}
								size="small"
								color="primary"
								icon={<FitnessCenter />}
							/>
							{exercise.sets.length > 1 && (
								<Tooltip title="Ukloni set">
									<IconButton
										size="small"
										onClick={() => removeSet(exerciseIndex, setIndex)}
										color="error"
										sx={{
											backgroundColor: "error.50",
											"&:hover": { backgroundColor: "error.100" },
										}}
									>
										<Delete fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
						</Box>

						<Grid container spacing={2} alignItems="center">
							<Grid size={{ xs: 12, sm: 4 }}>
								<TextField
									fullWidth
									type="number"
									label="Ponavljanja"
									value={set.reps || ""}
									onChange={(e) =>
										updateSet(exerciseIndex, setIndex, "reps", e.target.value)
									}
									inputProps={{ min: 0 }}
									size="small"
									required
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Repeat
													sx={{ fontSize: 18, color: "text.secondary" }}
												/>
											</InputAdornment>
										),
									}}
									sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
								/>
							</Grid>

							<Grid size={{ xs: 12, sm: 4 }}>
								<TextField
									fullWidth
									type="number"
									label="Težina (kg)"
									value={set.weight || ""}
									onChange={(e) =>
										updateSet(exerciseIndex, setIndex, "weight", e.target.value)
									}
									inputProps={{ min: 0, step: "0.5" }}
									size="small"
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<MonitorWeight
													sx={{ fontSize: 18, color: "text.secondary" }}
												/>
											</InputAdornment>
										),
									}}
									sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
								/>
							</Grid>

							<Grid size={{ xs: 12, sm: 4 }}>
								<TextField
									fullWidth
									type="number"
									label="Odmor (s)"
									value={set.rest || ""}
									onChange={(e) =>
										updateSet(exerciseIndex, setIndex, "rest", e.target.value)
									}
									inputProps={{ min: 0 }}
									size="small"
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Timer sx={{ fontSize: 18, color: "text.secondary" }} />
											</InputAdornment>
										),
									}}
									sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
								/>
							</Grid>
						</Grid>

						{isMobile && (
							<Box
								sx={{
									mt: 2,
									pt: 2,
									borderTop: "1px solid",
									borderColor: "grey.300",
								}}
							>
								<Typography variant="caption" color="text.secondary">
									{set.reps} ponavljanja
									{set.weight && ` × ${set.weight}kg`}
									{set.rest && ` • ${set.rest}s odmor`}
								</Typography>
							</Box>
						)}
					</Paper>
				))}
			</Stack>
		</Box>
	);
};

export default WorkoutAddSet;
