import { NextResponse } from "next/server";
import { getDatabase } from "@/global/mongodb";
import { ObjectId } from "mongodb";
import getUserIdFromToken from "@/global/utils/get-user-id";

// GET - Dohvati sva mjerenja usera
export async function GET() {
	try {
		const userId = await getUserIdFromToken();

		if (!userId) {
			return NextResponse.json(
				{ error: "Neautorizovani pristup" },
				{ status: 401 }
			);
		}

		const { db } = await getDatabase();

		const measurements = await db
			.collection("body_measurements")
			.find({ userId: userId }) // Koristi userId direktno
			.sort({ date: -1, createdAt: -1 })
			.toArray();

		const formattedMeasurements = measurements.map((m) => ({
			_id: m._id.toString(),
			userId: m.userId,
			date: m.date,
			weight: m.weight,
			bodyFat: m.bodyFat,
			measurements: m.measurements,
			createdAt: m.createdAt,
		}));

		return NextResponse.json(formattedMeasurements);
	} catch (error) {
		console.error("Error fetching measurements:", error);
		return NextResponse.json(
			{ error: "Greška pri učitavanju mjerenja" },
			{ status: 500 }
		);
	}
}

// POST - Dodaj novo mjerenje
export async function POST(request: Request) {
	try {
		const userId = await getUserIdFromToken();

		if (!userId) {
			return NextResponse.json(
				{ error: "Neautorizovani pristup" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { date, weight, bodyFat, measurements } = body;

		if (!date) {
			return NextResponse.json({ error: "Datum je obavezan" }, { status: 400 });
		}

		const { db } = await getDatabase();

		const newMeasurement = {
			userId: userId, // Koristi userId direktno
			date,
			weight: weight ? Number(weight) : null,
			bodyFat: bodyFat ? Number(bodyFat) : null,
			measurements: {
				chest: measurements?.chest ? Number(measurements.chest) : null,
				waist: measurements?.waist ? Number(measurements.waist) : null,
				hips: measurements?.hips ? Number(measurements.hips) : null,
				biceps: measurements?.biceps ? Number(measurements.biceps) : null,
				thighs: measurements?.thighs ? Number(measurements.thighs) : null,
				calves: measurements?.calves ? Number(measurements.calves) : null,
				neck: measurements?.neck ? Number(measurements.neck) : null,
				shoulders: measurements?.shoulders
					? Number(measurements.shoulders)
					: null,
			},
			createdAt: new Date().toISOString(),
		};

		const result = await db
			.collection("body_measurements")
			.insertOne(newMeasurement);

		return NextResponse.json({
			_id: result.insertedId.toString(),
			...newMeasurement,
		});
	} catch (error) {
		console.error("Error creating measurement:", error);
		return NextResponse.json(
			{ error: "Greška pri dodavanju mjerenja" },
			{ status: 500 }
		);
	}
}

// PUT i DELETE metode - ista izmjena
export async function PUT(request: Request) {
	try {
		const userId = await getUserIdFromToken();

		if (!userId) {
			return NextResponse.json(
				{ error: "Neautorizovani pristup" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { _id, date, weight, bodyFat, measurements } = body;

		if (!_id || !date) {
			return NextResponse.json(
				{ error: "ID i datum su obavezni" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		const updateData = {
			date,
			weight: weight ? Number(weight) : null,
			bodyFat: bodyFat ? Number(bodyFat) : null,
			measurements: {
				chest: measurements?.chest ? Number(measurements.chest) : null,
				waist: measurements?.waist ? Number(measurements.waist) : null,
				hips: measurements?.hips ? Number(measurements.hips) : null,
				biceps: measurements?.biceps ? Number(measurements.biceps) : null,
				thighs: measurements?.thighs ? Number(measurements.thighs) : null,
				calves: measurements?.calves ? Number(measurements.calves) : null,
				neck: measurements?.neck ? Number(measurements.neck) : null,
				shoulders: measurements?.shoulders
					? Number(measurements.shoulders)
					: null,
			},
		};

		const result = await db
			.collection("body_measurements")
			.findOneAndUpdate(
				{ _id: new ObjectId(_id), userId: userId },
				{ $set: updateData },
				{ returnDocument: "after" }
			);

		if (!result) {
			return NextResponse.json(
				{ error: "Mjerenje nije pronađeno" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			_id: result._id.toString(),
			userId: result.userId,
			...updateData,
			createdAt: result.createdAt,
		});
	} catch (error) {
		console.error("Error updating measurement:", error);
		return NextResponse.json(
			{ error: "Greška pri ažuriranju mjerenja" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const userId = await getUserIdFromToken();

		if (!userId) {
			return NextResponse.json(
				{ error: "Neautorizovani pristup" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const measurementId = searchParams.get("id");

		if (!measurementId) {
			return NextResponse.json(
				{ error: "ID mjerenja je obavezan" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		const result = await db.collection("body_measurements").deleteOne({
			_id: new ObjectId(measurementId),
			userId: userId,
		});

		if (result.deletedCount === 0) {
			return NextResponse.json(
				{ error: "Mjerenje nije pronađeno" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ message: "Mjerenje uspješno obrisano" });
	} catch (error) {
		console.error("Error deleting measurement:", error);
		return NextResponse.json(
			{ error: "Greška pri brisanju mjerenja" },
			{ status: 500 }
		);
	}
}
