const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send(`Hello from ${process.env.ENVIRONMENT || 'unknown'} environment`);
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', env: process.env.ENVIRONMENT || 'unknown' });
});

// Listen on all interfaces so Docker can expose the port to host
app.listen(PORT, '0.0.0.0', () => {
    console.log(`App running on port ${PORT}`);
});
