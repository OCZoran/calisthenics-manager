export interface BodyMeasurement {
	_id?: string;
	userId: string;
	date: string;
	weight?: number;
	bodyFat?: number;
	photos?: string[];
	measurements: {
		chest?: number;
		waist?: number;
		hips?: number;
		biceps?: number;
		thighs?: number;
		calves?: number;
		neck?: number;
		shoulders?: number;
	};
	createdAt: string;
}

export interface UserProfile {
	_id?: string;
	userId: string;
	firstName: string;
	lastName: string;
	age?: number;
	height?: number;
	gender?: "male" | "female" | "other";
	updatedAt: string;
	activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very active";
	goal?: "lose_weight" | "maintain_weight" | "gain_weight";
	avatarUrl?: string;
	createdAt: string;
}
