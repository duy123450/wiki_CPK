const passport = require("passport");
const TwitterStrategy = require("passport-twitter-oauth2").Strategy;
const { twitterLoginUser } = require("../auth.service");

const isProduction = process.env.NODE_ENV === "production";
const clientId = isProduction
  ? (process.env.X_PROD_CLIENT_ID || process.env.X_CLIENT_ID)
  : (process.env.X_LOCAL_CLIENT_ID || process.env.X_CLIENT_ID);
const clientSecret = isProduction
  ? (process.env.X_PROD_CLIENT_SECRET || process.env.X_CLIENT_SECRET)
  : (process.env.X_LOCAL_CLIENT_SECRET || process.env.X_CLIENT_SECRET);
const callbackURL = isProduction
  ? process.env.X_PROD_CALLBACK_URL
  : `${process.env.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/x/callback`;

if (clientId && clientSecret) {
  const twitterStrategy = new TwitterStrategy(
    {
      clientID: clientId,
      clientSecret: clientSecret,
      clientType: 'confidential',
      callbackURL: callbackURL,
      authorizationURL: "https://twitter.com/i/oauth2/authorize",
      tokenURL: "https://api.twitter.com/2/oauth2/token",
      userProfileURL: "https://api.twitter.com/2/users/me",
      includeEmail: true,
      pkce: true,
      state: true,
      scopeSeparator: ' ',
      customHeaders: {
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const authResult = await twitterLoginUser(profile);
        return done(null, authResult);
      } catch (error) {
        return done(error, false);
      }
    }
  );

  twitterStrategy.userProfile = async function(accessToken, params, done) {
    if (typeof params === 'function') {
      done = params;
      params = {};
    }
    try {
      const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const text = await response.text();
      
      if (!response.ok) {
        return done(new Error(`Twitter API error: ${text}`));
      }
      
      const data = JSON.parse(text);
      
      const profile = {
        provider: 'twitter',
        id: data.data.id,
        username: data.data.username,
        displayName: data.data.name,
        photos: data.data.profile_image_url ? [{ value: data.data.profile_image_url }] : [],
        _raw: text,
        _json: data
      };
      
      done(null, profile);
    } catch (error) {
      done(error);
    }
  };

  passport.use('twitter', twitterStrategy);
}
