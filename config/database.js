/**
 * Created by SURAJ on 11/10/2016.
 */
var mysql = require("mysql");
var DBConnection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "afxbsqijmysql",
    database: "ojass"
});
// var DBConnection = mysql.createConnection({
//     host: "117.211.91.60",
//     user: "root",
//     password: "~@b%31#M",
//     database: "ojass",
//     port: 3306
// });

var Database = module.exports = DBConnection;