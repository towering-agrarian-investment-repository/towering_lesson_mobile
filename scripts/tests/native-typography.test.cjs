const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../../src/design-system/utils/typography.ts"), "utf8");
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function loadTypography(platform = "ios") {
    const context = { exports: {}, process: { env: { EXPO_OS: platform } } };
    vm.runInNewContext(compiled, context);
    return context.exports.typography;
}

test("the shared type ramp stays integer, ordered and readable", () => {
    const typography = loadTypography();
    const expectedOrder = ["h1", "h2", "h3", "subtitle", "body", "label", "subtext", "caption", "badge"];

    assert.deepEqual(Object.keys(typography), expectedOrder, "the token set is deliberate");

    let previousFontSize = Infinity;
    for (const name of expectedOrder) {
        const token = typography[name];
        assert.ok(Number.isInteger(token.fontSize), `${name}.fontSize is an integer point size`);
        assert.ok(Number.isInteger(token.lineHeight), `${name}.lineHeight is an integer point size`);
        assert.ok(token.fontSize >= 12, `${name}.fontSize respects the 12pt floor`);
        assert.ok(token.lineHeight >= token.fontSize, `${name}.lineHeight leaves room for descenders`);
        assert.ok(
            ["400", "600", "700"].includes(token.fontWeight),
            `${name}.fontWeight stays in the supported weights`,
        );
        assert.ok(token.fontSize <= previousFontSize, `${name} does not outgrow the token above it`);
        previousFontSize = token.fontSize;
    }
});

test("migrated screens and forms keep font sizes in the shared type ramp", () => {
    const violations = [];
    function scan(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                scan(file);
            } else if (file.endsWith(".tsx")) {
                const sf = ts.createSourceFile(
                    file,
                    fs.readFileSync(file, "utf8"),
                    ts.ScriptTarget.Latest,
                    true,
                    ts.ScriptKind.TSX,
                );
                function visit(node) {
                    if (ts.isPropertyAssignment(node) && node.name.getText(sf) === "fontSize") {
                        const value = ts.isBinaryExpression(node.initializer)
                            ? node.initializer.left
                            : node.initializer;
                        // Native tab labels intentionally use platform pixel sizes.
                        const fixedLabel = /\(tabs\)[\\/]_layout\.tsx$/.test(file);
                        if (ts.isNumericLiteral(value) && !fixedLabel) {
                            violations.push(
                                `${path.relative(process.cwd(), file)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`,
                            );
                        }
                    }
                    ts.forEachChild(node, visit);
                }
                visit(sf);
            }
        }
    }
    scan(path.join(__dirname, "../../src"));
    assert.deepEqual(violations, [], "Font sizes must come from the shared type ramp");
});
