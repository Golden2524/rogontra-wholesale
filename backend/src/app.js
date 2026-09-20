import cors from 'cors';
import express from 'express';

import { findProductById, listCategories, listProducts } from './catalogue.js';
import { getAllowedOrigins } from './config.js';
import { createOrderFromCart } from './orders.js';

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

export function createApp({ allowedOrigins = getAllowedOrigins() } = {}) {
  const app = express();

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

  app.get(`${API_PREFIX}/products`, (request, response) => {
    const query = validateSearchQuery(request.query.q);
    const products = listProducts({ query, category: request.query.category });

    response.status(200).json({
      data: products,
      meta: {
        count: products.length,
        query: query ?? null
      }
    });
  });

  app.get(`${API_PREFIX}/categories`, (_request, response) => {
    response.status(200).json({ data: listCategories() });
  });

  app.get(`${API_PREFIX}/products/:productId`, (request, response, next) => {
    try {
      const product = findProductById(request.params.productId);

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

  app.post(`${API_PREFIX}/orders`, (request, response, next) => {
    try {
      const order = createOrderFromCart(request.body?.cart);
      response.status(201).json({ data: order });
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
