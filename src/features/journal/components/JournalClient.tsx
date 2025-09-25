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
import { BookOutlined, EditOutlined } from "@mui/icons-material";
import { JournalEntry } from "../interface/journal.interface";
import JournalForm from "./JournalForm";
import JournalList from "./JournalList";

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
			id={`journal-tabpanel-${index}`}
			aria-labelledby={`journal-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `journal-tab-${index}`,
		"aria-controls": `journal-tabpanel-${index}`,
	};
}

const JournalClient: React.FC = () => {
	const [tabValue, setTabValue] = useState(0);
	const [entries, setEntries] = useState<JournalEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	const fetchEntries = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/journal");

			if (!response.ok) {
				throw new Error("Greška pri učitavanju unosa");
			}

			const data = await response.json();
			setEntries(data);
		} catch (error) {
			console.error("Error fetching entries:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri učitavanju unosa"
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchEntries();
	}, []);

	const handleEntryAdded = (newEntry: JournalEntry) => {
		setEntries((prev) => [newEntry, ...prev]);
		setTabValue(1); // Prebaci na tab sa listom
	};

	const handleEntryUpdated = (updatedEntry: JournalEntry) => {
		setEntries((prev) =>
			prev.map((entry) =>
				entry._id === updatedEntry._id ? updatedEntry : entry
			)
		);
	};

	const handleEntryDeleted = (entryId: string) => {
		setEntries((prev) => prev.filter((entry) => entry._id !== entryId));
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
					<BookOutlined sx={{ fontSize: 40, color: "primary.main" }} />
					Moj Dnevnik
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Vodite evidenciju o svojim treninzima i napretku
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
					aria-label="journal tabs"
					variant="fullWidth"
				>
					<Tab
						icon={<EditOutlined />}
						label="Dodaj unos"
						{...a11yProps(0)}
						sx={{ fontWeight: 600 }}
					/>
					<Tab
						icon={<BookOutlined />}
						label={`Pregled unosa (${entries.length})`}
						{...a11yProps(1)}
						sx={{ fontWeight: 600 }}
					/>
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<JournalForm onEntryAdded={handleEntryAdded} />
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<JournalList
					entries={entries}
					onEntryUpdated={handleEntryUpdated}
					onEntryDeleted={handleEntryDeleted}
				/>
			</TabPanel>
		</Container>
	);
};

export default JournalClient;
