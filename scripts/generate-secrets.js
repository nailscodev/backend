const crypto = require('crypto');

console.log('='.repeat(60));
console.log('🔐 GENERADOR DE VALORES SEGUROS PARA DEPLOYMENT');
console.log('='.repeat(60));
console.log('\n📋 Copia estos valores y guárdalos de forma segura:\n');

console.log('1️⃣ JWT_SECRET (32+ caracteres):');
console.log('   ' + crypto.randomBytes(32).toString('hex'));
console.log('');

console.log('2️⃣ ENCRYPTION_KEY (exactamente 32 caracteres):');
console.log('   ' + crypto.randomBytes(16).toString('hex'));
console.log('');

console.log('3️⃣ Alternativa JWT_SECRET (base64, más largo):');
console.log('   ' + crypto.randomBytes(48).toString('base64'));
console.log('');

console.log('='.repeat(60));
console.log('⚠️  IMPORTANTE:');
console.log('   - NUNCA compartas estos valores');
console.log('   - Úsalos en las variables de entorno de Render');
console.log('   - NO los commits en Git');
console.log('='.repeat(60));
