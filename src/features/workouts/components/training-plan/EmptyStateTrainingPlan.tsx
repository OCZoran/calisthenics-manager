import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	Chip,
	Grow,
	Zoom,
	Slide,
} from "@mui/material";
import { Timeline, Warning, FitnessCenter, Add } from "@mui/icons-material";

import { TrainingPlan } from "@/global/interfaces/training-plan.interface";

interface EmptyStateTrainingPlanProps {
	hasTrainingPlans: boolean;
	hasActivePlan: boolean;
	trainingPlans: TrainingPlan[];
	activePlan?: TrainingPlan | null;
	onCreatePlan?: () => void;
	onCreateWorkout?: () => void;
}

export const EmptyStateTrainingPlan: React.FC<EmptyStateTrainingPlanProps> = ({
	hasTrainingPlans,
	hasActivePlan,
	trainingPlans,
	activePlan,
	onCreatePlan,
	onCreateWorkout,
}) => {
	if (!hasTrainingPlans) {
		return (
			<Grow in timeout={1000}>
				<Card
					sx={{
						textAlign: "center",
						py: 8,
						border: "2px dashed",
						borderColor: "warning.light",
						background:
							"linear-gradient(135deg, rgba(255,183,77,0.05) 0%, rgba(255,167,38,0.1) 100%)",
						position: "relative",
						overflow: "hidden",
					}}
				>
					<CardContent sx={{ position: "relative", zIndex: 1 }}>
						<Zoom in timeout={800} style={{ transitionDelay: "200ms" }}>
							<Box>
								<Timeline
									sx={{
										fontSize: 80,
										color: "warning.main",
										mb: 3,
										filter: "drop-shadow(0 4px 8px rgba(255,152,0,0.3))",
									}}
								/>
							</Box>
						</Zoom>
						<Slide
							in
							direction="up"
							timeout={600}
							style={{ transitionDelay: "400ms" }}
						>
							<Typography
								variant="h4"
								color="warning.dark"
								gutterBottom
								fontWeight="bold"
								sx={{ mb: 2 }}
							>
								Welcome to your fitness app!
							</Typography>
						</Slide>
						<Slide
							in
							direction="up"
							timeout={600}
							style={{ transitionDelay: "600ms" }}
						>
							<Typography
								variant="h6"
								color="text.secondary"
								sx={{ mb: 4, maxWidth: 600, mx: "auto", lineHeight: 1.6 }}
							>
								Start by creating your first training plan. A plan will help you
								organize workouts, track progress, and achieve your fitness
								goals.
							</Typography>
						</Slide>
						<Slide
							in
							direction="up"
							timeout={600}
							style={{ transitionDelay: "800ms" }}
						>
							<Box
								sx={{
									display: "flex",
									gap: 2,
									justifyContent: "center",
									flexDirection: { xs: "column", sm: "row" },
								}}
							>
								<Button
									variant="contained"
									size="large"
									startIcon={<Timeline />}
									onClick={onCreatePlan}
									sx={{
										minWidth: 220,
										py: 1.5,
										fontSize: "1.1rem",
										background:
											"linear-gradient(45deg, #FF9800 30%, #FFA726 90%)",
										boxShadow: "0 8px 16px rgba(255,152,0,0.3)",
										"&:hover": {
											transform: "translateY(-2px)",
											boxShadow: "0 12px 24px rgba(255,152,0,0.4)",
										},
										transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
									}}
								>
									Create Training Plan
								</Button>
							</Box>
						</Slide>
					</CardContent>
				</Card>
			</Grow>
		);
	}

	if (hasTrainingPlans && !hasActivePlan) {
		return (
			<Grow in timeout={1000}>
				<Card
					sx={{
						textAlign: "center",
						py: 6,
						border: "2px dashed",
						borderColor: "info.light",
						background:
							"linear-gradient(135deg, rgba(33,150,243,0.05) 0%, rgba(30,136,229,0.1) 100%)",
					}}
				>
					<CardContent>
						<Zoom in timeout={500}>
							<Warning sx={{ fontSize: 64, color: "info.main", mb: 2 }} />
						</Zoom>
						<Typography
							variant="h5"
							color="info.dark"
							gutterBottom
							fontWeight="bold"
						>
							No active plan
						</Typography>
						<Typography
							variant="body1"
							color="text.secondary"
							sx={{ mb: 3, maxWidth: 500, mx: "auto" }}
						>
							You have {trainingPlans.length} training plan
							{trainingPlans.length !== 1 ? "s" : ""}, but none of them is
							active. Activate an existing plan or create a new one.
						</Typography>
						<Box
							sx={{
								display: "flex",
								gap: 2,
								justifyContent: "center",
								flexDirection: { xs: "column", sm: "row" },
							}}
						>
							<Button
								variant="contained"
								size="large"
								startIcon={<Add />}
								onClick={onCreatePlan}
								sx={{ minWidth: 200 }}
							>
								Create New Plan
							</Button>
							<Button variant="outlined" size="large" startIcon={<Timeline />}>
								View Existing Plans
							</Button>
						</Box>
					</CardContent>
				</Card>
			</Grow>
		);
	}

	return (
		<Grow in timeout={1000}>
			<Card
				sx={{
					textAlign: "center",
					py: 8,
					border: "2px dashed",
					borderColor: "success.light",
					background:
						"linear-gradient(135deg, rgba(76,175,80,0.05) 0%, rgba(67,160,71,0.1) 100%)",
					position: "relative",
				}}
			>
				<CardContent>
					<Zoom in timeout={500}>
						<FitnessCenter
							sx={{
								fontSize: 80,
								color: "success.main",
								mb: 3,
								filter: "drop-shadow(0 4px 8px rgba(76,175,80,0.3))",
							}}
						/>
					</Zoom>
					<Typography
						variant="h4"
						color="success.dark"
						gutterBottom
						fontWeight="bold"
						sx={{ mb: 2 }}
					>
						Ready for your first workout?
					</Typography>
					<Box sx={{ mb: 3 }}>
						<Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
							Great! You have an active plan:
						</Typography>
						<Chip
							label={activePlan?.name || "Active Plan"}
							color="success"
							variant="filled"
							sx={{ fontSize: "1.1rem", py: 3, px: 2, fontWeight: "bold" }}
						/>
					</Box>
					<Typography
						variant="body1"
						color="text.secondary"
						sx={{ mb: 4, maxWidth: 500, mx: "auto", fontSize: "1.1rem" }}
					>
						Now you can add your first workout and start tracking your progress.
						Your fitness journey begins here!
					</Typography>
					<Button
						variant="contained"
						size="large"
						startIcon={<Add />}
						onClick={onCreateWorkout}
						sx={{
							minWidth: 220,
							py: 1.5,
							fontSize: "1.1rem",
							background: "linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)",
							boxShadow: "0 8px 16px rgba(76,175,80,0.3)",
							"&:hover": {
								transform: "translateY(-2px)",
								boxShadow: "0 12px 24px rgba(76,175,80,0.4)",
							},
							transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
						}}
					>
						Add First Workout
					</Button>
				</CardContent>
			</Card>
		</Grow>
	);
};
