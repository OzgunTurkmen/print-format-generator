# Print Format Generator

A web application for resizing images to print-ready formats with PDF and ZIP export.

## Features

- **Multi-file upload** with drag & drop support
- **Three print formats**: 2:3 (3125×4687), 3:4 (3515×4687), 4:5 (3750×4687)
- **Two fit modes**: Contain (fit with background padding) and Cover (fill and crop)
- **Customizable background color** for Contain mode
- **Single ZIP download** containing:
  - Per-format folders with resized images
  - Per-format PDF documents
  - Merged PDF when multiple formats are selected
- Supports JPG, PNG, and JFIF images
- All processing done server-side, in-memory (no disk writes)

## Tech Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Image Processing**: Sharp
- **PDF Generation**: pdf-lib
- **ZIP Creation**: Archiver

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Click **Deploy** — no extra configuration needed

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Usage

1. **Upload images** – Drag and drop or click to select JPG/PNG/JFIF files
2. **Select formats** – Check one or more print format checkboxes
3. **Choose fit mode** – Contain (default) or Cover
4. **Set background color** – For Contain mode padding (default: white)
5. **Click "Start Processing"** – A ZIP file will download automatically

## ZIP Structure

```
print-formats.zip
├── 2x3/              # Resized images (3125×4687)
│   ├── photo1_2x3.jpg
│   └── photo2_2x3.jpg
├── 3x4/              # Resized images (3515×4687)
├── 4x5/              # Resized images (3750×4687)
├── 2x3.pdf           # PDF per format
├── 3x4.pdf
├── 4x5.pdf
└── merged.pdf        # Combined (if >1 format)
```

## License

MIT
