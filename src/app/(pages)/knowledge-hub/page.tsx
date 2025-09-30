"use client";

import React, { useState, useEffect } from "react";
import {
	Container,
	Box,
	Typography,
	Tabs,
	Tab,
	CircularProgress,
	Alert,
} from "@mui/material";
import {
	LibraryBooksOutlined,
	CategoryOutlined,
	AddCircleOutlineOutlined,
} from "@mui/icons-material";
import {
	KnowledgeCategory,
	KnowledgeItem,
} from "@/features/knowledge/interfaces/knowledge.interface";
import CategoryForm from "@/features/knowledge/components/CategoryForm";
import KnowledgeList from "@/features/knowledge/components/KnowledgeList";
import KnowledgeItemForm from "@/features/knowledge/components/KnowledgeForm";

export default function KnowledgePage() {
	const [activeTab, setActiveTab] = useState(0);
	const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
	const [items, setItems] = useState<Record<string, KnowledgeItem[]>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			setLoading(true);

			// Fetch categories
			const categoriesResponse = await fetch("/api/knowledge");
			if (!categoriesResponse.ok) throw new Error("Failed to fetch categories");
			const categoriesData = await categoriesResponse.json();
			setCategories(categoriesData);

			// Fetch items for each category
			const itemsData: Record<string, KnowledgeItem[]> = {};
			for (const category of categoriesData) {
				const itemsResponse = await fetch(
					`/api/knowledge?categoryId=${category._id}`
				);
				if (itemsResponse.ok) {
					itemsData[category._id] = await itemsResponse.json();
				}
			}
			setItems(itemsData);
		} catch (err) {
			console.error("Error fetching data:", err);
			setError("Greška pri učitavanju podataka");
		} finally {
			setLoading(false);
		}
	};

	const handleCategoryAdded = (newCategory: KnowledgeCategory) => {
		setCategories((prev) => [newCategory, ...prev]);
		setItems((prev) => ({ ...prev, [newCategory._id]: [] }));
	};

	const handleItemAdded = (newItem: KnowledgeItem) => {
		setItems((prev) => ({
			...prev,
			[newItem.categoryId]: [newItem, ...(prev[newItem.categoryId] || [])],
		}));
	};

	const handleItemUpdated = (updatedItem: KnowledgeItem) => {
		setItems((prev) => ({
			...prev,
			[updatedItem.categoryId]: (prev[updatedItem.categoryId] || []).map(
				(item) => (item._id === updatedItem._id ? updatedItem : item)
			),
		}));
	};

	const handleItemDeleted = (itemId: string, categoryId: string) => {
		setItems((prev) => ({
			...prev,
			[categoryId]: (prev[categoryId] || []).filter(
				(item) => item._id !== itemId
			),
		}));
	};

	const handleCategoryDeleted = (categoryId: string) => {
		setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
		setItems((prev) => {
			const newItems = { ...prev };
			delete newItems[categoryId];
			return newItems;
		});
	};

	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "80vh",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Box sx={{ mb: 4 }}>
				<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
					<LibraryBooksOutlined
						sx={{ fontSize: 40, mr: 2, color: "primary.main" }}
					/>
					<Typography variant="h4" component="h1" fontWeight="bold">
						Knowledge Hub
					</Typography>
				</Box>
				<Typography variant="body1" color="text.secondary">
					Organizuj i čuvaj sve što učiš o calisthenics sportu - pokrete,
					tehnike, savete i sve što ti je važno. 💪
				</Typography>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
				<Tabs
					value={activeTab}
					onChange={(_, newValue) => setActiveTab(newValue)}
					variant="fullWidth"
				>
					<Tab
						icon={<LibraryBooksOutlined />}
						label="Pregled znanja"
						iconPosition="start"
					/>
					<Tab
						icon={<CategoryOutlined />}
						label="Nova kategorija"
						iconPosition="start"
					/>
					<Tab
						icon={<AddCircleOutlineOutlined />}
						label="Dodaj sadržaj"
						iconPosition="start"
					/>
				</Tabs>
			</Box>

			<Box sx={{ mt: 3 }}>
				{activeTab === 0 && (
					<KnowledgeList
						categories={categories}
						items={items}
						onItemUpdated={handleItemUpdated}
						onItemDeleted={handleItemDeleted}
						onCategoryDeleted={handleCategoryDeleted}
					/>
				)}

				{activeTab === 1 && (
					<CategoryForm onCategoryAdded={handleCategoryAdded} />
				)}

				{activeTab === 2 && (
					<KnowledgeItemForm
						categories={categories}
						onItemAdded={handleItemAdded}
					/>
				)}
			</Box>
		</Container>
	);
}
