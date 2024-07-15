const Glue = require('@hapi/glue');
const Manifest = require('./manifest.json');

const options = {
  relativeTo: __dirname
};

const startServer = async () => {
  try {
    require('dotenv').config();

    const server = await Glue.compose(Manifest, options);
    await server.start();

    server.ext('onPreResponse', (request, h) => {
      const response = request.response;
      if (response.isBoom) {
        const statusCode = response.output.statusCode;
        const errorMessage = response.output.payload.message;

        return h
          .response({
            statusCode,
            error: errorMessage
          })
          .code(statusCode);
      }

      return h.continue;
    });

    console.log('Server running on %s', server.info.uri);
  } catch (err) {
    console.error('index.js ~ startServer ~ err', err);
    process.exit(1);
  }
};

startServer();

module.exports = {
  startServer
};
