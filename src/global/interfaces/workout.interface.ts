export interface WorkoutSet {
	reps: string;
	rest: string;
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
}

export interface WorkoutFormData {
	date: string;
	type: string;
	notes?: string;
	synced: boolean;
	exercises: Exercise[];
}
