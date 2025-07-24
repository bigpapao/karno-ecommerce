// Simple health check for Cloud Run
import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
    port: port
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Karno Backend API is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Health check server running on port ${port}`);
});

export default app; 