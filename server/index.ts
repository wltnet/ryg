import express, { Request, Response, NextFunction } from 'express';
import EventEmitter from 'node:events';
import cors from 'cors';

interface Equipment {
  id: string;
  state: string;
}

type ObjectKeys = string[];

// Mock data
let equipments = [
  { id: '1', state: 'red'},
  { id: '2', state: 'red'},
  { id: '3', state: 'red'},
  { id: '4', state: 'red'},
  { id: '5', state: 'red'},
];

const isObjectHasKeys = (obj: {}, keys: ObjectKeys): boolean => {
  return keys.every((key) => Object.hasOwn(obj, key));
}

const app = express();
const port = '4000';

const eventEmitter = new EventEmitter();

app.use(
  cors(),
  express.json(),
);

app.get('/api/equipments', (_, res: Response) => {
  res.json(equipments);
});

app.post('/api/changeState', (req: Request, res: Response, next: NextFunction) => {
  const objectKeys: ObjectKeys = ['id', 'state'];
  if (!isObjectHasKeys(req.body, objectKeys)) {
    res.json({ status: 'Missing data' });
    return next();
  }

  const equipmentIndex = equipments.findIndex(equipment => req.body.id === equipment.id);
  equipments[equipmentIndex] = req.body;

  eventEmitter.emit('stateChanged', req.body);

  res.json({ status: 'OK' });
});

app.get('/api/realtimeState', (req: Request, res: Response) => {
  res.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  const sendEvent = (data: Equipment) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const onStateChanged = (data: Equipment) => {
    sendEvent(data);
  };

  eventEmitter.on('stateChanged', onStateChanged);

  req.on('close', () => {
    eventEmitter.removeListener('stateChanged', onStateChanged);
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
