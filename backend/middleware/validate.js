const { ZodError } = require('zod');

const validate = (schema, statusCode = 400) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body ?? {},
      params: req.params,
      query: req.query,
    });

    if (!parsed.success) {
      const error = new Error('Validation failed');
      error.statusCode = statusCode;
      error.details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw error;
    }

    req.body = { ...req.body, ...parsed.data.body };
    req.params = { ...req.params, ...parsed.data.params };
    req.query = { ...req.query, ...parsed.data.query };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;
