export interface WorkoutSet {
	reps: string;
	rest: string;
	weight?: string;
	hold?: string;
	band?: string;
	isMax?: boolean;
}

export interface Exercise {
	name: string;
	sets: WorkoutSet[];
}

export interface Workout {
	_id?: string;
	userId: string;
	date: string;
	type: string;
	notes?: string;
	synced: boolean;
	exercises: Exercise[];
	createdAt?: Date;
	updatedAt?: Date;
	planId?: string;
}

export interface WorkoutFormData {
	userId?: string;
	date: string;
	type: string;
	notes?: string;
	synced: boolean;
	exercises: Exercise[];
}

export type SetType =
	| "max-reps" // Max ponavljanja do otkaza
	| "max-hold" // Max hold do otkaza
	| "regular-reps" // Normalna ponavljanja
	| "regular-hold" // Normalan hold
	| "weighted-reps" // Ponavljanja sa težinom
	| "weighted-hold"; // Hold sa težinom

// Helper funkcija za određivanje tipa seta
export function getSetType(set: WorkoutSet): SetType {
	const hasWeight = set.weight && parseFloat(set.weight) > 0;
	const hasReps = set.reps && parseInt(set.reps) > 0;
	const hasHold = set.hold && parseInt(set.hold) > 0;
	const isMax = set.isMax === true;

	if (isMax && hasReps) {
		return "max-reps";
	}
	if (isMax && hasHold) {
		return "max-hold";
	}
	if (hasWeight && hasReps) {
		return "weighted-reps";
	}
	if (hasWeight && hasHold) {
		return "weighted-hold";
	}
	if (hasReps) {
		return "regular-reps";
	}
	if (hasHold) {
		return "regular-hold";
	}

	return "regular-reps"; // fallback
}

// Helper funkcija za formatiranje seta za prikaz
export function formatSetDisplay(set: WorkoutSet): string {
	const type = getSetType(set);
	const weight = set.weight ? `${set.weight}kg` : "";
	const reps = set.reps ? `${set.reps} reps` : "";
	const hold = set.hold ? `${set.hold}s hold` : "";
	const maxIndicator = set.isMax ? " (MAX)" : "";

	switch (type) {
		case "max-reps":
			return `${reps}${maxIndicator} ${weight}`.trim();
		case "max-hold":
			return `${hold}${maxIndicator} ${weight}`.trim();
		case "weighted-reps":
			return `${weight} × ${reps}`.trim();
		case "weighted-hold":
			return `${weight} × ${hold}`.trim();
		case "regular-reps":
			return reps;
		case "regular-hold":
			return hold;
		default:
			return "";
	}
}
