const Joi = require('@hapi/joi');
const TransactionHelper = require('../helpers/transactionHelper');
const PostHandler = require('../utils/postHandler');

exports.plugin = {
  name: 'transaction',
  register: async (server, options) => {
    server.validator(Joi);
    server.route([
      {
        method: 'GET',
        path: options.baseUrl + '/list',
        options: {
          description: 'Get list transaction',
          validate: {
            query: {
              page: Joi.number().required()
            }
          }
        },
        handler: listTransaction
      },
      {
        method: 'POST',
        path: options.baseUrl + '/detail',
        options: {
          description: 'Get detail transaction',
          validate: {
            payload: {
              sku: Joi.string().required()
            }
          }
        },
        handler: detailTransaction
      },
      {
        method: 'POST',
        path: options.baseUrl + '/add',
        options: {
          description: 'Add transaction',
          validate: {
            payload: {
              data: Joi.array()
                .items(
                  Joi.object({
                    sku: Joi.string().required(),
                    qty: Joi.number().required()
                  })
                )
                .required()
            }
          }
        },
        handler: addTransaction
      },
      {
        method: 'PUT',
        path: options.baseUrl + '/update',
        options: {
          description: 'Update transactions',
          validate: {
            payload: {
              sku: Joi.string().required(),
              qty: Joi.number().required()
            }
          }
        },
        handler: updateTransaction
      },
      {
        method: 'DELETE',
        path: options.baseUrl + '/delete',
        options: {
          description: 'Delete transaction',
          validate: {
            payload: {
              listSKU: Joi.array().required()
            }
          }
        },
        handler: deleteTransaction
      }
    ]);
  }
};

const listTransaction = async (req, res) => {
  const { page } = req.query;
  const pageQuery = Math.floor(page);
  try {
    const response = await TransactionHelper.getListTransaction(pageQuery);
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return PostHandler.errorResponseHandler(err);
  }
};

const detailTransaction = async (req, res) => {
  const { sku } = req.payload;
  try {
    const response = await TransactionHelper.getDetailTransaction(sku);
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return PostHandler.errorResponseHandler(err);
  }
};

const addTransaction = async (req, res) => {
  const { data } = req.payload;
  try {
    const response = await TransactionHelper.submitAddTransaction(data);
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return PostHandler.errorResponseHandler(err);
  }
};

const updateTransaction = async (req, res) => {
  const { sku, qty } = req.payload;
  const qtyQuery = Math.floor(qty);
  try {
    const response = await TransactionHelper.submitUpdateTransaction(sku, qtyQuery);
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return PostHandler.errorResponseHandler(err);
  }
};

const deleteTransaction = async (req, res) => {
  const { listSKU } = req.payload;
  try {
    const response = await TransactionHelper.submitDeleteTransaction(listSKU);
    return res.response(response);
  } catch (err) {
    console.log('error====', err);
    return PostHandler.errorResponseHandler(err);
  }
};
