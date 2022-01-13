"use strict";
exports.__esModule = true;
exports.app = void 0;
var stockServer_1 = require("./stockServer");
var cors_1 = require("cors");
var app = new stockServer_1.StockServer().getApp();
exports.app = app;
app.use((0, cors_1["default"])());
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/test.html");
});
