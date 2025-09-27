const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const createApp = () => {
  const app = express();

  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', routes);

  app.use('*', (req, res) => {
    res.status(404).json({ error: { message: 'Resource not found' } });
  });

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
