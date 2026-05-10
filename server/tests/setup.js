const { connect, clearDatabase, disconnect } = require('./utils/dbHandler');

beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await disconnect();
});
