/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Tab,
	Tabs,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Grid,
	Chip,
	Alert,
	Stack,
	useTheme,
	alpha,
} from "@mui/material";
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Area,
	AreaChart,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import {
	TrendingUp,
	FitnessCenter,
	Timer,
	MonitorWeight,
	Assessment,
} from "@mui/icons-material";

// Mock data based on your structure
const mockWorkoutStatistics = [
	{
		_id: "68d1689b85dbe0091ed254b2",
		userId: "68b1e84cbc5e9bf88290653b",
		planId: "68d1682885dbe0091ed254b0",
		workoutId: "68d1689b85dbe0091ed254b1",
		workoutDate: "2025-09-15",
		workoutType: "push",
		totalExercises: 3,
		totalSets: 9,
		totalReps: 135,
		totalVolume: 1200,
		mixedMetric: 255,
		averageRestTime: 42,
		exerciseStats: [
			{
				exerciseName: "Bench Press",
				exerciseType: "weighted",
				totalReps: 50,
				totalVolume: 1000,
				averageRest: 55,
				maxWeight: 82.5,
			},
			{
				exerciseName: "Push ups",
				exerciseType: "bodyweight",
				totalReps: 70,
				totalVolume: 70,
				averageRest: 25,
			},
			{
				exerciseName: "Shoulder Press",
				exerciseType: "weighted",
				totalReps: 30,
				totalVolume: 350,
				averageRest: 45,
				maxWeight: 27.5,
			},
		],
	},
];

const WorkoutStatisticsDashboard = () => {
	const theme = useTheme();
	const [tabValue, setTabValue] = useState(0);
	const [selectedExercise, setSelectedExercise] = useState("all");

	// Get unique exercises for dropdown
	const uniqueExercises = useMemo(() => {
		const exercises = new Set();
		mockWorkoutStatistics.forEach((workout) => {
			workout.exerciseStats.forEach((ex) => exercises.add(ex.exerciseName));
		});
		return Array.from(exercises);
	}, []);

	// Prepare data for overall workout progress
	const workoutProgressData = useMemo(() => {
		return mockWorkoutStatistics
			.map((workout) => ({
				date: new Date(workout.workoutDate).toLocaleDateString("sr-RS", {
					day: "2-digit",
					month: "2-digit",
				}),
				fullDate: workout.workoutDate,
				totalReps: workout.totalReps,
				totalVolume: workout.totalVolume,
				mixedMetric: workout.mixedMetric,
				workoutType: workout.workoutType,
				averageRest: workout.averageRestTime,
				totalExercises: workout.totalExercises,
				totalSets: workout.totalSets,
			}))
			.sort(
				(a, b) =>
					new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
			);
	}, []);

	// Prepare data for specific exercise progress
	const exerciseProgressData = useMemo(() => {
		if (selectedExercise === "all") return [];

		const progressData: any = [];
		mockWorkoutStatistics.forEach((workout) => {
			const exercise = workout.exerciseStats.find(
				(ex) => ex.exerciseName === selectedExercise
			);
			if (exercise) {
				progressData.push({
					date: new Date(workout.workoutDate).toLocaleDateString("sr-RS", {
						day: "2-digit",
						month: "2-digit",
					}),
					fullDate: workout.workoutDate,
					totalReps: exercise.totalReps,
					totalVolume: exercise.totalVolume,
					averageRest: exercise.averageRest,
					maxWeight: exercise.maxWeight || 0,
					exerciseType: exercise.exerciseType,
				});
			}
		});

		return progressData.sort(
			(a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
		);
	}, [selectedExercise]);

	// Workout type distribution data
	const workoutTypeData = useMemo(() => {
		const typeCount = {};
		mockWorkoutStatistics.forEach((workout) => {
			typeCount[workout.workoutType] =
				(typeCount[workout.workoutType] || 0) + 1;
		});

		const colors = {
			push: "#1976d2",
			pull: "#9c27b0",
			legs: "#2e7d32",
			upper: "#ed6c02",
			lower: "#d32f2f",
			"full-body": "#0288d1",
		};

		return Object.entries(typeCount).map(([type, count]) => ({
			name: type.charAt(0).toUpperCase() + type.slice(1),
			value: count,
			color: colors[type] || "#757575",
		}));
	}, []);

	const formatTooltip = (value, name, props) => {
		if (name === "totalVolume") return [`${value} kg`, "Ukupni volumen"];
		if (name === "totalReps") return [`${value}`, "Ukupno ponavljanja"];
		if (name === "mixedMetric") return [`${value}`, "Mješovita metrika"];
		if (name === "averageRest") return [`${value}s`, "Prosjek odmora"];
		if (name === "maxWeight") return [`${value} kg`, "Max težina"];
		return [value, name];
	};

	const StatCard = ({
		title,
		value,
		subtitle,
		icon: Icon,
		color = "primary",
	}) => (
		<Card sx={{ height: "100%", borderRadius: 2 }}>
			<CardContent
				sx={{ display: "flex", alignItems: "center", height: "100%" }}
			>
				<Box sx={{ flexGrow: 1 }}>
					<Typography variant="body2" color="text.secondary" gutterBottom>
						{title}
					</Typography>
					<Typography
						variant="h4"
						sx={{
							color:
								color === "primary"
									? "#1976d2"
									: color === "success"
									? "#2e7d32"
									: color === "warning"
									? "#ed6c02"
									: "#0288d1",
						}}
						fontWeight="bold"
					>
						{value}
					</Typography>
					{subtitle && (
						<Typography variant="body2" color="text.secondary">
							{subtitle}
						</Typography>
					)}
				</Box>
				<Box
					sx={{
						bgcolor: alpha(
							color === "primary"
								? "#1976d2"
								: color === "success"
								? "#2e7d32"
								: color === "warning"
								? "#ed6c02"
								: "#0288d1",
							0.1
						),
						borderRadius: 2,
						p: 1.5,
						ml: 2,
					}}
				>
					<Icon
						sx={{
							color:
								color === "primary"
									? "#1976d2"
									: color === "success"
									? "#2e7d32"
									: color === "warning"
									? "#ed6c02"
									: "#0288d1",
							fontSize: 32,
						}}
					/>
				</Box>
			</CardContent>
		</Card>
	);

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
				Statistike napretka
			</Typography>

			{/* Summary Cards */}
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid item xs={12} sm={6} md={3}>
					<StatCard
						title="Ukupno treninga"
						value={mockWorkoutStatistics.length}
						subtitle="u aktivnom planu"
						icon={FitnessCenter}
						color="primary"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<StatCard
						title="Ukupno ponavljanja"
						value={workoutProgressData.reduce((sum, w) => sum + w.totalReps, 0)}
						subtitle="sva vježba"
						icon={TrendingUp}
						color="success"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<StatCard
						title="Ukupni volumen"
						value={`${workoutProgressData.reduce(
							(sum, w) => sum + w.totalVolume,
							0
						)} kg`}
						subtitle="težinske vježbe"
						icon={MonitorWeight}
						color="warning"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<StatCard
						title="Prosječan odmor"
						value={`${Math.round(
							workoutProgressData.reduce((sum, w) => sum + w.averageRest, 0) /
								workoutProgressData.length
						)}s`}
						subtitle="između serija"
						icon={Timer}
						color="info"
					/>
				</Grid>
			</Grid>

			{/* Tabs for different views */}
			<Card sx={{ mb: 3 }}>
				<Tabs
					value={tabValue}
					onChange={(e, newValue) => setTabValue(newValue)}
					sx={{ borderBottom: 1, borderColor: "divider" }}
				>
					<Tab label="Napredak po trening planu" />
					<Tab label="Napredak po vježbi" />
					<Tab label="Analiza treninga" />
				</Tabs>
			</Card>

			{/* Tab Content */}
			{tabValue === 0 && (
				<Stack spacing={3}>
					{/* Overall Workout Progress Chart */}
					<Card>
						<CardContent>
							<Typography
								variant="h6"
								gutterBottom
								sx={{ display: "flex", alignItems: "center", gap: 1 }}
							>
								<Assessment />
								Ukupan napredak po treningu
							</Typography>
							<ResponsiveContainer width="100%" height={300}>
								<AreaChart data={workoutProgressData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis yAxisId="left" orientation="left" />
									<YAxis yAxisId="right" orientation="right" />
									<Tooltip formatter={formatTooltip} />
									<Legend />
									<Area
										yAxisId="left"
										type="monotone"
										dataKey="totalReps"
										stackId="1"
										stroke="#2e7d32"
										fill={alpha("#2e7d32", 0.3)}
										name="Ukupno ponavljanja"
									/>
									<Area
										yAxisId="right"
										type="monotone"
										dataKey="totalVolume"
										stackId="2"
										stroke="#1976d2"
										fill={alpha("#1976d2", 0.3)}
										name="Ukupni volumen (kg)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Mixed Metric Trend */}
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								Mješovita metrika (BW reps + weighted volume/10)
							</Typography>
							<ResponsiveContainer width="100%" height={250}>
								<LineChart data={workoutProgressData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip formatter={formatTooltip} />
									<Legend />
									<Line
										type="monotone"
										dataKey="mixedMetric"
										stroke="#9c27b0"
										strokeWidth={3}
										dot={{ fill: "#9c27b0", strokeWidth: 2, r: 6 }}
										name="Mješovita metrika"
									/>
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Average Rest Time Trend */}
					<Card>
						<CardContent>
							<Typography
								variant="h6"
								gutterBottom
								sx={{ display: "flex", alignItems: "center", gap: 1 }}
							>
								<Timer />
								Prosječan odmor između serija
							</Typography>
							<ResponsiveContainer width="100%" height={200}>
								<BarChart data={workoutProgressData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip formatter={formatTooltip} />
									<Bar
										dataKey="averageRest"
										fill="#0288d1"
										name="Prosječan odmor (s)"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</Stack>
			)}

			{tabValue === 1 && (
				<Stack spacing={3}>
					{/* Exercise Selection */}
					<Card>
						<CardContent>
							<FormControl sx={{ minWidth: 200 }}>
								<InputLabel>Izaberite vježbu</InputLabel>
								<Select
									value={selectedExercise}
									label="Izaberite vježbu"
									onChange={(e) => setSelectedExercise(e.target.value)}
								>
									<MenuItem value="all">Sve vježbe</MenuItem>
									{uniqueExercises.map((exercise) => (
										<MenuItem key={exercise} value={exercise}>
											{exercise}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</CardContent>
					</Card>

					{selectedExercise !== "all" && exerciseProgressData.length > 0 && (
						<>
							{/* Exercise Type Info */}
							<Alert
								severity="info"
								sx={{ borderRadius: 2 }}
								icon={<FitnessCenter />}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 2,
										flexWrap: "wrap",
									}}
								>
									<Typography>
										<strong>{selectedExercise}</strong> -{" "}
										{exerciseProgressData[0]?.exerciseType === "bodyweight"
											? "Bodyweight vježba"
											: "Vježba sa teretom"}
									</Typography>
									<Chip
										label={
											exerciseProgressData[0]?.exerciseType === "bodyweight"
												? "Bodweight"
												: "Weighted"
										}
										color={
											exerciseProgressData[0]?.exerciseType === "bodyweight"
												? "success"
												: "primary"
										}
										size="small"
									/>
								</Box>
							</Alert>

							{/* Exercise Progress Chart */}
							<Card>
								<CardContent>
									<Typography variant="h6" gutterBottom>
										Napredak za: {selectedExercise}
									</Typography>
									<ResponsiveContainer width="100%" height={300}>
										<LineChart data={exerciseProgressData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" />
											<YAxis yAxisId="left" orientation="left" />
											{exerciseProgressData[0]?.exerciseType === "weighted" && (
												<YAxis yAxisId="right" orientation="right" />
											)}
											<Tooltip formatter={formatTooltip} />
											<Legend />

											{/* Primary metric based on exercise type */}
											<Line
												yAxisId="left"
												type="monotone"
												dataKey={
													exerciseProgressData[0]?.exerciseType === "bodyweight"
														? "totalReps"
														: "totalVolume"
												}
												stroke="#1976d2"
												strokeWidth={3}
												dot={{ fill: "#1976d2", strokeWidth: 2, r: 6 }}
												name={
													exerciseProgressData[0]?.exerciseType === "bodyweight"
														? "Ukupno ponavljanja"
														: "Ukupni volumen (kg)"
												}
											/>

											{/* Max weight for weighted exercises */}
											{exerciseProgressData[0]?.exerciseType === "weighted" && (
												<Line
													yAxisId="right"
													type="monotone"
													dataKey="maxWeight"
													stroke="#2e7d32"
													strokeWidth={2}
													dot={{ fill: "#2e7d32", strokeWidth: 2, r: 4 }}
													name="Max težina (kg)"
												/>
											)}

											{/* Average rest time */}
											<Line
												yAxisId="left"
												type="monotone"
												dataKey="averageRest"
												stroke="#ed6c02"
												strokeWidth={2}
												strokeDasharray="5 5"
												dot={{ fill: "#ed6c02", strokeWidth: 2, r: 4 }}
												name="Prosječan odmor (s)"
											/>
										</LineChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						</>
					)}

					{selectedExercise === "all" && (
						<Alert severity="info" sx={{ borderRadius: 2 }}>
							Molimo izaberite specifičnu vježbu da biste vidjeli napredak.
						</Alert>
					)}
				</Stack>
			)}

			{tabValue === 2 && (
				<Stack spacing={3}>
					{/* Workout Type Distribution */}
					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Card>
								<CardContent>
									<Typography variant="h6" gutterBottom>
										Distribucija tipova treninga
									</Typography>
									<ResponsiveContainer width="100%" height={250}>
										<PieChart>
											<Pie
												data={workoutTypeData}
												cx="50%"
												cy="50%"
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
												label={({ name, percent }) =>
													`${name}: ${(percent * 100).toFixed(0)}%`
												}
											>
												{workoutTypeData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.color} />
												))}
											</Pie>
											<Tooltip />
										</PieChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						</Grid>

						<Grid item xs={12} md={6}>
							<Card>
								<CardContent>
									<Typography variant="h6" gutterBottom>
										Broj vježbi po treningu
									</Typography>
									<ResponsiveContainer width="100%" height={250}>
										<BarChart data={workoutProgressData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" />
											<YAxis />
											<Tooltip />
											<Bar
												dataKey="totalExercises"
												fill="#9c27b0"
												name="Broj vježbi"
												radius={[4, 4, 0, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						</Grid>

						<Grid item xs={12}>
							<Card>
								<CardContent>
									<Typography variant="h6" gutterBottom>
										Broj setova po treningu
									</Typography>
									<ResponsiveContainer width="100%" height={250}>
										<AreaChart data={workoutProgressData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" />
											<YAxis />
											<Tooltip />
											<Area
												type="monotone"
												dataKey="totalSets"
												stroke="#2e7d32"
												fill={alpha("#2e7d32", 0.3)}
												name="Ukupno setova"
											/>
										</AreaChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				</Stack>
			)}
		</Box>
	);
};

export default WorkoutStatisticsDashboard;
