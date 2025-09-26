// src/app/food/interface/food.interface.ts

// Meal interfaces
export interface Meal {
	_id: string;
	userId: string;
	name: string;
	carbs: number; // u gramima
	protein: number; // u gramima
	fat: number; // u gramima
	calories: number; // automatski kalkulisano
	createdAt: string;
	updatedAt: string;
}

export interface MealFormData {
	name: string;
	carbs: number;
	protein: number;
	fat: number;
}

// Daily food log interfaces
export interface FoodLogEntry {
	mealId: string;
	mealName: string;
	quantity: number; // koliko porcija
	carbs: number;
	protein: number;
	fat: number;
	calories: number;
}

export interface DailyFoodLog {
	_id: string;
	userId: string;
	date: string; // YYYY-MM-DD format
	entries: FoodLogEntry[];
	totalCarbs: number;
	totalProtein: number;
	totalFat: number;
	totalCalories: number;
	createdAt: string;
	updatedAt: string;
}

export interface FoodGoals {
	carbs: number;
	protein: number;
	fat: number;
	calories: number;
}

export interface MacroProgress {
	current: number;
	goal: number;
	percentage: number;
}
