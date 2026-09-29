const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, 'wave8-whole-evidence');
const pairs = [
  ['comparison-world', 'Scene scale and inhabitants', '15-capital-desktop.png', 'ref-1948980-0.jpg', "Hero’s Adventure: Road to Passion", 'Capital before clinic completion'],
  ['comparison-conversation', 'Conversation staging', '18-casual-greeting.png', 'ref-1948980-4.jpg', "Hero’s Adventure: Road to Passion", 'Ordinary greeting with Dr Lin'],
  ['comparison-battle', 'Battle actors and information', '10-battle-ready.png', 'ref-2338140-0.jpg', 'Dokapon Kingdom: Connect', 'Random road encounter, first decision'],
  ['comparison-shop', 'Service identity and information', '36-market.png', 'ref-2338140-4.jpg', 'Dokapon Kingdom: Connect', 'Capital market before potion purchase'],
  ['comparison-next-world', 'World presence beyond the opening', '63-palace-desktop.png', 'ref-1948980-0.jpg', "Hero’s Adventure: Road to Passion", 'Palace reached by ordinary travel after first upgrade'],
];
for (const [file, title, game, ref, reference, caption] of pairs) {
  fs.writeFileSync(path.join(out, file + '.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>${title}</title><style>*{box-sizing:border-box}body{margin:0;background:#141b1a;color:#f4efe2;font:20px Arial,sans-serif}header{padding:22px 28px;border-bottom:1px solid #5b655d}h1{font-size:27px;margin:0 0 7px}header p{margin:0;color:#bcc5bf;font-size:16px}main{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px 28px}h2{font-size:21px;margin:0 0 10px}figure{margin:0}.frame{height:550px;display:flex;align-items:center;background:#080b0b;border:1px solid #46524b}img{display:block;width:100%;height:100%;object-fit:contain}figcaption{font-size:16px;color:#c8d0c9;line-height:1.45;margin-top:10px}footer{padding:0 28px 18px;font-size:15px;color:#c8d0c9}</style><header><h1>${title}</h1><p>Qualitative side-by-side review · Original framing retained; each image fitted without cropping or retouching.</p></header><main><figure><h2>Running browser game · 1440 × 900</h2><div class="frame"><img src="${game}"></div><figcaption>${caption}<br>Captured during one unedited new-game playthrough, 2026-09-29 local time.</figcaption></figure><figure><h2>${reference} · official Steam image</h2><div class="frame"><img src="../baseline/${ref}"></div><figcaption>Reference file: ${ref}<br>Different scene and game stage. Static reference image only; no live reference-game play was performed.</figcaption></figure></main><footer>This comparison is not scientifically blinded and does not establish equivalent gameplay, production scope, or performance.</footer></html>`);
}
console.log(pairs.map(pair=>pair[0]).join('\n'));
