"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
        var _this = this;
        var timeframes = [
            //{'path': 'daily', "array": 'realData'}, 
            { 'path': '5/minute', "array": 'realData5' },
            // {'path': '15/minute', "array": 'realData15'}, 
            //{'path': '1/hour', "array": 'realData60'}, 
        ];
        timeframes.forEach(function (tf) {
            StockServer.SYMBOLS.forEach(function (sym) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            StockServer[tf.array][sym] = [];
                            //fetch(`https://nabors-stock-database.herokuapp.com/${sym.toLowerCase()}/${tf.path}`)
                            console.log("https://nabors-stock-database.herokuapp.com/".concat(sym.toLowerCase(), "/").concat(tf.path));
                            return [4 /*yield*/, request.get("https://nabors-stock-database.herokuapp.com/".concat(sym.toLowerCase(), "/").concat(tf.path), function (error, resp, body) {
                                    //console.log(resp.body)
                                    if (body) {
                                        var data = JSON.parse(resp.body);
                                        data.forEach(function (element) {
                                            StockServer[tf.array][sym].push({
                                                timestamp: element.date,
                                                open: element.open,
                                                high: element.high,
                                                low: element.low,
                                                close: element.close
                                            });
                                        });
                                    }
                                    else {
                                        console.log('no data', error);
                                    }
                                    //console.log(tf.array, StockServer[tf.array])
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
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
                timestamp: new Date('2022-01-14T09:30:00.000Z').toISOString(),
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
    StockServer.SYMBOLS = ['AAPL'];
    StockServer.dummyData = {};
    StockServer.realData = {}; // -1
    StockServer.realData5 = {}; // 5
    StockServer.realData15 = {}; // timeframe = 15
    StockServer.realData60 = {}; // timeframe = 60
    return StockServer;
}());
exports.StockServer = StockServer;
