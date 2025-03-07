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
app.post("/send-notification", async (req, res) => {
  const { toEmail, caseId, providerEmail } = req.body;
  const subject = `Case Accepted: CASE-${caseId}`;
  const text = `Your case has been accepted for review by ${providerEmail}.`;
  try {
    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      text,
    });
    res.status(200).json({ message: "Email sent successfully", info });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending email", error });
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
