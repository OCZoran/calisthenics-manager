"use client";

import React, { useState } from "react";
import {
	Box,
	Typography,
	Card,
	CardContent,
	CardActions,
	Button,
	Chip,
	Grid,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Alert,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Checkbox,
	FormControlLabel,
} from "@mui/material";
import {
	EditOutlined,
	DeleteOutlined,
	FitnessCenterOutlined,
	FilterListOutlined,
	SaveOutlined,
	CancelOutlined,
} from "@mui/icons-material";
import { ExerciseDefinition } from "@/global/interfaces/training-plan.interface";
import {
	ExerciseTag,
	getCategoryLabel,
	getTagLabel,
	MovementCategory,
} from "./exercise.interface";

interface ExerciseListProps {
	exercises: ExerciseDefinition[];
	onExerciseUpdated: (exercise: ExerciseDefinition) => void;
	onExerciseDeleted: (exerciseId: string) => void;
}

const ExerciseList: React.FC<ExerciseListProps> = ({
	exercises,
	onExerciseUpdated,
	onExerciseDeleted,
}) => {
	const [selectedExercise, setSelectedExercise] =
		useState<ExerciseDefinition | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editForm, setEditForm] = useState({
		name: "",
		category: "" as MovementCategory | "",
		tags: [] as ExerciseTag[],
		isBodyweight: true,
	});
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [filterCategory, setFilterCategory] = useState<string>("all");
	const [filterTag, setFilterTag] = useState<string>("all");

	const categories: MovementCategory[] = ["pull", "push", "legs", "core"];
	const availableTags: ExerciseTag[] = [
		"cardio",
		"skills",
		"mobility",
		"flexibility",
	];

	const handleEditExercise = (exercise: ExerciseDefinition) => {
		setSelectedExercise(exercise);
		setEditForm({
			name: exercise.name,
			category: exercise.category,
			tags: exercise.tags || [],
			isBodyweight: exercise.isBodyweight,
		});
		setIsEditDialogOpen(true);
		setError(null);
	};

	const handleDeleteExercise = (exercise: ExerciseDefinition) => {
		setSelectedExercise(exercise);
		setIsDeleteDialogOpen(true);
		setError(null);
	};

	const handleUpdateExercise = async () => {
		if (!selectedExercise) return;

		if (!editForm.name.trim() || !editForm.category) {
			setError("Naziv i kategorija su obavezni");
			return;
		}

		setIsUpdating(true);
		setError(null);

		try {
			const response = await fetch("/api/exercises", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					exerciseId: selectedExercise._id,
					name: editForm.name.trim(),
					category: editForm.category,
					tags: editForm.tags,
					isBodyweight: editForm.isBodyweight,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri ažuriranju vježbe");
			}

			const updatedExercise: ExerciseDefinition = {
				...selectedExercise,
				name: editForm.name.trim(),
				category: editForm.category as MovementCategory,
				tags: editForm.tags,
				isBodyweight: editForm.isBodyweight,
				updatedAt: new Date(),
			};

			onExerciseUpdated(updatedExercise);
			setIsEditDialogOpen(false);
			setSelectedExercise(null);
		} catch (error) {
			console.error("Error updating exercise:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri ažuriranju vježbe"
			);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!selectedExercise) return;

		setIsDeleting(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/exercises?id=${selectedExercise._id}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri brisanju vježbe");
			}

			onExerciseDeleted(selectedExercise._id!);
			setIsDeleteDialogOpen(false);
			setSelectedExercise(null);
		} catch (error) {
			console.error("Error deleting exercise:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri brisanju vježbe"
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleTagToggle = (tag: ExerciseTag) => {
		setEditForm((prev) => ({
			...prev,
			tags: prev.tags.includes(tag)
				? prev.tags.filter((t) => t !== tag)
				: [...prev.tags, tag],
		}));
	};

	// Filter exercises
	const filteredExercises = exercises.filter((ex) => {
		if (filterCategory !== "all" && ex.category !== filterCategory) {
			return false;
		}
		if (filterTag !== "all" && !ex.tags.includes(filterTag as ExerciseTag)) {
			return false;
		}
		return true;
	});

	// Group by category
	const groupedExercises = categories.reduce((acc, cat) => {
		acc[cat] = filteredExercises.filter((ex) => ex.category === cat);
		return acc;
	}, {} as Record<MovementCategory, ExerciseDefinition[]>);

	if (exercises.length === 0) {
		return (
			<Box sx={{ textAlign: "center", py: 8 }}>
				<FitnessCenterOutlined
					sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
				/>
				<Typography variant="h5" gutterBottom fontWeight="bold">
					Nema vježbi u bazi
				</Typography>
				<Typography variant="body1" color="textSecondary">
					Počnite sa dodavanjem vježbi na kartici Dodaj vježbu
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					mb: 3,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center" }}>
					<FitnessCenterOutlined sx={{ mr: 2, color: "primary.main" }} />
					<Typography variant="h5" component="h2" fontWeight="600">
						Vaše vježbe ({filteredExercises.length})
					</Typography>
				</Box>
			</Box>

			{/* Filters */}
			<Card elevation={1} sx={{ mb: 3 }}>
				<CardContent>
					<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
						<FilterListOutlined sx={{ mr: 1 }} />
						<Typography variant="subtitle1" fontWeight="600">
							Filteri
						</Typography>
					</Box>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<FormControl fullWidth size="small">
								<InputLabel>Kategorija</InputLabel>
								<Select
									value={filterCategory}
									onChange={(e) => setFilterCategory(e.target.value)}
									label="Kategorija"
								>
									<MenuItem value="all">Sve kategorije</MenuItem>
									{categories.map((cat) => (
										<MenuItem key={cat} value={cat}>
											{getCategoryLabel(cat)}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<FormControl fullWidth size="small">
								<InputLabel>Tag</InputLabel>
								<Select
									value={filterTag}
									onChange={(e) => setFilterTag(e.target.value)}
									label="Tag"
								>
									<MenuItem value="all">Svi tagovi</MenuItem>
									{availableTags.map((tag) => (
										<MenuItem key={tag} value={tag}>
											{getTagLabel(tag)}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{/* Exercise groups */}
			{categories.map(
				(category) =>
					groupedExercises[category].length > 0 && (
						<Box key={category} sx={{ mb: 4 }}>
							<Typography
								variant="h6"
								sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}
							>
								{getCategoryLabel(category)} (
								{groupedExercises[category].length})
							</Typography>
							<Grid container spacing={2}>
								{groupedExercises[category].map(
									(exercise: ExerciseDefinition) => (
										<Grid size={{ xs: 12, sm: 6, md: 4 }} key={exercise._id}>
											<Card
												elevation={2}
												sx={{
													height: "100%",
													display: "flex",
													flexDirection: "column",
													transition: "all 0.3s ease",
													"&:hover": {
														elevation: 4,
														transform: "translateY(-2px)",
													},
												}}
											>
												<CardContent sx={{ flexGrow: 1 }}>
													<Typography
														variant="h6"
														component="h3"
														gutterBottom
														fontWeight="600"
													>
														{exercise.name}
													</Typography>

													<Box
														sx={{
															display: "flex",
															gap: 0.5,
															mb: 1,
															flexWrap: "wrap",
														}}
													>
														<Chip
															label={getCategoryLabel(exercise.category)}
															color="primary"
															size="small"
														/>
														{exercise.tags.map((tag) => (
															<Chip
																key={tag}
																label={getTagLabel(tag)}
																color="secondary"
																size="small"
															/>
														))}
														<Chip
															label={
																exercise.isBodyweight
																	? "Bodyweight"
																	: "Weighted"
															}
															variant="outlined"
															size="small"
														/>
													</Box>
												</CardContent>

												<CardActions sx={{ px: 2, pb: 2 }}>
													<Button
														startIcon={<EditOutlined />}
														onClick={() => handleEditExercise(exercise)}
														size="small"
														color="primary"
													>
														Edituj
													</Button>
													<Button
														startIcon={<DeleteOutlined />}
														onClick={() => handleDeleteExercise(exercise)}
														size="small"
														color="error"
													>
														Obriši
													</Button>
												</CardActions>
											</Card>
										</Grid>
									)
								)}
							</Grid>
						</Box>
					)
			)}

			{/* Edit Dialog */}
			<Dialog
				open={isEditDialogOpen}
				onClose={() => setIsEditDialogOpen(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>
					<Typography variant="h6" fontWeight="600">
						Edituj vježbu
					</Typography>
				</DialogTitle>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}
					<Box sx={{ pt: 2 }}>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									required
									label="Naziv vježbe"
									value={editForm.name}
									onChange={(e) =>
										setEditForm((prev) => ({ ...prev, name: e.target.value }))
									}
									inputProps={{ maxLength: 100 }}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<FormControl fullWidth required>
									<InputLabel>Kategorija</InputLabel>
									<Select
										value={editForm.category}
										onChange={(e) =>
											setEditForm((prev) => ({
												...prev,
												category: e.target.value as MovementCategory,
											}))
										}
										label="Kategorija"
									>
										{categories.map((cat) => (
											<MenuItem key={cat} value={cat}>
												{getCategoryLabel(cat)}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<FormControlLabel
									control={
										<Checkbox
											checked={editForm.isBodyweight}
											onChange={(e) =>
												setEditForm((prev) => ({
													...prev,
													isBodyweight: e.target.checked,
												}))
											}
										/>
									}
									label="Bodyweight vježba"
								/>
							</Grid>
							<Grid size={{ xs: 12 }}>
								<Typography variant="subtitle2" gutterBottom>
									Tagovi
								</Typography>
								<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
									{availableTags.map((tag) => (
										<Chip
											key={tag}
											label={getTagLabel(tag)}
											onClick={() => handleTagToggle(tag)}
											color={
												editForm.tags.includes(tag) ? "primary" : "default"
											}
											variant={
												editForm.tags.includes(tag) ? "filled" : "outlined"
											}
											sx={{ cursor: "pointer" }}
										/>
									))}
								</Box>
							</Grid>
						</Grid>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button
						startIcon={<CancelOutlined />}
						onClick={() => setIsEditDialogOpen(false)}
						disabled={isUpdating}
					>
						Otkaži
					</Button>
					<Button
						startIcon={<SaveOutlined />}
						variant="contained"
						onClick={handleUpdateExercise}
						disabled={isUpdating || !editForm.name.trim() || !editForm.category}
					>
						{isUpdating ? "Čuvanje..." : "Sačuvaj"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Dialog */}
			<Dialog
				open={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					<Typography variant="h6" fontWeight="600" color="error">
						Potvrdi brisanje
					</Typography>
				</DialogTitle>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}
					<Typography>
						Da li ste sigurni da želite da obrišete vježbu{" "}
						<strong>{selectedExercise?.name}</strong>?
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						Ova akcija se ne može poništiti.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setIsDeleteDialogOpen(false)}
						disabled={isDeleting}
					>
						Otkaži
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={handleConfirmDelete}
						disabled={isDeleting}
					>
						{isDeleting ? "Brisanje..." : "Obriši"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ExerciseList;
