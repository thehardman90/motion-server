import express from "express";
import fs from "fs";
import { GoogleAuth } from "google-auth-library";

const app = express();

// ✅ Only parse JSON when Content-Type is application/json
app.use((req, res, next) => {
  if (req.is("application/json")) {
    return express.json()(req, res, next);
  }
  next();
});

// ✅ Health check endpoint
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
