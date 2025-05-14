import { parseEmails } from '../scripts/parse-emails';

async function main() {
  try {
    await parseEmails();
    console.log('Successfully processed emails');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();