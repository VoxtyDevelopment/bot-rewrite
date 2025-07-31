const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const DIST_DIR = 'dist';
const OUTPUT_DIR = 'bot-obfuscated';
const SQL_SOURCE = path.join('src', 'sql');
const PACKAGE_JSON_SOURCE = 'package.json';
const CONFIG_JS_SOURCE = path.join(DIST_DIR, 'config.js');

fs.removeSync(DIST_DIR);
fs.removeSync(OUTPUT_DIR);

console.log('Compiling TypeScript...');
execSync('npx tsc', { stdio: 'inherit' });

console.log('Obfuscating JavaScript...');
execSync(`javascript-obfuscator ${DIST_DIR} --output ${OUTPUT_DIR} \
--compact true \
--control-flow-flattening true \
--control-flow-flattening-threshold 1 \
--dead-code-injection true \
--dead-code-injection-threshold 1 \
--debug-protection false \
--disable-console-output false \
--identifier-names-generator mangled \
--rename-globals true \
--self-defending true \
--string-array true \
--string-array-encoding base64 \
--string-array-index-shift true \
--string-array-threshold 1 \
--transform-object-keys true \
--unicode-escape-sequence true`, { stdio: 'inherit' });

console.log('Copying package.json...');
fs.copySync(PACKAGE_JSON_SOURCE, path.join(OUTPUT_DIR, 'package.json'));

console.log('Copying sql folder...');
fs.copySync(SQL_SOURCE, path.join(OUTPUT_DIR, 'sql'));

if (fs.existsSync(CONFIG_JS_SOURCE)) {
    console.log('Copying config.js...');
    fs.copySync(CONFIG_JS_SOURCE, path.join(OUTPUT_DIR, 'config.js'));
} else {
    console.warn('⚠️ config.js not found in dist/. Skipping copy.');
}

console.log('Build complete.');