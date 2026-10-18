# SLIATE Study Bot — Deployment Checklist

## Important status
This extension uses the existing Baileys WhatsApp connection. It is **not** the official WhatsApp Cloud API integration. Do not describe it as Cloud API. Baileys is an unofficial WhatsApp Web integration and may be affected by WhatsApp changes or account restrictions. For production or institutional use, prefer the official WhatsApp Business Platform and implement its webhook/template requirements.

## Required environment
Set these values in the deployment host's secret/environment settings (not Git):
- `SLIATE_BOT_ENABLED=true` only after review and testing
- `DATABASE_URL` PostgreSQL connection string
- `OPENAI_API_KEY` only if AI question drafting is enabled
- `OPENAI_MODEL` (defaults to `gpt-4.1-mini`)
- `SLIATE_ADMIN_NUMBERS=94776083337` (comma-separated international digits)
- `SLIATE_TIMEZONE=Asia/Colombo`
- `SLIATE_DAILY_QUESTIONS=5`
- `SLIATE_COURSE_INTERVAL_MINUTES=288`
- `SLIATE_FIRST_BATCH_TIME=08:00`
- `SLIATE_RESOURCE_DIR=./storage/sliate`

## Commands
- `.sliate register IT [semester]` (or THM, M, A, BA)
- `.sliate status`
- `.sliate resources`
- `.sliate answer QUESTION_ID A`
- `.sliate score`
- `.sliate stop`
- Admin: `.sliate addresource COURSE MODULE TITLE https://... `
- Admin: `.sliate stats`

Students must explicitly register/opt in. Use `.sliate stop` to opt out. Send only to opted-in students, rate-limit messages, and comply with applicable messaging rules. Do not import contact lists or message people who have not opted in.

## Course timing
The scheduler checks every 15 seconds and runs when the local time matches one of five course batch times. With first batch 08:00 and 288-minute spacing, batch starts are 08:00, 12:48, 17:36, 22:24, and 03:12 Asia/Colombo. Configure the desired first batch time before enabling. The worker needs a continuously running host; serverless/short-lived hosting is not suitable.

## Questions and content review
Only questions marked `reviewed=true` are sent. Populate question bank from current official SLIATE module materials or administrator-provided notes and keep source references. AI-generated questions are drafts only and must be reviewed before publication. Do not claim practice questions are actual past-paper or official exam questions unless verified.

## Database
The migration SQL is in `docs/SLIATE-BOT-SCHEMA.sql`. The bot's `.sliate` command currently runs the migration on first use; for controlled production rollout, run it from a trusted deployment environment first. Back up PostgreSQL and restrict database credentials.

## PDF / notes ingestion
Do not upload PDFs to public folders. On the trusted deployment host, run:

```bash
node scripts/sliate-draft-questions.js IT "Programming Fundamentals" ./private-notes.pdf "SLIATE module notes 2026"
```

The script copies the source into the configured private resource directory, extracts PDF/text content, asks the OpenAI Responses API to draft questions, and stores the questions as `reviewed=false`. Review the answer key, explanations, and source locations before approving them. To approve only questions you have manually verified, use a restricted database session, for example:

```sql
UPDATE sliate_questions SET reviewed = TRUE WHERE id IN (123, 124);
```

Replace the example course/module/file with real material. The script runs on the host and is not a public WhatsApp PDF-upload command.

## Verification still required before live launch
1. Install dependencies and run syntax checks/tests.
2. Apply the schema and test registration/opt-out, answers, progress, and resource access.
3. Confirm the bot's plugin loader recognizes `plugins/General/sliate.js`.
4. Test scheduled delivery with a dedicated opt-in test number and enough reviewed questions per course.
5. Verify WhatsApp account policy and rate limits.
6. Set `SLIATE_BOT_ENABLED=true` only after successful tests.
