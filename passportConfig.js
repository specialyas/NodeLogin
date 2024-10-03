const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dbConfig.js");
const bcrypt = require("bcrypt");

function initialize(passport) {
  const authenticateUser = (email, password, done) => {
    //    check if the email exists in the db
    pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
            return done(err);
        }

        //  log any result found
        console.log(results.rows);

        // if the user exists, store the user info
        if (results.rows.length > 0) {
          const user = results.rows[0];

          // compare the user password to the one in the db
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return done(err);
            }

            // if the passwords match return user or an error
            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, { message: "password is not correct" });
            }
          });
        } else {
          return done(null, false, { message: "Email is not registered" });
        }
      }
    );
  };
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      authenticateUser
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    pool.query(`SELECT * FROM users WHERE id = $1`, [id], (err, results) => {
      if (err) {
        return done(err);
      }
      return done(null, results.rows[0]);
    });
  });
}

module.exports = initialize;
