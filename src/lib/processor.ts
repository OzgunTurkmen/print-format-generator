import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import archiver from "archiver";
import { PrintFormat, FitMode } from "./formats";

/**
 * Convert hex color string to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 255, g: 255, b: 255 };
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
}

/**
 * Resize a single image to target dimensions (in-memory)
 */
async function resizeImage(
    inputBuffer: Buffer,
    width: number,
    height: number,
    fitMode: FitMode,
    bgColor: string
): Promise<Buffer> {
    const bg = hexToRgb(bgColor);

    if (fitMode === "contain") {
        return sharp(inputBuffer)
            .resize(width, height, {
                fit: "contain",
                background: { r: bg.r, g: bg.g, b: bg.b, alpha: 1 },
            })
            .jpeg({ quality: 95 })
            .toBuffer();
    } else {
        return sharp(inputBuffer)
            .resize(width, height, {
                fit: "cover",
            })
            .jpeg({ quality: 95 })
            .toBuffer();
    }
}

/**
 * Create a PDF from image buffers (in-memory), returns PDF bytes
 */
async function createPdfBuffer(
    images: { name: string; buffer: Buffer }[],
    pageWidth: number,
    pageHeight: number
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    // Convert pixel dimensions to points (72 DPI for PDF, images are 300 DPI)
    const ptWidth = (pageWidth / 300) * 72;
    const ptHeight = (pageHeight / 300) * 72;

    for (const img of images) {
        const page = pdfDoc.addPage([ptWidth, ptHeight]);
        const jpgImage = await pdfDoc.embedJpg(img.buffer);
        page.drawImage(jpgImage, {
            x: 0,
            y: 0,
            width: ptWidth,
            height: ptHeight,
        });
    }

    return pdfDoc.save();
}

/**
 * Merge multiple PDF byte arrays into one
 */
async function mergePdfBuffers(
    pdfBuffers: Uint8Array[]
): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const pdfBytes of pdfBuffers) {
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
    }

    return mergedPdf.save();
}

/**
 * Process all images for all formats and return a single ZIP buffer.
 * 
 * ZIP structure:
 *   2x3/image1_2x3.jpg
 *   2x3/image2_2x3.jpg
 *   2x3.pdf
 *   3x4/image1_3x4.jpg
 *   3x4.pdf
 *   merged.pdf (if >1 format)
 */
export async function processAndZip(
    files: { name: string; buffer: Buffer }[],
    formats: PrintFormat[],
    fitMode: FitMode,
    bgColor: string,
    onLog: (msg: string) => void
): Promise<Buffer> {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];

    // Collect archive output into memory
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfBuffers: { formatId: string; pdf: Uint8Array }[] = [];

    for (const format of formats) {
        const resizedImages: { name: string; buffer: Buffer }[] = [];

        // Resize each image for this format
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            onLog(`[${format.label}] Resizing ${file.name} (${i + 1}/${files.length})...`);

            const resized = await resizeImage(
                file.buffer,
                format.width,
                format.height,
                fitMode,
                bgColor
            );

            const outName = `${stripExt(file.name)}_${format.id}.jpg`;
            // Add resized image to ZIP under format folder
            archive.append(resized, { name: `${format.id}/${outName}` });
            resizedImages.push({ name: outName, buffer: resized });
        }

        // Create PDF for this format
        onLog(`[${format.label}] Creating PDF...`);
        const pdfBytes = await createPdfBuffer(resizedImages, format.width, format.height);
        archive.append(Buffer.from(pdfBytes), { name: `${format.id}.pdf` });
        pdfBuffers.push({ formatId: format.id, pdf: pdfBytes });
    }

    // Merge PDFs if more than one format
    if (pdfBuffers.length > 1) {
        onLog("Merging all PDFs into merged.pdf...");
        const mergedBytes = await mergePdfBuffers(pdfBuffers.map((p) => p.pdf));
        archive.append(Buffer.from(mergedBytes), { name: "merged.pdf" });
    }

    onLog("✓ All processing complete! Preparing download...");

    // Finalize archive
    const finalizePromise = new Promise<Buffer>((resolve, reject) => {
        archive.on("end", () => resolve(Buffer.concat(chunks)));
        archive.on("error", reject);
    });

    await archive.finalize();
    return finalizePromise;
}

function stripExt(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}
