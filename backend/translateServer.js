// translateServer.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // or use axios

const app = express();
app.use(cors());
app.use(express.json());

app.post("/translate", async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: "Text and targetLanguage are required." });
    }

    // Prepare the URL for the v2 API endpoint
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    // Set up the payload. Optionally include "source" if you know it.
    const payload = {
      q: text,
      target: targetLanguage,
      format: "text",
    };
    if (sourceLanguage) {
      payload.source = sourceLanguage;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error });
    }

    const data = await response.json();
    // The translated text is in data.data.translations[0].translatedText
    const translatedText = data.data.translations[0].translatedText;
    res.json({ translation: translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ error: "Translation failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Translation server running on port ${PORT}`));
