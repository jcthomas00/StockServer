"use strict";
exports.__esModule = true;
exports.StockServer = void 0;
var express = require("express");
var cors = require("cors");
var http = require("http");
var request = require("request");
var StockServer = /** @class */ (function () {
    function StockServer() {
        this.maxmin = {};
        this.createApp();
        this.listen();
        this.createDummyData();
        this.getRealData();
    }
    StockServer.prototype.createDummyData = function () {
        var _this = this;
        StockServer.SYMBOLS.forEach(function (sym) {
            StockServer.dummyData[sym] = [];
            var max = Math.random() * (500 - 100) + 100;
            var min = max - 50;
            _this.maxmin[sym] = { max: max, min: min };
            var time = Date.now();
            var prevOpen = '', bool = true;
            var open = '';
            for (var i = 0; i < 100; i++) {
                var arr = [Math.random() * (max - min) + min, Math.random() * (max - min) + min, Math.random() * (max - min) + min];
                arr.sort();
                arr.reverse();
                open = arr[1].toFixed(2);
                StockServer.dummyData[sym].push({
                    timestamp: new Date(time - i * 86400000).toString(),
                    open: open,
                    high: arr[0].toFixed(2) > prevOpen ? arr[0].toFixed(2) : prevOpen,
                    low: arr[2].toFixed(2) < prevOpen || bool ? arr[2].toFixed(2) : prevOpen,
                    close: bool ? (Math.random() * (max - min) + min).toFixed(2) : prevOpen
                });
                bool = false;
                prevOpen = open;
            }
        });
    };
    StockServer.prototype.getRealData = function () {
        var timeframes = [
            { 'path': '1/day', "array": 'realData' },
            { 'path': '5/minute', "array": 'realData5' },
            { 'path': '15/minute', "array": 'realData15' },
            { 'path': '1/hour', "array": 'realData60' },
        ];
        timeframes.forEach(function (tf) {
            StockServer.SYMBOLS.forEach(function (sym) {
                StockServer[tf.array][sym] = [];
                request.get("https://nabors-stock-database.herokuapp.com/".concat(sym.toLowerCase(), "/").concat(tf.path), function (error, resp, body) {
                    var data = JSON.parse(body);
                    data.forEach(function (element) {
                        StockServer[tf.array][sym].push({
                            timestamp: element.date,
                            open: element.open,
                            high: element.high,
                            low: element.low,
                            close: element.close
                        });
                    });
                    //console.log(tf.array, StockServer[tf.array])
                });
            });
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
        var _this = this;
        console.log(obj);
        StockServer.timeframe = obj.timeframe;
        var output = {
            "response-type": "historical",
            data: []
        };
        this.tfArr = 'realData' + (StockServer.timeframe === -1 ? '' : StockServer.timeframe);
        obj.symbols.forEach(function (element) {
            if (!StockServer[_this.tfArr][element]) {
                output.data.push({
                    symbol: element,
                    data: []
                });
            }
            else {
                output.data.push({
                    symbol: element,
                    data: StockServer[_this.tfArr][element].filter(function (dp) { return new Date(dp.timestamp) >= new Date(obj.start); })
                });
            }
        });
        console.log("first: ", output.data[0].data[0]);
        console.log("last: ", output.data[0].data[output.data[0].data.length - 1]);
        return output;
    };
    StockServer.prototype.getLiveData = function (sym) {
        var output = {
            "response-type": "live",
            "new-value": { symbol: sym, data: [] }
        };
        if (!StockServer[this.tfArr][sym]) {
            //output['new-value'].data.push([])
        }
        else {
            var lastVals = StockServer[this.tfArr][sym][StockServer[this.tfArr][sym].length - 1];
            console.log(lastVals, sym);
            var rand = (1 - (Math.random() * 2)) / 50;
            console.log("rand: ", rand);
            var newClose = lastVals.close + (rand);
            var newValue = {
                timestamp: new Date('2022-01-13T09:30:00.000Z').toISOString(),
                open: lastVals.close,
                high: newClose > lastVals.high ? newClose : lastVals.high,
                low: newClose < lastVals.low ? newClose : lastVals.low,
                close: newClose
            };
            output['new-value'].data.push(newValue);
            StockServer[this.tfArr][sym][StockServer[this.tfArr][sym].length - 1] = newValue;
            console.log(newValue);
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
    StockServer.SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'JPM', 'BAC'];
    StockServer.dummyData = {};
    StockServer.realData = {}; // -1
    StockServer.realData5 = {}; // 5
    StockServer.realData15 = {}; // timeframe = 15
    StockServer.realData60 = {}; // timeframe = 60
    return StockServer;
}());
exports.StockServer = StockServer;
