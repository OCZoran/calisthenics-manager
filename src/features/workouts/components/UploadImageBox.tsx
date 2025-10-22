"use client";

import React, { useRef, useState } from "react";
import {
	Button,
	CircularProgress,
	Stack,
	Typography,
	Alert,
	Box,
	IconButton,
	Grid,
	LinearProgress,
} from "@mui/material";
import { CloudUpload, Close } from "@mui/icons-material";
import imageCompression from "browser-image-compression";
import axiosInstance from "@/services/axios-public.instance";
import { compressVideo } from "@/global/utils/video-compression";

interface UploadImageBoxProps {
	onUploadSuccess?: (urls: string[]) => void;
	maxSizeMB?: number;
	acceptedFormats?: string;
	endpoint?: string;
	label?: string;
	multiple?: boolean;
	existingImages?: string[];
	onRemoveImage?: (url: string) => void;
}

export const UploadImageBox: React.FC<UploadImageBoxProps> = ({
	onUploadSuccess,
	maxSizeMB = 5,
	acceptedFormats = "image/*",
	endpoint = "/api/body-measure",
	label = "Upload Slike",
	multiple = true,
	existingImages = [],
	onRemoveImage,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState<string>("");
	const [compressionProgress, setCompressionProgress] = useState<number>(0);

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		setIsUploading(true);
		setUploadError(null);
		const uploadedUrls: string[] = [];

		try {
			const totalFiles = files.length;

			for (let i = 0; i < totalFiles; i++) {
				const file = files[i];
				setUploadProgress(`Processing ${i + 1}/${totalFiles}...`);

				const isImage = file.type.startsWith("image/");
				const isVideo = file.type.startsWith("video/");

				let fileToUpload = file;

				if (isImage) {
					setUploadProgress(`Compressing image ${i + 1}/${totalFiles}...`);
					fileToUpload = await imageCompression(file, {
						maxSizeMB,
						maxWidthOrHeight: 1280,
						useWebWorker: true,
						fileType: "image/webp",
					});
				} else if (isVideo) {
					const fileSizeMB = file.size / 1024 / 1024;

					// Kompresuj video samo ako je veći od 10MB
					if (fileSizeMB > 10) {
						setUploadProgress(`Compressing video ${i + 1}/${totalFiles}...`);

						try {
							fileToUpload = await compressVideo(file, (progress) => {
								setCompressionProgress(progress);
								setUploadProgress(
									`Compressing video ${i + 1}/${totalFiles}: ${progress}%`
								);
							});

							const compressedSizeMB = fileToUpload.size / 1024 / 1024;
							console.log(
								`Video compressed: ${fileSizeMB.toFixed(
									2
								)}MB → ${compressedSizeMB.toFixed(2)}MB`
							);
						} catch (compressionError) {
							console.error("Video compression failed:", compressionError);
							// Ako kompresija ne uspe, nastavi sa originalnim fajlom
							setUploadError(
								"Video kompresija nije uspela, šaljem original..."
							);
						}
					}

					// Proveri da li je još uvek prevelik
					if (fileToUpload.size / 1024 / 1024 > maxSizeMB) {
						throw new Error(
							`Video fajl je prevelik. Maksimalna veličina je ${maxSizeMB}MB`
						);
					}
				}

				setUploadProgress(`Uploading ${i + 1}/${totalFiles}...`);
				setCompressionProgress(0);

				const formData = new FormData();
				formData.append("file", fileToUpload);

				const response = await axiosInstance.post(endpoint, formData, {
					headers: {
						"Content-Type": "multipart/form-data",
					},
				});

				const data = response.data;

				if (data?.url) {
					uploadedUrls.push(data.url);
				} else {
					throw new Error(data?.error || "Greška u odgovoru servera");
				}
			}

			if (uploadedUrls.length > 0) {
				onUploadSuccess?.(uploadedUrls);
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
			setUploadProgress("");
			setCompressionProgress(0);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	return (
		<Stack spacing={2}>
			<input
				type="file"
				accept={acceptedFormats}
				ref={fileInputRef}
				style={{ display: "none" }}
				onChange={handleFileChange}
				multiple={multiple}
			/>

			<Button
				variant="outlined"
				component="span"
				startIcon={
					isUploading ? <CircularProgress size={16} /> : <CloudUpload />
				}
				onClick={() => fileInputRef.current?.click()}
				disabled={isUploading}
				fullWidth
			>
				{isUploading
					? uploadProgress || "Uploading..."
					: `${label} ${multiple ? "(možete izabrati više slika)" : ""}`}
			</Button>

			{uploadError && (
				<Alert severity="error">
					<Typography variant="body2">{uploadError}</Typography>
				</Alert>
			)}

			{existingImages.length > 0 && (
				<Box>
					<Typography variant="subtitle2" gutterBottom>
						Uploadovani fajlovi ({existingImages.length})
					</Typography>
					<Grid container spacing={2}>
						{existingImages.map((url, index) => {
							const isVideoFile = url.match(/\.(mp4|mov|avi|webm)$/i);

							return (
								<Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
									<Box
										sx={{
											position: "relative",
											paddingTop: "100%",
											borderRadius: 1,
											overflow: "hidden",
											border: "1px solid",
											borderColor: "divider",
										}}
									>
										{isVideoFile ? (
											<Box
												component="video"
												src={url}
												sx={{
													position: "absolute",
													top: 0,
													left: 0,
													width: "100%",
													height: "100%",
													objectFit: "cover",
												}}
											/>
										) : (
											<Box
												component="img"
												src={url}
												alt={`Upload ${index + 1}`}
												sx={{
													position: "absolute",
													top: 0,
													left: 0,
													width: "100%",
													height: "100%",
													objectFit: "cover",
												}}
											/>
										)}
										{onRemoveImage && (
											<IconButton
												size="small"
												onClick={() => onRemoveImage(url)}
												sx={{
													position: "absolute",
													top: 4,
													right: 4,
													bgcolor: "background.paper",
													"&:hover": {
														bgcolor: "error.main",
														color: "white",
													},
												}}
											>
												<Close fontSize="small" />
											</IconButton>
										)}
									</Box>
								</Grid>
							);
						})}
					</Grid>
					{isUploading && compressionProgress > 0 && (
						<Box sx={{ width: "100%", mt: 1 }}>
							<LinearProgress
								variant="determinate"
								value={compressionProgress}
							/>
							<Typography variant="caption" color="text.secondary">
								Kompresija: {compressionProgress}%
							</Typography>
						</Box>
					)}
				</Box>
			)}
		</Stack>
	);
};

export default UploadImageBox;
