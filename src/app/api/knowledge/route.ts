import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

async function getUserFromToken(req: NextRequest) {
	const token = req.cookies.get("token")?.value;
	if (!token) {
		throw new Error("No authentication token");
	}

	const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
		id: string;
		email: string;
	};
	return decoded;
}

// GET - dohvati sve kategorije sa njihovim items
export async function GET(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const categoryId = searchParams.get("categoryId");

		// Ako je categoryId prosleđen, vrati samo items te kategorije
		if (categoryId) {
			const items = await db
				.collection("knowledgeItems")
				.find({ userId: user.id, categoryId })
				.sort({ createdAt: -1 })
				.toArray();

			return NextResponse.json(
				items.map((item) => ({
					...item,
					_id: item._id.toString(),
				}))
			);
		}

		// Inače vrati sve kategorije
		const categories = await db
			.collection("knowledgeCategories")
			.find({ userId: user.id })
			.sort({ createdAt: -1 })
			.toArray();

		return NextResponse.json(
			categories.map((cat) => ({
				...cat,
				_id: cat._id.toString(),
			}))
		);
	} catch (error) {
		console.error("Error fetching knowledge data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch knowledge data" },
			{ status: 500 }
		);
	}
}

// POST - kreiraj novu kategoriju ili item
export async function POST(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const body = await req.json();
		const { type } = body; // 'category' ili 'item'

		if (type === "category") {
			const { name, description, icon, color } = body;

			if (!name) {
				return NextResponse.json(
					{ error: "Name is required" },
					{ status: 400 }
				);
			}

			const now = new Date().toISOString();
			const newCategory = {
				userId: user.id,
				name,
				description: description || "",
				icon: icon || "📚",
				color: color || "#1976d2",
				createdAt: now,
				updatedAt: now,
			};

			const result = await db
				.collection("knowledgeCategories")
				.insertOne(newCategory);

			return NextResponse.json({
				...newCategory,
				_id: result.insertedId.toString(),
			});
		} else if (type === "item") {
			const { categoryId, title, content, tags, difficulty } = body;

			if (!categoryId || !title || !content) {
				return NextResponse.json(
					{ error: "CategoryId, title and content are required" },
					{ status: 400 }
				);
			}

			const now = new Date().toISOString();
			const newItem = {
				userId: user.id,
				categoryId,
				title,
				content,
				difficulty,
				tags: tags || [],
				createdAt: now,
				updatedAt: now,
			};

			const result = await db.collection("knowledgeItems").insertOne(newItem);

			return NextResponse.json({
				...newItem,
				_id: result.insertedId.toString(),
			});
		}

		return NextResponse.json({ error: "Invalid type" }, { status: 400 });
	} catch (error) {
		console.error("Error creating knowledge data:", error);
		return NextResponse.json(
			{ error: "Failed to create knowledge data" },
			{ status: 500 }
		);
	}
}

// PUT - ažuriraj kategoriju ili item
export async function PUT(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const id = searchParams.get("id");
		const type = searchParams.get("type"); // 'category' ili 'item'

		if (!id || !type) {
			return NextResponse.json(
				{ error: "ID and type are required" },
				{ status: 400 }
			);
		}

		const body = await req.json();
		const collection =
			type === "category" ? "knowledgeCategories" : "knowledgeItems";

		const updateData = {
			...body,
			updatedAt: new Date().toISOString(),
		};
		delete updateData.type;

		const result = await db
			.collection(collection)
			.updateOne(
				{ _id: new ObjectId(id), userId: user.id },
				{ $set: updateData }
			);

		if (result.matchedCount === 0) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const updated = await db
			.collection(collection)
			.findOne({ _id: new ObjectId(id) });

		return NextResponse.json({
			...updated,
			_id: updated?._id.toString(),
		});
	} catch (error) {
		console.error("Error updating knowledge data:", error);
		return NextResponse.json(
			{ error: "Failed to update knowledge data" },
			{ status: 500 }
		);
	}
}

// DELETE - obriši kategoriju ili item
export async function DELETE(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const id = searchParams.get("id");
		const type = searchParams.get("type"); // 'category' ili 'item'

		if (!id || !type) {
			return NextResponse.json(
				{ error: "ID and type are required" },
				{ status: 400 }
			);
		}

		if (type === "category") {
			// Obriši i sve items te kategorije
			await db.collection("knowledgeItems").deleteMany({
				userId: user.id,
				categoryId: id,
			});
		}

		const collection =
			type === "category" ? "knowledgeCategories" : "knowledgeItems";

		const result = await db
			.collection(collection)
			.deleteOne({ _id: new ObjectId(id), userId: user.id });

		if (result.deletedCount === 0) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		return NextResponse.json({ message: "Deleted successfully" });
	} catch (error) {
		console.error("Error deleting knowledge data:", error);
		return NextResponse.json(
			{ error: "Failed to delete knowledge data" },
			{ status: 500 }
		);
	}
}
