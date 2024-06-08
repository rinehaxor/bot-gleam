const axios = require('axios');
const moment = require('moment');
const fs = require('fs');

// URL endpoints
const authUrl = 'https://api.gleam.bot/auth';
const farmingUrl = 'https://api.gleam.bot/start-farming';
const claimUrl = 'https://api.gleam.bot/claim';

// Headers
const getHeaders = () => ({
   Accept: 'application/json, text/plain, */*',
   'Content-Type': 'application/json',
   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
   Origin: 'https://aquaprotocol.gleam.bot',
   Referer: 'https://aquaprotocol.gleam.bot/',
   'Sec-Ch-Ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24", "Microsoft Edge WebView2";v="125"',
   'Sec-Ch-Ua-Mobile': '?0',
   'Sec-Ch-Ua-Platform': '"Windows"',
   'Sec-Fetch-Dest': 'empty',
   'Sec-Fetch-Mode': 'cors',
   'Sec-Fetch-Site': 'same-site',
});

// Read accounts from a text file
const accounts = fs
   .readFileSync('accounts_gleam.txt', 'utf-8')
   .trim()
   .split('\n')
   .map((line) => {
      const [fromRefCode, initData, project, username] = line.split(',');
      return { fromRefCode, initData, project, username };
   });

// Function to login and get token
async function login(account) {
   const loginPayload = {
      fromRefCode: account.fromRefCode,
      initData: account.initData,
      project: account.project,
   };

   try {
      const response = await axios.post(authUrl, loginPayload, { headers: getHeaders() });

      if (response.data) {
         console.log(`[ ${moment().format('HH:mm:ss')} ] Login successful for ${account.username}`);
         return true;
      } else {
         console.error(`[ ${moment().format('HH:mm:ss')} ] Failed to login for ${account.username}.`);
         console.log(response.data);
         return false;
      }
   } catch (error) {
      console.error(`[ ${moment().format('HH:mm:ss')} ] Error logging in for ${account.username}:`, error.message);
      if (error.response) {
         console.error('Error response data:', error.response.data);
      }
      return false;
   }
}

// Function to start farming
async function startFarming(account) {
   const farmingPayload = {
      startedAt: Date.now(),
      initData: account.initData,
      project: account.project,
   };

   try {
      const headers = getHeaders();
      const response = await axios.post(farmingUrl, farmingPayload, { headers });

      if (response.data === null) {
         console.log(`[ ${moment().format('HH:mm:ss')} ] Farming started successfully for ${account.username}`);
      } else {
         console.error(`[ ${moment().format('HH:mm:ss')} ] Failed to start farming for ${account.username}.`);
         console.log(response.data);
      }
   } catch (error) {
      console.error(`\x1b[31m[ ${moment().format('HH:mm:ss')} ] Error starting farming for ${account.username}: ${error.message}\x1b[0m`);
      if (error.response) {
         console.error(`\x1b[31mError response data:\x1b[0m`, error.response.data);
      }
   }
}

// Function to claim points
async function claimPoints(account) {
   const claimPayload = {
      initData: account.initData,
      project: account.project,
   };

   try {
      const headers = getHeaders();
      const response = await axios.post(claimUrl, claimPayload, { headers });

      if (response.data) {
         console.log(`[ ${moment().format('HH:mm:ss')} ] Claim successful for ${account.username}: ${JSON.stringify(response.data)}`);
      } else {
         console.error(`[ ${moment().format('HH:mm:ss')} ] Failed to make claim for ${account.username}.`);
         console.log(response.data);
      }
   } catch (error) {
      console.error(`\x1b[31m[ ${moment().format('HH:mm:ss')} ] Error making claim for ${account.username}:\x1b[0m`);
      if (error.response) {
         console.error(`\x1b[31mError response data:\x1b[0m`, error.response.data.message);
      }
   }
}

// Function to schedule tasks
async function scheduleTasks(account) {
   const loginSuccessful = await login(account);
   if (loginSuccessful) {
      setInterval(async () => {
         await startFarming(account);
      }, 60000 * 15);

      // Claim points every 15 minutes
      setInterval(async () => {
         await claimPoints(account);
      }, 60000 * 15);
   } else {
      console.error(`[ ${moment().format('HH:mm:ss')} ] Initial login failed for ${account.username}, scheduling tasks aborted.`);
   }
}

// Initial login and start scheduling for each account
accounts.forEach((account) => {
   scheduleTasks(account);
});
