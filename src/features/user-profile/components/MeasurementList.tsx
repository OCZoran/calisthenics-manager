"use client";

import React, { useState } from "react";
import {
	Box,
	Typography,
	Card,
	CardContent,
	IconButton,
	Chip,
	Grid,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Alert,
	Collapse,
	Divider,
} from "@mui/material";
import {
	DeleteOutline,
	ExpandMore,
	ExpandLess,
	TrendingUp,
	TrendingDown,
	CalendarToday,
	FitnessCenter,
} from "@mui/icons-material";
import { BodyMeasurement } from "../interfaces/user-profile.interface";

interface MeasurementsListProps {
	measurements: BodyMeasurement[];
	onMeasurementUpdated: (measurement: BodyMeasurement) => void;
	onMeasurementDeleted: (measurementId: string) => void;
}

const MeasurementsList: React.FC<MeasurementsListProps> = ({
	measurements,
	onMeasurementDeleted,
}) => {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [measurementToDelete, setMeasurementToDelete] = useState<string | null>(
		null
	);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

	const handleDeleteClick = (measurementId: string) => {
		setMeasurementToDelete(measurementId);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!measurementToDelete) return;

		setIsDeleting(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/measurements?id=${measurementToDelete}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri brisanju mjerenja");
			}

			onMeasurementDeleted(measurementToDelete);
			setDeleteDialogOpen(false);
			setMeasurementToDelete(null);
		} catch (error) {
			console.error("Error deleting measurement:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri brisanju mjerenja"
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setMeasurementToDelete(null);
		setError(null);
	};

	const toggleExpanded = (measurementId: string) => {
		setExpandedCards((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(measurementId)) {
				newSet.delete(measurementId);
			} else {
				newSet.add(measurementId);
			}
			return newSet;
		});
	};

	const calculateDifference = (
		current: BodyMeasurement,
		previous: BodyMeasurement | undefined,
		field: string
	): { value: number; isPositive: boolean } | null => {
		if (!previous) return null;

		let currentValue: number | undefined | null;
		let previousValue: number | undefined | null;

		if (field === "weight" || field === "bodyFat") {
			currentValue = current[field as keyof BodyMeasurement] as number;
			previousValue = previous[field as keyof BodyMeasurement] as number;
		} else {
			currentValue =
				current.measurements[field as keyof typeof current.measurements];
			previousValue =
				previous.measurements[field as keyof typeof previous.measurements];
		}

		if (currentValue == null || previousValue == null) return null;

		const diff = currentValue - previousValue;
		return {
			value: diff,
			isPositive: diff > 0,
		};
	};

	const renderComparisonChip = (
		current: BodyMeasurement,
		previous: BodyMeasurement | undefined,
		field: string
	) => {
		const diff = calculateDifference(current, previous, field);
		if (!diff || diff.value === 0) return null;

		const Icon = diff.isPositive ? TrendingUp : TrendingDown;
		const color =
			field === "bodyFat" || field === "weight" || field === "waist"
				? diff.isPositive
					? "error"
					: "success"
				: diff.isPositive
				? "success"
				: "error";

		return (
			<Chip
				size="small"
				icon={<Icon />}
				label={`${diff.isPositive ? "+" : ""}${diff.value.toFixed(1)}`}
				color={color}
				sx={{ ml: 1 }}
			/>
		);
	};

	const renderMeasurementField = (
		label: string,
		value: number | null | undefined,
		unit: string,
		current: BodyMeasurement,
		previous: BodyMeasurement | undefined,
		field: string
	) => {
		if (value == null) return null;

		return (
			<Grid size={{ xs: 6, md: 3 }}>
				<Typography variant="caption" color="text.secondary">
					{label}
				</Typography>
				<Box sx={{ display: "flex", alignItems: "center" }}>
					<Typography variant="body1" fontWeight="600">
						{value.toFixed(1)} {unit}
					</Typography>
					{renderComparisonChip(current, previous, field)}
				</Box>
			</Grid>
		);
	};

	if (measurements.length === 0) {
		return (
			<Box sx={{ textAlign: "center", py: 8 }}>
				<FitnessCenter sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
				<Typography variant="h6" color="text.secondary" gutterBottom>
					Nema mjerenja
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Dodajte svoje prvo mjerenje da biste pratili napredak
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<FitnessCenter sx={{ mr: 2, color: "primary.main" }} />
				<Typography variant="h5" component="h2" fontWeight="600">
					Istorija mjerenja
				</Typography>
			</Box>

			<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
				{measurements.map((measurement, index) => {
					const previousMeasurement = measurements[index + 1];
					const isExpanded = expandedCards.has(measurement._id!);

					return (
						<Card key={measurement._id} elevation={2}>
							<CardContent>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										mb: 2,
									}}
								>
									<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
										<CalendarToday sx={{ color: "primary.main" }} />
										<Box>
											<Typography variant="h6" fontWeight="600">
												{new Date(measurement.date).toLocaleDateString(
													"sr-RS",
													{
														day: "numeric",
														month: "long",
														year: "numeric",
													}
												)}
											</Typography>
											{index === 0 && (
												<Chip label="Najnovije" color="primary" size="small" />
											)}
										</Box>
									</Box>
									<Box sx={{ display: "flex", gap: 1 }}>
										<IconButton
											onClick={() => toggleExpanded(measurement._id!)}
											color="primary"
										>
											{isExpanded ? <ExpandLess /> : <ExpandMore />}
										</IconButton>
										<IconButton
											onClick={() => handleDeleteClick(measurement._id!)}
											color="error"
										>
											<DeleteOutline />
										</IconButton>
									</Box>
								</Box>

								{/* Osnovna mjerenja - uvijek vidljiva */}
								<Grid container spacing={2}>
									{renderMeasurementField(
										"Težina",
										measurement.weight,
										"kg",
										measurement,
										previousMeasurement,
										"weight"
									)}
									{renderMeasurementField(
										"Mast",
										measurement.bodyFat,
										"%",
										measurement,
										previousMeasurement,
										"bodyFat"
									)}
								</Grid>

								{/* Detaljni obimi - expanded */}
								<Collapse in={isExpanded} timeout="auto" unmountOnExit>
									<Divider sx={{ my: 2 }} />
									<Typography
										variant="subtitle2"
										color="text.secondary"
										gutterBottom
										sx={{ mb: 2 }}
									>
										Obimi tijela
									</Typography>
									<Grid container spacing={2}>
										{renderMeasurementField(
											"Grudi",
											measurement.measurements.chest,
											"cm",
											measurement,
											previousMeasurement,
											"chest"
										)}
										{renderMeasurementField(
											"Struk",
											measurement.measurements.waist,
											"cm",
											measurement,
											previousMeasurement,
											"waist"
										)}
										{renderMeasurementField(
											"Kukovi",
											measurement.measurements.hips,
											"cm",
											measurement,
											previousMeasurement,
											"hips"
										)}
										{renderMeasurementField(
											"Biceps",
											measurement.measurements.biceps,
											"cm",
											measurement,
											previousMeasurement,
											"biceps"
										)}
										{renderMeasurementField(
											"Butine",
											measurement.measurements.thighs,
											"cm",
											measurement,
											previousMeasurement,
											"thighs"
										)}
										{renderMeasurementField(
											"Listovi",
											measurement.measurements.calves,
											"cm",
											measurement,
											previousMeasurement,
											"calves"
										)}
										{renderMeasurementField(
											"Vrat",
											measurement.measurements.neck,
											"cm",
											measurement,
											previousMeasurement,
											"neck"
										)}
										{renderMeasurementField(
											"Ramena",
											measurement.measurements.shoulders,
											"cm",
											measurement,
											previousMeasurement,
											"shoulders"
										)}
									</Grid>
								</Collapse>
							</CardContent>
						</Card>
					);
				})}
			</Box>

			{/* Delete Dialog */}
			<Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
				<DialogTitle>Potvrda brisanja</DialogTitle>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}
					<Typography>
						Da li ste sigurni da želite obrisati ovo mjerenje? Ova akcija se ne
						može poništiti.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel} disabled={isDeleting}>
						Otkaži
					</Button>
					<Button
						onClick={handleDeleteConfirm}
						color="error"
						variant="contained"
						disabled={isDeleting}
					>
						{isDeleting ? "Brisanje..." : "Obriši"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default MeasurementsList;
