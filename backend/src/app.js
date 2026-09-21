import cors from 'cors';
import express from 'express';

import { findProductById, listCategories, listProducts } from './catalogue.js';
import { getAllowedOrigins } from './config.js';
import { createOrderFromCart } from './orders.js';
import { createQuoteRequest } from './quotes.js';

const API_PREFIX = '/api/v1';

function createCorsMiddleware(allowedOrigins) {
  return cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error('This origin is not allowed to access the API.');
      error.statusCode = 403;
      callback(error);
    }
  });
}

function validateSearchQuery(query) {
  if (query === undefined) {
    return undefined;
  }

  if (typeof query !== 'string' || query.trim().length > 100) {
    const error = new Error('Query parameter "q" must be 100 characters or fewer.');
    error.statusCode = 400;
    throw error;
  }

  return query.trim();
}

export function createApp({
  allowedOrigins = getAllowedOrigins(),
  auth,
  catalogue,
  persistence
} = {}) {
  const app = express();
  const productCatalogue = catalogue ?? { findProductById, listCategories, listProducts };

  app.disable('x-powered-by');
  app.use(createCorsMiddleware(allowedOrigins));
  app.use(express.json({ limit: '100kb' }));

  app.get(`${API_PREFIX}/health`, (_request, response) => {
    response.status(200).json({
      data: {
        service: 'rogontra-api',
        status: 'ok',
        timestamp: new Date().toISOString()
      }
    });
  });

  app.post(`${API_PREFIX}/auth/register`, async (request, response, next) => {
    try {
      if (!auth) throw new Error('Authentication is not configured.');
      response.status(201).json({ data: await auth.register(request.body) });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${API_PREFIX}/auth/login`, async (request, response, next) => {
    try {
      if (!auth) throw new Error('Authentication is not configured.');
      response.status(200).json({ data: await auth.login(request.body) });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${API_PREFIX}/auth/me`, (request, response, next) => {
    try {
      if (!auth) throw new Error('Authentication is not configured.');
      const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) {
        const error = new Error('A bearer token is required.');
        error.code = 'AUTH_REQUIRED';
        error.statusCode = 401;
        throw error;
      }
      response.status(200).json({ data: auth.verifyToken(token) });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${API_PREFIX}/products`, async (request, response, next) => {
    try {
      const query = validateSearchQuery(request.query.q);
      const products = await productCatalogue.listProducts({
        query,
        category: request.query.category
      });

      response.status(200).json({
        data: products,
        meta: {
          count: products.length,
          query: query ?? null
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${API_PREFIX}/categories`, async (_request, response, next) => {
    try {
      response.status(200).json({ data: await productCatalogue.listCategories() });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${API_PREFIX}/products/:productId`, async (request, response, next) => {
    try {
      const product = await productCatalogue.findProductById(request.params.productId);

      if (!product) {
        response.status(404).json({
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'The requested product does not exist.'
          }
        });
        return;
      }

      response.status(200).json({ data: product });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${API_PREFIX}/orders`, async (request, response, next) => {
    try {
      const order = await createOrderFromCart(request.body?.cart, productCatalogue.findProductById);
      response.status(201).json({ data: persistence ? await persistence.saveOrder(order) : order });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${API_PREFIX}/quotes`, async (request, response, next) => {
    try {
      const quote = await createQuoteRequest(request.body, productCatalogue.findProductById);
      response.status(201).json({ data: persistence ? await persistence.saveQuote(quote) : quote });
    } catch (error) {
      next(error);
    }
  });

  app.use((_request, response) => {
    response.status(404).json({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested API route does not exist.'
      }
    });
  });

  app.use((error, _request, response, _next) => {
    const statusCode = error.statusCode ?? 500;
    const message = statusCode >= 500 ? 'An unexpected server error occurred.' : error.message;

    response.status(statusCode).json({
      error: {
        code: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : (error.code ?? 'BAD_REQUEST'),
        message
      }
    });
  });

  return app;
}
