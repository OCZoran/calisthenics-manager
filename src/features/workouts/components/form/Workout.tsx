"use client";

import React, { useState, useEffect } from "react";
import {
	Box,
	Card,
	CardContent,
	TextField,
	Button,
	Typography,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	IconButton,
	Divider,
	Grid,
	Chip,
	Alert,
	Collapse,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	List,
	ListItemText,
	ListItemButton,
	useTheme,
	useMediaQuery,
	Stack,
	Paper,
	Tooltip,
} from "@mui/material";
import {
	Add,
	Delete,
	Save,
	Cancel,
	ExpandMore,
	ExpandLess,
	ContentCopy,
	Close,
	Event,
	Category,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { Workout } from "@/global/interfaces/workout.interface";
import { TrainingPlan } from "@/global/interfaces/training-plan.interface";
import { formatDate } from "@/global/utils/format-date";
import WorkoutAddSet from "./WorkoutAddSet";
import WorkoutFormHeader from "./WorkoutFormHeader";

interface WorkoutFormProps {
	workout?: Workout;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onSubmit: (workout: any) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
	workouts: Workout[];
	trainingPlans?: TrainingPlan[];
	activePlanId?: string;
}

const workoutTypes = [
	{ value: "push", label: "Push", color: "#FF6B6B" },
	{ value: "pull", label: "Pull", color: "#4ECDC4" },
	{ value: "legs", label: "Legs", color: "#45B7D1" },
	{ value: "upper", label: "Upper", color: "#96CEB4" },
	{ value: "lower", label: "Lower", color: "#FECA57" },
	{ value: "full-body", label: "Full Body", color: "#9B59B6" },
	{ value: "cardio", label: "Cardio", color: "#FF9F43" },
	{ value: "other", label: "Other", color: "#74B9FF" },
];

const WorkoutForm: React.FC<WorkoutFormProps> = ({
	workout,
	onSubmit,
	onCancel,
	isLoading = false,
	workouts = [],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	trainingPlans = [],
	activePlanId,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const [formData, setFormData] = useState({
		date: workout?.date || new Date().toISOString().split("T")[0],
		type: workout?.type || "",
		notes: workout?.notes || "",
		synced: workout?.synced ?? true,
		exercises: workout?.exercises || [],
		planId: workout?.planId || activePlanId || "",
	});

	const [errors, setErrors] = useState<string[]>([]);
	const [expandedExercises, setExpandedExercises] = useState<number[]>([]);
	const [showCopyDialog, setShowCopyDialog] = useState(false);
	const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);

	useEffect(() => {
		if (workout) {
			setFormData({
				date: workout.date || new Date().toISOString().split("T")[0],
				type: workout.type || "",
				notes: workout.notes || "",
				synced: workout.synced ?? true,
				exercises: workout.exercises || [],
				planId: workout.planId || activePlanId || "",
			});
			setExpandedExercises(workout.exercises?.map((_, index) => index) || []);
		}
	}, [workout, activePlanId]);

	useEffect(() => {
		if (formData.type && !workout) {
			const filteredWorkouts = workouts
				.filter((w) => w.type === formData.type && w.synced === true)
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
				.slice(0, 5);

			setAvailableWorkouts(filteredWorkouts);
		}
	}, [formData.type, workouts, workout]);

	const handleTypeChange = (newType: string) => {
		setFormData({ ...formData, type: newType });
	};

	const copyWorkout = (workoutToCopy: Workout) => {
		setFormData({
			...formData,
			exercises: workoutToCopy.exercises.map((exercise) => ({
				name: exercise.name,
				sets: exercise.sets.map((set) => ({
					reps: set.reps.toString(),
					rest: set.rest.toString(),
					weight: set.weight?.toString() || "",
				})),
			})),
			notes: `Kopirano iz treninga od ${format(
				parseISO(workoutToCopy.date),
				"dd.MM.yyyy"
			)}`,
		});
		setExpandedExercises(workoutToCopy.exercises.map((_, index) => index));
		setShowCopyDialog(false);
	};

	const addExercise = () => {
		const newExercises = [
			...formData.exercises,
			{ name: "", sets: [{ reps: "", rest: "", weight: "" }] },
		];
		setFormData({ ...formData, exercises: newExercises });
		setExpandedExercises([...expandedExercises, newExercises.length - 1]);
	};

	const addSet = (exerciseIndex: number) => {
		const newExercises = [...formData.exercises];
		const currentExercise = newExercises[exerciseIndex];

		let newSet = { reps: "", rest: "", weight: "" };

		if (currentExercise.sets.length > 0) {
			const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
			newSet = {
				reps: lastSet.reps || "",
				rest: lastSet.rest || "",
				weight: lastSet.weight || "",
			};
		}

		newExercises[exerciseIndex].sets.push(newSet);
		setFormData({ ...formData, exercises: newExercises });
	};

	const updateSet = (
		exerciseIndex: number,
		setIndex: number,
		field: "reps" | "rest" | "weight",
		value: string
	) => {
		const newExercises = [...formData.exercises];
		newExercises[exerciseIndex].sets[setIndex][field] = value;
		setFormData({ ...formData, exercises: newExercises });
	};

	const validateForm = () => {
		const newErrors: string[] = [];

		if (!formData.date) newErrors.push("Datum je obavezan");
		if (!formData.type) newErrors.push("Tip treninga je obavezan");
		if (formData.exercises.length === 0)
			newErrors.push("Dodajte barem jednu vježbu");

		formData.exercises.forEach((exercise, i) => {
			if (!exercise.name.trim()) {
				newErrors.push(`Naziv vježbe ${i + 1} je obavezan`);
			}
			if (exercise.sets.length === 0) {
				newErrors.push(`Vježba ${i + 1} mora imati barem jedan set`);
			}
			exercise.sets.forEach((set, j) => {
				const reps = parseInt(set.reps) || 0;
				const rest = parseInt(set.rest) || 0;
				const weight = set.weight ? parseFloat(set.weight) : null;

				if (!set.reps || reps <= 0) {
					newErrors.push(
						`Set ${j + 1} vježbe ${i + 1} mora imati broj ponavljanja veći od 0`
					);
				}
				if (set.rest && rest < 0) {
					newErrors.push(
						`Set ${j + 1} vježbe ${i + 1} ne može imati negativan odmor`
					);
				}
				if (weight !== null && weight < 0) {
					newErrors.push(
						`Set ${j + 1} vježbe ${i + 1} ne može imati negativnu težinu`
					);
				}
			});
		});

		setErrors(newErrors);
		return newErrors.length === 0;
	};

	const removeExercise = (index: number) => {
		const newExercises = formData.exercises.filter((_, i) => i !== index);
		setFormData({ ...formData, exercises: newExercises });
		setExpandedExercises(expandedExercises.filter((i) => i !== index));
	};

	const updateExercise = (index: number, field: string, value: string) => {
		const newExercises = [...formData.exercises];
		newExercises[index] = { ...newExercises[index], [field]: value };
		setFormData({ ...formData, exercises: newExercises });
	};

	const removeSet = (exerciseIndex: number, setIndex: number) => {
		const newExercises = [...formData.exercises];
		newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter(
			(_, i) => i !== setIndex
		);
		setFormData({ ...formData, exercises: newExercises });
	};

	const toggleExerciseExpansion = (index: number) => {
		if (expandedExercises.includes(index)) {
			setExpandedExercises(expandedExercises.filter((i) => i !== index));
		} else {
			setExpandedExercises([...expandedExercises, index]);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			await onSubmit(formData);
		} catch (error) {
			console.error("Error submitting workout:", error);
		}
	};

	const getWorkoutTypeColor = (type: string) => {
		return workoutTypes.find((wt) => wt.value === type)?.color || "#74B9FF";
	};

	return (
		<Box sx={{ maxWidth: 1200, mx: "auto" }}>
			{/* Header Card */}
			<WorkoutFormHeader
				workoutType={formData.type}
				workout={workout}
				exercisesCount={formData.exercises.length}
				getWorkoutTypeColor={getWorkoutTypeColor}
				workoutTypes={workoutTypes}
			/>

			{/* Main Form Card */}
			<Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
				<CardContent sx={{ p: { xs: 2, sm: 4 } }}>
					<Collapse in={errors.length > 0}>
						<Alert
							severity="error"
							sx={{
								mb: 3,
								borderRadius: 2,
								"& .MuiAlert-message": {
									width: "100%",
								},
							}}
						>
							<Stack spacing={0.5}>
								{errors.map((error, index) => (
									<Typography key={index} variant="body2">
										• {error}
									</Typography>
								))}
							</Stack>
						</Alert>
					</Collapse>

					<form onSubmit={handleSubmit}>
						{/* Basic Info Section */}
						<Box sx={{ mb: 4 }}>
							<Typography
								variant="h6"
								sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
							>
								<Event color="primary" />
								Osnovne informacije
							</Typography>
							<Grid container spacing={3}>
								<Grid size={{ xs: 12, md: 6 }}>
									<TextField
										fullWidth
										type="date"
										label="Datum treninga"
										value={formData.date}
										onChange={(e) =>
											setFormData({ ...formData, date: e.target.value })
										}
										InputLabelProps={{ shrink: true }}
										required
										sx={{
											"& .MuiOutlinedInput-root": {
												borderRadius: 2,
											},
										}}
									/>
								</Grid>

								<Grid size={{ xs: 12, md: 6 }}>
									<FormControl fullWidth required>
										<InputLabel>Tip treninga</InputLabel>
										<Select
											value={formData.type}
											label="Tip treninga"
											onChange={(e) => handleTypeChange(e.target.value)}
											sx={{
												borderRadius: 2,
											}}
										>
											{workoutTypes.map((type) => (
												<MenuItem key={type.value} value={type.value}>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
														}}
													>
														<Box
															sx={{
																width: 12,
																height: 12,
																borderRadius: "50%",
																backgroundColor: type.color,
															}}
														/>
														{type.label}
													</Box>
												</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>
							</Grid>
						</Box>

						<Divider sx={{ mb: 4 }} />

						{/* Exercises Section */}
						<Box sx={{ mb: 4 }}>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									mb: 3,
									flexWrap: "wrap",
									gap: 2,
								}}
							>
								<Typography
									variant="h6"
									sx={{ display: "flex", alignItems: "center", gap: 1 }}
								>
									<Category color="primary" />
									Vježbe{" "}
									{formData.exercises.length > 0 &&
										`(${formData.exercises.length})`}
								</Typography>
								<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
									{!workout &&
										formData.type &&
										availableWorkouts.length > 0 && (
											<Button
												variant="outlined"
												startIcon={<ContentCopy />}
												onClick={() => setShowCopyDialog(true)}
												sx={{
													borderRadius: 2,
													borderColor: "primary.main",
													"&:hover": {
														borderColor: "primary.dark",
														backgroundColor: "primary.50",
													},
												}}
												size={isMobile ? "small" : "medium"}
											>
												Kopiraj prethodni
											</Button>
										)}
									<Button
										variant="contained"
										startIcon={<Add />}
										onClick={addExercise}
										sx={{
											borderRadius: 2,
											boxShadow: 2,
											"&:hover": {
												boxShadow: 4,
											},
										}}
										size={isMobile ? "small" : "medium"}
									>
										Dodaj vježbu
									</Button>
								</Box>
							</Box>

							<Stack spacing={3}>
								{formData.exercises.map((exercise, exerciseIndex) => (
									<Paper
										key={exerciseIndex}
										elevation={0}
										sx={{
											border: "2px solid",
											borderColor: expandedExercises.includes(exerciseIndex)
												? "primary.main"
												: "grey.200",
											borderRadius: 3,
											overflow: "hidden",
											transition: "all 0.2s ease-in-out",
											"&:hover": {
												borderColor: "primary.main",
												boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
											},
										}}
									>
										<CardContent sx={{ p: 3 }}>
											{/* Exercise Header */}
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 2,
													mb: expandedExercises.includes(exerciseIndex) ? 3 : 0,
												}}
											>
												<Box sx={{ flexGrow: 1 }}>
													<TextField
														label={`Vježba ${exerciseIndex + 1}`}
														value={exercise.name || ""}
														onChange={(e) =>
															updateExercise(
																exerciseIndex,
																"name",
																e.target.value
															)
														}
														fullWidth
														required
														sx={{
															"& .MuiOutlinedInput-root": {
																borderRadius: 2,
																backgroundColor: "background.paper",
															},
														}}
														size={isMobile ? "small" : "medium"}
													/>
												</Box>
												<Box sx={{ display: "flex", gap: 1 }}>
													<Tooltip
														title={
															expandedExercises.includes(exerciseIndex)
																? "Skupi"
																: "Proširi"
														}
													>
														<IconButton
															onClick={() =>
																toggleExerciseExpansion(exerciseIndex)
															}
															color="primary"
															sx={{
																backgroundColor: "primary.50",
																"&:hover": {
																	backgroundColor: "primary.100",
																},
															}}
															size={isMobile ? "small" : "medium"}
														>
															{expandedExercises.includes(exerciseIndex) ? (
																<ExpandLess />
															) : (
																<ExpandMore />
															)}
														</IconButton>
													</Tooltip>
													<Tooltip title="Ukloni vježbu">
														<IconButton
															onClick={() => removeExercise(exerciseIndex)}
															color="error"
															sx={{
																backgroundColor: "error.50",
																"&:hover": {
																	backgroundColor: "error.100",
																},
															}}
															size={isMobile ? "small" : "medium"}
														>
															<Delete />
														</IconButton>
													</Tooltip>
												</Box>
											</Box>

											{/* Exercise Sets */}
											<Collapse in={expandedExercises.includes(exerciseIndex)}>
												<WorkoutAddSet
													exercise={exercise}
													exerciseIndex={exerciseIndex}
													isMobile={isMobile}
													addSet={addSet}
													updateSet={updateSet}
													removeSet={removeSet}
												/>
											</Collapse>
										</CardContent>
									</Paper>
								))}
							</Stack>
						</Box>

						<Divider sx={{ mb: 4 }} />

						{/* Action Buttons */}
						<Box
							sx={{
								display: "flex",
								gap: 2,
								justifyContent: "flex-end",
								flexDirection: { xs: "column", sm: "row" },
							}}
						>
							<Button
								variant="outlined"
								startIcon={<Cancel />}
								onClick={onCancel}
								disabled={isLoading}
								fullWidth={isMobile}
								size="large"
								sx={{
									borderRadius: 2,
									py: 1.5,
									borderColor: "grey.400",
									color: "grey.600",
									"&:hover": {
										borderColor: "grey.600",
										backgroundColor: "grey.50",
									},
								}}
							>
								Otkaži
							</Button>
							<Button
								type="submit"
								variant="contained"
								startIcon={<Save />}
								disabled={isLoading}
								size="large"
								fullWidth={isMobile}
								sx={{
									borderRadius: 2,
									py: 1.5,
									px: 4,
									boxShadow: 3,
									"&:hover": {
										boxShadow: 6,
									},
								}}
							>
								{isLoading ? "Čuvam..." : "Sačuvaj trening"}
							</Button>
						</Box>
					</form>
				</CardContent>
			</Card>

			{/* Copy Workout Dialog */}
			<Dialog
				open={showCopyDialog}
				onClose={() => setShowCopyDialog(false)}
				maxWidth="sm"
				fullWidth
				fullScreen={isMobile}
				PaperProps={{
					sx: {
						borderRadius: isMobile ? 0 : 3,
						m: isMobile ? 0 : 2,
					},
				}}
			>
				<DialogTitle>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
							<Box
								sx={{
									p: 1,
									borderRadius: 2,
									backgroundColor: "primary.main",
									color: "white",
									display: "flex",
								}}
							>
								<ContentCopy />
							</Box>
							<Box>
								<Typography variant="h6">
									Kopiraj{" "}
									{workoutTypes.find((wt) => wt.value === formData.type)?.label}{" "}
									trening
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Dostupno {availableWorkouts.length} treninga
								</Typography>
							</Box>
						</Box>
						<IconButton
							onClick={() => setShowCopyDialog(false)}
							size="small"
							sx={{
								backgroundColor: "grey.100",
								"&:hover": {
									backgroundColor: "grey.200",
								},
							}}
						>
							<Close />
						</IconButton>
					</Box>
				</DialogTitle>
				<DialogContent>
					<Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
						Izaberite trening koji želite kopirati. Sve vježbe, setovi i odmor
						će biti kopirani.
					</Typography>

					{availableWorkouts.length === 0 ? (
						<Alert severity="info" sx={{ borderRadius: 2 }}>
							Nema prethodnih{" "}
							{workoutTypes.find((wt) => wt.value === formData.type)?.label}{" "}
							treninga za kopiranje.
						</Alert>
					) : (
						<List sx={{ maxHeight: 400, overflow: "auto" }}>
							{availableWorkouts.map((w) => (
								<ListItemButton
									key={w._id}
									onClick={() => copyWorkout(w)}
									sx={{
										border: "2px solid",
										borderColor: "grey.200",
										borderRadius: 2,
										mb: 1.5,
										p: 2,
										"&:hover": {
											borderColor: "primary.main",
											backgroundColor: "primary.50",
										},
									}}
								>
									<ListItemText
										primary={
											<Box
												sx={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													mb: 1,
												}}
											>
												<Typography fontWeight="bold" variant="subtitle1">
													{formatDate(w.date)}
												</Typography>
												<Chip
													label={`${w.exercises.length} ${
														w.exercises.length === 1 ? "vježba" : "vježbi"
													}`}
													size="small"
													color="primary"
													variant="outlined"
												/>
											</Box>
										}
										secondary={
											<Box>
												<Typography
													variant="body2"
													color="textSecondary"
													sx={{ mb: 1 }}
												>
													{w.exercises
														.map((e) => e.name)
														.slice(0, 3)
														.join(", ")}
													{w.exercises.length > 3 &&
														` + ${w.exercises.length - 3} više`}
												</Typography>
												<Box sx={{ display: "flex", gap: 2 }}>
													<Typography variant="caption" color="textSecondary">
														<strong>Setovi:</strong>{" "}
														{w.exercises.reduce(
															(total, ex) => total + ex.sets.length,
															0
														)}
													</Typography>
													{w.notes && (
														<Typography variant="caption" color="textSecondary">
															<strong>Napomena</strong>
														</Typography>
													)}
												</Box>
											</Box>
										}
									/>
								</ListItemButton>
							))}
						</List>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
					<Button
						onClick={() => setShowCopyDialog(false)}
						sx={{ borderRadius: 2 }}
						fullWidth={isMobile}
					>
						Otkaži
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default WorkoutForm;
