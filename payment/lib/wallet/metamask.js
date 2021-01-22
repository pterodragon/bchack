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
exports.__esModule = true;
exports.MetamaskWallet = void 0;
var events_1 = require("events");
var ethers_1 = require("ethers");
var MetamaskWallet = /** @class */ (function (_super) {
    __extends(MetamaskWallet, _super);
    function MetamaskWallet() {
        var _this = _super.call(this) || this;
        if (!window.ethereum) {
            throw new Error("metamask plugin is not installed");
        }
        window.ethereum.enable().then(function () {
            var provider = _this._provider = new ethers_1.ethers.providers.Web3Provider(window.ethereum);
            _this._signer = provider.getSigner();
            //@ts-ignore
            if (web3) {
                //@ts-ignore
                _this._address = web3.eth.accounts[0];
                _this.emit("login", _this._address);
            }
        });
        return _this;
    }
    MetamaskWallet.prototype.open = function () {
    };
    MetamaskWallet.prototype.getMessageSigner = function () {
        return this._signer;
    };
    MetamaskWallet.prototype.getConstractSigner = function () {
        return this._signer;
    };
    MetamaskWallet.prototype.getProvider = function () {
        return this._provider;
    };
    MetamaskWallet.prototype.getAddress = function () {
        return this._address;
    };
    return MetamaskWallet;
}(events_1.EventEmitter));
exports.MetamaskWallet = MetamaskWallet;
