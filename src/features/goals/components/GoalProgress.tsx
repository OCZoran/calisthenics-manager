"use client";

import React from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	LinearProgress,
	Grid,
	Chip,
	List,
	ListItem,
	ListItemText,
	Divider,
} from "@mui/material";
import {
	EmojiEventsOutlined,
	TrendingUpOutlined,
	CheckCircleOutlined,
} from "@mui/icons-material";
import { Goal } from "../goal.interface";

interface GoalProgressProps {
	goals: Goal[];
	onGoalUpdated: (goal: Goal) => void;
}

const GoalProgress: React.FC<GoalProgressProps> = ({ goals }) => {
	const totalGoals = goals.length;
	const completedGoals = goals.filter((g) => g.completed).length;
	const activeGoals = totalGoals - completedGoals;

	const easyGoals = goals.filter((g) => g.difficulty === "Easy");
	const intermediateGoals = goals.filter(
		(g) => g.difficulty === "Intermediate"
	);
	const advancedGoals = goals.filter((g) => g.difficulty === "Advanced");

	const easyCompleted = easyGoals.filter((g) => g.completed).length;
	const intermediateCompleted = intermediateGoals.filter(
		(g) => g.completed
	).length;
	const advancedCompleted = advancedGoals.filter((g) => g.completed).length;

	const completionRate =
		totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
	const easyRate =
		easyGoals.length > 0 ? (easyCompleted / easyGoals.length) * 100 : 0;
	const intermediateRate =
		intermediateGoals.length > 0
			? (intermediateCompleted / intermediateGoals.length) * 100
			: 0;
	const advancedRate =
		advancedGoals.length > 0
			? (advancedCompleted / advancedGoals.length) * 100
			: 0;

	const recentlyCompleted = goals
		.filter((g) => g.completed && g.completedAt)
		.sort(
			(a, b) =>
				new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
		)
		.slice(0, 5);

	return (
		<Box>
			<Grid container spacing={3}>
				{/* Ukupan progres */}
				<Grid size={{ xs: 12 }}>
					<Card>
						<CardContent>
							<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
								<EmojiEventsOutlined
									sx={{ fontSize: 32, color: "primary.main", mr: 2 }}
								/>
								<Typography variant="h5" component="h2" fontWeight="bold">
									Total Progress
								</Typography>
							</Box>
							<Box sx={{ mb: 2 }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 1,
									}}
								>
									<Typography variant="body2" color="text.secondary">
										Completed Goals
									</Typography>
									<Typography variant="body2" fontWeight="bold">
										{completedGoals} / {totalGoals}
									</Typography>
								</Box>
								<LinearProgress
									variant="determinate"
									value={completionRate}
									sx={{ height: 10, borderRadius: 5 }}
								/>
								<Typography
									variant="h4"
									sx={{ mt: 2, textAlign: "center" }}
									color="primary"
								>
									{completionRate.toFixed(1)}%
								</Typography>
							</Box>
						</CardContent>
					</Card>
				</Grid>

				{/* Statistike */}
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom color="text.secondary">
								Total Goals
							</Typography>
							<Typography variant="h3" fontWeight="bold">
								{totalGoals}
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card sx={{ bgcolor: "success.light" }}>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								Completed
							</Typography>
							<Typography variant="h3" fontWeight="bold">
								{completedGoals}
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card sx={{ bgcolor: "info.light" }}>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								Active
							</Typography>
							<Typography variant="h3" fontWeight="bold">
								{activeGoals}
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Card sx={{ bgcolor: "warning.light" }}>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								Success Rate
							</Typography>
							<Typography variant="h3" fontWeight="bold">
								{completionRate.toFixed(0)}%
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				{/* Progres po težini */}
				<Grid size={{ xs: 12, md: 4 }}>
					<Card>
						<CardContent>
							<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
								<Chip
									label="Easy"
									color="success"
									size="small"
									sx={{ mr: 1 }}
								/>
								<Typography variant="h6">Easy Goals</Typography>
							</Box>
							<Box sx={{ mb: 1 }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 1,
									}}
								>
									<Typography variant="body2">
										{easyCompleted} / {easyGoals.length}
									</Typography>
									<Typography variant="body2" fontWeight="bold">
										{easyRate.toFixed(0)}%
									</Typography>
								</Box>
								<LinearProgress
									variant="determinate"
									value={easyRate}
									color="success"
									sx={{ height: 8, borderRadius: 4 }}
								/>
							</Box>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, md: 4 }}>
					<Card>
						<CardContent>
							<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
								<Chip
									label="Intermediate"
									color="warning"
									size="small"
									sx={{ mr: 1 }}
								/>
								<Typography variant="h6">Intermediate Goals</Typography>
							</Box>
							<Box sx={{ mb: 1 }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 1,
									}}
								>
									<Typography variant="body2">
										{intermediateCompleted} / {intermediateGoals.length}
									</Typography>
									<Typography variant="body2" fontWeight="bold">
										{intermediateRate.toFixed(0)}%
									</Typography>
								</Box>
								<LinearProgress
									variant="determinate"
									value={intermediateRate}
									color="warning"
									sx={{ height: 8, borderRadius: 4 }}
								/>
							</Box>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, md: 4 }}>
					<Card>
						<CardContent>
							<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
								<Chip
									label="Advanced"
									color="error"
									size="small"
									sx={{ mr: 1 }}
								/>
								<Typography variant="h6">Advanced Goals</Typography>
							</Box>
							<Box sx={{ mb: 1 }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 1,
									}}
								>
									<Typography variant="body2">
										{advancedCompleted} / {advancedGoals.length}
									</Typography>
									<Typography variant="body2" fontWeight="bold">
										{advancedRate.toFixed(0)}%
									</Typography>
								</Box>
								<LinearProgress
									variant="determinate"
									value={advancedRate}
									color="error"
									sx={{ height: 8, borderRadius: 4 }}
								/>
							</Box>
						</CardContent>
					</Card>
				</Grid>

				{/* Nedavno ostvareni ciljevi */}
				<Grid size={{ xs: 12 }}>
					<Card>
						<CardContent>
							<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
								<TrendingUpOutlined
									sx={{ fontSize: 28, color: "success.main", mr: 2 }}
								/>
								<Typography variant="h6" fontWeight="bold">
									Recently Completed Goals
								</Typography>
							</Box>
							{recentlyCompleted.length === 0 ? (
								<Typography
									color="text.secondary"
									textAlign="center"
									sx={{ py: 3 }}
								>
									You have not completed any goals yet
								</Typography>
							) : (
								<List>
									{recentlyCompleted.map((goal, index) => (
										<React.Fragment key={goal._id}>
											{index > 0 && <Divider />}
											<ListItem>
												<CheckCircleOutlined
													sx={{ color: "success.main", mr: 2 }}
												/>
												<ListItemText
													primary={goal.title}
													secondary={
														<Box
															sx={{
																display: "flex",
																gap: 1,
																alignItems: "center",
																mt: 0.5,
															}}
														>
															<Chip
																label={goal.difficulty}
																size="small"
																color={
																	goal.difficulty === "Easy"
																		? "success"
																		: goal.difficulty === "Intermediate"
																		? "warning"
																		: "error"
																}
															/>
															<Typography
																variant="caption"
																color="text.secondary"
															>
																{new Date(goal.completedAt!).toLocaleDateString(
																	"sr-RS",
																	{
																		day: "numeric",
																		month: "long",
																		year: "numeric",
																	}
																)}
															</Typography>
														</Box>
													}
												/>
											</ListItem>
										</React.Fragment>
									))}
								</List>
							)}
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Box>
	);
};

export default GoalProgress;
