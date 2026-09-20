import { createApp } from './app.js';
import { getPort } from './config.js';

const app = createApp();
const port = getPort();

app.listen(port, '0.0.0.0', () => {
  console.info(`Rogontra API is listening on port ${port}.`);
});
