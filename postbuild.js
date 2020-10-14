"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fs_extra_1 = __importDefault(require("fs-extra"));
console.log("Binding Z64Lib...");
if (!fs_extra_1["default"].existsSync("./build/src/ChildGear/libs")) {
    fs_extra_1["default"].mkdirSync("./build/src/ChildGear/libs");
}
fs_extra_1["default"].copySync("./libs", "./build/src/ChildGear/libs", { dereference: true });
try {
    fs_extra_1["default"].unlinkSync("./build/src/ChildGear/libs/Z64Lib/icon.gif");
}
catch (err) {
}
try {
    fs_extra_1["default"].unlinkSync("./build/src/ChildGear/libs/Z64Lib/icon.png");
}
catch (err) {
}
