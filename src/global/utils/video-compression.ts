import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg(): Promise<FFmpeg> {
	if (ffmpeg) return ffmpeg;

	ffmpeg = new FFmpeg();

	const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

	await ffmpeg.load({
		coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
		wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
	});

	return ffmpeg;
}

export async function compressVideo(
	file: File,
	onProgress?: (progress: number) => void
): Promise<File> {
	const ffmpeg = await loadFFmpeg();

	// Čitaj input fajl
	await ffmpeg.writeFile("input.mp4", await fetchFile(file));

	// Progress callback
	ffmpeg.on("progress", ({ progress }) => {
		onProgress?.(Math.round(progress * 100));
	});

	// Kompresuj video
	// -crf kontroliše kvalitet (18-28 je dobar raspon, manji broj = bolji kvalitet)
	// -preset kontroliše brzinu kompresije (ultrafast, fast, medium, slow)
	await ffmpeg.exec([
		"-i",
		"input.mp4",
		"-c:v",
		"libx264", // H.264 codec
		"-crf",
		"28", // Compression quality (18-28)
		"-preset",
		"fast", // Encoding speed
		"-c:a",
		"aac", // Audio codec
		"-b:a",
		"128k", // Audio bitrate
		"-vf",
		"scale=1280:-2", // Resize to max width 1280px
		"-movflags",
		"+faststart", // Optimizuj za streaming
		"output.mp4",
	]);

	// Čitaj output fajl
	const data = await ffmpeg.readFile("output.mp4");

	// Convert FileData to a Uint8Array (readFile can return a string type in some typings)
	const bytes: Uint8Array =
		typeof data === "string"
			? new TextEncoder().encode(data)
			: (data as Uint8Array);

	// Cleanup
	await ffmpeg.deleteFile("input.mp4");
	await ffmpeg.deleteFile("output.mp4");

	// Kreiraj novi File objekat
	// Copy data into a new Uint8Array backed by a regular ArrayBuffer to satisfy Blob's expected types
	const copied = new Uint8Array(bytes.length);
	copied.set(bytes);
	const compressedBlob = new Blob([copied.buffer], { type: "video/mp4" });
	return new File([compressedBlob], file.name, { type: "video/mp4" });
}
