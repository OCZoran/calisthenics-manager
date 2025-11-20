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
	Chip,
	FormHelperText,
	Checkbox,
	FormControlLabel,
} from "@mui/material";
import {
	SaveOutlined,
	CancelOutlined,
	AddCircleOutline,
} from "@mui/icons-material";
import { ExerciseDefinition } from "@/global/interfaces/training-plan.interface";
import {
	ExerciseTag,
	getCategoryLabel,
	getTagLabel,
	MovementCategory,
} from "./exercise.interface";

interface ExerciseFormProps {
	onExerciseAdded: (exercise: ExerciseDefinition) => void;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({ onExerciseAdded }) => {
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		category: "" as MovementCategory | "",
		tags: [] as ExerciseTag[],
		isBodyweight: true,
		videoUrl: "",
		notes: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const categories: MovementCategory[] = ["pull", "push", "legs", "core"];
	const availableTags: ExerciseTag[] = [
		"cardio",
		"skills",
		"mobility",
		"flexibility",
	];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleInputChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		if (error) setError(null);
		if (success) setSuccess(null);
	};

	const handleTagToggle = (tag: ExerciseTag) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.includes(tag)
				? prev.tags.filter((t) => t !== tag)
				: [...prev.tags, tag],
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim() || !formData.category) {
			setError("Name and category are required");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/exercises", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name.trim(),
					description: formData.description.trim(),
					category: formData.category,
					tags: formData.tags,
					isBodyweight: formData.isBodyweight,
					videoUrl: formData.videoUrl.trim(),
					notes: formData.notes.trim(),
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error creating exercise");
			}

			const result = await response.json();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const newExercise: any = {
				_id: result.exerciseId,
				userId: "",
				name: formData.name.trim(),
				category: formData.category as MovementCategory,
				tags: formData.tags,
				isBodyweight: formData.isBodyweight,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			onExerciseAdded(newExercise);

			// Reset form
			setFormData({
				name: "",
				description: "",
				category: "",
				tags: [],
				isBodyweight: true,
				videoUrl: "",
				notes: "",
			});

			setSuccess("Exercise successfully created!");
		} catch (error) {
			console.error("Error creating exercise:", error);
			setError(
				error instanceof Error ? error.message : "Error creating exercise"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClear = () => {
		setFormData({
			name: "",
			description: "",
			category: "",
			tags: [],
			isBodyweight: true,
			videoUrl: "",
			notes: "",
		});
		setError(null);
		setSuccess(null);
	};

	const isFormValid = formData.name.trim() && formData.category;

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<AddCircleOutline sx={{ mr: 2, color: "primary.main" }} />
				<Typography variant="h5" component="h2" fontWeight="600">
					Add New Exercise
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
							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									required
									label="Exercise Name"
									placeholder="e.g., Pull-ups, Push-ups..."
									value={formData.name}
									onChange={(e) => handleInputChange("name", e.target.value)}
									inputProps={{ maxLength: 100 }}
									helperText={`${formData.name.length}/100 characters`}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<FormControl fullWidth required>
									<InputLabel>Movement Category</InputLabel>
									<Select
										value={formData.category}
										onChange={(e) =>
											handleInputChange("category", e.target.value)
										}
										label="Movement Category"
									>
										{categories.map((cat) => (
											<MenuItem key={cat} value={cat}>
												{getCategoryLabel(cat)}
											</MenuItem>
										))}
									</Select>
									<FormHelperText>Main movement category</FormHelperText>
								</FormControl>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<FormControlLabel
									control={
										<Checkbox
											checked={formData.isBodyweight}
											onChange={(e) =>
												handleInputChange("isBodyweight", e.target.checked)
											}
										/>
									}
									label="Bodyweight exercise"
								/>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<Typography variant="subtitle1" fontWeight="600" gutterBottom>
									Additional Tags
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ mb: 2 }}
								>
									Tags allow this exercise to appear in multiple training types
								</Typography>
								<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
									{availableTags.map((tag) => (
										<Chip
											key={tag}
											label={getTagLabel(tag)}
											onClick={() => handleTagToggle(tag)}
											color={
												formData.tags.includes(tag) ? "primary" : "default"
											}
											variant={
												formData.tags.includes(tag) ? "filled" : "outlined"
											}
											sx={{ cursor: "pointer" }}
										/>
									))}
								</Box>
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
										Clear Fields
									</Button>
									<Button
										type="submit"
										variant="contained"
										startIcon={<SaveOutlined />}
										disabled={isSubmitting || !isFormValid}
										size="large"
									>
										{isSubmitting ? "Saving..." : "Save Exercise"}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</form>
				</CardContent>
			</Card>

			{/* Preview card */}
			{formData.name.trim() && formData.category && (
				<Card elevation={1} sx={{ mt: 3, backgroundColor: "grey.50" }}>
					<CardContent>
						<Typography variant="h6" gutterBottom color="text.secondary">
							💪 Exercise Preview:
						</Typography>

						<Typography variant="h6" gutterBottom fontWeight="600">
							{formData.name}
						</Typography>

						<Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
							<Chip
								label={getCategoryLabel(formData.category)}
								color="primary"
								size="small"
							/>
							{formData.tags.map((tag) => (
								<Chip
									key={tag}
									label={getTagLabel(tag)}
									color="secondary"
									size="small"
								/>
							))}
							<Chip
								label={formData.isBodyweight ? "Bodyweight" : "Weighted"}
								variant="outlined"
								size="small"
							/>
						</Box>

						{formData.description.trim() && (
							<Typography variant="body2" sx={{ mt: 1 }}>
								{formData.description}
							</Typography>
						)}
					</CardContent>
				</Card>
			)}
		</Box>
	);
};

export default ExerciseForm;
