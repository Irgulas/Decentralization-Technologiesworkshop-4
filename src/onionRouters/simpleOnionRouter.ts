import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { Server } from 'http';
import { BASE_ONION_ROUTER_PORT } from '../config';

export async function simpleOnionRouter(nodeId: number): Promise<Server> {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  // Define explicit types for all variables
  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: string | null = null;
  let lastReceivedMessage: string | null = null; // For users
  let lastSentMessage: string | null = null; // For users

  onionRouter.get("/status", (req: Request, res: Response) => {
    res.send("live");
  });

  // Nodes' GET routes
  onionRouter.get("/getLastReceivedEncryptedMessage", (req: Request, res: Response) => {
    res.json({ result: lastReceivedEncryptedMessage });
  });

  onionRouter.get("/getLastReceivedDecryptedMessage", (req: Request, res: Response) => {
    res.json({ result: lastReceivedDecryptedMessage });
  });

  onionRouter.get("/getLastMessageDestination", (req: Request, res: Response) => {
    res.json({ result: lastMessageDestination });
  });

  // Users' GET routes
  onionRouter.get("/getLastReceivedMessage", (req: Request, res: Response) => {
    res.json({ result: lastReceivedMessage });
  });

  onionRouter.get("/getLastSentMessage", (req: Request, res: Response) => {
    res.json({ result: lastSentMessage });
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(`Onion router ${nodeId} is listening on port ${BASE_ONION_ROUTER_PORT + nodeId}`);
  });

  return server;
}
