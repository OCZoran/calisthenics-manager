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
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	Chip,
} from "@mui/material";
import {
	EditOutlined,
	DeleteOutlined,
	RestaurantMenuOutlined,
	SaveOutlined,
	CancelOutlined,
} from "@mui/icons-material";
import { Meal, MealFormData } from "../interfaces/food-log.interface";

interface MealManagerProps {
	meals: Meal[];
	onMealAdded: (meal: Meal) => void;
	onMealUpdated: (meal: Meal) => void;
	onMealDeleted: (mealId: string) => void;
}

const MealManager: React.FC<MealManagerProps> = ({
	meals,
	onMealAdded,
	onMealUpdated,
	onMealDeleted,
}) => {
	const [formData, setFormData] = useState<MealFormData>({
		name: "",
		carbs: 0,
		protein: 0,
		fat: 0,
	});
	const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [deleteDialog, setDeleteDialog] = useState<Meal | null>(null);

	const resetForm = () => {
		setFormData({
			name: "",
			carbs: 0,
			protein: 0,
			fat: 0,
		});
		setEditingMeal(null);
		setError(null);
		setSuccess(null);
	};

	const calculateCalories = (carbs: number, protein: number, fat: number) => {
		return carbs * 4 + protein * 4 + fat * 9;
	};

	const handleInputChange = (field: keyof MealFormData, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: field === "name" ? value : Number(value) || 0,
		}));
		if (error) setError(null);
		if (success) setSuccess(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			setError("Naziv obroka je obavezan");
			return;
		}

		if (formData.carbs < 0 || formData.protein < 0 || formData.fat < 0) {
			setError("Vrednosti makronutrijenata ne mogu biti negativne");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const url = editingMeal
				? `/api/meals?id=${editingMeal._id}`
				: "/api/meals";
			const method = editingMeal ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri čuvanju obroka");
			}

			const savedMeal = await response.json();

			if (editingMeal) {
				onMealUpdated(savedMeal);
				setSuccess("Obrok je uspešno ažuriran!");
			} else {
				onMealAdded(savedMeal);
				setSuccess("Obrok je uspešno kreiran!");
			}

			resetForm();
		} catch (error) {
			console.error("Error saving meal:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri čuvanju obroka"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEdit = (meal: Meal) => {
		setFormData({
			name: meal.name,
			carbs: meal.carbs,
			protein: meal.protein,
			fat: meal.fat,
		});
		setEditingMeal(meal);
		setError(null);
		setSuccess(null);
	};

	const handleDelete = async (meal: Meal) => {
		try {
			const response = await fetch(`/api/meals?id=${meal._id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri brisanju obroka");
			}

			onMealDeleted(meal._id);
			setDeleteDialog(null);
			setSuccess("Obrok je uspešno obrisan!");
		} catch (error) {
			console.error("Error deleting meal:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri brisanju obroka"
			);
			setDeleteDialog(null);
		}
	};

	const calories = calculateCalories(
		formData.carbs,
		formData.protein,
		formData.fat
	);
	const isFormValid = formData.name.trim();

	return (
		<Box>
			{/* Form section */}
			<Box sx={{ mb: 4 }}>
				<Typography
					variant="h6"
					gutterBottom
					sx={{ display: "flex", alignItems: "center", gap: 1 }}
				>
					<RestaurantMenuOutlined color="primary" />
					{editingMeal ? "Uredi obrok" : "Dodaj novi obrok"}
				</Typography>

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
					<CardContent>
						<form onSubmit={handleSubmit}>
							<Grid container spacing={3}>
								<Grid size={{ xs: 12 }}>
									<TextField
										fullWidth
										label="Naziv obroka"
										placeholder="Npr. Ovsena kaša sa bananama"
										value={formData.name}
										onChange={(e) => handleInputChange("name", e.target.value)}
										inputProps={{ maxLength: 100 }}
									/>
								</Grid>

								<Grid size={{ xs: 12, sm: 3 }}>
									<TextField
										fullWidth
										type="number"
										label="Ugljeni hidrati (g)"
										value={formData.carbs}
										onChange={(e) => handleInputChange("carbs", e.target.value)}
										inputProps={{ min: 0, step: 0.1 }}
									/>
								</Grid>

								<Grid size={{ xs: 12, sm: 3 }}>
									<TextField
										fullWidth
										type="number"
										label="Proteini (g)"
										value={formData.protein}
										onChange={(e) =>
											handleInputChange("protein", e.target.value)
										}
										inputProps={{ min: 0, step: 0.1 }}
									/>
								</Grid>

								<Grid size={{ xs: 12, sm: 3 }}>
									<TextField
										fullWidth
										type="number"
										label="Masti (g)"
										value={formData.fat}
										onChange={(e) => handleInputChange("fat", e.target.value)}
										inputProps={{ min: 0, step: 0.1 }}
									/>
								</Grid>

								<Grid size={{ xs: 12, sm: 3 }}>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											height: "100%",
										}}
									>
										<Typography variant="h6" color="primary">
											{calories.toFixed(0)} kcal
										</Typography>
									</Box>
								</Grid>

								<Grid size={{ xs: 12 }}>
									<Box
										sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
									>
										{editingMeal && (
											<Button
												startIcon={<CancelOutlined />}
												onClick={resetForm}
												disabled={isSubmitting}
												color="inherit"
											>
												Otkaži
											</Button>
										)}
										<Button
											type="submit"
											variant="contained"
											startIcon={<SaveOutlined />}
											disabled={isSubmitting || !isFormValid}
											size="large"
										>
											{isSubmitting
												? "Čuvanje..."
												: editingMeal
												? "Ažuriraj obrok"
												: "Dodaj obrok"}
										</Button>
									</Box>
								</Grid>
							</Grid>
						</form>
					</CardContent>
				</Card>
			</Box>

			{/* Meals list */}
			<Box>
				<Typography variant="h6" gutterBottom>
					Sačuvani obroci ({meals.length})
				</Typography>

				{meals.length === 0 ? (
					<Card>
						<CardContent sx={{ textAlign: "center", py: 4 }}>
							<RestaurantMenuOutlined
								sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
							/>
							<Typography variant="h6" color="text.secondary" gutterBottom>
								Nema sačuvanih obroka
							</Typography>
							<Typography color="text.secondary">
								Dodajte svoj prvi obrok koristeći formu iznad
							</Typography>
						</CardContent>
					</Card>
				) : (
					<Grid container spacing={2}>
						{meals.map((meal) => (
							<Grid size={{ xs: 12, md: 6 }} key={meal._id}>
								<Card>
									<CardContent>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "start",
												mb: 2,
											}}
										>
											<Typography variant="h6" fontWeight="600">
												{meal.name}
											</Typography>
											<Box sx={{ display: "flex", gap: 1 }}>
												<IconButton
													size="small"
													onClick={() => handleEdit(meal)}
													color="primary"
												>
													<EditOutlined />
												</IconButton>
												<IconButton
													size="small"
													onClick={() => setDeleteDialog(meal)}
													color="error"
												>
													<DeleteOutlined />
												</IconButton>
											</Box>
										</Box>

										<Box
											sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}
										>
											<Chip
												label={`${meal.carbs}g UH`}
												size="small"
												color="primary"
												variant="outlined"
											/>
											<Chip
												label={`${meal.protein}g P`}
												size="small"
												color="secondary"
												variant="outlined"
											/>
											<Chip
												label={`${meal.fat}g M`}
												size="small"
												color="warning"
												variant="outlined"
											/>
											<Chip
												label={`${meal.calories} kcal`}
												size="small"
												color="success"
												variant="outlined"
											/>
										</Box>

										<Typography variant="body2" color="text.secondary">
											Kreiran:{" "}
											{new Date(meal.createdAt).toLocaleDateString("sr-RS")}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						))}
					</Grid>
				)}
			</Box>

			{/* Delete confirmation dialog */}
			<Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
				<DialogTitle>Brisanje obroka</DialogTitle>
				<DialogContent>
					<Typography>
						Da li ste sigurni da želite da obrišete obrok {deleteDialog?.name}?
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialog(null)}>Otkaži</Button>
					<Button
						onClick={() => deleteDialog && handleDelete(deleteDialog)}
						color="error"
						variant="contained"
					>
						Obriši
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default MealManager;
