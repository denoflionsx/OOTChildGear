import fse from 'fs-extra';

console.log("Binding Z64Lib...");
if (!fse.existsSync("./build/src/ChildGear/libs")) {
    fse.mkdirSync("./build/src/ChildGear/libs");
}
fse.copySync("./libs", "./build/src/ChildGear/libs", { dereference: true });
try {
    fse.unlinkSync("./build/src/ChildGear/libs/Z64Lib/icon.gif");
} catch (err) {
}
try {
    fse.unlinkSync("./build/src/ChildGear/libs/Z64Lib/icon.png");
} catch (err) {
}