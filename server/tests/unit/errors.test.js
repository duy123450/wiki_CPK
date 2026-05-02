const { CustomAPIError, createCustomError } = require('../../errors/custom-error');

describe('Custom Error', () => {
    describe('CustomAPIError class', () => {
        it('should be an instance of Error', () => {
            const error = new CustomAPIError('test error', 400);
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(CustomAPIError);
        });

        it('should store the message', () => {
            const error = new CustomAPIError('Something went wrong', 500);
            expect(error.message).toBe('Something went wrong');
        });

        it('should store the statusCode', () => {
            const error = new CustomAPIError('Not found', 404);
            expect(error.statusCode).toBe(404);
        });

        it('should work with different status codes', () => {
            const cases = [
                { msg: 'Bad Request', code: 400 },
                { msg: 'Unauthorized', code: 401 },
                { msg: 'Not Found', code: 404 },
                { msg: 'Server Error', code: 500 },
            ];

            cases.forEach(({ msg, code }) => {
                const error = new CustomAPIError(msg, code);
                expect(error.message).toBe(msg);
                expect(error.statusCode).toBe(code);
            });
        });
    });

    describe('createCustomError()', () => {
        it('should return a CustomAPIError instance', () => {
            const error = createCustomError('test', 400);
            expect(error).toBeInstanceOf(CustomAPIError);
        });

        it('should set message and statusCode correctly', () => {
            const error = createCustomError('Page not found', 404);
            expect(error.message).toBe('Page not found');
            expect(error.statusCode).toBe(404);
        });
    });
});
