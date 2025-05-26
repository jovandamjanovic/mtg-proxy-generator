import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import cliProgress from 'cli-progress';

// === Constants ===
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 24;
const CARD_SPACING = 12;
const CARD_WIDTH = 162;
const CARD_HEIGHT = 226.8;

const usableWidth = A4_WIDTH - PAGE_MARGIN * 2 + CARD_SPACING;
const usableHeight = A4_HEIGHT - PAGE_MARGIN * 2 + CARD_SPACING;

const CARDS_PER_ROW = Math.floor(usableWidth / (CARD_WIDTH + CARD_SPACING));
const CARDS_PER_COL = Math.floor(usableHeight / (CARD_HEIGHT + CARD_SPACING));
const IMAGES_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

// === Hardcoded Image Filenames ===
// Make sure these image files exist in the 'images' directory
const imageFilenames = [
  'images/Jonathan Emblem.png',
];

// === Helpers ===
const chunk = (arr, size) =>
  arr.length === 0 ? [] : [arr.slice(0, size), ...chunk(arr.slice(size), size)];

// === Image Loading with Progress ===
const loadImagesFromFiles = async (filenames) => {
  const total = filenames.length;
  const imageBuffers = [];
  const failedFiles = [];

  const bar = new cliProgress.SingleBar({
    format: 'Loading images [{bar}] {percentage}% | {value}/{total} | {file}',
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  });

  bar.start(total, 0, { file: '' });

  for (let i = 0; i < total; i++) {
    const filename = filenames[i];
    bar.update(i, { file: path.basename(filename) });

    try {
      const buffer = fs.readFileSync(filename);
      imageBuffers.push(buffer);
    } catch (err) {
      failedFiles.push(filename);
      imageBuffers.push(null);
    }
  }

  bar.update(total, { file: 'Done' });
  bar.stop();

  return { imageBuffers, failedFiles };
};

// === PDF Creation ===
const createPdf = async (images) => {
  const pdfDoc = await PDFDocument.create();
  const pages = chunk(images, IMAGES_PER_PAGE);

  for (const pageImages of pages) {
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

    for (let i = 0; i < pageImages.length; i++) {
      const col = i % CARDS_PER_ROW;
      const row = Math.floor(i / CARDS_PER_ROW);

      const x = PAGE_MARGIN + col * (CARD_WIDTH + CARD_SPACING);
      const y = A4_HEIGHT - PAGE_MARGIN - (row + 1) * (CARD_HEIGHT + CARD_SPACING) + CARD_SPACING;

      const imgBytes = pageImages[i];
      if (!imgBytes) continue;

      try {
        const img = await pdfDoc.embedJpg(imgBytes).catch(() => pdfDoc.embedPng(imgBytes));
        page.drawImage(img, {
          x,
          y,
          width: CARD_WIDTH,
          height: CARD_HEIGHT
        });
      } catch (err) {
        console.error(`Failed to embed image at index ${i}`, err);
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('customcards.pdf', pdfBytes);
};

// === Main ===
const run = async () => {
  const { imageBuffers, failedFiles } = await loadImagesFromFiles(imageFilenames);

  const successfulImages = imageBuffers.filter(Boolean);
  console.log(`\n✅ Successfully loaded ${successfulImages.length} images.`);

  if (failedFiles.length > 0) {
    console.log(`\n❌ Failed to load ${failedFiles.length} file(s):`);
    failedFiles.forEach(file => console.log(` - ${file}`));
  }

  await createPdf(successfulImages);
  console.log('\n📄 PDF saved as "customcards.pdf"');
};

run();
