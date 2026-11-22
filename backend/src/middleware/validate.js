// validate.js
// Checks a request's body, query and params against Zod schemas before its
// controller runs - the "validator" step of route -> validator -> controller.
// A mismatch is a 422 that gives each field's reason; what passes, parsed,
// is on req.valid.

import { AppError } from '../errors/AppError.js';

const TARGETS = ['body', 'query', 'params'];

/**
 * Validates request parts against Zod schemas.
 * Parsed output lands on `req.valid` (e.g. `req.valid.body`) rather than
 * overwriting `req.query`, which Express exposes as a getter.
 *
 *   router.post('/', validate({ body: createSchema }), controller)
 */
export const validate = (schemas) => (req, _res, next) => {
  const valid = {};
  const errors = {};

  for (const target of TARGETS) {
    const schema = schemas[target];
    if (!schema) continue;

    const result = schema.safeParse(req[target]);
    if (result.success) {
      valid[target] = result.data;
    } else {
      errors[target] = result.error.flatten();
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(AppError.validation(errors));
  }

  req.valid = valid;
  next();
};

export default validate;
