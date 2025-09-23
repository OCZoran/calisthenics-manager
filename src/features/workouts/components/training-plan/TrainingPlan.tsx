import React, { useState, useEffect, useMemo } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	Grid,
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
	useTheme,
	useMediaQuery,
	Fade,
	Skeleton,
	Avatar,
	Collapse,
	IconButton,
} from "@mui/material";
import {
	Add,
	Delete,
	Timeline,
	Save,
	CheckCircle,
	Flag,
	Close,
	Pause,
	FitnessCenter,
	TrendingUp,
} from "@mui/icons-material";
import {
	format,
	parseISO,
	differenceInDays,
	isAfter,
	isBefore,
} from "date-fns";
import { formatDate } from "@/global/utils/format-date";
import TrainingPlanCard from "./TrainingPlanCard";

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

	// Loading skeleton
	if (isLoading) {
		return (
			<Box>
				<Typography
					variant="h4"
					gutterBottom
					sx={{
						display: "flex",
						alignItems: "center",
						mb: 4,
						fontWeight: "700",
						background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						backgroundClip: "text",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
					}}
				>
					<Timeline sx={{ mr: 2, color: "primary.main" }} />
					Trening planovi
				</Typography>
				<Stack spacing={3}>
					{[1, 2, 3].map((i) => (
						<Card key={i} sx={{ borderRadius: 3 }}>
							<CardContent sx={{ p: 3 }}>
								<Skeleton variant="text" width="60%" height={40} />
								<Skeleton variant="text" width="40%" height={28} />
								<Skeleton
									variant="rectangular"
									width="100%"
									height={80}
									sx={{ mt: 2, borderRadius: 2 }}
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
				{/* Enhanced Header */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 4,
						flexWrap: "wrap",
						gap: 2,
					}}
				>
					<Box>
						<Typography
							variant="h4"
							sx={{
								display: "flex",
								alignItems: "center",
								fontWeight: "700",
								background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
								backgroundClip: "text",
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
								mb: 1,
							}}
						>
							<Timeline sx={{ mr: 2, color: "primary.main" }} />
							Trening planovi
						</Typography>
						<Typography variant="subtitle1" color="text.secondary">
							Upravljajte vašim trening planovima i pratite napredak
						</Typography>
					</Box>

					<Button
						variant="contained"
						startIcon={<Add />}
						onClick={() => handleOpenForm()}
						size={isMobile ? "medium" : "large"}
						sx={{
							borderRadius: 3,
							px: 3,
							py: 1.5,
							textTransform: "none",
							fontWeight: "600",
							background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
							boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
							"&:hover": {
								boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
								transform: "translateY(-2px)",
							},
						}}
					>
						Novi plan
					</Button>
				</Box>

				{/* Error Alert */}
				<Collapse in={!!error}>
					<Alert
						severity="error"
						sx={{ mb: 3, borderRadius: 2 }}
						onClose={() => setError(null)}
					>
						{error}
					</Alert>
				</Collapse>

				{/* Enhanced Stats Overview */}
				{planStats.total > 0 && (
					<Card
						sx={{
							mb: 4,
							background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
							color: "white",
							borderRadius: 3,
							overflow: "hidden",
							position: "relative",
							"&:before": {
								content: '""',
								position: "absolute",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								background:
									'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" fill-opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\')',
								opacity: 0.3,
							},
						}}
					>
						<CardContent sx={{ p: 4, position: "relative", zIndex: 1 }}>
							<Typography
								variant="h5"
								gutterBottom
								sx={{ fontWeight: "600", mb: 3 }}
							>
								📊 Pregled planova
							</Typography>
							<Grid container spacing={3}>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Box sx={{ textAlign: "center" }}>
										<Avatar
											sx={{
												bgcolor: "rgba(255,255,255,0.2)",
												mx: "auto",
												mb: 2,
												width: 60,
												height: 60,
												backdropFilter: "blur(10px)",
											}}
										>
											<TrendingUp sx={{ fontSize: 28 }} />
										</Avatar>
										<Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
											{planStats.active}
										</Typography>
										<Typography variant="body2" sx={{ opacity: 0.9 }}>
											Aktivni planovi
										</Typography>
									</Box>
								</Grid>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Box sx={{ textAlign: "center" }}>
										<Avatar
											sx={{
												bgcolor: "rgba(255,255,255,0.2)",
												mx: "auto",
												mb: 2,
												width: 60,
												height: 60,
												backdropFilter: "blur(10px)",
											}}
										>
											<CheckCircle sx={{ fontSize: 28 }} />
										</Avatar>
										<Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
											{planStats.completed}
										</Typography>
										<Typography variant="body2" sx={{ opacity: 0.9 }}>
											Završenih
										</Typography>
									</Box>
								</Grid>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Box sx={{ textAlign: "center" }}>
										<Avatar
											sx={{
												bgcolor: "rgba(255,255,255,0.2)",
												mx: "auto",
												mb: 2,
												width: 60,
												height: 60,
												backdropFilter: "blur(10px)",
											}}
										>
											<Pause sx={{ fontSize: 28 }} />
										</Avatar>
										<Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
											{planStats.paused}
										</Typography>
										<Typography variant="body2" sx={{ opacity: 0.9 }}>
											Pauziranih
										</Typography>
									</Box>
								</Grid>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Box sx={{ textAlign: "center" }}>
										<Avatar
											sx={{
												bgcolor: "rgba(255,255,255,0.2)",
												mx: "auto",
												mb: 2,
												width: 60,
												height: 60,
												backdropFilter: "blur(10px)",
											}}
										>
											<FitnessCenter sx={{ fontSize: 28 }} />
										</Avatar>
										<Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
											{planStats.total}
										</Typography>
										<Typography variant="body2" sx={{ opacity: 0.9 }}>
											Ukupno planova
										</Typography>
									</Box>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				)}

				{/* No Plans State */}
				{planStats.total === 0 && (
					<Card
						sx={{
							textAlign: "center",
							p: 6,
							borderRadius: 3,
							background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
						}}
					>
						<FitnessCenter
							sx={{
								fontSize: 80,
								color: "text.secondary",
								mb: 2,
								opacity: 0.5,
							}}
						/>
						<Typography variant="h5" gutterBottom color="text.secondary">
							Nemate trening planove
						</Typography>
						<Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
							Kreirajte svoj prvi trening plan i počnite da pratite napredak
						</Typography>
						<Button
							variant="contained"
							startIcon={<Add />}
							onClick={() => handleOpenForm()}
							size="large"
							sx={{
								borderRadius: 3,
								px: 4,
								py: 2,
								textTransform: "none",
								fontWeight: "600",
							}}
						>
							Kreiraj prvi plan
						</Button>
					</Card>
				)}

				{/* Plans List */}
				<Stack spacing={3}>
					{plans.map((plan, index) => {
						const progress = getPlanProgress(plan);
						const duration = getPlanDuration(plan);
						const isExpanded = expandedPlans.includes(plan._id!);

						return (
							<Fade in timeout={300 + index * 100} key={plan._id}>
								<Box>
									<TrainingPlanCard
										plan={plan}
										isExpanded={isExpanded}
										progress={progress}
										duration={duration}
										onToggleExpanded={toggleExpanded}
										onStatusChange={handleStatusChange}
										onEdit={handleOpenForm}
										onDelete={(plan) => setDeleteDialog({ open: true, plan })}
										onViewProgress={onViewProgress}
									/>
								</Box>
							</Fade>
						);
					})}
				</Stack>
			</Box>

			{/* Enhanced Plan Form Dialog */}
			<Dialog
				open={showForm}
				onClose={handleCloseForm}
				maxWidth="md"
				fullWidth
				fullScreen={isMobile}
				PaperProps={{
					sx: {
						borderRadius: isMobile ? 0 : 3,
						background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
					},
				}}
			>
				<DialogTitle
					sx={{
						background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						color: "white",
						p: 3,
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
							<Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
								<Timeline />
							</Avatar>
							<Box>
								<Typography variant="h5" fontWeight="600">
									{editingPlan ? "Uredi plan" : "Novi trening plan"}
								</Typography>
								<Typography variant="body2" sx={{ opacity: 0.9 }}>
									{editingPlan
										? "Ažurirajte informacije o planu"
										: "Kreirajte novi plan za vaš trening"}
								</Typography>
							</Box>
						</Box>
						<IconButton
							onClick={handleCloseForm}
							sx={{ color: "white" }}
							size="large"
						>
							<Close />
						</IconButton>
					</Box>
				</DialogTitle>

				<DialogContent sx={{ p: 4, background: "white" }}>
					<Collapse in={formErrors.length > 0}>
						<Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
							{formErrors.map((error, index) => (
								<div key={index}>{error}</div>
							))}
						</Alert>
					</Collapse>

					<Grid container spacing={3} sx={{ mt: 0 }}>
						<Grid size={{ xs: 12 }}>
							<TextField
								fullWidth
								label="Naziv plana"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
								variant="outlined"
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
								label="Opis"
								multiline
								rows={4}
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder="Kratak opis plana, ciljevi, napomene..."
								variant="outlined"
								sx={{
									"& .MuiOutlinedInput-root": {
										borderRadius: 2,
									},
								}}
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
								variant="outlined"
								sx={{
									"& .MuiOutlinedInput-root": {
										borderRadius: 2,
									},
								}}
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
								variant="outlined"
								sx={{
									"& .MuiOutlinedInput-root": {
										borderRadius: 2,
									},
								}}
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<FormControl fullWidth variant="outlined">
								<InputLabel>Status</InputLabel>
								<Select
									value={formData.status}
									label="Status"
									onChange={(e) =>
										setFormData({ ...formData, status: e.target.value })
									}
									sx={{
										borderRadius: 2,
									}}
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
								variant="outlined"
								sx={{
									"& .MuiOutlinedInput-root": {
										borderRadius: 2,
									},
								}}
							/>
						</Grid>
					</Grid>
				</DialogContent>

				<DialogActions sx={{ p: 3, background: "white", gap: 2 }}>
					<Button
						onClick={handleCloseForm}
						disabled={isSubmitting}
						variant="outlined"
						size="large"
						sx={{
							borderRadius: 2,
							px: 3,
							textTransform: "none",
							fontWeight: "500",
						}}
					>
						Otkaži
					</Button>
					<Button
						onClick={handleSubmit}
						variant="contained"
						disabled={isSubmitting}
						startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
						size="large"
						sx={{
							borderRadius: 2,
							px: 4,
							textTransform: "none",
							fontWeight: "600",
							background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
							"&:hover": {
								background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
							},
						}}
					>
						{isSubmitting ? "Čuvam..." : "Sačuvaj plan"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Enhanced Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialog.open}
				onClose={() =>
					!isDeleting && setDeleteDialog({ open: false, plan: null })
				}
				maxWidth="sm"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 3,
					},
				}}
			>
				<DialogTitle
					sx={{
						background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
						color: "white",
						p: 3,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
							<Delete />
						</Avatar>
						<Box>
							<Typography variant="h6" fontWeight="600">
								Brisanje plana
							</Typography>
							<Typography variant="body2" sx={{ opacity: 0.9 }}>
								Ova akcija se ne može poništiti
							</Typography>
						</Box>
					</Box>
				</DialogTitle>

				<DialogContent sx={{ p: 4 }}>
					<Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
						<Typography variant="body2">
							⚠️ Ova akcija će trajno obrisati plan i sve povezane podatke!
						</Typography>
					</Alert>
					<Typography variant="body1">
						Da li ste sigurni da želite da obrišete plan{" "}
						<Typography
							component="span"
							fontWeight="bold"
							color="primary"
							sx={{
								background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
								backgroundClip: "text",
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
							}}
						>
							{deleteDialog.plan?.name}
						</Typography>
						?
					</Typography>
				</DialogContent>

				<DialogActions sx={{ p: 3, gap: 2 }}>
					<Button
						onClick={() => setDeleteDialog({ open: false, plan: null })}
						disabled={isDeleting}
						variant="outlined"
						size="large"
						sx={{
							borderRadius: 2,
							px: 3,
							textTransform: "none",
							fontWeight: "500",
						}}
					>
						Otkaži
					</Button>
					<Button
						onClick={handleDelete}
						color="error"
						variant="contained"
						disabled={isDeleting}
						startIcon={isDeleting ? <CircularProgress size={20} /> : <Delete />}
						size="large"
						sx={{
							borderRadius: 2,
							px: 4,
							textTransform: "none",
							fontWeight: "600",
							background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
							"&:hover": {
								background: "linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)",
							},
						}}
					>
						{isDeleting ? "Brišem..." : "Obriši plan"}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default TrainingPlans;
