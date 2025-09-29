// Kategorije pokreta
export type MovementCategory = "pull" | "push" | "legs" | "core";

// Dodatni tagovi
export type ExerciseTag = "cardio" | "skills" | "mobility" | "flexibility";

// Tipovi treninga
export type WorkoutType =
	| "pull"
	| "push"
	| "legs"
	| "core"
	| "upper" // pull + push
	| "lower" // legs + core
	| "full-body" // sve kategorije
	| "cardio"
	| "skills"
	| "mobility";

// Definicija vježbe u bazi
export interface ExerciseDefinition {
	_id?: string;
	userId: string;
	name: string;
	description?: string;
	category: MovementCategory; // Primarna kategorija (pull/push/legs/core)
	tags: ExerciseTag[]; // Dodatni tagovi (cardio, skills, mobility)
	isBodyweight: boolean; // Da li je vježba sa sopstvenom težinom
	videoUrl?: string; // Opciono: link ka video tutorialu
	notes?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

// Helper funkcija za određivanje dostupnih vježbi po tipu treninga
export const getAvailableCategoriesForWorkoutType = (
	workoutType: WorkoutType
): MovementCategory[] => {
	const categoryMap: Record<WorkoutType, MovementCategory[]> = {
		pull: ["pull"],
		push: ["push"],
		legs: ["legs"],
		core: ["core"],
		upper: ["pull", "push"],
		lower: ["legs", "core"],
		"full-body": ["pull", "push", "legs", "core"],
		cardio: [], // Cardio koristi samo tagove
		skills: [], // Skills koristi samo tagove
		mobility: [], // Mobility koristi samo tagove
	};

	return categoryMap[workoutType] || [];
};

// Helper za filtriranje vježbi po tipu treninga
export const filterExercisesByWorkoutType = (
	exercises: ExerciseDefinition[],
	workoutType: WorkoutType
): ExerciseDefinition[] => {
	// Posebni tipovi treninga (cardio, skills, mobility)
	const specialTypes: WorkoutType[] = ["cardio", "skills", "mobility"];

	if (specialTypes.includes(workoutType)) {
		// Za specijalne tipove, filtriraj po tagovima
		return exercises.filter((ex) =>
			ex.tags.includes(workoutType as ExerciseTag)
		);
	}

	// Za standardne tipove, filtriraj po kategorijama + uvijek dodaj sve sa tagovima
	const allowedCategories = getAvailableCategoriesForWorkoutType(workoutType);

	return exercises.filter(
		(ex) => allowedCategories.includes(ex.category) || ex.tags.length > 0 // Vježbe sa tagovima su dostupne svugdje
	);
};

// Grupiranje vježbi za prikaz u dropdown-u
export interface ExerciseGroup {
	label: string;
	exercises: ExerciseDefinition[];
	isSpecial?: boolean; // Za cardio, skills, mobility grupe
}

export const groupExercisesForWorkoutType = (
	exercises: ExerciseDefinition[],
	workoutType: WorkoutType
): ExerciseGroup[] => {
	const filtered = filterExercisesByWorkoutType(exercises, workoutType);
	const groups: ExerciseGroup[] = [];

	// Grupiši po kategorijama
	const allowedCategories = getAvailableCategoriesForWorkoutType(workoutType);

	allowedCategories.forEach((category) => {
		const categoryExercises = filtered.filter(
			(ex) => ex.category === category && ex.tags.length === 0
		);

		if (categoryExercises.length > 0) {
			groups.push({
				label: getCategoryLabel(category),
				exercises: categoryExercises,
			});
		}
	});

	// Dodaj special grupe (cardio, skills, mobility) - uvijek dostupne
	const specialTags: ExerciseTag[] = ["cardio", "skills", "mobility"];

	specialTags.forEach((tag) => {
		const tagExercises = exercises.filter((ex) => ex.tags.includes(tag));

		if (tagExercises.length > 0) {
			groups.push({
				label: getTagLabel(tag),
				exercises: tagExercises,
				isSpecial: true,
			});
		}
	});

	return groups;
};

// Label mappings
export const getCategoryLabel = (category: MovementCategory): string => {
	const labels: Record<MovementCategory, string> = {
		pull: "Pull",
		push: "Push",
		legs: "Legs",
		core: "Core",
	};
	return labels[category];
};

export const getTagLabel = (tag: ExerciseTag): string => {
	const labels: Record<ExerciseTag, string> = {
		cardio: "Cardio",
		skills: "Skills",
		mobility: "Mobility / Flexibility",
		flexibility: "Flexibility",
	};
	return labels[tag];
};

export const getWorkoutTypeLabel = (type: WorkoutType): string => {
	const labels: Record<WorkoutType, string> = {
		pull: "Pull",
		push: "Push",
		legs: "Legs",
		core: "Core",
		upper: "Upper Body",
		lower: "Lower Body",
		"full-body": "Full Body",
		cardio: "Cardio",
		skills: "Skills",
		mobility: "Mobility",
	};
	return labels[type];
};
