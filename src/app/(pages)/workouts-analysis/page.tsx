"use client";

import React, { useState, useEffect } from "react";
import {
	Box,
	Container,
	Typography,
	CircularProgress,
	Alert,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	SelectChangeEvent,
	Paper,
} from "@mui/material";
import { BarChartOutlined } from "@mui/icons-material";
import { Workout } from "@/global/interfaces/workout.interface";
import { TrainingPlan } from "@/global/interfaces/training-plan.interface";
import EnhancedWorkoutDashboard from "@/features/workouts/components/WorkoutStatisticsDashboard";

const WorkoutAnalysisPage = () => {
	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
	const [selectedPlanId, setSelectedPlanId] = useState<string>("all");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	console.log("trainingPlans", trainingPlans);
	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);

				// Fetch workouts
				const workoutsRes = await fetch("/api/workouts");
				if (!workoutsRes.ok) throw new Error("Failed to fetch workouts");
				const workoutsData = await workoutsRes.json();

				// Fetch training plans
				const plansRes = await fetch("/api/training-plans");
				if (!plansRes.ok) throw new Error("Failed to fetch training plans");
				const plansData = await plansRes.json();

				// Properly extract data based on API response structure
				setWorkouts(workoutsData.workouts || workoutsData || []);
				setTrainingPlans(plansData.plans || plansData || []);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	const handlePlanChange = (event: SelectChangeEvent<string>) => {
		setSelectedPlanId(event.target.value);
	};

	const filteredWorkouts =
		selectedPlanId === "all"
			? workouts
			: workouts.filter((w) => w.planId === selectedPlanId);

	const selectedPlan = trainingPlans?.find((p) => p._id === selectedPlanId);

	if (isLoading) {
		return (
			<Container maxWidth="xl" sx={{ py: 4 }}>
				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					minHeight="400px"
				>
					<CircularProgress />
				</Box>
			</Container>
		);
	}

	if (error) {
		return (
			<Container maxWidth="xl" sx={{ py: 4 }}>
				<Alert severity="error">{error}</Alert>
			</Container>
		);
	}

	return (
		<Container maxWidth="xl" sx={{ py: 4 }}>
			{/* Header */}
			<Box sx={{ mb: 4 }}>
				<Box display="flex" alignItems="center" gap={2} mb={2}>
					<BarChartOutlined sx={{ fontSize: 40, color: "primary.main" }} />
					<Typography variant="h4" fontWeight="bold">
						Workout Analysis
					</Typography>
				</Box>
				<Typography variant="body1" color="text.secondary">
					Detaljne statistike i analiza vašeg napretka kroz treninge
				</Typography>
			</Box>

			{/* Plan Selector */}
			<Paper elevation={2} sx={{ p: 3, mb: 4 }}>
				<FormControl fullWidth>
					<InputLabel id="plan-select-label">Trening Plan</InputLabel>
					<Select
						labelId="plan-select-label"
						id="plan-select"
						value={selectedPlanId}
						label="Trening Plan"
						onChange={handlePlanChange}
					>
						<MenuItem value="all">
							<strong>Svi planovi</strong> ({workouts.length} treninga)
						</MenuItem>
						{trainingPlans.map((plan) => {
							const planWorkoutsCount = workouts.filter(
								(w) => w.planId === plan._id
							).length;
							return (
								<MenuItem key={plan._id} value={plan._id}>
									{plan.name} ({planWorkoutsCount} treninga)
									{/* {plan.isActive && " • Aktivan"} */}
								</MenuItem>
							);
						})}
					</Select>
				</FormControl>
			</Paper>

			{/* Statistics Dashboard */}
			{filteredWorkouts.length >= 2 ? (
				<EnhancedWorkoutDashboard
					workouts={filteredWorkouts}
					planId={selectedPlanId !== "all" ? selectedPlanId : undefined}
					planName={selectedPlan?.name || "Svi planovi"}
				/>
			) : (
				<Alert severity="info" sx={{ mt: 4 }}>
					<Typography variant="h6" gutterBottom>
						Nedovoljno podataka za analizu
					</Typography>
					<Typography variant="body2">
						Potrebno je minimum 2 treninga za prikaz statistike i napretka.
						{selectedPlanId !== "all" && selectedPlan
							? ` Selektovani plan "${selectedPlan.name}" ima ${filteredWorkouts.length} trening(a).`
							: ` Trenutno imate ukupno ${workouts.length} trening(a).`}
					</Typography>
				</Alert>
			)}
		</Container>
	);
};

export default WorkoutAnalysisPage;
