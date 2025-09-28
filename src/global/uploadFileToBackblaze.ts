import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
	region: process.env.B2_REGION,
	endpoint: `https://s3.us-east-005.backblazeb2.com`,
	credentials: {
		accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
		secretAccessKey: process.env.B2_APPLICATION_KEY!,
	},
	requestChecksumCalculation: "WHEN_REQUIRED",
});

export async function uploadFileToBackblaze(
	file: File,
	folderPath: string
): Promise<string> {
	const fileName = `${Date.now()}-${file.name}`;
	const bucketName = process.env.B2_BUCKET_NAME!;

	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: `${folderPath}/${fileName}`,
		Body: Buffer.from(await file.arrayBuffer()),
		ContentType: file.type,
	});

	await s3Client.send(command);
	const imageUrl = `https://s3.us-east-005.backblazeb2.com/${bucketName}/${folderPath}/${fileName}`;

	return imageUrl;
}
