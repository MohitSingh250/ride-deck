
const fs = require('fs');
const content = fs.readFileSync('c:/Projects/ride-deck-main/ride-deck/frontend/src/pages/RiderDashboard.jsx', 'utf8');
const lines = content.split('\n');
let divBalance = 0;

lines.forEach((line, i) => {
    // Count opening tags that are not self-closing
    // Simple regex: <div followed by space or > and NOT followed by /> on the same line if it's the only one
    // More accurate: count <div and subtract <div ... />
    const totalOpens = (line.match(/<div/g) || []).length;
    const selfCloses = (line.match(/<div[^>]*\/>/g) || []).length;
    const opens = totalOpens - selfCloses;
    const closes = (line.match(/<\/div/g) || []).length;
    
    const prevBalance = divBalance;
    divBalance += opens - closes;
    
    if (opens !== 0 || closes !== 0) {
        console.log(`Line ${i + 1}: ${line.trim().substring(0, 50)}... | Balance: ${prevBalance} -> ${divBalance}`);
    }
});
