export interface CaptionFontCategory {
	id: string;
	label: string;
	fonts: CaptionFontOption[];
}

export interface CaptionFontOption {
	id: string;
	name: string;
	fontFamily: string;
	category: string;
	sampleText?: string;
	googleFont?: string; // e.g. "Montserrat:wght@700;900"
	fallback?: string;
}

export const CAPTION_FONT_CATEGORIES: CaptionFontCategory[] = [
	{
		id: "bold",
		label: "Bold & Impactful",
		fonts: [
			{
				id: "montserrat-black",
				name: "Montserrat Black",
				fontFamily: "'Montserrat', sans-serif",
				category: "bold",
				googleFont: "Montserrat:wght@800;900",
			},
			{
				id: "anton",
				name: "Anton",
				fontFamily: "'Anton', sans-serif",
				category: "bold",
				googleFont: "Anton",
			},
			{
				id: "rubik-black",
				name: "Rubik Black",
				fontFamily: "'Rubik', sans-serif",
				category: "bold",
				googleFont: "Rubik:wght@800;900",
			},
			{
				id: "impact",
				name: "Impact",
				fontFamily: "Impact, 'Arial Black', sans-serif",
				category: "bold",
			},
			{
				id: "arial-black",
				name: "Arial Black",
				fontFamily: "'Arial Black', sans-serif",
				category: "bold",
			},
		],
	},
	{
		id: "modern",
		label: "Modern Social",
		fonts: [
			{
				id: "poppins",
				name: "Poppins",
				fontFamily: "'Poppins', sans-serif",
				category: "modern",
				googleFont: "Poppins:wght@600;700;800",
			},
			{
				id: "plus-jakarta",
				name: "Plus Jakarta Sans",
				fontFamily: "'Plus Jakarta Sans', sans-serif",
				category: "modern",
				googleFont: "Plus+Jakarta+Sans:wght@700;800",
			},
			{
				id: "outfit",
				name: "Outfit",
				fontFamily: "'Outfit', sans-serif",
				category: "modern",
				googleFont: "Outfit:wght@700;800",
			},
			{
				id: "sora",
				name: "Sora",
				fontFamily: "'Sora', sans-serif",
				category: "modern",
				googleFont: "Sora:wght@700;800",
			},
			{
				id: "syne",
				name: "Syne",
				fontFamily: "'Syne', sans-serif",
				category: "modern",
				googleFont: "Syne:wght@700;800",
			},
		],
	},
	{
		id: "clean",
		label: "Clean & Sleek",
		fonts: [
			{
				id: "inter",
				name: "Inter",
				fontFamily: "'Inter', sans-serif",
				category: "clean",
				googleFont: "Inter:wght@500;700;800",
			},
			{
				id: "roboto",
				name: "Roboto",
				fontFamily: "'Roboto', sans-serif",
				category: "clean",
				googleFont: "Roboto:wght@500;700;900",
			},
			{
				id: "open-sans",
				name: "Open Sans",
				fontFamily: "'Open Sans', sans-serif",
				category: "clean",
				googleFont: "Open+Sans:wght@600;700;800",
			},
			{
				id: "system-ui",
				name: "System UI / SF Pro",
				fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
				category: "clean",
			},
		],
	},
	{
		id: "condensed",
		label: "Condensed & Reel",
		fonts: [
			{
				id: "bebas-neue",
				name: "Bebas Neue",
				fontFamily: "'Bebas Neue', sans-serif",
				category: "condensed",
				googleFont: "Bebas+Neue",
			},
			{
				id: "oswald",
				name: "Oswald",
				fontFamily: "'Oswald', sans-serif",
				category: "condensed",
				googleFont: "Oswald:wght@600;700",
			},
			{
				id: "league-gothic",
				name: "League Gothic",
				fontFamily: "'League Gothic', sans-serif",
				category: "condensed",
				googleFont: "League+Gothic",
			},
			{
				id: "fjalla-one",
				name: "Fjalla One",
				fontFamily: "'Fjalla One', sans-serif",
				category: "condensed",
				googleFont: "Fjalla+One",
			},
		],
	},
	{
		id: "display",
		label: "Display & Creative",
		fonts: [
			{
				id: "righteous",
				name: "Righteous",
				fontFamily: "'Righteous', cursive",
				category: "display",
				googleFont: "Righteous",
			},
			{
				id: "bungee",
				name: "Bungee",
				fontFamily: "'Bungee', cursive",
				category: "display",
				googleFont: "Bungee",
			},
			{
				id: "bangers",
				name: "Bangers",
				fontFamily: "'Bangers', cursive",
				category: "display",
				googleFont: "Bangers",
			},
			{
				id: "cinzel",
				name: "Cinzel",
				fontFamily: "'Cinzel', serif",
				category: "display",
				googleFont: "Cinzel:wght@700;900",
			},
		],
	},
	{
		id: "rounded",
		label: "Rounded & Friendly",
		fonts: [
			{
				id: "nunito",
				name: "Nunito",
				fontFamily: "'Nunito', sans-serif",
				category: "rounded",
				googleFont: "Nunito:wght@700;800;900",
			},
			{
				id: "quicksand",
				name: "Quicksand",
				fontFamily: "'Quicksand', sans-serif",
				category: "rounded",
				googleFont: "Quicksand:wght@600;700",
			},
			{
				id: "comfortaa",
				name: "Comfortaa",
				fontFamily: "'Comfortaa', cursive",
				category: "rounded",
				googleFont: "Comfortaa:wght@700",
			},
		],
	},
	{
		id: "handwritten",
		label: "Handwritten & Casual",
		fonts: [
			{
				id: "caveat",
				name: "Caveat",
				fontFamily: "'Caveat', cursive",
				category: "handwritten",
				googleFont: "Caveat:wght@700",
			},
			{
				id: "permanent-marker",
				name: "Permanent Marker",
				fontFamily: "'Permanent Marker', cursive",
				category: "handwritten",
				googleFont: "Permanent+Marker",
			},
			{
				id: "kalam",
				name: "Kalam",
				fontFamily: "'Kalam', cursive",
				category: "handwritten",
				googleFont: "Kalam:wght@700",
			},
			{
				id: "pacifico",
				name: "Pacifico",
				fontFamily: "'Pacifico', cursive",
				category: "handwritten",
				googleFont: "Pacifico",
			},
		],
	},
	{
		id: "typewriter",
		label: "Typewriter & Monospace",
		fonts: [
			{
				id: "space-mono",
				name: "Space Mono",
				fontFamily: "'Space Mono', monospace",
				category: "typewriter",
				googleFont: "Space+Mono:wght@700",
			},
			{
				id: "courier-prime",
				name: "Courier Prime",
				fontFamily: "'Courier Prime', monospace",
				category: "typewriter",
				googleFont: "Courier+Prime:wght@700",
			},
			{
				id: "jetbrains-mono",
				name: "JetBrains Mono",
				fontFamily: "'JetBrains Mono', monospace",
				category: "typewriter",
				googleFont: "JetBrains+Mono:wght@700;800",
			},
		],
	},
	{
		id: "malayalam",
		label: "Malayalam (മലയാളം)",
		fonts: [
			{
				id: "noto-sans-malayalam",
				name: "Noto Sans Malayalam",
				fontFamily: "'Noto Sans Malayalam', 'Manjari', 'Gayathri', sans-serif",
				category: "malayalam",
				googleFont: "Noto+Sans+Malayalam:wght@600;700;800",
				sampleText: "നമസ്കാരം സുഖമാണോ",
			},
			{
				id: "manjari",
				name: "Manjari",
				fontFamily: "'Manjari', 'Noto Sans Malayalam', sans-serif",
				category: "malayalam",
				googleFont: "Manjari:wght@700",
				sampleText: "മലയാളം അടിക്കുറിപ്പുകൾ",
			},
			{
				id: "gayathri",
				name: "Gayathri",
				fontFamily: "'Gayathri', 'Noto Sans Malayalam', sans-serif",
				category: "malayalam",
				googleFont: "Gayathri:wght@700",
				sampleText: "റെക്കോർഡ്‌ലി ക്യാപ്ഷൻ",
			},
			{
				id: "chilanka",
				name: "Chilanka (Handwritten)",
				fontFamily: "'Chilanka', cursive",
				category: "malayalam",
				googleFont: "Chilanka",
				sampleText: "സുന്ദരമായ ഫോണ്ടുകൾ",
			},
			{
				id: "anek-malayalam",
				name: "Anek Malayalam",
				fontFamily: "'Anek Malayalam', sans-serif",
				category: "malayalam",
				googleFont: "Anek+Malayalam:wght@600;700;800",
				sampleText: "ആധുനിക മലയാളം",
			},
		],
	},
];

export const ALL_CAPTION_FONTS: CaptionFontOption[] = CAPTION_FONT_CATEGORIES.flatMap(
	(category) => category.fonts,
);

const loadedGoogleFonts = new Set<string>();

/**
 * Ensures Google Font is loaded dynamically into document head
 */
export function ensureCaptionFontLoaded(googleFontSpec?: string): void {
	if (!googleFontSpec || typeof document === "undefined") return;
	if (loadedGoogleFonts.has(googleFontSpec)) return;

	loadedGoogleFonts.add(googleFontSpec);
	const linkId = `gfont-${googleFontSpec.replace(/[^a-zA-Z0-9]/g, "-")}`;
	if (document.getElementById(linkId)) return;

	const link = document.createElement("link");
	link.id = linkId;
	link.rel = "stylesheet";
	link.href = `https://fonts.googleapis.com/css2?family=${googleFontSpec}&display=swap`;
	document.head.appendChild(link);
}

/** Preload top popular caption fonts */
export function preloadPopularCaptionFonts(): void {
	const popular = [
		"Montserrat:wght@800;900",
		"Bebas+Neue",
		"Poppins:wght@700;800",
		"Anton",
		"Outfit:wght@700;800",
		"Righteous",
		"Noto+Sans+Malayalam:wght@700;800",
		"Manjari:wght@700",
	];
	popular.forEach(ensureCaptionFontLoaded);
}
