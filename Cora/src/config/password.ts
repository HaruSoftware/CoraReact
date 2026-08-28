import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        'http://localhost:3000/api/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        console.log('Google autenticou:', {
          id: profile.id,
          nome: profile.displayName,
          email: profile.emails?.[0]?.value,
        })

        done(null, profile)
      } catch (error) {
        done(error, undefined)
      }
    }
  )
)

export default passport