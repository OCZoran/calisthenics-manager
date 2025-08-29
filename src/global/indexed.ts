const DB_NAME = "WorkoutTrackerDB";
const DB_VERSION = 1;
const STORES = {
	workouts: "workouts",
	users: "users",
};

export const initDB = (): Promise<IDBDatabase> => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			if (!db.objectStoreNames.contains(STORES.workouts)) {
				db.createObjectStore(STORES.workouts, {
					keyPath: "id",
					autoIncrement: true,
				});
			}

			if (!db.objectStoreNames.contains(STORES.users)) {
				db.createObjectStore(STORES.users, { keyPath: "id" });
			}
		};
	});
};
