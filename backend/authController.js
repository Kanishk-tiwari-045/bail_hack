require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const jwt = require("jsonwebtoken");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const SECRET_KEY = process.env.JWT_SECRET;

const registerUser = async (req, res) => {
  try {
    const { email, password, isOfficial, isJudge } = req.body;

    // Check if user already exists in the custom "users" table
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    if (selectError && selectError.code !== "PGRST116") {
      return res.status(400).json({ error: selectError.message });
    }

    let role;
    if (isOfficial) {
      role = isJudge ? "judge" : "legal aid provider";
    } else {
      role = "under trial prisoner";
    }

    // Register user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Insert user into the custom "users" table with their role
    const { error: dbError } = await supabase.from("users").insert([{ email, role }]);
    if (dbError) {
      return res.status(500).json({ error: dbError.message });
    }
    
    console.log("Received values:", { isOfficial, isJudge });
    return res.status(201).json({ message: "User registered successfully", data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists in the custom "users" table
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!existingUser) {
      return res.status(400).json({ error: "User not found" });
    }
    if (selectError) {
      return res.status(400).json({ error: selectError.message });
    }

    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
    return res.json({ message: "Login successful", token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { registerUser, loginUser };
