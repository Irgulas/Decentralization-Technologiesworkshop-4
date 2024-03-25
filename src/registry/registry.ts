import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";


export type Node = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

// Création d'une liste pour stocker les nœuds enregistrés
const nodesRegistry: Node[] = [];

export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  _registry.get('/status', (req: Request, res: Response) => {
    res.send('live');
  });

  // Ajout de la route pour enregistrer un nœud
  _registry.post('/registerNode', (req: Request, res: Response) => {
    const { nodeId, pubKey }: RegisterNodeBody = req.body;

    // Vérification pour éviter les doublons
    const nodeExists = nodesRegistry.some(node => node.nodeId === nodeId);
    if (nodeExists) {
      return res.status(400).send({ error: "Node already registered" });
    }
    return res.status(200).send({ error: "Node not already registered" });


    // Ajout du nœud à la liste
    nodesRegistry.push({ nodeId, pubKey });
    res.status(201).send({ message: "Node registered successfully" });
  });

  // Ajout d'une route pour récupérer tous les nœuds enregistrés (facultatif)
  _registry.get('/getNodes', (req: Request, res: Response) => {
    res.status(200).send({ nodes: nodesRegistry });
  });
  _registry.get('/getNodeRegistry', (req: Request, res: Response) => {
    const payload = {
      nodes: nodesRegistry.map(node => ({
        nodeId: node.nodeId,
        pubKey: node.pubKey,
      })),
    };
    res.json(payload);
  });



  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`Registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}