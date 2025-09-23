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
	alpha,
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
					color: "success" as const,
					label: "AKTIVAN",
					bgColor: alpha(theme.palette.success.main, 0.1),
					borderColor: theme.palette.success.main,
					icon: <FitnessCenter sx={{ fontSize: 16 }} />,
				};
			case "completed":
				return {
					color: "primary" as const,
					label: "ZAVRŠEN",
					bgColor: alpha(theme.palette.primary.main, 0.1),
					borderColor: theme.palette.primary.main,
					icon: <CheckCircle sx={{ fontSize: 16 }} />,
				};
			case "paused":
				return {
					color: "warning" as const,
					label: "PAUZIRAN",
					bgColor: alpha(theme.palette.warning.main, 0.1),
					borderColor: theme.palette.warning.main,
					icon: <Pause sx={{ fontSize: 16 }} />,
				};
			default:
				return {
					color: "default" as const,
					label: "NEPOZNATO",
					bgColor: alpha(theme.palette.grey[500], 0.1),
					borderColor: theme.palette.grey[500],
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
				border: "2px solid",
				borderColor: statusConfig.borderColor,
				borderRadius: 3,
				overflow: "hidden",
				position: "relative",
				background: `linear-gradient(135deg, ${
					statusConfig.bgColor
				} 0%, ${alpha(statusConfig.borderColor, 0.05)} 100%)`,
				transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
				"&:hover": {
					boxShadow: `0 12px 32px ${alpha(statusConfig.borderColor, 0.3)}`,
					transform: "translateY(-4px)",
					borderColor: statusConfig.borderColor,
				},
			}}
		>
			{/* Status Indicator Bar */}
			<Box
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 6,
					background: `linear-gradient(90deg, ${
						statusConfig.borderColor
					}, ${alpha(statusConfig.borderColor, 0.7)})`,
					borderRadius: "0 0 8px 8px",
				}}
			/>

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
					expandIcon={
						<ExpandMore
							sx={{
								color: statusConfig.borderColor,
								transition: "transform 0.3s ease",
							}}
						/>
					}
					sx={{
						padding: "20px 24px",
						minHeight: "auto",
						"&.Mui-expanded": {
							minHeight: "auto",
						},
						"& .MuiAccordionSummary-content": {
							margin: "0",
						},
					}}
				>
					<Grid container alignItems="center" spacing={3}>
						{/* Plan Info */}
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<Box
								sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
							>
								<Avatar
									sx={{
										bgcolor: statusConfig.borderColor,
										width: 40,
										height: 40,
									}}
								>
									{statusConfig.icon}
								</Avatar>
								<Box>
									<Typography
										variant="h6"
										fontWeight="700"
										sx={{
											color: "text.primary",
											fontSize: { xs: "1rem", sm: "1.1rem" },
										}}
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
											sx={{
												fontSize: 14,
												color: "text.secondary",
											}}
										/>
										<Typography
											variant="caption"
											color="text.secondary"
											fontWeight="500"
										>
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
									color={statusConfig.color}
									variant="filled"
									size="small"
									icon={statusConfig.icon}
									sx={{
										fontWeight: "600",
										alignSelf: "flex-start",
										boxShadow: `0 2px 8px ${alpha(
											statusConfig.borderColor,
											0.3
										)}`,
									}}
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
											bgcolor: alpha(theme.palette.grey[300], 0.3),
											"& .MuiLinearProgress-bar": {
												borderRadius: 5,
												background: `linear-gradient(90deg, ${getProgressColor()}, ${alpha(
													getProgressColor(),
													0.7
												)})`,
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
										<Tooltip title="Pauziraj plan" arrow>
											<IconButton
												size="small"
												onClick={(e) =>
													handleActionClick(e, () =>
														onStatusChange(plan, "paused")
													)
												}
												sx={{
													color: "warning.main",
													"&:hover": {
														bgcolor: alpha(theme.palette.warning.main, 0.1),
													},
												}}
											>
												<Pause />
											</IconButton>
										</Tooltip>
										<Tooltip title="Završi plan" arrow>
											<IconButton
												size="small"
												onClick={(e) =>
													handleActionClick(e, () =>
														onStatusChange(plan, "completed")
													)
												}
												sx={{
													color: "primary.main",
													"&:hover": {
														bgcolor: alpha(theme.palette.primary.main, 0.1),
													},
												}}
											>
												<Stop />
											</IconButton>
										</Tooltip>
									</>
								)}

								{plan.status === "paused" && (
									<Tooltip title="Nastavi plan" arrow>
										<IconButton
											size="small"
											onClick={(e) =>
												handleActionClick(e, () =>
													onStatusChange(plan, "active")
												)
											}
											sx={{
												color: "success.main",
												"&:hover": {
													bgcolor: alpha(theme.palette.success.main, 0.1),
												},
											}}
										>
											<PlayArrow />
										</IconButton>
									</Tooltip>
								)}

								<Tooltip title="Uredi plan" arrow>
									<IconButton
										size="small"
										onClick={(e) => handleActionClick(e, () => onEdit(plan))}
										sx={{
											color: "primary.main",
											"&:hover": {
												bgcolor: alpha(theme.palette.primary.main, 0.1),
											},
										}}
									>
										<Edit />
									</IconButton>
								</Tooltip>

								<Tooltip title="Obriši plan" arrow>
									<IconButton
										size="small"
										onClick={(e) => handleActionClick(e, () => onDelete(plan))}
										sx={{
											color: "error.main",
											"&:hover": {
												bgcolor: alpha(theme.palette.error.main, 0.1),
											},
										}}
									>
										<Delete />
									</IconButton>
								</Tooltip>
							</Box>
						</Grid>
					</Grid>
				</AccordionSummary>

				<AccordionDetails
					sx={{
						padding: "0 24px 24px 24px",
						background: alpha(theme.palette.background.paper, 0.8),
						backdropFilter: "blur(10px)",
					}}
				>
					<Divider sx={{ mb: 3, opacity: 0.6 }} />

					<Stack spacing={3}>
						{/* Goal Section */}
						{plan.goal && (
							<Box
								sx={{
									p: 2,
									borderRadius: 2,
									background: alpha(theme.palette.primary.main, 0.05),
									border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
								}}
							>
								<Typography
									variant="subtitle2"
									gutterBottom
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										fontWeight: "600",
										color: "primary.main",
									}}
								>
									<Flag sx={{ fontSize: 18 }} />
									Cilj plana
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ lineHeight: 1.6 }}
								>
									{plan.goal}
								</Typography>
							</Box>
						)}

						{/* Description Section */}
						{plan.description && (
							<Box
								sx={{
									p: 2,
									borderRadius: 2,
									background: alpha(theme.palette.grey[500], 0.05),
									border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`,
								}}
							>
								<Typography
									variant="subtitle2"
									gutterBottom
									fontWeight="600"
									color="text.primary"
								>
									Opis
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ lineHeight: 1.6 }}
								>
									{plan.description}
								</Typography>
							</Box>
						)}

						{/* Actions */}
						<Box
							sx={{
								display: "flex",
								gap: 2,
								flexWrap: "wrap",
								pt: 1,
							}}
						>
							{onViewProgress && (
								<Button
									variant="outlined"
									startIcon={<Assessment />}
									onClick={() => onViewProgress(plan._id!, plan.name)}
									size="small"
									sx={{
										borderRadius: 2,
										textTransform: "none",
										fontWeight: "500",
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
									sx={{
										fontWeight: "500",
										"& .MuiChip-icon": {
											color: "success.main",
										},
									}}
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
