// Print format definitions
export interface PrintFormat {
    id: string;
    label: string;
    ratio: string;
    width: number;
    height: number;
}

export const PRINT_FORMATS: PrintFormat[] = [
    { id: "2x3", label: "2:3", ratio: "2:3", width: 3125, height: 4687 },
    { id: "3x4", label: "3:4", ratio: "3:4", width: 3515, height: 4687 },
    { id: "4x5", label: "4:5", ratio: "4:5", width: 3750, height: 4687 },
];

export type FitMode = "contain" | "cover";

export interface ProcessRequest {
    formats: string[];
    fitMode: FitMode;
    bgColor: string;
}

export interface ProcessResult {
    sessionId: string;
    outputs: {
        formatId: string;
        formatLabel: string;
        zipPath: string;
        pdfPath: string;
        imageCount: number;
    }[];
    mergedPdfPath: string | null;
}
