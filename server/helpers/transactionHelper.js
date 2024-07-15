const Boom = require('@hapi/boom');
const _ = require('lodash');
const DatabaseService = require('../services/database');

const getListTransaction = async (page) => {
  try {
    const limit = 10;
    const offset = (page - 1) * limit;
    const queries =
      'SELECT t.sku, t.qty, (t.qty * p.price) AS amount FROM transactions t LEFT JOIN products p ON t.sku = p.sku LIMIT $1 OFFSET $2';

    const response = await DatabaseService.executeQuery(queries, [limit, offset]);
    if (_.isEmpty(response)) {
      return Promise.reject(Boom.notFound('TRANSACTION_IS_EMPTY'));
    }

    return Promise.resolve(response);
  } catch (err) {
    return Promise.reject(err);
  }
};

const getDetailTransaction = async (sku) => {
  try {
    const queries =
      'SELECT t.sku, t.qty, (t.qty * p.price) AS amount FROM transactions t LEFT JOIN products p ON t.sku = p.sku WHERE t.sku = $1 GROUP BY t.sku, t.qty, p.price';

    const response = await DatabaseService.executeQuery(queries, [sku]);
    if (_.isEmpty(response)) {
      return Promise.reject(Boom.notFound('DETAIL_TRANSACTION_NOT_FOUND'));
    }

    return Promise.resolve(response[0]);
  } catch (err) {
    return Promise.reject(err);
  }
};

const submitAddTransaction = async (data) => {
  try {
    const valueQuery = data.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    const queries = `INSERT INTO transactions (sku, qty) VALUES ${valueQuery};`;
    const statement = data.flatMap((item) => [item.sku, item.qty]);

    await DatabaseService.executeQuery(queries, statement);
    return Promise.resolve({ message: 'ADD_TRANSACTION_SUCCESS' });
  } catch (err) {
    return Promise.reject(err);
  }
};

const submitUpdateTransaction = async (sku, qty) => {
  try {
    const selectQueries = 'SELECT qty FROM transactions WHERE sku = $1 FOR UPDATE';
    const res = await DatabaseService.executeQuery(selectQueries, [sku]);
    const currentQty = res[0].qty;
    const newQty = currentQty + qty;

    if (newQty < 0) {
      return Promise.reject(Boom.badRequest('INSUFFICIENT_STOCK'));
    }

    const updateQueries = 'UPDATE transactions SET qty = $1 WHERE sku = $2';
    await DatabaseService.executeQuery(updateQueries, [newQty, sku]);
    return Promise.resolve({ message: 'UPDATE_TRANSACTION_SUCCESS' });
  } catch (err) {
    return Promise.reject(err);
  }
};

const submitDeleteTransaction = async (listSKU) => {
  try {
    const queries = 'DELETE FROM transactions WHERE sku = ANY($1)';
    await DatabaseService.executeQuery(queries, [listSKU]);
    return Promise.resolve({ message: 'DELETE_TRANSACTION_SUCCESS' });
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports = {
  getListTransaction,
  getDetailTransaction,
  submitAddTransaction,
  submitUpdateTransaction,
  submitDeleteTransaction
};
