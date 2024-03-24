import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export async function user(userId: number) {
  let lastReceivedMessage: string | null = null;
  let lastSentMessage: string | null = null;
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  // TODO implement the status route
  // Route for getting the last received message
  _user.get("/getLastReceivedMessage", (req, res) => {
    res.json({ result: lastReceivedMessage });
  });

// Route for getting the last sent message
  _user.get("/getLastSentMessage", (req, res) => {
    res.json({ result: lastSentMessage });
  });

  _user.get("/status", (req, res) => {
    res.send("live");
  });

  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
        `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });
  _user.post("/receiveMessage", (req, res) => {
    const { message } = req.body;
    lastReceivedMessage = message;
    res.status(200).send("Message received");
  });

  return server;
}
