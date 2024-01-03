const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Token = require("../models/tokenModel");
const AppError = require("../utils/appError");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const createToken = id => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) check if email and password exist
    if (!email || !password) {
      return next(
        new AppError(404, "fail", "Please provide email or password"),
        req,
        res,
        next,
      );
    }

    // 2) check if user exist and password is correct
    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(
        new AppError(401, "fail", "Email or Password is wrong"),
        req,
        res,
        next,
      );
    }

    // 3) All correct, send jwt to client
    const token = createToken(user.id);

    // Remove the password from the output
    user.password = undefined;

    res.status(200).json({
      status: "success",
      data: {
        user,
        token
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const user = await User.create({
      firstname: req.body.firstname,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      roles: req.body.roles,
    });

    const token = createToken(user.id);

    user.password = undefined;

    res.status(201).json({
      status: "success",
      data: {
        user,
        token
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
          return next(
            new AppError(404, "fail", "Please provide email"),
            req,
            res,
            next,
          );
        }

        const user = await User.findOne({
          email,
        });

        if (!user || user.active == false) {
          return next(
            new AppError(401, "fail", "Email not exists."),
            req,
            res,
            next,
          );
        }

        let token = await Token.findOne({ userId: user._id });
        if (!token) {
            token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString("hex"),
            }).save();
        }

        const link = `${process.env.SITE_URL}/password-reset/${user._id}/${token.token}`;

        const sendemail = sendEmail(
          user.email,
          "Password Reset Request",
          {
            name: user.name,
            link: link,
          },
          "./emailTemplates/forgotPassword.handlebars"
        );

        if(sendemail){
          res.status(200).json({
            status: "success",
            data: null,
          });
        } else {
          return next(
            new AppError(404, "fail", sendemail),
            req,
            res,
            next,
          );
        }


    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { password, passwordConfirm, userId, token } = req.body;

        if (!password || !passwordConfirm || (password != passwordConfirm)) {
          return next(
            new AppError(404, "fail", "Please enter correct password and confirm password"),
            req,
            res,
            next,
          );
        }

        const user = await User.findById(userId);

        if (!user || user.active == false) {
          return next(
            new AppError(401, "fail", "Invalid link or expired"),
            req,
            res,
            next,
          );
        }

        const userToken = await Token.findOne({
            userId: userId,
            token: token,
        });

        if (!userToken) {
          return next(
            new AppError(401, "fail", "Invalid link or expired"),
            req,
            res,
            next,
          );
        }


        user.password = password;
        user.passwordConfirm = passwordConfirm;
        await user.save();
        await userToken.delete();
        
        res.status(200).json({
          status: "success",
          data: null,
        });

    } catch (error) {
        next(error);
    }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) check if the token is there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return next(
        new AppError(
          401,
          "fail",
          "You are not logged in! Please login in to continue",
        ),
        req,
        res,
        next,
      );
    }

    // 2) Verify token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) check if the user is exist (not deleted)
    const user = await User.findById(decode.id);
    if (!user) {
      return next(
        new AppError(401, "fail", "This user is no longer exist"),
        req,
        res,
        next,
      );
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Authorization check if the user have rights to do this action
exports.restrictTo = (roles) => {
  return (req, res, next) => {
    const found = roles.some(r => req.user.roles.includes(r));
    if (!found) {
      return next(
        new AppError(403, "fail", "You are not allowed to do this action"),
        req,
        res,
        next,
      );
    }
    next();
  };
};
