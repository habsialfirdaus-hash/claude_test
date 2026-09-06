import QR from 'qrcode';
import { writeFileSync } from 'node:fs';
const url = 'https://claude.ai/code/artifact/0852ffaa-e47d-4183-add8-db6ec1300d67';
await QR.toFile('qrcode-game/qrcode.png', url, { errorCorrectionLevel:'H', margin:4, width:1024, color:{ dark:'#141018', light:'#ffffff' } });
const svg = await QR.toString(url, { type:'svg', errorCorrectionLevel:'H', margin:4, color:{ dark:'#141018', light:'#ffffff' } });
writeFileSync('qrcode-game/qrcode.svg', svg);
console.log(await QR.toString(url, { type:'terminal', small:true, errorCorrectionLevel:'M' }));
