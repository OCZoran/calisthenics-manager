import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormControlLabel,
	Checkbox,
	Box,
	Typography,
	Chip,
	Alert,
	CircularProgress,
	IconButton,
} from "@mui/material";
import { Close, SaveOutlined, AddCircleOutline } from "@mui/icons-material";

const categories = [
	{ value: "pull", label: "Pull" },
	{ value: "push", label: "Push" },
	{ value: "legs", label: "Legs" },
	{ value: "core", label: "Core" },
];

const availableTags = [
	{ value: "cardio", label: "Cardio" },
	{ value: "skills", label: "Skills" },
	{ value: "mobility", label: "Mobility" },
	{ value: "flexibility", label: "Flexibility" },
];

type QuickAddExerciseDialogProps = {
	open: boolean;
	onClose: () => void;
	onExerciseAdded: (exercise: {
		_id: string;
		name: string;
		category: string;
		tags: string[];
		isBodyweight: boolean;
		type: string[];
		muscleGroups: any[];
	}) => void;
	workoutType?: string;
};

const QuickAddExerciseDialog = ({
	open,
	onClose,
	onExerciseAdded,
	workoutType,
}: QuickAddExerciseDialogProps) => {
	type QuickAddExerciseForm = {
		name: string;
		category: string;
		tags: string[];
		isBodyweight: boolean;
	};

	const [formData, setFormData] = useState<QuickAddExerciseForm>({
		name: "",
		category: workoutType || "",
		tags: [],
		isBodyweight: true,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		if (error) setError(null);
	};

	const handleTagToggle = (tag: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.includes(tag)
				? prev.tags.filter((t) => t !== tag)
				: [...prev.tags, tag],
		}));
	};

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();

		if (!formData.name.trim() || !formData.category) {
			setError("Name and category are required");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const response = await fetch("/api/exercises", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name.trim(),
					category: formData.category,
					tags: formData.tags,
					isBodyweight: formData.isBodyweight,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error creating exercise");
			}

			const result = await response.json();
			const newExercise = {
				_id: result.exerciseId,
				name: formData.name.trim(),
				category: formData.category,
				tags: formData.tags,
				isBodyweight: formData.isBodyweight,
				type: [formData.category, ...formData.tags],
				muscleGroups: [], // dodaj ovo
			};

			onExerciseAdded(newExercise);
			handleClose();
		} catch (error) {
			console.error("Error creating exercise:", error);
			setError("Error creating exercise");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setFormData({
			name: "",
			category: workoutType || "",
			tags: [],
			isBodyweight: true,
		});
		setError(null);
		onClose();
	};

	const isFormValid = formData.name.trim() && formData.category;

	return (
		<Dialog
			open={open}
			onClose={handleClose}
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
							<AddCircleOutline />
						</Box>
						<Box>
							<Typography variant="h6">Add New Exercise</Typography>
							<Typography variant="body2" color="text.secondary">
								Quickly create a new exercise for your workout
							</Typography>
						</Box>
					</Box>
					<IconButton
						onClick={handleClose}
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

			<form onSubmit={handleSubmit}>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
							{error}
						</Alert>
					)}

					<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
						<TextField
							fullWidth
							required
							label="Exercise Name"
							placeholder="e.g., Pull-ups, Push-ups..."
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							inputProps={{ maxLength: 100 }}
							helperText={`${formData.name.length}/100 characters`}
							autoFocus
							sx={{
								"& .MuiOutlinedInput-root": {
									borderRadius: 2,
								},
							}}
						/>

						<FormControl fullWidth required>
							<InputLabel>Movement Category</InputLabel>
							<Select
								value={formData.category}
								onChange={(e) => handleInputChange("category", e.target.value)}
								label="Movement Category"
								sx={{ borderRadius: 2 }}
							>
								{categories.map((cat) => (
									<MenuItem key={cat.value} value={cat.value}>
										{cat.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>

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

						<Box>
							<Typography variant="subtitle2" fontWeight="600" gutterBottom>
								Additional Tags (optional)
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
								Tags allow this exercise to appear in multiple training types
							</Typography>
							<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
								{availableTags.map((tag) => (
									<Chip
										key={tag.value}
										label={tag.label}
										onClick={() => handleTagToggle(tag.value)}
										color={
											formData.tags.includes(tag.value) ? "primary" : "default"
										}
										variant={
											formData.tags.includes(tag.value) ? "filled" : "outlined"
										}
										sx={{ cursor: "pointer" }}
									/>
								))}
							</Box>
						</Box>

						{/* Preview */}
						{formData.name.trim() && formData.category && (
							<Box
								sx={{
									p: 2,
									borderRadius: 2,
									backgroundColor: "grey.50",
									border: "1px solid",
									borderColor: "grey.200",
								}}
							>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ mb: 1, display: "block" }}
								>
									💪 Preview:
								</Typography>
								<Typography variant="subtitle1" fontWeight="600" gutterBottom>
									{formData.name}
								</Typography>
								<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
									<Chip
										label={
											categories.find((c) => c.value === formData.category)
												?.label
										}
										color="primary"
										size="small"
									/>
									{formData.tags.map((tag) => (
										<Chip
											key={tag}
											label={availableTags.find((t) => t.value === tag)?.label}
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
							</Box>
						)}
					</Box>
				</DialogContent>

				<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
					<Button
						onClick={handleClose}
						disabled={isSubmitting}
						sx={{ borderRadius: 2 }}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="contained"
						startIcon={
							isSubmitting ? <CircularProgress size={20} /> : <SaveOutlined />
						}
						disabled={isSubmitting || !isFormValid}
						sx={{ borderRadius: 2 }}
					>
						{isSubmitting ? "Saving..." : "Save Exercise"}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default QuickAddExerciseDialog;
