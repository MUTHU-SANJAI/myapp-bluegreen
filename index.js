const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  // include simple dependency checks here later if you need them
  res.json({status: 'ok', pid: process.pid, env: process.env.NODE_ENV || 'production'});
});

app.get('/', (req, res) => {
  res.send(`Hello from myapp-bluegreen (pid ${process.pid})`);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
