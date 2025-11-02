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
} from "@mui/material";
import {
	RestaurantOutlined,
	AddCircleOutlineOutlined,
	TodayOutlined,
	HistoryOutlined,
	AssessmentOutlined,
} from "@mui/icons-material";
import MealManager from "./MealManager";
import { DailyFoodLog, Meal } from "../interfaces/food-log.interface";
import FoodHistory from "./FoodHistory";
import DailyTracker from "./DailyTracker";
import WeeklySummary from "./WeeklySummary";

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
			id={`food-tabpanel-${index}`}
			aria-labelledby={`food-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `food-tab-${index}`,
		"aria-controls": `food-tabpanel-${index}`,
	};
}

const FoodLogClient: React.FC = () => {
	const [tabValue, setTabValue] = useState(1); // Počni sa daily trackrom
	const [meals, setMeals] = useState<Meal[]>([]);
	const [todayLog, setTodayLog] = useState<DailyFoodLog | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	const fetchMeals = async () => {
		try {
			const response = await fetch("/api/meals");
			if (!response.ok) {
				throw new Error("Greška pri učitavanju obroka");
			}
			const data = await response.json();
			setMeals(data);
		} catch (error) {
			console.error("Error fetching meals:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri učitavanju obroka"
			);
		}
	};

	const fetchTodayLog = async () => {
		try {
			const today = new Date().toISOString().split("T")[0];
			const response = await fetch(`/api/daily-food-log?date=${today}`);
			if (response.ok) {
				const data = await response.json();
				setTodayLog(data);
			} else if (response.status !== 404) {
				throw new Error("Greška pri učitavanju dnevnog loga");
			}
		} catch (error) {
			console.error("Error fetching today's log:", error);
			setError(
				error instanceof Error
					? error.message
					: "Greška pri učitavanju dnevnog loga"
			);
		}
	};

	const loadInitialData = async () => {
		try {
			setIsLoading(true);
			await Promise.all([fetchMeals(), fetchTodayLog()]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadInitialData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleMealAdded = (newMeal: Meal) => {
		setMeals((prev) => [...prev, newMeal]);
	};

	const handleMealUpdated = (updatedMeal: Meal) => {
		setMeals((prev) =>
			prev.map((meal) => (meal._id === updatedMeal._id ? updatedMeal : meal))
		);
	};

	const handleMealDeleted = (mealId: string) => {
		setMeals((prev) => prev.filter((meal) => meal._id !== mealId));
	};

	const handleTodayLogUpdated = (updatedLog: DailyFoodLog) => {
		setTodayLog(updatedLog);
	};

	if (isLoading) {
		return (
			<Container maxWidth="lg" sx={{ py: 4 }}>
				<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
					<CircularProgress />
				</Box>
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
					<RestaurantOutlined sx={{ fontSize: 40, color: "primary.main" }} />
					Food Log
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Pratite unos hrane i makronutrijenata
				</Typography>
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
					aria-label="food log tabs"
					variant="fullWidth"
				>
					<Tab
						icon={<AddCircleOutlineOutlined />}
						label="Obroci"
						{...a11yProps(0)}
						sx={{ fontWeight: 600 }}
					/>
					<Tab
						icon={<TodayOutlined />}
						label="Danas"
						{...a11yProps(1)}
						sx={{ fontWeight: 600 }}
					/>
					<Tab
						icon={<HistoryOutlined />}
						label="Istorija"
						{...a11yProps(2)}
						sx={{ fontWeight: 600 }}
					/>
					<Tab
						icon={<AssessmentOutlined />}
						label="Nedeljni pregled"
						{...a11yProps(3)}
						sx={{ fontWeight: 600 }}
					/>
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<MealManager
					meals={meals}
					onMealAdded={handleMealAdded}
					onMealUpdated={handleMealUpdated}
					onMealDeleted={handleMealDeleted}
				/>
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<DailyTracker
					meals={meals}
					todayLog={todayLog}
					onLogUpdated={handleTodayLogUpdated}
				/>
			</TabPanel>

			<TabPanel value={tabValue} index={2}>
				<FoodHistory />
			</TabPanel>

			<TabPanel value={tabValue} index={3}>
				<WeeklySummary />
			</TabPanel>
			<TabPanel value={tabValue} index={0}>
				<MealManager
					meals={meals}
					onMealAdded={handleMealAdded}
					onMealUpdated={handleMealUpdated}
					onMealDeleted={handleMealDeleted}
				/>
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<DailyTracker
					meals={meals}
					todayLog={todayLog}
					onLogUpdated={handleTodayLogUpdated}
				/>
			</TabPanel>

			<TabPanel value={tabValue} index={2}>
				<FoodHistory />
			</TabPanel>
		</Container>
	);
};

export default FoodLogClient;
