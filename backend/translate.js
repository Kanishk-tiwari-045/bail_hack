// translate.js
export const translateText = async (text, targetLanguage, sourceLanguage = "en") => {
    try {
      const response = await fetch("http://localhost:3000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage, sourceLanguage }),
      });
      if (!response.ok) {
        throw new Error("Translation failed");
      }
      const data = await response.json();
      return data.translation;
    } catch (error) {
      console.error("Error in translateText:", error);
      return text; // fallback to the original text
    }
  };
  