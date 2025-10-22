"use client";

import React, { useState } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	Grid,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
	Chip,
	Alert,
} from "@mui/material";
import {
	AddOutlined,
	EditOutlined,
	DeleteOutlined,
	CheckCircleOutlined,
	RadioButtonUncheckedOutlined,
	TrendingUpOutlined,
	PlayCircleOutlined,
	CalendarTodayOutlined,
	EmojiEventsOutlined,
} from "@mui/icons-material";
import { Goal } from "../goal.interface";
import UploadImageBox from "@/features/workouts/components/UploadImageBox";
import Image from "next/image";

interface GoalManagerProps {
	goals: Goal[];
	onGoalAdded: (goal: Goal) => void;
	onGoalUpdated: (goal: Goal) => void;
	onGoalDeleted: (goalId: string) => void;
	onGoalClick?: (goal: Goal) => void;
}

const CATEGORIES = [
	"Fleksibilnost",
	"Mobilnost",
	"Vještina",
	"Snaga",
	"Kilaza",
	"Ponavljanja",
	"Izdržljivost",
	"Drugo",
];

const GoalManager: React.FC<GoalManagerProps> = ({
	goals,
	onGoalAdded,
	onGoalUpdated,
	onGoalDeleted,
	onGoalClick,
}) => {
	const [openDialog, setOpenDialog] = useState(false);
	const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
	const [formData, setFormData] = useState({
		title: "",
		category: "",
		description: "",
		startDate: new Date().toISOString().split("T")[0],
		difficulty: "Easy" as "Easy" | "Intermediate" | "Advanced",
		images: [] as string[],
	});
	const [error, setError] = useState<string | null>(null);
	const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
	const [filterCompleted, setFilterCompleted] = useState<string>("all");
	const [filterCategory, setFilterCategory] = useState<string>("all");

	const handleOpenDialog = (goal?: Goal) => {
		if (goal) {
			setEditingGoal(goal);
			setFormData({
				title: goal.title,
				category: goal.category,
				description: goal.description || "",
				startDate: goal.startDate,
				difficulty: goal.difficulty,
				images: goal.images || [],
			});
		} else {
			setEditingGoal(null);
			setFormData({
				title: "",
				category: "",
				description: "",
				startDate: new Date().toISOString().split("T")[0],
				difficulty: "Easy",
				images: [],
			});
		}
		setOpenDialog(true);
		setError(null);
	};

	const handleCloseDialog = () => {
		setOpenDialog(false);
		setEditingGoal(null);
		setFormData({
			title: "",
			category: "",
			description: "",
			startDate: new Date().toISOString().split("T")[0],
			difficulty: "Easy",
			images: [],
		});
		setError(null);
	};

	const handleMediaUpload = (urls: string[]) => {
		setFormData((prev) => ({
			...prev,
			images: [...prev.images, ...urls],
		}));
	};

	const handleRemoveMedia = (url: string) => {
		setFormData((prev) => ({
			...prev,
			images: prev.images.filter((img) => img !== url),
		}));
	};

	const handleSubmit = async () => {
		try {
			if (!formData.title.trim()) {
				setError("Naziv cilja je obavezan");
				return;
			}

			if (!formData.category) {
				setError("Kategorija je obavezna");
				return;
			}

			const url = editingGoal
				? `/api/goals?id=${editingGoal._id}`
				: "/api/goals";

			// FIXED: Ensure images array is included in the request
			const goalData = {
				title: formData.title,
				category: formData.category,
				description: formData.description,
				startDate: formData.startDate,
				difficulty: formData.difficulty,
				images: formData.images, // ← This is KEY!
			};

			console.log("Sending goal data:", goalData); // Debug log

			const response = await fetch(url, {
				method: editingGoal ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(goalData),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Greška pri čuvanju cilja");
			}

			const savedGoal = await response.json();

			if (editingGoal) {
				onGoalUpdated(savedGoal);
			} else {
				onGoalAdded(savedGoal);
			}

			handleCloseDialog();
		} catch (error) {
			console.error("Error saving goal:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri čuvanju cilja"
			);
		}
	};

	const handleDelete = async (goalId: string) => {
		if (!confirm("Da li ste sigurni da želite obrisati ovaj cilj?")) return;

		try {
			const response = await fetch(`/api/goals?id=${goalId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Greška pri brisanju cilja");
			}

			onGoalDeleted(goalId);
		} catch (error) {
			console.error("Error deleting goal:", error);
			alert("Greška pri brisanju cilja");
		}
	};

	const handleToggleComplete = async (goal: Goal) => {
		try {
			const response = await fetch(`/api/goals?id=${goal._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ completed: !goal.completed }),
			});

			if (!response.ok) {
				throw new Error("Greška pri ažuriranju cilja");
			}

			const updatedGoal = await response.json();
			onGoalUpdated(updatedGoal);
		} catch (error) {
			console.error("Error toggling goal completion:", error);
			alert("Greška pri ažuriranju cilja");
		}
	};

	const getDifficultyColor = (
		difficulty: string
	): "success" | "warning" | "error" => {
		switch (difficulty) {
			case "Easy":
				return "success";
			case "Intermediate":
				return "warning";
			case "Advanced":
				return "error";
			default:
				return "success";
		}
	};

	const isVideo = (url: string) => {
		return url.match(/\.(mp4|mov|avi|webm)$/i);
	};

	const filteredGoals = goals.filter((goal) => {
		const difficultyMatch =
			filterDifficulty === "all" || goal.difficulty === filterDifficulty;
		const completedMatch =
			filterCompleted === "all" ||
			(filterCompleted === "completed" && goal.completed) ||
			(filterCompleted === "active" && !goal.completed);
		const categoryMatch =
			filterCategory === "all" || goal.category === filterCategory;
		return difficultyMatch && completedMatch && categoryMatch;
	});

	return (
		<Box>
			<Box
				sx={{
					mb: 4,
					display: "flex",
					gap: 2,
					flexWrap: "wrap",
					alignItems: "center",
				}}
			>
				{/* <Grid size={{ xs: 12, md: 6 }}>
					<FormControl fullWidth variant="outlined" required>
						<InputLabel>Kategorija</InputLabel>
						<Select
							value={formData.category}
							onChange={(e) =>
								setFormData({ ...formData, category: e.target.value })
							}
							label="Kategorija"
						>
							{CATEGORIES.map((cat) => (
								<MenuItem key={cat} value={cat}>
									{cat}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>

				<FormControl size="small" sx={{ minWidth: 150 }}>
					<InputLabel>Težina</InputLabel>
					<Select
						value={filterDifficulty}
						label="Težina"
						onChange={(e) => setFilterDifficulty(e.target.value)}
					>
						<MenuItem value="all">Sve</MenuItem>
						<MenuItem value="Easy">Easy</MenuItem>
						<MenuItem value="Intermediate">Intermediate</MenuItem>
						<MenuItem value="Advanced">Advanced</MenuItem>
					</Select>
				</FormControl>

				<FormControl size="small" sx={{ minWidth: 150 }}>
					<InputLabel>Status</InputLabel>
					<Select
						value={filterCompleted}
						label="Status"
						onChange={(e) => setFilterCompleted(e.target.value)}
					>
						<MenuItem value="all">Svi</MenuItem>
						<MenuItem value="active">Aktivni</MenuItem>
						<MenuItem value="completed">Ostvareni</MenuItem>
					</Select>
				</FormControl> */}

				<Button
					variant="contained"
					startIcon={<AddOutlined />}
					onClick={() => handleOpenDialog()}
					size="large"
					sx={{
						ml: "auto",
						borderRadius: 2,
						px: 3,
						py: 1.5,
						boxShadow: 2,
						"&:hover": {
							boxShadow: 4,
						},
					}}
				>
					Dodaj Cilj
				</Button>
			</Box>

			<Grid container spacing={3}>
				{filteredGoals.length === 0 ? (
					<Grid size={{ xs: 12 }}>
						<Card
							sx={{
								borderRadius: 3,
								boxShadow: 0,
								border: "1px solid",
								borderColor: "divider",
								py: 4,
							}}
						>
							<CardContent>
								<Box sx={{ textAlign: "center" }}>
									<EmojiEventsOutlined
										sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
									/>
									<Typography variant="h6" color="text.secondary" gutterBottom>
										Nema ciljeva za prikaz
									</Typography>
									<Typography variant="body2" color="text.disabled">
										Dodajte svoj prvi cilj i počnite praćenje napretka
									</Typography>
								</Box>
							</CardContent>
						</Card>
					</Grid>
				) : (
					filteredGoals.map((goal) => (
						<Grid size={{ xs: 12, sm: 6, md: 4 }} key={goal._id}>
							<Card
								sx={{
									height: "100%",
									display: "flex",
									flexDirection: "column",
									borderRadius: 3,
									boxShadow: goal.completed ? 1 : 2,
									border: "1px solid",
									borderColor: goal.completed ? "success.light" : "divider",
									position: "relative",
									cursor: onGoalClick ? "pointer" : "default",
									transition: "all 0.3s ease",
									"&:hover": {
										transform: onGoalClick ? "translateY(-4px)" : "none",
										boxShadow: goal.completed ? 2 : 4,
									},
								}}
								onClick={() => onGoalClick && onGoalClick(goal)}
							>
								{goal.completed && (
									<Box
										sx={{
											position: "absolute",
											top: 12,
											left: 12,
											zIndex: 2,
											bgcolor: "success.main",
											color: "white",
											borderRadius: 2,
											px: 1.5,
											py: 0.5,
											display: "flex",
											alignItems: "center",
											gap: 0.5,
											boxShadow: 2,
										}}
									>
										<EmojiEventsOutlined sx={{ fontSize: 18 }} />
										<Typography variant="caption" fontWeight="600">
											Ostvareno
										</Typography>
									</Box>
								)}

								{goal.images && goal.images.length > 0 && (
									<Box
										sx={{
											position: "relative",
											width: "100%",
											height: 220,
											overflow: "hidden",
											borderRadius: "12px 12px 0 0",
											bgcolor: "grey.100",
										}}
									>
										{isVideo(goal.images[0]) ? (
											<Box
												sx={{
													position: "relative",
													width: "100%",
													height: "100%",
												}}
											>
												<video
													src={goal.images[0]}
													style={{
														width: "100%",
														height: "100%",
														objectFit: "cover",
													}}
												/>
												<PlayCircleOutlined
													sx={{
														position: "absolute",
														top: "50%",
														left: "50%",
														transform: "translate(-50%, -50%)",
														fontSize: 64,
														color: "white",
														opacity: 0.9,
														filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
													}}
												/>
											</Box>
										) : (
											<Image
												src={goal.images[0]}
												alt={goal.title}
												fill
												style={{
													objectFit: "cover",
												}}
											/>
										)}
										{goal.images.length > 1 && (
											<Chip
												label={`+${goal.images.length - 1}`}
												size="small"
												sx={{
													position: "absolute",
													bottom: 12,
													right: 12,
													bgcolor: "rgba(0,0,0,0.7)",
													color: "white",
													fontWeight: 600,
													backdropFilter: "blur(4px)",
												}}
											/>
										)}
									</Box>
								)}

								<CardContent sx={{ flexGrow: 1, p: 2.5 }}>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "start",
											mb: 2,
											gap: 1,
										}}
									>
										<Typography
											variant="h6"
											component="div"
											sx={{
												flex: 1,
												fontWeight: 600,
												fontSize: "1.1rem",
												lineHeight: 1.3,
											}}
										>
											{goal.title}
										</Typography>
										<IconButton
											size="medium"
											onClick={(e) => {
												e.stopPropagation();
												handleToggleComplete(goal);
											}}
											sx={{
												color: goal.completed
													? "success.main"
													: "action.disabled",
												"&:hover": {
													bgcolor: goal.completed
														? "success.lighter"
														: "action.hover",
												},
											}}
										>
											{goal.completed ? (
												<CheckCircleOutlined sx={{ fontSize: 28 }} />
											) : (
												<RadioButtonUncheckedOutlined sx={{ fontSize: 28 }} />
											)}
										</IconButton>
									</Box>

									<Box
										sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}
									>
										<Chip
											label={goal.difficulty}
											color={getDifficultyColor(goal.difficulty)}
											size="small"
											sx={{
												fontWeight: 600,
												borderRadius: 1.5,
											}}
										/>
										<Chip
											label={goal.category}
											size="small"
											variant="outlined"
											sx={{
												fontWeight: 500,
												borderRadius: 1.5,
											}}
										/>
									</Box>

									{goal.description && (
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{
												mb: 2,
												lineHeight: 1.6,
												display: "-webkit-box",
												WebkitLineClamp: 2,
												WebkitBoxOrient: "vertical",
												overflow: "hidden",
											}}
										>
											{goal.description}
										</Typography>
									)}

									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
											gap: 1,
											pt: 1,
											borderTop: "1px solid",
											borderColor: "divider",
										}}
									>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<CalendarTodayOutlined
												sx={{ fontSize: 16, color: "text.secondary" }}
											/>
											<Typography
												variant="caption"
												color="text.secondary"
												fontWeight={500}
											>
												Početak:{" "}
												{new Date(goal.startDate).toLocaleDateString("sr-RS")}
											</Typography>
										</Box>

										{goal.updates && goal.updates.length > 0 && (
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 0.5,
												}}
											>
												<TrendingUpOutlined
													sx={{ fontSize: 16, color: "primary.main" }}
												/>
												<Typography
													variant="caption"
													color="primary.main"
													fontWeight={600}
												>
													{goal.updates.length} update
													{goal.updates.length !== 1 ? "a" : ""}
												</Typography>
											</Box>
										)}

										{goal.completed && goal.completedAt && (
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<EmojiEventsOutlined
													sx={{ fontSize: 16, color: "success.main" }}
												/>
												<Typography
													variant="caption"
													color="success.main"
													fontWeight={600}
												>
													Ostvareno:{" "}
													{new Date(goal.completedAt).toLocaleDateString(
														"sr-RS"
													)}
												</Typography>
											</Box>
										)}
									</Box>
								</CardContent>

								<Box
									sx={{
										px: 2,
										pb: 2,
										display: "flex",
										gap: 1,
										borderTop: "1px solid",
										borderColor: "divider",
										pt: 1.5,
									}}
									onClick={(e) => e.stopPropagation()}
								>
									<IconButton
										size="small"
										onClick={() => handleOpenDialog(goal)}
										sx={{
											color: "primary.main",
											"&:hover": {
												bgcolor: "primary.lighter",
											},
										}}
									>
										<EditOutlined />
									</IconButton>
									<IconButton
										size="small"
										onClick={() => handleDelete(goal._id)}
										sx={{
											color: "error.main",
											"&:hover": {
												bgcolor: "error.lighter",
											},
										}}
									>
										<DeleteOutlined />
									</IconButton>
								</Box>
							</Card>
						</Grid>
					))
				)}
			</Grid>

			<Dialog
				open={openDialog}
				onClose={handleCloseDialog}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 3,
					},
				}}
			>
				<DialogTitle sx={{ pb: 1, fontSize: "1.5rem", fontWeight: 600 }}>
					{editingGoal ? "Izmeni Cilj" : "Dodaj Novi Cilj"}
				</DialogTitle>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
							{error}
						</Alert>
					)}

					<Box sx={{ pt: 2 }}>
						<Grid container spacing={2.5}>
							<Grid size={{ xs: 12 }}>
								<TextField
									autoFocus
									fullWidth
									label="Naziv cilja *"
									type="text"
									variant="outlined"
									value={formData.title}
									onChange={(e) =>
										setFormData({ ...formData, title: e.target.value })
									}
									placeholder="npr. Dodaj 20kg na bench press"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: 2,
										},
									}}
								/>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<Typography
									variant="body2"
									fontWeight={500}
									sx={{ mb: 1.5, color: "text.secondary" }}
								>
									Kategorija *
								</Typography>
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
									{CATEGORIES.map((cat) => (
										<Chip
											key={cat}
											label={cat}
											onClick={() =>
												setFormData({ ...formData, category: cat })
											}
											color={formData.category === cat ? "primary" : "default"}
											variant={
												formData.category === cat ? "filled" : "outlined"
											}
											sx={{
												borderRadius: 2,
												fontWeight: formData.category === cat ? 600 : 500,
												cursor: "pointer",
												"&:hover": {
													bgcolor:
														formData.category === cat
															? "primary.dark"
															: "action.hover",
												},
											}}
										/>
									))}
								</Box>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<FormControl fullWidth variant="outlined">
									<InputLabel>Težina</InputLabel>
									<Select
										value={formData.difficulty}
										onChange={(e) =>
											setFormData({
												...formData,
												difficulty: e.target.value as
													| "Easy"
													| "Intermediate"
													| "Advanced",
											})
										}
										label="Težina"
										sx={{
											borderRadius: 2,
										}}
									>
										<MenuItem value="Easy">Easy</MenuItem>
										<MenuItem value="Intermediate">Intermediate</MenuItem>
										<MenuItem value="Advanced">Advanced</MenuItem>
									</Select>
								</FormControl>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="date"
									label="Datum početka"
									value={formData.startDate}
									onChange={(e) =>
										setFormData({ ...formData, startDate: e.target.value })
									}
									InputLabelProps={{ shrink: true }}
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: 2,
										},
									}}
								/>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<TextField
									fullWidth
									multiline
									rows={3}
									label="Opis (opciono)"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Dodaj detalje o svom cilju..."
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: 2,
										},
									}}
								/>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<UploadImageBox
									onUploadSuccess={handleMediaUpload}
									endpoint="/api/goals-photos"
									label="Dodaj slike ili video"
									maxSizeMB={50}
									multiple={true}
									acceptedFormats="image/*,video/*"
									existingImages={formData.images}
									onRemoveImage={handleRemoveMedia}
								/>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ mt: 1.5, display: "block" }}
								>
									Dozvoljeni formati: JPG, PNG, GIF, WebP, MP4, MOV, AVI, WebM
									(max 10MB za slike, 50MB za video)
								</Typography>
							</Grid>
						</Grid>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
					<Button
						onClick={handleCloseDialog}
						sx={{
							borderRadius: 2,
							px: 3,
						}}
					>
						Otkaži
					</Button>
					<Button
						onClick={handleSubmit}
						variant="contained"
						size="large"
						sx={{
							borderRadius: 2,
							px: 4,
							boxShadow: 2,
							"&:hover": {
								boxShadow: 3,
							},
						}}
					>
						{editingGoal ? "Sačuvaj" : "Dodaj Cilj"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default GoalManager;
