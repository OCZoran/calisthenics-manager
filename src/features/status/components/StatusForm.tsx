"use client";

import React, { useState } from "react";
import {
	Box,
	Typography,
	TextField,
	Button,
	Card,
	CardContent,
	Alert,
	Grid,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	InputAdornment,
	Chip,
} from "@mui/material";
import {
	SaveOutlined,
	CancelOutlined,
	FitnessCenter,
	Timer,
	Repeat,
} from "@mui/icons-material";
import { StatusEntry } from "../interfaces/status.interface";

interface StatusFormProps {
	onEntryAdded: (entry: StatusEntry) => void;
	existingExercises: string[];
}

const StatusForm: React.FC<StatusFormProps> = ({
	onEntryAdded,
	existingExercises,
}) => {
	const [formData, setFormData] = useState({
		exerciseName: "",
		repetitions: "",
		weight: "",
		holdTime: "",
		unit: "kg" as "kg" | "lbs",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		// Clear messages when user starts typing
		if (error) setError(null);
		if (success) setSuccess(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.exerciseName.trim()) {
			setError("Ime vežbe je obavezno");
			return;
		}

		const hasReps = formData.repetitions.trim();
		const hasWeight = formData.weight.trim();
		const hasHold = formData.holdTime.trim();

		if (!hasReps && !hasWeight && !hasHold) {
			setError(
				"Morate uneti bar jedan od: ponavljanja, težina ili vreme držanja"
			);
			return;
		}

		if (hasHold && hasReps) {
			setError("Ne možete imati i ponavljanja i vreme držanja istovremeno");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const requestBody = {
				exerciseName: formData.exerciseName.trim(),
				repetitions: hasReps ? parseInt(formData.repetitions) : undefined,
				weight: hasWeight ? parseFloat(formData.weight) : undefined,
				holdTime: hasHold ? parseInt(formData.holdTime) : undefined,
				unit: formData.unit,
			};

			const response = await fetch("/api/status", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri kreiranju status unosa");
			}

			const newEntry = await response.json();
			onEntryAdded(newEntry);

			// Reset form
			setFormData({
				exerciseName: "",
				repetitions: "",
				weight: "",
				holdTime: "",
				unit: "kg",
			});

			setSuccess("Status unos je uspešno kreiran!");
		} catch (error) {
			console.error("Error creating status entry:", error);
			setError(
				error instanceof Error
					? error.message
					: "Greška pri kreiranju status unosa"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClear = () => {
		setFormData({
			exerciseName: "",
			repetitions: "",
			weight: "",
			holdTime: "",
			unit: "kg",
		});
		setError(null);
		setSuccess(null);
	};

	const isFormValid =
		formData.exerciseName.trim() &&
		(formData.repetitions.trim() ||
			formData.weight.trim() ||
			formData.holdTime.trim());

	const hasHoldTime = formData.holdTime.trim();

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<FitnessCenter sx={{ mr: 2, color: "primary.main" }} />
				<Typography variant="h5" component="h2" fontWeight="600">
					Dodaj novi status
				</Typography>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert severity="success" sx={{ mb: 3 }}>
					{success}
				</Alert>
			)}

			<Card elevation={2}>
				<CardContent sx={{ p: 4 }}>
					<form onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							<Grid size={{ xs: 12 }}>
								<TextField
									fullWidth
									label="Ime vežbe"
									placeholder="Npr. Pull-ups, Bench Press, Plank"
									value={formData.exerciseName}
									onChange={(e) =>
										handleInputChange("exerciseName", e.target.value)
									}
									inputProps={{ maxLength: 50 }}
									helperText={`${formData.exerciseName.length}/50 karaktera`}
									sx={{ mb: 2 }}
								/>

								{existingExercises.length > 0 && (
									<Box sx={{ mt: 1 }}>
										<Typography
											variant="body2"
											color="text.secondary"
											gutterBottom
										>
											Postojeće vežbe:
										</Typography>
										<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
											{existingExercises.slice(0, 10).map((exercise) => (
												<Chip
													key={exercise}
													label={exercise}
													size="small"
													onClick={() =>
														handleInputChange("exerciseName", exercise)
													}
													sx={{ cursor: "pointer" }}
												/>
											))}
										</Box>
									</Box>
								)}
							</Grid>

							<Grid size={{ xs: 12, md: hasHoldTime ? 12 : 6 }}>
								<TextField
									fullWidth
									type="number"
									label={
										hasHoldTime ? "Vreme držanja (sekunde)" : "Ponavljanja"
									}
									placeholder={hasHoldTime ? "60" : "10"}
									value={hasHoldTime ? formData.holdTime : formData.repetitions}
									onChange={(e) =>
										handleInputChange(
											hasHoldTime ? "holdTime" : "repetitions",
											e.target.value
										)
									}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												{hasHoldTime ? <Timer /> : <Repeat />}
											</InputAdornment>
										),
									}}
									inputProps={{ min: 1 }}
									disabled={hasHoldTime ? false : !!formData.holdTime.trim()}
									helperText={
										hasHoldTime
											? "Za statičke vežbe (plank, hold pozicije)"
											: formData.holdTime.trim()
											? "Onemogućeno jer je uneto vreme držanja"
											: "Za dinamičke vežbe"
									}
									sx={{ mb: 2 }}
								/>
							</Grid>

							{!hasHoldTime && (
								<Grid size={{ xs: 12, md: 6 }}>
									<TextField
										fullWidth
										type="number"
										label="Težina"
										placeholder="70"
										value={formData.weight}
										onChange={(e) =>
											handleInputChange("weight", e.target.value)
										}
										InputProps={{
											endAdornment: (
												<InputAdornment position="end">
													{formData.unit}
												</InputAdornment>
											),
										}}
										inputProps={{ min: 0, step: 0.5 }}
										helperText="Opciono - dodajte težinu ako koristite dodatni teret"
										sx={{ mb: 2 }}
									/>
								</Grid>
							)}

							<Grid size={{ xs: 12, md: hasHoldTime ? 12 : 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Vreme držanja (sekunde)"
									placeholder="60"
									value={formData.holdTime}
									onChange={(e) =>
										handleInputChange("holdTime", e.target.value)
									}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Timer />
											</InputAdornment>
										),
									}}
									inputProps={{ min: 1 }}
									disabled={!!formData.repetitions.trim()}
									helperText={
										formData.repetitions.trim()
											? "Onemogućeno jer su uneta ponavljanja"
											: "Za statičke vežbe (plank, hold pozicije)"
									}
									sx={{ mb: 2 }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<FormControl fullWidth sx={{ mb: 2 }}>
									<InputLabel>Jedinica</InputLabel>
									<Select
										value={formData.unit}
										label="Jedinica"
										onChange={(e) =>
											handleInputChange("unit", e.target.value as string)
										}
									>
										<MenuItem value="kg">Kilogrami (kg)</MenuItem>
										<MenuItem value="lbs">Funte (lbs)</MenuItem>
									</Select>
								</FormControl>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<Box
									sx={{
										display: "flex",
										gap: 2,
										justifyContent: "flex-end",
									}}
								>
									<Button
										startIcon={<CancelOutlined />}
										onClick={handleClear}
										disabled={isSubmitting}
										color="inherit"
									>
										Obriši polja
									</Button>
									<Button
										type="submit"
										variant="contained"
										startIcon={<SaveOutlined />}
										disabled={isSubmitting || !isFormValid}
										size="large"
									>
										{isSubmitting ? "Čuvanje..." : "Sačuvaj status"}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</form>
				</CardContent>
			</Card>

			{/* Preview card if there's content */}
			{formData.exerciseName.trim() && isFormValid && (
				<Card elevation={1} sx={{ mt: 3, backgroundColor: "grey.50" }}>
					<CardContent>
						<Typography variant="h6" gutterBottom color="text.secondary">
							💪 Pregled statusa:
						</Typography>

						<Typography variant="h6" gutterBottom fontWeight="600">
							{formData.exerciseName}
						</Typography>

						<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
							{formData.repetitions.trim() && (
								<Chip
									icon={<Repeat />}
									label={`${formData.repetitions} ponavljanja`}
									color="primary"
									variant="outlined"
								/>
							)}
							{formData.weight.trim() && (
								<Chip
									label={`${formData.weight} ${formData.unit}`}
									color="secondary"
									variant="outlined"
								/>
							)}
							{formData.holdTime.trim() && (
								<Chip
									icon={<Timer />}
									label={`${formData.holdTime}s držanje`}
									color="info"
									variant="outlined"
								/>
							)}
						</Box>
					</CardContent>
				</Card>
			)}
		</Box>
	);
};

export default StatusForm;
