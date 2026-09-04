import express from "express";
import fs from "fs";
import { GoogleAuth } from "google-auth-library";

const app = express();

// ⭐ RAW BODY LOGGER — ADD THIS HERE
app.use((req, res, next) => {
  let raw = "";
  req.on("data", chunk => raw += chunk);
  req.on("end", () => {
    console.log("RAW BODY:", raw);
    next();
  });
});

// ⭐ Log every incoming request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ⭐ JSON parser (must come AFTER raw logger)
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("OK");
});

const PROJECT_ID = "moving-detection-in-my-house";
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

// Save FCM token
app.post("/register", (req, res) => {
  try {
    const token = req.body.token;

    if (!token) {
      return res.status(400).send("Missing token");
    }

    console.log("Received new FCM token:", token);

    fs.writeFileSync("token.txt", token);

    res.send("Token updated");
  } catch (err) {
    console.error("Error in /register:", err);
    res.status(500).send("Server error");
