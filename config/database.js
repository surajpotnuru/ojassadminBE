/**
 * Created by SURAJ on 11/10/2016.
 */
var mysql = require("mysql");
// var DBConnection = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "afxbsqijmysql",
//     database: "ojass"
// });
var DBConnection = mysql.createConnection({
    host: "http://mysql.hostinger.in",
    user: "u414274941_ojass",
    password: "ojass.mysql",
    database: "u414274941_ojass"
});

var Database = module.exports = DBConnection;