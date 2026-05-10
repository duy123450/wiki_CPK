const { CustomAPIError, AuthError, BadRequestError, NotFoundError, ValidationError, WikiError } = require('../../errors/custom-error');

describe('Custom Errors Hierarchy', () => {
    describe('CustomAPIError base class', () => {
        it('should be an instance of Error', () => {
            const error = new CustomAPIError('test error', 400);
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(CustomAPIError);
        });

        it('should store message and statusCode', () => {
            const error = new CustomAPIError('Something went wrong', 500);
            expect(error.message).toBe('Something went wrong');
            expect(error.statusCode).toBe(500);
            expect(error.name).toBe('CustomAPIError');
        });
    });

    describe('Specific error classes', () => {
        it('AuthError should have 401 status', () => {
            const error = new AuthError('Unauthorized');
            expect(error.statusCode).toBe(401);
            expect(error).toBeInstanceOf(CustomAPIError);
        });

        it('BadRequestError should have 400 status', () => {
            const error = new BadRequestError('Bad request');
            expect(error.statusCode).toBe(400);
        });

        it('NotFoundError should have 404 status', () => {
            const error = new NotFoundError('Not found');
            expect(error.statusCode).toBe(404);
        });

        it('ValidationError should have 400 status', () => {
            const error = new ValidationError('Invalid input');
            expect(error.statusCode).toBe(400);
        });

        it('WikiError should have 500 status', () => {
            const error = new WikiError('Server glitch');
            expect(error.statusCode).toBe(500);
        });
    });
});
