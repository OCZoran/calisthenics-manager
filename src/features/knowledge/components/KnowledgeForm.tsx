"use client";
import dynamic from "next/dynamic";

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
	Chip,
} from "@mui/material";
import {
	SaveOutlined,
	CancelOutlined,
	LightbulbOutlined,
	AddCircleOutline,
} from "@mui/icons-material";
import {
	KnowledgeCategory,
	KnowledgeItem,
} from "../interfaces/knowledge.interface";

const RichTextEditor = dynamic(() => import("@/global/ui/RichTextEditor"), {
	ssr: false,
});

interface KnowledgeItemFormProps {
	categories: KnowledgeCategory[];
	onItemAdded: (item: KnowledgeItem) => void;
}
export const DIFFICULTY_LEVELS = [
	{ value: "beginner", label: "🟢 Početnik" },
	{ value: "intermediate", label: "🟡 Srednji" },
	{ value: "advanced", label: "🔴 Napredni" },
	{ value: "elite", label: "⚫ Elitni" },
];
const KnowledgeItemForm: React.FC<KnowledgeItemFormProps> = ({
	categories,
	onItemAdded,
}) => {
	const [formData, setFormData] = useState({
		categoryId: "",
		title: "",
		content: "",
		tags: [] as string[],
		difficulty: "beginner", // default
	});
	const [tagInput, setTagInput] = useState("");
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

	const handleAddTag = () => {
		const tag = tagInput.trim().toLowerCase();
		if (tag && !formData.tags.includes(tag)) {
			setFormData((prev) => ({
				...prev,
				tags: [...prev.tags, tag],
			}));
			setTagInput("");
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!formData.categoryId ||
			!formData.title.trim() ||
			!formData.content.trim()
		) {
			setError("Kategorija, naslov i sadržaj su obavezni");
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
					type: "item",
					...formData,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri dodavanju sadržaja");
			}

			const newItem = await response.json();
			onItemAdded(newItem);

			setFormData({
				categoryId: "",
				title: "",
				content: "",
				tags: [],
				difficulty: "beginner",
			});

			setSuccess("Sadržaj je uspešno dodat!");
		} catch (error) {
			console.error("Error creating item:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri dodavanju sadržaja"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClear = () => {
		setFormData({
			categoryId: "",
			title: "",
			content: "",
			tags: [],
			difficulty: "beginner",
		});
		setTagInput("");
		setError(null);
		setSuccess(null);
	};

	const selectedCategory = categories.find(
		(c) => c._id === formData.categoryId
	);

	if (categories.length === 0) {
		return (
			<Box sx={{ textAlign: "center", py: 8 }}>
				<LightbulbOutlined
					sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
				/>
				<Typography variant="h5" gutterBottom fontWeight="bold">
					Nema kategorija
				</Typography>
				<Typography variant="body1" color="textSecondary">
					Prvo kreirajte kategoriju pre dodavanja sadržaja
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<LightbulbOutlined sx={{ mr: 2, color: "primary.main" }} />
				<Typography variant="h5" component="h2" fontWeight="600">
					Dodaj novi sadržaj
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
									select
									fullWidth
									label="Kategorija"
									value={formData.categoryId}
									onChange={(e) =>
										handleInputChange("categoryId", e.target.value)
									}
									required
								>
									{categories.map((category) => (
										<MenuItem key={category._id} value={category._id}>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<Typography variant="h6">{category.icon}</Typography>
												<Typography>{category.name}</Typography>
											</Box>
										</MenuItem>
									))}
								</TextField>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<TextField
									select
									fullWidth
									label="Nivo težine"
									value={formData.difficulty}
									onChange={(e) =>
										handleInputChange("difficulty", e.target.value)
									}
									required
								>
									{DIFFICULTY_LEVELS.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</TextField>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<TextField
									fullWidth
									label="Naslov saveta/znanja"
									placeholder="Npr. Kako produžiti hold, Progresije ka pull-upima..."
									value={formData.title}
									onChange={(e) => handleInputChange("title", e.target.value)}
									inputProps={{ maxLength: 100 }}
									helperText={`${formData.title.length}/100 karaktera`}
									required
								/>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<RichTextEditor
									value={formData.content}
									onChange={(value) => handleInputChange("content", value)}
									label="Sadržaj"
									placeholder="Detaljno opišite savet, tehniku, progresiju... Kliknite na ikonu slike da dodate fotografije."
									helperText="Pišite sve što mislite da je važno - nema ograničenja. Možete dodavati slike direktno u tekst."
									required
								/>
							</Grid>
							<Grid size={{ xs: 12 }}>
								<Box sx={{ mb: 2 }}>
									<Typography variant="subtitle2" gutterBottom>
										Tagovi (opciono)
									</Typography>
									<Box sx={{ display: "flex", gap: 1, mb: 2 }}>
										<TextField
											size="small"
											placeholder="Dodaj tag (npr. progresija, tehnika...)"
											value={tagInput}
											onChange={(e) => setTagInput(e.target.value)}
											onKeyPress={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddTag();
												}
											}}
											sx={{ flex: 1 }}
										/>
										<Button
											startIcon={<AddCircleOutline />}
											onClick={handleAddTag}
											disabled={!tagInput.trim()}
										>
											Dodaj
										</Button>
									</Box>
									<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
										{formData.tags.map((tag) => (
											<Chip
												key={tag}
												label={tag}
												onDelete={() => handleRemoveTag(tag)}
												color="primary"
												variant="outlined"
											/>
										))}
									</Box>
								</Box>
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
										disabled={
											isSubmitting ||
											!formData.categoryId ||
											!formData.title.trim() ||
											!formData.content.trim()
										}
										size="large"
									>
										{isSubmitting ? "Čuvanje..." : "Sačuvaj sadržaj"}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</form>
				</CardContent>
			</Card>

			{/* Preview */}
			{selectedCategory && formData.title.trim() && (
				<Card
					elevation={1}
					sx={{
						mt: 3,
						borderLeft: `4px solid ${selectedCategory.color}`,
					}}
				>
					<CardContent>
						<Typography variant="h6" gutterBottom color="text.secondary">
							👁️ Pregled:
						</Typography>

						<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
							<Typography variant="h5">{selectedCategory.icon}</Typography>
							<Chip
								label={selectedCategory.name}
								size="small"
								sx={{ bgcolor: selectedCategory.color, color: "white" }}
							/>
						</Box>

						<Typography variant="h6" fontWeight="600" gutterBottom>
							{formData.title}
						</Typography>
						{formData.content.trim() && (
							<Box
								sx={{
									lineHeight: 1.6,
									mb: 2,
									"& img": {
										maxWidth: "100%",
										height: "auto",
										borderRadius: 1,
										margin: "8px 0",
									},
								}}
								dangerouslySetInnerHTML={{ __html: formData.content }}
							/>
						)}

						{formData.tags.length > 0 && (
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
								{formData.tags.map((tag) => (
									<Chip key={tag} label={tag} size="small" variant="outlined" />
								))}
							</Box>
						)}
					</CardContent>
				</Card>
			)}
		</Box>
	);
};

export default KnowledgeItemForm;
