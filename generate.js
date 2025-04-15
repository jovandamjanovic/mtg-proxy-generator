import fetch from 'node-fetch';
import { PDFDocument } from 'pdf-lib';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const scryfallUrlForName = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`;

const fetchImageBytes = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Image fetch failed');
  return Buffer.from(await res.arrayBuffer());
};

const fetchCardImageSequentially = async (cardNames, delayMs = 200) => {
  const imageBuffers = [];

  for (const name of cardNames) {
    try {
      const res = await fetch(scryfallUrlForName(name));
      const data = await res.json();

      if (data.card_faces && data.card_faces.length === 2) {
        const front = data.card_faces[0]?.image_uris?.normal;
        const back = data.card_faces[1]?.image_uris?.normal;

        if (front && back) {
          const frontBuffer = await fetchImageBytes(front);
          const backBuffer = await fetchImageBytes(back);
          imageBuffers.push(frontBuffer, backBuffer);
        } else {
          throw new Error('Missing MDFC images');
        }
      } else {
        const imageUrl = data.image_uris?.normal;
        if (!imageUrl) throw new Error('No image URI');
        const buffer = await fetchImageBytes(imageUrl);
        imageBuffers.push(buffer);
      }
    } catch (e) {
      console.warn(`⚠️ Failed to fetch "${name}": ${e.message}`);
    }

    await delay(delayMs);
  }

  return imageBuffers;
};

export async function generateProxyPdf(cardNames) {
  const imageBuffers = await fetchCardImageSequentially(cardNames);

  const pdfDoc = await PDFDocument.create();
  const cardWidth = 2.5 * 72 * 0.9;
  const cardHeight = 3.5 * 72 * 0.9;
  const cardsPerRow = 4;
  const cardsPerCol = 4;
  const margin = 20;

  let page = pdfDoc.addPage([8.5 * 72, 11 * 72]);
  let x = margin;
  let y = page.getHeight() - margin - cardHeight;
  let count = 0;

  for (const imgBytes of imageBuffers) {
    if (count > 0 && count % (cardsPerRow * cardsPerCol) === 0) {
      page = pdfDoc.addPage([8.5 * 72, 11 * 72]);
      x = margin;
      y = page.getHeight() - margin - cardHeight;
    }

    try {
      const img = await pdfDoc.embedJpg(imgBytes).catch(() => pdfDoc.embedPng(imgBytes));
      page.drawImage(img, { x, y, width: cardWidth, height: cardHeight });
    } catch (err) {
      console.error('❌ Failed to embed image:', err.message);
    }

    count++;
    x += cardWidth + margin;
    if (count % cardsPerRow === 0) {
      x = margin;
      y -= cardHeight + margin;
    }
  }

  return await pdfDoc.save();
}
