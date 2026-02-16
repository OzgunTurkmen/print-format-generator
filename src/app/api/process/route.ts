import { NextRequest, NextResponse } from "next/server";
import { PRINT_FORMATS, FitMode } from "@/lib/formats";
import { processAndZip } from "@/lib/processor";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".jfif"];

// Increase serverless function timeout for Vercel (Pro plan: 60s, Hobby: 10s)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        // Parse settings
        const formatsRaw = formData.get("formats") as string | null;
        const fitMode = (formData.get("fitMode") as FitMode) || "contain";
        const bgColor = (formData.get("bgColor") as string) || "#FFFFFF";

        if (!formatsRaw) {
            return NextResponse.json(
                { error: "No formats selected. Please select at least one print format." },
                { status: 400 }
            );
        }

        const formatIds = JSON.parse(formatsRaw) as string[];
        if (formatIds.length === 0) {
            return NextResponse.json(
                { error: "No formats selected. Please select at least one print format." },
                { status: 400 }
            );
        }

        const selectedFormats = formatIds
            .map((id) => PRINT_FORMATS.find((f) => f.id === id))
            .filter(Boolean) as (typeof PRINT_FORMATS)[number][];

        if (selectedFormats.length === 0) {
            return NextResponse.json(
                { error: "Invalid format selection." },
                { status: 400 }
            );
        }

        // Collect uploaded files
        const files: { name: string; buffer: Buffer }[] = [];
        const entries = Array.from(formData.entries());

        for (const [key, value] of entries) {
            if (key === "files" && value instanceof File) {
                const file = value;
                const ext = "." + file.name.split(".").pop()?.toLowerCase();

                if (!ALLOWED_EXTENSIONS.includes(ext)) {
                    return NextResponse.json(
                        { error: `Unsupported file type: ${file.name}. Only JPG, PNG, and JFIF files are allowed.` },
                        { status: 400 }
                    );
                }

                if (file.size > MAX_FILE_SIZE) {
                    return NextResponse.json(
                        { error: `File too large: ${file.name}. Maximum size is 50 MB.` },
                        { status: 400 }
                    );
                }

                const arrayBuffer = await file.arrayBuffer();
                files.push({
                    name: file.name,
                    buffer: Buffer.from(arrayBuffer),
                });
            }
        }

        if (files.length === 0) {
            return NextResponse.json(
                { error: "No files uploaded. Please select at least one image." },
                { status: 400 }
            );
        }

        // Process all images and get ZIP buffer
        const logs: string[] = [];
        const zipBuffer = await processAndZip(
            files,
            selectedFormats,
            fitMode,
            bgColor,
            (msg) => logs.push(msg)
        );

        // Return ZIP as downloadable response
        return new NextResponse(new Uint8Array(zipBuffer), {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": 'attachment; filename="print-formats.zip"',
                "Content-Length": zipBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Processing error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred during processing." },
            { status: 500 }
        );
    }
}
