"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.PortisWallet = exports.MetamaskWallet = void 0;
var metamask_1 = require("./metamask");
__createBinding(exports, metamask_1, "MetamaskWallet");
var portis_1 = require("./portis");
__createBinding(exports, portis_1, "PortisWallet");
