const fs = require('node:fs');
const code = fs.readFileSync(process.argv[2], 'utf8');
fetch('http://127.0.0.1:9138/run', { method: 'POST', body: JSON.stringify({ code }) }).then(async response => { console.log(await response.text()); if (!response.ok) process.exitCode = 1; }).catch(error => { console.error(error); process.exitCode = 1; });
