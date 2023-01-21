const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Message = require('../models/message');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const passport = require('passport');

/* GET home page. */
router.get('/', function (req, res, next) {
  Message.find({})
    .populate('author')
    .sort({ timestamp: -1 })
    .exec((err, messages) => {
      if (err) return next(err);

      res.render('index', { messages });
    });
});

router
  .route('/sign-up')
  .get((req, res) => {
    res.render('sign-up-form', {
      firstName: null,
      lastName: null,
      email: null,
      password: null,
      passwordConfirm: null,
      errors: null,
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
      .withMessage('Invalid Email')
      .custom(value => {
        return User.findOne({ email: value }).then(user => {
          if (user) return Promise.reject('Account with this email already exists');
        });
      })
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

router
  .route('/sign-in')
  .get((req, res) => {
    res.render('sign-in-form', { errors: null, email: null, password: null });
  })
  .post(
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/sign-in',
    })
  );

router.get('/log-out', (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

router
  .route('/activate')
  .get((req, res, next) => {
    if (!req.user) return next(null, req, res);

    res.render('activate-form', { error: null });
  })
  .post((req, res, next) => {
    if (req.body.code === 'PIZZAPARTY') {
      console.log(req.user._id);
      User.findByIdAndUpdate(req.user._id, { isMember: true }, err => {
        if (err) return next(err);
        res.redirect('/');
      });
    } else {
      res.render('activate-form', { error: 'Incorrect code. Try again?' });
    }
  });

router.post('/new-message', body('message').trim().not().isEmpty().escape(), (req, res, next) => {
  errors = validationResult(req);
  if (errors.isEmpty()) {
    console.log('REACH-1');

    const message = new Message({
      author: req.user._id,
      text: req.body.message,
      timestamp: new Date(),
    });

    console.log('REACH-2');
    message.save(err => {
      console.log('REACH-3');
      if (err) return next(err);
    });
  }
  res.redirect('/');
});

router.get('/:id/delete', (req, res, next) => {
  Message.findByIdAndDelete(req.params.id, err => {
    if (err) return next(err);

    res.redirect('/');
  });
});

module.exports = router;
