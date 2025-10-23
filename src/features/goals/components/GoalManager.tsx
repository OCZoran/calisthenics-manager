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
	LinearProgress,
	Tooltip,
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
	ImageOutlined,
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
					filteredGoals.map((goal) => {
						const progressUpdates =
							goal.updates?.filter((u) => u.status === "progress").length || 0;
						const totalUpdates = goal.updates?.length || 0;
						const progressPercentage =
							totalUpdates > 0 ? (progressUpdates / totalUpdates) * 100 : 0;

						const daysSinceStart = Math.floor(
							(new Date().getTime() - new Date(goal.startDate).getTime()) /
								(1000 * 60 * 60 * 24)
						);

						const getDifficultyLabel = (diff: string) => {
							switch (diff) {
								case "Easy":
									return "Lako";
								case "Intermediate":
									return "Srednje";
								case "Advanced":
									return "Napredno";
								default:
									return diff;
							}
						};

						const getDifficultyStyle = (diff: string) => {
							switch (diff) {
								case "Easy":
									return { bg: "#e8f5e9", text: "#2e7d32" };
								case "Intermediate":
									return { bg: "#fff3e0", text: "#e65100" };
								case "Advanced":
									return { bg: "#ffebee", text: "#c62828" };
								default:
									return { bg: "#e8f5e9", text: "#2e7d32" };
							}
						};

						const diffStyle = getDifficultyStyle(goal.difficulty);

						return (
							<Grid size={{ xs: 12, sm: 6, md: 4 }} key={goal._id}>
								<Card
									sx={{
										height: "100%",
										display: "flex",
										flexDirection: "column",
										borderRadius: 3,
										boxShadow: goal.completed
											? "0 2px 8px rgba(76, 175, 80, 0.12)"
											: "0 2px 8px rgba(0,0,0,0.06)",
										border: "1px solid",
										borderColor: goal.completed ? "success.light" : "grey.200",
										overflow: "hidden",
										cursor: onGoalClick ? "pointer" : "default",
										transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
										position: "relative",
										"&:hover": {
											transform: onGoalClick ? "translateY(-4px)" : "none",
											boxShadow: goal.completed
												? "0 8px 20px rgba(76, 175, 80, 0.2)"
												: "0 8px 20px rgba(0,0,0,0.1)",
											borderColor: goal.completed
												? "success.main"
												: "primary.light",
										},
										"&:active": {
											transform: onGoalClick ? "translateY(-2px)" : "none",
										},
									}}
									onClick={() => onGoalClick && onGoalClick(goal)}
								>
									{/* Hero Image Section */}
									{goal.images && goal.images.length > 0 && (
										<Box
											sx={{
												position: "relative",
												width: "100%",
												height: 220,
												overflow: "hidden",
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
													<Box
														sx={{
															position: "absolute",
															inset: 0,
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															bgcolor: "rgba(0,0,0,0.25)",
															transition: "background-color 0.2s",
															"&:hover": {
																bgcolor: "rgba(0,0,0,0.35)",
															},
														}}
													>
														<PlayCircleOutlined
															sx={{
																fontSize: 56,
																color: "white",
																opacity: 0.95,
																filter:
																	"drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
																transition: "transform 0.2s",
																"&:hover": {
																	transform: "scale(1.1)",
																},
															}}
														/>
													</Box>
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

											{/* Media Count Badge */}
											{goal.images.length > 1 && (
												<Chip
													icon={<ImageOutlined sx={{ fontSize: 16 }} />}
													label={goal.images.length}
													size="small"
													sx={{
														position: "absolute",
														bottom: 12,
														right: 12,
														bgcolor: "rgba(0,0,0,0.7)",
														color: "white",
														fontWeight: 600,
														fontSize: "0.75rem",
														backdropFilter: "blur(12px)",
														border: "1px solid rgba(255,255,255,0.15)",
														"& .MuiChip-icon": {
															color: "white",
														},
													}}
												/>
											)}

											{/* Completed Badge */}
											{goal.completed && (
												<Box
													sx={{
														position: "absolute",
														top: 12,
														left: 12,
														bgcolor: "success.main",
														color: "white",
														borderRadius: 2,
														px: 1.5,
														py: 0.5,
														display: "flex",
														alignItems: "center",
														gap: 0.5,
														boxShadow: "0 2px 8px rgba(76, 175, 80, 0.35)",
														fontWeight: 700,
														fontSize: "0.813rem",
													}}
												>
													<EmojiEventsOutlined sx={{ fontSize: 18 }} />
													Ostvareno
												</Box>
											)}

											{/* Subtle Gradient Overlay */}
											<Box
												sx={{
													position: "absolute",
													bottom: 0,
													left: 0,
													right: 0,
													height: "40%",
													background:
														"linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
													pointerEvents: "none",
												}}
											/>
										</Box>
									)}

									<CardContent sx={{ flexGrow: 1, p: 2.5 }}>
										{/* Header with Title and Completion Toggle */}
										<Box sx={{ mb: 2 }}>
											<Box
												sx={{
													display: "flex",
													gap: 1.5,
													alignItems: "flex-start",
												}}
											>
												<Tooltip
													title={
														goal.completed
															? "Označi kao nedovršeno"
															: "Označi kao ostvareno"
													}
													arrow
													placement="top"
												>
													<IconButton
														size="large"
														onClick={(e) => {
															e.stopPropagation();
															handleToggleComplete(goal);
														}}
														sx={{
															color: goal.completed
																? "success.main"
																: "grey.400",
															p: 0,
															"&:hover": {
																bgcolor: goal.completed
																	? "rgba(76, 175, 80, 0.08)"
																	: "rgba(0,0,0,0.04)",
																color: goal.completed
																	? "success.dark"
																	: "grey.600",
															},
															transition: "all 0.2s",
														}}
													>
														{goal.completed ? (
															<CheckCircleOutlined sx={{ fontSize: 28 }} />
														) : (
															<RadioButtonUncheckedOutlined
																sx={{ fontSize: 28 }}
															/>
														)}
													</IconButton>
												</Tooltip>

												<Box sx={{ flex: 1, minWidth: 0 }}>
													<Typography
														variant="h6"
														sx={{
															fontWeight: 700,
															fontSize: "1.125rem",
															lineHeight: 1.4,
															mb: 1,
															color: "text.primary",
															overflow: "hidden",
															textOverflow: "ellipsis",
															display: "-webkit-box",
															WebkitLineClamp: 2,
															WebkitBoxOrient: "vertical",
														}}
													>
														{goal.title}
													</Typography>

													<Box
														sx={{
															display: "flex",
															gap: 0.75,
															flexWrap: "wrap",
														}}
													>
														<Chip
															label={getDifficultyLabel(goal.difficulty)}
															size="small"
															sx={{
																bgcolor: diffStyle.bg,
																color: diffStyle.text,
																fontWeight: 700,
																fontSize: "0.688rem",
																height: 22,
																borderRadius: 1.5,
																"& .MuiChip-label": {
																	px: 1,
																},
															}}
														/>
														<Chip
															label={goal.category}
															size="small"
															sx={{
																bgcolor: "grey.100",
																color: "text.secondary",
																fontWeight: 600,
																fontSize: "0.688rem",
																height: 22,
																borderRadius: 1.5,
																"& .MuiChip-label": {
																	px: 1,
																},
															}}
														/>
													</Box>
												</Box>
											</Box>
										</Box>

										{/* Description */}
										{goal.description && (
											<Typography
												variant="body2"
												sx={{
													color: "text.secondary",
													lineHeight: 1.6,
													mb: 2,
													display: "-webkit-box",
													WebkitLineClamp: 2,
													WebkitBoxOrient: "vertical",
													overflow: "hidden",
												}}
											>
												{goal.description}
											</Typography>
										)}

										{/* Progress Section */}
										{totalUpdates > 0 && (
											<Box
												sx={{
													mb: 2,
													p: 1.5,
													bgcolor: "grey.50",
													borderRadius: 2,
													border: "1px solid",
													borderColor: "grey.200",
												}}
											>
												<Box
													sx={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
														mb: 1,
													}}
												>
													<Typography
														variant="caption"
														fontWeight={600}
														color="text.secondary"
													>
														Napredak
													</Typography>
													<Typography
														variant="caption"
														fontWeight={700}
														color="primary.main"
													>
														{progressUpdates}/{totalUpdates}
													</Typography>
												</Box>
												<LinearProgress
													variant="determinate"
													value={progressPercentage}
													sx={{
														height: 6,
														borderRadius: 3,
														bgcolor: "grey.200",
														"& .MuiLinearProgress-bar": {
															borderRadius: 3,
															background:
																"linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
														},
													}}
												/>
											</Box>
										)}

										{/* Info Grid */}
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												gap: 1.25,
											}}
										>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1.25,
												}}
											>
												<Box
													sx={{
														bgcolor: "primary.lighter",
														width: 32,
														height: 32,
														borderRadius: "50%",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														flexShrink: 0,
													}}
												>
													<CalendarTodayOutlined
														sx={{ fontSize: 16, color: "primary.main" }}
													/>
												</Box>
												<Box sx={{ minWidth: 0 }}>
													<Typography
														variant="caption"
														color="text.secondary"
														fontWeight={500}
														display="block"
														sx={{ lineHeight: 1.2 }}
													>
														Započeto
													</Typography>
													<Typography
														variant="body2"
														fontWeight={600}
														color="text.primary"
														sx={{ fontSize: "0.875rem" }}
													>
														{new Date(goal.startDate).toLocaleDateString(
															"sr-RS",
															{
																day: "numeric",
																month: "short",
																year: "numeric",
															}
														)}{" "}
														• {daysSinceStart} dana
													</Typography>
												</Box>
											</Box>

											{goal.updates && goal.updates.length > 0 && (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1.25,
													}}
												>
													<Box
														sx={{
															bgcolor: "info.lighter",
															width: 32,
															height: 32,
															borderRadius: "50%",
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															flexShrink: 0,
														}}
													>
														<TrendingUpOutlined
															sx={{ fontSize: 16, color: "info.main" }}
														/>
													</Box>
													<Box sx={{ minWidth: 0 }}>
														<Typography
															variant="caption"
															color="text.secondary"
															fontWeight={500}
															display="block"
															sx={{ lineHeight: 1.2 }}
														>
															Update-a
														</Typography>
														<Typography
															variant="body2"
															fontWeight={600}
															color="text.primary"
															sx={{ fontSize: "0.875rem" }}
														>
															{totalUpdates}{" "}
															{totalUpdates === 1 ? "update" : "update-a"}
														</Typography>
													</Box>
												</Box>
											)}

											{goal.completed && goal.completedAt && (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1.25,
													}}
												>
													<Box
														sx={{
															bgcolor: "success.lighter",
															width: 32,
															height: 32,
															borderRadius: "50%",
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															flexShrink: 0,
														}}
													>
														<EmojiEventsOutlined
															sx={{ fontSize: 16, color: "success.main" }}
														/>
													</Box>
													<Box sx={{ minWidth: 0 }}>
														<Typography
															variant="caption"
															color="text.secondary"
															fontWeight={500}
															display="block"
															sx={{ lineHeight: 1.2 }}
														>
															Ostvareno
														</Typography>
														<Typography
															variant="body2"
															fontWeight={600}
															color="success.main"
															sx={{ fontSize: "0.875rem" }}
														>
															{new Date(goal.completedAt).toLocaleDateString(
																"sr-RS",
																{
																	day: "numeric",
																	month: "short",
																	year: "numeric",
																}
															)}
														</Typography>
													</Box>
												</Box>
											)}
										</Box>
									</CardContent>

									{/* Action Buttons */}
									<Box
										sx={{
											px: 2.5,
											pb: 2.5,
											pt: 2,
											display: "flex",
											gap: 1,
											borderTop: "1px solid",
											borderColor: "divider",
										}}
										onClick={(e) => e.stopPropagation()}
									>
										<Tooltip title="Uredi cilj" arrow>
											<IconButton
												size="small"
												onClick={() => handleOpenDialog(goal)}
												sx={{
													bgcolor: "primary.lighter",
													color: "primary.main",
													width: 36,
													height: 36,
													"&:hover": {
														bgcolor: "primary.light",
														color: "primary.dark",
													},
													transition: "all 0.2s",
												}}
											>
												<EditOutlined sx={{ fontSize: 18 }} />
											</IconButton>
										</Tooltip>
										<Tooltip title="Obriši cilj" arrow>
											<IconButton
												size="small"
												onClick={() => handleDelete(goal._id)}
												sx={{
													bgcolor: "error.lighter",
													color: "error.main",
													width: 36,
													height: 36,
													"&:hover": {
														bgcolor: "error.light",
														color: "error.dark",
													},
													transition: "all 0.2s",
												}}
											>
												<DeleteOutlined sx={{ fontSize: 18 }} />
											</IconButton>
										</Tooltip>
									</Box>
								</Card>
							</Grid>
						);
					})
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
