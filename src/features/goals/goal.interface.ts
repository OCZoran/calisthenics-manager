export interface GoalUpdate {
	id: string;
	date: string;
	notes: string;
	status: "progress" | "neutral" | "regress";
	images: string[];
	feeling: number;
	createdAt: string;
}

export interface Goal {
	_id: string;
	userId: string;
	title: string;
	category: string;
	description?: string;
	startDate: string;
	difficulty: "Easy" | "Intermediate" | "Advanced";
	completed: boolean;
	completedAt?: string;
	updates: GoalUpdate[];
	images?: string[]; // Dodato - slike/videi cilja
	createdAt: string;
	updatedAt: string;
}

export interface CreateGoalDto {
	title: string;
	category: string;
	description?: string;
	startDate: string;
	difficulty: "Easy" | "Intermediate" | "Advanced";
	images?: string[]; // Dodato
}

export interface UpdateGoalDto {
	title?: string;
	category?: string;
	description?: string;
	difficulty?: "Easy" | "Intermediate" | "Advanced";
	completed?: boolean;
	images?: string[]; // Dodato
}

export interface CreateUpdateDto {
	goalId: string;
	notes: string;
	status: "progress" | "neutral" | "regress";
	images: string[];
	feeling: number;
}
