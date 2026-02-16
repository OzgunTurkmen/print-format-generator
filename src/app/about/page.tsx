export default function AboutPage() {
    return (
        <div className="animate-fade-in max-w-2xl">
            <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                About
            </h1>

            <div
                className="rounded-xl p-6 space-y-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
            >
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--text-primary)" }}>Print Format Generator</strong> is a
                    free, open-source tool that helps you resize images to standard print dimensions.
                    Upload your JPG, PNG, or JFIF images, choose your target formats, and get
                    print-ready files in seconds.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    The tool supports three common print ratios: <strong>2:3</strong> (3125×4687),{" "}
                    <strong>3:4</strong> (3515×4687), and <strong>4:5</strong> (3750×4687).
                    Images can be resized using <em>Contain</em> mode (fit with background padding) or{" "}
                    <em>Cover</em> mode (fill and crop).
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Each format generates a ZIP archive of resized images and a PDF document.
                    If multiple formats are selected, a merged PDF containing all formats is also
                    created for convenience.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    All processing is done server-side. Images are temporarily stored during processing
                    and automatically cleaned up. No data is sent to external services.
                </p>

                <div className="pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Built with Next.js, Sharp, pdf-lib, and Archiver.
                    </p>
                </div>
            </div>
        </div>
    );
}
