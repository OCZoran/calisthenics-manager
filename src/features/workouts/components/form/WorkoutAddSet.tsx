import React, { useState, useEffect, useRef } from "react";
import {
	Box,
	Grid,
	TextField,
	IconButton,
	Button,
	Paper,
	InputAdornment,
	Typography,
	Tooltip,
	Chip,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Tabs,
	Tab,
	Switch,
	FormControlLabel,
} from "@mui/material";
import {
	Add,
	Delete,
	Repeat,
	MonitorWeight,
	Timer,
	FitnessCenter,
	PlayArrow,
	AccessTime,
	CheckCircle,
	FiberManualRecord,
	Whatshot,
	Edit,
} from "@mui/icons-material";

interface WorkoutSet {
	reps: string;
	weight?: string;
	rest?: string;
	hold?: string;
	band?: string;
	isMax?: boolean;
}

interface Exercise {
	name: string;
	sets: WorkoutSet[];
}

interface WorkoutAddSetProps {
	exercise: Exercise;
	exerciseIndex: number;
	isMobile?: boolean;
	addSet: (exerciseIndex: number) => void;
	updateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: "reps" | "weight" | "rest" | "hold" | "band" | "isMax",
		value: string | boolean
	) => void;
	removeSet: (exerciseIndex: number, setIndex: number) => void;
}

const BAND_OPTIONS = [
	{ value: "", label: "Bez trake", color: "#9E9E9E" },
	{ value: "green", label: "Zelena ", color: "#4CAF50" },
	{ value: "red", label: "Crvena ", color: "#F44336" },
	{ value: "black", label: "Crna ", color: "#212121" },
];

export const getBandColor = (band: string) => {
	return BAND_OPTIONS.find((b) => b.value === band)?.color || "#9E9E9E";
};

export const getBandLabel = (band: string) => {
	return BAND_OPTIONS.find((b) => b.value === band)?.label || "Bez trake";
};

const WorkoutAddSet: React.FC<WorkoutAddSetProps> = ({
	exercise,
	exerciseIndex,
	isMobile = false,
	addSet,
	updateSet,
	removeSet,
}) => {
	const [activeTimer, setActiveTimer] = useState<number | null>(null);
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());
	const [currentTab, setCurrentTab] = useState(0);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);

	const createBeep = () => {
		if (!audioContextRef.current) {
			audioContextRef.current = new (window.AudioContext ||
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(window as any).webkitAudioContext)();
		}

		const ctx = audioContextRef.current;
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);

		oscillator.frequency.setValueAtTime(800, ctx.currentTime);
		oscillator.type = "sine";

		gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

		oscillator.start(ctx.currentTime);
		oscillator.stop(ctx.currentTime + 0.2);
	};

	const startTimer = (setIndex: number, seconds: number) => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		setActiveTimer(setIndex);
		setTimeLeft(seconds);

		intervalRef.current = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(intervalRef.current!);
					setActiveTimer(null);
					setCompletedSets((prevCompleted: Set<number>) =>
						new Set(prevCompleted).add(setIndex)
					);
					return 0;
				}

				if (prev <= 4 && prev > 1) {
					createBeep();
				}

				return prev - 1;
			});
		}, 1000);
	};

	useEffect(() => {
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (currentTab >= exercise.sets.length) {
			setCurrentTab(exercise.sets.length - 1);
		}
	}, [exercise.sets.length, currentTab]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const isHoldSet = (s: WorkoutSet) => {
		return s.hold && String(s.hold).trim() !== "";
	};

	const handleAddSet = () => {
		addSet(exerciseIndex);
		setTimeout(() => {
			setCurrentTab(exercise.sets.length);
		}, 50);
	};

	const handleRemoveSet = (setIndex: number) => {
		removeSet(exerciseIndex, setIndex);
		if (currentTab >= exercise.sets.length - 1 && currentTab > 0) {
			setCurrentTab(currentTab - 1);
		}
	};

	return (
		<Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<Typography variant="subtitle1" fontWeight="medium">
					Setovi ({exercise.sets.length})
				</Typography>
				<Button
					size="small"
					variant="outlined"
					startIcon={<Add />}
					onClick={handleAddSet}
					sx={{ borderRadius: 2 }}
				>
					Dodaj set
				</Button>
			</Box>

			<Paper sx={{ mb: 2, borderRadius: 2 }}>
				<Tabs
					value={currentTab}
					onChange={(_, newValue) => setCurrentTab(newValue)}
					variant="scrollable"
					scrollButtons="auto"
					sx={{
						borderBottom: 1,
						borderColor: "divider",
						"& .MuiTab-root": {
							minWidth: isMobile ? 80 : 120,
							fontWeight: 600,
						},
					}}
				>
					{exercise.sets.map((set, setIndex) => {
						const isCompleted = completedSets.has(setIndex);
						const holdMode = isHoldSet(set);
						const isMaxEffort = set.isMax === true;

						return (
							<Tab
								key={setIndex}
								label={
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<Typography variant="body2" fontWeight="inherit">
											Set {setIndex + 1}
										</Typography>
										{isMaxEffort && (
											<Whatshot sx={{ fontSize: 16, color: "error.main" }} />
										)}
										{isCompleted && (
											<CheckCircle
												sx={{ fontSize: 16, color: "success.main" }}
											/>
										)}
										{holdMode && (
											<AccessTime
												sx={{ fontSize: 16, color: "secondary.main" }}
											/>
										)}
										{set.band && (
											<FiberManualRecord
												sx={{
													fontSize: 12,
													color: getBandColor(set.band),
												}}
											/>
										)}
									</Box>
								}
								sx={{
									backgroundColor: isMaxEffort
										? "error.50"
										: isCompleted
										? "success.50"
										: "transparent",
									"&.Mui-selected": {
										backgroundColor: isMaxEffort
											? "error.100"
											: isCompleted
											? "success.100"
											: "primary.50",
									},
								}}
							/>
						);
					})}
				</Tabs>
			</Paper>

			{exercise.sets.map((set, setIndex) => {
				if (setIndex !== currentTab) return null;

				const isCompleted = completedSets.has(setIndex);
				const holdMode = isHoldSet(set);
				const isMaxEffort = set.isMax === true;
				const hasRestTime = set.rest && parseInt(set.rest) > 0;
				const hasValidData =
					(set.reps && parseInt(set.reps) > 0) ||
					(set.hold && parseInt(set.hold) > 0) ||
					isMaxEffort;

				const showTimerButton = hasRestTime && !isCompleted;
				const canStartTimer = hasRestTime && hasValidData && !isCompleted;

				return (
					<Paper
						key={setIndex}
						sx={{
							p: 2.5,
							backgroundColor: isMaxEffort
								? "error.50"
								: isCompleted
								? "success.50"
								: "grey.50",
							border: "2px solid",
							borderColor: isMaxEffort
								? "error.300"
								: isCompleted
								? "success.200"
								: "grey.200",
							borderRadius: 2,
							opacity: isCompleted ? 0.8 : 1,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								mb: 2,
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									flexWrap: "wrap",
								}}
							>
								<Chip
									label={`Set ${setIndex + 1}`}
									size="small"
									color={
										isMaxEffort ? "error" : isCompleted ? "success" : "primary"
									}
									icon={<FitnessCenter />}
									variant="filled"
								/>
								{isMaxEffort && (
									<Chip
										label="MAX EFFORT"
										size="small"
										color="error"
										icon={<Whatshot />}
										variant="filled"
									/>
								)}
								{holdMode && (
									<Chip
										label="Hold"
										size="small"
										color="secondary"
										icon={<AccessTime />}
										variant="outlined"
									/>
								)}
								{set.band && (
									<Chip
										label={getBandLabel(set.band)}
										size="small"
										icon={<FiberManualRecord />}
										sx={{
											backgroundColor: getBandColor(set.band),
											color: "white",
											"& .MuiChip-icon": { color: "white" },
										}}
									/>
								)}
								{isCompleted && (
									<Chip
										label="Završeno"
										size="small"
										color="success"
										icon={<CheckCircle />}
										variant="filled"
									/>
								)}
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								{isCompleted && (
									<Tooltip title="Omogući izmjenu">
										<IconButton
											size="small"
											onClick={() => {
												setCompletedSets((prev) => {
													const newSet = new Set(prev);
													newSet.delete(setIndex);
													return newSet;
												});
											}}
											color="warning"
											sx={{
												backgroundColor: "warning.50",
												"&:hover": { backgroundColor: "warning.100" },
											}}
										>
											<Edit fontSize="small" />
										</IconButton>
									</Tooltip>
								)}
								{exercise.sets.length > 1 && (
									<Tooltip title="Ukloni set">
										<IconButton
											size="small"
											onClick={() => handleRemoveSet(setIndex)}
											color="error"
											sx={{
												backgroundColor: "error.50",
												"&:hover": { backgroundColor: "error.100" },
											}}
										>
											<Delete fontSize="small" />
										</IconButton>
									</Tooltip>
								)}
							</Box>
						</Box>

						{/* MAX EFFORT Toggle */}
						<Box sx={{ mb: 2 }}>
							<FormControlLabel
								control={
									<Switch
										checked={isMaxEffort}
										onChange={(e) =>
											updateSet(
												exerciseIndex,
												setIndex,
												"isMax",
												e.target.checked
											)
										}
										color="error"
									/>
								}
								label={
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<Whatshot
											sx={{
												fontSize: 18,
												color: isMaxEffort ? "error.main" : "text.secondary",
											}}
										/>
										<Typography
											variant="body2"
											fontWeight={isMaxEffort ? "bold" : "normal"}
										>
											Max Effort (Do otkaza)
										</Typography>
									</Box>
								}
							/>
							{isMaxEffort && (
								<Typography
									variant="caption"
									color="error.main"
									sx={{ ml: 4, display: "block" }}
								>
									Set izveden do maksimalnog zamora
								</Typography>
							)}
						</Box>

						<Grid container spacing={2} alignItems="center">
							<Grid size={{ xs: 6 }}>
								<TextField
									fullWidth
									type="number"
									label={isMaxEffort ? "Max Hold (s)" : "Hold (s)"}
									value={set.hold || ""}
									onChange={(e) =>
										updateSet(exerciseIndex, setIndex, "hold", e.target.value)
									}
									inputProps={{ min: 0 }}
									size="small"
									disabled={isCompleted && !activeTimer}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<AccessTime
													sx={{ fontSize: 18, color: "text.secondary" }}
												/>
											</InputAdornment>
										),
									}}
									sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
								/>
							</Grid>

							{!holdMode && (
								<Grid size={{ xs: 6 }}>
									<TextField
										fullWidth
										type="number"
										label={isMaxEffort ? "Max Reps" : "Ponavljanja"}
										value={set.reps || ""}
										onChange={(e) =>
											updateSet(exerciseIndex, setIndex, "reps", e.target.value)
										}
										inputProps={{ min: 0 }}
										size="small"
										disabled={isCompleted && !activeTimer}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<Repeat
														sx={{ fontSize: 18, color: "text.secondary" }}
													/>
												</InputAdornment>
											),
										}}
										sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
									/>
								</Grid>
							)}

							<Grid size={{ xs: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Težina (kg)"
									value={set.weight || ""}
									onChange={(e) =>
										updateSet(exerciseIndex, setIndex, "weight", e.target.value)
									}
									inputProps={{ min: 0, step: "0.5" }}
									size="small"
									disabled={isCompleted && !activeTimer}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<MonitorWeight
													sx={{ fontSize: 18, color: "text.secondary" }}
												/>
											</InputAdornment>
										),
									}}
									sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
								/>
							</Grid>

							<Grid size={{ xs: 6 }}>
								<FormControl fullWidth size="small">
									<InputLabel>Traka</InputLabel>
									<Select
										value={set.band || ""}
										onChange={(e) =>
											updateSet(exerciseIndex, setIndex, "band", e.target.value)
										}
										label="Traka"
										disabled={isCompleted && !activeTimer}
										sx={{ borderRadius: 2 }}
									>
										{BAND_OPTIONS.map((option) => (
											<MenuItem key={option.value} value={option.value}>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1,
													}}
												>
													<FiberManualRecord
														sx={{
															fontSize: 16,
															color: option.color,
														}}
													/>
													{option.label}
												</Box>
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<TextField
										fullWidth
										type="number"
										label="Odmor (s)"
										value={set.rest || ""}
										onChange={(e) =>
											updateSet(exerciseIndex, setIndex, "rest", e.target.value)
										}
										inputProps={{ min: 0 }}
										size="small"
										disabled={isCompleted && !activeTimer}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<Timer
														sx={{ fontSize: 18, color: "text.secondary" }}
													/>
												</InputAdornment>
											),
										}}
										sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
									/>
									{showTimerButton && (
										<Tooltip
											title={
												canStartTimer
													? "Pokreni odmor"
													: "Unesite broj ponavljanja, hold vrijeme ili označite Max Effort"
											}
										>
											<IconButton
												size="small"
												onClick={() =>
													startTimer(setIndex, parseInt(set.rest || "0"))
												}
												disabled={!canStartTimer || activeTimer !== null}
												color="primary"
												sx={{
													backgroundColor: canStartTimer
														? "primary.50"
														: "grey.100",
													"&:hover": {
														backgroundColor: canStartTimer
															? "primary.100"
															: "grey.200",
													},
													"&:disabled": { backgroundColor: "grey.200" },
												}}
											>
												<PlayArrow fontSize="small" />
											</IconButton>
										</Tooltip>
									)}
									{!isCompleted && (
										<Tooltip title="Označi set kao završen">
											<IconButton
												size="small"
												onClick={() => {
													if (activeTimer === setIndex && intervalRef.current) {
														clearInterval(intervalRef.current);
														setActiveTimer(null);
													}
													setCompletedSets((prev) =>
														new Set(prev).add(setIndex)
													);
												}}
												color="success"
												sx={{
													backgroundColor: "success.50",
													"&:hover": { backgroundColor: "success.100" },
												}}
											>
												<CheckCircle fontSize="small" />
											</IconButton>
										</Tooltip>
									)}
								</Box>
							</Grid>
						</Grid>

						{activeTimer === setIndex && (
							<Box
								sx={{
									mt: 2,
									p: 1.5,
									backgroundColor: timeLeft <= 3 ? "error.50" : "primary.50",
									borderRadius: 2,
									textAlign: "center",
								}}
							>
								<Typography
									variant="h6"
									color={timeLeft <= 3 ? "error.main" : "primary.main"}
									fontWeight="bold"
								>
									{formatTime(timeLeft)}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Odmor u toku
								</Typography>
							</Box>
						)}
					</Paper>
				);
			})}
		</Box>
	);
};

export default WorkoutAddSet;
