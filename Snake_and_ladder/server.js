const express = require('express');
const path = require('path');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const MAX_RETRIES = 10;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function start(port, attempt = 0) {
  const server = app.listen(port, () => {
    console.log(`\n🐍🎲  Snake & Ladder running at: http://localhost:${port}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (attempt >= MAX_RETRIES) {
        console.error(
          `\n❌  Could not find a free port after trying ${port - MAX_RETRIES}..${port}.\n` +
          `   Stop the other process or set PORT=xxxx and try again.\n`
        );
        process.exit(1);
      }
      const next = port + 1;
      console.warn(`⚠  Port ${port} is in use — trying ${next}...`);
      start(next, attempt + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

start(DEFAULT_PORT);
