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
} from "@mui/material";
import {
	EditOutlined,
	DeleteOutlined,
	VisibilityOutlined,
	CalendarToday,
	SaveOutlined,
	CancelOutlined,
	ExpandMore,
	ExpandLess,
} from "@mui/icons-material";
import { JournalEntry } from "../interface/journal.interface";

interface JournalListProps {
	entries: JournalEntry[];
	onEntryUpdated: (entry: JournalEntry) => void;
	onEntryDeleted: (entryId: string) => void;
}

const JournalList: React.FC<JournalListProps> = ({
	entries,
	onEntryUpdated,
	onEntryDeleted,
}) => {
	const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editForm, setEditForm] = useState({ title: "", content: "" });
	const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleViewEntry = (entry: JournalEntry) => {
		setSelectedEntry(entry);
		setIsViewDialogOpen(true);
	};

	const handleEditEntry = (entry: JournalEntry) => {
		setSelectedEntry(entry);
		setEditForm({ title: entry.title, content: entry.content });
		setIsEditDialogOpen(true);
	};

	const handleDeleteEntry = (entry: JournalEntry) => {
		setSelectedEntry(entry);
		setIsDeleteDialogOpen(true);
	};

	const handleUpdateEntry = async () => {
		if (!selectedEntry) return;

		setIsUpdating(true);
		setError(null);

		try {
			const response = await fetch(`/api/journal?id=${selectedEntry._id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(editForm),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri ažuriranju unosa");
			}

			const updatedEntry = await response.json();
			onEntryUpdated(updatedEntry);
			setIsEditDialogOpen(false);
			setSelectedEntry(null);
		} catch (error) {
			console.error("Error updating journal entry:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri ažuriranju unosa"
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
			const response = await fetch(`/api/journal?id=${selectedEntry._id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri brisanju unosa");
			}

			onEntryDeleted(selectedEntry._id);
			setIsDeleteDialogOpen(false);
			setSelectedEntry(null);
		} catch (error) {
			console.error("Error deleting journal entry:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri brisanju unosa"
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const toggleCardExpansion = (entryId: string) => {
		setExpandedCards((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(entryId)) {
				newSet.delete(entryId);
			} else {
				newSet.add(entryId);
			}
			return newSet;
		});
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("sr-RS", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString("sr-RS", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getContentPreview = (content: string, maxLength: number = 150) => {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + "...";
	};

	if (entries.length === 0) {
		return (
			<Box sx={{ textAlign: "center", py: 8 }}>
				<CalendarToday sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
				<Typography variant="h5" gutterBottom fontWeight="bold">
					Nema unosa u dnevniku
				</Typography>
				<Typography variant="body1" color="textSecondary">
					Počnite sa pisanjem vašeg dnevnika na kartici Dodaj unos
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<CalendarToday sx={{ mr: 2, color: "primary.main" }} />
				<Typography variant="h5" component="h2" fontWeight="600">
					Vaš dnevnik ({entries.length} unosa)
				</Typography>
			</Box>

			<Grid container spacing={3}>
				{entries.map((entry) => (
					<Grid size={{ xs: 12 }} key={entry._id}>
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
											{entry.title}
										</Typography>
										<Box sx={{ display: "flex", gap: 1, mb: 2 }}>
											<Chip
												icon={<CalendarToday />}
												label={formatDate(entry.date)}
												color="primary"
												variant="outlined"
												size="small"
											/>
											<Chip
												label={`Kreiran: ${formatTime(entry.createdAt)}`}
												color="default"
												variant="outlined"
												size="small"
											/>
										</Box>
									</Box>
								</Box>

								<Typography
									variant="body1"
									color="text.secondary"
									sx={{ mb: 2, lineHeight: 1.6 }}
								>
									{expandedCards.has(entry._id)
										? entry.content
										: getContentPreview(entry.content)}
								</Typography>

								{entry.content.length > 150 && (
									<Button
										startIcon={
											expandedCards.has(entry._id) ? (
												<ExpandLess />
											) : (
												<ExpandMore />
											)
										}
										onClick={() => toggleCardExpansion(entry._id)}
										size="small"
									>
										{expandedCards.has(entry._id)
											? "Prikaži manje"
											: "Prikaži više"}
									</Button>
								)}
							</CardContent>

							<CardActions sx={{ px: 2, pb: 2 }}>
								<Button
									startIcon={<VisibilityOutlined />}
									onClick={() => handleViewEntry(entry)}
									size="small"
								>
									Prikaži
								</Button>
								<Button
									startIcon={<EditOutlined />}
									onClick={() => handleEditEntry(entry)}
									size="small"
									color="primary"
								>
									Edituj
								</Button>
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
				))}
			</Grid>

			{/* View Dialog */}
			<Dialog
				open={isViewDialogOpen}
				onClose={() => setIsViewDialogOpen(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>
					<Box>
						<Typography variant="h6" fontWeight="600">
							{selectedEntry?.title}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{selectedEntry && formatDate(selectedEntry.date)}
						</Typography>
					</Box>
				</DialogTitle>
				<DialogContent>
					<Typography
						variant="body1"
						sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
					>
						{selectedEntry?.content}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsViewDialogOpen(false)}>Zatvori</Button>
				</DialogActions>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog
				open={isEditDialogOpen}
				onClose={() => setIsEditDialogOpen(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>
					<Typography variant="h6" fontWeight="600">
						Edituj unos
					</Typography>
				</DialogTitle>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}
					<Box sx={{ pt: 1 }}>
						<TextField
							fullWidth
							label="Naslov"
							value={editForm.title}
							onChange={(e) =>
								setEditForm((prev) => ({ ...prev, title: e.target.value }))
							}
							sx={{ mb: 2 }}
							inputProps={{ maxLength: 100 }}
						/>
						<TextField
							fullWidth
							multiline
							rows={8}
							label="Sadržaj"
							value={editForm.content}
							onChange={(e) =>
								setEditForm((prev) => ({ ...prev, content: e.target.value }))
							}
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button
						startIcon={<CancelOutlined />}
						onClick={() => setIsEditDialogOpen(false)}
						disabled={isUpdating}
					>
						Otkaži
					</Button>
					<Button
						startIcon={<SaveOutlined />}
						variant="contained"
						onClick={handleUpdateEntry}
						disabled={
							isUpdating || !editForm.title.trim() || !editForm.content.trim()
						}
					>
						{isUpdating ? "Čuvanje..." : "Sačuvaj"}
					</Button>
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
						Da li ste sigurni da želite da obrišete unos
						<strong>{selectedEntry?.title}</strong> od{" "}
						{selectedEntry && formatDate(selectedEntry.date)}?
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						Ova akcija se ne može poništiti.
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
						{isDeleting ? "Brisanje..." : "Obriši"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default JournalList;
