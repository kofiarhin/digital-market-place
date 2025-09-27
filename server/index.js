const createApp = require('./app');
const connectDatabase = require('./utils/connectDatabase');

let environment;

try {
  environment = require('./config/environment');
} catch (error) {
  console.error('Environment configuration error:', error.message);
  process.exit(1);
}

const startServer = async () => {
  try {
    await connectDatabase(environment.mongoUri);
    const app = createApp();

    app.locals.config = {
      download: environment.download,
      payouts: environment.payouts
    };

    return app.listen(environment.port, () => {
      console.log(`Server listening on port ${environment.port}`);
    });
  } catch (error) {
    console.error('Unable to start server', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = startServer;
