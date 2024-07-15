'use strict';

const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const { Pool } = require('pg');
const Sinon = require('sinon');

const { experiment, describe, test, before, after, beforeEach, afterEach } = (exports.lab = Lab.script());

const { startTestServer } = require('./config/testServer');
const MockTransactionDatabase = require('./mocks/database/transaction.json');

let server;
let clientQueryStub;

experiment('Transaction', () => {
  before(async () => {
    console.log = () => {};
    server = await startTestServer();
  });

  beforeEach(async () => {
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

  describe('Get List', () => {
    test('it should return response 200: Get List Transaction', async () => {
      const injectOptions = {
        method: 'GET',
        url: '/api/transaction/list?page=1'
      };

      clientQueryStub
        .withArgs(
          'SELECT t.sku, t.qty, (t.qty * p.price) AS amount FROM transactions t LEFT JOIN products p ON t.sku = p.sku LIMIT $1 OFFSET $2',
          [10, 0]
        )
        .resolves({ rows: MockTransactionDatabase });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result).to.be.not.empty();
    });

    test('it should return response 404: Transaction List is empty', async () => {
      const injectOptions = {
        method: 'GET',
        url: '/api/transaction/list?page=1'
      };

      clientQueryStub
        .withArgs(
          'SELECT t.sku, t.qty, (t.qty * p.price) AS amount FROM transactions t LEFT JOIN products p ON t.sku = p.sku LIMIT $1 OFFSET $2',
          [10, 0]
        )
        .resolves({ rows: [] });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(404);
      expect(response.result.error).equal('TRANSACTION_IS_EMPTY');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'GET',
        url: '/api/transaction/list?page=1'
      };

      clientQueryStub
        .withArgs(
          'SELECT t.sku, t.qty, (t.qty * p.price) AS amount FROM transactions t LEFT JOIN products p ON t.sku = p.sku LIMIT $1 OFFSET $2',
          [10, 0]
        )
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });

  describe('Get Detail', () => {
    test('it should return response 200: Get Detail Transaction', async () => {
      const injectOptions = {
        method: 'POST',
        url: '/api/transaction/detail',
        payload: { sku: 'TEST123' }
      };

      clientQueryStub
        .withArgs(
          'SELECT t.sku, t.qty, (t.qty * p.price) AS amount FROM transactions t LEFT JOIN products p ON t.sku = p.sku WHERE t.sku = $1 GROUP BY t.sku, t.qty, p.price',
          ['TEST123']
        )
        .resolves({ rows: MockTransactionDatabase });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result).to.be.not.empty();
    });

    test('it should return response 404: Transaction detail not found', async () => {
      const injectOptions = {
        method: 'POST',
        url: '/api/transaction/detail',
        payload: { sku: 'TEST123' }
      };

      clientQueryStub
        .withArgs(
          'SELECT t.sku, t.qty, (t.qty * p.price) AS amount FROM transactions t LEFT JOIN products p ON t.sku = p.sku WHERE t.sku = $1 GROUP BY t.sku, t.qty, p.price',
          ['TEST123']
        )
        .resolves({ rows: [] });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(404);
      expect(response.result.error).equal('DETAIL_TRANSACTION_NOT_FOUND');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'POST',
        url: '/api/transaction/detail',
        payload: { sku: 'TEST123' }
      };

      clientQueryStub
        .withArgs(
          'SELECT t.sku, t.qty, (t.qty * p.price) AS amount FROM transactions t LEFT JOIN products p ON t.sku = p.sku WHERE t.sku = $1 GROUP BY t.sku, t.qty, p.price',
          ['TEST123']
        )
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });

  describe('Add Transaction', () => {
    test('it should return response 200: Successfully add transaction', async () => {
      const injectOptions = {
        method: 'POST',
        url: '/api/transaction/add',
        payload: {
          data: [
            {
              sku: 'TEST123',
              qty: 111
            }
          ]
        }
      };

      clientQueryStub
        .withArgs('INSERT INTO transactions (sku, qty) VALUES ($1, $2);', ['TEST123', 111])
        .resolves({ rows: [] });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result.message).equal('ADD_TRANSACTION_SUCCESS');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'POST',
        url: '/api/transaction/add',
        payload: {
          data: [
            {
              sku: 'TEST123',
              qty: 111
            }
          ]
        }
      };

      clientQueryStub
        .withArgs('INSERT INTO transactions (sku, qty) VALUES ($1, $2);', ['TEST123', 111])
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });

  describe('Update Transaction', () => {
    test('it should return response 200: Successfully update transaction', async () => {
      const injectOptions = {
        method: 'PUT',
        url: '/api/transaction/update',
        payload: {
          sku: 'TEST123',
          qty: 111
        }
      };

      clientQueryStub
        .withArgs('SELECT qty FROM transactions WHERE sku = $1 FOR UPDATE', ['TEST123'])
        .resolves({ rows: MockTransactionDatabase });

      clientQueryStub.withArgs('UPDATE transactions SET qty = $1 WHERE sku = $2', [130, 'TEST123']).resolves({
        rows: []
      });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result.message).equal('UPDATE_TRANSACTION_SUCCESS');
    });

    test('it should return response 400: Get insufficient stock', async () => {
      const injectOptions = {
        method: 'PUT',
        url: '/api/transaction/update',
        payload: {
          sku: 'TEST123',
          qty: -10000
        }
      };

      clientQueryStub
        .withArgs('SELECT qty FROM transactions WHERE sku = $1 FOR UPDATE', ['TEST123'])
        .resolves({ rows: MockTransactionDatabase });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(400);
      expect(response.result.error).equal('INSUFFICIENT_STOCK');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'PUT',
        url: '/api/transaction/update',
        payload: {
          sku: 'TEST123',
          qty: 111
        }
      };

      clientQueryStub
        .withArgs('SELECT qty FROM transactions WHERE sku = $1 FOR UPDATE', ['TEST123'])
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });

  describe('Delete Transaction', () => {
    test('it should return response 200: Successfully delete transaction', async () => {
      const injectOptions = {
        method: 'DELETE',
        url: '/api/transaction/delete',
        payload: {
          listSKU: ['TEST123']
        }
      };

      clientQueryStub.withArgs('DELETE FROM transactions WHERE sku = ANY($1)', [['TEST123']]).resolves({ rows: [] });

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(200);
      expect(response.result.message).equal('DELETE_TRANSACTION_SUCCESS');
    });

    test('it should return response 500: Something went wrong with database', async () => {
      const injectOptions = {
        method: 'DELETE',
        url: '/api/transaction/delete',
        payload: {
          listSKU: ['TEST123']
        }
      };

      clientQueryStub
        .withArgs('DELETE FROM transactions WHERE sku = ANY($1)', [['TEST123']])
        .rejects(new Error('Database error'));

      const response = await server.inject(injectOptions);
      expect(response.statusCode).to.equal(500);
    });
  });
});
