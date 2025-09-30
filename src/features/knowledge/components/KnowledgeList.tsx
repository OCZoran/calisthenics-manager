"use client";

import React, { useState } from "react";
import {
	Box,
	Typography,
	TextField,
	Card,
	CardContent,
	Chip,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	InputAdornment,
	Collapse,
	MenuItem,
	Menu,
	Alert,
	Snackbar,
	Fade,
	Tooltip,
} from "@mui/material";
import {
	SearchOutlined,
	ExpandMoreOutlined,
	ExpandLessOutlined,
	EditOutlined,
	DeleteOutlined,
	MoreVertOutlined,
	FilterListOutlined,
	CloseOutlined,
} from "@mui/icons-material";
import {
	KnowledgeCategory,
	KnowledgeItem,
} from "../interfaces/knowledge.interface";

interface KnowledgeListProps {
	categories: KnowledgeCategory[];
	items: Record<string, KnowledgeItem[]>;
	onItemUpdated: (item: KnowledgeItem) => void;
	onItemDeleted: (itemId: string, categoryId: string) => void;
	onCategoryDeleted: (categoryId: string) => void;
}

const KnowledgeList: React.FC<KnowledgeListProps> = ({
	categories,
	items,
	onItemUpdated,
	onItemDeleted,
	onCategoryDeleted,
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set()
	);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
	const [editFormData, setEditFormData] = useState({
		title: "",
		content: "",
		tags: [] as string[],
	});
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [menuCategoryId, setMenuCategoryId] = useState<string | null>(null);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success" as "success" | "error",
	});
	const [isLoading, setIsLoading] = useState(false);

	const toggleCategory = (categoryId: string) => {
		setExpandedCategories((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(categoryId)) {
				newSet.delete(categoryId);
			} else {
				newSet.add(categoryId);
			}
			return newSet;
		});
	};

	const handleEditClick = (item: KnowledgeItem) => {
		setSelectedItem(item);
		setEditFormData({
			title: item.title,
			content: item.content,
			tags: item.tags,
		});
		setEditDialogOpen(true);
	};

	const handleDeleteClick = (item: KnowledgeItem) => {
		setSelectedItem(item);
		setDeleteDialogOpen(true);
	};

	const handleEditSubmit = async () => {
		if (!selectedItem) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/knowledge?id=${selectedItem._id}&type=item`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(editFormData),
				}
			);

			if (!response.ok) throw new Error("Failed to update item");

			const updatedItem = await response.json();
			onItemUpdated(updatedItem);
			setEditDialogOpen(false);
			setSelectedItem(null);
			setSnackbar({
				open: true,
				message: "Stavka uspješno ažurirana",
				severity: "success",
			});
		} catch (error) {
			console.error("Error updating item:", error);
			setSnackbar({
				open: true,
				message: "Greška pri ažuriranju stavke",
				severity: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!selectedItem) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/knowledge?id=${selectedItem._id}&type=item`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) throw new Error("Failed to delete item");

			onItemDeleted(selectedItem._id, selectedItem.categoryId);
			setDeleteDialogOpen(false);
			setSelectedItem(null);
			setSnackbar({
				open: true,
				message: "Stavka uspješno obrisana",
				severity: "success",
			});
		} catch (error) {
			console.error("Error deleting item:", error);
			setSnackbar({
				open: true,
				message: "Greška pri brisanju stavke",
				severity: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleCategoryMenuClick = (
		event: React.MouseEvent<HTMLElement>,
		categoryId: string
	) => {
		setMenuAnchor(event.currentTarget);
		setMenuCategoryId(categoryId);
	};

	const handleCategoryDelete = async () => {
		if (!menuCategoryId) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/knowledge?id=${menuCategoryId}&type=category`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) throw new Error("Failed to delete category");

			onCategoryDeleted(menuCategoryId);
			setMenuAnchor(null);
			setMenuCategoryId(null);
			setSnackbar({
				open: true,
				message: "Kategorija uspješno obrisana",
				severity: "success",
			});
		} catch (error) {
			console.error("Error deleting category:", error);
			setSnackbar({
				open: true,
				message: "Greška pri brisanju kategorije",
				severity: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const filteredCategories = categories.filter((category) => {
		if (selectedCategory !== "all" && category._id !== selectedCategory)
			return false;

		const categoryItems = items[category._id] || [];
		const hasMatchingItem = categoryItems.some(
			(item) =>
				item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.tags.some((tag) =>
					tag.toLowerCase().includes(searchTerm.toLowerCase())
				)
		);

		return (
			searchTerm === "" ||
			category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			hasMatchingItem
		);
	});

	const getFilteredItems = (categoryId: string) => {
		const categoryItems = items[categoryId] || [];
		if (!searchTerm) return categoryItems;

		return categoryItems.filter(
			(item) =>
				item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.tags.some((tag) =>
					tag.toLowerCase().includes(searchTerm.toLowerCase())
				)
		);
	};

	const getDifficultyInfo = (difficulty: string) => {
		switch (difficulty) {
			case "beginner":
				return { icon: "🟢", label: "Početnik", color: "#4caf50" };
			case "intermediate":
				return { icon: "🟡", label: "Srednji", color: "#ff9800" };
			case "advanced":
				return { icon: "🔴", label: "Napredni", color: "#f44336" };
			case "elite":
				return { icon: "⚫", label: "Elitni", color: "#9e9e9e" };
			default:
				return { icon: "❔", label: "Nepoznato", color: "#9e9e9e" };
		}
	};

	if (categories.length === 0) {
		return (
			<Box sx={{ textAlign: "center", py: 10 }}>
				<Typography
					variant="h4"
					gutterBottom
					fontWeight="600"
					color="text.secondary"
				>
					📚 Nema kategorija
				</Typography>
				<Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
					Kreirajte prvu kategoriju da biste započeli organizaciju znanja
				</Typography>
			</Box>
		);
	}

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
				<TextField
					placeholder="Pretraži znanje..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchOutlined color="action" />
							</InputAdornment>
						),
						endAdornment: searchTerm && (
							<InputAdornment position="end">
								<IconButton
									size="small"
									onClick={() => setSearchTerm("")}
									edge="end"
								>
									<CloseOutlined fontSize="small" />
								</IconButton>
							</InputAdornment>
						),
					}}
					sx={{ flex: 1, minWidth: 250 }}
					variant="outlined"
				/>

				<TextField
					select
					value={selectedCategory}
					onChange={(e) => setSelectedCategory(e.target.value)}
					sx={{ minWidth: 220 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<FilterListOutlined color="action" />
							</InputAdornment>
						),
					}}
					variant="outlined"
				>
					<MenuItem value="all">
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography>📂</Typography>
							<Typography>Sve kategorije</Typography>
						</Box>
					</MenuItem>
					{categories.map((cat) => (
						<MenuItem key={cat._id} value={cat._id}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Typography>{cat.icon}</Typography>
								<Typography>{cat.name}</Typography>
							</Box>
						</MenuItem>
					))}
				</TextField>
			</Box>

			{filteredCategories.length === 0 ? (
				<Box sx={{ textAlign: "center", py: 8 }}>
					<Typography variant="h6" color="text.secondary">
						🔍 Nema rezultata pretrage
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						Pokušajte sa drugim ključnim riječima
					</Typography>
				</Box>
			) : (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{filteredCategories.map((category) => {
						const categoryItems = getFilteredItems(category._id);
						const isExpanded = expandedCategories.has(category._id);

						return (
							<Fade in key={category._id}>
								<Card
									elevation={1}
									sx={{
										borderLeft: `4px solid ${category.color}`,
										transition: "all 0.2s ease",
										"&:hover": {
											elevation: 3,
											transform: "translateY(-2px)",
										},
									}}
								>
									<CardContent>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												mb: isExpanded ? 2 : 0,
											}}
										>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 2,
													flex: 1,
													cursor: "pointer",
													py: 1,
												}}
												onClick={() => toggleCategory(category._id)}
											>
												<Typography variant="h4" sx={{ lineHeight: 1 }}>
													{category.icon}
												</Typography>
												<Box sx={{ flex: 1 }}>
													<Typography variant="h6" fontWeight="600">
														{category.name}
													</Typography>
													{category.description && (
														<Typography
															variant="body2"
															color="text.secondary"
															sx={{ mt: 0.5 }}
														>
															{category.description}
														</Typography>
													)}
												</Box>
												<Chip
													label={`${categoryItems.length} ${
														categoryItems.length === 1 ? "stavka" : "stavki"
													}`}
													size="small"
													sx={{
														bgcolor: category.color,
														color: "white",
														fontWeight: 600,
													}}
												/>
												<IconButton size="small" sx={{ ml: 1 }}>
													{isExpanded ? (
														<ExpandLessOutlined />
													) : (
														<ExpandMoreOutlined />
													)}
												</IconButton>
											</Box>

											<Tooltip title="Opcije kategorije">
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														handleCategoryMenuClick(e, category._id);
													}}
													sx={{ ml: 1 }}
												>
													<MoreVertOutlined />
												</IconButton>
											</Tooltip>
										</Box>

										<Collapse in={isExpanded} timeout={300}>
											<Box
												sx={{
													display: "flex",
													flexDirection: "column",
													gap: 2,
													pt: 2,
												}}
											>
												{categoryItems.length === 0 ? (
													<Box
														sx={{
															py: 4,
															textAlign: "center",
															bgcolor: "background.default",
															borderRadius: 1,
														}}
													>
														<Typography variant="body2" color="text.secondary">
															📝 Nema dodanih stavki u ovoj kategoriji
														</Typography>
													</Box>
												) : (
													categoryItems.map((item) => {
														const diffInfo = getDifficultyInfo(item.difficulty);
														return (
															<Card
																key={item._id}
																variant="outlined"
																sx={{
																	bgcolor: "background.default",
																	transition: "all 0.2s ease",
																	"&:hover": {
																		boxShadow: 2,
																	},
																}}
															>
																<CardContent>
																	<Box
																		sx={{
																			display: "flex",
																			justifyContent: "space-between",
																			alignItems: "flex-start",
																			mb: 1.5,
																		}}
																	>
																		<Box sx={{ flex: 1, pr: 2 }}>
																			<Typography
																				variant="h6"
																				fontWeight="600"
																				sx={{ mb: 0.5 }}
																			>
																				{item.title}
																			</Typography>
																			<Chip
																				label={`${diffInfo.icon} ${diffInfo.label}`}
																				size="small"
																				sx={{
																					bgcolor: `${diffInfo.color}15`,
																					color: diffInfo.color,
																					fontWeight: 600,
																					border: `1px solid ${diffInfo.color}40`,
																				}}
																			/>
																		</Box>
																		<Box sx={{ display: "flex", gap: 0.5 }}>
																			<Tooltip title="Izmeni">
																				<IconButton
																					size="small"
																					onClick={() => handleEditClick(item)}
																					sx={{
																						"&:hover": {
																							bgcolor: "primary.main",
																							color: "white",
																						},
																					}}
																				>
																					<EditOutlined fontSize="small" />
																				</IconButton>
																			</Tooltip>
																			<Tooltip title="Obriši">
																				<IconButton
																					size="small"
																					onClick={() =>
																						handleDeleteClick(item)
																					}
																					sx={{
																						"&:hover": {
																							bgcolor: "error.main",
																							color: "white",
																						},
																					}}
																				>
																					<DeleteOutlined fontSize="small" />
																				</IconButton>
																			</Tooltip>
																		</Box>
																	</Box>

																	<Box
																		sx={{
																			whiteSpace: "normal",
																			lineHeight: 1.7,
																			mb: 2,
																			color: "text.secondary",
																			"& img": {
																				maxWidth: "100%",
																				height: "auto",
																				borderRadius: 1,
																				margin: "12px 0",
																			},
																		}}
																		dangerouslySetInnerHTML={{
																			__html: item.content,
																		}}
																	/>

																	{item.tags.length > 0 && (
																		<Box
																			sx={{
																				display: "flex",
																				flexWrap: "wrap",
																				gap: 1,
																				mb: 1.5,
																			}}
																		>
																			{item.tags.map((tag) => (
																				<Chip
																					key={tag}
																					label={tag}
																					size="small"
																					variant="outlined"
																					sx={{
																						borderRadius: "6px",
																						fontWeight: 500,
																					}}
																				/>
																			))}
																		</Box>
																	)}

																	<Typography
																		variant="caption"
																		color="text.secondary"
																		sx={{ display: "block" }}
																	>
																		📅 Dodato:{" "}
																		{new Date(
																			item.createdAt
																		).toLocaleDateString("sr-RS", {
																			year: "numeric",
																			month: "long",
																			day: "numeric",
																			hour: "2-digit",
																			minute: "2-digit",
																		})}
																	</Typography>
																</CardContent>
															</Card>
														);
													})
												)}
											</Box>
										</Collapse>
									</CardContent>
								</Card>
							</Fade>
						);
					})}
				</Box>
			)}

			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={() => setMenuAnchor(null)}
				elevation={3}
			>
				<MenuItem
					onClick={() => {
						handleCategoryDelete();
					}}
					sx={{
						color: "error.main",
						"&:hover": { bgcolor: "error.light", color: "error.dark" },
					}}
				>
					<DeleteOutlined sx={{ mr: 1 }} fontSize="small" />
					Obriši kategoriju
				</MenuItem>
			</Menu>

			<Dialog
				open={editDialogOpen}
				onClose={() => !isLoading && setEditDialogOpen(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle sx={{ fontWeight: 600 }}>✏️ Izmeni stavku</DialogTitle>
				<DialogContent>
					<Box
						sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
					>
						<TextField
							fullWidth
							label="Naslov"
							value={editFormData.title}
							onChange={(e) =>
								setEditFormData({ ...editFormData, title: e.target.value })
							}
							disabled={isLoading}
							required
						/>
						<TextField
							fullWidth
							multiline
							rows={12}
							label="Sadržaj"
							value={editFormData.content}
							onChange={(e) =>
								setEditFormData({ ...editFormData, content: e.target.value })
							}
							disabled={isLoading}
							required
						/>
						{selectedItem && (
							<Box>
								<Typography
									variant="caption"
									color="text.secondary"
									gutterBottom
									display="block"
								>
									Trenutni nivo težine:
								</Typography>
								<Chip
									label={`${getDifficultyInfo(selectedItem.difficulty).icon} ${
										getDifficultyInfo(selectedItem.difficulty).label
									}`}
									size="small"
									sx={{
										bgcolor: `${
											getDifficultyInfo(selectedItem.difficulty).color
										}15`,
										color: getDifficultyInfo(selectedItem.difficulty).color,
										fontWeight: 600,
										border: `1px solid ${
											getDifficultyInfo(selectedItem.difficulty).color
										}40`,
									}}
								/>
							</Box>
						)}
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2.5 }}>
					<Button onClick={() => setEditDialogOpen(false)} disabled={isLoading}>
						Otkaži
					</Button>
					<Button
						onClick={handleEditSubmit}
						variant="contained"
						disabled={
							isLoading ||
							!editFormData.title.trim() ||
							!editFormData.content.trim()
						}
					>
						{isLoading ? "Čuvanje..." : "Sačuvaj"}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={deleteDialogOpen}
				onClose={() => !isLoading && setDeleteDialogOpen(false)}
				maxWidth="xs"
			>
				<DialogTitle sx={{ fontWeight: 600 }}>⚠️ Potvrda brisanja</DialogTitle>
				<DialogContent>
					<Typography>
						Da li ste sigurni da želite da obrišete stavku{" "}
						<strong>{selectedItem?.title}</strong>?
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						Ova akcija se ne može poništiti.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ p: 2.5 }}>
					<Button
						onClick={() => setDeleteDialogOpen(false)}
						disabled={isLoading}
					>
						Otkaži
					</Button>
					<Button
						onClick={handleDeleteConfirm}
						color="error"
						variant="contained"
						disabled={isLoading}
					>
						{isLoading ? "Brisanje..." : "Obriši"}
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={() => setSnackbar({ ...snackbar, open: false })}
					severity={snackbar.severity}
					variant="filled"
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default KnowledgeList;
