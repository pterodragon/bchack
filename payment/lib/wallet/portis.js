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
exports.PortisEthSigner = exports.PortisWallet = void 0;
var events_1 = require("events");
var ethers_1 = require("ethers");
var web3_1 = require("@portis/web3");
var PortisWallet = /** @class */ (function (_super) {
    __extends(PortisWallet, _super);
    function PortisWallet(dappAddress, network) {
        var _this = _super.call(this) || this;
        var portis = _this._portis = new web3_1["default"](dappAddress, network);
        _this._provider = new ethers_1.ethers.providers.Web3Provider(portis.provider);
        _this._csigner = _this._provider.getSigner();
        //@ts-ignore
        _this._signer = new PortisEthSigner(_this._csigner);
        portis.onLogin(function (walletAddress) {
            _this._address = walletAddress;
            _this.emit("login", walletAddress);
        });
        return _this;
    }
    PortisWallet.prototype.open = function () {
        this._portis.showPortis();
    };
    PortisWallet.prototype.getMessageSigner = function () {
        return this._signer;
    };
    PortisWallet.prototype.getConstractSigner = function () {
        return this._csigner;
    };
    PortisWallet.prototype.getProvider = function () {
        return this._provider;
    };
    PortisWallet.prototype.getAddress = function () {
        return this._address;
    };
    return PortisWallet;
}(events_1.EventEmitter));
exports.PortisWallet = PortisWallet;
var bytes_1 = require("@ethersproject/bytes");
var strings_1 = require("@ethersproject/strings");
var PortisEthSigner = /** @class */ (function () {
    function PortisEthSigner(signer) {
        this.signer = signer;
    }
    PortisEthSigner.prototype.signMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var data, address;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = ((typeof (message) === "string") ? strings_1.toUtf8Bytes(message) : message);
                        return [4 /*yield*/, this.signer.getAddress()];
                    case 1:
                        address = _a.sent();
                        return [4 /*yield*/, this.signer.provider.send("personal_sign", [bytes_1.hexlify(data), address.toLowerCase()])];
                    case 2: 
                    //The eth_personalSign method requires params ordered [message, address].
                    //@ts-ignore
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return PortisEthSigner;
}());
exports.PortisEthSigner = PortisEthSigner;
