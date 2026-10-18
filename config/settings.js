const session = process.env.SESSION || '';
const mycode = process.env.CODE || "254";
const botname = process.env.BOTNAME || 'Apokolips';
const ownername = process.env.OWNER_NAME || 'Lakindu Sathsara';
const ownernumber = process.env.OWNER_NUMBER || '94776083337';
const herokuAppName = process.env.HEROKU_APP_NAME || '';

function getHerokuApiKey() {
    return process.env.HEROKU_API_KEY || '';
}

export { session, mycode, botname, ownername, ownernumber, herokuAppName, getHerokuApiKey };
