"use client";

import React, { useState } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Grid,
	Chip,
	IconButton,
	Alert,
	Rating,
	ImageList,
	ImageListItem,
	LinearProgress,
	Divider,
	Paper,
	Stack,
	Avatar,
} from "@mui/material";
import {
	ArrowBack,
	AddPhotoAlternate,
	DeleteOutlined,
	TrendingUp,
	TrendingDown,
	Remove,
	SentimentVeryDissatisfied,
	SentimentDissatisfied,
	SentimentNeutral,
	SentimentSatisfied,
	SentimentVerySatisfied,
	FlagOutlined,
	PlayCircleOutlined,
	CalendarToday,
	Update as UpdateIcon,
	EmojiEvents,
} from "@mui/icons-material";
import { Goal } from "../goal.interface";
import UploadImageBox from "@/features/workouts/components/UploadImageBox";
import Image from "next/image";

interface GoalDetailProps {
	goal: Goal;
	onBack: () => void;
	onGoalUpdated: (goal: Goal) => void;
}

const customIcons: {
	[index: number]: {
		icon: React.ReactElement;
		label: string;
	};
} = {
	1: {
		icon: <SentimentVeryDissatisfied />,
		label: "Vrlo loše",
	},
	2: {
		icon: <SentimentDissatisfied />,
		label: "Loše",
	},
	3: {
		icon: <SentimentNeutral />,
		label: "Neutralno",
	},
	4: {
		icon: <SentimentSatisfied />,
		label: "Dobro",
	},
	5: {
		icon: <SentimentVerySatisfied />,
		label: "Odlično",
	},
};

function IconContainer(props: { value: number }) {
	const { value, ...other } = props;
	return <span {...other}>{customIcons[value]?.icon}</span>;
}

// const getStatusColor = (status: string) => {
// 	switch (status) {
// 		case "progress":
// 			return "success";
// 		case "regress":
// 			return "error";
// 		default:
// 			return "default";
// 	}
// };

const isVideo = (url: string) => {
	return url.match(/\.(mp4|mov|avi|webm)$/i);
};

const GoalDetail: React.FC<GoalDetailProps> = ({
	goal,
	onBack,
	onGoalUpdated,
}) => {
	const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
	const [openMediaDialog, setOpenMediaDialog] = useState(false);
	const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
	const [updateForm, setUpdateForm] = useState({
		notes: "",
		status: "neutral" as "progress" | "neutral" | "regress",
		feeling: 3,
		images: [] as string[],
	});
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleOpenUpdateDialog = () => {
		setUpdateForm({
			notes: "",
			status: "neutral",
			feeling: 3,
			images: [],
		});
		setOpenUpdateDialog(true);
		setError(null);
	};

	const handleCloseUpdateDialog = () => {
		setOpenUpdateDialog(false);
		setUpdateForm({
			notes: "",
			status: "neutral",
			feeling: 3,
			images: [],
		});
		setError(null);
	};

	const handlePhotosUpload = (urls: string[]) => {
		setUpdateForm((prev) => ({
			...prev,
			images: [...prev.images, ...urls],
		}));
	};

	const handleRemovePhoto = (url: string) => {
		setUpdateForm((prev) => ({
			...prev,
			images: prev.images.filter((img) => img !== url),
		}));
	};

	const handleSubmitUpdate = async () => {
		try {
			setIsSubmitting(true);
			setError(null);

			const response = await fetch("/api/goals/updates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					goalId: goal._id,
					...updateForm,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Greška pri dodavanju update-a");
			}

			const goalResponse = await fetch(`/api/goals?id=${goal._id}`);
			if (goalResponse.ok) {
				const updatedGoalData = await goalResponse.json();
				onGoalUpdated(updatedGoalData[0]);
			}

			handleCloseUpdateDialog();
		} catch (error) {
			console.error("Error adding update:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri dodavanju update-a"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteUpdate = async (updateId: string) => {
		if (!confirm("Da li ste sigurni da želite obrisati ovaj update?")) return;

		try {
			const response = await fetch(
				`/api/goals/updates?goalId=${goal._id}&updateId=${updateId}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				throw new Error("Greška pri brisanju update-a");
			}

			const goalResponse = await fetch(`/api/goals?id=${goal._id}`);
			if (goalResponse.ok) {
				const updatedGoalData = await goalResponse.json();
				onGoalUpdated(updatedGoalData[0]);
			}
		} catch (error) {
			console.error("Error deleting update:", error);
			alert("Greška pri brisanju update-a");
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "progress":
				return <TrendingUp />;
			case "regress":
				return <TrendingDown />;
			default:
				return <Remove />;
		}
	};

	const handleOpenMediaDialog = (images: string[]) => {
		setSelectedMedia(images);
		setOpenMediaDialog(true);
	};

	const progressUpdates =
		goal.updates?.filter((u) => u.status === "progress").length || 0;
	const totalUpdates = goal.updates?.length || 0;

	const timelineItems = [
		{
			type: "start",
			date: goal.createdAt,
			title: "Početak cilja",
			description: goal.description,
			images: goal.images || [],
			icon: <FlagOutlined />,
			status: "neutral",
		},
		...(goal.updates || []).map((update) => ({
			type: "update",
			date: update.date,
			title:
				update.status === "progress"
					? "Napredak"
					: update.status === "regress"
					? "Nazadovanje"
					: "Neutralno",
			description: update.notes,
			images: update.images || [],
			icon: getStatusIcon(update.status),
			status: update.status,
			feeling: update.feeling,
			updateId: update.id,
		})),
	].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return (
		<Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, sm: 3 } }}>
			<Button
				startIcon={<ArrowBack />}
				onClick={onBack}
				sx={{ mb: 3, fontWeight: 500 }}
			>
				Nazad na ciljeve
			</Button>

			{/* Header Card */}
			<Card
				elevation={0}
				sx={{
					mb: 4,
					borderRadius: 4,
					background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
					color: "white",
					overflow: "visible",
				}}
			>
				<CardContent sx={{ p: { xs: 3, sm: 4 } }}>
					<Stack spacing={3}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "flex-start",
								flexWrap: "wrap",
								gap: 2,
							}}
						>
							<Box sx={{ flex: 1 }}>
								<Typography
									variant="h3"
									fontWeight="700"
									gutterBottom
									sx={{ fontSize: { xs: "1.75rem", sm: "2.5rem" } }}
								>
									{goal.title}
								</Typography>
								<Stack
									direction="row"
									spacing={1}
									flexWrap="wrap"
									sx={{ mt: 2 }}
								>
									<Chip
										label={goal.category}
										sx={{
											bgcolor: "rgba(255,255,255,0.2)",
											color: "white",
											fontWeight: 600,
										}}
									/>
									<Chip
										label={goal.difficulty}
										sx={{
											bgcolor: "rgba(255,255,255,0.2)",
											color: "white",
											fontWeight: 600,
										}}
									/>
									{goal.completed && (
										<Chip
											icon={<EmojiEvents sx={{ color: "white !important" }} />}
											label="Ostvareno"
											sx={{
												bgcolor: "rgba(255,255,255,0.3)",
												color: "white",
												fontWeight: 600,
											}}
										/>
									)}
								</Stack>
							</Box>
							<Button
								variant="contained"
								startIcon={<AddPhotoAlternate />}
								onClick={handleOpenUpdateDialog}
								disabled={goal.completed}
								size="large"
								sx={{
									borderRadius: 3,
									bgcolor: "white",
									color: "primary.main",
									px: 3,
									py: 1.5,
									fontWeight: 600,
									boxShadow: 3,
									"&:hover": {
										bgcolor: "rgba(255,255,255,0.9)",
										transform: "translateY(-2px)",
										boxShadow: 4,
									},
									transition: "all 0.2s",
								}}
							>
								Dodaj Update
							</Button>
						</Box>

						{goal.description && (
							<Typography
								variant="body1"
								sx={{ opacity: 0.95, fontSize: "1.1rem" }}
							>
								{goal.description}
							</Typography>
						)}
					</Stack>
				</CardContent>
			</Card>

			{/* Stats Grid */}
			<Grid container spacing={2} sx={{ mb: 4 }}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							borderRadius: 3,
							bgcolor: "background.paper",
							border: "1px solid",
							borderColor: "divider",
							height: "100%",
						}}
					>
						<Stack direction="row" spacing={2} alignItems="center">
							<Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
								<CalendarToday />
							</Avatar>
							<Box>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={500}
								>
									Početak
								</Typography>
								<Typography variant="h6" fontWeight="600">
									{new Date(goal.startDate).toLocaleDateString("sr-RS", {
										day: "numeric",
										month: "short",
									})}
								</Typography>
							</Box>
						</Stack>
					</Paper>
				</Grid>

				{goal.completedAt && (
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Paper
							elevation={0}
							sx={{
								p: 3,
								borderRadius: 3,
								bgcolor: "success.lighter",
								border: "1px solid",
								borderColor: "success.light",
								height: "100%",
							}}
						>
							<Stack direction="row" spacing={2} alignItems="center">
								<Avatar sx={{ bgcolor: "success.main", width: 48, height: 48 }}>
									<EmojiEvents />
								</Avatar>
								<Box>
									<Typography
										variant="caption"
										color="text.secondary"
										fontWeight={500}
									>
										Ostvareno
									</Typography>
									<Typography
										variant="h6"
										fontWeight="600"
										color="success.dark"
									>
										{new Date(goal.completedAt).toLocaleDateString("sr-RS", {
											day: "numeric",
											month: "short",
										})}
									</Typography>
								</Box>
							</Stack>
						</Paper>
					</Grid>
				)}

				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							borderRadius: 3,
							bgcolor: "background.paper",
							border: "1px solid",
							borderColor: "divider",
							height: "100%",
						}}
					>
						<Stack direction="row" spacing={2} alignItems="center">
							<Avatar sx={{ bgcolor: "info.main", width: 48, height: 48 }}>
								<UpdateIcon />
							</Avatar>
							<Box>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={500}
								>
									Update-a
								</Typography>
								<Typography variant="h6" fontWeight="600">
									{totalUpdates}
								</Typography>
							</Box>
						</Stack>
					</Paper>
				</Grid>

				{totalUpdates > 0 && (
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Paper
							elevation={0}
							sx={{
								p: 3,
								borderRadius: 3,
								bgcolor: "background.paper",
								border: "1px solid",
								borderColor: "divider",
								height: "100%",
							}}
						>
							<Stack spacing={1}>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={500}
								>
									Progres
								</Typography>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
									<LinearProgress
										variant="determinate"
										value={(progressUpdates / totalUpdates) * 100}
										sx={{
											flexGrow: 1,
											height: 10,
											borderRadius: 5,
											bgcolor: "action.hover",
										}}
									/>
									<Typography
										variant="body2"
										fontWeight="600"
										sx={{ minWidth: 45 }}
									>
										{Math.round((progressUpdates / totalUpdates) * 100)}%
									</Typography>
								</Box>
								<Typography variant="caption" color="text.secondary">
									{progressUpdates} od {totalUpdates} napredaka
								</Typography>
							</Stack>
						</Paper>
					</Grid>
				)}
			</Grid>

			{/* Timeline */}
			<Typography variant="h5" fontWeight="600" sx={{ mb: 3 }}>
				Timeline
			</Typography>

			{timelineItems.length === 0 ? (
				<Paper
					elevation={0}
					sx={{
						p: 6,
						borderRadius: 3,
						border: "2px dashed",
						borderColor: "divider",
						textAlign: "center",
					}}
				>
					<UpdateIcon sx={{ fontSize: 64, color: "action.disabled", mb: 2 }} />
					<Typography color="text.secondary" variant="h6">
						Još uvijek nema update-a za ovaj cilj
					</Typography>
					<Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
						Klikni na Dodaj Update da započneš praćenje progresa
					</Typography>
				</Paper>
			) : (
				<Box sx={{ position: "relative" }}>
					{/* Timeline line */}
					<Box
						sx={{
							position: "absolute",
							left: { xs: 20, md: 28 },
							top: 60,
							bottom: 0,
							width: 3,
							bgcolor: "divider",
							borderRadius: 2,
						}}
					/>

					<Stack spacing={3}>
						{timelineItems.map((item, index) => (
							<Box
								key={`${item.type}-${index}`}
								sx={{ position: "relative", pl: { xs: 8, md: 10 } }}
							>
								{/* Timeline dot */}
								<Avatar
									sx={{
										position: "absolute",
										left: { xs: 0, md: 8 },
										top: 20,
										width: 56,
										height: 56,
										bgcolor:
											item.type === "start"
												? "primary.main"
												: item.status === "progress"
												? "success.main"
												: item.status === "regress"
												? "error.main"
												: "grey.400",
										boxShadow: 3,
										zIndex: 1,
									}}
								>
									{item.icon}
								</Avatar>

								<Paper
									elevation={0}
									sx={{
										p: 3,
										borderRadius: 3,
										border: "1px solid",
										borderColor: "divider",
										transition: "all 0.2s",
										"&:hover": {
											borderColor:
												item.status === "progress"
													? "success.main"
													: item.status === "regress"
													? "error.main"
													: "primary.main",
											boxShadow: 2,
										},
									}}
								>
									<Stack spacing={2}>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "start",
												gap: 2,
											}}
										>
											<Box sx={{ flex: 1 }}>
												<Typography variant="h6" fontWeight="600" gutterBottom>
													{item.title}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													{new Date(item.date).toLocaleDateString("sr-RS", {
														day: "numeric",
														month: "long",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</Typography>
											</Box>
											{item.type === "update" &&
												"updateId" in item &&
												item.updateId && (
													<IconButton
														size="small"
														onClick={() => handleDeleteUpdate(item.updateId)}
														sx={{
															color: "error.main",
															"&:hover": { bgcolor: "error.lighter" },
														}}
													>
														<DeleteOutlined />
													</IconButton>
												)}
										</Box>

										{item.description && (
											<Typography variant="body1" color="text.secondary">
												{item.description}
											</Typography>
										)}

										{"feeling" in item && item.feeling !== undefined && (
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<Typography
													variant="body2"
													color="text.secondary"
													fontWeight={500}
												>
													Osjećaj:
												</Typography>
												<Rating
													value={item.feeling}
													readOnly
													IconContainerComponent={IconContainer}
													highlightSelectedOnly
													size="small"
												/>
												<Typography variant="caption" color="text.secondary">
													({customIcons[item.feeling]?.label})
												</Typography>
											</Box>
										)}

										{item.images && item.images.length > 0 && (
											<Box>
												<Divider sx={{ my: 2 }} />
												<Typography
													variant="subtitle2"
													color="text.secondary"
													sx={{ mb: 1.5, fontWeight: 600 }}
												>
													Mediji ({item.images.length})
												</Typography>
												<ImageList
													cols={Math.min(item.images.length, 4)}
													gap={6}
													sx={{
														cursor: "pointer",
														m: 0,
														maxHeight: 120,
													}}
												>
													{item.images.slice(0, 4).map((img, idx) => (
														<ImageListItem
															key={idx}
															onClick={() => handleOpenMediaDialog(item.images)}
															sx={{
																position: "relative",
																overflow: "hidden",
																borderRadius: 1.5,
																height: "100px !important",
																"&:hover": {
																	"& img, & video": {
																		transform: "scale(1.05)",
																	},
																	"& .overlay": {
																		opacity: 1,
																	},
																},
															}}
														>
															{isVideo(img) ? (
																<Box
																	sx={{
																		position: "relative",
																		width: "100%",
																		height: "100%",
																	}}
																>
																	<video
																		src={img}
																		style={{
																			width: "100%",
																			height: "100%",
																			objectFit: "cover",
																			transition: "transform 0.3s ease",
																		}}
																	/>
																	<PlayCircleOutlined
																		sx={{
																			position: "absolute",
																			top: "50%",
																			left: "50%",
																			transform: "translate(-50%, -50%)",
																			fontSize: 32,
																			color: "white",
																			filter:
																				"drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
																		}}
																	/>
																</Box>
															) : (
																<Image
																	src={img}
																	alt={`${item.title} ${idx + 1}`}
																	width={150}
																	height={100}
																	style={{
																		objectFit: "cover",
																		width: "100%",
																		height: "100%",
																		transition: "transform 0.3s ease",
																	}}
																/>
															)}
															{idx === 3 && item.images.length > 4 && (
																<Box
																	className="overlay"
																	sx={{
																		position: "absolute",
																		inset: 0,
																		bgcolor: "rgba(0,0,0,0.7)",
																		display: "flex",
																		alignItems: "center",
																		justifyContent: "center",
																		opacity: 1,
																	}}
																>
																	<Typography
																		variant="h5"
																		color="white"
																		fontWeight="bold"
																	>
																		+{item.images.length - 4}
																	</Typography>
																</Box>
															)}
														</ImageListItem>
													))}
												</ImageList>
											</Box>
										)}
									</Stack>
								</Paper>
							</Box>
						))}
					</Stack>
				</Box>
			)}

			{/* Add Update Dialog */}
			<Dialog
				open={openUpdateDialog}
				onClose={handleCloseUpdateDialog}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 4,
						maxHeight: "90vh",
					},
				}}
			>
				<DialogTitle sx={{ pb: 1 }}>
					<Typography variant="h5" fontWeight="600">
						Dodaj Novi Update
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Dokumentuj svoj progres i kako se osjećaš
					</Typography>
				</DialogTitle>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
							{error}
						</Alert>
					)}

					<Stack spacing={3} sx={{ pt: 2 }}>
						<FormControl fullWidth>
							<InputLabel>Status Progresa</InputLabel>
							<Select
								value={updateForm.status}
								onChange={(e) =>
									setUpdateForm({
										...updateForm,
										status: e.target.value as
											| "progress"
											| "neutral"
											| "regress",
									})
								}
								label="Status Progresa"
								sx={{ borderRadius: 2 }}
							>
								<MenuItem value="progress">
									<Stack direction="row" spacing={1} alignItems="center">
										<TrendingUp color="success" />
										<Typography>Napredak</Typography>
									</Stack>
								</MenuItem>
								<MenuItem value="neutral">
									<Stack direction="row" spacing={1} alignItems="center">
										<Remove />
										<Typography>Neutralno</Typography>
									</Stack>
								</MenuItem>
								<MenuItem value="regress">
									<Stack direction="row" spacing={1} alignItems="center">
										<TrendingDown color="error" />
										<Typography>Nazadovanje</Typography>
									</Stack>
								</MenuItem>
							</Select>
						</FormControl>

						<TextField
							fullWidth
							multiline
							rows={4}
							label="Bilješke"
							value={updateForm.notes}
							onChange={(e) =>
								setUpdateForm({ ...updateForm, notes: e.target.value })
							}
							placeholder="Kako ide napredak? Šta si postigao/la?"
							sx={{
								"& .MuiOutlinedInput-root": {
									borderRadius: 2,
								},
							}}
						/>

						<Box>
							<Typography
								component="legend"
								gutterBottom
								fontWeight={500}
								sx={{ mb: 1 }}
							>
								Kako se osjećaš?
							</Typography>
							<Rating
								value={updateForm.feeling}
								onChange={(e, newValue) =>
									setUpdateForm({
										...updateForm,
										feeling: newValue || 3,
									})
								}
								IconContainerComponent={IconContainer}
								highlightSelectedOnly
								size="large"
							/>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ mt: 1, display: "block" }}
							>
								{customIcons[updateForm.feeling]?.label}
							</Typography>
						</Box>

						<Box>
							<UploadImageBox
								onUploadSuccess={handlePhotosUpload}
								endpoint="/api/goals-photos"
								label="Dodaj slike/video napretka"
								maxSizeMB={50}
								multiple={true}
								acceptedFormats="image/*,video/*"
								existingImages={updateForm.images}
								onRemoveImage={handleRemovePhoto}
							/>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
					<Button
						onClick={handleCloseUpdateDialog}
						disabled={isSubmitting}
						size="large"
						sx={{ borderRadius: 2, px: 3 }}
					>
						Otkaži
					</Button>
					<Button
						onClick={handleSubmitUpdate}
						variant="contained"
						disabled={isSubmitting}
						size="large"
						sx={{
							borderRadius: 2,
							px: 4,
							fontWeight: 600,
							boxShadow: 2,
						}}
					>
						{isSubmitting ? "Dodavanje..." : "Dodaj Update"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Media Preview Dialog */}
			<Dialog
				open={openMediaDialog}
				onClose={() => setOpenMediaDialog(false)}
				maxWidth="lg"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 4,
						maxHeight: "90vh",
					},
				}}
			>
				<DialogTitle>
					<Typography variant="h5" fontWeight="600">
						Pregled Medija
					</Typography>
				</DialogTitle>
				<DialogContent>
					<ImageList cols={2} gap={16}>
						{selectedMedia.map((media, idx) => (
							<ImageListItem
								key={idx}
								sx={{ borderRadius: 2, overflow: "hidden" }}
							>
								{isVideo(media) ? (
									<video
										src={media}
										controls
										style={{
											width: "100%",
											borderRadius: 8,
											maxHeight: 500,
										}}
									/>
								) : (
									<Image
										src={media}
										alt={`Media ${idx + 1}`}
										width={600}
										height={400}
										style={{
											objectFit: "contain",
											width: "100%",
											borderRadius: 8,
										}}
									/>
								)}
							</ImageListItem>
						))}
					</ImageList>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3 }}>
					<Button
						onClick={() => setOpenMediaDialog(false)}
						variant="contained"
						size="large"
						sx={{ borderRadius: 2, px: 4 }}
					>
						Zatvori
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default GoalDetail;
