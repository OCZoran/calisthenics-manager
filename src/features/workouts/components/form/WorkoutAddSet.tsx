/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import {
	Box,
	Grid,
	TextField,
	IconButton,
	Button,
	Stack,
	Paper,
	InputAdornment,
	Typography,
	Tooltip,
	Chip,
	CircularProgress,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
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
} from "@mui/icons-material";

interface Set {
	reps: string;
	weight?: string;
	rest?: string;
	hold?: string;
	band?: string;
}

interface Exercise {
	name: string;
	sets: Set[];
}

interface WorkoutAddSetProps {
	exercise: Exercise;
	exerciseIndex: number;
	isMobile?: boolean;
	addSet: (exerciseIndex: number) => void;
	updateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: "reps" | "weight" | "rest" | "hold" | "band",
		value: string
	) => void;
	removeSet: (exerciseIndex: number, setIndex: number) => void;
}

export const BAND_OPTIONS = [
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
	const [completedSets, setCompletedSets] = useState(new Set());
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);

	const createBeep = () => {
		if (!audioContextRef.current) {
			const AudioCtx =
				window.AudioContext || (window as any).webkitAudioContext;
			audioContextRef.current = new AudioCtx();
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
					setCompletedSets((prevCompleted: any) =>
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

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const isHoldSet = (set: Set) => {
		return set.hold && String(set.hold).trim() !== "";
	};

	return (
		<Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 3,
				}}
			>
				<Typography variant="subtitle1" fontWeight="medium">
					Setovi
				</Typography>
				<Button
					size="small"
					variant="outlined"
					startIcon={<Add />}
					onClick={() => addSet(exerciseIndex)}
					sx={{ borderRadius: 2 }}
				>
					Dodaj set
				</Button>
			</Box>

			<Stack spacing={2}>
				{exercise.sets.map((set, setIndex) => {
					const isCompleted = completedSets.has(setIndex);
					const holdMode = isHoldSet(set);
					const hasRestTime = set.rest && parseInt(set.rest) > 0;
					const hasValidData =
						(set.reps && parseInt(set.reps) > 0) ||
						(set.hold && parseInt(set.hold) > 0);

					const showTimerButton = hasRestTime && !isCompleted;
					const canStartTimer = hasRestTime && hasValidData && !isCompleted;

					return (
						<Paper
							key={setIndex}
							sx={{
								p: 2.5,
								backgroundColor: isCompleted ? "success.50" : "grey.50",
								border: "1px solid",
								borderColor: isCompleted ? "success.200" : "grey.200",
								borderRadius: 2,
								opacity: isCompleted ? 0.8 : 1,
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyAlignment: "space-between",
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
										color={isCompleted ? "success" : "primary"}
										icon={<FitnessCenter />}
										variant="filled"
									/>
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
									{exercise.sets.length > 1 && (
										<Tooltip title="Ukloni set">
											<IconButton
												size="small"
												onClick={() => removeSet(exerciseIndex, setIndex)}
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

							<Grid container spacing={2} alignItems="center">
								{/* Hold polje */}
								<Grid size={{ xs: 12, sm: holdMode ? 6 : 3 }}>
									<TextField
										fullWidth
										type="number"
										label="Hold (s)"
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

								{/* Ponavljanja */}
								{!holdMode && (
									<Grid size={{ xs: 12, sm: 3 }}>
										<TextField
											fullWidth
											type="number"
											label="Ponavljanja"
											value={set.reps || ""}
											onChange={(e) =>
												updateSet(
													exerciseIndex,
													setIndex,
													"reps",
													e.target.value
												)
											}
											inputProps={{ min: 0 }}
											size="small"
											required={!holdMode}
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

								{/* Težina */}
								<Grid size={{ xs: 12, sm: holdMode ? 3 : 3 }}>
									<TextField
										fullWidth
										type="number"
										label="Težina (kg)"
										value={set.weight || ""}
										onChange={(e) =>
											updateSet(
												exerciseIndex,
												setIndex,
												"weight",
												e.target.value
											)
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

								{/* NOVO: Band Selector */}
								<Grid size={{ xs: 12, sm: 3 }}>
									<FormControl fullWidth size="small">
										<InputLabel>Traka</InputLabel>
										<Select
											value={set.band || ""}
											onChange={(e) =>
												updateSet(
													exerciseIndex,
													setIndex,
													"band",
													e.target.value
												)
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

								{/* Odmor */}
								<Grid size={{ xs: 12, sm: 3 }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<TextField
											fullWidth
											type="number"
											label="Odmor (s)"
											value={set.rest || ""}
											onChange={(e) =>
												updateSet(
													exerciseIndex,
													setIndex,
													"rest",
													e.target.value
												)
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
														: "Unesite broj ponavljanja ili hold vrijeme da pokrenete timer"
												}
											>
												<Box sx={{ position: "relative" }}>
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
													{activeTimer === setIndex && (
														<CircularProgress
															size={32}
															value={
																((parseInt(set.rest as any) - timeLeft) /
																	parseInt(set.rest as any)) *
																100
															}
															variant="determinate"
															sx={{
																position: "absolute",
																top: 0,
																left: 0,
																color: "primary.main",
															}}
														/>
													)}
												</Box>
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

							{isMobile && (
								<Box
									sx={{
										mt: 2,
										pt: 2,
										borderTop: "1px solid",
										borderColor: "grey.300",
									}}
								>
									<Typography variant="caption" color="text.secondary">
										{holdMode ? `${set.hold}s hold` : `${set.reps} ponavljanja`}
										{set.weight && ` × ${set.weight}kg`}
										{set.band && ` • ${getBandLabel(set.band)}`}
										{set.rest && ` • ${set.rest}s odmor`}
									</Typography>
								</Box>
							)}
						</Paper>
					);
				})}
			</Stack>
		</Box>
	);
};

export default WorkoutAddSet;
