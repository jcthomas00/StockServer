"use strict";
exports.__esModule = true;
exports.app = void 0;
var arrayServer_1 = require("./arrayServer");
var cors = require("cors");
var app = new arrayServer_1.ArrayServer().getApp();
exports.app = app;
app.use(cors());
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/test.html");
});
