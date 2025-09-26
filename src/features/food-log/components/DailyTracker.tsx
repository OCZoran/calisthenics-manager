"use client";

import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Card,
	CardContent,
	Button,
	Grid,
	LinearProgress,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Autocomplete,
	Chip,
	IconButton,
	Alert,
	CircularProgress,
	Divider,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Menu,
	MenuItem,
} from "@mui/material";
import {
	AddOutlined,
	TodayOutlined,
	DeleteOutlined,
	EditOutlined,
	ExpandMoreOutlined,
	MoreVertOutlined,
	RestaurantMenuOutlined,
	SettingsOutlined,
} from "@mui/icons-material";
import {
	Meal,
	DailyFoodLog,
	FoodLogEntry,
	FoodGoals,
	MacroProgress,
} from "../interfaces/food-log.interface";
import AdsClickOutlinedIcon from "@mui/icons-material/AdsClickOutlined";

interface DailyTrackerProps {
	meals: Meal[];
	todayLog: DailyFoodLog | null;
	onLogUpdated: (log: DailyFoodLog) => void;
}

const DailyTracker: React.FC<DailyTrackerProps> = ({
	meals,
	todayLog,
	onLogUpdated,
}) => {
	const [addMealDialog, setAddMealDialog] = useState(false);
	const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
	const [quantity, setQuantity] = useState<number>(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [goalsDialog, setGoalsDialog] = useState(false);
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(false);

	const [goals, setGoals] = useState<FoodGoals>(() => {
		if (typeof window !== "undefined") {
			const savedGoals = localStorage.getItem("foodGoals");
			if (savedGoals) {
				try {
					return JSON.parse(savedGoals);
				} catch (error) {
					console.error("Error parsing saved goals:", error);
				}
			}
		}
		return { carbs: 150, protein: 120, fat: 80, calories: 2000 };
	});

	const [tempGoals, setTempGoals] = useState<FoodGoals>(goals);

	const today = new Date().toISOString().split("T")[0];
	const todayFormatted = new Date().toLocaleDateString("sr-RS", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("foodGoals", JSON.stringify(goals));
		}
	}, [goals]);

	const calculateProgress = (current: number, goal: number): MacroProgress => ({
		current,
		goal,
		percentage: goal > 0 ? Math.min((current / goal) * 100, 100) : 0,
	});

	const getProgressColor = (percentage: number) => {
		if (percentage < 70) return "error";
		if (percentage < 90) return "warning";
		return "success";
	};

	const progress = {
		carbs: calculateProgress(todayLog?.totalCarbs || 0, goals.carbs),
		protein: calculateProgress(todayLog?.totalProtein || 0, goals.protein),
		fat: calculateProgress(todayLog?.totalFat || 0, goals.fat),
		calories: calculateProgress(todayLog?.totalCalories || 0, goals.calories),
	};

	const handleAddMeal = async () => {
		if (!selectedMeal || quantity <= 0) {
			setError("Morate odabrati obrok i količinu");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const response = await fetch("/api/daily-food-log", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					date: today,
					mealId: selectedMeal._id,
					quantity,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri dodavanju obroka");
			}

			const updatedLog = await response.json();
			onLogUpdated(updatedLog);
			setAddMealDialog(false);
			setSelectedMeal(null);
			setQuantity(1);
		} catch (error) {
			console.error("Error adding meal:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri dodavanju obroka"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteEntry = async (entryIndex: number) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/daily-food-log?date=${today}&entryIndex=${entryIndex}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri brisanju unosa");
			}

			const updatedLog = await response.json();
			onLogUpdated(updatedLog);
			setMenuAnchor(null);
			setSelectedEntryIndex(null);
		} catch (error) {
			console.error("Error deleting entry:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri brisanju unosa"
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSaveGoals = () => {
		setGoals(tempGoals);
		setGoalsDialog(false);
	};

	const previewMacros = selectedMeal
		? {
				carbs: selectedMeal.carbs * quantity,
				protein: selectedMeal.protein * quantity,
				fat: selectedMeal.fat * quantity,
				calories: selectedMeal.calories * quantity,
		  }
		: null;

	return (
		<Box>
			{error && (
				<Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			{/* Header */}
			<Box sx={{ mb: 4 }}>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 2,
					}}
				>
					<Typography
						variant="h5"
						fontWeight="600"
						sx={{ display: "flex", alignItems: "center", gap: 1 }}
					>
						<TodayOutlined color="primary" />
						{todayFormatted}
					</Typography>
					<Button
						startIcon={<SettingsOutlined />}
						variant="outlined"
						size="small"
						onClick={() => {
							setTempGoals(goals);
							setGoalsDialog(true);
						}}
					>
						Ciljevi
					</Button>
				</Box>
			</Box>

			{/* Progress Cards */}
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h4" color="primary.main" fontWeight="600">
								{todayLog?.totalCarbs.toFixed(1) || "0.0"}g
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Ugljeni hidrati
							</Typography>
							<LinearProgress
								variant="determinate"
								value={progress.carbs.percentage}
								color={getProgressColor(progress.carbs.percentage)}
								sx={{ mt: 1, mb: 1 }}
							/>
							<Typography variant="caption" color="text.secondary">
								{progress.carbs.percentage.toFixed(0)}% od {goals.carbs}g
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h4" color="secondary.main" fontWeight="600">
								{todayLog?.totalProtein.toFixed(1) || "0.0"}g
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Proteini
							</Typography>
							<LinearProgress
								variant="determinate"
								value={progress.protein.percentage}
								color={getProgressColor(progress.protein.percentage)}
								sx={{ mt: 1, mb: 1 }}
							/>
							<Typography variant="caption" color="text.secondary">
								{progress.protein.percentage.toFixed(0)}% od {goals.protein}g
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h4" color="warning.main" fontWeight="600">
								{todayLog?.totalFat.toFixed(1) || "0.0"}g
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Masti
							</Typography>
							<LinearProgress
								variant="determinate"
								value={progress.fat.percentage}
								color={getProgressColor(progress.fat.percentage)}
								sx={{ mt: 1, mb: 1 }}
							/>
							<Typography variant="caption" color="text.secondary">
								{progress.fat.percentage.toFixed(0)}% od {goals.fat}g
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h4" color="success.main" fontWeight="600">
								{todayLog?.totalCalories.toFixed(0) || "0"}
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Kalorije
							</Typography>
							<LinearProgress
								variant="determinate"
								value={progress.calories.percentage}
								color={getProgressColor(progress.calories.percentage)}
								sx={{ mt: 1, mb: 1 }}
							/>
							<Typography variant="caption" color="text.secondary">
								{progress.calories.percentage.toFixed(0)}% od {goals.calories}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Add Meal Button */}
			<Box sx={{ mb: 4 }}>
				<Button
					variant="contained"
					startIcon={<AddOutlined />}
					size="large"
					onClick={() => setAddMealDialog(true)}
					disabled={meals.length === 0}
				>
					Dodaj obrok
				</Button>
				{meals.length === 0 && (
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						Prvo kreirajte obrroke u tab-u Obroci
					</Typography>
				)}
			</Box>

			{/* Today's Entries */}
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Današnji unos ({todayLog?.entries.length || 0} unosa)
					</Typography>

					{!todayLog || todayLog.entries.length === 0 ? (
						<Box sx={{ textAlign: "center", py: 4 }}>
							<RestaurantMenuOutlined
								sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
							/>
							<Typography variant="body1" color="text.secondary">
								Nema unosa za danas. Dodajte svoj prvi obrok!
							</Typography>
						</Box>
					) : (
						<Box>
							{todayLog.entries.map((entry, index) => (
								<Accordion key={index} sx={{ mb: 1 }}>
									<AccordionSummary
										expandIcon={<ExpandMoreOutlined />}
										sx={{
											"& .MuiAccordionSummary-content": {
												alignItems: "center",
											},
										}}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												width: "100%",
											}}
										>
											<Box>
												<Typography variant="subtitle1" fontWeight="600">
													{entry.mealName}
													{entry.quantity > 1 && (
														<Typography
															component="span"
															variant="body2"
															color="text.secondary"
															sx={{ ml: 1 }}
														>
															x{entry.quantity}
														</Typography>
													)}
												</Typography>
												<Box sx={{ display: "flex", gap: 1, mt: 1 }}>
													<Chip
														label={`${entry.carbs.toFixed(1)}g UH`}
														size="small"
														color="primary"
														variant="outlined"
													/>
													<Chip
														label={`${entry.protein.toFixed(1)}g P`}
														size="small"
														color="secondary"
														variant="outlined"
													/>
													<Chip
														label={`${entry.fat.toFixed(1)}g M`}
														size="small"
														color="warning"
														variant="outlined"
													/>
													<Chip
														label={`${entry.calories.toFixed(0)} kcal`}
														size="small"
														color="success"
														variant="outlined"
													/>
												</Box>
											</Box>
											<IconButton
												size="small"
												onClick={(e) => {
													e.stopPropagation();
													setMenuAnchor(e.currentTarget);
													setSelectedEntryIndex(index);
												}}
											>
												<MoreVertOutlined />
											</IconButton>
										</Box>
									</AccordionSummary>
									<AccordionDetails>
										<Typography variant="body2" color="text.secondary">
											Po porciji: {entry.carbs / entry.quantity}g UH,{" "}
											{entry.protein / entry.quantity}g proteina,{" "}
											{entry.fat / entry.quantity}g masti,{" "}
											{Math.round(entry.calories / entry.quantity)} kcal
										</Typography>
									</AccordionDetails>
								</Accordion>
							))}
						</Box>
					)}
				</CardContent>
			</Card>

			{/* Add Meal Dialog */}
			<Dialog
				open={addMealDialog}
				onClose={() => setAddMealDialog(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Dodaj obrok u današnji unos</DialogTitle>
				<DialogContent>
					<Box sx={{ pt: 2 }}>
						<Autocomplete
							options={meals}
							getOptionLabel={(meal) => meal.name}
							value={selectedMeal}
							onChange={(_, newValue) => setSelectedMeal(newValue)}
							renderInput={(params) => (
								<TextField
									{...params}
									label="Odaberite obrok"
									fullWidth
									margin="normal"
								/>
							)}
							sx={{ mb: 3 }}
						/>

						<TextField
							type="number"
							label="Količina (porcije)"
							value={quantity}
							onChange={(e) => setQuantity(Number(e.target.value) || 1)}
							inputProps={{ min: 0.1, step: 0.1 }}
							fullWidth
							sx={{ mb: 3 }}
						/>

						{previewMacros && (
							<Card sx={{ mt: 2 }}>
								<CardContent>
									<Typography variant="subtitle2" gutterBottom>
										Pregled makronutrijenata:
									</Typography>
									<Grid container spacing={2}>
										<Grid size={{ xs: 6 }}>
											<Typography variant="body2">
												UH: {previewMacros.carbs.toFixed(1)}g
											</Typography>
										</Grid>
										<Grid size={{ xs: 6 }}>
											<Typography variant="body2">
												Proteini: {previewMacros.protein.toFixed(1)}g
											</Typography>
										</Grid>
										<Grid size={{ xs: 6 }}>
											<Typography variant="body2">
												Masti: {previewMacros.fat.toFixed(1)}g
											</Typography>
										</Grid>
										<Grid size={{ xs: 6 }}>
											<Typography variant="body2">
												Kalorije: {previewMacros.calories.toFixed(0)}
											</Typography>
										</Grid>
									</Grid>
								</CardContent>
							</Card>
						)}
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setAddMealDialog(false)}>Otkaži</Button>
					<Button
						onClick={handleAddMeal}
						variant="contained"
						disabled={!selectedMeal || quantity <= 0 || isSubmitting}
					>
						{isSubmitting ? <CircularProgress size={20} /> : "Dodaj"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Goals Dialog */}
			<Dialog open={goalsDialog} onClose={() => setGoalsDialog(false)}>
				<DialogTitle>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<AdsClickOutlinedIcon color="primary" />
						Postavke ciljeva
					</Box>
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ pt: 2 }}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								type="number"
								label="Ugljeni hidrati (g)"
								value={tempGoals.carbs}
								onChange={(e) =>
									setTempGoals((prev) => ({
										...prev,
										carbs: Number(e.target.value) || 0,
									}))
								}
								inputProps={{ min: 0 }}
								fullWidth
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								type="number"
								label="Proteini (g)"
								value={tempGoals.protein}
								onChange={(e) =>
									setTempGoals((prev) => ({
										...prev,
										protein: Number(e.target.value) || 0,
									}))
								}
								inputProps={{ min: 0 }}
								fullWidth
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								type="number"
								label="Masti (g)"
								value={tempGoals.fat}
								onChange={(e) =>
									setTempGoals((prev) => ({
										...prev,
										fat: Number(e.target.value) || 0,
									}))
								}
								inputProps={{ min: 0 }}
								fullWidth
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								type="number"
								label="Kalorije"
								value={tempGoals.calories}
								onChange={(e) =>
									setTempGoals((prev) => ({
										...prev,
										calories: Number(e.target.value) || 0,
									}))
								}
								inputProps={{ min: 0 }}
								fullWidth
							/>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setGoalsDialog(false)}>Otkaži</Button>
					<Button onClick={handleSaveGoals} variant="contained">
						Sačuvaj
					</Button>
				</DialogActions>
			</Dialog>

			{/* Context Menu */}
			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={() => setMenuAnchor(null)}
			>
				<MenuItem
					onClick={() =>
						selectedEntryIndex !== null && handleDeleteEntry(selectedEntryIndex)
					}
					sx={{ color: "error.main" }}
					disabled={isLoading}
				>
					<DeleteOutlined sx={{ mr: 1 }} />
					{isLoading ? "Briše se..." : "Obriši"}
				</MenuItem>
			</Menu>
		</Box>
	);
};

export default DailyTracker;
