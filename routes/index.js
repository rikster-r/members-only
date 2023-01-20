const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const passport = require('passport');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express', user: req.user || 'Not logged in' });
});

router
  .route('/sign-up')
  .get(function (req, res) {
    res.render('sign-up-form', {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      passwordConfirm: '',
      errors: '',
    });
  })
  .post(
    body('firstName').trim().not().isEmpty().escape().withMessage('First name is required'),
    body('lastName').trim().escape(),
    body('email')
      .not()
      .isEmpty()
      .trim()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Incorrect Email')
      .normalizeEmail(),
    body('password')
      .trim()
      .not()
      .isEmpty()
      .escape()
      .withMessage('Password is required')
      .custom((value, { req }) => {
        if (value !== req.body.passwordConfirm) {
          throw new Error("Password confirmation doesn't match password");
        }
        return true;
      }),
    (req, res, next) => {
      const errors = validationResult(req);
      console.log(errors.array());
      if (!errors.isEmpty()) {
        res.render('sign-up-form', {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          password: req.body.password,
          passwordConfirm: req.body.passwordConfirm,
          errors: errors.array(),
        });
      }

      bcrypt.hash(req.body.password, 8, (err, hashedPassword) => {
        if (err) {
          return next(err);
        }

        const user = new User({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          password: hashedPassword,
          isMember: false,
        });

        user.save((err, user) => {
          if (err) {
            return next(err);
          }

          req.login(user, err => {
            if (err) {
              return next(err);
            }
            return res.redirect('/');
          });
        });
      });
    }
  );

module.exports = router;
