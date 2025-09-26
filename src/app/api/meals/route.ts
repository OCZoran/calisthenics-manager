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

function calculateCalories(
	carbs: number,
	protein: number,
	fat: number
): number {
	// 1g ugljenih hidrata = 4 kcal
	// 1g proteina = 4 kcal
	// 1g masti = 9 kcal
	return carbs * 4 + protein * 4 + fat * 9;
}

// GET - dohvati sve meals za korisnika
export async function GET(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();

		const meals = await db
			.collection("meals")
			.find({ userId: user.id })
			.sort({ name: 1 })
			.toArray();

		return NextResponse.json(
			meals.map((meal) => ({
				...meal,
				_id: meal._id.toString(),
			}))
		);
	} catch (error) {
		console.error("Error fetching meals:", error);
		return NextResponse.json(
			{ error: "Failed to fetch meals" },
			{ status: 500 }
		);
	}
}

// POST - kreiraj novi meal
export async function POST(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { name, carbs, protein, fat } = await req.json();

		if (
			!name ||
			carbs === undefined ||
			protein === undefined ||
			fat === undefined
		) {
			return NextResponse.json(
				{ error: "Name, carbs, protein and fat are required" },
				{ status: 400 }
			);
		}

		// Provjeri da li već postoji meal sa istim nazivom
		const existingMeal = await db.collection("meals").findOne({
			userId: user.id,
			name: { $regex: new RegExp(`^${name}$`, "i") },
		});

		if (existingMeal) {
			return NextResponse.json(
				{ error: "Meal with this name already exists" },
				{ status: 400 }
			);
		}

		const calories = calculateCalories(carbs, protein, fat);
		const now = new Date().toISOString();

		const newMeal = {
			userId: user.id,
			name,
			carbs: Number(carbs),
			protein: Number(protein),
			fat: Number(fat),
			calories,
			createdAt: now,
			updatedAt: now,
		};

		const result = await db.collection("meals").insertOne(newMeal);

		return NextResponse.json({
			...newMeal,
			_id: result.insertedId.toString(),
		});
	} catch (error) {
		console.error("Error creating meal:", error);
		return NextResponse.json(
			{ error: "Failed to create meal" },
			{ status: 500 }
		);
	}
}

// PUT - ažuriraj postojeći meal
export async function PUT(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const mealId = searchParams.get("id");
		const { name, carbs, protein, fat } = await req.json();

		if (!mealId) {
			return NextResponse.json(
				{ error: "Meal ID is required" },
				{ status: 400 }
			);
		}

		if (
			!name ||
			carbs === undefined ||
			protein === undefined ||
			fat === undefined
		) {
			return NextResponse.json(
				{ error: "Name, carbs, protein and fat are required" },
				{ status: 400 }
			);
		}

		const calories = calculateCalories(carbs, protein, fat);
		const updateData = {
			name,
			carbs: Number(carbs),
			protein: Number(protein),
			fat: Number(fat),
			calories,
			updatedAt: new Date().toISOString(),
		};

		const result = await db
			.collection("meals")
			.updateOne(
				{ _id: new ObjectId(mealId), userId: user.id },
				{ $set: updateData }
			);

		if (result.matchedCount === 0) {
			return NextResponse.json({ error: "Meal not found" }, { status: 404 });
		}

		const updatedMeal = await db
			.collection("meals")
			.findOne({ _id: new ObjectId(mealId) });

		return NextResponse.json({
			...updatedMeal,
			_id: updatedMeal?._id.toString(),
		});
	} catch (error) {
		console.error("Error updating meal:", error);
		return NextResponse.json(
			{ error: "Failed to update meal" },
			{ status: 500 }
		);
	}
}

// DELETE - obriši meal
export async function DELETE(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const mealId = searchParams.get("id");

		if (!mealId) {
			return NextResponse.json(
				{ error: "Meal ID is required" },
				{ status: 400 }
			);
		}

		const result = await db
			.collection("meals")
			.deleteOne({ _id: new ObjectId(mealId), userId: user.id });

		if (result.deletedCount === 0) {
			return NextResponse.json({ error: "Meal not found" }, { status: 404 });
		}

		return NextResponse.json({ message: "Meal deleted successfully" });
	} catch (error) {
		console.error("Error deleting meal:", error);
		return NextResponse.json(
			{ error: "Failed to delete meal" },
			{ status: 500 }
		);
	}
}
