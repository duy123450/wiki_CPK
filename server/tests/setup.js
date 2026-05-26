const { connect, clearDatabase } = require('./utils/dbHandler')

beforeAll(async () => {
  await connect()
})

afterEach(async () => {
  await clearDatabase()
})
