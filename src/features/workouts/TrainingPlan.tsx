import React, { useState, useEffect, useMemo } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	Grid,
	Chip,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Alert,
	CircularProgress,
	Stack,
	Divider,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	useTheme,
	useMediaQuery,
	Fade,
	LinearProgress,
	Skeleton,
	Tooltip,
	Avatar,
	Collapse,
} from "@mui/material";
import {
	Add,
	Edit,
	Delete,
	PlayArrow,
	Pause,
	Stop,
	Assessment,
	CalendarToday,
	FitnessCenter,
	ExpandMore,
	Save,
	CheckCircle,
	Timeline,
	Flag,
	Close,
} from "@mui/icons-material";
import {
	format,
	parseISO,
	differenceInDays,
	isAfter,
	isBefore,
} from "date-fns";

interface TrainingPlan {
	_id?: string;
	userId?: string;
	name: string;
	description?: string;
	startDate: string;
	endDate?: string;
	status: "active" | "completed" | "paused";
	goal?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

interface TrainingPlanFormData {
	name: string;
	description: string;
	startDate: string;
	endDate?: string;
	status: "active" | "completed" | "paused";
	goal: string;
}

interface TrainingPlansProps {
	onViewProgress?: (planId: string, planName: string) => void;
	onPlanSelect?: (planId: string | null) => void;
}

const TrainingPlans: React.FC<TrainingPlansProps> = ({
	onViewProgress,
	onPlanSelect,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	// State management
	const [plans, setPlans] = useState<TrainingPlan[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null);
	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		plan: TrainingPlan | null;
	}>({ open: false, plan: null });
	const [expandedPlans, setExpandedPlans] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form state
	const [formData, setFormData] = useState<TrainingPlanFormData>({
		name: "",
		description: "",
		startDate: new Date().toISOString().split("T")[0],
		endDate: "",
		status: "active",
		goal: "",
	});
	const [formErrors, setFormErrors] = useState<string[]>([]);

	// Load plans
	useEffect(() => {
		fetchPlans();
	}, []);

	const fetchPlans = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/training-plans");
			if (!response.ok) throw new Error("Failed to fetch plans");
			const data = await response.json();
			setPlans(data.plans || []);
		} catch (error) {
			setError("Greška pri učitavanju planova");
			console.error("Error fetching plans:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Memoized calculations
	const planStats = useMemo(() => {
		const activePlans = plans.filter((p) => p.status === "active");
		const completedPlans = plans.filter((p) => p.status === "completed");
		const pausedPlans = plans.filter((p) => p.status === "paused");

		return {
			total: plans.length,
			active: activePlans.length,
			completed: completedPlans.length,
			paused: pausedPlans.length,
			activePlan: activePlans[0] || null,
		};
	}, [plans]);

	// Plan duration calculation
	const getPlanDuration = (plan: TrainingPlan) => {
		if (!plan.endDate) return null;
		const start = parseISO(plan.startDate);
		const end = parseISO(plan.endDate);
		return differenceInDays(end, start) + 1;
	};

	// Plan progress calculation
	const getPlanProgress = (plan: TrainingPlan) => {
		if (plan.status === "completed") return 100;
		if (!plan.endDate || plan.status === "paused") return null;

		const start = parseISO(plan.startDate);
		const end = parseISO(plan.endDate);
		const today = new Date();

		if (isBefore(today, start)) return 0;
		if (isAfter(today, end)) return 100;

		const totalDays = differenceInDays(end, start) + 1;
		const completedDays = differenceInDays(today, start) + 1;

		return Math.round((completedDays / totalDays) * 100);
	};

	// Status color mapping
	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "success";
			case "completed":
				return "primary";
			case "paused":
				return "warning";
			default:
				return "default";
		}
	};

	// Form validation
	const validateForm = () => {
		const errors: string[] = [];

		if (!formData.name.trim()) {
			errors.push("Naziv plana je obavezan");
		}

		if (!formData.startDate) {
			errors.push("Datum početka je obavezan");
		}

		if (formData.endDate && formData.startDate) {
			const start = parseISO(formData.startDate);
			const end = parseISO(formData.endDate);
			if (isAfter(start, end)) {
				errors.push("Datum završetka mora biti nakon datuma početka");
			}
		}

		// Check for multiple active plans
		if (formData.status === "active" && !editingPlan) {
			const hasActivePlan = plans.some((p) => p.status === "active");
			if (hasActivePlan) {
				errors.push("Već imate aktivan plan. Prvo završite trenutni plan.");
			}
		}

		setFormErrors(errors);
		return errors.length === 0;
	};

	// Form handlers
	const handleOpenForm = (plan?: TrainingPlan) => {
		if (plan) {
			setEditingPlan(plan);
			setFormData({
				name: plan.name,
				description: plan.description || "",
				startDate: plan.startDate,
				endDate: plan.endDate || "",
				status: plan.status,
				goal: plan.goal || "",
			});
		} else {
			setEditingPlan(null);
			setFormData({
				name: "",
				description: "",
				startDate: new Date().toISOString().split("T")[0],
				endDate: "",
				status: "active",
				goal: "",
			});
		}
		setFormErrors([]);
		setShowForm(true);
	};

	const handleCloseForm = () => {
		setShowForm(false);
		setEditingPlan(null);
		setFormErrors([]);
	};

	const handleSubmit = async () => {
		if (!validateForm()) return;

		setIsSubmitting(true);
		try {
			const method = editingPlan ? "PUT" : "POST";
			const body = editingPlan
				? { planId: editingPlan._id, ...formData }
				: formData;

			const response = await fetch("/api/training-plans", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Operation failed");
			}

			await fetchPlans();
			handleCloseForm();

			// If creating active plan, notify parent
			if (formData.status === "active" && onPlanSelect) {
				const newPlans = await fetch("/api/training-plans").then((r) =>
					r.json()
				);
				const activePlan = newPlans.plans?.find(
					(p: TrainingPlan) => p.status === "active"
				);
				onPlanSelect(activePlan?._id || null);
			}
		} catch (error) {
			setFormErrors([
				error instanceof Error ? error.message : "Greška pri čuvanju",
			]);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Plan actions
	const handleStatusChange = async (
		plan: TrainingPlan,
		newStatus: "active" | "paused" | "completed"
	) => {
		try {
			const updateData = {
				planId: plan._id,
				status: newStatus,
				...(newStatus === "completed" && {
					endDate: new Date().toISOString().split("T")[0],
				}),
			};

			const response = await fetch("/api/training-plans", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updateData),
			});

			if (!response.ok) throw new Error("Failed to update plan");

			await fetchPlans();

			// Notify parent about plan change
			if (onPlanSelect) {
				if (newStatus === "active") {
					onPlanSelect(plan._id!);
				} else if (plan.status === "active") {
					onPlanSelect(null);
				}
			}
		} catch (error) {
			setError("Greška pri ažuriranju plana");
		}
	};

	const handleDelete = async () => {
		if (!deleteDialog.plan?._id) return;

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/training-plans?id=${deleteDialog.plan._id}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete");
			}

			await fetchPlans();
			setDeleteDialog({ open: false, plan: null });

			// If deleted active plan, notify parent
			if (deleteDialog.plan.status === "active" && onPlanSelect) {
				onPlanSelect(null);
			}
		} catch (error) {
			setFormErrors([
				error instanceof Error ? error.message : "Greška pri brisanju",
			]);
		} finally {
			setIsDeleting(false);
		}
	};

	// Toggle expanded state
	const toggleExpanded = (planId: string) => {
		setExpandedPlans((prev) =>
			prev.includes(planId)
				? prev.filter((id) => id !== planId)
				: [...prev, planId]
		);
	};

	// Format dates
	const formatDate = (dateString: string) => {
		try {
			return format(parseISO(dateString), "dd.MM.yyyy");
		} catch {
			return dateString;
		}
	};

	// Loading skeleton
	if (isLoading) {
		return (
			<Box>
				<Typography
					variant="h5"
					gutterBottom
					sx={{ display: "flex", alignItems: "center", mb: 3 }}
				>
					<Timeline sx={{ mr: 1, color: "primary.main" }} />
					Trening planovi
				</Typography>
				<Stack spacing={2}>
					{[1, 2, 3].map((i) => (
						<Card key={i}>
							<CardContent>
								<Skeleton variant="text" width="60%" height={32} />
								<Skeleton variant="text" width="40%" height={24} />
								<Skeleton
									variant="rectangular"
									width="100%"
									height={60}
									sx={{ mt: 2 }}
								/>
							</CardContent>
						</Card>
					))}
				</Stack>
			</Box>
		);
	}

	return (
		<>
			<Box>
				{/* Header */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 3,
						flexWrap: "wrap",
						gap: 2,
					}}
				>
					<Typography
						variant="h5"
						sx={{ display: "flex", alignItems: "center" }}
					>
						<Timeline sx={{ mr: 1, color: "primary.main" }} />
						Trening planovi ({planStats.total})
					</Typography>
					<Button
						variant="contained"
						startIcon={<Add />}
						onClick={() => handleOpenForm()}
						size={isMobile ? "small" : "medium"}
					>
						Novi plan
					</Button>
				</Box>

				{/* Error Alert */}
				<Collapse in={!!error}>
					<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
						{error}
					</Alert>
				</Collapse>

				{/* Stats Overview */}
				{planStats.total > 0 && (
					<Card
						sx={{
							mb: 3,
							background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
							color: "white",
						}}
					>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								Pregled planova
							</Typography>
							<Grid container spacing={2}>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Box sx={{ textAlign: "center" }}>
										<Avatar
											sx={{
												bgcolor: "rgba(255,255,255,0.2)",
												mx: "auto",
												mb: 1,
											}}
										>
											<CheckCircle />
										</Avatar>
										<Typography variant="h4" fontWeight="bold">
											{planStats.active}
										</Typography>
										<Typography variant="caption">Aktivni</Typography>
									</Box>
								</Grid>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Box sx={{ textAlign: "center" }}>
										<Avatar
											sx={{
												bgcolor: "rgba(255,255,255,0.2)",
												mx: "auto",
												mb: 1,
											}}
										>
											<Flag />
										</Avatar>
										<Typography variant="h4" fontWeight="bold">
											{planStats.completed}
										</Typography>
										<Typography variant="caption">Završeno</Typography>
									</Box>
								</Grid>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Box sx={{ textAlign: "center" }}>
										<Avatar
											sx={{
												bgcolor: "rgba(255,255,255,0.2)",
												mx: "auto",
												mb: 1,
											}}
										>
											<Pause />
										</Avatar>
										<Typography variant="h4" fontWeight="bold">
											{planStats.paused}
										</Typography>
										<Typography variant="caption">Pauzirano</Typography>
									</Box>
								</Grid>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Box sx={{ textAlign: "center" }}>
										<Avatar
											sx={{
												bgcolor: "rgba(255,255,255,0.2)",
												mx: "auto",
												mb: 1,
											}}
										>
											<FitnessCenter />
										</Avatar>
										<Typography variant="h4" fontWeight="bold">
											{planStats.total}
										</Typography>
										<Typography variant="caption">Ukupno</Typography>
									</Box>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				)}

				{/* Plans List */}
				{plans.length === 0 ? (
					<Card sx={{ textAlign: "center", py: 6 }}>
						<CardContent>
							<Timeline sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
							<Typography variant="h6" color="textSecondary" gutterBottom>
								Nema trening planova
							</Typography>
							<Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
								Kreirajte svoj prvi trening plan da biste počeli praćenje
								napretka.
							</Typography>
							<Button
								variant="contained"
								startIcon={<Add />}
								onClick={() => handleOpenForm()}
							>
								Kreiraj prvi plan
							</Button>
						</CardContent>
					</Card>
				) : (
					<Stack spacing={2}>
						{plans.map((plan, index) => {
							const progress = getPlanProgress(plan);
							const duration = getPlanDuration(plan);
							const isExpanded = expandedPlans.includes(plan._id!);

							return (
								<Fade in timeout={300 + index * 100} key={plan._id}>
									<Card
										sx={{
											border: "1px solid",
											borderColor:
												plan.status === "active" ? "success.light" : "divider",
											position: "relative",
											overflow: "hidden",
											"&:hover": {
												boxShadow: 4,
												transform: "translateY(-2px)",
												transition: "all 0.3s ease",
											},
										}}
									>
										{/* Status indicator */}
										<Box
											sx={{
												position: "absolute",
												top: 0,
												left: 0,
												right: 0,
												height: 4,
												bgcolor:
													plan.status === "active"
														? "success.main"
														: plan.status === "completed"
														? "primary.main"
														: "warning.main",
											}}
										/>

										<Accordion
											expanded={isExpanded}
											onChange={() => toggleExpanded(plan._id!)}
											sx={{
												boxShadow: "none",
												"&.Mui-expanded": { margin: 0 },
											}}
										>
											<AccordionSummary expandIcon={<ExpandMore />}>
												<Grid container alignItems="center" spacing={2}>
													<Grid size={{ xs: 12, sm: 6, md: 4 }}>
														<Typography variant="h6" fontWeight="bold">
															{plan.name}
														</Typography>
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 1,
																mt: 0.5,
															}}
														>
															<CalendarToday
																sx={{ fontSize: 16, color: "text.secondary" }}
															/>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{formatDate(plan.startDate)}
																{plan.endDate &&
																	` - ${formatDate(plan.endDate)}`}
															</Typography>
														</Box>
													</Grid>

													<Grid size={{ xs: 12, sm: 6, md: 3 }}>
														<Chip
															label={plan.status.toUpperCase()}
															color={getStatusColor(plan.status)}
															variant="filled"
															size="small"
														/>
														{duration && (
															<Typography
																variant="caption"
																sx={{ display: "block", mt: 0.5 }}
															>
																{duration} dana
															</Typography>
														)}
													</Grid>

													<Grid size={{ xs: 12, md: 3 }}>
														{progress !== null && (
															<Box>
																<Typography variant="body2" gutterBottom>
																	Napredak: {progress}%
																</Typography>
																<LinearProgress
																	variant="determinate"
																	value={progress}
																	sx={{ height: 8, borderRadius: 4 }}
																/>
															</Box>
														)}
													</Grid>

													<Grid size={{ xs: 12, md: 2 }}>
														<Box
															sx={{
																display: "flex",
																gap: 0.5,
																justifyContent: "flex-end",
															}}
														>
															{plan.status === "active" && (
																<>
																	<Tooltip title="Pauziraj">
																		<IconButton
																			size="small"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleStatusChange(plan, "paused");
																			}}
																			color="warning"
																		>
																			<Pause />
																		</IconButton>
																	</Tooltip>
																	<Tooltip title="Završi">
																		<IconButton
																			size="small"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleStatusChange(plan, "completed");
																			}}
																			color="primary"
																		>
																			<Stop />
																		</IconButton>
																	</Tooltip>
																</>
															)}
															{plan.status === "paused" && (
																<Tooltip title="Nastavi">
																	<IconButton
																		size="small"
																		onClick={(e) => {
																			e.stopPropagation();
																			handleStatusChange(plan, "active");
																		}}
																		color="success"
																	>
																		<PlayArrow />
																	</IconButton>
																</Tooltip>
															)}
															<Tooltip title="Uredi">
																<IconButton
																	size="small"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleOpenForm(plan);
																	}}
																	color="primary"
																>
																	<Edit />
																</IconButton>
															</Tooltip>
															<Tooltip title="Obriši">
																<IconButton
																	size="small"
																	onClick={(e) => {
																		e.stopPropagation();
																		setDeleteDialog({ open: true, plan });
																	}}
																	color="error"
																>
																	<Delete />
																</IconButton>
															</Tooltip>
														</Box>
													</Grid>
												</Grid>
											</AccordionSummary>

											<AccordionDetails>
												<Divider sx={{ mb: 2 }} />

												{plan.goal && (
													<Box sx={{ mb: 2 }}>
														<Typography
															variant="subtitle2"
															gutterBottom
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 1,
															}}
														>
															<Flag sx={{ fontSize: 18 }} />
															Cilj
														</Typography>
														<Typography variant="body2" color="text.secondary">
															{plan.goal}
														</Typography>
													</Box>
												)}

												{plan.description && (
													<Box sx={{ mb: 2 }}>
														<Typography variant="subtitle2" gutterBottom>
															Opis
														</Typography>
														<Typography variant="body2" color="text.secondary">
															{plan.description}
														</Typography>
													</Box>
												)}

												<Box
													sx={{
														display: "flex",
														gap: 2,
														flexWrap: "wrap",
														mt: 2,
													}}
												>
													{onViewProgress && (
														<Button
															variant="outlined"
															startIcon={<Assessment />}
															onClick={() =>
																onViewProgress(plan._id!, plan.name)
															}
															size="small"
														>
															Prikaži napredak
														</Button>
													)}
													{plan.status === "completed" && (
														<Chip
															icon={<CheckCircle />}
															label="Završeno"
															color="success"
															variant="outlined"
															size="small"
														/>
													)}
												</Box>
											</AccordionDetails>
										</Accordion>
									</Card>
								</Fade>
							);
						})}
					</Stack>
				)}
			</Box>

			{/* Plan Form Dialog */}
			<Dialog
				open={showForm}
				onClose={handleCloseForm}
				maxWidth="md"
				fullWidth
				fullScreen={isMobile}
			>
				<DialogTitle>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Timeline color="primary" />
							<Typography variant="h6">
								{editingPlan ? "Uredi plan" : "Novi trening plan"}
							</Typography>
						</Box>
						<IconButton onClick={handleCloseForm} size="small">
							<Close />
						</IconButton>
					</Box>
				</DialogTitle>

				<DialogContent>
					<Collapse in={formErrors.length > 0}>
						<Alert severity="error" sx={{ mb: 2 }}>
							{formErrors.map((error, index) => (
								<div key={index}>{error}</div>
							))}
						</Alert>
					</Collapse>

					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid size={{ xs: 12 }}>
							<TextField
								fullWidth
								label="Naziv plana"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
							/>
						</Grid>

						<Grid size={{ xs: 12 }}>
							<TextField
								fullWidth
								label="Opis"
								multiline
								rows={3}
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder="Kratak opis plana, ciljevi, napomene..."
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								fullWidth
								type="date"
								label="Datum početka"
								value={formData.startDate}
								onChange={(e) =>
									setFormData({ ...formData, startDate: e.target.value })
								}
								InputLabelProps={{ shrink: true }}
								required
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								fullWidth
								type="date"
								label="Datum završetka (opciono)"
								value={formData.endDate}
								onChange={(e) =>
									setFormData({ ...formData, endDate: e.target.value })
								}
								InputLabelProps={{ shrink: true }}
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<FormControl fullWidth>
								<InputLabel>Status</InputLabel>
								<Select
									value={formData.status}
									label="Status"
									onChange={(e) =>
										setFormData({ ...formData, status: e.target.value })
									}
								>
									<MenuItem value="active">Aktivan</MenuItem>
									<MenuItem value="paused">Pauziran</MenuItem>
									<MenuItem value="completed">Završen</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								fullWidth
								label="Cilj"
								value={formData.goal}
								onChange={(e) =>
									setFormData({ ...formData, goal: e.target.value })
								}
								placeholder="npr. Povećanje snage, mišićna masa..."
							/>
						</Grid>
					</Grid>
				</DialogContent>

				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={handleCloseForm} disabled={isSubmitting}>
						Otkaži
					</Button>
					<Button
						onClick={handleSubmit}
						variant="contained"
						disabled={isSubmitting}
						startIcon={isSubmitting ? <CircularProgress size={16} /> : <Save />}
					>
						{isSubmitting ? "Čuvam..." : "Sačuvaj"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialog.open}
				onClose={() =>
					!isDeleting && setDeleteDialog({ open: false, plan: null })
				}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Delete color="error" />
						Brisanje plana
					</Box>
				</DialogTitle>
				<DialogContent>
					<Alert severity="warning" sx={{ mb: 2 }}>
						<Typography variant="body2">
							Ova akcija će obrisati plan i sve povezane statistike!
						</Typography>
					</Alert>
					<Typography>
						Da li ste sigurni da želite da obrišete plan{" "}
						<Typography component="span" fontWeight="bold" color="primary">
							{deleteDialog.plan?.name}
						</Typography>
						?
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setDeleteDialog({ open: false, plan: null })}
						disabled={isDeleting}
					>
						Otkaži
					</Button>
					<Button
						onClick={handleDelete}
						color="error"
						variant="contained"
						disabled={isDeleting}
						startIcon={isDeleting ? <CircularProgress size={16} /> : <Delete />}
					>
						{isDeleting ? "Brišem..." : "Obriši"}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default TrainingPlans;
