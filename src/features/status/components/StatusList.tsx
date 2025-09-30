/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
	Box,
	Typography,
	Card,
	CardContent,
	CardActions,
	Button,
	Chip,
	Grid,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Alert,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	InputAdornment,
	Collapse,
	List,
	ListItem,
	ListItemText,
} from "@mui/material";
import {
	EditOutlined,
	DeleteOutlined,
	HistoryOutlined,
	TrendingUp,
	SaveOutlined,
	CancelOutlined,
	FitnessCenter,
	Timer,
	Repeat,
	ExpandMore,
	ExpandLess,
} from "@mui/icons-material";
import { StatusEntry } from "../interfaces/status.interface";

interface StatusListProps {
	entries: any[];
	onEntryUpdated: (entry: StatusEntry) => void;
	onEntryDeleted: (exerciseName: string) => void;
}

const StatusList: React.FC<StatusListProps> = ({
	entries,
	onEntryUpdated,
	onEntryDeleted,
}) => {
	const [selectedEntry, setSelectedEntry] = useState<any>(null);
	const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
	const [updateForm, setUpdateForm] = useState({
		repetitions: "",
		weight: "",
		holdTime: "",
		unit: "kg" as "kg" | "lbs",
	});
	const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleUpdateEntry = (entry: any) => {
		setSelectedEntry(entry);
		setUpdateForm({
			repetitions: entry.repetitions?.toString() || "",
			weight: entry.weight?.toString() || "",
			holdTime: entry.holdTime?.toString() || "",
			unit: entry.unit || "kg",
		});
		setIsUpdateDialogOpen(true);
	};

	const handleDeleteEntry = (entry: any) => {
		setSelectedEntry(entry);
		setIsDeleteDialogOpen(true);
	};

	const handleViewHistory = (entry: any) => {
		setSelectedEntry(entry);
		setIsHistoryDialogOpen(true);
	};

	const handleConfirmUpdate = async () => {
		if (!selectedEntry) return;

		const hasReps = updateForm.repetitions.trim();
		const hasWeight = updateForm.weight.trim();
		const hasHold = updateForm.holdTime.trim();

		if (!hasReps && !hasWeight && !hasHold) {
			setError(
				"Morate uneti bar jedan od: ponavljanja, težina ili vreme držanja"
			);
			return;
		}

		if (hasHold && hasReps) {
			setError("Ne možete imati i ponavljanja i vreme držanja istovremeno");
			return;
		}

		setIsUpdating(true);
		setError(null);

		try {
			const requestBody = {
				repetitions: hasReps ? parseInt(updateForm.repetitions) : undefined,
				weight: hasWeight ? parseFloat(updateForm.weight) : undefined,
				holdTime: hasHold ? parseInt(updateForm.holdTime) : undefined,
				unit: updateForm.unit,
			};

			const response = await fetch(
				`/api/status?exerciseName=${selectedEntry.exerciseName}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestBody),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Greška pri ažuriranju status unosa"
				);
			}

			const updatedEntry = await response.json();
			onEntryUpdated(updatedEntry);
			setIsUpdateDialogOpen(false);
			setSelectedEntry(null);
		} catch (error) {
			console.error("Error updating status entry:", error);
			setError(
				error instanceof Error
					? error.message
					: "Greška pri ažuriranju status unosa"
			);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!selectedEntry) return;

		setIsDeleting(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/status?exerciseName=${selectedEntry.exerciseName}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri brisanju status unosa");
			}

			onEntryDeleted(selectedEntry.exerciseName);
			setIsDeleteDialogOpen(false);
			setSelectedEntry(null);
		} catch (error) {
			console.error("Error deleting status entry:", error);
			setError(
				error instanceof Error
					? error.message
					: "Greška pri brisanju status unosa"
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const toggleCardExpansion = (exerciseName: string) => {
		setExpandedCards((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(exerciseName)) {
				newSet.delete(exerciseName);
			} else {
				newSet.add(exerciseName);
			}
			return newSet;
		});
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("sr-RS", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getProgressIndicator = (history: StatusEntry[]) => {
		if (history.length < 2) return null;

		const latest = history[0];
		const previous = history[1];

		let improvement = false;
		let changeText = "";

		if (latest.repetitions && previous.repetitions) {
			improvement = latest.repetitions > previous.repetitions;
			changeText = `${improvement ? "+" : ""}${
				latest.repetitions - previous.repetitions
			} ponavljanja`;
		} else if (latest.weight && previous.weight) {
			improvement = latest.weight > previous.weight;
			changeText = `${improvement ? "+" : ""}${(
				latest.weight - previous.weight
			).toFixed(1)} ${latest.unit}`;
		} else if (latest.holdTime && previous.holdTime) {
			improvement = latest.holdTime > previous.holdTime;
			changeText = `${improvement ? "+" : ""}${
				latest.holdTime - previous.holdTime
			}s`;
		}

		return { improvement, changeText };
	};

	if (entries.length === 0) {
		return (
			<Box sx={{ textAlign: "center", py: 8 }}>
				<FitnessCenter sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
				<Typography variant="h5" gutterBottom fontWeight="bold">
					Nema status unosa
				</Typography>
				<Typography variant="body1" color="textSecondary">
					Dodajte svoj prvi status na kartici Dodaj status
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<FitnessCenter sx={{ mr: 2, color: "primary.main" }} />
				<Typography variant="h5" component="h2" fontWeight="600">
					Moj trenutni status ({entries.length} vežbi)
				</Typography>
			</Box>

			<Grid container spacing={3}>
				{entries.map((entry) => {
					const progress = getProgressIndicator(entry.history || []);
					const isExpanded = expandedCards.has(entry.exerciseName);

					return (
						<Grid size={{ xs: 12, md: 6 }} key={entry.exerciseName}>
							<Card
								elevation={2}
								sx={{
									transition: "all 0.3s ease",
									"&:hover": {
										elevation: 4,
										transform: "translateY(-2px)",
									},
								}}
							>
								<CardContent>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-start",
											mb: 2,
										}}
									>
										<Box sx={{ flex: 1 }}>
											<Typography
												variant="h6"
												component="h3"
												gutterBottom
												fontWeight="600"
											>
												{entry.exerciseName}
											</Typography>
										</Box>

										{progress && (
											<Chip
												icon={<TrendingUp />}
												label={progress.changeText}
												color={progress.improvement ? "success" : "warning"}
												variant="outlined"
												size="small"
											/>
										)}
									</Box>

									<Box
										sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}
									>
										{entry.repetitions && (
											<Chip
												icon={<Repeat />}
												label={`${entry.repetitions} ponavljanja`}
												color="primary"
												variant="filled"
											/>
										)}
										{entry.weight && (
											<Chip
												label={`${entry.weight} ${entry.unit}`}
												color="secondary"
												variant="filled"
											/>
										)}
										{entry.holdTime && (
											<Chip
												icon={<Timer />}
												label={`${entry.holdTime}s držanje`}
												color="info"
												variant="filled"
											/>
										)}
									</Box>

									<Typography
										variant="body2"
										color="text.secondary"
										gutterBottom
									>
										Poslednje ažuriranje: {formatDate(entry.updatedAt)}
									</Typography>

									{entry.history && entry.history.length > 1 && (
										<>
											<Button
												startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
												onClick={() => toggleCardExpansion(entry.exerciseName)}
												size="small"
												sx={{ mt: 1 }}
											>
												{isExpanded
													? "Sakrij istoriju"
													: `Prikaži istoriju (${
															entry.history.length - 1
													  } prethodnih)`}
											</Button>

											<Collapse in={isExpanded}>
												<Box
													sx={{
														mt: 2,
														p: 2,
														bgcolor: "grey.50",
														borderRadius: 1,
													}}
												>
													<Typography
														variant="subtitle2"
														gutterBottom
														fontWeight="600"
													>
														Istorija napretka:
													</Typography>
													<List dense>
														{entry.history
															.slice(1, 4)
															.map(
																(historyEntry: StatusEntry, index: number) => (
																	<ListItem key={index} sx={{ py: 0.5 }}>
																		<ListItemText
																			primary={
																				<Box
																					sx={{
																						display: "flex",
																						gap: 1,
																						flexWrap: "wrap",
																					}}
																				>
																					{historyEntry.repetitions && (
																						<Chip
																							label={`${historyEntry.repetitions} rep`}
																							size="small"
																							variant="outlined"
																						/>
																					)}
																					{historyEntry.weight && (
																						<Chip
																							label={`${historyEntry.weight} ${historyEntry.unit}`}
																							size="small"
																							variant="outlined"
																						/>
																					)}
																					{historyEntry.holdTime && (
																						<Chip
																							label={`${historyEntry.holdTime}s`}
																							size="small"
																							variant="outlined"
																						/>
																					)}
																				</Box>
																			}
																			secondary={formatDate(
																				historyEntry.createdAt
																			)}
																		/>
																	</ListItem>
																)
															)}
													</List>
												</Box>
											</Collapse>
										</>
									)}
								</CardContent>

								<CardActions sx={{ px: 2, pb: 2 }}>
									<Button
										startIcon={<EditOutlined />}
										onClick={() => handleUpdateEntry(entry)}
										size="small"
										color="primary"
									>
										Ažuriraj
									</Button>
									{entry.history && entry.history.length > 1 && (
										<Button
											startIcon={<HistoryOutlined />}
											onClick={() => handleViewHistory(entry)}
											size="small"
										>
											Istorija
										</Button>
									)}
									<Button
										startIcon={<DeleteOutlined />}
										onClick={() => handleDeleteEntry(entry)}
										size="small"
										color="error"
									>
										Obriši
									</Button>
								</CardActions>
							</Card>
						</Grid>
					);
				})}
			</Grid>

			{/* Update Dialog */}
			<Dialog
				open={isUpdateDialogOpen}
				onClose={() => setIsUpdateDialogOpen(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>
					<Typography variant="h6" fontWeight="600">
						Ažuriraj status - {selectedEntry?.exerciseName}
					</Typography>
				</DialogTitle>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}
					<Box sx={{ pt: 1 }}>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, md: updateForm.holdTime.trim() ? 12 : 6 }}>
								<TextField
									fullWidth
									type="number"
									label={
										updateForm.holdTime.trim()
											? "Vreme držanja (sekunde)"
											: "Ponavljanja"
									}
									value={
										updateForm.holdTime.trim()
											? updateForm.holdTime
											: updateForm.repetitions
									}
									onChange={(e) =>
										setUpdateForm((prev) => ({
											...prev,
											[updateForm.holdTime.trim() ? "holdTime" : "repetitions"]:
												e.target.value,
										}))
									}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												{updateForm.holdTime.trim() ? <Timer /> : <Repeat />}
											</InputAdornment>
										),
									}}
									inputProps={{ min: 1 }}
									disabled={
										updateForm.holdTime.trim()
											? false
											: !!updateForm.holdTime.trim()
									}
									sx={{ mb: 2 }}
								/>
							</Grid>

							{!updateForm.holdTime.trim() && (
								<Grid size={{ xs: 12, md: 6 }}>
									<TextField
										fullWidth
										type="number"
										label="Težina"
										value={updateForm.weight}
										onChange={(e) =>
											setUpdateForm((prev) => ({
												...prev,
												weight: e.target.value,
											}))
										}
										InputProps={{
											endAdornment: (
												<InputAdornment position="end">
													{updateForm.unit}
												</InputAdornment>
											),
										}}
										inputProps={{ min: 0, step: 0.5 }}
										sx={{ mb: 2 }}
									/>
								</Grid>
							)}

							<Grid size={{ xs: 12, md: updateForm.holdTime.trim() ? 12 : 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Vreme držanja (sekunde)"
									value={updateForm.holdTime}
									onChange={(e) =>
										setUpdateForm((prev) => ({
											...prev,
											holdTime: e.target.value,
										}))
									}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Timer />
											</InputAdornment>
										),
									}}
									inputProps={{ min: 1 }}
									disabled={!!updateForm.repetitions.trim()}
									sx={{ mb: 2 }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<FormControl fullWidth sx={{ mb: 2 }}>
									<InputLabel>Jedinica</InputLabel>
									<Select
										value={updateForm.unit}
										label="Jedinica"
										onChange={(e) =>
											setUpdateForm((prev) => ({
												...prev,
												unit: e.target.value as "kg" | "lbs",
											}))
										}
									>
										<MenuItem value="kg">Kilogrami (kg)</MenuItem>
										<MenuItem value="lbs">Funte (lbs)</MenuItem>
									</Select>
								</FormControl>
							</Grid>
						</Grid>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button
						startIcon={<CancelOutlined />}
						onClick={() => setIsUpdateDialogOpen(false)}
						disabled={isUpdating}
					>
						Otkaži
					</Button>
					<Button
						startIcon={<SaveOutlined />}
						variant="contained"
						onClick={handleConfirmUpdate}
						disabled={isUpdating}
					>
						{isUpdating ? "Čuvanje..." : "Sačuvaj napredak"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* History Dialog */}
			<Dialog
				open={isHistoryDialogOpen}
				onClose={() => setIsHistoryDialogOpen(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>
					<Typography variant="h6" fontWeight="600">
						Istorija napretka - {selectedEntry?.exerciseName}
					</Typography>
				</DialogTitle>
				<DialogContent>
					{selectedEntry?.history && (
						<List>
							{selectedEntry.history.map(
								(historyEntry: StatusEntry, index: number) => (
									<ListItem
										key={index}
										sx={{
											border: 1,
											borderColor: index === 0 ? "primary.main" : "divider",
											borderRadius: 1,
											mb: 1,
											bgcolor: index === 0 ? "primary.50" : "background.paper",
										}}
									>
										<ListItemText
											primary={
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1,
														mb: 1,
													}}
												>
													{index === 0 && (
														<Chip
															label="TRENUTNO"
															color="primary"
															size="small"
															sx={{ fontWeight: "bold" }}
														/>
													)}
													<Box
														sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
													>
														{historyEntry.repetitions && (
															<Chip
																icon={<Repeat />}
																label={`${historyEntry.repetitions} ponavljanja`}
																color={index === 0 ? "primary" : "default"}
																variant={index === 0 ? "filled" : "outlined"}
															/>
														)}
														{historyEntry.weight && (
															<Chip
																label={`${historyEntry.weight} ${historyEntry.unit}`}
																color={index === 0 ? "secondary" : "default"}
																variant={index === 0 ? "filled" : "outlined"}
															/>
														)}
														{historyEntry.holdTime && (
															<Chip
																icon={<Timer />}
																label={`${historyEntry.holdTime}s držanje`}
																color={index === 0 ? "info" : "default"}
																variant={index === 0 ? "filled" : "outlined"}
															/>
														)}
													</Box>
												</Box>
											}
											secondary={formatDate(historyEntry.createdAt)}
										/>
									</ListItem>
								)
							)}
						</List>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsHistoryDialogOpen(false)}>Zatvori</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Dialog */}
			<Dialog
				open={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					<Typography variant="h6" fontWeight="600" color="error">
						Potvrdi brisanje
					</Typography>
				</DialogTitle>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}
					<Typography>
						Da li ste sigurni da želite da obrišete sav napredak za vežbu{" "}
						<strong>{selectedEntry?.exerciseName}</strong>?
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						Ova akcija će obrisati celu istoriju napretka i ne može se
						poništiti.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setIsDeleteDialogOpen(false)}
						disabled={isDeleting}
					>
						Otkaži
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={handleConfirmDelete}
						disabled={isDeleting}
					>
						{isDeleting ? "Brisanje..." : "Obriši sve"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default StatusList;
