"use client";

import React, { useState, useEffect } from "react";
import {
	Box,
	Tabs,
	Tab,
	Typography,
	Container,
	Alert,
	CircularProgress,
	Chip,
} from "@mui/material";
import {
	FlagOutlined,
	AddCircleOutlineOutlined,
	EmojiEventsOutlined,
} from "@mui/icons-material";
import GoalManager from "./GoalManager";
import { Goal } from "../goal.interface";
import GoalProgress from "./GoalProgress";
import GoalDetail from "./GoalDetail";
import GoalAnalytics from "./GoalAnalytic";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`goal-tabpanel-${index}`}
			aria-labelledby={`goal-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `goal-tab-${index}`,
		"aria-controls": `goal-tabpanel-${index}`,
	};
}

const GoalsClient: React.FC = () => {
	const [tabValue, setTabValue] = useState(0);
	const [goals, setGoals] = useState<Goal[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
		setSelectedGoal(null); // Reset selected goal when changing tabs
	};

	const fetchGoals = async () => {
		try {
			const response = await fetch("/api/goals");
			if (!response.ok) {
				throw new Error("Greška pri učitavanju ciljeva");
			}
			const data = await response.json();
			setGoals(data);
		} catch (error) {
			console.error("Error fetching goals:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri učitavanju ciljeva"
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchGoals();
	}, []);

	const handleGoalAdded = (newGoal: Goal) => {
		setGoals((prev) => [newGoal, ...prev]);
	};

	const handleGoalUpdated = (updatedGoal: Goal) => {
		setGoals((prev) =>
			prev.map((goal) => (goal._id === updatedGoal._id ? updatedGoal : goal))
		);
		if (selectedGoal && selectedGoal._id === updatedGoal._id) {
			setSelectedGoal(updatedGoal);
		}
	};

	const handleGoalDeleted = (goalId: string) => {
		setGoals((prev) => prev.filter((goal) => goal._id !== goalId));
		if (selectedGoal && selectedGoal._id === goalId) {
			setSelectedGoal(null);
		}
	};

	const handleGoalClick = (goal: Goal) => {
		setSelectedGoal(goal);
	};

	const handleBackFromDetail = () => {
		setSelectedGoal(null);
	};

	const completedGoals = goals.filter((g) => g.completed).length;
	const totalGoals = goals.length;
	const completionRate =
		totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

	if (isLoading) {
		return (
			<Container maxWidth="lg" sx={{ py: 4 }}>
				<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
					<CircularProgress />
				</Box>
			</Container>
		);
	}

	if (selectedGoal) {
		return (
			<Container maxWidth="lg" sx={{ py: 4 }}>
				<GoalDetail
					goal={selectedGoal}
					onBack={handleBackFromDetail}
					onGoalUpdated={handleGoalUpdated}
				/>
				<GoalAnalytics goal={selectedGoal} />
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Box sx={{ mb: 4 }}>
				<Typography
					variant="h4"
					component="h1"
					gutterBottom
					fontWeight="bold"
					sx={{ display: "flex", alignItems: "center", gap: 2 }}
				>
					<FlagOutlined sx={{ fontSize: 40, color: "primary.main" }} />
					My goals
				</Typography>
				<Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 2 }}>
					<Typography variant="body1" color="text.secondary">
						Track and achieve your fitness goals with our comprehensive goal
						management features.
					</Typography>
					<Chip
						icon={<EmojiEventsOutlined />}
						label={`${completedGoals}/${totalGoals} achieved`}
						color={completionRate === 100 ? "success" : "primary"}
						variant="outlined"
					/>
				</Box>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
				<Tabs
					value={tabValue}
					onChange={handleTabChange}
					aria-label="goals tabs"
					variant="fullWidth"
				>
					<Tab
						icon={<AddCircleOutlineOutlined />}
						label="All Goals"
						{...a11yProps(0)}
						sx={{ fontWeight: 600 }}
					/>
					<Tab
						icon={<EmojiEventsOutlined />}
						label="Progress"
						{...a11yProps(1)}
						sx={{ fontWeight: 600 }}
					/>
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<GoalManager
					goals={goals}
					onGoalAdded={handleGoalAdded}
					onGoalUpdated={handleGoalUpdated}
					onGoalDeleted={handleGoalDeleted}
					onGoalClick={handleGoalClick}
				/>
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<GoalProgress goals={goals} onGoalUpdated={handleGoalUpdated} />
			</TabPanel>
		</Container>
	);
};

export default GoalsClient;
