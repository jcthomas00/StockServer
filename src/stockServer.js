"use strict";
exports.__esModule = true;
exports.StockServer = void 0;
var express = require("express");
var cors = require("cors");
var http = require("http");
// import Chat from '../../socket-chat/src/app/Classes/Chat'
// import Message from '../../socket-chat/src/app/Classes/Message'
var StockServer = /** @class */ (function () {
    /* Map of Chat instances to their respective lobby names */
    // private chatRooms: Map<string, Chat> = new Map<string, Chat>() // All Game instances stored in a map
    function StockServer() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }
    StockServer.prototype.createApp = function () {
        this.app = express();
        this.app.use(cors());
    };
    StockServer.prototype.createServer = function () {
        this.server = http.createServer(this.app);
    };
    StockServer.prototype.config = function () {
        this.port = process.env.PORT || StockServer.PORT;
    };
    StockServer.prototype.sockets = function () {
        this.io = require('socket.io')(this.server, { cors: { origins: '*' } });
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
            socket.on('list', function () { return socket.emit('ping', {
                symbols: StockServer.SYMBOLS,
                'response-type': "list"
            }); });
            /* Check if lobby exist */
            // socket.on('checklobby', (lobby: string) => socket.emit('checklobby', this.chatRooms.has(lobby) ? true : false))
            /* Create lobby */
            socket.on('create', function () {
                var lobby = Math.random().toString(36).substring(2, 7); // Generates random lobby name
                /* If lobby doesn't exist and we haven't exceeded max chatRooms allowed, create a new lobby/game */
                // if (this.chatRooms.has(lobby) == false && this.chatRooms.size < ChatServer.MAX_ROOMS) {
                //     console.log(`New Lobby '${lobby}' created`)
                //     this.chatRooms.set(lobby, new Chat())
                //     socket.emit('create', lobby)
                // } else socket.emit('create')
            });
            socket.on('isTyping', function () {
                _this.io.to(lobby).emit('userTyping', socket.id);
            });
            socket.on('stoppedTyping', function () {
                _this.io.to(lobby).emit('userStoppedTyping', socket.id);
            });
        });
    };
    StockServer.prototype.getApp = function () {
        return this.app;
    };
    StockServer.PORT = 8080; // Default local port
    StockServer.SYMBOLS = ['ABC', 'XYZ', 'LMNO'];
    return StockServer;
}());
exports.StockServer = StockServer;
