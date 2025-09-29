"use client";

import React, { useState } from "react";
import {
	Box,
	Typography,
	TextField,
	Button,
	Card,
	CardContent,
	Alert,
	Grid,
	MenuItem,
	Avatar,
	Stack,
} from "@mui/material";
import { SaveOutlined, PersonOutline } from "@mui/icons-material";
import { UserProfile } from "../interfaces/user-profile.interface";
import UploadImageBox from "@/features/workouts/components/UploadImageBox";

interface ProfileFormProps {
	profile: UserProfile;
	onProfileUpdated: (profile: UserProfile) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
	profile,
	onProfileUpdated,
}) => {
	const [formData, setFormData] = useState({
		firstName: profile.firstName || "",
		lastName: profile.lastName || "",
		age: profile.age || "",
		height: profile.height || "",
		gender: profile.gender || "",
		activityLevel: profile.activityLevel || "",
		goal: profile.goal || "",
		avatarUrl: profile.avatarUrl || "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		if (error) setError(null);
		if (success) setSuccess(null);
	};

	const handleAvatarUpload = (url: string) => {
		setFormData((prev) => ({
			...prev,
			avatarUrl: url,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.firstName.trim() || !formData.lastName.trim()) {
			setError("Ime i prezime su obavezni");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/user-profile", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri ažuriranju profila");
			}

			const updatedProfile = await response.json();
			onProfileUpdated(updatedProfile);
			setSuccess("Profil je uspješno ažuriran!");
		} catch (error) {
			console.error("Error updating profile:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri ažuriranju profila"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const isFormValid = formData.firstName.trim() && formData.lastName.trim();

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<PersonOutline sx={{ mr: 2, color: "primary.main" }} />
				<Typography variant="h5" component="h2" fontWeight="600">
					Osnovne informacije
				</Typography>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert severity="success" sx={{ mb: 3 }}>
					{success}
				</Alert>
			)}

			<Card elevation={2}>
				<CardContent sx={{ p: 4 }}>
					<form onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							{/* Avatar sekcija */}
							<Grid size={{ xs: 12 }}>
								<Box sx={{ mb: 2 }}>
									<Typography variant="subtitle1" fontWeight={600} gutterBottom>
										Profilna slika
									</Typography>
									<Stack direction="row" spacing={3} alignItems="center">
										<Avatar
											src={formData.avatarUrl}
											alt={`${formData.firstName} ${formData.lastName}`}
											sx={{ width: 100, height: 100 }}
										>
											{!formData.avatarUrl && formData.firstName.charAt(0)}
										</Avatar>
										<UploadImageBox
											onUploadSuccess={handleAvatarUpload}
											endpoint="/api/avatar"
											label="Upload Avatar"
											maxSizeMB={2}
										/>
									</Stack>
								</Box>
							</Grid>

							{/* Ime i prezime */}
							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									required
									label="Ime"
									value={formData.firstName}
									onChange={(e) =>
										handleInputChange("firstName", e.target.value)
									}
									inputProps={{ maxLength: 50 }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									required
									label="Prezime"
									value={formData.lastName}
									onChange={(e) =>
										handleInputChange("lastName", e.target.value)
									}
									inputProps={{ maxLength: 50 }}
								/>
							</Grid>

							{/* Godine, visina, pol */}
							<Grid size={{ xs: 12, md: 4 }}>
								<TextField
									fullWidth
									type="number"
									label="Godine"
									value={formData.age}
									onChange={(e) => handleInputChange("age", e.target.value)}
									inputProps={{ min: 10, max: 120 }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 4 }}>
								<TextField
									fullWidth
									type="number"
									label="Visina (cm)"
									value={formData.height}
									onChange={(e) => handleInputChange("height", e.target.value)}
									inputProps={{ min: 100, max: 250 }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 4 }}>
								<TextField
									fullWidth
									select
									label="Pol"
									value={formData.gender}
									onChange={(e) => handleInputChange("gender", e.target.value)}
								>
									<MenuItem value="">Nije odabrano</MenuItem>
									<MenuItem value="male">Muški</MenuItem>
									<MenuItem value="female">Ženski</MenuItem>
									<MenuItem value="other">Ostalo</MenuItem>
								</TextField>
							</Grid>

							{/* Nivo aktivnosti */}
							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									select
									label="Nivo aktivnosti"
									value={formData.activityLevel}
									onChange={(e) =>
										handleInputChange("activityLevel", e.target.value)
									}
									helperText="Koristi se za proračun kalorija"
								>
									<MenuItem value="">Nije odabrano</MenuItem>
									<MenuItem value="sedentary">
										Sedentarno (malo ili bez vježbanja)
									</MenuItem>
									<MenuItem value="light">
										Lako aktivno (1-3 dana/sedmično)
									</MenuItem>
									<MenuItem value="moderate">
										Umjereno aktivno (3-5 dana/sedmično)
									</MenuItem>
									<MenuItem value="active">
										Aktivno (6-7 dana/sedmično)
									</MenuItem>
									<MenuItem value="very_active">
										Veoma aktivno (2x dnevno)
									</MenuItem>
								</TextField>
							</Grid>

							{/* Cilj */}
							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									select
									label="Cilj"
									value={formData.goal}
									onChange={(e) => handleInputChange("goal", e.target.value)}
									helperText="Šta želite postići?"
								>
									<MenuItem value="">Nije odabrano</MenuItem>
									<MenuItem value="muscle_gain">
										Povećanje mišićne mase
									</MenuItem>
									<MenuItem value="fat_loss">Gubitak masnoće</MenuItem>
									<MenuItem value="maintenance">
										Održavanje trenutne težine
									</MenuItem>
								</TextField>
							</Grid>

							{/* Submit button */}
							<Grid size={{ xs: 12 }}>
								<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
									<Button
										type="submit"
										variant="contained"
										startIcon={<SaveOutlined />}
										disabled={isSubmitting || !isFormValid}
										size="large"
									>
										{isSubmitting ? "Čuvanje..." : "Sačuvaj promjene"}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</form>
				</CardContent>
			</Card>
		</Box>
	);
};

export default ProfileForm;
