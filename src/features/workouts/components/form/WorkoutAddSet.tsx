"use client";

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
} from "@mui/material";
import {
	Add,
	Delete,
	Repeat,
	MonitorWeight,
	Timer,
	FitnessCenter,
	PlayArrow,
} from "@mui/icons-material";

interface Set {
	reps: string;
	weight?: string;
	rest?: string;
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
		field: "reps" | "weight" | "rest",
		value: string
	) => void;
	removeSet: (exerciseIndex: number, setIndex: number) => void;
}

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
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);

	// Kreiranje beep zvuka
	const createBeep = () => {
		if (!audioContextRef.current) {
			const AudioCtx =
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
					return 0;
				}

				// Beep za poslednje 3 sekunde
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
					const isLastSet = setIndex === exercise.sets.length - 1;
					const isCompleted = !isLastSet;

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
									justifyContent: "space-between",
									mb: 2,
								}}
							>
								<Chip
									label={`Set ${setIndex + 1}`}
									size="small"
									color={isCompleted ? "success" : "primary"}
									icon={<FitnessCenter />}
									variant={isCompleted ? "filled" : "filled"}
								/>
								{isCompleted && (
									<Chip
										label="Završeno"
										size="small"
										color="success"
										variant="outlined"
									/>
								)}
								{isLastSet && exercise.sets.length > 1 && (
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

							<Grid container spacing={2} alignItems="center">
								<Grid size={{ xs: 12, sm: 4 }}>
									<TextField
										fullWidth
										type="number"
										label="Ponavljanja"
										value={set.reps || ""}
										onChange={(e) =>
											updateSet(exerciseIndex, setIndex, "reps", e.target.value)
										}
										inputProps={{ min: 0 }}
										size="small"
										required
										disabled={isCompleted}
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

								<Grid size={{ xs: 12, sm: 4 }}>
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
										disabled={isCompleted}
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

								<Grid size={{ xs: 12, sm: 4 }}>
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
											disabled={isCompleted}
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
										{isLastSet && set.rest && parseInt(set.rest) > 0 && (
											<Tooltip title="Pokreni timer">
												<Box sx={{ position: "relative" }}>
													<IconButton
														size="small"
														onClick={() =>
															startTimer(setIndex, parseInt(set.rest || "0"))
														}
														disabled={activeTimer !== null}
														color="primary"
														sx={{
															backgroundColor: "primary.50",
															"&:hover": { backgroundColor: "primary.100" },
															"&:disabled": { backgroundColor: "grey.200" },
														}}
													>
														<PlayArrow fontSize="small" />
													</IconButton>
													{activeTimer === setIndex && isLastSet && (
														<CircularProgress
															size={32}
															value={
																((parseInt(set.rest) - timeLeft) /
																	parseInt(set.rest)) *
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
										{set.reps} ponavljanja
										{set.weight && ` × ${set.weight}kg`}
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
