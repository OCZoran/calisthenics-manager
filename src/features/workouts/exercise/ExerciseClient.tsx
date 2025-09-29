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
	FitnessCenterOutlined,
	AddCircleOutline,
	FormatListBulletedOutlined,
} from "@mui/icons-material";
import { ExerciseDefinition } from "@/global/interfaces/training-plan.interface";
import ExerciseForm from "./ExerciseForm";
import ExerciseList from "./ExerciseList";

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
			id={`exercise-tabpanel-${index}`}
			aria-labelledby={`exercise-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `exercise-tab-${index}`,
		"aria-controls": `exercise-tabpanel-${index}`,
	};
}

const ExerciseClient: React.FC = () => {
	const [tabValue, setTabValue] = useState(0);
	const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	const fetchExercises = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/exercises");

			if (!response.ok) {
				throw new Error("Greška pri učitavanju vježbi");
			}

			const data = await response.json();
			setExercises(data.exercises || []);
		} catch (error) {
			console.error("Error fetching exercises:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri učitavanju vježbi"
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchExercises();
	}, []);

	const handleExerciseAdded = (newExercise: ExerciseDefinition) => {
		setExercises((prev) => [...prev, newExercise]);
		setTabValue(1); // Prebaci na tab sa listom
	};

	const handleExerciseUpdated = (updatedExercise: ExerciseDefinition) => {
		setExercises((prev) =>
			prev.map((exercise) =>
				exercise._id === updatedExercise._id ? updatedExercise : exercise
			)
		);
	};

	const handleExerciseDeleted = (exerciseId: string) => {
		setExercises((prev) =>
			prev.filter((exercise) => exercise._id !== exerciseId)
		);
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
					<FitnessCenterOutlined sx={{ fontSize: 40, color: "primary.main" }} />
					Baza Vježbi
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Kreirajte i upravljajte vašim vježbama po kategorijama
				</Typography>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
				<Tabs
					value={tabValue}
					onChange={handleTabChange}
					aria-label="exercise tabs"
					variant="fullWidth"
				>
					<Tab
						icon={<AddCircleOutline />}
						label="Dodaj vježbu"
						{...a11yProps(0)}
						sx={{ fontWeight: 600 }}
					/>
					<Tab
						icon={<FormatListBulletedOutlined />}
						label={`Sve vježbe (${exercises.length})`}
						{...a11yProps(1)}
						sx={{ fontWeight: 600 }}
					/>
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<ExerciseForm onExerciseAdded={handleExerciseAdded} />
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<ExerciseList
					exercises={exercises}
					onExerciseUpdated={handleExerciseUpdated}
					onExerciseDeleted={handleExerciseDeleted}
				/>
			</TabPanel>
		</Container>
	);
};

export default ExerciseClient;
