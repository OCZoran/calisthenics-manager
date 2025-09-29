import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/global/mongodb";
import getUserIdFromToken from "@/global/utils/get-user-id";

// GET - Dohvati profil trenutnog usera
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

		// Provjeri da li user postoji
		const user = await db
			.collection("users")
			.findOne({ _id: new ObjectId(userId) });

		if (!user) {
			return NextResponse.json(
				{ error: "Korisnik nije pronađen" },
				{ status: 404 }
			);
		}

		// Nađi ili kreiraj profil
		let profile = await db.collection("user_profiles").findOne({
			userId: userId,
		});

		if (!profile) {
			// Kreiraj default profil
			const nameParts = user.name?.split(" ") || ["", ""];
			const newProfile = {
				userId: userId,
				firstName: nameParts[0] || "",
				lastName: nameParts.slice(1).join(" ") || "",
				age: null,
				height: null,
				gender: null,
				activityLevel: null,
				goal: null,
				avatarUrl: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = await db.collection("user_profiles").insertOne(newProfile);
			profile = { ...newProfile, _id: result.insertedId };
		}

		return NextResponse.json({
			_id: profile._id.toString(),
			userId: profile.userId,
			firstName: profile.firstName,
			lastName: profile.lastName,
			age: profile.age,
			height: profile.height,
			gender: profile.gender,
			activityLevel: profile.activityLevel,
			goal: profile.goal,
			avatarUrl: profile.avatarUrl,
			createdAt: profile.createdAt,
			updatedAt: profile.updatedAt,
		});
	} catch (error) {
		console.error("Error fetching user profile:", error);
		return NextResponse.json(
			{ error: "Greška pri učitavanju profila" },
			{ status: 500 }
		);
	}
}

// PUT - Ažuriraj profil
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
		const {
			firstName,
			lastName,
			age,
			height,
			gender,
			activityLevel,
			goal,
			avatarUrl,
		} = body;

		// Validacija
		if (!firstName || !lastName) {
			return NextResponse.json(
				{ error: "Ime i prezime su obavezni" },
				{ status: 400 }
			);
		}

		if (age !== null && age !== undefined) {
			const ageNum = Number(age);
			if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
				return NextResponse.json(
					{ error: "Nevažeća starost" },
					{ status: 400 }
				);
			}
		}

		if (height !== null && height !== undefined) {
			const heightNum = Number(height);
			if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
				return NextResponse.json({ error: "Nevažeća visina" }, { status: 400 });
			}
		}

		if (gender && !["male", "female", "other"].includes(gender)) {
			return NextResponse.json({ error: "Nevažeći pol" }, { status: 400 });
		}

		if (
			activityLevel &&
			!["sedentary", "light", "moderate", "active", "very_active"].includes(
				activityLevel
			)
		) {
			return NextResponse.json(
				{ error: "Nevažeći nivo aktivnosti" },
				{ status: 400 }
			);
		}

		if (goal && !["muscle_gain", "fat_loss", "maintenance"].includes(goal)) {
			return NextResponse.json({ error: "Nevažeći cilj" }, { status: 400 });
		}

		const { db } = await getDatabase();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const updateData: any = {
			userId: userId,
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			age: age ? Number(age) : null,
			height: height ? Number(height) : null,
			gender: gender || null,
			activityLevel: activityLevel || null,
			goal: goal || null,
			updatedAt: new Date(),
		};

		// Ažuriraj avatarUrl samo ako je proslijeđen
		if (avatarUrl !== undefined) {
			updateData.avatarUrl = avatarUrl;
		}

		const result = await db.collection("user_profiles").findOneAndUpdate(
			{ userId: userId },
			{
				$set: updateData,
				$setOnInsert: { createdAt: new Date() },
			},
			{ upsert: true, returnDocument: "after" }
		);

		return NextResponse.json({
			_id: result?._id.toString(),
			userId: result?.userId,
			firstName: result?.firstName,
			lastName: result?.lastName,
			age: result?.age,
			height: result?.height,
			gender: result?.gender,
			activityLevel: result?.activityLevel,
			goal: result?.goal,
			avatarUrl: result?.avatarUrl,
			createdAt: result?.createdAt,
			updatedAt: result?.updatedAt,
		});
	} catch (error) {
		console.error("Error updating user profile:", error);
		return NextResponse.json(
			{ error: "Greška pri ažuriranju profila" },
			{ status: 500 }
		);
	}
}
