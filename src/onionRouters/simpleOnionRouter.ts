import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { Server } from 'http';
import axios from 'axios';
import { generateRsaKeyPair, exportPubKey, exportPrvKey, rsaDecrypt, symDecrypt } from '../crypto'; // Ajustez ce chemin d'importation selon votre projet
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from '../config'; // Ajustez ce chemin d'importation selon votre projet

export async function simpleOnionRouter(nodeId: number): Promise<Server> {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  // Génération de la paire de clés RSA pour le nœud et enregistrement dans un format exploitable
  const { publicKey, privateKey } = await generateRsaKeyPair();
  const publicKeyBase64 = await exportPubKey(publicKey);
  const privateKeyBase64 = await exportPrvKey(privateKey);

  // Enregistrement du nœud dans le registre
  const registryUrl = `http://localhost:${REGISTRY_PORT}/registerNode`;
  await axios.post(registryUrl, {
    nodeId,
    publicKey: publicKeyBase64
  });

  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: number | null = null;

  // Définition des routes
  onionRouter.get('/getPrivateKey', async (req: Request, res: Response) => {
    res.status(200).json({ privateKey: privateKeyBase64 });
  });

  onionRouter.get("/status", (req, res) => {
    res.status(200).send("live");
  });

  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.status(200).json({ result: lastReceivedEncryptedMessage });
  });

  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
    res.status(200).json({ result: lastReceivedDecryptedMessage });
  });

  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.status(200).json({ result: lastMessageDestination });
  });

  onionRouter.post('/message', async (req: Request, res: Response) => {
    const { message } = req.body;
    try {
      const decryptedMessage = await rsaDecrypt(message, privateKey);

      lastReceivedEncryptedMessage = message;
      lastReceivedDecryptedMessage = decryptedMessage;
      res.status(200).send('Message processed successfully');
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).send('Error processing message');
    }
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(`Onion router ${nodeId} is listening on port ${BASE_ONION_ROUTER_PORT + nodeId}`);
  });

  return server;
}
