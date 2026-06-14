const passport = require('passport')

require('../modules/auth/strategies/google')
require('../modules/auth/strategies/twitter')
require('../modules/auth/strategies/discord')
require('../modules/auth/strategies/github')

module.exports = passport
