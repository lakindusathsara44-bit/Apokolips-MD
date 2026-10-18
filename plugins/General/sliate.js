import {
  courseCodes, courseName, registerStudent, getStudent, unregisterStudent,
  listResources, recordAnswer, getProgress, isSliateAdmin, addResource,
  addQuestion, draftQuestionsFromSource, getPool, migrate
} from '../../lib/sliateStudyBot.js';

const help = `📚 *Apokolips SLIATE Study Bot*
.sliate register IT [semester]
.sliate register THM [semester]
.sliate register M [semester]
.sliate register A [semester]
.sliate register BA [semester]
.sliate status
.sliate resources
.sliate answer QUESTION_ID A
.sliate score
.sliate stop

Courses: IT=HNDIT, THM=HNDTHM, M=HNDM, A=HNDA, BA=HNDBA
Daily practice is sent only to registered students who opt in.`;

function senderNumber(m) {
  return String(m.sender || m.key?.participant || m.chat || '').split('@')[0].split(':')[0].replace(/\D/g,'');
}
function argsOf(text) { return String(text || '').trim().split(/\s+/).slice(1); }

export default {
  name: 'sliate',
  aliases: ['studybot','hnquiz'],
  description: 'Register for SLIATE daily study practice, answer quizzes, and view resources',
  run: async ({ client, m, args = [] }) => {
    const input = Array.isArray(args) ? args : [];
    const sub = String(input[0] || '').toLowerCase();
    const number = senderNumber(m);
    const reply = async text => client.sendMessage(m.chat, { text }, { quoted: m });
    try {
      if (!process.env.DATABASE_URL) return reply('⚠️ SLIATE bot is not configured yet: DATABASE_URL is missing. Ask the administrator to configure the service.');
      await migrate();
      if (!sub || sub === 'help') return reply(help);
      if (sub === 'register' || sub === 'join') {
        const course = String(input[1] || '').toUpperCase();
        if (!courseCodes().includes(course)) return reply('Choose a course code: IT, THM, M, A, or BA. Example: .sliate register IT 1');
        const student = await registerStudent(number, course, input[2] || null);
        return reply(`✅ Registered for ${courseName(student.course_code)} (${student.course_code}).\\nFive English practice questions are scheduled daily. Use .sliate stop to opt out.`);
      }
      if (sub === 'stop' || sub === 'unregister') {
        const removed = await unregisterStudent(number);
        return reply(removed ? 'You have opted out of SLIATE daily messages.' : 'No active registration was found.');
      }
      if (sub === 'status' || sub === 'me') {
        const s = await getStudent(number);
        return reply(s ? `Registration active\\nCourse: ${courseName(s.course_code)} (${s.course_code})\\nSemester: ${s.semester || 'not set'}` : 'Not registered. Send .sliate register IT (or THM, M, A, BA).');
      }
      if (sub === 'resources') {
        const s = await getStudent(number);
        if (!s) return reply('Register first: .sliate register IT');
        const resources = await listResources(s.course_code);
        return reply(resources.length ? resources.map(r=>`#${r.id} — *${r.module_name}*: ${r.title}\\n${r.source_url || '(stored resource; ask admin for access)'}`).join('\\n\\n') : 'No resources have been added for your course yet.');
      }
      if (sub === 'answer') {
        const result = await recordAnswer(number, input[1], input[2]);
        return reply(`${result.correct ? '✅ Correct!' : '❌ Not quite.'}\\nCorrect answer: *${result.correctOption}*\\nExplanation: ${result.explanation}`);
      }
      if (sub === 'score' || sub === 'progress') {
        const result = await getProgress(number);
        if (!result) return reply('Register first: .sliate register IT');
        return reply(`📊 *Your SLIATE progress*\\nCourse: ${result.student.course_code}\\nAnswered: ${result.answered}\\nCorrect: ${result.correct}\\nAccuracy: ${result.answered ? Math.round(result.correct/result.answered*100) : 0}%`);
      }
      if (sub === 'addresource') {
        if (!isSliateAdmin(number)) return reply('Admin only.');
        const [course,module,title,...urlParts] = input.slice(1);
        const sourceUrl = urlParts.join(' ');
        if (!course || !module || !title) return reply('Usage: .sliate addresource COURSE MODULE TITLE https://official-resource-url');
        const id = await addResource({courseCode:course,moduleName:module,title,sourceUrl,sourceType:'official_link',createdBy:number});
        return reply(`Resource #${id} saved.`);
      }
      if (sub === 'addquestion') {
        if (!isSliateAdmin(number)) return reply('Admin only.');
        return reply('For safety, add reviewed questions through the admin import script/documented API; direct WhatsApp question authoring is disabled.');
      }
      if (sub === 'stats') {
        if (!isSliateAdmin(number)) return reply('Admin only.');
        const r = await getPool().query('SELECT course_code,COUNT(*)::int AS students FROM sliate_students WHERE active=TRUE GROUP BY course_code ORDER BY course_code');
        return reply('📊 *SLIATE registrations*\\n' + (r.rows.map(x=>`${x.course_code}: ${x.students}`).join('\\n') || 'No registrations yet.'));
      }
      return reply(help);
    } catch (error) {
      return reply(`⚠️ ${String(error.message || 'Request failed').slice(0,700)}`);
    }
  }
};
