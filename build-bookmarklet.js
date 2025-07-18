const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

// Read the input file
const inputFile = path.join(__dirname, 'report-tools.js');
const outputFile = path.join(__dirname, 'report-tools-minify.js');
const code = fs.readFileSync(inputFile, 'utf8');

// Minify the code
const result = UglifyJS.minify(code);

if (result.error) {
    console.error('Error during minification:', result.error);
    process.exit(1);
}

// Create the bookmarklet
const bookmarklet = `javascript:${encodeURIComponent(result.code)}void+0`;

// Write to the output file
fs.writeFileSync(outputFile, bookmarklet);

console.log(`Report tools bookmarklet created successfully at ${outputFile}`);