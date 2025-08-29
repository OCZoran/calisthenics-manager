import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/global/mongodb";

interface RegistrationRequest {
	name: string;
	email: string;
	password: string;
	createdAt: Date;
}

export async function POST(request: Request) {
	try {
		const { name, email, password }: RegistrationRequest = await request.json();

		if (!name || !email || !password) {
			return NextResponse.json(
				{ message: "required_fields_missing" },
				{ status: 400 }
			);
		}

		const { db } = await getDatabase();

		const existingUser = await db.collection("users").findOne({ email });
		if (existingUser) {
			return NextResponse.json(
				{ message: "user_already_exists" },
				{ status: 409 }
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = {
			name,
			email,
			password: hashedPassword,
			createdAt: new Date(),
		};

		await db.collection("users").insertOne(newUser);

		return NextResponse.json(
			{ message: "user_registered_successfully" },
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error during user registration:", error);
		return NextResponse.json(
			{ message: "internal_server_error" },
			{ status: 500 }
		);
	}
}
