"use strict";
exports.__esModule = true;
exports.ArrayServer = void 0;
var express = require("express");
var cors = require("cors");
var http = require("http");
var request = require('request');
var options = { json: true };
var ArrayServer = /** @class */ (function () {
    function ArrayServer() {
        this.maxmin = {};
        this.createApp();
        this.listen();
        //this.createDummyData()
        this.getRealData();
    }
    ArrayServer.prototype.createDummyData = function () {
        var _this = this;
        ArrayServer.SYMBOLS.forEach(function (sym) {
            ArrayServer.dummyData[sym] = [];
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
                ArrayServer.dummyData[sym].push({
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
    ArrayServer.prototype.getRealData = function () {
        var timeframes = [
            { 'path': 'daily', "array": 'realData' },
            { 'path': '5min', "array": 'realData5' },
            { 'path': '15min', "array": 'realData15' },
            { 'path': '1hour', "array": 'realData60' },
        ];
        timeframes.forEach(function (tf) {
            console.log("arr | path: ", tf.array, tf.path);
            ArrayServer.SYMBOLS.forEach(function (sym) {
                ArrayServer[tf.array][sym] = [];
                var url = "https://jacobcthomas.com/docs/realData/".concat(tf.path, "/").concat(sym, ".json");
                //let rawData = require(url);
                request(url, options, function (error, res, body) {
                    if (error) {
                        return console.log(error);
                    }
                    ;
                    if (!error && res.statusCode == 200) {
                        body.values.forEach(function (element) {
                            console;
                            ArrayServer[tf.array][sym].push({
                                timestamp: element[0],
                                open: element[2],
                                high: element[4],
                                low: element[5],
                                close: element[3]
                            });
                        });
                    }
                    ;
                });
                // if(rawData) {
                //         rawData.values.forEach(element => {console
                //         ArrayServer[tf.array][sym].push({
                //             timestamp: element[0],
                //             open: element[2],
                //             high: element[4],
                //             low: element[5],
                //             close: element[3]
                //         })
                //     });
                //     } else {
                //         console.log('no data')
                //     }
            });
        });
    };
    ArrayServer.prototype.createApp = function () {
        this.app = express();
        this.app.use(cors());
        this.server = http.createServer(this.app);
        this.port = process.env.PORT || ArrayServer.PORT;
        this.io = require('socket.io')(this.server, { cors: { origins: '*' } });
    };
    ArrayServer.prototype.getHistoricalData = function (obj) {
        var _this = this;
        console.log("getHistoricalData: ", obj.timeframe);
        ArrayServer.timeframe = obj.timeframe;
        var output = {
            "response-type": "historical",
            data: []
        };
        this.tfArr = 'realData' + (ArrayServer.timeframe == -1 ? '' : ArrayServer.timeframe);
        obj.symbols.forEach(function (element) {
            if (!ArrayServer[_this.tfArr][element]) {
                output.data.push({
                    symbol: element,
                    data: []
                });
            }
            else {
                output.data.push({
                    symbol: element,
                    data: ArrayServer[_this.tfArr][element].filter(function (dp) { return new Date(dp.timestamp) >= new Date(obj.start); })
                });
            }
        });
        // console.log("first: ",output.data[0].data[0])
        // console.log("last: ",output.data[0].data[output.data[0].data.length-1])
        return output;
    };
    ArrayServer.prototype.getLiveData = function (sym) {
        var output = {
            "response-type": "live",
            "new-value": { symbol: sym, data: [] }
        };
        // console.log(ArrayServer[this.tfArr])
        if (!ArrayServer[this.tfArr][sym]) {
            //output['new-value'].data.push([])
        }
        else {
            console.log("sym: ", ArrayServer[this.tfArr]);
            var lastVals = ArrayServer[this.tfArr][sym][0];
            //console.log(ArrayServer[this.tfArr][sym][0], sym)
            var rand = (1 - (Math.random() * 2));
            //console.log("rand: ",rand)
            var newClose = lastVals.close + rand;
            var newValue = {
                timestamp: new Date().toISOString(),
                open: lastVals.close,
                high: newClose > lastVals.high ? newClose : lastVals.high,
                low: newClose < lastVals.low ? newClose : lastVals.low,
                close: newClose
            };
            output['new-value'].data.push(newValue);
            ArrayServer[this.tfArr][sym][ArrayServer[this.tfArr][sym].length - 1] = newValue;
            // console.log(newValue)
        }
        return output;
    };
    ArrayServer.prototype.listen = function () {
        var _this = this;
        this.server.listen(this.port, function () {
            console.log('Running server on port %s', _this.port);
        });
        this.io.on('connect', function (socket) {
            console.log("New Client Connected. Id: ".concat(socket.id));
            var lobby = '';
            /* List check */
            socket.on('list', function () { return socket.emit('list', {
                symbols: ArrayServer.SYMBOLS,
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
    ArrayServer.prototype.getApp = function () {
        return this.app;
    };
    ArrayServer.PORT = 8080; // Default local port
    ArrayServer.SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'JPM', 'BAC', 'NBR', 'GOOG', 'AXP', 'COF', 'WFC', 'MSFT', 'FB', 'AMZN', 'GS', 'MS'];
    ArrayServer.dummyData = {};
    ArrayServer.realData = {}; // -1
    ArrayServer.realData5 = {}; // 5
    ArrayServer.realData15 = {}; // timeframe = 15
    ArrayServer.realData60 = {}; // timeframe = 60
    return ArrayServer;
}());
exports.ArrayServer = ArrayServer;
