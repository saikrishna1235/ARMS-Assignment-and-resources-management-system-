const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "charansai1234@",
    database: "node_lms"
});

db.connect((err) => {
    if (err) throw err;
    console.log("MySQL Connected");
});

module.exports = db;
