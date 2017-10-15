var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "eff.006R",
  database: "sev0.1"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

