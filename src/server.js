"use strict";
exports.__esModule = true;
exports.app = void 0;
var stockServer_1 = require("./stockServer");
var cors = require("cors");
var app = new stockServer_1.StockServer().getApp();
exports.app = app;
app.use(cors());
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/test.html");
});
