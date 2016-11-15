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
DBConnection.connect(function (err) {
    if (err)
        throw err;
    // console.log("Connected to Database");
});
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
apiRouter.use(function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, app.get("secret-key"), function (err, decoded) {
            if (err) {
                res.json({
                    success: false,
                    message: "Failed to Authenticate Token"
                });
            } else {
                req.user = decoded;
                next();
            }
        });
    } else {
        res.status(403).send({
            success: false,
            message: "No Token Provided"
        });
    }
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
                if (count >= 2) {
                    res.json({
                        success: false,
                        message: "branch heads already registered"
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
                                var query = "select coordid1,coordid2 from branches where branchid='" + branch + "'";
                                DBConnection.query(query, function (err, result) {
                                    if (err)
                                        throw err;
                                    if (result[0].coordid1 == '') {
                                        var query = "update branches set coordid1='" + uid + "'" + " where branchid='" + branch + "'";
                                        DBConnection.query(query, function (err, result) {
                                            if (err)
                                                throw err;
                                            res.json({
                                                success: true,
                                                message: "registration successfull"
                                            });
                                        });
                                    }else if(result[0].coordid2 == ''){
                                        var query = "update branches set coordid2='" + uid + "'" + " where branchid='" + branch + "'";
                                        DBConnection.query(query, function (err, result) {
                                            if (err)
                                                throw err;
                                            res.json({
                                                success: true,
                                                message: "registration successfull"
                                            });
                                        });
                                    }
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
                    passHasher(password).verifyAgainst(fetchedPass, function (err, verified) {
                        if (err)
                            throw err;
                        console.log(verified);
                        if (verified) {
                            var userid = {
                                uid: result[0].uid
                            };
                            var token = jwt.sign(userid, app.get("secret-key"));
                            var data = {
                                success: true,
                                message: "access granted",
                                userData: {
                                    uid: result[0].uid,
                                    name: result[0].name,
                                    access: result[0].access,
                                    branchid: result[0].branchid,
                                    token: token
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
apiRouter.get("/user/:uid", function (req, res) {
    var uid = req.params.uid;
    if (uid == "") {
        res.json({
            success: false,
            message: "send uid"
        });
    } else {
        var query = "select * from users where uid='" + uid + "'";
        DBConnection.query(query, function (err, result) {
            if (err)
                throw err;
            if (result.length == 1) {
                res.json({
                    success: true,
                    message: {
                        uid: result[0].uid,
                        name: result[0].name,
                        access: result[0].access,
                        branchid: result[0].branchid,
                    }
                });
            } else {
                res.json({
                    success: false,
                    message: "no user"
                });
            }
        });
    }
});
apiRouter.delete("/user/:uid", function (req, res) {
    var uid = req.params.uid;
    var query = "select count(*) as count from users where uid='" + uid + "'";
    DBConnection.query(query, function (err, result) {
        if (err)
            throw err;
        var count = result[0].count;
        if (count == 0) {
            res.json({
                success: false,
                message: "user doesnt exist"
            });
        } else if (count == 1) {
            var query = "delete from users where uid='" + uid + "'";
            DBConnection.query(query, function (err, result) {
                if (err)
                    throw err;
                res.json({
                    success: true,
                    message: "removed"
                });
            });
        }
    });
});

apiRouter.post("/update", function (req, res) {
    var uid = req.body.uid;
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var query = "UPDATE `users` SET name='" + name + "',email='" + email + "',phone=" + phone + " WHERE uid='" + uid + "'";
    DBConnection.query(query, function (err, result) {
        if (err)
            throw err;
        res.json({
            success: true,
            message: "updated"
        });
    });

});
apiRouter.get("/branches", function (req, res) {
    var query = "select * from branches";
    DBConnection.query(query, function (err, result) {
        res.json({
            success: true,
            message: result
        });
    });
});
apiRouter.get("/branchheads", function (req, res) {
    var query = "select uid,name,email,phone,access,users.branchid,branchname from users join branches where (users.branchid != 'SU' or 'EM') and (users.branchid = branches.branchid)";
    DBConnection.query(query, function (err, result) {
        if (err)
            throw err;
        res.json({
            success: true,
            message: result
        });
    });
});
apiRouter.get("/branchdetails/:branchid", function (req, res) {
    var query = "select * from branches where branchid='" + req.params.branchid + "'";
    DBConnection.query(query, function (err, result) {
        if (err)
            throw err;
        console.log(result);
        res.json({
            success: true,
            message: result[0]
        });
    });
});
apiRouter.post("/branchdetails",function(req,res){
    var branchname = req.body.branchname;
    var branchdesc = req.body.branchdesc;
    var branchtprize = req.body.tprize;
    var branchid = req.body.branchid;
    var query = "update branches set branchname='"+branchname+"',branchdesc='"+branchdesc+"',totalprize='"+branchtprize+"' where branchid='"+branchid+"'"
    DBConnection.query(query,function(err,result){
        if(err)
            throw err;
        res.json({
            success: true
        });
    });
});