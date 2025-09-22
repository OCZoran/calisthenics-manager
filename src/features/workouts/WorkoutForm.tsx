/* eslint-disable @typescript-eslint/no-explicit-any */
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
	Switch,
	FormControlLabel,
	Alert,
	Collapse,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	List,
	ListItem,
	ListItemText,
	ListItemButton,
	InputAdornment,
	useTheme,
	useMediaQuery,
	Stack,
} from "@mui/material";
import {
	Add,
	Delete,
	FitnessCenter,
	Save,
	Cancel,
	ExpandMore,
	ExpandLess,
	ContentCopy,
	Close,
	MonitorWeight,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { Workout } from "@/global/interfaces/workout.interface";

interface WorkoutFormProps {
	workout?: Workout;
	onSubmit: (workout: any) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
	workouts: Workout[];
}

const workoutTypes = [
	"push",
	"pull",
	"legs",
	"upper",
	"lower",
	"full-body",
	"cardio",
	"other",
];

const WorkoutForm: React.FC<WorkoutFormProps> = ({
	workout,
	onSubmit,
	onCancel,
	isLoading = false,
	workouts = [],
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.down("md"));

	// Updated initial state with weight field
	const [formData, setFormData] = useState({
		date: workout?.date || new Date().toISOString().split("T")[0],
		type: workout?.type || "",
		notes: workout?.notes || "",
		synced: workout?.synced ?? true,
		exercises: workout?.exercises || [],
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
			});
			setExpandedExercises(workout.exercises?.map((_, index) => index) || []);
		}
	}, [workout]);

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
					weight: set.weight?.toString() || "", // Handle optional weight
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

	const formatDate = (dateString: string) => {
		try {
			return format(parseISO(dateString), "dd.MM.yyyy");
		} catch {
			return dateString;
		}
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

		// Ako postoji prethodni set, kopiraj njegove vrednosti
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

	const updateExercise = (index: number, field: string, value: any) => {
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

	return (
		<>
			<Card sx={{ mb: 3, boxShadow: 3 }}>
				<CardContent>
					<Typography
						variant="h5"
						gutterBottom
						sx={{ display: "flex", alignItems: "center", mb: 3 }}
					>
						<FitnessCenter sx={{ mr: 1, color: "primary.main" }} />
						{workout ? "Uredi trening" : "Dodaj novi trening"}
					</Typography>

					<Collapse in={errors.length > 0}>
						<Alert severity="error" sx={{ mb: 2 }}>
							{errors.map((error, index) => (
								<div key={index}>{error}</div>
							))}
						</Alert>
					</Collapse>

					<form onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="date"
									label="Datum"
									value={formData.date}
									onChange={(e) =>
										setFormData({ ...formData, date: e.target.value })
									}
									InputLabelProps={{ shrink: true }}
									required
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<FormControl fullWidth required>
									<InputLabel>Tip treninga</InputLabel>
									<Select
										value={formData.type}
										label="Tip treninga"
										onChange={(e) => handleTypeChange(e.target.value)}
									>
										{workoutTypes.map((type) => (
											<MenuItem key={type} value={type}>
												{type.charAt(0).toUpperCase() + type.slice(1)}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<TextField
									fullWidth
									multiline
									rows={3}
									label="Napomene"
									value={formData.notes}
									onChange={(e) =>
										setFormData({ ...formData, notes: e.target.value })
									}
									placeholder="Kako se osjećaš, napomene o treningu..."
								/>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<FormControlLabel
									control={
										<Switch
											checked={formData.synced}
											onChange={(e) =>
												setFormData({ ...formData, synced: e.target.checked })
											}
										/>
									}
									label="Sinhronizovano"
								/>
							</Grid>
						</Grid>

						<Divider sx={{ my: 3 }} />

						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mb: 2,
								flexWrap: "wrap",
								gap: 2,
							}}
						>
							<Typography variant="h6">Vježbe</Typography>
							<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
								{!workout && formData.type && availableWorkouts.length > 0 && (
									<Button
										variant="outlined"
										startIcon={<ContentCopy />}
										onClick={() => setShowCopyDialog(true)}
										color="secondary"
										size={isMobile ? "small" : "medium"}
									>
										{isMobile
											? "Kopiraj"
											: `Kopiraj prethodni ${formData.type.toUpperCase()}`}
									</Button>
								)}
								<Button
									variant="outlined"
									startIcon={<Add />}
									onClick={addExercise}
									color="primary"
									size={isMobile ? "small" : "medium"}
								>
									Dodaj vježbu
								</Button>
							</Box>
						</Box>

						{formData.exercises.map((exercise, exerciseIndex) => (
							<Card
								key={exerciseIndex}
								variant="outlined"
								sx={{
									mb: 2,
									border: "2px solid",
									borderColor: "primary.light",
									backgroundColor: "background.paper",
								}}
							>
								<CardContent>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											mb: 2,
											gap: 1,
										}}
									>
										<TextField
											label={`Naziv vježbe ${exerciseIndex + 1}`}
											value={exercise.name || ""}
											onChange={(e) =>
												updateExercise(exerciseIndex, "name", e.target.value)
											}
											sx={{ flexGrow: 1 }}
											required
											size={isMobile ? "small" : "medium"}
										/>
										<Box sx={{ display: "flex", gap: 0.5 }}>
											<IconButton
												onClick={() => toggleExerciseExpansion(exerciseIndex)}
												color="primary"
												size={isMobile ? "small" : "medium"}
											>
												{expandedExercises.includes(exerciseIndex) ? (
													<ExpandLess />
												) : (
													<ExpandMore />
												)}
											</IconButton>
											<IconButton
												onClick={() => removeExercise(exerciseIndex)}
												color="error"
												size={isMobile ? "small" : "medium"}
											>
												<Delete />
											</IconButton>
										</Box>
									</Box>

									<Collapse in={expandedExercises.includes(exerciseIndex)}>
										<Divider sx={{ mb: 2 }} />
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												mb: 2,
												flexWrap: "wrap",
												gap: 1,
											}}
										>
											<Typography variant="subtitle1">
												Setovi ({exercise.sets?.length || 0})
											</Typography>
											<Button
												size="small"
												variant="outlined"
												startIcon={<Add />}
												onClick={() => addSet(exerciseIndex)}
											>
												Dodaj set
											</Button>
										</Box>

										<Stack spacing={1.5}>
											{(exercise.sets || []).map((set, setIndex) => (
												<Card
													key={setIndex}
													sx={{
														p: 2,
														backgroundColor: "grey.50",
														border: "1px solid",
														borderColor: "grey.200",
														borderRadius: 2,
													}}
												>
													<Box sx={{ mb: 1.5 }}>
														<Chip
															label={`Set ${setIndex + 1}`}
															size="small"
															color="primary"
															icon={<FitnessCenter />}
														/>
													</Box>

													<Grid container spacing={1.5} alignItems="center">
														{/* Reps field */}
														<Grid size={{ xs: 6, sm: 4, md: 3 }}>
															<TextField
																fullWidth
																type="number"
																label="Ponavljanja"
																value={set.reps || ""}
																onChange={(e) =>
																	updateSet(
																		exerciseIndex,
																		setIndex,
																		"reps",
																		e.target.value
																	)
																}
																inputProps={{ min: 0 }}
																size="small"
																required
															/>
														</Grid>

														{/* Weight field - optional */}
														<Grid size={{ xs: 6, sm: 4, md: 3 }}>
															<TextField
																fullWidth
																type="number"
																label="Težina (kg) - Opciono"
																value={set.weight || ""}
																onChange={(e) =>
																	updateSet(
																		exerciseIndex,
																		setIndex,
																		"weight",
																		e.target.value
																	)
																}
																inputProps={{
																	min: 0,
																	step: "0.5",
																}}
																size="small"
																InputProps={{
																	startAdornment: (
																		<InputAdornment position="start">
																			<MonitorWeight
																				sx={{
																					fontSize: 18,
																					color: "text.secondary",
																				}}
																			/>
																		</InputAdornment>
																	),
																}}
															/>
														</Grid>

														{/* Rest field */}
														<Grid size={{ xs: 8, sm: 4, md: 3 }}>
															<TextField
																fullWidth
																type="number"
																label="Odmor (s)"
																value={set.rest || ""}
																onChange={(e) =>
																	updateSet(
																		exerciseIndex,
																		setIndex,
																		"rest",
																		e.target.value
																	)
																}
																inputProps={{ min: 0 }}
																size="small"
															/>
														</Grid>

														{/* Delete button */}
														<Grid size={{ xs: 4, sm: 12, md: 3 }}>
															<Box
																sx={{
																	display: "flex",
																	justifyContent: {
																		xs: "flex-end",
																		sm: "flex-start",
																		md: "flex-end",
																	},
																	alignItems: "center",
																	height: "100%",
																}}
															>
																{exercise.sets.length > 1 && (
																	<IconButton
																		size="small"
																		onClick={() =>
																			removeSet(exerciseIndex, setIndex)
																		}
																		color="error"
																		sx={{
																			backgroundColor: "error.50",
																			"&:hover": {
																				backgroundColor: "error.100",
																			},
																		}}
																	>
																		<Delete />
																	</IconButton>
																)}
															</Box>
														</Grid>
													</Grid>

													{/* Set summary for mobile */}
													{isMobile && (
														<Box
															sx={{
																mt: 1,
																pt: 1,
																borderTop: "1px solid",
																borderColor: "grey.300",
															}}
														>
															<Typography
																variant="caption"
																color="text.secondary"
															>
																{set.reps} reps
																{set.weight && ` × ${set.weight}kg`}
																{set.rest && ` • ${set.rest}s odmor`}
															</Typography>
														</Box>
													)}
												</Card>
											))}
										</Stack>
									</Collapse>
								</CardContent>
							</Card>
						))}

						<Divider sx={{ my: 3 }} />

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
									minWidth: { sm: 200 },
								}}
							>
								{isLoading ? "Čuvam..." : "Sačuvaj trening"}
							</Button>
						</Box>
					</form>
				</CardContent>
			</Card>

			{/* Copy Dialog */}
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
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<ContentCopy color="primary" />
							<Typography variant={isMobile ? "h6" : "h6"}>
								Kopiraj {formData.type.toUpperCase()} trening
							</Typography>
						</Box>
						<IconButton onClick={() => setShowCopyDialog(false)} size="small">
							<Close />
						</IconButton>
					</Box>
				</DialogTitle>
				<DialogContent>
					<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
						Izaberite trening koji želite kopirati. Sve vježbe, setovi i odmor
						će biti kopirani.
					</Typography>

					{availableWorkouts.length === 0 ? (
						<Alert severity="info">
							Nema prethodnih {formData.type} treninga za kopiranje.
						</Alert>
					) : (
						<List sx={{ maxHeight: 300, overflow: "auto" }}>
							{availableWorkouts.map((w) => (
								<ListItemButton
									key={w._id}
									onClick={() => copyWorkout(w)}
									sx={{
										border: "1px solid",
										borderColor: "divider",
										borderRadius: 2,
										mb: 1,
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
												}}
											>
												<Typography fontWeight="medium">
													{formatDate(w.date)}
												</Typography>
												<Chip
													label={`${w.exercises.length} vježbi`}
													size="small"
													color="primary"
													variant="outlined"
												/>
											</Box>
										}
										secondary={
											<Box>
												<Typography variant="body2" color="textSecondary">
													{w.exercises
														.map((e) => e.name)
														.slice(0, 3)
														.join(", ")}
													{w.exercises.length > 3 && "..."}
												</Typography>
												<Typography variant="caption" color="textSecondary">
													Ukupno setova:{" "}
													{w.exercises.reduce(
														(total, ex) => total + ex.sets.length,
														0
													)}
												</Typography>
											</Box>
										}
									/>
								</ListItemButton>
							))}
						</List>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						onClick={() => setShowCopyDialog(false)}
						sx={{ borderRadius: 2 }}
						fullWidth={isMobile}
					>
						Otkaži
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default WorkoutForm;
