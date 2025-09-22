"use client";

import React, { useState, useMemo } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	Grid,
	Chip,
	IconButton,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Alert,
	CircularProgress,
	Stack,
	Divider,
	Skeleton,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	TextField,
	InputAdornment,
	Collapse,
	Fade,
	Zoom,
	useTheme,
	useMediaQuery,
} from "@mui/material";
import {
	Edit,
	Delete,
	ExpandMore,
	FitnessCenter,
	CalendarToday,
	Notes,
	CloudDone,
	CloudOff,
	Repeat,
	Search,
	FilterList,
	Sort,
	SwipeLeft,
	SwipeRight,
	MonitorWeight,
	Add,
	Timeline,
	Warning,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { Workout } from "@/global/interfaces/workout.interface";
import { TrainingPlan } from "@/global/interfaces/training-plan.interface";
import WorkoutStatisticsDashboard from "./WorkoutStatisticsDashboard";

interface WorkoutListProps {
	workouts: Workout[];
	onEdit: (workout: Workout) => void;
	onDelete: (workoutId: string) => Promise<void>;
	onCreateWorkout?: () => void;
	onCreatePlan?: () => void;
	trainingPlans?: TrainingPlan[];
	activePlan?: TrainingPlan | null;
	isLoading?: boolean;
}

type SortOption = "date-desc" | "date-asc" | "type" | "exercises" | "sets";
type FilterOption =
	| "all"
	| "push"
	| "pull"
	| "legs"
	| "upper"
	| "lower"
	| "full-body"
	| "cardio"
	| "other"
	| "synced"
	| "offline";

const WorkoutList: React.FC<WorkoutListProps> = ({
	workouts,
	onEdit,
	onDelete,
	onCreateWorkout,
	onCreatePlan,
	trainingPlans = [],
	activePlan,
	isLoading = false,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		workout: Workout | null;
	}>({ open: false, workout: null });
	const [expandedWorkouts, setExpandedWorkouts] = useState<string[]>([]);
	const [isDeleting, setIsDeleting] = useState(false);

	// Enhanced filtering and sorting states
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("date-desc");
	const [filterBy, setFilterBy] = useState<FilterOption>("all");
	const [showFilters, setShowFilters] = useState(false);

	// Check if user has any training plans
	const hasTrainingPlans = trainingPlans.length > 0;
	const hasActivePlan = activePlan !== null;

	// Memoized calculations for performance
	const getTotalSets = useMemo(() => {
		return (workout: Workout) => {
			return workout.exercises.reduce(
				(total, exercise) => total + exercise.sets.length,
				0
			);
		};
	}, []);

	const getTotalReps = useMemo(() => {
		return (workout: Workout) => {
			return workout.exercises.reduce(
				(total, exercise) =>
					total +
					exercise.sets.reduce(
						(setTotal, set) => setTotal + Number(set.reps),
						0
					),
				0
			);
		};
	}, []);

	const getTotalWeight = useMemo(() => {
		return (workout: Workout) => {
			return workout.exercises.reduce(
				(total, exercise) =>
					total +
					exercise.sets.reduce(
						(setTotal, set) => setTotal + (Number(set.weight) || 0),
						0
					),
				0
			);
		};
	}, []);

	// Memoized filtered and sorted workouts
	const filteredAndSortedWorkouts = useMemo(() => {
		let filtered = workouts;

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(
				(workout) =>
					workout.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
					workout.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					workout.exercises.some((exercise) =>
						exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
					)
			);
		}

		// Apply type/status filter
		if (filterBy !== "all") {
			if (filterBy === "synced") {
				filtered = filtered.filter((workout) => workout.synced === true);
			} else if (filterBy === "offline") {
				filtered = filtered.filter((workout) => workout.synced === false);
			} else {
				filtered = filtered.filter((workout) => workout.type === filterBy);
			}
		}

		// Apply sorting
		const sorted = [...filtered].sort((a, b) => {
			switch (sortBy) {
				case "date-desc":
					return new Date(b.date).getTime() - new Date(a.date).getTime();
				case "date-asc":
					return new Date(a.date).getTime() - new Date(b.date).getTime();
				case "type":
					return a.type.localeCompare(b.type);
				case "exercises":
					return b.exercises.length - a.exercises.length;
				case "sets":
					return getTotalSets(b) - getTotalSets(a);
				default:
					return 0;
			}
		});

		return sorted;
	}, [workouts, searchTerm, filterBy, sortBy, getTotalSets]);

	const handleDeleteClick = (workout: Workout) => {
		setDeleteDialog({ open: true, workout });
	};

	const handleDeleteConfirm = async () => {
		if (!deleteDialog.workout?._id) return;

		setIsDeleting(true);
		try {
			await onDelete(deleteDialog.workout._id);
			setDeleteDialog({ open: false, workout: null });
		} catch (error) {
			console.error("Error deleting workout:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	const toggleAccordion = (workoutId: string) => {
		setExpandedWorkouts((prev) =>
			prev.includes(workoutId)
				? prev.filter((id) => id !== workoutId)
				: [...prev, workoutId]
		);
	};

	const getWorkoutTypeColor = (type: string) => {
		const colors: {
			[key: string]: "primary" | "secondary" | "success" | "warning" | "error";
		} = {
			push: "primary",
			pull: "secondary",
			legs: "success",
			upper: "warning",
			lower: "error",
			"full-body": "primary",
			cardio: "secondary",
		};
		return colors[type] || "default";
	};

	const formatDate = (dateString: string) => {
		try {
			return format(parseISO(dateString), "dd.MM.yyyy");
		} catch {
			return dateString;
		}
	};

	// Enhanced skeleton loading
	const renderSkeletonLoader = () => (
		<Stack spacing={2}>
			{[1, 2, 3].map((item) => (
				<Card key={item} sx={{ border: "1px solid", borderColor: "divider" }}>
					<CardContent>
						<Grid container spacing={2} alignItems="center">
							<Grid size={{ xs: 12, sm: 3 }}>
								<Skeleton variant="text" width="80%" height={24} />
							</Grid>
							<Grid size={{ xs: 12, sm: 6, md: 4 }}>
								<Skeleton variant="rounded" width={60} height={24} />
							</Grid>
							<Grid size={{ xs: 6, sm: 4 }}>
								<Box sx={{ display: "flex", gap: 1 }}>
									<Skeleton variant="rounded" width={80} height={24} />
									<Skeleton variant="rounded" width={80} height={24} />
								</Box>
							</Grid>
							<Grid size={{ xs: 6, sm: 1 }}>
								<Skeleton variant="circular" width={20} height={20} />
							</Grid>
							<Grid size={{ xs: 12, sm: 6, md: 4 }}>
								<Box
									sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}
								>
									<Skeleton variant="circular" width={32} height={32} />
									<Skeleton variant="circular" width={32} height={32} />
								</Box>
							</Grid>
						</Grid>
					</CardContent>
				</Card>
			))}
		</Stack>
	);

	// Render empty state with proper call-to-action
	const renderEmptyState = () => {
		// No training plans at all
		if (!hasTrainingPlans) {
			return (
				<Card
					sx={{
						textAlign: "center",
						py: 6,
						border: "2px dashed",
						borderColor: "warning.light",
						backgroundColor: "warning.50",
					}}
				>
					<CardContent>
						<Zoom in timeout={500}>
							<Timeline sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
						</Zoom>
						<Fade in timeout={800}>
							<Typography
								variant="h5"
								color="warning.dark"
								gutterBottom
								fontWeight="bold"
							>
								Potreban vam je trening plan
							</Typography>
						</Fade>
						<Fade in timeout={1000}>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ mb: 3, maxWidth: 500, mx: "auto" }}
							>
								Da biste dodali treninge, prvo morate kreirati trening plan.
								Plan vam pomaže da organizujete treninge i pratite napredak.
							</Typography>
						</Fade>
						<Fade in timeout={1200}>
							<Box
								sx={{
									display: "flex",
									gap: 2,
									justifyContent: "center",
									flexDirection: { xs: "column", sm: "row" },
								}}
							>
								<Button
									variant="contained"
									size="large"
									startIcon={<Timeline />}
									onClick={onCreatePlan}
									sx={{
										minWidth: 200,
										bgcolor: "warning.main",
										"&:hover": { bgcolor: "warning.dark" },
									}}
								>
									Kreiraj trening plan
								</Button>
							</Box>
						</Fade>
					</CardContent>
				</Card>
			);
		}

		// Has plans but no active plan
		if (hasTrainingPlans && !hasActivePlan) {
			return (
				<Card
					sx={{
						textAlign: "center",
						py: 6,
						border: "2px dashed",
						borderColor: "info.light",
						backgroundColor: "info.50",
					}}
				>
					<CardContent>
						<Zoom in timeout={500}>
							<Warning sx={{ fontSize: 64, color: "info.main", mb: 2 }} />
						</Zoom>
						<Fade in timeout={800}>
							<Typography
								variant="h5"
								color="info.dark"
								gutterBottom
								fontWeight="bold"
							>
								Nema aktivnog plana
							</Typography>
						</Fade>
						<Fade in timeout={1000}>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ mb: 3, maxWidth: 500, mx: "auto" }}
							>
								Imate {trainingPlans.length} trening plan
								{trainingPlans.length > 1 ? "ova" : ""}, ali nijedan nije
								aktivan. Aktivirajte postojeći plan ili kreirajte novi.
							</Typography>
						</Fade>
						<Fade in timeout={1200}>
							<Box
								sx={{
									display: "flex",
									gap: 2,
									justifyContent: "center",
									flexDirection: { xs: "column", sm: "row" },
								}}
							>
								<Button
									variant="contained"
									size="large"
									startIcon={<Add />}
									onClick={onCreatePlan}
									sx={{ minWidth: 200 }}
								>
									Kreiraj novi plan
								</Button>
								<Button
									variant="outlined"
									size="large"
									startIcon={<Timeline />}
									onClick={() => {
										/* Otvori listu postojećih planova */
									}}
								>
									Pogledaj postojeće planove
								</Button>
							</Box>
						</Fade>
					</CardContent>
				</Card>
			);
		}

		// Has active plan but no workouts
		return (
			<Card
				sx={{
					textAlign: "center",
					py: 6,
					border: "2px dashed",
					borderColor: "success.light",
					backgroundColor: "success.50",
				}}
			>
				<CardContent>
					<Zoom in timeout={500}>
						<FitnessCenter
							sx={{ fontSize: 64, color: "success.main", mb: 2 }}
						/>
					</Zoom>
					<Fade in timeout={800}>
						<Typography
							variant="h5"
							color="success.dark"
							gutterBottom
							fontWeight="bold"
						>
							Spremni za prvi trening?
						</Typography>
					</Fade>
					<Fade in timeout={1000}>
						<>
							<Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
								Odlično! Imate aktivan plan:
							</Typography>
							<Chip
								label={activePlan?.name || "Aktivni plan"}
								color="success"
								variant="filled"
								sx={{ mb: 2, fontSize: "1rem", py: 2 }}
							/>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ mb: 3, maxWidth: 500, mx: "auto" }}
							>
								Sada možete dodati svoj prvi trening i početi praćenje napretka.
							</Typography>
						</>
					</Fade>
					<Fade in timeout={1200}>
						<Button
							variant="contained"
							size="large"
							startIcon={<Add />}
							onClick={onCreateWorkout}
							sx={{ minWidth: 200 }}
						>
							Dodaj prvi trening
						</Button>
					</Fade>
				</CardContent>
			</Card>
		);
	};

	if (isLoading) {
		return (
			<Box>
				<Typography
					variant="h5"
					gutterBottom
					sx={{ mb: 3, display: "flex", alignItems: "center" }}
				>
					<FitnessCenter sx={{ mr: 1, color: "primary.main" }} />
					Moji treninzi
				</Typography>
				{renderSkeletonLoader()}
			</Box>
		);
	}

	if (workouts.length === 0) {
		return (
			<Box>
				<Typography
					variant="h5"
					gutterBottom
					sx={{ mb: 3, display: "flex", alignItems: "center" }}
				>
					<FitnessCenter sx={{ mr: 1, color: "primary.main" }} />
					Moji treninzi
				</Typography>

				{/* Status Alert */}
				{hasActivePlan && (
					<Alert severity="success" sx={{ mb: 2 }} icon={<Timeline />}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								flexWrap: "wrap",
								gap: 1,
							}}
						>
							<Box>
								<Typography variant="subtitle2" fontWeight="bold">
									Aktivan plan: {activePlan?.name}
								</Typography>
								<Typography variant="body2">
									Startovao:{" "}
									{activePlan?.startDate
										? formatDate(activePlan.startDate)
										: "N/A"}
								</Typography>
							</Box>
							{onCreateWorkout && (
								<Button
									variant="contained"
									size="small"
									startIcon={<Add />}
									onClick={onCreateWorkout}
									sx={{
										bgcolor: "success.main",
										"&:hover": { bgcolor: "success.dark" },
									}}
								>
									Dodaj trening
								</Button>
							)}
						</Box>
					</Alert>
				)}

				{renderEmptyState()}
			</Box>
		);
	}

	// Regular workout list when there are workouts
	return (
		<>
			<Box>
				<WorkoutStatisticsDashboard />
				{/* Header with improved spacing */}
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
						<FitnessCenter sx={{ mr: 1, color: "primary.main" }} />
						Moji treninzi ({filteredAndSortedWorkouts.length})
					</Typography>

					<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
						{onCreateWorkout && hasActivePlan && (
							<Button
								variant="contained"
								startIcon={<Add />}
								onClick={onCreateWorkout}
								size={isMobile ? "small" : "medium"}
							>
								Dodaj trening
							</Button>
						)}
						<IconButton
							onClick={() => setShowFilters(!showFilters)}
							color={showFilters ? "primary" : "default"}
							aria-label="Prikaži filtere"
						>
							<FilterList />
						</IconButton>
					</Box>
				</Box>

				{/* Active Plan Info */}
				{hasActivePlan && (
					<Alert severity="info" sx={{ mb: 2 }}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								flexWrap: "wrap",
								gap: 1,
							}}
						>
							<Box>
								<Typography variant="subtitle2" fontWeight="bold">
									Aktivni plan: {activePlan?.name}
								</Typography>
								<Typography variant="body2">
									{activePlan?.description || "Nema opisa"}
								</Typography>
							</Box>
							<Chip
								label="AKTIVAN"
								color="success"
								size="small"
								icon={<Timeline />}
							/>
						</Box>
					</Alert>
				)}

				{/* Enhanced Filters Toolbar */}
				<Collapse in={showFilters} timeout={300}>
					<Card sx={{ mb: 3, border: "1px solid", borderColor: "divider" }}>
						<CardContent>
							<Grid container spacing={2} alignItems="center">
								{/* Search */}
								<Grid size={{ xs: 12, sm: 6, md: 4 }}>
									<TextField
										fullWidth
										size="small"
										placeholder="Pretražite treninge..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<Search sx={{ color: "text.secondary" }} />
												</InputAdornment>
											),
										}}
										aria-label="Pretražite treninge"
									/>
								</Grid>

								{/* Filter */}
								<Grid size={{ xs: 12, sm: 6, md: 4 }}>
									<FormControl fullWidth size="small">
										<InputLabel>Filter</InputLabel>
										<Select
											value={filterBy}
											label="Filter"
											onChange={(e) =>
												setFilterBy(e.target.value as FilterOption)
											}
										>
											<MenuItem value="all">Sve</MenuItem>
											<Divider />
											<MenuItem value="push">Push</MenuItem>
											<MenuItem value="pull">Pull</MenuItem>
											<MenuItem value="legs">Legs</MenuItem>
											<MenuItem value="upper">Upper</MenuItem>
											<MenuItem value="lower">Lower</MenuItem>
											<MenuItem value="full-body">Full Body</MenuItem>
											<MenuItem value="cardio">Cardio</MenuItem>
											<MenuItem value="other">Ostalo</MenuItem>
											<Divider />
											<MenuItem value="synced">Sinhronizovano</MenuItem>
											<MenuItem value="offline">Offline</MenuItem>
										</Select>
									</FormControl>
								</Grid>

								{/* Sort */}
								<Grid size={{ xs: 12, sm: 12, md: 4 }}>
									<FormControl fullWidth size="small">
										<InputLabel>Sortiraj</InputLabel>
										<Select
											value={sortBy}
											label="Sortiraj"
											onChange={(e) => setSortBy(e.target.value as SortOption)}
											startAdornment={
												<Sort sx={{ mr: 1, color: "text.secondary" }} />
											}
										>
											<MenuItem value="date-desc">Datum (najnoviji)</MenuItem>
											<MenuItem value="date-asc">Datum (najstariji)</MenuItem>
											<MenuItem value="type">Tip treninga</MenuItem>
											<MenuItem value="exercises">Broj vježbi</MenuItem>
											<MenuItem value="sets">Broj setova</MenuItem>
										</Select>
									</FormControl>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				</Collapse>

				{/* Enhanced Workout List */}
				<Stack spacing={1}>
					{filteredAndSortedWorkouts.map((workout, index) => (
						<Fade in timeout={300 + index * 100} key={workout._id}>
							<Card
								sx={{
									border: "1px solid",
									borderColor: "divider",
									transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
									"&:hover": {
										boxShadow: 6,
										transform: "translateY(-4px)",
										borderColor: "primary.light",
									},
									position: "relative",
									overflow: "hidden",
								}}
							>
								{/* Mobile swipe indicators */}
								{isMobile && (
									<>
										<Box
											sx={{
												position: "absolute",
												top: 0,
												left: 0,
												height: "100%",
												width: 4,
												background:
													"linear-gradient(90deg, transparent, rgba(25,118,210,0.1))",
												display: "flex",
												alignItems: "center",
												pl: 1,
												opacity: 0.7,
											}}
										>
											<SwipeRight
												sx={{ fontSize: 16, color: "primary.main" }}
											/>
										</Box>
										<Box
											sx={{
												position: "absolute",
												top: 0,
												right: 0,
												height: "100%",
												width: 4,
												background:
													"linear-gradient(270deg, transparent, rgba(211,47,47,0.1))",
												display: "flex",
												alignItems: "center",
												pr: 1,
												opacity: 0.7,
											}}
										>
											<SwipeLeft sx={{ fontSize: 16, color: "error.main" }} />
										</Box>
									</>
								)}

								<Accordion
									expanded={expandedWorkouts.includes(workout._id || "")}
									onChange={() => toggleAccordion(workout._id || "")}
									sx={{
										boxShadow: "none",
										"&.Mui-expanded": {
											margin: 0,
										},
									}}
									TransitionProps={{
										timeout: 400,
									}}
								>
									<AccordionSummary
										expandIcon={
											<ExpandMore
												sx={{
													transition: "transform 0.3s",
													transform: expandedWorkouts.includes(
														workout._id || ""
													)
														? "rotate(180deg)"
														: "rotate(0deg)",
												}}
											/>
										}
									>
										<Grid container alignItems="center" spacing={2}>
											<Grid size={{ xs: 12, sm: 6, md: 3 }}>
												<Box
													sx={{ display: "flex", alignItems: "center", gap: 1 }}
												>
													<CalendarToday
														sx={{ fontSize: 18, color: "text.secondary" }}
													/>
													<Typography
														variant="subtitle1"
														fontWeight="bold"
														sx={{
															color: expandedWorkouts.includes(
																workout._id || ""
															)
																? "primary.main"
																: "inherit",
															transition: "color 0.3s",
														}}
													>
														{formatDate(workout.date)}
													</Typography>
												</Box>
											</Grid>

											<Grid size={{ xs: 12, sm: 6, md: 2 }}>
												<Zoom in timeout={500}>
													<Chip
														label={workout.type.toUpperCase()}
														color={getWorkoutTypeColor(workout.type)}
														variant="filled"
														size="small"
														sx={{
															fontWeight: "bold",
															"&:hover": {
																transform: "scale(1.05)",
																transition: "transform 0.2s",
															},
														}}
													/>
												</Zoom>
											</Grid>

											<Grid size={{ xs: 12, md: 6 }}>
												<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
													<Chip
														icon={<FitnessCenter />}
														label={`${workout.exercises.length} vježbi`}
														size="small"
														variant="outlined"
														sx={{
															transition: "all 0.2s",
															"&:hover": { backgroundColor: "primary.50" },
														}}
													/>
													<Chip
														icon={<Repeat />}
														label={`${getTotalSets(workout)} setova`}
														size="small"
														variant="outlined"
														sx={{
															transition: "all 0.2s",
															"&:hover": { backgroundColor: "secondary.50" },
														}}
													/>
													{getTotalWeight(workout) > 0 && (
														<Chip
															icon={<MonitorWeight />}
															label={`${getTotalWeight(workout)}kg`}
															size="small"
															variant="outlined"
															color="success"
															sx={{
																transition: "all 0.2s",
																"&:hover": { backgroundColor: "success.50" },
															}}
														/>
													)}
												</Box>
											</Grid>

											<Grid size={{ xs: 12, md: 6 }}>
												<Box
													sx={{ display: "flex", alignItems: "center", gap: 1 }}
												>
													{workout.synced ? (
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 0.5,
															}}
														>
															<CloudDone
																sx={{
																	color: "success.main",
																	fontSize: 18,
																	animation: "pulse 2s infinite",
																}}
															/>
															{!isMobile && (
																<Typography
																	variant="caption"
																	color="success.main"
																>
																	Synced
																</Typography>
															)}
														</Box>
													) : (
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 0.5,
															}}
														>
															<CloudOff
																sx={{
																	color: "warning.main",
																	fontSize: 18,
																	animation: "pulse 2s infinite",
																}}
															/>
															{!isMobile && (
																<Typography
																	variant="caption"
																	color="warning.main"
																>
																	Offline
																</Typography>
															)}
														</Box>
													)}
												</Box>
											</Grid>

											<Grid size={{ xs: 12, sm: 12, md: 2 }}>
												<Box
													sx={{
														display: "flex",
														gap: 1,
														justifyContent: "flex-end",
													}}
												>
													<IconButton
														size="small"
														onClick={(e) => {
															e.stopPropagation();
															onEdit(workout);
														}}
														color="primary"
														aria-label={`Uredi trening od ${formatDate(
															workout.date
														)}`}
														sx={{
															transition: "all 0.2s",
															"&:hover": {
																backgroundColor: "primary.100",
																transform: "scale(1.1)",
															},
														}}
													>
														<Edit />
													</IconButton>
													<IconButton
														size="small"
														onClick={(e) => {
															e.stopPropagation();
															handleDeleteClick(workout);
														}}
														color="error"
														aria-label={`Obriši trening od ${formatDate(
															workout.date
														)}`}
														sx={{
															transition: "all 0.2s",
															"&:hover": {
																backgroundColor: "error.100",
																transform: "scale(1.1)",
															},
														}}
													>
														<Delete />
													</IconButton>
												</Box>
											</Grid>
										</Grid>
									</AccordionSummary>

									<AccordionDetails>
										<Divider sx={{ mb: 2 }} />

										{workout.notes && (
											<Fade in timeout={600}>
												<Box sx={{ mb: 3 }}>
													<Typography
														variant="subtitle2"
														gutterBottom
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
														}}
													>
														<Notes sx={{ fontSize: 18 }} />
														Napomene
													</Typography>
													<Typography
														variant="body2"
														sx={{
															backgroundColor: "grey.50",
															p: 2,
															borderRadius: 2,
															fontStyle: "italic",
															border: "1px solid",
															borderColor: "grey.200",
														}}
													>
														{workout.notes}
													</Typography>
												</Box>
											</Fade>
										)}

										<Typography
											variant="subtitle1"
											gutterBottom
											fontWeight="bold"
											sx={{ mb: 2 }}
										>
											Vježbe:
										</Typography>

										<Stack spacing={2}>
											{workout.exercises.map((exercise, exerciseIndex) => (
												<Fade
													in
													timeout={800 + exerciseIndex * 200}
													key={exerciseIndex}
												>
													<Card
														variant="outlined"
														sx={{
															transition: "all 0.2s",
															"&:hover": {
																boxShadow: 2,
																borderColor: "primary.200",
															},
														}}
													>
														<CardContent sx={{ pb: "16px !important" }}>
															<Typography
																variant="subtitle2"
																gutterBottom
																fontWeight="bold"
															>
																{exercise.name}
															</Typography>

															<Grid container spacing={1} sx={{ mb: 1 }}>
																{exercise.sets.map((set, setIndex) => (
																	<Grid key={setIndex}>
																		<Zoom in timeout={1000 + setIndex * 100}>
																			<Chip
																				label={`${set.reps}${
																					set.weight ? ` × ${set.weight}kg` : ""
																				} | ${set.rest}s`}
																				size="small"
																				variant="outlined"
																				sx={{
																					backgroundColor: "primary.50",
																					borderColor: "primary.200",
																					transition: "all 0.2s",
																					"&:hover": {
																						backgroundColor: "primary.100",
																						transform: "scale(1.05)",
																					},
																				}}
																			/>
																		</Zoom>
																	</Grid>
																))}
															</Grid>

															<Typography
																variant="caption"
																sx={{
																	display: "block",
																	color: "text.secondary",
																	mt: 1,
																}}
															>
																Ukupno:{" "}
																<strong>
																	{exercise.sets.reduce(
																		(total, set) => total + Number(set.reps),
																		0
																	)}{" "}
																	ponavljanja
																</strong>{" "}
																u <strong>{exercise.sets.length} setova</strong>
																{exercise.sets.some((set) => set.weight) && (
																	<>
																		{" • "}
																		<strong>
																			{exercise.sets.reduce(
																				(total, set) =>
																					total + (Number(set.weight) || 0),
																				0
																			)}
																			kg ukupno
																		</strong>
																	</>
																)}
															</Typography>
														</CardContent>
													</Card>
												</Fade>
											))}
										</Stack>

										<Fade in timeout={1200}>
											<Box
												sx={{
													mt: 3,
													p: 2,
													backgroundColor: "grey.50",
													borderRadius: 2,
													border: "1px solid",
													borderColor: "grey.200",
												}}
											>
												<Grid container spacing={2}>
													<Grid size={{ xs: 12, md: 3 }}>
														<Typography variant="caption" color="textSecondary">
															Ukupno vježbi
														</Typography>
														<Typography
															variant="h6"
															color="primary"
															fontWeight="bold"
														>
															{workout.exercises.length}
														</Typography>
													</Grid>
													<Grid size={{ xs: 6, sm: 3 }}>
														<Typography variant="caption" color="textSecondary">
															Ukupno setova
														</Typography>
														<Typography
															variant="h6"
															color="primary"
															fontWeight="bold"
														>
															{getTotalSets(workout)}
														</Typography>
													</Grid>
													<Grid size={{ xs: 6, sm: 3 }}>
														<Typography variant="caption" color="textSecondary">
															Ukupno ponavljanja
														</Typography>
														<Typography
															variant="h6"
															color="primary"
															fontWeight="bold"
														>
															{getTotalReps(workout)}
														</Typography>
													</Grid>
													{getTotalWeight(workout) > 0 && (
														<Grid size={{ xs: 6, sm: 3 }}>
															<Typography
																variant="caption"
																color="textSecondary"
															>
																Ukupna težina
															</Typography>
															<Typography
																variant="h6"
																color="success.main"
																fontWeight="bold"
																sx={{
																	display: "flex",
																	alignItems: "center",
																	gap: 0.5,
																}}
															>
																<MonitorWeight sx={{ fontSize: 20 }} />
																{getTotalWeight(workout)}kg
															</Typography>
														</Grid>
													)}
													<Grid size={{ xs: 6, sm: 3 }}>
														<Typography variant="caption" color="textSecondary">
															Status
														</Typography>
														<Typography
															variant="body2"
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 0.5,
																fontWeight: "medium",
															}}
														>
															{workout.synced ? (
																<>
																	<CloudDone
																		sx={{ fontSize: 16, color: "success.main" }}
																	/>
																	Sinhronizovano
																</>
															) : (
																<>
																	<CloudOff
																		sx={{ fontSize: 16, color: "warning.main" }}
																	/>
																	Offline
																</>
															)}
														</Typography>
													</Grid>
												</Grid>
											</Box>
										</Fade>
									</AccordionDetails>
								</Accordion>
							</Card>
						</Fade>
					))}
				</Stack>

				{/* No results message */}
				{filteredAndSortedWorkouts.length === 0 && !isLoading && (
					<Fade in timeout={500}>
						<Card
							sx={{
								textAlign: "center",
								py: 4,
								mt: 2,
								border: "1px solid",
								borderColor: "divider",
							}}
						>
							<CardContent>
								<Search sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
								<Typography variant="h6" color="textSecondary" gutterBottom>
									Nema rezultata
								</Typography>
								<Typography variant="body2" color="textSecondary">
									Pokušajte sa drugim terminima za pretragu ili filtere.
								</Typography>
							</CardContent>
						</Card>
					</Fade>
				)}
			</Box>

			{/* Enhanced Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialog.open}
				onClose={() =>
					!isDeleting && setDeleteDialog({ open: false, workout: null })
				}
				maxWidth="sm"
				fullWidth
				fullScreen={isMobile}
				PaperProps={{
					sx: {
						borderRadius: isMobile ? 0 : 3,
					},
				}}
			>
				<DialogTitle sx={{ pb: 1 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Delete color="error" />
						Brisanje treninga
					</Box>
				</DialogTitle>
				<DialogContent>
					<Alert
						severity="warning"
						sx={{
							mb: 2,
							borderRadius: 2,
						}}
					>
						Ova akcija se ne može opozvati!
					</Alert>
					<Typography sx={{ mb: 2 }}>
						Da li ste sigurni da želite da obrišete trening od{" "}
						<Typography component="span" fontWeight="bold" color="primary">
							{deleteDialog.workout
								? formatDate(deleteDialog.workout.date)
								: ""}
						</Typography>
						?
					</Typography>
					{deleteDialog.workout && (
						<Card
							variant="outlined"
							sx={{
								backgroundColor: "grey.50",
								borderRadius: 2,
							}}
						>
							<CardContent sx={{ py: 2 }}>
								<Grid container spacing={1}>
									<Grid size={{ xs: 6 }}>
										<Typography variant="body2">
											<Typography component="span" fontWeight="medium">
												Tip:
											</Typography>{" "}
											{deleteDialog.workout.type}
										</Typography>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<Typography variant="body2">
											<Typography component="span" fontWeight="medium">
												Vježbe:
											</Typography>{" "}
											{deleteDialog.workout.exercises.length}
										</Typography>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<Typography variant="body2">
											<Typography component="span" fontWeight="medium">
												Setovi:
											</Typography>{" "}
											{getTotalSets(deleteDialog.workout)}
										</Typography>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<Typography variant="body2">
											<Typography component="span" fontWeight="medium">
												Ponavljanja:
											</Typography>{" "}
											{getTotalReps(deleteDialog.workout)}
										</Typography>
									</Grid>
									{getTotalWeight(deleteDialog.workout) > 0 && (
										<Grid size={{ xs: 12, md: 6 }}>
											<Typography variant="body2">
												<Typography component="span" fontWeight="medium">
													Ukupna težina:
												</Typography>{" "}
												{getTotalWeight(deleteDialog.workout)}kg
											</Typography>
										</Grid>
									)}
								</Grid>
							</CardContent>
						</Card>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						onClick={() => setDeleteDialog({ open: false, workout: null })}
						disabled={isDeleting}
						sx={{ borderRadius: 2 }}
						fullWidth={isMobile}
					>
						Otkaži
					</Button>
					<Button
						onClick={handleDeleteConfirm}
						color="error"
						variant="contained"
						disabled={isDeleting}
						startIcon={isDeleting ? <CircularProgress size={16} /> : <Delete />}
						sx={{ borderRadius: 2 }}
						fullWidth={isMobile}
					>
						{isDeleting ? "Brišem..." : "Obriši"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* CSS Animations */}
			<style jsx>{`
				@keyframes pulse {
					0%,
					100% {
						opacity: 1;
					}
					50% {
						opacity: 0.5;
					}
				}
			`}</style>
		</>
	);
};

export default WorkoutList;
