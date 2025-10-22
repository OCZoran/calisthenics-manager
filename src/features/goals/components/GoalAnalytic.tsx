"use client";

import React from "react";
import {
	Box,
	Paper,
	Typography,
	Grid,
	Card,
	CardContent,
	Avatar,
	Stack,
	LinearProgress,
	Chip,
} from "@mui/material";
import {
	TrendingUp,
	CalendarToday,
	EmojiEvents,
	Whatshot,
	SentimentSatisfied,
	Update as UpdateIcon,
	Timeline as TimelineIcon,
	Star,
} from "@mui/icons-material";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import { Goal } from "../goal.interface";

interface GoalAnalyticsProps {
	goal: Goal;
}

const GoalAnalytics: React.FC<GoalAnalyticsProps> = ({ goal }) => {
	// Calculate analytics
	const totalUpdates = goal.updates?.length || 0;
	const progressUpdates =
		goal.updates?.filter((u) => u.status === "progress").length || 0;
	const regressUpdates =
		goal.updates?.filter((u) => u.status === "regress").length || 0;
	const neutralUpdates =
		goal.updates?.filter((u) => u.status === "neutral").length || 0;

	const avgFeeling =
		totalUpdates > 0
			? parseFloat(
					(
						goal.updates.reduce((sum, u) => sum + u.feeling, 0) / totalUpdates
					).toFixed(1)
			  )
			: 0;

	const daysSinceStart = Math.floor(
		(new Date().getTime() - new Date(goal.startDate).getTime()) /
			(1000 * 60 * 60 * 24)
	);

	const updatesPerWeek =
		totalUpdates > 0 && daysSinceStart > 0
			? ((totalUpdates / daysSinceStart) * 7).toFixed(1)
			: 0;

	// Prepare chart data
	const feelingTrend =
		goal.updates
			?.slice()
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.map((update, idx) => ({
				name: `U${idx + 1}`,
				feeling: update.feeling,
				date: new Date(update.date).toLocaleDateString("sr-RS", {
					month: "short",
					day: "numeric",
				}),
			})) || [];

	const statusData = [
		{ name: "Napredak", value: progressUpdates, color: "#4caf50" },
		{ name: "Nazadovanje", value: regressUpdates, color: "#f44336" },
		{ name: "Neutralno", value: neutralUpdates, color: "#9e9e9e" },
	].filter((item) => item.value > 0);

	// Find longest streak
	const calculateStreak = () => {
		if (!goal.updates || goal.updates.length === 0) return 0;

		const sortedUpdates = [...goal.updates].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);

		let maxStreak = 1;
		let currentStreak = 1;

		for (let i = 1; i < sortedUpdates.length; i++) {
			const prevDate = new Date(sortedUpdates[i - 1].date);
			const currDate = new Date(sortedUpdates[i].date);
			const diffDays = Math.floor(
				(currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
			);

			if (diffDays <= 2) {
				currentStreak++;
				maxStreak = Math.max(maxStreak, currentStreak);
			} else {
				currentStreak = 1;
			}
		}

		return maxStreak;
	};

	const longestStreak = calculateStreak();

	// Don't render if no updates
	if (totalUpdates === 0) {
		return (
			<Box sx={{ mb: 4 }}>
				<Typography
					variant="h5"
					fontWeight="600"
					sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
				>
					<TimelineIcon color="primary" />
					Analitika & Uvidi
				</Typography>
				<Paper
					elevation={0}
					sx={{
						p: 6,
						borderRadius: 3,
						border: "2px dashed",
						borderColor: "divider",
						textAlign: "center",
					}}
				>
					<TimelineIcon
						sx={{ fontSize: 64, color: "action.disabled", mb: 2 }}
					/>
					<Typography color="text.secondary" variant="h6">
						Još uvijek nema dovoljno podataka za analitiku
					</Typography>
					<Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
						Dodaj nekoliko update-a da bi vidio/la detaljnu analitiku napretka
					</Typography>
				</Paper>
			</Box>
		);
	}

	return (
		<Box sx={{ mb: 4 }}>
			<Typography
				variant="h5"
				fontWeight="600"
				sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
			>
				<TimelineIcon color="primary" />
				Analitika & Uvidi
			</Typography>

			{/* Quick Stats Grid */}
			<Grid container spacing={2} sx={{ mb: 3 }}>
				<Grid size={{ xs: 6, sm: 3 }}>
					<Card
						elevation={0}
						sx={{
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 3,
							height: "100%",
						}}
					>
						<CardContent sx={{ textAlign: "center", py: 2.5 }}>
							<Avatar
								sx={{
									bgcolor: "primary.lighter",
									color: "primary.main",
									mx: "auto",
									mb: 1.5,
									width: 48,
									height: 48,
								}}
							>
								<UpdateIcon />
							</Avatar>
							<Typography variant="h4" fontWeight="700" color="primary.main">
								{totalUpdates}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								fontWeight={500}
							>
								Ukupno Update-a
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 6, sm: 3 }}>
					<Card
						elevation={0}
						sx={{
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 3,
							height: "100%",
						}}
					>
						<CardContent sx={{ textAlign: "center", py: 2.5 }}>
							<Avatar
								sx={{
									bgcolor: "success.lighter",
									color: "success.main",
									mx: "auto",
									mb: 1.5,
									width: 48,
									height: 48,
								}}
							>
								<SentimentSatisfied />
							</Avatar>
							<Typography variant="h4" fontWeight="700" color="success.main">
								{avgFeeling}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								fontWeight={500}
							>
								Prosječan Osjećaj
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 6, sm: 3 }}>
					<Card
						elevation={0}
						sx={{
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 3,
							height: "100%",
						}}
					>
						<CardContent sx={{ textAlign: "center", py: 2.5 }}>
							<Avatar
								sx={{
									bgcolor: "warning.lighter",
									color: "warning.main",
									mx: "auto",
									mb: 1.5,
									width: 48,
									height: 48,
								}}
							>
								<Whatshot />
							</Avatar>
							<Typography variant="h4" fontWeight="700" color="warning.main">
								{longestStreak}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								fontWeight={500}
							>
								Najduži Niz
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 6, sm: 3 }}>
					<Card
						elevation={0}
						sx={{
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 3,
							height: "100%",
						}}
					>
						<CardContent sx={{ textAlign: "center", py: 2.5 }}>
							<Avatar
								sx={{
									bgcolor: "info.lighter",
									color: "info.main",
									mx: "auto",
									mb: 1.5,
									width: 48,
									height: 48,
								}}
							>
								<CalendarToday />
							</Avatar>
							<Typography variant="h4" fontWeight="700" color="info.main">
								{updatesPerWeek}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								fontWeight={500}
							>
								Update-a Sedmično
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Charts Row */}
			<Grid container spacing={3}>
				{/* Feeling Trend Chart */}
				<Grid size={{ xs: 12, md: 8 }}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 3,
							height: "100%",
						}}
					>
						<Typography
							variant="h6"
							fontWeight="600"
							gutterBottom
							sx={{ display: "flex", alignItems: "center", gap: 1 }}
						>
							<TrendingUp color="primary" fontSize="small" />
							Trend Osjećaja Kroz Vrijeme
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ mb: 3, display: "block" }}
						>
							Kako se tvoj osjećaj mijenjao sa svakim update-om
						</Typography>

						{feelingTrend.length > 0 ? (
							<ResponsiveContainer width="100%" height={250}>
								<LineChart data={feelingTrend}>
									<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
									<XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#999" />
									<YAxis
										domain={[0, 5]}
										ticks={[1, 2, 3, 4, 5]}
										tick={{ fontSize: 12 }}
										stroke="#999"
									/>
									<Tooltip
										contentStyle={{
											borderRadius: 8,
											border: "1px solid #e0e0e0",
										}}
										formatter={(value) => [`Osjećaj: ${value}/5`, ""]}
									/>
									<Line
										type="monotone"
										dataKey="feeling"
										stroke="#667eea"
										strokeWidth={3}
										dot={{ fill: "#667eea", r: 5 }}
										activeDot={{ r: 7 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						) : (
							<Box sx={{ textAlign: "center", py: 6 }}>
								<Typography color="text.secondary">
									Nema dovoljno podataka
								</Typography>
							</Box>
						)}
					</Paper>
				</Grid>

				{/* Status Distribution */}
				<Grid size={{ xs: 12, md: 4 }}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 3,
							height: "100%",
						}}
					>
						<Typography
							variant="h6"
							fontWeight="600"
							gutterBottom
							sx={{ display: "flex", alignItems: "center", gap: 1 }}
						>
							<EmojiEvents color="warning" fontSize="small" />
							Distribucija Statusa
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ mb: 2, display: "block" }}
						>
							Pregled svih tvojih update-a
						</Typography>

						{statusData.length > 0 ? (
							<>
								<ResponsiveContainer width="100%" height={180}>
									<PieChart>
										<Pie
											data={statusData}
											cx="50%"
											cy="50%"
											innerRadius={50}
											outerRadius={70}
											paddingAngle={5}
											dataKey="value"
										>
											{statusData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>

								<Stack spacing={1.5} sx={{ mt: 2 }}>
									{statusData.map((item) => (
										<Box key={item.name}>
											<Box
												sx={{
													display: "flex",
													justifyContent: "space-between",
													mb: 0.5,
												}}
											>
												<Typography variant="body2" fontWeight={500}>
													{item.name}
												</Typography>
												<Typography
													variant="body2"
													fontWeight={600}
													color={item.color}
												>
													{item.value} (
													{totalUpdates > 0
														? Math.round((item.value / totalUpdates) * 100)
														: 0}
													%)
												</Typography>
											</Box>
											<LinearProgress
												variant="determinate"
												value={
													totalUpdates > 0
														? (item.value / totalUpdates) * 100
														: 0
												}
												sx={{
													height: 6,
													borderRadius: 3,
													bgcolor: "action.hover",
													"& .MuiLinearProgress-bar": {
														bgcolor: item.color,
													},
												}}
											/>
										</Box>
									))}
								</Stack>
							</>
						) : (
							<Box sx={{ textAlign: "center", py: 4 }}>
								<Typography color="text.secondary">Nema podataka</Typography>
							</Box>
						)}
					</Paper>
				</Grid>
			</Grid>

			{/* Insights Section */}
			{totalUpdates >= 3 && (
				<Paper
					elevation={0}
					sx={{
						mt: 3,
						p: 3,
						border: "2px solid",
						borderColor: "primary.light",
						borderRadius: 3,
						background:
							"linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)",
					}}
				>
					<Typography
						variant="h6"
						fontWeight="600"
						gutterBottom
						sx={{ display: "flex", alignItems: "center", gap: 1 }}
					>
						<Star sx={{ color: "warning.main" }} />
						Pametni Uvidi
					</Typography>

					<Grid container spacing={2} sx={{ mt: 1 }}>
						{progressUpdates > regressUpdates && (
							<Grid size={{ xs: 12, sm: 6 }}>
								<Chip
									icon={<TrendingUp />}
									label={`Odličan napredak! ${Math.round(
										(progressUpdates / totalUpdates) * 100
									)}% update-a je pozitivno`}
									color="success"
									sx={{
										width: "100%",
										justifyContent: "flex-start",
										py: 2,
										fontWeight: 600,
									}}
								/>
							</Grid>
						)}

						{avgFeeling >= 4 && (
							<Grid size={{ xs: 12, sm: 6 }}>
								<Chip
									icon={<SentimentSatisfied />}
									label={`Odlično se osjećaš! Prosječna ocjena ${avgFeeling}/5`}
									color="success"
									sx={{
										width: "100%",
										justifyContent: "flex-start",
										py: 2,
										fontWeight: 600,
									}}
								/>
							</Grid>
						)}

						{longestStreak >= 3 && (
							<Grid size={{ xs: 12, sm: 6 }}>
								<Chip
									icon={<Whatshot />}
									label={`Impresivan niz od ${longestStreak} dana!`}
									color="warning"
									sx={{
										width: "100%",
										justifyContent: "flex-start",
										py: 2,
										fontWeight: 600,
									}}
								/>
							</Grid>
						)}

						{daysSinceStart >= 7 && totalUpdates < 2 && (
							<Grid size={{ xs: 12, sm: 6 }}>
								<Chip
									icon={<CalendarToday />}
									label="Dodaj više update-a za bolje praćenje progresa"
									color="info"
									sx={{
										width: "100%",
										justifyContent: "flex-start",
										py: 2,
										fontWeight: 600,
									}}
								/>
							</Grid>
						)}

						{regressUpdates > progressUpdates && totalUpdates >= 5 && (
							<Grid size={{ xs: 12, sm: 6 }}>
								<Chip
									icon={<TrendingUp />}
									label="Ne odustaj! Svaki pokušaj je korak ka uspjehu"
									color="info"
									sx={{
										width: "100%",
										justifyContent: "flex-start",
										py: 2,
										fontWeight: 600,
									}}
								/>
							</Grid>
						)}
					</Grid>
				</Paper>
			)}
		</Box>
	);
};

export default GoalAnalytics;
