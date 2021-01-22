"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.StateChannelsPayment = void 0;
var events_1 = require("events");
var ethers_1 = require("ethers");
var utils_1 = require("./utils");
var assert_1 = require("assert");
var statechannel_1 = require("./statechannel");
/**
 * only support two participants and single directional transfer for now
 */
var StateChannelsPayment = /** @class */ (function (_super) {
    __extends(StateChannelsPayment, _super);
    function StateChannelsPayment(_wallet, _chainId) {
        if (_chainId === void 0) { _chainId = process.env.CHAIN_NETWORK_ID; }
        var _this = _super.call(this) || this;
        _this._wallet = _wallet;
        _this._chainId = _chainId;
        _this._channels = new Map();
        return _this;
    }
    Object.defineProperty(StateChannelsPayment.prototype, "address", {
        get: function () {
            return this._wallet.getAddress();
        },
        enumerable: false,
        configurable: true
    });
    StateChannelsPayment.prototype.handshake = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (address) {
                    return [2 /*return*/, this.handshakeBack(address)];
                }
                return [2 /*return*/, {
                        from: this._wallet.getAddress(),
                        type: 'handshake'
                    }];
            });
        });
    };
    StateChannelsPayment.prototype.handshakeBack = function (dest) {
        return __awaiter(this, void 0, void 0, function () {
            var statechannel, signed, channelId;
            return __generator(this, function (_a) {
                statechannel = statechannel_1.StateChannel.createFromScratch(this._wallet, this._chainId, [dest, this._wallet.getAddress()]);
                this._channels.set(dest, statechannel);
                signed = statechannel.signed, channelId = statechannel.channelId;
                return [2 /*return*/, {
                        from: this._wallet.getAddress(),
                        type: 'handshake',
                        channelId: channelId,
                        signed: signed
                    }];
            });
        });
    };
    StateChannelsPayment.prototype.received = function (_a) {
        var _this = this;
        var from = _a.from, type = _a.type, signed = _a.signed, channelId = _a.channelId;
        switch (type) {
            case 'handshake': {
                if (channelId && signed) {
                    var statechannel = statechannel_1.StateChannel.createFromState(this._wallet, channelId, signed);
                    this._channels.set(from, statechannel);
                    return;
                }
                return this.emit("handshake", from);
            }
            case 'request': {
                var statechannel = this.getChannel(from);
                statechannel.update(signed);
                var address_1 = this._wallet.getAddress();
                var _b = extractLastAllocationItem(signed.state), allocationAddress = _b.address, amount = _b.amount;
                assert_1.strict(address_1 === allocationAddress);
                var response = function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _a = {
                                    from: address_1,
                                    type: 'transfer'
                                };
                                return [4 /*yield*/, utils_1.sign(this._wallet.getMessageSigner(), signed.state)];
                            case 1: return [2 /*return*/, (_a.signed = _b.sent(),
                                    _a)];
                        }
                    });
                }); };
                return this.emit("requested", from, amount, response);
            }
            case 'transfer': {
                var statechannel = this.getChannel(from);
                statechannel.update(signed);
                var amount = extractLastAllocationItem(signed.state).amount;
                return this.emit("received", from, amount);
            }
            case 'finalize': {
                var statechannel = this.getChannel(from);
                statechannel.conclude(signed);
            }
        }
    };
    StateChannelsPayment.prototype.request = function (address, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var statechannel;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        statechannel = this.getChannel(address);
                        _a = {
                            from: this.address,
                            type: 'request'
                        };
                        return [4 /*yield*/, statechannel.payout(address, amount)];
                    case 1: return [2 /*return*/, (_a.signed = _b.sent(),
                            _a)];
                }
            });
        });
    };
    StateChannelsPayment.prototype.finalize = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var statechannel, signed;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        statechannel = this.getChannel(address);
                        return [4 /*yield*/, statechannel.payout(this.address, statechannel.remain)];
                    case 1:
                        signed = _b.sent();
                        statechannel.update(signed);
                        _a = {
                            from: this.address,
                            type: 'request'
                        };
                        return [4 /*yield*/, statechannel.requestConclude()];
                    case 2: return [2 /*return*/, (_a.signed = _b.sent(),
                            _a)];
                }
            });
        });
    };
    StateChannelsPayment.prototype.deposit = function (address, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var statechannel, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        statechannel = this.getChannel(address);
                        return [4 /*yield*/, statechannel.deposit(amount)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        err_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    StateChannelsPayment.prototype.getChannel = function (address) {
        var channel = this._channels.get(address);
        if (!channel)
            throw new Error("channel of address " + address + " not found");
        return channel;
    };
    return StateChannelsPayment;
}(events_1.EventEmitter)); //end class StateChannelManager
exports.StateChannelsPayment = StateChannelsPayment;
function extractLastAllocationItem(state) {
    var outcome = state.outcome;
    var allocation = outcome[outcome.length - 1];
    var allocationItems = allocation.allocationItems;
    var address = allocation.assetHolderAddress;
    var amount = ethers_1.BigNumber.from(allocationItems[allocationItems.length - 1].amount);
    return { address: address, amount: amount };
}
