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
	TextField,
	Button,
	Chip,
} from "@mui/material";
import {
	CalendarMonthOutlined,
	TrendingUpOutlined,
	NavigateBeforeOutlined,
	NavigateNextOutlined,
} from "@mui/icons-material";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	BarChart,
	Bar,
} from "recharts";

interface DailyFoodLog {
	_id: string;
	date: string;
	entries: any[];
	totalCarbs: number;
	totalProtein: number;
	totalFat: number;
	totalCalories: number;
}

interface WeeklyData {
	date: string;
	dayName: string;
	carbs: number;
	protein: number;
	fat: number;
	calories: number;
}

const WeeklySummary: React.FC = () => {
	const [logs, setLogs] = useState<DailyFoodLog[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
		const today = new Date();
		const dayOfWeek = today.getDay();
		const monday = new Date(today);
		monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
		monday.setHours(0, 0, 0, 0);
		return monday;
	});

	const [goals] = useState(() => {
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

	const fetchWeeklyData = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/daily-food-log");

			if (!response.ok) {
				throw new Error("Error loading data");
			}

			const data = await response.json();
			setLogs(data);
		} catch (error) {
			console.error("Error fetching weekly data:", error);
			setError(error instanceof Error ? error.message : "Error loading data");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchWeeklyData();
	}, []);

	const getWeekDates = (startDate: Date): Date[] => {
		const dates = [];
		for (let i = 0; i < 7; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			dates.push(date);
		}
		return dates;
	};

	const formatDateForComparison = (date: Date): string => {
		return date.toISOString().split("T")[0];
	};

	const getDayName = (date: Date): string => {
		const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		return days[date.getDay()];
	};

	const getWeeklyData = (): WeeklyData[] => {
		const weekDates = getWeekDates(selectedWeekStart);

		return weekDates.map((date) => {
			const dateStr = formatDateForComparison(date);
			const log = logs.find((l) => l.date === dateStr);

			return {
				date: `${date.getDate()}.${date.getMonth() + 1}`,
				dayName: getDayName(date),
				carbs: log?.totalCarbs || 0,
				protein: log?.totalProtein || 0,
				fat: log?.totalFat || 0,
				calories: log?.totalCalories || 0,
			};
		});
	};

	const calculateWeeklyTotals = (data: WeeklyData[]) => {
		return data.reduce(
			(acc, day) => ({
				carbs: acc.carbs + day.carbs,
				protein: acc.protein + day.protein,
				fat: acc.fat + day.fat,
				calories: acc.calories + day.calories,
			}),
			{ carbs: 0, protein: 0, fat: 0, calories: 0 }
		);
	};

	const calculateWeeklyAverages = (data: WeeklyData[]) => {
		const daysWithData = data.filter((day) => day.calories > 0).length;
		if (daysWithData === 0) {
			return { carbs: 0, protein: 0, fat: 0, calories: 0 };
		}

		const totals = calculateWeeklyTotals(data);
		return {
			carbs: totals.carbs / daysWithData,
			protein: totals.protein / daysWithData,
			fat: totals.fat / daysWithData,
			calories: totals.calories / daysWithData,
		};
	};

	const navigateWeek = (direction: "prev" | "next") => {
		setSelectedWeekStart((prev) => {
			const newDate = new Date(prev);
			newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
			return newDate;
		});
	};

	const goToCurrentWeek = () => {
		const today = new Date();
		const dayOfWeek = today.getDay();
		const monday = new Date(today);
		monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
		monday.setHours(0, 0, 0, 0);
		setSelectedWeekStart(monday);
	};

	const formatWeekRange = () => {
		const weekDates = getWeekDates(selectedWeekStart);
		const start = weekDates[0];
		const end = weekDates[6];
		return `${start.getDate()}.${
			start.getMonth() + 1
		}.${start.getFullYear()} - ${end.getDate()}.${
			end.getMonth() + 1
		}.${end.getFullYear()}`;
	};

	if (isLoading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	const weeklyData = getWeeklyData();
	const totals = calculateWeeklyTotals(weeklyData);
	const averages = calculateWeeklyAverages(weeklyData);

	return (
		<Box>
			{error && (
				<Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			{/* Week Navigator */}
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexWrap: "wrap",
							gap: 2,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<CalendarMonthOutlined color="primary" />
							<Typography variant="h6" fontWeight="600">
								Weekly Overview
							</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Button
								size="small"
								startIcon={<NavigateBeforeOutlined />}
								onClick={() => navigateWeek("prev")}
							>
								Previous
							</Button>
							<Button size="small" variant="outlined" onClick={goToCurrentWeek}>
								Current Week
							</Button>
							<Button
								size="small"
								endIcon={<NavigateNextOutlined />}
								onClick={() => navigateWeek("next")}
							>
								Next
							</Button>
						</Box>
					</Box>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						{formatWeekRange()}
					</Typography>
				</CardContent>
			</Card>

			{/* Summary Cards */}
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h5" color="primary.main" fontWeight="600">
								{averages.carbs.toFixed(1)}g
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Average Carbs
							</Typography>
							<Chip
								label={`Total: ${totals.carbs.toFixed(0)}g`}
								size="small"
								variant="outlined"
								color="primary"
							/>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: "block", mt: 1 }}
							>
								Goal: {goals.carbs}g
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h5" color="secondary.main" fontWeight="600">
								{averages.protein.toFixed(1)}g
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Average Protein
							</Typography>
							<Chip
								label={`Total: ${totals.protein.toFixed(0)}g`}
								size="small"
								variant="outlined"
								color="secondary"
							/>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: "block", mt: 1 }}
							>
								Goal: {goals.protein}g
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h5" color="warning.main" fontWeight="600">
								{averages.fat.toFixed(1)}g
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Average Fat
							</Typography>
							<Chip
								label={`Total: ${totals.fat.toFixed(0)}g`}
								size="small"
								variant="outlined"
								color="warning"
							/>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: "block", mt: 1 }}
							>
								Goal: {goals.fat}g
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h5" color="success.main" fontWeight="600">
								{averages.calories.toFixed(0)}
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Average Calories
							</Typography>
							<Chip
								label={`Total: ${totals.calories.toFixed(0)}`}
								size="small"
								variant="outlined"
								color="success"
							/>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: "block", mt: 1 }}
							>
								Goal: {goals.calories}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Macronutrients Line Chart */}
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Typography
						variant="h6"
						gutterBottom
						sx={{ display: "flex", alignItems: "center", gap: 1 }}
					>
						<TrendingUpOutlined color="primary" />
						Macronutrients Throughout the Week
					</Typography>
					<ResponsiveContainer width="100%" height={300}>
						<LineChart data={weeklyData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
							<YAxis />
							<Tooltip
								content={({ active, payload }) => {
									if (active && payload && payload.length) {
										const data = payload[0].payload;
										return (
											<Box
												sx={{
													bgcolor: "background.paper",
													p: 1.5,
													border: 1,
													borderColor: "divider",
													borderRadius: 1,
												}}
											>
												<Typography
													variant="body2"
													fontWeight="600"
													gutterBottom
												>
													{data.dayName} ({data.date})
												</Typography>
												<Typography variant="caption" color="primary.main">
													Carbs: {data.carbs.toFixed(1)}g
												</Typography>
												<br />
												<Typography variant="caption" color="secondary.main">
													Protein: {data.protein.toFixed(1)}g
												</Typography>
												<br />
												<Typography variant="caption" color="warning.main">
													Fat: {data.fat.toFixed(1)}g
												</Typography>
											</Box>
										);
									}
									return null;
								}}
							/>
							<Legend />
							<Line
								type="monotone"
								dataKey="carbs"
								stroke="#1976d2"
								name="Carbs (g)"
								strokeWidth={2}
								dot={{ r: 4 }}
							/>
							<Line
								type="monotone"
								dataKey="protein"
								stroke="#9c27b0"
								name="Protein (g)"
								strokeWidth={2}
								dot={{ r: 4 }}
							/>
							<Line
								type="monotone"
								dataKey="fat"
								stroke="#ed6c02"
								name="Fat (g)"
								strokeWidth={2}
								dot={{ r: 4 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Calories Bar Chart */}
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Calories Throughout the Week
					</Typography>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={weeklyData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
							<YAxis />
							<Tooltip
								content={({ active, payload }) => {
									if (active && payload && payload.length) {
										const data = payload[0].payload;
										return (
											<Box
												sx={{
													bgcolor: "background.paper",
													p: 1.5,
													border: 1,
													borderColor: "divider",
													borderRadius: 1,
												}}
											>
												<Typography
													variant="body2"
													fontWeight="600"
													gutterBottom
												>
													{data.dayName} ({data.date})
												</Typography>
												<Typography variant="caption" color="success.main">
													Calories: {data.calories.toFixed(0)}
												</Typography>
												<br />
												<Typography variant="caption" color="text.secondary">
													Goal: {goals.calories}
												</Typography>
											</Box>
										);
									}
									return null;
								}}
							/>
							<Legend />
							<Bar dataKey="calories" fill="#2e7d32" name="Calories" />
							<Bar
								dataKey={() => goals.calories}
								fill="#90caf9"
								name="Goal"
								opacity={0.3}
							/>
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>
		</Box>
	);
};

export default WeeklySummary;
