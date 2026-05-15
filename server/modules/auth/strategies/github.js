const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const { githubLoginUser } = require("../auth.service");

const isProduction = process.env.NODE_ENV === "production";

// Automatically switch between local and production environment variables
const githubClientId = isProduction
  ? process.env.GITHUB_PROD_CLIENT_ID
  : process.env.GITHUB_LOCAL_CLIENT_ID;

const githubClientSecret = isProduction
  ? process.env.GITHUB_PROD_CLIENT_SECRET
  : process.env.GITHUB_LOCAL_CLIENT_SECRET;

const githubCallbackURL = isProduction
  ? process.env.GITHUB_PROD_CALLBACK_URL
  : process.env.GITHUB_LOCAL_CALLBACK_URL || `${process.env.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/github/callback`;

if (githubClientId && githubClientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: githubClientId,
        clientSecret: githubClientSecret,
        callbackURL: githubCallbackURL,
        scope: ['user:email'],
        customHeaders: {
          'User-Agent': 'Wiki-CPK-App'
        }
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const authResult = await githubLoginUser(profile);
          return done(null, authResult);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}
