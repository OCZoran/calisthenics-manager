"use client";

import React, { useMemo, useRef } from "react";
import { Box, Typography } from "@mui/material";
import "quill/dist/quill.snow.css";
import imageCompression from "browser-image-compression";
import axiosInstance from "@/services/axios-public.instance";
import { Quill } from "react-quill-new";
import ImageResize from "quill-image-resize-module-react";
import ReactQuill from "react-quill-new";

// registracija dodataka
Quill.register("modules/imageResize", ImageResize);

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	label?: string;
	error?: boolean;
	helperText?: string;
	required?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
	value,
	onChange,
	placeholder = "Počnite da pišete...",
	label,
	error,
	helperText,
	required,
}) => {
	const quillRef = useRef<ReactQuill | null>(null);

	const modules = useMemo(
		() => ({
			toolbar: {
				container: [
					[{ header: [1, 2, 3, false] }],
					["bold", "italic", "underline", "strike"],
					[{ list: "ordered" }, { list: "bullet" }],
					[{ color: [] }, { background: [] }],
					["link", "image"],
					["clean"],
				],
			},
			imageResize: {
				parchment: Quill.import("parchment"),
				modules: ["Resize", "DisplaySize", "Toolbar"],
			},
			imageUploader: {
				upload: async (file: File) => {
					try {
						// kompresija
						const compressedFile = await imageCompression(file, {
							maxSizeMB: 2,
							maxWidthOrHeight: 1280,
							useWebWorker: true,
							fileType: "image/webp",
						});

						// upload na Backblaze (ili tvoj API)
						const formData = new FormData();
						formData.append("file", compressedFile);

						const response = await axiosInstance.post(
							"/api/body-measure",
							formData,
							{
								headers: {
									"Content-Type": "multipart/form-data",
								},
							}
						);

						return response.data.url; // mora vratiti URL slike
					} catch (error) {
						console.error("Greška pri upload-u slike:", error);
						alert("Greška pri dodavanju slike. Pokušajte ponovo.");
						throw error;
					}
				},
			},
		}),
		[]
	);

	const formats = [
		"header",
		"bold",
		"italic",
		"underline",
		"strike",
		"list",
		"bullet",
		"color",
		"background",
		"link",
		"image",
	];

	return (
		<Box>
			{label && (
				<Typography
					variant="body2"
					sx={{ mb: 1, fontWeight: 500 }}
					color={error ? "error" : "text.primary"}
				>
					{label}
					{required && <span style={{ color: "red" }}> *</span>}
				</Typography>
			)}
			<Box
				sx={{
					"& .quill": {
						bgcolor: "background.paper",
						borderRadius: 1,
						border: "1px solid",
						borderColor: error ? "error.main" : "divider",
						"&:hover": {
							borderColor: error ? "error.main" : "primary.main",
						},
					},
					"& .ql-toolbar": {
						borderRadius: "4px 4px 0 0",
						borderBottom: "1px solid",
						borderColor: "divider",
						bgcolor: "grey.50",
					},
					"& .ql-container": {
						borderRadius: "0 0 4px 4px",
						minHeight: "300px",
						fontSize: "16px",
						fontFamily: "inherit",
					},
					"& .ql-editor": {
						minHeight: "300px",
						"&.ql-blank::before": {
							color: "text.secondary",
							fontStyle: "normal",
						},
					},
					"& .ql-editor img": {
						maxWidth: "100%",
						height: "auto",
						borderRadius: 1,
						margin: "8px 0",
					},
				}}
			>
				<ReactQuill
					ref={quillRef}
					theme="snow"
					value={value}
					onChange={onChange}
					modules={modules}
					formats={formats}
					placeholder={placeholder}
				/>
			</Box>
			{helperText && (
				<Typography
					variant="caption"
					color={error ? "error" : "text.secondary"}
					sx={{ mt: 0.5, display: "block" }}
				>
					{helperText}
				</Typography>
			)}
		</Box>
	);
};

export default RichTextEditor;
