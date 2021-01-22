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
exports.lookupConclusion = exports.conclude = exports.transfer = exports.deposit = exports.NITRO_ADJUDICATOR_ADDRESS = exports.ETH_ASSET_HOLDER_ADDRESS = void 0;
var utils_1 = require("./utils");
var nitro_protocol_1 = require("@statechannels/nitro-protocol");
/**
 * helper functions and contants on using nitro protocol
 */
exports.ETH_ASSET_HOLDER_ADDRESS = process.env.ETH_ASSET_HOLDER_ADDRESS || '';
exports.NITRO_ADJUDICATOR_ADDRESS = process.env.NITRO_ADJUDICATOR_ADDRESS || '';
function deposit(ethAssetHolder, channelId, expectedHeld, value) {
    return __awaiter(this, void 0, void 0, function () {
        var tx, events, depositedEvent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tx = ethAssetHolder.deposit(channelId, expectedHeld, value, { value: value });
                    return [4 /*yield*/, tx];
                case 1: return [4 /*yield*/, (_a.sent()).wait()];
                case 2:
                    events = (_a.sent()).events;
                    depositedEvent = nitro_protocol_1.getDepositedEvent(events);
                    console.log({ depositedEvent: depositedEvent });
                    return [2 /*return*/, depositedEvent];
            }
        });
    });
}
exports.deposit = deposit;
//transfer value to other party
function transfer(signer, state, address, value) {
    return __awaiter(this, void 0, void 0, function () {
        var amount, destination, signature;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    amount = value.toHexString();
                    destination = nitro_protocol_1.convertAddressToBytes32(address);
                    state.outcome.push({
                        assetHolderAddress: exports.ETH_ASSET_HOLDER_ADDRESS,
                        allocationItems: [{ destination: destination, amount: amount },]
                    });
                    return [4 /*yield*/, utils_1.sign(signer, state)];
                case 1:
                    signature = _a.sent();
                    return [2 /*return*/, { state: state, signature: signature }];
            }
        });
    });
}
exports.transfer = transfer;
function conclude(state, signatures) {
    return __awaiter(this, void 0, void 0, function () {
        var fixedPart, appPartHash, outcomeBytes, numStates, whoSignedWhat, tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fixedPart = nitro_protocol_1.getFixedPart(state);
                    appPartHash = nitro_protocol_1.hashAppPart(state);
                    outcomeBytes = nitro_protocol_1.encodeOutcome(state.outcome);
                    numStates = 1;
                    whoSignedWhat = new Array(signatures.length).fill(0);
                    tx = this.nitroAdjudicator.concludePushOutcomeAndTransferAll(state.turnNum, fixedPart, appPartHash, outcomeBytes, numStates, whoSignedWhat, signatures);
                    return [4 /*yield*/, tx];
                case 1: return [4 /*yield*/, (_a.sent()).wait()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.conclude = conclude;
function lookupConclusion(result, contracts) {
    var logs = result.logs;
    //const events = compileEventsFromLogs(logs, [ this.ethAssetHolder, this.nitroAdjudicator, ]);
    var events = utils_1.compileEventsFromLogs(logs, contracts);
    //console.log({events: JSON.stringify(events, null, 2)});
    return events;
}
exports.lookupConclusion = lookupConclusion;
