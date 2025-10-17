import { useEffect, useCallback, useRef } from "react";
import { WorkoutFormData } from "@/global/interfaces/workout.interface";

const DRAFT_KEY = "workout_draft";
const AUTOSAVE_DELAY = 2000;

interface UseDraftAutosaveOptions {
	isEditMode?: boolean;
	workoutId?: string;
}

export const useDraftAutosave = (
	formData: WorkoutFormData,
	options: UseDraftAutosaveOptions = {}
) => {
	const { isEditMode = false, workoutId } = options;
	const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
	const initialLoadRef = useRef(true);

	// Proveri da li ima draft
	const hasDraft = useCallback((): boolean => {
		try {
			const draft = localStorage.getItem(DRAFT_KEY);
			return draft !== null;
		} catch {
			return false;
		}
	}, []);

	// Učitaj draft
	const loadDraft = useCallback((): WorkoutFormData | null => {
		try {
			const draft = localStorage.getItem(DRAFT_KEY);
			if (!draft) return null;

			const parsed = JSON.parse(draft);

			// Proveri da li je draft svež (ne stariji od 24h)
			const savedAt = new Date(parsed.savedAt).getTime();
			const now = Date.now();
			const hoursDiff = (now - savedAt) / (1000 * 60 * 60);

			if (hoursDiff > 24) {
				localStorage.removeItem(DRAFT_KEY);
				return null;
			}

			return parsed.data;
		} catch (error) {
			console.error("Error loading draft:", error);
			return null;
		}
	}, []);

	// Sačuvaj draft
	const saveDraft = useCallback(
		(data: WorkoutFormData) => {
			// Ne čuvaj draft ako je edit mode
			if (isEditMode) return;

			try {
				const draft = {
					data,
					savedAt: new Date().toISOString(),
					workoutId: workoutId || null,
				};
				localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
			} catch (error) {
				console.error("Error saving draft:", error);
			}
		},
		[isEditMode, workoutId]
	);

	// Obriši draft
	const clearDraft = useCallback(() => {
		try {
			localStorage.removeItem(DRAFT_KEY);
		} catch (error) {
			console.error("Error clearing draft:", error);
		}
	}, []);

	// Auto-save sa debounce-om
	useEffect(() => {
		// Preskoči inicijalno učitavanje
		if (initialLoadRef.current) {
			initialLoadRef.current = false;
			return;
		}

		// Ne čuvaj ako je prazan (samo default vrednosti)
		const isEmpty =
			formData.exercises.length === 0 && !formData.type && !formData.notes;

		if (isEmpty || isEditMode) return;

		// Očisti prethodni timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Postavi novi timeout za čuvanje
		timeoutRef.current = setTimeout(() => {
			saveDraft(formData);
		}, AUTOSAVE_DELAY);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [formData, saveDraft, isEditMode]);

	// Cleanup na unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return {
		hasDraft,
		loadDraft,
		saveDraft,
		clearDraft,
	};
};
