import express from 'express';
import { generateProxyPdf } from './generate.js';

const app = express();
app.use(express.json());

app.post('/generate', async (req, res) => {
  const { cards } = req.body;

  if (!Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid "cards" array' });
  }

  try {
    const pdfBytes = await generateProxyPdf(cards);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=proxies.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
