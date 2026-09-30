import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const backendUrl = process.env.BACKEND_URL

export const googleOAuthConfigurado = Boolean(
  googleClientId && googleClientSecret && backendUrl
)

if (googleClientId && googleClientSecret && backendUrl) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${backendUrl}/api/auth/google/callback`,
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
} else {
  console.warn(
    'Google OAuth desabilitado: configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e BACKEND_URL.'
  )
}

export default passport