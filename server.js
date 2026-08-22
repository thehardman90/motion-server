import express from "express";
import fs from "fs";
import { GoogleAuth } from "google-auth-library";

const app = express();

// ⭐ Skip JSON parsing for ALL non-POST requests
app.use((req, res, next) => {
  if (req.method !== "POST") {
    return next();
  }
  next();
});

// ⭐ Safe health check endpoint for Render
app.get("/", (req, res) => {
  res.send("OK");
});

// ⭐ JSON parser for POST requests
app.use(express.json());

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
  }
});

// Send notification
app.post("/send", async (req, res) => {
  try {
    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.SERVICE_ACCOUNT),
      scopes: SCOPES
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const message = {
      message: {
        topic: "motion",
        notification: {
          title: "Motion Detected",
          body: "Your Arduino detected movement!"
        },
        data: {
          count: req.body.count?.toString() || "0",
          timestamp: req.body.timestamp || ""
        }
      }
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
      }
    );

    const result = await response.json();
    res.status(200).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending notification");
  }
});

app.listen(process.env.PORT || 10000, () => console.log("Server running"));
