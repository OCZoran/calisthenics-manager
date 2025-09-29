import React, { JSX, useMemo, useState } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	Cell,
	PieChart,
	Pie,
} from "recharts";
import {
	TrendingUp,
	TrendingDown,
	Minus,
	Calendar,
	Repeat,
	Weight,
	Timer,
	Activity,
	Filter,
	Clock,
} from "lucide-react";
import { Workout } from "@/global/interfaces/workout.interface";

interface EnhancedWorkoutDashboardProps {
	workouts: Workout[];
	planId?: string;
	planName?: string;
}

const workoutTypeConfig: Record<
	string,
	{ label: string; color: string; icon: string }
> = {
	push: { label: "Push", color: "#FF6B6B", icon: "💪" },
	pull: { label: "Pull", color: "#4ECDC4", icon: "🔙" },
	legs: { label: "Legs", color: "#45B7D1", icon: "🦵" },
	upper: { label: "Upper", color: "#96CEB4", icon: "💪" },
	lower: { label: "Lower", color: "#FECA57", icon: "🦵" },
	"full-body": { label: "Full Body", color: "#9B59B6", icon: "🏋️" },
	cardio: { label: "Cardio", color: "#FF9F43", icon: "❤️" },
	other: { label: "Other", color: "#74B9FF", icon: "⚡" },
};

const EnhancedWorkoutDashboard: React.FC<EnhancedWorkoutDashboardProps> = ({
	workouts,
	planId,
	planName,
}) => {
	const [selectedType, setSelectedType] = useState<string>("all");

	// Filter workouts po planu ako je proslijeđen
	const planWorkouts = useMemo(() => {
		if (!planId) return workouts;
		return workouts.filter((w) => w.planId === planId);
	}, [workouts, planId]);

	// Filter po tipu treninga
	const filteredWorkouts = useMemo(() => {
		if (selectedType === "all") return planWorkouts;
		return planWorkouts.filter((w) => w.type === selectedType);
	}, [planWorkouts, selectedType]);

	// Grupisanje treninga po tipovima za filter dugmad
	const workoutsByType = useMemo(() => {
		return planWorkouts.reduce((acc, workout) => {
			const type = workout.type;
			if (!acc[type]) {
				acc[type] = [];
			}
			acc[type].push(workout);
			return acc;
		}, {} as Record<string, Workout[]>);
	}, [planWorkouts]);

	// PROŠIRENI KOD - sa hold statistikama
	const transformedWorkouts = useMemo(() => {
		return filteredWorkouts.map((workout) => {
			// Izračunavanje ukupnih ponavljanja
			const totalReps = workout.exercises.reduce((sum, exercise) => {
				return (
					sum +
					exercise.sets.reduce((setSum, set) => {
						return setSum + (parseInt(set.reps) || 0);
					}, 0)
				);
			}, 0);

			// Izračunavanje ukupnog hold vremena
			const totalHoldTime = workout.exercises.reduce((sum, exercise) => {
				return (
					sum +
					exercise.sets.reduce((setSum, set) => {
						return setSum + (parseInt((set as { hold: string }).hold) || 0);
					}, 0)
				);
			}, 0);

			// Izračunavanje ukupnog volumena (samo weighted vježbe)
			const totalVolume = workout.exercises.reduce((sum, exercise) => {
				return (
					sum +
					exercise.sets.reduce((setSum, set) => {
						const weight = parseFloat(set.weight || "0") || 0;
						const reps = parseInt(set.reps) || 0;
						const hold = parseInt((set as { hold: string }).hold) || 0;
						// Volumen može biti od reps ili hold setova sa težinom
						const effectiveVolume =
							reps > 0 ? weight * reps : hold > 0 ? weight * (hold / 10) : 0; // hold/10 kao konverzija
						return setSum + effectiveVolume;
					}, 0)
				);
			}, 0);

			// Izračunavanje prosječnog vremena odmora
			const allRestTimes = workout.exercises.flatMap((exercise) =>
				exercise.sets.map((set) => parseInt(set.rest) || 0)
			);
			const averageRestTime =
				allRestTimes.length > 0
					? Math.round(
							allRestTimes.reduce((sum, rest) => sum + rest, 0) /
								allRestTimes.length
					  )
					: 0;

			// Kreiranje statistika po vježbama
			const exerciseStats = workout.exercises.map((exercise) => {
				const exerciseTotalReps = exercise.sets.reduce(
					(sum, set) => sum + (parseInt(set.reps) || 0),
					0
				);
				const exerciseTotalHold = exercise.sets.reduce(
					(sum, set) => sum + (parseInt((set as { hold: string }).hold) || 0),
					0
				);
				const exerciseTotalVolume = exercise.sets.reduce((sum, set) => {
					const weight = parseFloat(set.weight || "0") || 0;
					const reps = parseInt(set.reps) || 0;
					const hold = parseInt((set as { hold: string }).hold) || 0;
					const effectiveVolume =
						reps > 0 ? weight * reps : hold > 0 ? weight * (hold / 10) : 0;
					return sum + effectiveVolume;
				}, 0);
				const exerciseAvgRest =
					exercise.sets.length > 0
						? Math.round(
								exercise.sets.reduce(
									(sum, set) => sum + (parseInt(set.rest) || 0),
									0
								) / exercise.sets.length
						  )
						: 0;

				// Određivanje tipa vježbe
				const hasWeight = exercise.sets.some(
					(set) => parseFloat(set.weight || "0") > 0
				);
				const hasHold = exercise.sets.some(
					(set) => parseInt((set as { hold: string }).hold || "0") > 0
				);
				const hasReps = exercise.sets.some(
					(set) => parseInt(set.reps || "0") > 0
				);

				let exerciseType: string;
				if (hasHold && !hasReps) {
					exerciseType = hasWeight ? "hold-weighted" : "hold-bodyweight";
				} else if (hasReps && !hasHold) {
					exerciseType = hasWeight ? "weighted" : "bodyweight";
				} else {
					exerciseType = "mixed";
				}

				return {
					exerciseName: exercise.name,
					exerciseType,
					totalReps: exerciseTotalReps,
					totalHoldTime: exerciseTotalHold,
					totalVolume: exerciseTotalVolume,
					averageRest: exerciseAvgRest,
				};
			});

			return {
				_id: workout._id || "",
				workoutDate: workout.date,
				workoutType: workout.type,
				totalReps,
				totalHoldTime,
				totalVolume,
				averageRestTime,
				exerciseStats,
			};
		});
	}, [filteredWorkouts]);

	// Analiza napretka sa hold podrškom
	const progressAnalysis = useMemo(() => {
		if (transformedWorkouts.length < 2) return null;

		const sortedWorkouts = [...transformedWorkouts].sort(
			(a, b) =>
				new Date(a.workoutDate).getTime() - new Date(b.workoutDate).getTime()
		);

		// Trend analiza za različite tipove
		const bodyweightData: { date: string; reps: number }[] = [];
		const weightedData: { date: string; volume: number }[] = [];
		const holdData: { date: string; holdTime: number }[] = [];
		const restTimeData: { date: string; rest: number; type: string }[] = [];

		// Grupiranje vježbi po tipu sa hold podrškom
		const exerciseProgress: {
			[key: string]: {
				type: string;
				data: {
					date: string;
					value: number;
					holdTime?: number;
					rest: number;
				}[];
			};
		} = {};

		sortedWorkouts.forEach((workout) => {
			const date = new Date(workout.workoutDate).toLocaleDateString("sr-RS", {
				day: "2-digit",
				month: "2-digit",
			});

			let bodyweightReps = 0;
			let weightedVolume = 0;
			let totalHoldTime = 0;

			workout.exerciseStats.forEach((exercise) => {
				if (exercise.exerciseType === "bodyweight") {
					bodyweightReps += exercise.totalReps;
				} else if (exercise.exerciseType.includes("weighted")) {
					weightedVolume += exercise.totalVolume;
				}

				if (exercise.exerciseType.includes("hold")) {
					totalHoldTime += exercise.totalHoldTime;
				}

				// Praćenje napretka po vježbama
				if (!exerciseProgress[exercise.exerciseName]) {
					exerciseProgress[exercise.exerciseName] = {
						type: exercise.exerciseType,
						data: [],
					};
				}

				let value: number;
				if (exercise.exerciseType === "bodyweight") {
					value = exercise.totalReps;
				} else if (exercise.exerciseType.includes("hold")) {
					value = exercise.totalHoldTime;
				} else {
					value = exercise.totalVolume;
				}

				exerciseProgress[exercise.exerciseName].data.push({
					date,
					value,
					holdTime:
						exercise.totalHoldTime > 0 ? exercise.totalHoldTime : undefined,
					rest: exercise.averageRest,
				});
			});

			if (bodyweightReps > 0) {
				bodyweightData.push({ date, reps: bodyweightReps });
			}

			if (weightedVolume > 0) {
				weightedData.push({ date, volume: weightedVolume });
			}

			if (totalHoldTime > 0) {
				holdData.push({ date, holdTime: totalHoldTime });
			}

			restTimeData.push({
				date,
				rest: workout.averageRestTime,
				type: workout.workoutType,
			});
		});

		// Izračunavanje trendova
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const calculateTrend = <T extends Record<string, any>>(
			data: T[],
			key: keyof T
		): number => {
			if (data.length < 2) return 0;
			const first = Number(data[0][key]);
			const last = Number(data[data.length - 1][key]);
			return ((last - first) / first) * 100;
		};

		return {
			bodyweightData,
			weightedData,
			holdData,
			restTimeData,
			exerciseProgress,
			trends: {
				bodyweight:
					bodyweightData.length >= 2
						? calculateTrend(bodyweightData, "reps")
						: 0,
				weighted:
					weightedData.length >= 2 ? calculateTrend(weightedData, "volume") : 0,
				hold: holdData.length >= 2 ? calculateTrend(holdData, "holdTime") : 0,
				rest:
					restTimeData.length >= 2 ? calculateTrend(restTimeData, "rest") : 0,
			},
		};
	}, [transformedWorkouts]);

	// Statistike plana sa hold podrškom
	const planStats = useMemo(() => {
		const totalWorkouts = transformedWorkouts.length;
		const totalReps = transformedWorkouts.reduce(
			(sum, w) => sum + w.totalReps,
			0
		);
		const totalHoldTime = transformedWorkouts.reduce(
			(sum, w) => sum + w.totalHoldTime,
			0
		);
		const totalVolume = transformedWorkouts.reduce(
			(sum, w) => sum + w.totalVolume,
			0
		);
		const avgRestTime =
			totalWorkouts > 0
				? transformedWorkouts.reduce((sum, w) => sum + w.averageRestTime, 0) /
				  totalWorkouts
				: 0;

		// Distribucija tipova treninga
		const workoutTypes = transformedWorkouts.reduce(
			(acc: { [key: string]: number }, w) => {
				acc[w.workoutType] = (acc[w.workoutType] || 0) + 1;
				return acc;
			},
			{} as { [key: string]: number }
		);

		return {
			totalWorkouts,
			totalReps,
			totalHoldTime,
			totalVolume,
			avgRestTime: Math.round(avgRestTime),
			workoutTypes: Object.entries(workoutTypes).map(([type, count]) => ({
				name: type,
				value: count,
				percentage: Math.round((count / totalWorkouts) * 100),
			})),
		};
	}, [transformedWorkouts]);

	const getTrendIcon = (trend: number): JSX.Element => {
		if (trend > 5) return <TrendingUp className="text-green-500" size={20} />;
		if (trend < -5) return <TrendingDown className="text-red-500" size={20} />;
		return <Minus className="text-gray-500" size={20} />;
	};

	const getTrendColor = (trend: number): string => {
		if (trend > 5) return "text-green-600";
		if (trend < -5) return "text-red-600";
		return "text-gray-600";
	};

	const workoutTypeColors: Record<string, string> = {
		push: "#3B82F6",
		pull: "#10B981",
		legs: "#F59E0B",
		upper: "#8B5CF6",
		lower: "#EF4444",
		"full-body": "#6B7280",
		cardio: "#EF4444",
	};

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	if (!progressAnalysis) {
		return (
			<div className="p-6 max-w-4xl mx-auto">
				<div className="text-center py-12">
					<Activity className="mx-auto mb-4 text-gray-400" size={64} />
					<h3 className="text-xl font-semibold text-gray-600 mb-2">
						Nedovoljno podataka za analizu
					</h3>
					<p className="text-gray-500">
						Potrebno je minimum 2 treninga za prikaz napretka.
						{selectedType !== "all" &&
							` (${workoutTypeConfig[selectedType]?.label || selectedType})`}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					{planId ? `Napredak: ${planName}` : "Napredak Trening Plana"}
				</h1>
				<p className="text-gray-600">
					Analiza {planStats.totalWorkouts} treninga
					{selectedType !== "all" &&
						` - ${workoutTypeConfig[selectedType]?.label || selectedType}`}
					- Pratite svoj napredak kroz vrijeme
				</p>
			</div>

			{/* Filter Controls */}
			<div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
				<div className="flex items-center gap-4 mb-3">
					<Filter className="text-blue-500" size={20} />
					<span className="font-medium text-gray-800">
						Filtriraj po tipu treninga:
					</span>
				</div>
				<div className="flex gap-2 flex-wrap">
					<button
						onClick={() => setSelectedType("all")}
						className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
							selectedType === "all"
								? "bg-blue-500 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
					>
						Svi trenizi ({planWorkouts.length})
					</button>
					{Object.entries(workoutsByType).map(([type, typeWorkouts]) => (
						<button
							key={type}
							onClick={() => setSelectedType(type)}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
								selectedType === type
									? "text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
							style={{
								backgroundColor:
									selectedType === type
										? workoutTypeConfig[type]?.color
										: undefined,
							}}
						>
							<span>{workoutTypeConfig[type]?.icon}</span>
							{workoutTypeConfig[type]?.label || type}
							<span className="text-xs opacity-75">
								({typeWorkouts.length})
							</span>
						</button>
					))}
				</div>
			</div>

			{/* Statistike - kartice sa hold podrškom */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
				<div className="bg-white rounded-xl shadow-sm border p-6">
					<div className="flex items-center justify-between mb-2">
						<Calendar className="text-blue-500" size={24} />
						<span className="text-2xl font-bold text-gray-900">
							{planStats.totalWorkouts}
						</span>
					</div>
					<p className="text-sm text-gray-600">
						{selectedType === "all"
							? "Ukupno treninga"
							: `${
									workoutTypeConfig[selectedType]?.label || selectedType
							  } treninga`}
					</p>
				</div>

				<div className="bg-white rounded-xl shadow-sm border p-6">
					<div className="flex items-center justify-between mb-2">
						<Repeat className="text-green-500" size={24} />
						<span className="text-2xl font-bold text-gray-900">
							{planStats.totalReps}
						</span>
					</div>
					<p className="text-sm text-gray-600">Ukupno ponavljanja</p>
				</div>

				<div className="bg-white rounded-xl shadow-sm border p-6">
					<div className="flex items-center justify-between mb-2">
						<Clock className="text-indigo-500" size={24} />
						<span className="text-2xl font-bold text-gray-900">
							{planStats.totalHoldTime > 0
								? formatTime(planStats.totalHoldTime)
								: "0"}
						</span>
					</div>
					<p className="text-sm text-gray-600">Ukupno hold vrijeme</p>
				</div>

				<div className="bg-white rounded-xl shadow-sm border p-6">
					<div className="flex items-center justify-between mb-2">
						<Weight className="text-purple-500" size={24} />
						<span className="text-2xl font-bold text-gray-900">
							{planStats.totalVolume > 0
								? `${(planStats.totalVolume / 1000).toFixed(1)}k`
								: "0"}
						</span>
					</div>
					<p className="text-sm text-gray-600">Ukupan volumen (kg)</p>
				</div>

				<div className="bg-white rounded-xl shadow-sm border p-6">
					<div className="flex items-center justify-between mb-2">
						<Timer className="text-orange-500" size={24} />
						<span className="text-2xl font-bold text-gray-900">
							{planStats.avgRestTime}s
						</span>
					</div>
					<p className="text-sm text-gray-600">Prosječan odmor</p>
				</div>
			</div>

			{/* Trend kartice sa hold podrškom */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				{progressAnalysis.trends.bodyweight !== 0 && (
					<div className="bg-white rounded-xl shadow-sm border p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-semibold text-gray-800">
								Bodyweight Progress
							</h3>
							{getTrendIcon(progressAnalysis.trends.bodyweight)}
						</div>
						<div
							className={`text-2xl font-bold ${getTrendColor(
								progressAnalysis.trends.bodyweight
							)} mb-2`}
						>
							{progressAnalysis.trends.bodyweight > 0 ? "+" : ""}
							{progressAnalysis.trends.bodyweight.toFixed(1)}%
						</div>
						<p className="text-sm text-gray-500">Promjena u ponavljanjima</p>
					</div>
				)}

				{progressAnalysis.trends.weighted !== 0 && (
					<div className="bg-white rounded-xl shadow-sm border p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-semibold text-gray-800">Weighted Progress</h3>
							{getTrendIcon(progressAnalysis.trends.weighted)}
						</div>
						<div
							className={`text-2xl font-bold ${getTrendColor(
								progressAnalysis.trends.weighted
							)} mb-2`}
						>
							{progressAnalysis.trends.weighted > 0 ? "+" : ""}
							{progressAnalysis.trends.weighted.toFixed(1)}%
						</div>
						<p className="text-sm text-gray-500">Promjena u volumenu</p>
					</div>
				)}

				{progressAnalysis.trends.hold !== 0 && (
					<div className="bg-white rounded-xl shadow-sm border p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-semibold text-gray-800">Hold Progress</h3>
							{getTrendIcon(progressAnalysis.trends.hold)}
						</div>
						<div
							className={`text-2xl font-bold ${getTrendColor(
								progressAnalysis.trends.hold
							)} mb-2`}
						>
							{progressAnalysis.trends.hold > 0 ? "+" : ""}
							{progressAnalysis.trends.hold.toFixed(1)}%
						</div>
						<p className="text-sm text-gray-500">Promjena u hold vremenu</p>
					</div>
				)}

				<div className="bg-white rounded-xl shadow-sm border p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-semibold text-gray-800">Odmor</h3>
						{getTrendIcon(-progressAnalysis.trends.rest)}
					</div>
					<div
						className={`text-2xl font-bold ${getTrendColor(
							-progressAnalysis.trends.rest
						)} mb-2`}
					>
						{progressAnalysis.trends.rest > 0 ? "+" : ""}
						{progressAnalysis.trends.rest.toFixed(1)}%
					</div>
					<p className="text-sm text-gray-500">Promjena u vremenu odmora</p>
				</div>
			</div>

			{/* Chartovi sa hold podrškom */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Bodyweight napredak */}
				{progressAnalysis.bodyweightData.length > 0 && (
					<div className="bg-white rounded-xl shadow-sm border p-6">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">
							Bodyweight Napredak (Ponavljanja)
						</h3>
						<ResponsiveContainer width="100%" height={250}>
							<LineChart data={progressAnalysis.bodyweightData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip />
								<Line
									type="monotone"
									dataKey="reps"
									stroke="#10B981"
									strokeWidth={3}
									dot={{ fill: "#10B981", r: 6 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				)}

				{/* Weighted napredak */}
				{progressAnalysis.weightedData.length > 0 && (
					<div className="bg-white rounded-xl shadow-sm border p-6">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">
							Weighted Napredak (Volumen kg)
						</h3>
						<ResponsiveContainer width="100%" height={250}>
							<LineChart data={progressAnalysis.weightedData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip />
								<Line
									type="monotone"
									dataKey="volume"
									stroke="#3B82F6"
									strokeWidth={3}
									dot={{ fill: "#3B82F6", r: 6 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				)}

				{/* Hold napredak - NOVO */}
				{progressAnalysis.holdData.length > 0 && (
					<div className="bg-white rounded-xl shadow-sm border p-6">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">
							Hold Napredak (Sekunde)
						</h3>
						<ResponsiveContainer width="100%" height={250}>
							<LineChart data={progressAnalysis.holdData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip
									formatter={(value: number) => [
										formatTime(value),
										"Hold vrijeme",
									]}
								/>
								<Line
									type="monotone"
									dataKey="holdTime"
									stroke="#6366F1"
									strokeWidth={3}
									dot={{ fill: "#6366F1", r: 6 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				)}

				{/* Distribucija tipova treninga */}
				<div className="bg-white rounded-xl shadow-sm border p-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-4">
						Distribucija Tipova Treninga
					</h3>
					<ResponsiveContainer width="100%" height={250}>
						<PieChart>
							<Pie
								data={planStats.workoutTypes}
								cx="50%"
								cy="50%"
								outerRadius={80}
								dataKey="value"
								label={({ name, percentage }) => `${name} (${percentage}%)`}
							>
								{planStats.workoutTypes.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={workoutTypeColors[entry.name] || "#6B7280"}
									/>
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</ResponsiveContainer>
				</div>

				{/* Vremena odmora */}
				<div className="bg-white rounded-xl shadow-sm border p-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-4">
						Vremena Odmora (sekunde)
					</h3>
					<ResponsiveContainer width="100%" height={250}>
						<BarChart data={progressAnalysis.restTimeData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="date" />
							<YAxis />
							<Tooltip />
							<Bar dataKey="rest" fill="#F59E0B" radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Napredak po vježbama sa hold podrškom */}
			{Object.keys(progressAnalysis.exerciseProgress).length > 0 && (
				<div className="bg-white rounded-xl shadow-sm border p-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-6">
						Napredak po Vježbama
					</h3>

					<div className="grid gap-6">
						{Object.entries(progressAnalysis.exerciseProgress).map(
							([exerciseName, data]) => (
								<div
									key={exerciseName}
									className="border-l-4 border-blue-500 pl-4"
								>
									<div className="flex items-center justify-between mb-3">
										<h4 className="font-medium text-gray-800">
											{exerciseName}
										</h4>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												data.type === "bodyweight"
													? "bg-green-100 text-green-800"
													: data.type.includes("hold")
													? "bg-indigo-100 text-indigo-800"
													: data.type === "weighted"
													? "bg-blue-100 text-blue-800"
													: "bg-gray-100 text-gray-800"
											}`}
										>
											{data.type === "bodyweight"
												? "Body Weight"
												: data.type === "hold-bodyweight"
												? "Hold Body Weight"
												: data.type === "hold-weighted"
												? "Hold Weighted"
												: data.type === "weighted"
												? "Weighted"
												: "Mixed"}
										</span>
									</div>

									<ResponsiveContainer width="100%" height={200}>
										<LineChart data={data.data}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" />
											<YAxis yAxisId="left" />
											<YAxis yAxisId="right" orientation="right" />
											<Tooltip
												formatter={(value: number | string, name: string) => {
													if (
														name === "Ponavljanja" ||
														name === "Volumen (kg)"
													) {
														return [value, name];
													}
													if (name === "Hold vrijeme") {
														return [formatTime(Number(value)), name];
													}
													if (name === "Odmor (s)") {
														return [value, name];
													}
													return [value, name];
												}}
											/>
											<Line
												yAxisId="left"
												type="monotone"
												dataKey="value"
												stroke={
													data.type === "bodyweight"
														? "#10B981"
														: data.type.includes("hold")
														? "#6366F1"
														: "#3B82F6"
												}
												strokeWidth={2}
												dot={{ r: 4 }}
												name={
													data.type === "bodyweight"
														? "Ponavljanja"
														: data.type.includes("hold")
														? "Hold vrijeme"
														: "Volumen (kg)"
												}
											/>
											{data.data.some((d) => d.holdTime && d.holdTime > 0) && (
												<Line
													yAxisId="left"
													type="monotone"
													dataKey="holdTime"
													stroke="#8B5CF6"
													strokeWidth={2}
													strokeDasharray="3 3"
													dot={{ r: 3 }}
													name="Hold vrijeme"
												/>
											)}
											<Line
												yAxisId="right"
												type="monotone"
												dataKey="rest"
												stroke="#F59E0B"
												strokeWidth={2}
												strokeDasharray="5 5"
												dot={{ r: 3 }}
												name="Odmor (s)"
											/>
										</LineChart>
									</ResponsiveContainer>
								</div>
							)
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default EnhancedWorkoutDashboard;
