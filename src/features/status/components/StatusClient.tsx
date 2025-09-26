/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Timeline, AddCircleOutline } from "@mui/icons-material";
import StatusList from "./StatusList";
import { StatusEntry } from "../interfaces/status.interface";
import StatusForm from "./StatusForm";

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
			id={`status-tabpanel-${index}`}
			aria-labelledby={`status-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `status-tab-${index}`,
		"aria-controls": `status-tabpanel-${index}`,
	};
}

const StatusClient: React.FC = () => {
	const [tabValue, setTabValue] = useState(0);
	const [entries, setEntries] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	const fetchEntries = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/status");

			if (!response.ok) {
				throw new Error("Greška pri učitavanju status unosa");
			}

			const data = await response.json();
			setEntries(data);
		} catch (error) {
			console.error("Error fetching status entries:", error);
			setError(
				error instanceof Error
					? error.message
					: "Greška pri učitavanju status unosa"
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchEntries();
	}, []);

	const handleEntryAdded = (newEntry: StatusEntry) => {
		// Check if exercise already exists
		const existingIndex = entries.findIndex(
			(entry) => entry.exerciseName === newEntry.exerciseName
		);

		if (existingIndex >= 0) {
			// Update existing exercise with new entry as latest
			const updatedEntries = [...entries];
			updatedEntries[existingIndex] = {
				...newEntry,
				history: [newEntry, ...(updatedEntries[existingIndex].history || [])],
			};
			setEntries(updatedEntries);
		} else {
			// Add new exercise
			setEntries((prev) => [{ ...newEntry, history: [newEntry] }, ...prev]);
		}
		setTabValue(1); // Switch to status list tab
	};

	const handleEntryUpdated = (updatedEntry: StatusEntry) => {
		const existingIndex = entries.findIndex(
			(entry) => entry.exerciseName === updatedEntry.exerciseName
		);

		if (existingIndex >= 0) {
			const updatedEntries = [...entries];
			// Add new entry to history and update latest
			updatedEntries[existingIndex] = {
				...updatedEntry,
				history: [
					updatedEntry,
					...(updatedEntries[existingIndex].history || []),
				],
			};
			setEntries(updatedEntries);
		}
	};

	const handleEntryDeleted = (exerciseName: string) => {
		setEntries((prev) =>
			prev.filter((entry) => entry.exerciseName !== exerciseName)
		);
	};

	// Get existing exercise names for form suggestions
	const existingExercises = entries.map((entry) => entry.exerciseName);

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
					<Timeline sx={{ fontSize: 40, color: "primary.main" }} />
					Moj Status
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Pratite svoj napredak u performansama i težinama
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
					aria-label="status tabs"
					variant="fullWidth"
				>
					<Tab
						icon={<AddCircleOutline />}
						label="Dodaj status"
						{...a11yProps(0)}
						sx={{ fontWeight: 600 }}
					/>
					<Tab
						icon={<Timeline />}
						label={`Pregled statusa (${entries.length})`}
						{...a11yProps(1)}
						sx={{ fontWeight: 600 }}
					/>
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<StatusForm
					onEntryAdded={handleEntryAdded}
					existingExercises={existingExercises}
				/>
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<StatusList
					entries={entries}
					onEntryUpdated={handleEntryUpdated}
					onEntryDeleted={handleEntryDeleted}
				/>
			</TabPanel>
		</Container>
	);
};

export default StatusClient;
