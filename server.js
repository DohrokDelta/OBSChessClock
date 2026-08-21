const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 8080;
const TICK_MS = 100;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json'
};

let startMs = 5 * 60 * 1000;
let state = { p1: startMs, p2: startMs, active: 1, running: false, p1Name: 'White', p2Name: 'Black' };
let lastTick = Date.now();
let interval = null;

const INCREMENT_MS = 15 * 1000;

function addActive() {
  if (state.active === 1) state.p1 += INCREMENT_MS;
  else state.p2 += INCREMENT_MS;
}

function weAreLive(wss, data) {
  const msg = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}

function tick(wss) {
  const now = Date.now();
  const dt = now - lastTick;
  lastTick = now;
  if (state.running) {
    if (state.active === 1) {
      state.p1 = Math.max(0, state.p1 - dt);
      if (state.p1 === 0) state.running = false;
    } else {
      state.p2 = Math.max(0, state.p2 - dt);
      if (state.p2 === 0) state.running = false;
    }
  }
  weAreLive(wss, { type: 'state', state });
}

function startTimer(wss) {
  if (interval) return;
  lastTick = Date.now();
  interval = setInterval(() => tick(wss), TICK_MS);
}

function applyCommand(wss, data) {
  switch (data.type) {
    case 'toggle':
      if (!state.running) {
        state.running = true;
      } else {
        state.active = state.active === 1 ? 2 : 1;
        addActive();
      }
      lastTick = Date.now();
      break;
    case 'start':
      if (!state.running) {
        state.running = true;
      }
      lastTick = Date.now();
      break;
    case 'pause':
      state.running = false;
      break;
    case 'reset':
      state.p1 = startMs;
      state.p2 = startMs;
      state.running = false;
      state.active = 1;
      break;
    case 'setTime': {
      const minutes = Number(data.minutes) || 5;
      startMs = Math.max(1, minutes) * 60 * 1000;
      state.p1 = startMs;
      state.p2 = startMs;
      state.running = false;
      state.active = 1;
      break;
    }
    case 'setNames': {
      if (typeof data.p1Name === 'string') state.p1Name = data.p1Name;
      if (typeof data.p2Name === 'string') state.p2Name = data.p2Name;
      break;
    }
  }
  weAreLive(wss, { type: 'state', state });
}

const server = http.createServer((req, res) => {
  const raw = decodeURIComponent(req.url).split('?')[0];
  const file = raw === '/' ? 'controller.html' : raw.slice(1);
  const filePath = path.join(__dirname, file);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'state', state }));
  ws.on('message', (raw) => {
    try {
      applyCommand(wss, JSON.parse(raw));
    } catch (e) {
      // Ruh Roh Raggy
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chess clock server running at http://localhost:${PORT}`);
  startTimer(wss);
});
