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
} from "@mui/material";
import {
	SaveOutlined,
	CancelOutlined,
	CategoryOutlined,
} from "@mui/icons-material";
import { KnowledgeCategory } from "../interfaces/knowledge.interface";

interface CategoryFormProps {
	onCategoryAdded: (category: KnowledgeCategory) => void;
}

const ICONS = [
	{ value: "💪", label: "💪 Muscle" },
	{ value: "🤸", label: "🤸 Gimnastika" },
	{ value: "🏋️", label: "🏋️ Trening" },
	{ value: "🎯", label: "🎯 Cilj" },
	{ value: "📈", label: "📈 Napredak" },
	{ value: "⚡", label: "⚡ Snaga" },
	{ value: "🔥", label: "🔥 Intenzitet" },
	{ value: "🧘", label: "🧘 Fleksibilnost" },
	{ value: "🏃", label: "🏃 Kardio" },
	{ value: "🎪", label: "🎪 Skill" },
];

const COLORS = [
	{ value: "#1976d2", label: "Plava" },
	{ value: "#2e7d32", label: "Zelena" },
	{ value: "#d32f2f", label: "Crvena" },
	{ value: "#f57c00", label: "Narandžasta" },
	{ value: "#7b1fa2", label: "Ljubičasta" },
	{ value: "#0288d1", label: "Svetlo plava" },
	{ value: "#c2185b", label: "Pink" },
	{ value: "#5d4037", label: "Braon" },
];

const CategoryForm: React.FC<CategoryFormProps> = ({ onCategoryAdded }) => {
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		icon: "💪",
		color: "#1976d2",
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			setError("Naziv kategorije je obavezan");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/knowledge", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					type: "category",
					...formData,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri kreiranju kategorije");
			}

			const newCategory = await response.json();
			onCategoryAdded(newCategory);

			setFormData({
				name: "",
				description: "",
				icon: "💪",
				color: "#1976d2",
			});

			setSuccess("Kategorija je uspešno kreirana!");
		} catch (error) {
			console.error("Error creating category:", error);
			setError(
				error instanceof Error
					? error.message
					: "Greška pri kreiranju kategorije"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClear = () => {
		setFormData({
			name: "",
			description: "",
			icon: "💪",
			color: "#1976d2",
		});
		setError(null);
		setSuccess(null);
	};

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<CategoryOutlined sx={{ mr: 2, color: "primary.main" }} />
				<Typography variant="h5" component="h2" fontWeight="600">
					Nova kategorija
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
									label="Naziv kategorije"
									placeholder="Npr. Front Lever, Planche, Muscle Up..."
									value={formData.name}
									onChange={(e) => handleInputChange("name", e.target.value)}
									inputProps={{ maxLength: 50 }}
									helperText={`${formData.name.length}/50 karaktera`}
									required
								/>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<TextField
									fullWidth
									multiline
									rows={3}
									label="Opis kategorije (opciono)"
									placeholder="Kratak opis šta ova kategorija obuhvata..."
									value={formData.description}
									onChange={(e) =>
										handleInputChange("description", e.target.value)
									}
									inputProps={{ maxLength: 200 }}
									helperText={`${formData.description.length}/200 karaktera`}
								/>
							</Grid>

							<Grid size={{ xs: 12, sm: 6 }}>
								<TextField
									select
									fullWidth
									label="Ikona"
									value={formData.icon}
									onChange={(e) => handleInputChange("icon", e.target.value)}
								>
									{ICONS.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</TextField>
							</Grid>

							<Grid size={{ xs: 12, sm: 6 }}>
								<TextField
									select
									fullWidth
									label="Boja"
									value={formData.color}
									onChange={(e) => handleInputChange("color", e.target.value)}
								>
									{COLORS.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1,
												}}
											>
												<Box
													sx={{
														width: 20,
														height: 20,
														borderRadius: "50%",
														bgcolor: option.value,
													}}
												/>
												{option.label}
											</Box>
										</MenuItem>
									))}
								</TextField>
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
										disabled={isSubmitting || !formData.name.trim()}
										size="large"
									>
										{isSubmitting ? "Čuvanje..." : "Kreiraj kategoriju"}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</form>
				</CardContent>
			</Card>

			{/* Preview */}
			{formData.name.trim() && (
				<Card
					elevation={1}
					sx={{
						mt: 3,
						borderLeft: `4px solid ${formData.color}`,
					}}
				>
					<CardContent>
						<Typography variant="h6" gutterBottom color="text.secondary">
							👁️ Pregled:
						</Typography>
						<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
							<Typography variant="h4">{formData.icon}</Typography>
							<Box>
								<Typography variant="h6" fontWeight="600">
									{formData.name}
								</Typography>
								{formData.description && (
									<Typography variant="body2" color="text.secondary">
										{formData.description}
									</Typography>
								)}
							</Box>
						</Box>
					</CardContent>
				</Card>
			)}
		</Box>
	);
};

export default CategoryForm;
