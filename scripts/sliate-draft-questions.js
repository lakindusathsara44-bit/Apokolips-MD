import fs from 'node:fs/promises';
import path from 'node:path';
import pdfParse from 'pdf-parse';
import { pathToFileURL } from 'node:url';
import { draftQuestionsFromSource, addQuestion, addResource, migrate } from '../lib/sliateStudyBot.js';

async function main() {
  const [courseCode, moduleName, filePath, ...labelParts] = process.argv.slice(2);
  if (!courseCode || !moduleName || !filePath) {
    console.error('Usage: node scripts/sliate-draft-questions.js COURSE MODULE FILE.pdf|.txt [source label]');
    process.exitCode = 2;
    return;
  }
  const absolute = path.resolve(filePath);
  const buffer = await fs.readFile(absolute);
  let sourceText;
  if (path.extname(absolute).toLowerCase() === '.pdf') {
    const parsed = await pdfParse(buffer);
    sourceText = parsed.text;
  } else {
    sourceText = buffer.toString('utf8');
  }
  if (sourceText.trim().length < 200) throw new Error('Could not extract enough readable text from source.');
  const sourceLabel = labelParts.join(' ') || path.basename(absolute);
  await migrate();
  const resourceId = await addResource({
    courseCode, moduleName, title: sourceLabel,
    sourceType: path.extname(absolute).toLowerCase() === '.pdf' ? 'uploaded_pdf' : 'notes',
    createdBy: process.env.SLIATE_ADMIN_NUMBERS?.split(',')[0] || '94776083337'
  });
  const drafts = await draftQuestionsFromSource({ courseCode, moduleName, sourceText, sourceLabel, count: 10 });
  const ids = [];
  for (const draft of drafts) {
    ids.push(await addQuestion({ ...draft, resourceId, reviewed: false }));
  }
  console.log(`Saved ${ids.length} unreviewed draft questions for ${courseCode}/${moduleName}.`);
  console.log(`Question IDs: ${ids.join(', ')}`);
  console.log('IMPORTANT: These are drafts. Review each answer, explanation, and source location before setting reviewed=true in the database.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
