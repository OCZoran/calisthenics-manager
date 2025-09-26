"use client";

import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Card,
	CardContent,
	CircularProgress,
	Alert,
	Grid,
	Chip,
	TextField,
	Button,
	LinearProgress,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	IconButton,
	Menu,
	MenuItem,
} from "@mui/material";
import {
	ExpandMoreOutlined,
	CalendarTodayOutlined,
	TrendingUpOutlined,
	FilterListOutlined,
	MoreVertOutlined,
	DeleteOutlined,
} from "@mui/icons-material";
import {
	DailyFoodLog,
	FoodGoals,
	MacroProgress,
} from "../interfaces/food-log.interface";

const FoodHistory: React.FC = () => {
	const [logs, setLogs] = useState<DailyFoodLog[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dateFilter, setDateFilter] = useState("");
	const [goals] = useState<FoodGoals>(() => {
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
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [selectedLog, setSelectedLog] = useState<DailyFoodLog | null>(null);

	const fetchHistory = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/daily-food-log");

			if (!response.ok) {
				throw new Error("Greška pri učitavanju istorije");
			}

			const data = await response.json();
			setLogs(
				data.sort(
					(a: DailyFoodLog, b: DailyFoodLog) =>
						new Date(b.date).getTime() - new Date(a.date).getTime()
				)
			);
		} catch (error) {
			console.error("Error fetching history:", error);
			setError(
				error instanceof Error
					? error.message
					: "Greška pri učitavanju istorije"
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchHistory();
	}, []);

	const handleDeleteLog = async (log: DailyFoodLog) => {
		try {
			const response = await fetch(`/api/daily-food-log?date=${log.date}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri brisanju loga");
			}

			setLogs((prev) => prev.filter((l) => l._id !== log._id));
			setMenuAnchor(null);
			setSelectedLog(null);
		} catch (error) {
			console.error("Error deleting log:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri brisanju loga"
			);
		}
	};

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

	const filteredLogs = logs.filter((log) => {
		if (!dateFilter) return true;
		return log.date.includes(dateFilter);
	});

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("sr-RS", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const getDateRange = () => {
		if (logs.length === 0) return "";
		const oldest = logs[logs.length - 1].date;
		const newest = logs[0].date;
		if (oldest === newest) return formatDate(oldest);
		return `${formatDate(oldest)} - ${formatDate(newest)}`;
	};

	const calculateAverages = () => {
		if (filteredLogs.length === 0)
			return { carbs: 0, protein: 0, fat: 0, calories: 0 };

		const totals = filteredLogs.reduce(
			(acc, log) => ({
				carbs: acc.carbs + log.totalCarbs,
				protein: acc.protein + log.totalProtein,
				fat: acc.fat + log.totalFat,
				calories: acc.calories + log.totalCalories,
			}),
			{ carbs: 0, protein: 0, fat: 0, calories: 0 }
		);

		return {
			carbs: totals.carbs / filteredLogs.length,
			protein: totals.protein / filteredLogs.length,
			fat: totals.fat / filteredLogs.length,
			calories: totals.calories / filteredLogs.length,
		};
	};

	const averages = calculateAverages();

	if (isLoading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (logs.length === 0) {
		return (
			<Card>
				<CardContent sx={{ textAlign: "center", py: 8 }}>
					<CalendarTodayOutlined
						sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
					/>
					<Typography variant="h5" color="text.secondary" gutterBottom>
						Nema istorije unosa
					</Typography>
					<Typography color="text.secondary">
						Počnite sa praćenjem hrane da biste videli istoriju
					</Typography>
				</CardContent>
			</Card>
		);
	}

	return (
		<Box>
			{error && (
				<Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			{/* Statistics overview */}
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Typography
						variant="h6"
						gutterBottom
						sx={{ display: "flex", alignItems: "center", gap: 1 }}
					>
						<TrendingUpOutlined color="primary" />
						Statistike ({filteredLogs.length} dana)
					</Typography>

					<Typography variant="body2" color="text.secondary" gutterBottom>
						{getDateRange()}
					</Typography>

					<Grid container spacing={3} sx={{ mt: 2 }}>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Box sx={{ textAlign: "center" }}>
								<Typography variant="h5" color="primary.main" fontWeight="600">
									{averages.carbs.toFixed(1)}g
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Prosečno UH
								</Typography>
								<LinearProgress
									variant="determinate"
									value={
										calculateProgress(averages.carbs, goals.carbs).percentage
									}
									color={getProgressColor(
										calculateProgress(averages.carbs, goals.carbs).percentage
									)}
									sx={{ mt: 1 }}
								/>
							</Box>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Box sx={{ textAlign: "center" }}>
								<Typography
									variant="h5"
									color="secondary.main"
									fontWeight="600"
								>
									{averages.protein.toFixed(1)}g
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Prosečno Proteini
								</Typography>
								<LinearProgress
									variant="determinate"
									value={
										calculateProgress(averages.protein, goals.protein)
											.percentage
									}
									color={getProgressColor(
										calculateProgress(averages.protein, goals.protein)
											.percentage
									)}
									sx={{ mt: 1 }}
								/>
							</Box>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Box sx={{ textAlign: "center" }}>
								<Typography variant="h5" color="warning.main" fontWeight="600">
									{averages.fat.toFixed(1)}g
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Prosečno Masti
								</Typography>
								<LinearProgress
									variant="determinate"
									value={calculateProgress(averages.fat, goals.fat).percentage}
									color={getProgressColor(
										calculateProgress(averages.fat, goals.fat).percentage
									)}
									sx={{ mt: 1 }}
								/>
							</Box>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Box sx={{ textAlign: "center" }}>
								<Typography variant="h5" color="success.main" fontWeight="600">
									{averages.calories.toFixed(0)}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Prosečno Kalorije
								</Typography>
								<LinearProgress
									variant="determinate"
									value={
										calculateProgress(averages.calories, goals.calories)
											.percentage
									}
									color={getProgressColor(
										calculateProgress(averages.calories, goals.calories)
											.percentage
									)}
									sx={{ mt: 1 }}
								/>
							</Box>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{/* Filters */}
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
						<FilterListOutlined color="primary" />
						<TextField
							size="small"
							type="month"
							label="Filtriraj po mesecu"
							value={dateFilter}
							onChange={(e) => setDateFilter(e.target.value)}
							sx={{ minWidth: 200 }}
						/>
						<Button
							variant="outlined"
							size="small"
							onClick={() => setDateFilter("")}
							disabled={!dateFilter}
						>
							Resetuj
						</Button>
					</Box>
				</CardContent>
			</Card>

			{/* Daily logs */}
			<Box>
				{filteredLogs.map((log) => {
					const progress = {
						carbs: calculateProgress(log.totalCarbs, goals.carbs),
						protein: calculateProgress(log.totalProtein, goals.protein),
						fat: calculateProgress(log.totalFat, goals.fat),
						calories: calculateProgress(log.totalCalories, goals.calories),
					};

					return (
						<Accordion key={log._id} sx={{ mb: 1 }}>
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
										<Typography variant="h6" fontWeight="600">
											{formatDate(log.date)}
										</Typography>
										<Box sx={{ display: "flex", gap: 1, mt: 1 }}>
											<Chip
												label={`${log.totalCarbs.toFixed(0)}g UH`}
												size="small"
												color="primary"
												variant="outlined"
											/>
											<Chip
												label={`${log.totalProtein.toFixed(0)}g P`}
												size="small"
												color="secondary"
												variant="outlined"
											/>
											<Chip
												label={`${log.totalFat.toFixed(0)}g M`}
												size="small"
												color="warning"
												variant="outlined"
											/>
											<Chip
												label={`${log.totalCalories.toFixed(0)} kcal`}
												size="small"
												color="success"
												variant="outlined"
											/>
										</Box>
									</Box>
									<Box sx={{ display: "flex", alignItems: "center" }}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ mr: 2 }}
										>
											{log.entries.length} obrok
											{log.entries.length !== 1 ? "a" : ""}
										</Typography>
										<IconButton
											size="small"
											onClick={(e) => {
												e.stopPropagation();
												setMenuAnchor(e.currentTarget);
												setSelectedLog(log);
											}}
										>
											<MoreVertOutlined />
										</IconButton>
									</Box>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								<Box>
									{/* Progress bars */}
									<Grid container spacing={2} sx={{ mb: 3 }}>
										<Grid size={{ xs: 12, sm: 6, md: 3 }}>
											<Typography variant="body2" gutterBottom>
												Ugljeni hidrati
											</Typography>
											<LinearProgress
												variant="determinate"
												value={progress.carbs.percentage}
												color={getProgressColor(progress.carbs.percentage)}
											/>
											<Typography variant="caption" color="text.secondary">
												{progress.carbs.percentage.toFixed(0)}% od cilja
											</Typography>
										</Grid>
										<Grid size={{ xs: 12, sm: 6, md: 3 }}>
											<Typography variant="body2" gutterBottom>
												Proteini
											</Typography>
											<LinearProgress
												variant="determinate"
												value={progress.protein.percentage}
												color={getProgressColor(progress.protein.percentage)}
											/>
											<Typography variant="caption" color="text.secondary">
												{progress.protein.percentage.toFixed(0)}% od cilja
											</Typography>
										</Grid>
										<Grid size={{ xs: 12, sm: 6, md: 3 }}>
											<Typography variant="body2" gutterBottom>
												Masti
											</Typography>
											<LinearProgress
												variant="determinate"
												value={progress.fat.percentage}
												color={getProgressColor(progress.fat.percentage)}
											/>
											<Typography variant="caption" color="text.secondary">
												{progress.fat.percentage.toFixed(0)}% od cilja
											</Typography>
										</Grid>
										<Grid size={{ xs: 12, sm: 6, md: 3 }}>
											<Typography variant="body2" gutterBottom>
												Kalorije
											</Typography>
											<LinearProgress
												variant="determinate"
												value={progress.calories.percentage}
												color={getProgressColor(progress.calories.percentage)}
											/>
											<Typography variant="caption" color="text.secondary">
												{progress.calories.percentage.toFixed(0)}% od cilja
											</Typography>
										</Grid>
									</Grid>

									{/* Entries list */}
									<Typography variant="subtitle1" fontWeight="600" gutterBottom>
										Obroci za ovaj dan:
									</Typography>
									{log.entries.map((entry, index) => (
										<Box
											key={index}
											sx={{
												p: 2,
												border: 1,
												borderColor: "divider",
												borderRadius: 1,
												mb: 1,
												backgroundColor: "grey.50",
											}}
										>
											<Typography variant="subtitle2" fontWeight="600">
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
									))}
								</Box>
							</AccordionDetails>
						</Accordion>
					);
				})}
			</Box>

			{/* Context menu */}
			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={() => setMenuAnchor(null)}
			>
				<MenuItem
					onClick={() => selectedLog && handleDeleteLog(selectedLog)}
					sx={{ color: "error.main" }}
				>
					<DeleteOutlined sx={{ mr: 1 }} />
					Obriši dan
				</MenuItem>
			</Menu>
		</Box>
	);
};

export default FoodHistory;
