const Boom = require('@hapi/boom');

const errorResponseHandler = (err) => {
  if (err.isBoom) {
    const { statusCode } = err.output;
    if (statusCode === 400 || statusCode === 404) {
      throw err;
    }
  }

  throw Boom.badImplementation();
};

module.exports = {
  errorResponseHandler
};
