const { z } = require('zod');
const { BadRequestError } = require('../errors');

const validateRequest = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    } catch (error) {
        if (error instanceof z.ZodError || error.name === 'ZodError') {
            const messages = error.issues.map((e) => e.message).join(', ');
            return next(new BadRequestError(messages));
        }
        return next(error);
    }
};

module.exports = validateRequest;
