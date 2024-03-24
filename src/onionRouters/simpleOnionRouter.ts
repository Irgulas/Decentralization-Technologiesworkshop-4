import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { Server } from 'http';
import { generateKeyPairSync } from 'crypto';
const crypto = require('crypto');
import { BASE_ONION_ROUTER_PORT } from '../config';


const nodeKeys: { [nodeId: number]: { publicKey: string; privateKey: string } } = {};




export async function simpleOnionRouter(nodeId: number): Promise<Server> {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());
  onionRouter.post("/message", (req: Request, res: Response) => {
    const { message }: { message: string } = req.body;

    // Mise à jour du dernier message reçu
    lastReceivedMessage = message;

    // Réponse pour confirmer la réception du message
    res.status(200).send({ message: "Message received successfully" });
  });
  function generateAndStoreKeys(nodeId: number) {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    

    // Store the keys in base64 format for simplicity
    nodeKeys[nodeId] = {
      publicKey: Buffer.from(publicKey).toString('base64'),
      privateKey: Buffer.from(privateKey).toString('base64')
    };
  }

// Route to get the private key of a node (for testing purposes)
  onionRouter.get('/getPrivateKey', (req: Request, res: Response) => {
    const nodeId = parseInt(req.query.nodeId as string); // Assuming nodeId is passed as a query parameter
    const nodeKey = nodeKeys[nodeId];
    if (nodeKey) {
      res.json({ result: nodeKey.privateKey });
    } else {
      res.status(404).send('Node not found or keys not generated');
    }
  });

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
  onionRouter.post("/message", (req: Request, res: Response) => {
    const { message }: { message: string } = req.body;

    // Mise à jour du dernier message reçu
    lastReceivedMessage = message;

    // Réponse pour confirmer la réception du message
    // Ajustez ici pour répondre avec "success" comme texte
    res.status(200).send("success");
  });



  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(`Onion router ${nodeId} is listening on port ${BASE_ONION_ROUTER_PORT + nodeId}`);
  });

  return server;
}
