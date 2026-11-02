import fs from "node:fs";
import path from "node:path";

function createIcoFromPngs(pngSizes) {
	const images = [];

	for (const size of pngSizes) {
		const filePath = path.resolve(process.cwd(), `icons/icons/png/${size}x${size}.png`);
		if (!fs.existsSync(filePath)) {
			console.warn(`Warning: missing ${filePath}`);
			continue;
		}
		const buffer = fs.readFileSync(filePath);
		images.push({
			width: size,
			height: size,
			buffer,
		});
	}

	if (images.length === 0) {
		throw new Error("No PNG icon files found to generate .ico");
	}

	const numImages = images.length;
	const headerSize = 6;
	const dirEntrySize = 16;
	let offset = headerSize + numImages * dirEntrySize;

	const header = Buffer.alloc(headerSize);
	header.writeUInt16LE(0, 0); // Reserved
	header.writeUInt16LE(1, 2); // Type 1 = ICO
	header.writeUInt16LE(numImages, 4); // Image count

	const dirEntries = [];
	for (const img of images) {
		const entry = Buffer.alloc(dirEntrySize);
		// 0 means 256 in ICO format
		entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
		entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
		entry.writeUInt8(0, 2); // Color palette
		entry.writeUInt8(0, 3); // Reserved
		entry.writeUInt16LE(1, 4); // Color planes
		entry.writeUInt16LE(32, 6); // Bits per pixel
		entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
		entry.writeUInt32LE(offset, 12); // Offset to image data
		dirEntries.push(entry);

		offset += img.buffer.length;
	}

	const icoBuffer = Buffer.concat([
		header,
		...dirEntries,
		...images.map((img) => img.buffer),
	]);

	const outDir = path.resolve(process.cwd(), "icons/icons/win");
	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir, { recursive: true });
	}

	const outPath = path.join(outDir, "icon.ico");
	fs.writeFileSync(outPath, icoBuffer);
	console.log(`✅ Successfully generated multi-resolution icon.ico (${icoBuffer.length} bytes) at:`);
	console.log(`   ${outPath}`);
	console.log(`   Included sizes: ${images.map((img) => `${img.width}x${img.height}`).join(", ")}`);
}

// Windows standard icon sizes up to 256x256
createIcoFromPngs([256, 128, 64, 48, 32, 16]);
