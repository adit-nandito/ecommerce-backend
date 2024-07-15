'use strict';

const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const { Pool } = require('pg');
const Sinon = require('sinon');
const Axios = require('axios');

const { experiment, describe, test, before, after, beforeEach, afterEach } = (exports.lab = Lab.script());

const { startTestServer } = require('./config/testServer');
const MockProductsDatabase = require('./mocks/database/products.json');
const MockProductAPI = require('./mocks/api/products.json');

let server;
let clientQueryStub;

experiment('Product', () => {
  before(async () => {
    console.log = () => {};
    server = await startTestServer();
  });

  beforeEach(async () => {
    // Mock Axios
    Sinon.stub(Axios, 'get').resolves({ data: MockProductAPI });

    // Mock PostgreSQL
    const client = {
      query: Sinon.stub(),
      release: Sinon.stub()
    };
    Sinon.stub(Pool.prototype, 'connect').resolves(client);
    clientQueryStub = client.query;
  });

  afterEach(() => {
    Sinon.restore();
  });

  after(async () => {
    await server.stop();
  });

  describe('Get List All', () => {
    test('it should return response 200: Get List All Product', async () => {
      const injectOptions = {
        method: 'GET',
        url: '/api/product/list-all'
      };

      clientQueryStub
        .withArgs(
          'INSERT INTO products (title, sku, image, price, description) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (sku) DO NOTHING',
          ['TEST', 'TEST123', 'https://cdn.dummyjson.com/products/images', 9.99, 'TEST AJA']
        )
        .resolves({ rows: [] });

      clientQueryStub.withArgs('SELECT * FROM products').resolves({ rows: MockProductsDatabase });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result).to.be.not.empty();
    });

    test('it should return response 404: All product List is empty', async () => {
      const injectOptions = {
        method: 'GET',
        url: '/api/product/list-all'
      };

      clientQueryStub
        .withArgs(
          'INSERT INTO products (title, sku, image, price, description) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (sku) DO NOTHING',
          ['TEST', 'TEST123', 'https://cdn.dummyjson.com/products/images', 9.99, 'TEST AJA']
        )
        .resolves({ rows: [] });

      clientQueryStub.withArgs('SELECT * FROM products').resolves({ rows: [] });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(404);
      expect(response.result.error).equal('ALL_PRODUCT_IS_EMPTY');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'GET',
        url: '/api/product/list-all'
      };

      clientQueryStub
        .withArgs(
          'INSERT INTO products (title, sku, image, price, description) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (sku) DO NOTHING',
          ['TEST', 'TEST123', 'https://cdn.dummyjson.com/products/images', 9.99, 'TEST AJA']
        )
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });

  describe('Get List', () => {
    test('it should return response 200: Get List Product', async () => {
      const injectOptions = {
        method: 'GET',
        url: '/api/product/list?page=1'
      };

      clientQueryStub
        .withArgs(
          'SELECT p.title, p.sku, p.image, p.price, p.description, COALESCE(SUM(t.qty), 0) AS stock FROM products p LEFT JOIN transactions t ON p.sku = t.sku GROUP BY p.title, p.sku, p.image, p.price, p.description LIMIT $1 OFFSET $2',
          [10, 0]
        )
        .resolves({ rows: MockProductsDatabase });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result).to.be.not.empty();
    });

    test('it should return response 404: Product List is empty', async () => {
      const injectOptions = {
        method: 'GET',
        url: '/api/product/list?page=1'
      };

      clientQueryStub
        .withArgs(
          'SELECT p.title, p.sku, p.image, p.price, p.description, COALESCE(SUM(t.qty), 0) AS stock FROM products p LEFT JOIN transactions t ON p.sku = t.sku GROUP BY p.title, p.sku, p.image, p.price, p.description LIMIT $1 OFFSET $2',
          [10, 0]
        )
        .resolves({ rows: [] });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(404);
      expect(response.result.error).equal('PRODUCT_IS_EMPTY');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'GET',
        url: '/api/product/list?page=1'
      };

      clientQueryStub
        .withArgs(
          'SELECT p.title, p.sku, p.image, p.price, p.description, COALESCE(SUM(t.qty), 0) AS stock FROM products p LEFT JOIN transactions t ON p.sku = t.sku GROUP BY p.title, p.sku, p.image, p.price, p.description LIMIT $1 OFFSET $2',
          [10, 0]
        )
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });

  describe('Get Detail', () => {
    test('it should return response 200: Get Detail Product', async () => {
      const injectOptions = {
        method: 'POST',
        url: '/api/product/detail',
        payload: { sku: 'TEST123' }
      };

      clientQueryStub
        .withArgs(
          'SELECT p.title, p.sku, p.image, p.price, p.description, COALESCE(SUM(t.qty), 0) AS stock FROM products p LEFT JOIN transactions t ON p.sku = t.sku WHERE p.sku = $1 GROUP BY p.title, p.sku, p.image, p.price, p.description',
          ['TEST123']
        )
        .resolves({ rows: MockProductsDatabase });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result).to.be.not.empty();
    });

    test('it should return response 404: Product detail not found', async () => {
      const injectOptions = {
        method: 'POST',
        url: '/api/product/detail',
        payload: { sku: 'TEST123' }
      };

      clientQueryStub
        .withArgs(
          'SELECT p.title, p.sku, p.image, p.price, p.description, COALESCE(SUM(t.qty), 0) AS stock FROM products p LEFT JOIN transactions t ON p.sku = t.sku WHERE p.sku = $1 GROUP BY p.title, p.sku, p.image, p.price, p.description',
          ['TEST123']
        )
        .resolves({ rows: [] });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(404);
      expect(response.result.error).equal('DETAIL_PRODUCT_NOT_FOUND');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'POST',
        url: '/api/product/detail',
        payload: { sku: 'TEST123' }
      };

      clientQueryStub
        .withArgs(
          'SELECT p.title, p.sku, p.image, p.price, p.description, COALESCE(SUM(t.qty), 0) AS stock FROM products p LEFT JOIN transactions t ON p.sku = t.sku WHERE p.sku = $1 GROUP BY p.title, p.sku, p.image, p.price, p.description',
          ['TEST123']
        )
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });

  describe('Add Product', () => {
    test('it should return response 200: Successfully add product', async () => {
      const injectOptions = {
        method: 'POST',
        url: '/api/product/add',
        payload: {
          data: [
            {
              title: 'TEST 123',
              sku: 'TEST123',
              image: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
              description: '',
              price: 111
            }
          ]
        }
      };

      clientQueryStub
        .withArgs('INSERT INTO products (title, sku, image, price, description) VALUES ($1, $2, $3, $4, $5);', [
          'TEST 123',
          'TEST123',
          'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
          111,
          ''
        ])
        .resolves({ rows: [] });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result.message).equal('ADD_PRODUCT_SUCCESS');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'POST',
        url: '/api/product/add',
        payload: {
          data: [
            {
              title: 'TEST 123',
              sku: 'TEST123',
              image: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
              description: '',
              price: 111
            }
          ]
        }
      };

      clientQueryStub
        .withArgs('INSERT INTO products (title, sku, image, price, description) VALUES ($1, $2, $3, $4, $5);', [
          'TEST 123',
          'TEST123',
          'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
          111,
          ''
        ])
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });

  describe('Update Product', () => {
    test('it should return response 200: Successfully update product', async () => {
      const injectOptions = {
        method: 'PUT',
        url: '/api/product/update',
        payload: {
          title: 'TEST 123',
          sku: 'TEST123',
          image: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
          description: '',
          price: 111
        }
      };

      clientQueryStub
        .withArgs(`UPDATE products SET title = $1, image = $2, price = $3, description = $4 WHERE sku = $5;`, [
          'TEST 123',
          'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
          111,
          '',
          'TEST123'
        ])
        .resolves({ rows: [] });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result.message).equal('UPDATE_PRODUCT_SUCCESS');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'PUT',
        url: '/api/product/update',
        payload: {
          title: 'TEST 123',
          sku: 'TEST123',
          image: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
          description: '',
          price: 111
        }
      };

      clientQueryStub
        .withArgs(`UPDATE products SET title = $1, image = $2, price = $3, description = $4 WHERE sku = $5;`, [
          'TEST 123',
          'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png',
          111,
          '',
          'TEST123'
        ])
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });

  describe('Delete Product', () => {
    test('it should return response 200: Successfully delete product', async () => {
      const injectOptions = {
        method: 'DELETE',
        url: '/api/product/delete',
        payload: {
          listSKU: ['TEST123']
        }
      };

      clientQueryStub.withArgs('DELETE FROM products WHERE sku = ANY($1)', [['TEST123']]).resolves({ rows: [] });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result.message).equal('DELETE_PRODUCT_SUCCESS');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'DELETE',
        url: '/api/product/delete',
        payload: {
          listSKU: ['TEST123']
        }
      };

      clientQueryStub
        .withArgs('DELETE FROM products WHERE sku = ANY($1)', [['TEST123']])
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });
});
