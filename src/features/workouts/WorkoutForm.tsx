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
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { Workout } from "@/global/interfaces/workout.interface";

interface WorkoutFormProps {
	workout?: Workout;
	onSubmit: (workout: any) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
	workouts: Workout[]; // Dodajemo workouts prop
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
	workouts = [], // Default empty array
}) => {
	// Inicijalizuj sa default vrednostima da izbegneš undefined->defined problem
	const [formData, setFormData] = useState({
		date: workout?.date || new Date().toISOString().split("T")[0], // Default današnji datum
		type: workout?.type || "",
		notes: workout?.notes || "",
		synced: workout?.synced ?? true,
		exercises: workout?.exercises || [],
	});

	const [errors, setErrors] = useState<string[]>([]);
	const [expandedExercises, setExpandedExercises] = useState<number[]>([]);
	const [showCopyDialog, setShowCopyDialog] = useState(false);
	const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);

	// Ažuriraj form data kad se workout promeni
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

	// Kada se promeni tip treninga, pripremi listu dostupnih treninga za kopiranje
	useEffect(() => {
		if (formData.type && !workout) {
			// Samo za nove treninge
			const filteredWorkouts = workouts
				.filter((w) => w.type === formData.type && w.synced === true) // Samo sinhronizovane
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Najnoviji prvi
				.slice(0, 5); // Maksimalno 5 najnovijih

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
				sets: exercise.sets.map((set) => ({ ...set })), // Deep copy setova
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
			{ name: "", sets: [{ reps: 0, rest: 60 }] },
		];
		setFormData({ ...formData, exercises: newExercises });
		setExpandedExercises([...expandedExercises, newExercises.length - 1]);
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

	const addSet = (exerciseIndex: number) => {
		const newExercises = [...formData.exercises];
		newExercises[exerciseIndex].sets.push({ reps: 0, rest: 60 });
		setFormData({ ...formData, exercises: newExercises });
	};

	const removeSet = (exerciseIndex: number, setIndex: number) => {
		const newExercises = [...formData.exercises];
		newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter(
			(_, i) => i !== setIndex
		);
		setFormData({ ...formData, exercises: newExercises });
	};

	const updateSet = (
		exerciseIndex: number,
		setIndex: number,
		field: "reps" | "rest",
		value: number
	) => {
		const newExercises = [...formData.exercises];
		newExercises[exerciseIndex].sets[setIndex][field] = value;
		setFormData({ ...formData, exercises: newExercises });
	};

	const toggleExerciseExpansion = (index: number) => {
		if (expandedExercises.includes(index)) {
			setExpandedExercises(expandedExercises.filter((i) => i !== index));
		} else {
			setExpandedExercises([...expandedExercises, index]);
		}
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
				if (set.reps <= 0) {
					newErrors.push(
						`Set ${j + 1} vježbe ${i + 1} mora imati više od 0 ponavljanja`
					);
				}
				if (set.rest < 0) {
					newErrors.push(
						`Set ${j + 1} vježbe ${i + 1} ne može imati negativan odmor`
					);
				}
			});
		});

		setErrors(newErrors);
		return newErrors.length === 0;
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
								{/* Copy dugme - prikazuje se samo za nove treninge i kad je izabran tip */}
								{!workout && formData.type && availableWorkouts.length > 0 && (
									<Button
										variant="outlined"
										startIcon={<ContentCopy />}
										onClick={() => setShowCopyDialog(true)}
										color="secondary"
										size="small"
									>
										Kopiraj prethodni {formData.type.toUpperCase()}
									</Button>
								)}
								<Button
									variant="outlined"
									startIcon={<Add />}
									onClick={addExercise}
									color="primary"
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
										}}
									>
										<TextField
											label={`Naziv vježbe ${exerciseIndex + 1}`}
											value={exercise.name || ""} // Eksplicitno "" za kontroliran input
											onChange={(e) =>
												updateExercise(exerciseIndex, "name", e.target.value)
											}
											sx={{ flexGrow: 1, mr: 2 }}
											required
										/>
										<IconButton
											onClick={() => toggleExerciseExpansion(exerciseIndex)}
											color="primary"
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
										>
											<Delete />
										</IconButton>
									</Box>

									<Collapse in={expandedExercises.includes(exerciseIndex)}>
										<Divider sx={{ mb: 2 }} />
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												mb: 2,
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

										{(exercise.sets || []).map((set, setIndex) => (
											<Box
												key={setIndex}
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 2,
													mb: 1,
													p: 2,
													backgroundColor: "grey.50",
													borderRadius: 1,
												}}
											>
												<Chip
													label={`Set ${setIndex + 1}`}
													size="small"
													color="primary"
												/>
												<TextField
													type="number"
													label="Ponavljanja"
													value={set.reps || 0} // Default 0 za kontroliran input
													onChange={(e) =>
														updateSet(
															exerciseIndex,
															setIndex,
															"reps",
															parseInt(e.target.value) || 0
														)
													}
													inputProps={{ min: 0 }}
													sx={{ width: 120 }}
												/>
												<TextField
													type="number"
													label="Odmor (s)"
													value={set.rest || 60} // Default 60 za kontroliran input
													onChange={(e) =>
														updateSet(
															exerciseIndex,
															setIndex,
															"rest",
															parseInt(e.target.value) || 0
														)
													}
													inputProps={{ min: 0 }}
													sx={{ width: 120 }}
												/>
												{exercise.sets.length > 1 && (
													<IconButton
														size="small"
														onClick={() => removeSet(exerciseIndex, setIndex)}
														color="error"
													>
														<Delete />
													</IconButton>
												)}
											</Box>
										))}
									</Collapse>
								</CardContent>
							</Card>
						))}

						<Divider sx={{ my: 3 }} />

						<Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
							<Button
								variant="outlined"
								startIcon={<Cancel />}
								onClick={onCancel}
								disabled={isLoading}
							>
								Otkaži
							</Button>
							<Button
								type="submit"
								variant="contained"
								startIcon={<Save />}
								disabled={isLoading}
								size="large"
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
				PaperProps={{
					sx: { borderRadius: 3 },
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
							<Typography>
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
					>
						Otkaži
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default WorkoutForm;
