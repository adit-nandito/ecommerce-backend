const Axios = require('axios');
const _ = require('lodash');
const Boom = require('@hapi/boom');
const DatabaseService = require('../services/database');

const getAllProduct = async () => {
  try {
    const response = await Axios.get('https://dummyjson.com/products');
    const { products } = response.data;
    const valueQuery = products
      .map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`)
      .join(', ');

    const statement = products.flatMap((item) => [item.title, item.sku, item.images[0], item.price, item.description]);
    const queries = `INSERT INTO products (title, sku, image, price, description) VALUES ${valueQuery} ON CONFLICT (sku) DO NOTHING`;
    // const queries = `INSERT INTO products (title, sku, image, price, description) VALUES ${valueQuery} ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title, image = EXCLUDED.image, price = EXCLUDED.price, description = EXCLUDED.description RETURNING *`;

    await DatabaseService.executeQuery(queries, statement);
    const selectAllQueries = 'SELECT * FROM products';
    const getAllData = await DatabaseService.executeQuery(selectAllQueries);
    if (_.isEmpty(getAllData)) {
      return Promise.reject(Boom.notFound('ALL_PRODUCT_IS_EMPTY'));
    }

    return Promise.resolve(getAllData);
  } catch (err) {
    return Promise.reject(err);
  }
};

const getListProduct = async (page) => {
  try {
    const limit = 10;
    const offset = (page - 1) * limit;
    const queries =
      'SELECT p.title, p.sku, p.image, p.price, p.description, COALESCE(SUM(t.qty), 0) AS stock FROM products p LEFT JOIN transactions t ON p.sku = t.sku GROUP BY p.title, p.sku, p.image, p.price, p.description LIMIT $1 OFFSET $2';

    const response = await DatabaseService.executeQuery(queries, [limit, offset]);
    if (_.isEmpty(response)) {
      return Promise.reject(Boom.notFound('PRODUCT_IS_EMPTY'));
    }

    return Promise.resolve(response);
  } catch (err) {
    return Promise.reject(err);
  }
};

const getDetailProduct = async (sku) => {
  try {
    const queries =
      'SELECT p.title, p.sku, p.image, p.price, p.description, COALESCE(SUM(t.qty), 0) AS stock FROM products p LEFT JOIN transactions t ON p.sku = t.sku WHERE p.sku = $1 GROUP BY p.title, p.sku, p.image, p.price, p.description';

    const response = await DatabaseService.executeQuery(queries, [sku]);
    if (_.isEmpty(response)) {
      return Promise.reject(Boom.notFound('DETAIL_PRODUCT_NOT_FOUND'));
    }

    return Promise.resolve(response[0]);
  } catch (err) {
    return Promise.reject(err);
  }
};

const submitAddProduct = async (data) => {
  try {
    const valueQuery = data
      .map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`)
      .join(', ');
    const queries = `INSERT INTO products (title, sku, image, price, description) VALUES ${valueQuery};`;
    const statement = data.flatMap((item) => [item.title, item.sku, item.image, item.price, item.description]);

    await DatabaseService.executeQuery(queries, statement);
    return Promise.resolve({ message: 'ADD_PRODUCT_SUCCESS' });
  } catch (err) {
    return Promise.reject(err);
  }
};

const submitUpdateProduct = async (dataObject) => {
  const { title, sku, image, price, description } = dataObject;
  try {
    const queries = `UPDATE products SET title = $1, image = $2, price = $3, description = $4 WHERE sku = $5;`;
    await DatabaseService.executeQuery(queries, [title, image, price, description, sku]);
    return Promise.resolve({ message: 'UPDATE_PRODUCT_SUCCESS' });
  } catch (err) {
    return Promise.reject(err);
  }
};

const submitDeleteProduct = async (listSKU) => {
  try {
    const queries = 'DELETE FROM products WHERE sku = ANY($1)';
    await DatabaseService.executeQuery(queries, [listSKU]);
    return Promise.resolve({ message: 'DELETE_PRODUCT_SUCCESS' });
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports = {
  getAllProduct,
  getListProduct,
  getDetailProduct,
  submitAddProduct,
  submitUpdateProduct,
  submitDeleteProduct
};
