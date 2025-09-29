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
	PersonOutline,
	TimelineOutlined,
	AddCircleOutline,
} from "@mui/icons-material";
import {
	BodyMeasurement,
	UserProfile,
} from "../interfaces/user-profile.interface";
import ProfileForm from "./UserProfileForm";
import MeasurementForm from "./MeasurementForm";
import MeasurementsList from "./MeasurementList";

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
			id={`profile-tabpanel-${index}`}
			aria-labelledby={`profile-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `profile-tab-${index}`,
		"aria-controls": `profile-tabpanel-${index}`,
	};
}

const UserProfileClient: React.FC = () => {
	const [tabValue, setTabValue] = useState(0);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	const fetchProfile = async () => {
		try {
			const response = await fetch("/api/user-profile");
			if (!response.ok) throw new Error("Greška pri učitavanju profila");
			const data = await response.json();
			setProfile(data);
		} catch (error) {
			console.error("Error fetching profile:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri učitavanju profila"
			);
		}
	};

	const fetchMeasurements = async () => {
		try {
			const response = await fetch("/api/measurements");
			if (!response.ok) throw new Error("Greška pri učitavanju mjerenja");
			const data = await response.json();
			setMeasurements(data);
		} catch (error) {
			console.error("Error fetching measurements:", error);
		}
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await Promise.all([fetchProfile(), fetchMeasurements()]);
			setIsLoading(false);
		};
		loadData();
	}, []);

	const handleProfileUpdated = (updatedProfile: UserProfile) => {
		setProfile(updatedProfile);
	};

	const handleMeasurementAdded = (newMeasurement: BodyMeasurement) => {
		setMeasurements((prev) => [newMeasurement, ...prev]);
		setTabValue(2); // Prebaci na tab sa listom mjerenja
	};

	const handleMeasurementUpdated = (updatedMeasurement: BodyMeasurement) => {
		setMeasurements((prev) =>
			prev.map((m) =>
				m._id === updatedMeasurement._id ? updatedMeasurement : m
			)
		);
	};

	const handleMeasurementDeleted = (measurementId: string) => {
		setMeasurements((prev) => prev.filter((m) => m._id !== measurementId));
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
					<PersonOutline sx={{ fontSize: 40, color: "primary.main" }} />
					Moj Profil
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Upravljajte svojim profilom i pratite fizičke izmjene
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
					aria-label="profile tabs"
					variant="fullWidth"
				>
					<Tab
						icon={<PersonOutline />}
						label="Osnovni podaci"
						{...a11yProps(0)}
						sx={{ fontWeight: 600 }}
					/>
					<Tab
						icon={<AddCircleOutline />}
						label="Dodaj mjerenje"
						{...a11yProps(1)}
						sx={{ fontWeight: 600 }}
					/>
					<Tab
						icon={<TimelineOutlined />}
						label={`Istorija (${measurements.length})`}
						{...a11yProps(2)}
						sx={{ fontWeight: 600 }}
					/>
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				{profile && (
					<ProfileForm
						profile={profile}
						onProfileUpdated={handleProfileUpdated}
					/>
				)}
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<MeasurementForm
					onMeasurementAdded={handleMeasurementAdded}
					latestMeasurement={measurements[0]}
				/>
			</TabPanel>

			<TabPanel value={tabValue} index={2}>
				<MeasurementsList
					measurements={measurements}
					onMeasurementUpdated={handleMeasurementUpdated}
					onMeasurementDeleted={handleMeasurementDeleted}
				/>
			</TabPanel>
		</Container>
	);
};

export default UserProfileClient;
