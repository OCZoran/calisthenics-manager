/* eslint-disable @typescript-eslint/no-explicit-any */
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

// GET - dohvati food log za određeni datum ili sve logove
export async function GET(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const date = searchParams.get("date");

		if (date) {
			// Dohvati log za specifičan datum
			const foodLog = await db
				.collection("dailyFoodLogs")
				.findOne({ userId: user.id, date });

			if (!foodLog) {
				return NextResponse.json({
					date,
					entries: [],
					totalCarbs: 0,
					totalProtein: 0,
					totalFat: 0,
					totalCalories: 0,
				});
			}

			return NextResponse.json({
				...foodLog,
				_id: foodLog._id.toString(),
			});
		} else {
			// Dohvati sve logove, sortirane po datumu (najnoviji prvo)
			const foodLogs = await db
				.collection("dailyFoodLogs")
				.find({ userId: user.id })
				.sort({ date: -1 })
				.limit(30) // posledjih 30 dana
				.toArray();

			return NextResponse.json(
				foodLogs.map((log) => ({
					...log,
					_id: log._id.toString(),
				}))
			);
		}
	} catch (error) {
		console.error("Error fetching food log:", error);
		return NextResponse.json(
			{ error: "Failed to fetch food log" },
			{ status: 500 }
		);
	}
}

// POST - dodaj entry u dnevni log
export async function POST(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { date, mealId, quantity } = await req.json();

		if (!date || !mealId || !quantity) {
			return NextResponse.json(
				{ error: "Date, mealId and quantity are required" },
				{ status: 400 }
			);
		}

		// Dohvati meal podatke
		const meal = await db
			.collection("meals")
			.findOne({ _id: new ObjectId(mealId), userId: user.id });

		if (!meal) {
			return NextResponse.json({ error: "Meal not found" }, { status: 404 });
		}

		// Kalkuliši makronutrijente na osnovu količine
		const entry = {
			mealId: mealId,
			name: meal.name,
			quantity: Number(quantity),
			carbs: Math.round(meal.carbs * quantity * 10) / 10,
			protein: Math.round(meal.protein * quantity * 10) / 10,
			fat: Math.round(meal.fat * quantity * 10) / 10,
			calories: Math.round(meal.calories * quantity),
		};

		// Pronađi ili kreiraj dnevni log
		const dailyLog = await db
			.collection("dailyFoodLogs")
			.findOne({ userId: user.id, date });

		const now = new Date().toISOString();

		if (!dailyLog) {
			// Kreiraj novi dnevni log
			const newLog = {
				userId: user.id,
				date,
				entries: [entry],
				totalCarbs: entry.carbs,
				totalProtein: entry.protein,
				totalFat: entry.fat,
				totalCalories: entry.calories,
				createdAt: now,
				updatedAt: now,
			};

			const result = await db.collection("dailyFoodLogs").insertOne(newLog);

			return NextResponse.json({
				...newLog,
				_id: result.insertedId.toString(),
			});
		} else {
			// Dodaj entry u postojeći log
			const updatedEntries = [...dailyLog.entries, entry];
			const totals = updatedEntries.reduce(
				(acc, curr) => ({
					totalCarbs: acc.totalCarbs + curr.carbs,
					totalProtein: acc.totalProtein + curr.protein,
					totalFat: acc.totalFat + curr.fat,
					totalCalories: acc.totalCalories + curr.calories,
				}),
				{ totalCarbs: 0, totalProtein: 0, totalFat: 0, totalCalories: 0 }
			);

			const updateData = {
				entries: updatedEntries,
				totalCarbs: Math.round(totals.totalCarbs * 10) / 10,
				totalProtein: Math.round(totals.totalProtein * 10) / 10,
				totalFat: Math.round(totals.totalFat * 10) / 10,
				totalCalories: Math.round(totals.totalCalories),
				updatedAt: now,
			};

			await db
				.collection("dailyFoodLogs")
				.updateOne({ _id: dailyLog._id }, { $set: updateData });

			const updatedLog = await db
				.collection("dailyFoodLogs")
				.findOne({ _id: dailyLog._id });

			return NextResponse.json({
				...updatedLog,
				_id: updatedLog?._id.toString(),
			});
		}
	} catch (error) {
		console.error("Error adding food log entry:", error);
		return NextResponse.json(
			{ error: "Failed to add food log entry" },
			{ status: 500 }
		);
	}
}

export async function PUT(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { date, entryIndex, mealId, quantity } = await req.json();

		if (!date || entryIndex === undefined || !mealId || !quantity) {
			return NextResponse.json(
				{ error: "Date, entryIndex, mealId and quantity are required" },
				{ status: 400 }
			);
		}

		// Dohvati meal podatke
		const meal = await db
			.collection("meals")
			.findOne({ _id: new ObjectId(mealId), userId: user.id });

		if (!meal) {
			return NextResponse.json({ error: "Meal not found" }, { status: 404 });
		}

		// Dohvati dnevni log
		const dailyLog = await db
			.collection("dailyFoodLogs")
			.findOne({ userId: user.id, date });

		if (!dailyLog) {
			return NextResponse.json(
				{ error: "Daily food log not found" },
				{ status: 404 }
			);
		}

		const index = parseInt(entryIndex);
		if (index < 0 || index >= dailyLog.entries.length) {
			return NextResponse.json(
				{ error: "Invalid entry index" },
				{ status: 400 }
			);
		}

		// Kreiraj ažurirani entry
		const updatedEntry = {
			mealId: mealId,
			mealName: meal.name,
			name: meal.name,
			quantity: Number(quantity),
			carbs: Math.round(meal.carbs * quantity * 10) / 10,
			protein: Math.round(meal.protein * quantity * 10) / 10,
			fat: Math.round(meal.fat * quantity * 10) / 10,
			calories: Math.round(meal.calories * quantity),
		};

		// Zameni stari entry sa novim
		const updatedEntries = [...dailyLog.entries];
		updatedEntries[index] = updatedEntry;

		// Kalkuliši nove totale
		const totals = updatedEntries.reduce(
			(
				acc: {
					totalCarbs: any;
					totalProtein: any;
					totalFat: any;
					totalCalories: any;
				},
				curr: { carbs: any; protein: any; fat: any; calories: any }
			) => ({
				totalCarbs: acc.totalCarbs + curr.carbs,
				totalProtein: acc.totalProtein + curr.protein,
				totalFat: acc.totalFat + curr.fat,
				totalCalories: acc.totalCalories + curr.calories,
			}),
			{ totalCarbs: 0, totalProtein: 0, totalFat: 0, totalCalories: 0 }
		);

		const updateData = {
			entries: updatedEntries,
			totalCarbs: Math.round(totals.totalCarbs * 10) / 10,
			totalProtein: Math.round(totals.totalProtein * 10) / 10,
			totalFat: Math.round(totals.totalFat * 10) / 10,
			totalCalories: Math.round(totals.totalCalories),
			updatedAt: new Date().toISOString(),
		};

		await db
			.collection("dailyFoodLogs")
			.updateOne({ _id: dailyLog._id }, { $set: updateData });

		const updatedLog = await db
			.collection("dailyFoodLogs")
			.findOne({ _id: dailyLog._id });

		return NextResponse.json({
			...updatedLog,
			_id: updatedLog?._id.toString(),
		});
	} catch (error) {
		console.error("Error updating food log entry:", error);
		return NextResponse.json(
			{ error: "Failed to update food log entry" },
			{ status: 500 }
		);
	}
}

// DELETE - ukloni entry iz dnevnog loga
export async function DELETE(req: NextRequest) {
	try {
		const user = await getUserFromToken(req);
		const { db } = await getDatabase();
		const { searchParams } = new URL(req.url);
		const date = searchParams.get("date");
		const entryIndex = searchParams.get("entryIndex");

		if (!date || entryIndex === null) {
			return NextResponse.json(
				{ error: "Date and entryIndex are required" },
				{ status: 400 }
			);
		}

		const dailyLog = await db
			.collection("dailyFoodLogs")
			.findOne({ userId: user.id, date });

		if (!dailyLog) {
			return NextResponse.json(
				{ error: "Daily food log not found" },
				{ status: 404 }
			);
		}

		const index = parseInt(entryIndex);
		if (index < 0 || index >= dailyLog.entries.length) {
			return NextResponse.json(
				{ error: "Invalid entry index" },
				{ status: 400 }
			);
		}

		// Ukloni entry
		const updatedEntries = dailyLog.entries.filter(
			(_: any, i: number) => i !== index
		);

		if (updatedEntries.length === 0) {
			// Ako nema više entries, obriši ceo daily log
			await db.collection("dailyFoodLogs").deleteOne({ _id: dailyLog._id });

			return NextResponse.json({
				date,
				entries: [],
				totalCarbs: 0,
				totalProtein: 0,
				totalFat: 0,
				totalCalories: 0,
			});
		} else {
			// Kalkuliši nove totale
			const totals = updatedEntries.reduce(
				(
					acc: {
						totalCarbs: any;
						totalProtein: any;
						totalFat: any;
						totalCalories: any;
					},
					curr: { carbs: any; protein: any; fat: any; calories: any }
				) => ({
					totalCarbs: acc.totalCarbs + curr.carbs,
					totalProtein: acc.totalProtein + curr.protein,
					totalFat: acc.totalFat + curr.fat,
					totalCalories: acc.totalCalories + curr.calories,
				}),
				{ totalCarbs: 0, totalProtein: 0, totalFat: 0, totalCalories: 0 }
			);

			const updateData = {
				entries: updatedEntries,
				totalCarbs: Math.round(totals.totalCarbs * 10) / 10,
				totalProtein: Math.round(totals.totalProtein * 10) / 10,
				totalFat: Math.round(totals.totalFat * 10) / 10,
				totalCalories: Math.round(totals.totalCalories),
				updatedAt: new Date().toISOString(),
			};

			await db
				.collection("dailyFoodLogs")
				.updateOne({ _id: dailyLog._id }, { $set: updateData });

			const updatedLog = await db
				.collection("dailyFoodLogs")
				.findOne({ _id: dailyLog._id });

			return NextResponse.json({
				...updatedLog,
				_id: updatedLog?._id.toString(),
			});
		}
	} catch (error) {
		console.error("Error deleting food log entry:", error);
		return NextResponse.json(
			{ error: "Failed to delete food log entry" },
			{ status: 500 }
		);
	}
}
