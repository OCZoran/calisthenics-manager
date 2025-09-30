export interface KnowledgeCategory {
	_id: string;
	userId: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	createdAt: string;
	updatedAt: string;
}

export interface KnowledgeItem {
	_id: string;
	userId: string;
	categoryId: string;
	title: string;
	content: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
	difficulty: "beginner" | "intermediate" | "advanced" | "elite";
}

export interface KnowledgeCategoryWithItems extends KnowledgeCategory {
	items: KnowledgeItem[];
}
