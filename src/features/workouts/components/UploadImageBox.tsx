"use client";

import React, { useRef, useState } from "react";
import {
	Button,
	CircularProgress,
	Stack,
	Typography,
	Alert,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import imageCompression from "browser-image-compression";
import axiosInstance from "@/services/axios-public.instance";

interface UploadImageBoxProps {
	onUploadSuccess?: (url: string) => void;
	maxSizeMB?: number;
	acceptedFormats?: string;
	endpoint?: string;
	label?: string;
}

export const UploadImageBox: React.FC<UploadImageBoxProps> = ({
	onUploadSuccess,
	maxSizeMB = 5,
	acceptedFormats = "image/*",
	endpoint = "/api/knowledge-hub-photos",
	label = "Upload Slike",
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		setUploadError(null);

		try {
			const compressedFile = await imageCompression(file, {
				maxSizeMB,
				maxWidthOrHeight: 1280, // možeš smanjiti ako treba thumbnail
				useWebWorker: true,
				fileType: "image/webp",
			});

			const formData = new FormData();
			formData.append("file", compressedFile);

			const response = await axiosInstance.post(endpoint, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			const data = response.data;

			if (data?.url) {
				onUploadSuccess?.(data.url);
			} else {
				throw new Error(data?.error || "Greška u odgovoru servera");
			}
		} catch (err: unknown) {
			console.error("Upload greška:", err);
			const errorMessage =
				typeof err === "object" && err !== null && "message" in err
					? String((err as { message?: unknown }).message)
					: "Nepoznata greška pri uploadu";
			setUploadError(errorMessage);
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	return (
		<Stack spacing={2} alignItems="start">
			<input
				type="file"
				accept={acceptedFormats}
				ref={fileInputRef}
				style={{ display: "none" }}
				onChange={handleFileChange}
			/>
			<label htmlFor="upload-image-input">
				<Button
					variant="outlined"
					component="span"
					startIcon={
						isUploading ? <CircularProgress size={16} /> : <CloudUpload />
					}
					onClick={() => fileInputRef.current?.click()}
					disabled={isUploading}
				>
					{isUploading ? "Uploading..." : label}
				</Button>
			</label>

			{uploadError && (
				<Alert severity="error">
					<Typography variant="body2">{uploadError}</Typography>
				</Alert>
			)}
		</Stack>
	);
};

export default UploadImageBox;
