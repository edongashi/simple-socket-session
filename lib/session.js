(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "console-stamp"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var consoleStamp = require("console-stamp");
    exports.consoleLogger = {
        log: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            console.log.apply(console, args);
        },
        info: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            console.info.apply(console, args);
        },
        error: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            console.error.apply(console, args);
        },
        warn: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            console.warn.apply(console, args);
        }
    };
    consoleStamp(exports.consoleLogger);
    function createSession(socket, logger) {
        var socketError = 'Connection has been closed.';
        function protocolError(actual, expected) {
            return "Message type mismatch, expected '" + expected + "', got '" + actual + "'.";
        }
        var closed = false;
        var buffer = [];
        var listeners = [];
        function close() {
            if (closed) {
                return;
            }
            logger.info('Closing socket...');
            closed = true;
            var error = new Error(socketError);
            for (var _i = 0, listeners_1 = listeners; _i < listeners_1.length; _i++) {
                var _a = listeners_1[_i], _ = _a[0], reject = _a[1];
                reject(error);
            }
            listeners.length = 0;
            buffer.length = 0;
            socket.disconnect(true);
        }
        socket.on('message', function (message, callback) {
            if (closed) {
                return;
            }
            logger.info("Received message", message);
            callback('message_received');
            if (listeners.length > 0) {
                var data = message.data, type = message.type;
                var _a = listeners.shift(), resolve = _a[0], reject = _a[1], expectedType = _a[2];
                if (type === expectedType) {
                    resolve(data);
                }
                else {
                    reject(new Error(protocolError(type, expectedType)));
                }
            }
            else {
                buffer.push(message);
            }
        });
        socket.on('disconnect', function (reason) {
            logger.info("Disconnected with reason '" + reason + "'.");
            if (reason !== 'ping timeout') {
                close();
            }
        });
        socket.on('reconnect_failed', function () {
            close();
        });
        function receive(expectedType) {
            if (expectedType === void 0) { expectedType = 'message'; }
            if (closed) {
                return Promise.reject(new Error(socketError));
            }
            if (buffer.length > 0) {
                var _a = buffer.shift(), data = _a.data, type = _a.type;
                if (type === expectedType) {
                    return Promise.resolve(data);
                }
                else {
                    return Promise.reject(new Error(protocolError(type, expectedType)));
                }
            }
            else {
                return new Promise(function (resolve, reject) {
                    listeners.push([resolve, reject, expectedType]);
                });
            }
        }
        function send(type, data) {
            if (closed) {
                return Promise.reject(new Error(socketError));
            }
            if (typeof data === 'undefined') {
                data = type;
                type = 'message';
            }
            return new Promise(function (resolve, reject) {
                var message = {
                    type: type,
                    data: data
                };
                logger.info("Sending message", message);
                socket.emit('message', message, function (data) {
                    if (data === 'message_received') {
                        logger.info('Message sent.');
                        resolve();
                    }
                    else {
                        logger.error('Message sending failed.');
                        reject(new Error('Invalid acknowledgment.'));
                    }
                });
            });
        }
        function session() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return send.apply(void 0, args);
        }
        session.send = send;
        session.receive = receive;
        return session;
    }
    exports.createSession = createSession;
});
