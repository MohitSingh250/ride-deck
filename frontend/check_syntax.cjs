
const fs = require('fs');
const content = fs.readFileSync('c:/Projects/ride-deck-main/ride-deck/frontend/src/pages/RiderDashboard.jsx', 'utf8');
const lines = content.split('\n');
let curlies = 0;
let parens = 0;

lines.forEach((line, i) => {
    let inString = false;
    let stringChar = '';
    let lCurlies = 0;
    let lParens = 0;

    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'" || char === "`") {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (stringChar === char) {
                inString = false;
            }
        }
        
        if (!inString) {
            if (char === '{') lCurlies++;
            if (char === '}') lCurlies--;
            if (char === '(') lParens++;
            if (char === ')') lParens--;
        }
    }
    
    curlies += lCurlies;
    parens += lParens;
    
    if (lCurlies !== 0 || lParens !== 0) {
        console.log(`Line ${i + 1}: c=${curlies}, p=${parens} | ${line.trim().substring(0, 40)}`);
    }
});
