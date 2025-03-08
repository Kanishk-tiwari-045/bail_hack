require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { registerUser, loginUser } = require("./authController");

const app = express();
app.use(cors());
app.use(express.json());

const { createClient } = require("@supabase/supabase-js");
// Use your service key so that row-level security is bypassed
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

app.post("/legal-query", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }
    const prompt = `You are Nyaya Mitra ChatBot, a highly knowledgeable legal AI assistant specializing in Indian law.
- Respond strictly in **valid JSON format** without any extra text.
- Your response must be in **plain text** with **no special characters, markdown, or bullet points**.
- Ensure **Nyaya Mitra ChatBot** is naturally mentioned in the response.

JSON FORMAT:
{
  "Question": "${question}",
  "Answer": "Provide a structured and legally accurate response in simple text format. No special symbols, no asterisks, no markdown."
}`;

    const chatSession = model.startChat({ generationConfig });
    const result = await chatSession.sendMessage(prompt);
    let responseText = result.response.text().trim();
    console.log("Full Gemini API response text:", responseText);
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (err) {
      console.warn("AI returned unstructured response, attempting cleanup...");
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI did not return valid JSON.");
      }
    }
    res.json(jsonResponse);
  } catch (error) {
    console.error("Error processing legal query:", error);
    res.status(500).json({ error: "Failed to process legal query." });
  }
});

app.post("/send-feedback", async (req, res) => {
  const { toEmail, caseId, feedback, dateassigned } = req.body;
  const subject = `Court Feedback: CASE-${caseId}`;
  const text = `Court feedback for your case (ID: ${caseId}) assigned on ${dateassigned}:\n\n${feedback}`;
  try {
    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      text,
    });
    console.log("Nodemailer sent feedback email:", info);
    res.status(200).json({ message: "Feedback email sent successfully", info });
  } catch (error) {
    console.error("Error sending feedback email:", error);
    res.status(500).json({ message: "Error sending feedback email", error });
  }
});

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,  
  },
});

// Routes for authentication
app.post("/register", registerUser);
app.post("/login", loginUser);

// Mail Notification Route
app.post("/send-feedback", async (req, res) => {
  const { toEmail, caseId, feedback, dateassigned } = req.body;
  // Check that toEmail is provided
  if (!toEmail) {
    return res.status(400).json({ message: "Recipient email is required" });
  }
  const subject = `Court Feedback: CASE-${caseId}`;
  const text = `Court feedback for your case (ID: ${caseId}), assigned on ${dateassigned}:\n\n${feedback}`;
  try {
    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      text,
    });
    console.log("Nodemailer sent feedback email:", info);
    res.status(200).json({ message: "Feedback email sent successfully", info });
  } catch (error) {
    console.error("Error sending feedback email:", error);
    res.status(500).json({ message: "Error sending feedback email", error });
  }
});

// Mail Trial Date Route
app.post("/send-trialdate", async (req, res) => {
  const { toEmail, aidEmail, trialDate, caseId } = req.body;
  console.log("Received trial date notification request:", req.body);
  
  // Extract the actual email from aidEmail
  let extractedAidEmail = "";
  if (aidEmail && aidEmail.toLowerCase().startsWith("accepted: ")) {
    extractedAidEmail = aidEmail.split("accepted: ")[1].trim();
  } else if (aidEmail && aidEmail.toLowerCase().startsWith("under review: ")) {
    extractedAidEmail = aidEmail.split("under review: ")[1].trim();
  } else {
    extractedAidEmail = aidEmail;
  }
  
  const subject = `Trial Date Assigned: CASE-${caseId}`;
  const text = `Your case (ID: ${caseId}) has been assigned a trial date of ${trialDate}.\nLegal Aid Assigned: ${extractedAidEmail}`;
  
  try {
    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      text,
    });
    console.log("Nodemailer sent trial date email:", info);
    
    // Insert record into family_notifications table
    const { data, error } = await supabase
      .from("family_notifications")
      .insert([
        {
          family_email: toEmail,
          title: subject,
          description: text,
          created_at: new Date().toISOString(),
        },
      ]);
    if (error) {
      console.error("Error inserting trial date notification into DB:", error);
      return res.status(500).json({ message: "Error inserting notification", error });
    }
    return res.status(200).json({ message: "Trial date email sent successfully", info });
  } catch (error) {
    console.error("Error sending trial date email:", error);
    return res.status(500).json({ message: "Error sending trial date email", error });
  }
});

app.post("/find-similar-cases", async (req, res) => {
  try {
    const { caseDetails } = req.body;
    if (!caseDetails) {
      return res.status(400).json({ error: "Case details are required." });
    }

    const prompt = `You are an expert legal AI assistant specializing in Indian court cases. Your task is to analyze the given case and find three similar cases from legal databases of Indian courts. Provide the output in EXACTLY the following structured JSON format without any additional explanations, comments, or text outside the JSON: [ { "caseNumber": "XXXXX", "caseJudge": "Justice ABC", "casePetitioner": "XYZ vs State", "caseStatement": "Brief summary of the case...", "caseSections": "IPC 420, CrPC 144", "caseJudgement": "Final judgment given by the court..." } ] The given court case details are: ${caseDetails} Find legally relevant and contextually similar cases based on legal arguments, case sections, and judgments. Ensure accuracy in Indian legal precedents.`;

    const chatSession = model.startChat();
    const result = await chatSession.sendMessage(prompt);
    const responseText = result.response.text();

    console.log("Full Gemini API response text:", responseText);

    // Try to extract JSON from responseText
    let jsonResponse;
    try {
      const jsonStart = responseText.indexOf("[");
      const jsonEnd = responseText.lastIndexOf("]") + 1;
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("JSON boundaries not found in response");
      }
      jsonResponse = responseText.substring(jsonStart, jsonEnd);
      const parsedResponse = JSON.parse(jsonResponse);
      res.json(parsedResponse);
    } catch (jsonError) {
      console.error("Error parsing Gemini API response JSON:", jsonError);
      return res.status(500).json({ error: "Failed to parse similar cases from Gemini API." });
    }
  } catch (error) {
    console.error("Error fetching similar cases:", error);
    res.status(500).json({ error: "Failed to retrieve similar cases." });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
