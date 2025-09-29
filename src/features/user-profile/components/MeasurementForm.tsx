"use client";

import React, { useState } from "react";
import {
	Box,
	Typography,
	TextField,
	Button,
	Card,
	CardContent,
	Alert,
	Grid,
	Divider,
	Chip,
	InputAdornment,
} from "@mui/material";
import {
	SaveOutlined,
	RestartAlt,
	TrendingUp,
	TrendingDown,
	CalendarToday,
	FitnessCenter,
	Straighten,
} from "@mui/icons-material";
import { BodyMeasurement } from "../interfaces/user-profile.interface";

interface MeasurementFormProps {
	onMeasurementAdded: (measurement: BodyMeasurement) => void;
	latestMeasurement?: BodyMeasurement;
}

const MeasurementForm: React.FC<MeasurementFormProps> = ({
	onMeasurementAdded,
	latestMeasurement,
}) => {
	const [formData, setFormData] = useState({
		date: new Date().toISOString().split("T")[0],
		weight: "",
		bodyFat: "",
		chest: "",
		waist: "",
		hips: "",
		biceps: "",
		thighs: "",
		calves: "",
		neck: "",
		shoulders: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		if (error) setError(null);
		if (success) setSuccess(null);
	};

	const handleReset = () => {
		setFormData({
			date: new Date().toISOString().split("T")[0],
			weight: "",
			bodyFat: "",
			chest: "",
			waist: "",
			hips: "",
			biceps: "",
			thighs: "",
			calves: "",
			neck: "",
			shoulders: "",
		});
		setError(null);
		setSuccess(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.date) {
			setError("Datum je obavezan");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/measurements", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					date: formData.date,
					weight: formData.weight || null,
					bodyFat: formData.bodyFat || null,
					measurements: {
						chest: formData.chest || null,
						waist: formData.waist || null,
						hips: formData.hips || null,
						biceps: formData.biceps || null,
						thighs: formData.thighs || null,
						calves: formData.calves || null,
						neck: formData.neck || null,
						shoulders: formData.shoulders || null,
					},
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Greška pri dodavanju mjerenja");
			}

			const newMeasurement = await response.json();
			onMeasurementAdded(newMeasurement);
			setSuccess("Mjerenje uspješno dodato!");
			handleReset();
		} catch (error) {
			console.error("Error adding measurement:", error);
			setError(
				error instanceof Error ? error.message : "Greška pri dodavanju mjerenja"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const calculateDifference = (
		current: string,
		field:
			| keyof BodyMeasurement
			| keyof NonNullable<BodyMeasurement["measurements"]>
	) => {
		if (!current || !latestMeasurement) return null;

		const currentValue = parseFloat(current);
		let previousValue: number | undefined;

		if (field === "weight" || field === "bodyFat") {
			previousValue = latestMeasurement[field as keyof BodyMeasurement] as
				| number
				| undefined;
		} else {
			previousValue =
				latestMeasurement.measurements?.[
					field as keyof NonNullable<BodyMeasurement["measurements"]>
				];
		}

		if (previousValue === undefined || previousValue === null) return null;

		const diff = currentValue - previousValue;
		return diff;
	};

	const renderComparisonChip = (
		current: string,
		field:
			| keyof BodyMeasurement
			| keyof NonNullable<BodyMeasurement["measurements"]>
	) => {
		const diff = calculateDifference(current, field);
		if (diff === null) return null;

		const isPositive = diff > 0;
		const Icon = isPositive ? TrendingUp : TrendingDown;
		const color =
			field === "bodyFat" || field === "weight" || field === "waist"
				? isPositive
					? "error"
					: "success"
				: isPositive
				? "success"
				: "error";

		return (
			<Chip
				size="small"
				icon={<Icon />}
				label={`${isPositive ? "+" : ""}${diff.toFixed(1)}`}
				color={color}
				sx={{ ml: 1 }}
			/>
		);
	};

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<FitnessCenter sx={{ mr: 2, color: "primary.main" }} />
				<Typography variant="h5" component="h2" fontWeight="600">
					Novo mjerenje
				</Typography>
			</Box>

			{latestMeasurement && (
				<Alert severity="info" sx={{ mb: 3 }}>
					<Typography variant="body2">
						Zadnje mjerenje:{" "}
						<strong>
							{new Date(latestMeasurement.date).toLocaleDateString("sr-RS")}
						</strong>
					</Typography>
				</Alert>
			)}

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert severity="success" sx={{ mb: 3 }}>
					{success}
				</Alert>
			)}

			<Card elevation={2}>
				<CardContent sx={{ p: 4 }}>
					<form onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							{/* Datum */}
							<Grid size={{ xs: 12 }}>
								<TextField
									fullWidth
									required
									type="date"
									label="Datum mjerenja"
									value={formData.date}
									onChange={(e) => handleInputChange("date", e.target.value)}
									InputLabelProps={{ shrink: true }}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<CalendarToday />
											</InputAdornment>
										),
									}}
								/>
							</Grid>

							{/* Osnovna mjerenja */}
							<Grid size={{ xs: 12 }}>
								<Typography
									variant="h6"
									gutterBottom
									sx={{ display: "flex", alignItems: "center", mt: 2 }}
								>
									Osnovna mjerenja
								</Typography>
								<Divider sx={{ mb: 2 }} />
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Težina"
									value={formData.weight}
									onChange={(e) => handleInputChange("weight", e.target.value)}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												kg {renderComparisonChip(formData.weight, "weight")}
											</InputAdornment>
										),
									}}
									inputProps={{ step: "0.1" }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Procenat masti"
									value={formData.bodyFat}
									onChange={(e) => handleInputChange("bodyFat", e.target.value)}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												% {renderComparisonChip(formData.bodyFat, "bodyFat")}
											</InputAdornment>
										),
									}}
									inputProps={{ step: "0.1" }}
								/>
							</Grid>

							{/* Obimi */}
							<Grid size={{ xs: 12 }}>
								<Typography
									variant="h6"
									gutterBottom
									sx={{ display: "flex", alignItems: "center", mt: 2 }}
								>
									<Straighten sx={{ mr: 1 }} />
									Obimi tijela
								</Typography>
								<Divider sx={{ mb: 2 }} />
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Grudi"
									value={formData.chest}
									onChange={(e) => handleInputChange("chest", e.target.value)}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												cm {renderComparisonChip(formData.chest, "chest")}
											</InputAdornment>
										),
									}}
									inputProps={{ step: "0.1" }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Struk"
									value={formData.waist}
									onChange={(e) => handleInputChange("waist", e.target.value)}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												cm {renderComparisonChip(formData.waist, "waist")}
											</InputAdornment>
										),
									}}
									inputProps={{ step: "0.1" }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Kukovi"
									value={formData.hips}
									onChange={(e) => handleInputChange("hips", e.target.value)}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												cm {renderComparisonChip(formData.hips, "hips")}
											</InputAdornment>
										),
									}}
									inputProps={{ step: "0.1" }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Biceps"
									value={formData.biceps}
									onChange={(e) => handleInputChange("biceps", e.target.value)}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												cm {renderComparisonChip(formData.biceps, "biceps")}
											</InputAdornment>
										),
									}}
									inputProps={{ step: "0.1" }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Butine"
									value={formData.thighs}
									onChange={(e) => handleInputChange("thighs", e.target.value)}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												cm {renderComparisonChip(formData.thighs, "thighs")}
											</InputAdornment>
										),
									}}
									inputProps={{ step: "0.1" }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Listovi"
									value={formData.calves}
									onChange={(e) => handleInputChange("calves", e.target.value)}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												cm {renderComparisonChip(formData.calves, "calves")}
											</InputAdornment>
										),
									}}
									inputProps={{ step: "0.1" }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Vrat"
									value={formData.neck}
									onChange={(e) => handleInputChange("neck", e.target.value)}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												cm {renderComparisonChip(formData.neck, "neck")}
											</InputAdornment>
										),
									}}
									inputProps={{ step: "0.1" }}
								/>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									type="number"
									label="Ramena"
									value={formData.shoulders}
									onChange={(e) =>
										handleInputChange("shoulders", e.target.value)
									}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												cm{" "}
												{renderComparisonChip(formData.shoulders, "shoulders")}
											</InputAdornment>
										),
									}}
									inputProps={{ step: "0.1" }}
								/>
							</Grid>

							{/* Buttons */}
							<Grid size={{ xs: 12 }}>
								<Box
									sx={{
										display: "flex",
										gap: 2,
										justifyContent: "flex-end",
										mt: 2,
									}}
								>
									<Button
										variant="outlined"
										startIcon={<RestartAlt />}
										onClick={handleReset}
										disabled={isSubmitting}
									>
										Resetuj
									</Button>
									<Button
										type="submit"
										variant="contained"
										startIcon={<SaveOutlined />}
										disabled={isSubmitting || !formData.date}
										size="large"
									>
										{isSubmitting ? "Čuvanje..." : "Sačuvaj mjerenje"}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</form>
				</CardContent>
			</Card>
		</Box>
	);
};

export default MeasurementForm;
