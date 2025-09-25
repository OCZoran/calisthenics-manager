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
} from "@mui/material";
import {
	SaveOutlined,
	CancelOutlined,
	CalendarToday,
	EditNote,
} from "@mui/icons-material";
import { JournalEntry } from "../interface/journal.interface";

interface JournalFormProps {
	onEntryAdded: (entry: JournalEntry) => void;
}

const JournalForm: React.FC<JournalFormProps> = ({ onEntryAdded }) => {
	const [formData, setFormData] = useState({
		date: new Date().toISOString().split("T")[0],
		title: "",
		content: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		// Clear messages when user starts typing
		if (error) setError(null);
		if (success) setSuccess(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.title.trim() || !formData.content.trim()) {
			setError("Naslov i sadržaj su obavezni");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/journal", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri kreiranju unosa");
			}

			const newEntry = await response.json();
			onEntryAdded(newEntry);

			// Reset form
			setFormData({
				date: new Date().toISOString().split("T")[0],
				title: "",
				content: "",
			});

			setSuccess("Unos je uspešno kreiran!");
		} catch (error) {
			console.error("Error creating journal entry:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri kreiranju unosa"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClear = () => {
		setFormData({
			date: new Date().toISOString().split("T")[0],
			title: "",
			content: "",
		});
		setError(null);
		setSuccess(null);
	};

	const formatDisplayDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("sr-RS", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const isFormValid = formData.title.trim() && formData.content.trim();

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<EditNote sx={{ mr: 2, color: "primary.main" }} />
				<Typography variant="h5" component="h2" fontWeight="600">
					Novi unos u dnevnik
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
							<Grid size={{ xs: 12 }}>
								<TextField
									fullWidth
									type="date"
									label="Datum"
									value={formData.date}
									onChange={(e) => handleInputChange("date", e.target.value)}
									InputProps={{
										startAdornment: <CalendarToday sx={{ mr: 1 }} />,
									}}
									helperText={`Odabrani datum: ${formatDisplayDate(
										formData.date
									)}`}
									sx={{ mb: 2 }}
								/>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<TextField
									fullWidth
									label="Naslov unosa"
									placeholder="Npr. Trening nogu - squat PR"
									value={formData.title}
									onChange={(e) => handleInputChange("title", e.target.value)}
									inputProps={{ maxLength: 100 }}
									helperText={`${formData.title.length}/100 karaktera`}
									sx={{ mb: 2 }}
								/>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<TextField
									fullWidth
									multiline
									rows={8}
									label="Sadržaj dnevnika"
									placeholder="Opišite kako je prošao trening, kakvi su bili osećaji, šta ste naučili, planovi za naredne treninge..."
									value={formData.content}
									onChange={(e) => handleInputChange("content", e.target.value)}
									helperText="Pišite slobodno - nema ograničenja"
									sx={{
										mb: 3,
										"& .MuiInputBase-root": {
											lineHeight: 1.6,
										},
									}}
								/>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<Box
									sx={{
										display: "flex",
										gap: 2,
										justifyContent: "flex-end",
									}}
								>
									<Button
										startIcon={<CancelOutlined />}
										onClick={handleClear}
										disabled={isSubmitting}
										color="inherit"
									>
										Obriši polja
									</Button>
									<Button
										type="submit"
										variant="contained"
										startIcon={<SaveOutlined />}
										disabled={isSubmitting || !isFormValid}
										size="large"
									>
										{isSubmitting ? "Čuvanje..." : "Sačuvaj unos"}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</form>
				</CardContent>
			</Card>

			{/* Preview card if there's content */}
			{(formData.title.trim() || formData.content.trim()) && (
				<Card elevation={1} sx={{ mt: 3, backgroundColor: "grey.50" }}>
					<CardContent>
						<Typography variant="h6" gutterBottom color="text.secondary">
							📝 Pregled unosa:
						</Typography>

						{formData.title.trim() && (
							<Typography variant="h6" gutterBottom fontWeight="600">
								{formData.title}
							</Typography>
						)}

						<Typography variant="body2" color="text.secondary" gutterBottom>
							{formatDisplayDate(formData.date)}
						</Typography>

						{formData.content.trim() && (
							<Typography
								variant="body1"
								sx={{
									mt: 2,
									whiteSpace: "pre-wrap",
									lineHeight: 1.6,
								}}
							>
								{formData.content}
							</Typography>
						)}
					</CardContent>
				</Card>
			)}
		</Box>
	);
};

export default JournalForm;
