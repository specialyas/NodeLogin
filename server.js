const express = require("express");
const app = express();
const { pool } = require("./dbConfig.js");
const bcryt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");

const initializePassport = require("./passportConfig.js");

initializePassport(passport);

const PORT = process.env.PORT || 4000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

// define middleware for managing sessions
app.use(
  session({
    secret: "secret",

    resave: false,

    saveUninitialized: false,
  })
);

// Set up flash middleware
app.use(flash());

app.use(passport.session());
app.use(passport.initialize());

// get routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated(false), (req, res) => {
  res.render("register");
});

app.get("/users/login", checkAuthenticated(false), (req, res) => {
  res.render("login");
});

app.get("/users/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err); // Pass the error to the next middleware (error handler)
    }
    req.flash("success_msg", "Logout Successful!!!");
    res.redirect("/users/login");
  });
});
app.get("/users/dashboard/", checkAuthenticated(true), (req, res) => {
  res.render("dashboard", { user: req.user.name });
});

// post routes
app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  console.log({
    name,
    email,
    password,
    password2,
  });

  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be atleast 6 characters" });
  }

  if (errors.length > 0) {
    res.render("register", { errors });
  } else {
    // Form validation has passed

    // create hashedPassword
    let hashedPassword = await bcryt.hash(password, 10);
    console.log(hashedPassword);

    // check if email exists in the db
    pool.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        }
        console.log(results.rows);

        // show error if email exists
        if (results.rows.length > 0) {
          errors.push({ message: "Email already exists" });
          res.render("register", { errors });
        } else {
          // or insert new user into the db
          pool.query(
            `INSERT INTO users (name, email, password)
                    VALUES ($1, $2, $3)
                    RETURNING id, password`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash(
                "success_msg",
                "Registration sucessfull... Please login"
              );
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })
);

function checkAuthenticated(shouldBeAuthenticated) {
  return function (req, res, next) {
    if (shouldBeAuthenticated) {
      // if the route requires authentication
      if (req.isAuthenticated()) {
        return next(); // proceed if authenticated
      }
      return res.redirect("/users/login"); // Redirect to login if not authenticated
    } else {
      // If the route should not be accessed by authenticated users
      if (req.isAuthenticated()) {
        return res.redirect("/users/dashboard"); // Redirect to dashboard if authenticated
      }
      return next(); // Proceed if not authenticated
    }
  };
}

/* function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
   return res.redirect("/users/dashboard");
  }
  next();
}
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
} */
app.listen(PORT, () => {
  console.log(`listening on PORT ${PORT}`);
});
