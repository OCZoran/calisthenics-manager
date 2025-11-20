import React from "react";
import {
	Card,
	Typography,
	Box,
	Chip,
	IconButton,
	LinearProgress,
	Tooltip,
	Button,
	Divider,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Grid,
	Avatar,
	useTheme,
	Stack,
} from "@mui/material";
import {
	Edit,
	Delete,
	PlayArrow,
	Pause,
	Stop,
	Assessment,
	CalendarToday,
	ExpandMore,
	CheckCircle,
	Flag,
	Timeline,
	AccessTime,
	TrendingUp,
	FitnessCenter,
} from "@mui/icons-material";
import { formatDate } from "@/global/utils/format-date";

interface TrainingPlan {
	_id?: string;
	userId?: string;
	name: string;
	description?: string;
	startDate: string;
	endDate?: string;
	status: "active" | "completed" | "paused";
	goal?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

interface TrainingPlanCardProps {
	plan: TrainingPlan;
	isExpanded: boolean;
	progress: number | null;
	duration: number | null;
	onToggleExpanded: (planId: string) => void;
	onStatusChange: (
		plan: TrainingPlan,
		newStatus: "active" | "paused" | "completed"
	) => void;
	onEdit: (plan: TrainingPlan) => void;
	onDelete: (plan: TrainingPlan) => void;
	onViewProgress?: (planId: string, planName: string) => void;
}

const TrainingPlanCard: React.FC<TrainingPlanCardProps> = ({
	plan,
	isExpanded,
	progress,
	duration,
	onToggleExpanded,
	onStatusChange,
	onEdit,
	onDelete,
	onViewProgress,
}) => {
	const theme = useTheme();

	const getStatusConfig = (status: string) => {
		switch (status) {
			case "active":
				return {
					label: "ACTIVE",
					color: "success",
					icon: <FitnessCenter sx={{ fontSize: 16 }} />,
				};
			case "completed":
				return {
					label: "DONE",
					color: "primary",
					icon: <CheckCircle sx={{ fontSize: 16 }} />,
				};
			case "paused":
				return {
					label: "PAUSE",
					color: "warning",
					icon: <Pause sx={{ fontSize: 16 }} />,
				};
			default:
				return {
					label: "UNKNOWN",
					color: "default",
					icon: <Timeline sx={{ fontSize: 16 }} />,
				};
		}
	};

	const statusConfig = getStatusConfig(plan.status);

	const handleActionClick = (e: React.MouseEvent, action: () => void) => {
		e.stopPropagation();
		action();
	};

	const getProgressColor = () => {
		if (progress === null) return "inherit";
		if (progress >= 80) return theme.palette.success.main;
		if (progress >= 50) return theme.palette.warning.main;
		return theme.palette.error.main;
	};

	return (
		<Card
			sx={{
				border: "1px solid #e0e0e0",
				borderRadius: 3,
				overflow: "hidden",
				position: "relative",
				backgroundColor: "white",
				transition: "all 0.3s ease",
				"&:hover": {
					boxShadow: theme.shadows[4],
					transform: "translateY(-2px)",
				},
			}}
		>
			<Accordion
				expanded={isExpanded}
				onChange={() => onToggleExpanded(plan._id!)}
				sx={{
					boxShadow: "none",
					background: "transparent",
					"&.Mui-expanded": { margin: 0 },
					"&:before": { display: "none" },
				}}
			>
				<AccordionSummary
					expandIcon={<ExpandMore sx={{ color: "text.primary" }} />}
					sx={{
						padding: "20px 24px",
						minHeight: "auto",
						"&.Mui-expanded": { minHeight: "auto" },
						"& .MuiAccordionSummary-content": { margin: 0 },
					}}
				>
					<Grid container alignItems="center" spacing={3}>
						{/* Plan Info */}
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<Box
								sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
							>
								<Avatar sx={{ bgcolor: "#f2f2f2", width: 40, height: 40 }}>
									{statusConfig.icon}
								</Avatar>
								<Box>
									<Typography
										variant="h6"
										fontWeight="700"
										color="text.primary"
									>
										{plan.name}
									</Typography>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											mt: 0.5,
										}}
									>
										<CalendarToday
											sx={{ fontSize: 14, color: "text.secondary" }}
										/>
										<Typography variant="caption" color="text.secondary">
											{formatDate(plan.startDate)}
											{plan.endDate && ` - ${formatDate(plan.endDate)}`}
										</Typography>
									</Box>
								</Box>
							</Box>
						</Grid>

						{/* Status & Duration */}
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
								<Chip
									label={statusConfig.label}
									color={statusConfig.color as any}
									size="small"
								/>
								{duration && (
									<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<AccessTime
											sx={{ fontSize: 14, color: "text.secondary" }}
										/>
										<Typography variant="caption" color="text.secondary">
											{duration} dana
										</Typography>
									</Box>
								)}
							</Box>
						</Grid>

						{/* Progress */}
						<Grid size={{ xs: 12, md: 3 }}>
							{progress !== null && (
								<Box>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											mb: 1,
										}}
									>
										<TrendingUp
											sx={{ fontSize: 16, color: getProgressColor() }}
										/>
										<Typography
											variant="body2"
											fontWeight="600"
											sx={{ color: getProgressColor() }}
										>
											{progress}%
										</Typography>
									</Box>
									<LinearProgress
										variant="determinate"
										value={progress}
										sx={{
											height: 10,
											borderRadius: 5,
											bgcolor: "#e0e0e0",
											"& .MuiLinearProgress-bar": {
												borderRadius: 5,
												backgroundColor: getProgressColor(),
											},
										}}
									/>
								</Box>
							)}
						</Grid>

						{/* Actions */}
						<Grid size={{ xs: 12, md: 2 }}>
							<Box
								sx={{
									display: "flex",
									gap: 0.5,
									justifyContent: "flex-end",
									flexWrap: "wrap",
								}}
							>
								{plan.status === "active" && (
									<>
										<Tooltip title="Pauziraj plan">
											<IconButton
												size="small"
												onClick={(e) =>
													handleActionClick(e, () =>
														onStatusChange(plan, "paused")
													)
												}
												sx={{ color: "warning.main" }}
											>
												<Pause />
											</IconButton>
										</Tooltip>
										<Tooltip title="Završi plan">
											<IconButton
												size="small"
												onClick={(e) =>
													handleActionClick(e, () =>
														onStatusChange(plan, "completed")
													)
												}
												sx={{ color: "primary.main" }}
											>
												<Stop />
											</IconButton>
										</Tooltip>
									</>
								)}
								{plan.status === "paused" && (
									<Tooltip title="Nastavi plan">
										<IconButton
											size="small"
											onClick={(e) =>
												handleActionClick(e, () =>
													onStatusChange(plan, "active")
												)
											}
											sx={{ color: "success.main" }}
										>
											<PlayArrow />
										</IconButton>
									</Tooltip>
								)}
								<Tooltip title="Uredi plan">
									<IconButton
										size="small"
										onClick={(e) => handleActionClick(e, () => onEdit(plan))}
										sx={{ color: "primary.main" }}
									>
										<Edit />
									</IconButton>
								</Tooltip>
								<Tooltip title="Obriši plan">
									<IconButton
										size="small"
										onClick={(e) => handleActionClick(e, () => onDelete(plan))}
										sx={{ color: "error.main" }}
									>
										<Delete />
									</IconButton>
								</Tooltip>
							</Box>
						</Grid>
					</Grid>
				</AccordionSummary>

				<AccordionDetails sx={{ padding: "0 24px 24px 24px" }}>
					<Divider sx={{ mb: 3 }} />

					<Stack spacing={3}>
						{/* Goal Section */}
						{plan.goal && (
							<Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#f2f2f2" }}>
								<Typography
									variant="subtitle2"
									gutterBottom
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										fontWeight: 600,
									}}
								>
									<Flag sx={{ fontSize: 18 }} /> Cilj plana
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{plan.goal}
								</Typography>
							</Box>
						)}

						{/* Description Section */}
						{plan.description && (
							<Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
								<Typography
									variant="subtitle2"
									gutterBottom
									fontWeight={600}
									color="text.primary"
								>
									Opis
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{plan.description}
								</Typography>
							</Box>
						)}

						{/* Actions */}
						<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", pt: 1 }}>
							{onViewProgress && (
								<Button
									variant="outlined"
									startIcon={<Assessment />}
									onClick={() => onViewProgress(plan._id!, plan.name)}
									size="small"
									sx={{
										borderRadius: 2,
										textTransform: "none",
										fontWeight: 500,
									}}
								>
									Prikaži napredak
								</Button>
							)}
							{plan.status === "completed" && (
								<Chip
									icon={<CheckCircle />}
									label="Plan je uspešno završen"
									color="success"
									variant="outlined"
									size="small"
									sx={{ fontWeight: 500 }}
								/>
							)}
						</Box>
					</Stack>
				</AccordionDetails>
			</Accordion>
		</Card>
	);
};

export default TrainingPlanCard;
