import fetch from 'node-fetch';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import cliProgress from 'cli-progress';

// === Constants ===
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 24;
const CARD_SPACING = 12;

const CARD_WIDTH = 162;
const CARD_HEIGHT = 226.8;

const DELAY_MS = 200;

// === Input Card List ===
// const cardNames = [
//   'Adrix and Nev, Twincasters',
//   'Ajani Steadfast',
//   'Anguished Unmaking',
//   'Anointed Procession',
//   'Arcane Signet',
//   'Arid Mesa',
//   "Assassin's Trophy",
//   'Avenger of Zendikar',
//   'Awakening Zone',
//   'Badlands',
//   'Bayou',
//   'Bloodstained Mire',
//   'Carth the Lion',
//   'Chandra, Torch of Defiance',
//   'Chromatic Lantern',
//   'Circuitous Route',
//   'Command Tower',
//   "Commander's Sphere",
//   'Commit // Memory',
//   'Counterspell',
//   'Deepglow Skate',
//   'Doomskar',
//   'Doubling Season',
//   'Dryad of the Ilysian Grove',
//   'Elspeth, Knight-Errant',
//   'Elspeth, Storm Slayer',
//   "Elspeth, Sun's Champion",
//   'Explosive Vegetation',
//   'Farewell',
//   'Fellwar Stone',
//   'Flooded Strand',
//   'Forest',
//   "Freyalise, Llanowar's Fury",
//   'Garruk, Cursed Huntsman',
//   'Gideon, Ally of Zendikar',
//   'Grow from the Ashes',
//   'Indatha Triome',
//   'Island',
//   "Jetmir's Garden",
//   'Kaya the Inexorable',
//   'Ketria Triome',
//   'Kiora, the Crashing Wave',
//   "Kodama's Reach",
//   'Liliana, Heretical Healer // Liliana, Defiant Necromancer',
//   'Liliana, the Last Hope',
//   'Liliana, Waker of the Dead',
//   'Mana Drain',
//   'Marsh Flats',
//   'Midnight Clock',
//   'Misty Rainforest',
//   'Mondrak, Glory Dominus',
//   'Mountain',
//   'Narset Transcendent',
//   'Oath of Teferi',
//   'Parallel Lives',
//   'Path of Ancestry',
//   'Path to Exile',
//   'Pir, Imaginative Rascal',
//   'Plains',
//   'Plateau',
//   'Polluted Delta',
//   "Raffine's Tower",
//   'Raugrin Triome',
//   'Rowan Kenrith',
//   "Rowan's Talent",
//   'Savai Triome',
//   'Savannah',
//   'Scalding Tarn',
//   'Scrubland',
//   'Sol Ring',
//   'Sorin, Solemn Visitor',
//   "Spara's Headquarters",
//   'Spark Double',
//   'Swamp',
//   'Swords to Plowshares',
//   'Taiga',
//   "Teferi's Talent",
//   'Teferi, Hero of Dominaria',
//   'Teferi, Temporal Archmage',
//   'Teferi, Time Raveler',
//   'Teferi, Who Slows the Sunset',
//   "Tezzeret's Gambit",
//   'The World Tree',
//   'Tropical Island',
//   'Tundra',
//   'Underground Sea',
//   'Venser, the Sojourner',
//   'Verdant Catacombs',
//   'Vivien Reid',
//   'Volcanic Island',
//   'Vorinclex, Monstrous Raider',
//   'Will Kenrith',
//   'Windswept Heath',
//   'Wooded Foothills',
//   'Wrath of God',
//   'Wrenn and Realmbreaker',
//   "Xander's Lounge",
//   'Zagoth Triome',
//   "Ziatora's Proving Ground",
// ];

const cardNames = [
  'Damn',
  'Elas il-Kor, Sadistic Pilgrim',
  'Anguished Unmaking',
  'Blood Artist',
  'Cruel Celebrant',
  'Swiftfoor boots',
  'Kambal, Profiteering Mayor',
  'Village Rites',
  'Charismatic Conqueror',
  "Ashnod's Altar",
  'Vito, Thorn of the Dusk Rose',
  'Lotho, Corrupt Shirriff',
  'Marionette Apprentice',
  'Marionette Master',
  'Deadly Dispute',
  'Sanguine Bond',
  'Elenda, the Dusk Rose',
  'Sign in Blood',
  'Victimize',
  'Black Market Connections',
  'Bastion of Remembrance',
  'Carmen, Cruel Skymarcher',
  'Mirkwood Bats',
  'Teysa Karlov',
  'Mondrak, Glory Dominus',
  'Exquisite Blood',
  'Anointed Procession',
  'Pitiless Plunderer',
  'Corpse Knight',
  'Court of Grace',
  'Divine Visitation',
  "Oketra's Monument",
  'Kokusho, the Evening Star',
  'Tymna the Weaver',
  'Clavileño, First of the Blessed',
  ' Trouble in Pairs',
  'Revel in Riches',
  'Athreos, Shroud-Veiled',
  'Karlov of the Ghost Council',
  'Warlock Class',
  "Kaya's Wrath",
  'Cabal Coffers',
  'Urborg, Tomb of Yawgmoth',
  'Bloodline Keeper',
  'Bitterblossom',
  'Westvale Abbey',
  'Army of the Damned',
  'Crowded Crypt',
  'Ojer Taq, Deepest Foundation',
  'Welcoming Vampire',
  'Ancient Gold Dragon',
  'Elesh Norn, Grand Cenobite',
  'Elesh Norn, Mother of Machines',
  'Voice of Victory',
  'Generous Gift',
  'Teysa, Orzhov Scion',
  'Grand Crescendo',
  'Corrupted Conviction',
  'Debt to the Deathless',
  'Liesa, Shroud of Dusk',
  'Despark',
  'Unburial Rites',
  'Ravos, Soultender',
  'Drana and Linvala',
  'Athreos, God of Passage',
  'Priest of Fell Rites',
  'Inkshield',
  'Sunlit Marsh',
  'Forsaken Sanctuary',
  'Snowfield Sinkhole',
  'Shadowy Backstreet',
  'Scoured Barrens',
  'Temple of Silence',
  'Desolate Mire',
  'Orzhov Basilica',
  'Godless Shrine',
];


// === Helpers ===
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const chunk = (arr, size) =>
  arr.length === 0 ? [] : [arr.slice(0, size), ...chunk(arr.slice(size), size)];

const scryfallUrlForName = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`;

const fetchImageBytes = async (url) => {
  const res = await fetch(url);
  return await res.arrayBuffer();
};

const fetchCardImagesAndExtras = async (cardName) => {
  const cardRes = await fetch(scryfallUrlForName(cardName));
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
      await delay(50);
    } catch (err) {
      console.warn(`⚠️ Failed to fetch token/emblem for ${part.name}`);
    }
  }

  return result;
};

// === Image Fetching with Progress ===
const fetchAllCardImages = async (cardNames, delayMs = 200) => {
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
      const images = await fetchCardImagesAndExtras(name);
      
      // Process cards
      for (const img of images.cards) {
        const bytes = await fetchImageBytes(img.url);
        imageList.push({ name: img.name, bytes });
        await delay(delayMs);
      }

      // Process tokens
      for (const img of images.tokens) {
        const bytes = await fetchImageBytes(img.url);
        imageList.push({ name: `${img.name} (Token)`, bytes });
        await delay(delayMs);
      }

      // Process emblems
      for (const img of images.emblems) {
        const bytes = await fetchImageBytes(img.url);
        imageList.push({ name: `${img.name} (Emblem)`, bytes });
        await delay(delayMs);
      }
    } catch (err) {
      failedCards.push(name);
    }
  }

  bar.update(total, { cardName: 'Done' });
  bar.stop();

  return { imageList, failedCards };
};

const fileName = 'Dahon-deck.pdf';
// === PDF Creation ===
const createPdf = async (imageList) => {
  const pdfDoc = await PDFDocument.create();

  const usableWidth = A4_WIDTH - PAGE_MARGIN * 2 + CARD_SPACING;
  const usableHeight = A4_HEIGHT - PAGE_MARGIN * 2 + CARD_SPACING;

  const CARDS_PER_ROW = Math.floor(usableWidth / (CARD_WIDTH + CARD_SPACING));
  const CARDS_PER_COL = Math.floor(usableHeight / (CARD_HEIGHT + CARD_SPACING));
  const IMAGES_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

  const pages = chunk(imageList, IMAGES_PER_PAGE);

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
  fs.writeFileSync(fileName, pdfBytes);
};

// === Main ===
const run = async () => {
  const { imageList, failedCards } = await fetchAllCardImages(
    cardNames,
    DELAY_MS
  );

  console.log(`\n✅ Successfully fetched ${imageList.length} images.`);

  if (failedCards.length > 0) {
    console.log(`\n❌ Failed to fetch data for ${failedCards.length} card(s):`);
    failedCards.forEach((name) => console.log(` - ${name}`));
  }

  await createPdf(imageList);
  console.log(`\n📄 PDF saved as "${fileName}"`);
};

run();
