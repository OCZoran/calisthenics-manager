"use client";

import React from "react";
import {
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Divider,
	Typography,
	Box,
} from "@mui/material";
import { getWorkoutTypeLabel, WorkoutType } from "./exercise.interface";

interface WorkoutTypeSelectorProps {
	value: WorkoutType | "";
	onChange: (type: WorkoutType) => void;
	disabled?: boolean;
}

const WorkoutTypeSelector: React.FC<WorkoutTypeSelectorProps> = ({
	value,
	onChange,
	disabled = false,
}) => {
	// Standard kategorije (movement patterns)
	const standardTypes: WorkoutType[] = [
		"pull",
		"push",
		"legs",
		"core",
		"upper",
		"lower",
		"full-body",
	];

	// Specijalne kategorije (uvek dostupne)
	const specialTypes: WorkoutType[] = ["cardio", "skills", "mobility"];

	return (
		<FormControl fullWidth disabled={disabled}>
			<InputLabel>Tip treninga</InputLabel>
			<Select
				value={value}
				onChange={(e) => onChange(e.target.value as WorkoutType)}
				label="Tip treninga"
			>
				<MenuItem value="">
					<em>-- Odaberi tip --</em>
				</MenuItem>

				{/* Standard movement patterns */}
				<MenuItem
					disabled
					sx={{
						opacity: 1,
						backgroundColor: "primary.light",
						fontWeight: "bold",
						color: "white",
						"&.Mui-disabled": {
							opacity: 1,
						},
					}}
				>
					OSNOVNI TIPOVI
				</MenuItem>
				{standardTypes.map((type) => (
					<MenuItem key={type} value={type} sx={{ pl: 4 }}>
						<Box>
							<Typography>{getWorkoutTypeLabel(type)}</Typography>
							<Typography variant="caption" color="text.secondary">
								{getTypeDescription(type)}
							</Typography>
						</Box>
					</MenuItem>
				))}

				<Divider sx={{ my: 1 }} />

				{/* Special types */}
				<MenuItem
					disabled
					sx={{
						opacity: 1,
						backgroundColor: "secondary.light",
						fontWeight: "bold",
						color: "white",
						"&.Mui-disabled": {
							opacity: 1,
						},
					}}
				>
					SPECIJALNI TIPOVI
				</MenuItem>
				{specialTypes.map((type) => (
					<MenuItem key={type} value={type} sx={{ pl: 4 }}>
						<Box>
							<Typography>{getWorkoutTypeLabel(type)}</Typography>
							<Typography variant="caption" color="text.secondary">
								{getTypeDescription(type)}
							</Typography>
						</Box>
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
};

// Helper function za opise tipova treninga
function getTypeDescription(type: WorkoutType): string {
	const descriptions: Record<WorkoutType, string> = {
		pull: "Vuče: leđa, bicepsi",
		push: "Potisci: grudi, tricepsi, ramena",
		legs: "Noge: kvadricepsi, hamstrinzi, listovi",
		core: "Trbušnjaci i donji deo leđa",
		upper: "Kombinacija pull + push",
		lower: "Kombinacija legs + core",
		"full-body": "Sve grupe mišića",
		cardio: "Kardio vežbe (uvek dostupno)",
		skills: "Tehnike i veštine (uvek dostupno)",
		mobility: "Mobilnost i fleksibilnost (uvek dostupno)",
	};
	return descriptions[type];
}

export default WorkoutTypeSelector;
