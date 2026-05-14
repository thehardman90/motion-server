import express from "express";
import { GoogleAuth } from "google-auth-library";

const app = express();
app.use(express.json());

const PROJECT_ID = "moving-detection-in-my-house";
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

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

app.listen(10000, () => console.log("Server running"));
