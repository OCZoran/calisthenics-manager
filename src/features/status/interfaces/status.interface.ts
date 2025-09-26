export interface StatusEntry {
	_id: string;
	userId: string;
	exerciseName: string;
	repetitions?: number;
	weight?: number;
	holdTime?: number;
	unit: "kg" | "lbs";
	createdAt: string;
	updatedAt: string;
}

export interface CreateStatusEntryRequest {
	exerciseName: string;
	repetitions?: number;
	weight?: number;
	holdTime?: number;
	unit: "kg" | "lbs";
}

export interface UpdateStatusEntryRequest {
	repetitions?: number;
	weight?: number;
	holdTime?: number;
	unit?: "kg" | "lbs";
}
