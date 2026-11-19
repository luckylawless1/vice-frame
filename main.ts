// VICE FRAME — entry program for the GTA 6 cover art bounty.
//
// Hands the app in: copies app/ and screenshots/ from this repository into
// the output directory (MAKEFUN_OUTPUT_DIR outside the grader, /output
// inside it), then writes dossier.json there with buildDossier from the
// kit's vendor library, exactly as the scorer rebuilds it.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
console.log(`VICE FRAME: app and screenshots copied, dossier.json written (${dossierBytes.length} bytes).`);
