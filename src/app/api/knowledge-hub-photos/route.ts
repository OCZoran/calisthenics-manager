import { uploadFileToBackblaze } from "@/global/uploadFileToBackblaze";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ error: "Nije poslat fajl" }, { status: 400 });
		}

		const imageUrl = await uploadFileToBackblaze(file, "knowledge-hub-photos");

		return NextResponse.json({ url: imageUrl }, { status: 200 });
	} catch (error) {
		console.error("Greška tokom uploada:", error);
		return NextResponse.json(
			{ error: "Došlo je do greške tokom upload-a." },
			{ status: 500 }
		);
	}
}
