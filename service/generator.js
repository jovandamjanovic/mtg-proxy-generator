import fetch from 'node-fetch';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import cliProgress from 'cli-progress';

// Constants
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 24;
const CARD_SPACING = 12;
const CARD_WIDTH = 162;
const CARD_HEIGHT = 226.8;
const DELAY_MS = 200;

class ProxyGeneratorService {
  constructor() {
    this.delay = (ms) => new Promise((res) => setTimeout(res, ms));
    this.chunk = (arr, size) =>
      arr.length === 0 ? [] : [arr.slice(0, size), ...this.chunk(arr.slice(size), size)];
  }

  scryfallUrlForName(name) {
    return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`;
  }

  async fetchImageBytes(url) {
    const res = await fetch(url);
    return await res.arrayBuffer();
  }

  async fetchCardImagesAndExtras(cardName) {
    const cardRes = await fetch(this.scryfallUrlForName(cardName));
    const cardData = await cardRes.json();

    const result = {
      cards: [],
      tokens: [],
      emblems: []
    };

    // Primary face (normal or front face of MDFC)
    const mainImage =
      cardData.image_uris?.normal || cardData.card_faces?.[0]?.image_uris?.normal;
    if (mainImage) result.cards.push({ name: cardName, url: mainImage });

    // Back face of MDFC
    if (cardData.card_faces?.[1]?.image_uris?.normal) {
      result.cards.push({
        name: `${cardName} (Back Face)`,
        url: cardData.card_faces[1].image_uris.normal,
      });
    }

    // Related tokens/emblems from all_parts
    const tokenEntries = (cardData.all_parts || []).filter((part) =>
      part.component === 'token' ||
      part.type_line.toLowerCase().includes('emblem')
    );

    for (const part of tokenEntries) {
      try {
        const tokenRes = await fetch(part.uri);
        const tokenData = await tokenRes.json();
        const tokenImage =
          tokenData.image_uris?.normal ||
          tokenData.card_faces?.[0]?.image_uris?.normal;
        if (tokenImage) {
          const imageData = { name: part.name, url: tokenImage };
          if (part.type_line.toLowerCase().includes('emblem')) {
            result.emblems.push(imageData);
          } else {
            result.tokens.push(imageData);
          }
        }
        await this.delay(50);
      } catch (err) {
        console.warn(`⚠️ Failed to fetch token/emblem for ${part.name}`);
      }
    }

    return result;
  }

  async fetchAllCardImages(cardNames, delayMs = DELAY_MS) {
    const total = cardNames.length;
    const imageList = [];
    const failedCards = [];

    const bar = new cliProgress.SingleBar({
      format: 'Processing [{bar}] {percentage}% | {value}/{total} | {cardName}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
    });

    bar.start(total, 0, { cardName: '' });

    for (let i = 0; i < cardNames.length; i++) {
      const name = cardNames[i];
      bar.update(i, { cardName: name });

      try {
        const images = await this.fetchCardImagesAndExtras(name);
        
        // Process cards
        for (const img of images.cards) {
          const bytes = await this.fetchImageBytes(img.url);
          imageList.push({ name: img.name, bytes });
          await this.delay(delayMs);
        }

        // Process tokens
        for (const img of images.tokens) {
          const bytes = await this.fetchImageBytes(img.url);
          imageList.push({ name: `${img.name} (Token)`, bytes });
          await this.delay(delayMs);
        }

        // Process emblems
        for (const img of images.emblems) {
          const bytes = await this.fetchImageBytes(img.url);
          imageList.push({ name: `${img.name} (Emblem)`, bytes });
          await this.delay(delayMs);
        }
      } catch (err) {
        failedCards.push(name);
      }
    }

    bar.update(total, { cardName: 'Done' });
    bar.stop();

    return { imageList, failedCards };
  }

  async createPdf(imageList, outputFileName) {
    const pdfDoc = await PDFDocument.create();

    const usableWidth = A4_WIDTH - PAGE_MARGIN * 2 + CARD_SPACING;
    const usableHeight = A4_HEIGHT - PAGE_MARGIN * 2 + CARD_SPACING;

    const CARDS_PER_ROW = Math.floor(usableWidth / (CARD_WIDTH + CARD_SPACING));
    const CARDS_PER_COL = Math.floor(usableHeight / (CARD_HEIGHT + CARD_SPACING));
    const IMAGES_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

    const pages = this.chunk(imageList, IMAGES_PER_PAGE);

    for (const pageImages of pages) {
      const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

      for (let i = 0; i < pageImages.length; i++) {
        const col = i % CARDS_PER_ROW;
        const row = Math.floor(i / CARDS_PER_ROW);

        const x = PAGE_MARGIN + col * (CARD_WIDTH + CARD_SPACING);
        const y =
          A4_HEIGHT -
          PAGE_MARGIN -
          (row + 1) * (CARD_HEIGHT + CARD_SPACING) +
          CARD_SPACING;

        const imgBytes = pageImages[i].bytes;

        try {
          const img = await pdfDoc
            .embedJpg(imgBytes)
            .catch(() => pdfDoc.embedPng(imgBytes));
          page.drawImage(img, {
            x,
            y,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          });
        } catch (err) {
          console.error(
            `❌ Failed to embed image for ${pageImages[i].name}`,
            err
          );
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFileName, pdfBytes);
    return pdfBytes;
  }

  async generateProxyCards(cardNames, outputFileName) {
    const { imageList, failedCards } = await this.fetchAllCardImages(cardNames);
    
    const result = {
      success: true,
      totalImages: imageList.length,
      failedCards: failedCards,
      pdfBytes: null
    };

    if (imageList.length > 0) {
      result.pdfBytes = await this.createPdf(imageList, outputFileName);
    }

    return result;
  }
}

export default ProxyGeneratorService; 