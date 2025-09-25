export interface JournalEntry {
	_id: string;
	userId: string;
	date: string;
	title: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateJournalEntryRequest {
	date: string;
	title: string;
	content: string;
}

export interface UpdateJournalEntryRequest {
	title?: string;
	content?: string;
}
