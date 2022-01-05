"use strict";
exports.__esModule = true;
exports.StockServer = void 0;
var express = require("express");
var cors = require("cors");
var http = require("http");
var StockServer = /** @class */ (function () {
    function StockServer() {
        this.createApp();
        this.listen();
        this.createDummyData();
    }
    StockServer.prototype.createDummyData = function () {
        StockServer.SYMBOLS.forEach(function (sym) {
            StockServer.dummyData[sym] = [];
            var time = Date.now(), max = 100, min = 10;
            var prevOpen = '', bool = true;
            var open = '';
            for (var i = 0; i < 100; i++) {
                open = (Math.random() * (max - min) + min).toFixed(2);
                StockServer.dummyData[sym].push({
                    timestamp: new Date(time - i * 86400000).toDateString(),
                    open: open,
                    high: (Math.random() * (max * 2 - max) + max).toFixed(2),
                    low: (Math.random() * (min - 1) + 1).toFixed(2),
                    close: bool ? (Math.random() * (max - min) + min).toFixed(2) : prevOpen
                });
                bool = false;
                prevOpen = open;
            }
        });
    };
    StockServer.prototype.createApp = function () {
        this.app = express();
        this.app.use(cors());
        this.server = http.createServer(this.app);
        this.port = process.env.PORT || StockServer.PORT;
        this.io = require('socket.io')(this.server, { cors: { origins: '*' } });
    };
    StockServer.prototype.getHistoricalData = function (obj) {
        var output = {
            "response-type": "historical",
            data: []
        };
        obj.symbols.forEach(function (element) {
            if (!StockServer.dummyData[element]) {
                output.data.push({
                    symbol: element,
                    data: []
                });
            }
            else {
                output.data.push({
                    symbol: element,
                    data: StockServer.dummyData[element].filter(function (dp) { return new Date(dp.timestamp) >= new Date(obj.start); })
                });
            }
        });
        return output;
    };
    StockServer.prototype.getLiveData = function (sym) {
        var max = 100, min = 10;
        var output = {
            "response-type": "live",
            "new-value": { symbol: sym, data: [] }
        };
        if (!StockServer.dummyData[sym]) {
            //output['new-value'].data.push([])
        }
        else {
            output['new-value'].data.push(StockServer.dummyData[sym][0]);
            StockServer.dummyData[sym].unshift({
                timestamp: new Date().toDateString(),
                open: StockServer.dummyData[sym][0].close,
                high: (Math.random() * (max * 2 - max) + max).toFixed(2),
                low: (Math.random() * (min - 1) + 1).toFixed(2),
                close: (Math.random() * (max - min) + min).toFixed(2)
            });
        }
        return output;
    };
    StockServer.prototype.listen = function () {
        var _this = this;
        this.server.listen(this.port, function () {
            console.log('Running server on port %s', _this.port);
        });
        this.io.on('connect', function (socket) {
            console.log("New Client Connected. Id: ".concat(socket.id));
            var lobby = '';
            /* List check */
            socket.on('list', function () { return socket.emit('list', {
                symbols: StockServer.SYMBOLS,
                'response-type': "list"
            }); });
            // Historical
            socket.on('historical', function (obj) { return socket.emit('historical', _this.getHistoricalData(obj)); });
            // Live
            socket.on('live', function (obj) {
                obj.symbols.forEach(function (sym) {
                    socket.emit('live', _this.getLiveData(sym));
                });
                setInterval(function () {
                    obj.symbols.forEach(function (sym) {
                        socket.emit('live', _this.getLiveData(sym));
                    });
                }, 5000);
            });
        });
    };
    StockServer.prototype.getApp = function () {
        return this.app;
    };
    StockServer.PORT = 8080; // Default local port
    StockServer.SYMBOLS = ['ABC', 'XYZ', 'LMNO', 'PQR', 'FACE', 'APPL'];
    StockServer.dummyData = {};
    return StockServer;
}());
exports.StockServer = StockServer;
