import express from "express";
import { BASE_USER_PORT, BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";
import { rsaEncrypt, symEncrypt, exportSymKey, createRandomSymmetricKey, importSymKey } from '../crypto';
import axios from 'axios';

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export type CircuitNode = {
  nodeId: number;
  pubKey: string;
};

var lastReceivedDecryptedMessage: string | null = null;
var lastSentDecryptedMessage: string | null = null;
var lastCircuit: CircuitNode[] | null = null;

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());

  _user.get("/status", (req, res) => {
    res.status(200).send("live");
  });

  _user.get("/getLastReceivedMessage", (req, res) => {
    res.status(200).json({ result: lastReceivedDecryptedMessage });
  });

  _user.get("/getLastSentMessage", (req, res) => {
    res.status(200).json({ result: lastSentDecryptedMessage });
  });

  _user.post("/message", (req, res) => {
    const { message } = req.body;
    lastReceivedDecryptedMessage = message;
    res.status(200).send("success");
  });

  _user.get("/getLastCircuit", (req, res) => {
    if (lastCircuit) {
      const nodeIds = lastCircuit.map(node => node.nodeId);
      res.status(200).json({ result: nodeIds });
    } else {
      res.status(404).send("No circuit found");
    }
  });

  _user.post('/sendMessage', async (req, res) => {
    const { message, destinationUserId } = req.body as SendMessageBody;
    lastSentDecryptedMessage = message;
    const response = await axios.get(`http://localhost:${REGISTRY_PORT}/getNodeRegistry`);
    const nodes = response.data.nodes as CircuitNode[];

    const circuit: CircuitNode[] = nodes.sort(() => 0.5 - Math.random()).slice(0, 3); // Randomly select 3 nodes
    let encryptedMessage = message;
    let destination = String(BASE_USER_PORT + destinationUserId).padStart(10, '0');

    for (const node of circuit) {
      const symKeyCrypto = await createRandomSymmetricKey();
      const symKeyString = await exportSymKey(symKeyCrypto);
      const symKey = await importSymKey(symKeyString);
      encryptedMessage = await symEncrypt(symKey, destination + encryptedMessage);
      destination = String(BASE_ONION_ROUTER_PORT + node.nodeId).padStart(10, '0');
      encryptedMessage = await rsaEncrypt(symKeyString, node.pubKey) + encryptedMessage;
    }

    lastCircuit = circuit.reverse();
    const entryNode = lastCircuit[0];
    await axios.post(`http://localhost:${BASE_ONION_ROUTER_PORT + entryNode.nodeId}/message`, {
      message: encryptedMessage,
    });
    res.status(200).send('Message sent');
  });

  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(`User ${userId} is listening on port ${BASE_USER_PORT + userId}`);
  });

  return server;
}
