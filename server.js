const express = require('express');
const app = express();
const { pool } = require('./dbConfig.js');


const PORT = process.env.PORT || 4000;


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended : false}));


// get routes
app.get('/', (req, res) => {
    res.render("index");
})

app.get('/users/register', (req, res) => {
    res.render("register");
})

app.get('/users/login', (req, res) => {
    res.render("login");
})


app.get('/users/dashboard/', (req, res) => {
    res.render("dashboard", {user: "Yusuf"});
})


// post routes

app.post('/users/register', (req, res) => {
    let { name, email, password, password2} = req.body;

    console.log({
        name,
        email,
        password,
        password2
});

let errors = [];

if (!name || !email || !password || !password2){
    errors.push({ message: "Please enter all fields"});
}

if (password.length < 6) {
    errors.push({ message: "Password must be atleast 6 characters"});
}

if (errors.length > 0) {
    res.render("register", { errors });
}
    
})




app.listen(PORT, () => {
    console.log(`listening on PORT ${PORT}`);
    
})