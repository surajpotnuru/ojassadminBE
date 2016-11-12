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

var Database = module.exports = DBConnection;