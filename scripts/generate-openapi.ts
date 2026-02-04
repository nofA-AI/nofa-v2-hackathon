import fs from 'fs';
import path from 'path';
import { openApiSpec } from '../lib/swagger/spec';

const outputDir = path.join(process.cwd(), 'public');
const outputFile = path.join(outputDir, 'openapi.json');

// Ensure public directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write OpenAPI spec to file
fs.writeFileSync(
  outputFile,
  JSON.stringify(openApiSpec, null, 2),
  'utf-8'
);

console.log('✅ OpenAPI specification generated successfully!');
console.log(`📄 File saved to: ${outputFile}`);
console.log('\nYou can now:');
console.log('1. View the spec at: http://localhost:3002/openapi.json');
console.log('2. Import it into Postman, Insomnia, or other API tools');
console.log('3. Share it with your team');
