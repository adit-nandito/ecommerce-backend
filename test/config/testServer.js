const Glue = require('@hapi/glue');
const Manifest = require('./manifestTest.json');

const options = {
  relativeTo: __dirname
};

const startTestServer = async () => {
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

  console.log('Server Test running on %s', server.info.uri);
  return server;
};

startTestServer();

module.exports = {
  startTestServer
};
