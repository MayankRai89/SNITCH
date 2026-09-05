import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import SnitchModel from "../model/user.model.js";
import config from "./config.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: config.googleCallbackUrl,
      // passport-google-oauth20 generates & validates the state param by default
      // when session support is present; with session: false we pass it manually.
      state: false,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email returned from Google"), null);
        }

        // 1. Known google_id → returning user, log them straight in
        const byGoogleId = await SnitchModel.findByGoogleId(profile.id);
        if (byGoogleId) {
          return done(null, { type: "login", user: byGoogleId });
        }

        // 2. Email matches an existing account → do NOT auto-link.
        //    Require the user to prove ownership with their password first.
        const byEmail = await SnitchModel.findByEmail(email);
        if (byEmail) {
          return done(null, {
            type: "link_pending",
            google_id: profile.id,
            email,
            full_name: profile.displayName,
            userId: byEmail.id,
          });
        }

        // 3. Brand new user → ask them to pick a role before creating the account
        return done(null, {
          type: "new_user",
          google_id: profile.id,
          email,
          full_name: profile.displayName,
        });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;

