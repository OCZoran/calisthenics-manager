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

// GET - dohvati sve goals za korisnika
export async function GET(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const difficulty = searchParams.get("difficulty");
		const completed = searchParams.get("completed");
		const category = searchParams.get("category");

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const query: any = { userId: user.id };

		if (difficulty) {
			query.difficulty = difficulty;
		}

		if (completed !== null) {
			query.completed = completed === "true";
		}

		if (category) {
			query.category = category;
		}

		const goals = await db
			.collection("goals")
			.find(query)
			.sort({ createdAt: -1 })
			.toArray();

		return NextResponse.json(
			goals.map((goal) => ({
				...goal,
				_id: goal._id.toString(),
			}))
		);
	} catch (error) {
		console.error("Error fetching goals:", error);
		return NextResponse.json(
			{ error: "Failed to fetch goals" },
			{ status: 500 }
		);
	}
}

// POST - kreiraj novi goal
export async function POST(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { title, category, description, startDate, difficulty, images } =
			await req.json();

		if (!title || !category || !difficulty) {
			return NextResponse.json(
				{ error: "Title, category and difficulty are required" },
				{ status: 400 }
			);
		}

		if (!["Easy", "Intermediate", "Advanced"].includes(difficulty)) {
			return NextResponse.json(
				{ error: "Invalid difficulty level" },
				{ status: 400 }
			);
		}

		// Provjeri da li već postoji goal sa istim nazivom
		const existingGoal = await db.collection("goals").findOne({
			userId: user.id,
			title: { $regex: new RegExp(`^${title}$`, "i") },
		});

		if (existingGoal) {
			return NextResponse.json(
				{ error: "Goal with this title already exists" },
				{ status: 400 }
			);
		}

		const now = new Date().toISOString();

		const newGoal = {
			userId: user.id,
			title,
			category,
			description: description || "",
			startDate: startDate || now.split("T")[0],
			difficulty,
			completed: false,
			updates: [],
			images: images || [], // ← KLJUČNA ISPRAVKA: čuvanje images niza
			createdAt: now,
			updatedAt: now,
		};

		const result = await db.collection("goals").insertOne(newGoal);

		return NextResponse.json({
			...newGoal,
			_id: result.insertedId.toString(),
		});
	} catch (error) {
		console.error("Error creating goal:", error);
		return NextResponse.json(
			{ error: "Failed to create goal" },
			{ status: 500 }
		);
	}
}

// PUT - ažuriraj postojeći goal
export async function PUT(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const goalId = searchParams.get("id");
		const { title, category, description, difficulty, completed, images } =
			await req.json();

		if (!goalId) {
			return NextResponse.json(
				{ error: "Goal ID is required" },
				{ status: 400 }
			);
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const updateData: any = {
			updatedAt: new Date().toISOString(),
		};

		if (title !== undefined) updateData.title = title;
		if (category !== undefined) updateData.category = category;
		if (description !== undefined) updateData.description = description;
		if (images !== undefined) updateData.images = images; // ← KLJUČNA ISPRAVKA: omogućavanje update-a images

		if (difficulty !== undefined) {
			if (!["Easy", "Intermediate", "Advanced"].includes(difficulty)) {
				return NextResponse.json(
					{ error: "Invalid difficulty level" },
					{ status: 400 }
				);
			}
			updateData.difficulty = difficulty;
		}

		if (completed !== undefined) {
			updateData.completed = completed;
			if (completed && !updateData.completedAt) {
				updateData.completedAt = new Date().toISOString();
			} else if (!completed) {
				updateData.$unset = { completedAt: "" };
			}
		}

		const result = await db
			.collection("goals")
			.updateOne(
				{ _id: new ObjectId(goalId), userId: user.id },
				updateData.$unset
					? { $set: updateData, $unset: updateData.$unset }
					: { $set: updateData }
			);

		if (result.matchedCount === 0) {
			return NextResponse.json({ error: "Goal not found" }, { status: 404 });
		}

		const updatedGoal = await db
			.collection("goals")
			.findOne({ _id: new ObjectId(goalId) });

		return NextResponse.json({
			...updatedGoal,
			_id: updatedGoal?._id.toString(),
		});
	} catch (error) {
		console.error("Error updating goal:", error);
		return NextResponse.json(
			{ error: "Failed to update goal" },
			{ status: 500 }
		);
	}
}

// DELETE - obriši goal
export async function DELETE(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const goalId = searchParams.get("id");

		if (!goalId) {
			return NextResponse.json(
				{ error: "Goal ID is required" },
				{ status: 400 }
			);
		}

		const result = await db
			.collection("goals")
			.deleteOne({ _id: new ObjectId(goalId), userId: user.id });

		if (result.deletedCount === 0) {
			return NextResponse.json({ error: "Goal not found" }, { status: 404 });
		}

		return NextResponse.json({ message: "Goal deleted successfully" });
	} catch (error) {
		console.error("Error deleting goal:", error);
		return NextResponse.json(
			{ error: "Failed to delete goal" },
			{ status: 500 }
		);
	}
}
