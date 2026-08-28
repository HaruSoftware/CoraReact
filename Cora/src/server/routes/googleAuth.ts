import { Router } from 'express'
import passport from 'passport'
import '../../config/password.js'

const router = Router()

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
)

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login',
  }),
  (req, res) => {
    res.json({
      success: true,
      usuario: req.user,
    })
  }
)

export default router