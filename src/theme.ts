"use client";

import { createTheme } from "@mui/material/styles";
import { Roboto } from "next/font/google";

declare module "@mui/material/styles" {
	interface Palette {
		helpers: {
			red: string;
			border: string;
		};
		custom: CustomPalette;
	}

	interface PaletteOptions {
		helpers?: {
			red: string;
			border: string;
		};
		custom?: CustomPalette;
	}

	interface CustomPalette {
		charcoal: ColorShades;
		blue: ColorShades;
		mustard: ColorShades;
		red: ColorShades;
		green: ColorShades;
		orange: ColorShades;
		teal: ColorShades;
		officeBlue: ColorShades;
		purple: ColorShades;
	}

	interface ColorShades {
		20?: string;
		50?: string;
		100?: string;
		200?: string;
		300?: string;
		400?: string;
		500?: string;
		600?: string;
		700?: string;
		800?: string;
		900?: string;
		950?: string;
	}
}

const roboto = Roboto({
	weight: ["300", "400", "500", "700"],
	subsets: ["latin"],
	display: "swap",
});

const theme = createTheme({
	palette: {
		mode: "light",
		background: {
			default: "#ffffff",
			paper: "#ffffff",
		},
		text: {
			primary: "#4D4D4D",
			secondary: "#666666",
		},
		primary: {
			main: "#006DCC",
		},
		secondary: {
			main: "#dc004e",
		},
		helpers: {
			red: "#D64545",
			border: "#E6E6E6",
		},
		custom: {
			charcoal: {
				20: "#FAFAFA",
				50: "#F2F2F2",
				100: "#E6E6E6",
				200: "#CCCCCC",
				300: "#B3B3B3",
				400: "#999999",
				500: "#4D4D4D",
				600: "#666666",
				700: "#4D4D4D",
				800: "#0D0D0D",
				900: "#080808",
				950: "#000000",
			},
			blue: {
				20: "#F0F8FF",
				50: "#E5F3FF",
				100: "#CCE7FF",
				200: "#99CFFF",
				300: "#66B8FF",
				400: "#33A0FF",
				500: "#006DCC",
				600: "#006DCC",
				700: "#005299",
			},
			officeBlue: {
				50: "#ECF0F8",
				100: "#D9E0F2",
				200: "#B4C2E4",
				300: "#8EA3D7",
				400: "#6984C9",
				500: "#5171C1",
				600: "#365196",
				700: "#283D71",
			},
			purple: {
				50: "#F4EEF6",
				100: "#E9DEED",
				200: "#D3BDDB",
				300: "#BD9BCA",
				400: "#A67AB8",
				500: "#9059A6",
				600: "#734785",
				700: "#573564",
			},
			mustard: {
				20: "#FFFDF5",
				50: "#FFF9E5",
				100: "#FFF2CC",
				200: "#FFE699",
				300: "#FFD966",
				400: "#FFCC33",
				500: "#D49F00",
				600: "#CC9900",
				700: "#8C6E00",
			},
			red: {
				50: "#FAEAEA",
				100: "#F6D5D5",
				200: "#EDABAB",
				300: "#E38282",
				400: "#DA5858",
				500: "#D64545",
				600: "#A72525",
			},
			green: {
				50: "#ECF9F2",
				100: "#D9F2E5",
				200: "#B3E6CA",
				300: "#8CD9B0",
				400: "#66CC96",
				500: "#36A269",
				600: "#339963",
				700: "#26734A",
			},
			orange: {
				50: "#FEF5E7",
				100: "#FDEBCE",
				200: "#FBD79D",
				300: "#F8C36D",
				400: "#F6AF3C",
				500: "#F5A423",
				600: "#C37C09",
			},
			teal: {
				50: "#EDF8F6",
				100: "#DAF1ED",
				200: "#B6E2DA",
				300: "#91D4C8",
				400: "#6CC6B5",
				500: "#A8DDD3",
				600: "#399382",
				700: "#2B6E62",
				800: "#1D4941",
				900: "#0E2521",
			},
		},
	},
	typography: {
		fontFamily: roboto.style.fontFamily,
		h1: { lineHeight: 1.2 },
		h2: { lineHeight: 1.2 },
		h3: { lineHeight: 1.2 },
		h4: { lineHeight: 1.2 },
		h5: { lineHeight: 1.2 },
		h6: { lineHeight: 1.2 },
		// body1: { lineHeight: 1.2 },
		body2: { lineHeight: "140%" },
		subtitle1: { lineHeight: 1.2 },
		subtitle2: { lineHeight: 1.2 },
		caption: { lineHeight: 1.2 },
		overline: { lineHeight: 1.2 },
		button: { lineHeight: 1.2 },
	},
	components: {
		MuiAlert: {
			styleOverrides: {
				standardError: {
					backgroundColor: "#FAEAEA",
					color: "#4D4D4D",
				},
				icon: {
					color: "#D64545",
				},
			},
		},
		MuiFormHelperText: {
			styleOverrides: {
				root: {
					marginLeft: 0,
					marginRight: 0,
					fontSize: "12px",
				},
			},
		},
		MuiFormLabel: {
			styleOverrides: {
				root: {
					fontSize: "14px",
					lineHeight: "auto",
					color: "#666666",
					"&.Mui-focused": {
						color: "#666666",
					},
				},
			},
		},

		MuiRadio: {
			styleOverrides: {
				root: {
					fontSize: "14px",
				},
			},
		},
		MuiFormControlLabel: {
			styleOverrides: {
				label: {
					fontSize: "14px",
				},
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				notchedOutline: {
					borderColor: "#E6E6E6",
				},
				root: {
					"&:hover .MuiOutlinedInput-notchedOutline": {
						borderColor: "#E6E6E6",
					},
					"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
						borderColor: "#E6E6E6",
					},
				},
				input: {
					color: "#4D4D4D",
					fontSize: "14px",
					padding: "12px",
					"&::placeholder": {
						color: "#4D4D4DCC",
						opacity: 1,
					},

					"&.MuiInputBase-inputAdornedEnd": {
						paddingRight: "0px", // instead 32px
					},
				},
			},
		},

		MuiAutocomplete: {
			styleOverrides: {
				root: ({ ownerState }) => ({
					...(ownerState.size === "medium" && {
						"& .MuiOutlinedInput-root": {
							minHeight: "44px",
							"& .MuiOutlinedInput-input": {
								padding: 0,
							},
						},
					}),
				}),
			},
		},

		MuiButton: {
			styleOverrides: {
				root: ({ ownerState }) => ({
					fontSize: "14px",
					padding: "8px 16px",
					textTransform: "none",
					fontWeight: 700,
					height: 36,
					boxShadow: "none",
					"&:hover": {
						boxShadow: "none",
					},
					"&:active": {
						boxShadow: "none",
					},
					"@media (max-width:600px)": {
						padding: "8px 12px",
						height: 36,
					},
					...(ownerState.variant === "outlined" && {
						"&.Mui-disabled": {
							borderColor: "#E6E6E6",
							color: "#999999",
							backgroundColor: "transparent",
						},
					}),
					...(ownerState.variant === "contained" && {
						"&.Mui-disabled": {
							backgroundColor: "#F2F2F2",
							color: "#CCCCCC",
						},
					}),
					...(ownerState.variant === "text" && {
						"&.Mui-disabled": {
							color: "#B3B3B3",
						},
					}),
				}),
			},
		},

		MuiCssBaseline: {
			styleOverrides: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
          -webkit-text-fill-color: #000 !important;
        }
      `,
		},
	},
});

export default theme;
