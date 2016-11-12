/**
 * Created by SURAJ on 11/10/2016.
 */
//Required Modules
var express = require("express");
var DBConnection = require("./config/Database");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var jwt = require("jsonwebtoken");
var uuid = require("uuid");
var passHasher = require("password-hash-and-salt");
var cors = require("cors");
var port = process.env.port || 3000;
//

var app = express();
var apiRouter = express.Router();

app.set("json spaces", 2);
app.set("secret-key", "5rtyghvhuo876i5u4yrfhhr465u7yukhgry56ygj");

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());
app.use("/api", apiRouter);
// DBConnection.connect(function (err) {
//     if (err)
//         throw err;
//     // console.log("Connected to Database");
// });
app.listen(port, function () {
    console.log("API Server Running at localhost:" + port);
});
app.get("/", function (req, res) {
    res.send("API's for Ojass Admin Portal available @localhost:3000/api");
});
//API ROUTING STARTS HERE
apiRouter.get("/", function (req, res) {
    res.send("API root");
});
apiRouter.post("/signup", function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var phone = req.body.phone;
    var accessLevel = req.body.accessLevel;
    var branch = req.body.branch;
    var uid = uuid.v1();
    passHasher(password).hash(function (err, hash) {
        if (err)
            throw err;
        password = hash;
        var data = {
            uid: uid,
            name: name,
            password: password,
            email: email,
            phone: phone,
            access: accessLevel,
            branchid: branch
        };
        var query = "select count(*) as count from users where branchid='" + branch + "'";
        // var query = "select * from branches";
        DBConnection.query(query, function (err, result) {
            if (err)
                throw err;
            var count = result[0].count;
            if (branch != 'SU' && branch != 'EM') {
                if (count != 0) {
                    res.json({
                        success: false,
                        message: "branch head already registered"
                    });
                } else {
                    var query = "select count(*) as count from users where email='" + email + "'";
                    DBConnection.query(query, function (err, result) {
                        var count = result[0].count;
                        if (err)
                            throw err;
                        if (count != 0) {
                            res.json({
                                success: false,
                                message: "branchhead with this email already exists"
                            });
                        } else {
                            var query = "insert into users set ?";
                            DBConnection.query(query, data, function (err, result) {
                                if (err)
                                    throw err;
                                res.json({
                                    success: true,
                                    message: "registration successfull"
                                });
                            });
                        }
                    });
                }
            } else {
                if (count > 3) {
                    res.json({
                        success: false,
                        message: "super users limit exceeded"
                    });
                } else {
                    var query = "select count(*) as count from users where email='" + email + "'";
                    DBConnection.query(query, function (err, result) {
                        var count = result[0].count;
                        if (err)
                            throw err;
                        if (count != 0) {
                            res.json({
                                success: false,
                                message: "superuser with this email already exists"
                            });
                        } else {
                            var query = "insert into users set ?";
                            DBConnection.query(query, data, function (err, result) {
                                if (err)
                                    throw err;
                                res.json({
                                    success: true,
                                    message: "registration successfull"
                                });
                            });
                        }
                    });
                }
            }
        });
    });

});
apiRouter.post("/signin", function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    if (email == "" || password == "") {
        res.json({
            success: false,
            message: "enter all details"
        });
    } else {
        var query = "select count(*) as count from users where email='" + email + "'";
        DBConnection.query(query, function (err, result) {
            if (err)
                throw err;
            var count = result[0].count;
            if (count == 0) {
                res.json({
                    success: false,
                    message: "user doesnt exist"
                });
            } else {
                var query = "select * from users where email='" + email + "'";
                DBConnection.query(query, function (err, result) {
                    if (err)
                        throw err;
                    var fetchedPass = result[0].password;
                    passHasher(password).verifyAgainst(fetchedPass,function (err,verified) {
                        if (err)
                            throw err;
                        console.log(verified);
                        if (verified) {
                            var data = {
                                success: true,
                                message: "access granted",
                                userData: {
                                    uid: result[0].uid,
                                    name: result[0].name,
                                    access: result[0].access,
                                    branchid: result[0].branchid
                                }
                            };
                            res.json(data);
                        } else {
                            res.json({
                                success: false,
                                message: "invalid credentials"
                            });
                        }
                    });
                });
            }
        });
    }

});