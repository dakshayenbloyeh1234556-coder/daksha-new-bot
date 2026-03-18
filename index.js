'use strict';

const mineflayer = require('mineflayer');
const config = require('./settings.json');

// Bot state
let bot = null;
let botState = { connected: false, startTime: Date.now() };
let lookAroundInterval = null;
let swingInterval = null;

// ========================
// CREATE BOT FUNCTION
// ========================
function createBot() {
  if (bot) {
    bot.removeAllListeners();
    bot.end();
    bot = null;
  }

  console.log(`[Bot] Connecting to ${config.server.ip}:${config.server.port}`);

  bot = mineflayer.createBot({
    username: config['bot-account'].username,
    password: config['bot-account'].password || undefined,
    auth: config['bot-account'].type,
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version || false
  });

  // show connected immediately on login
  bot.once('login', () => {
    botState.connected = true;
    console.log('[Bot] Logged in (waiting to spawn)...');
  });

  bot.once('spawn', () => {
    console.log('[Bot] Spawned successfully!');
    botState.connected = true;

    // =========================
    // Look around slowly
    // =========================
    if (config.movement.look-around && config.movement.look-around.enabled) {
      lookAroundInterval = setInterval(() => {
        const yaw = Math.random() * 2 * Math.PI;
        const pitch = Math.random() * Math.PI / 4 - Math.PI / 8;
        bot.look(yaw, pitch, true);
      }, config.movement.look-around.interval || 20000);
    }

    // =========================
    // Swing arm periodically
    // =========================
    if (config.actions.swing-arm && config.actions.swing-arm.enabled) {
      swingInterval = setInterval(() => {
        bot.swingArm();
      }, config.actions.swing-arm.interval || 15000);
    }
  });

  bot.on('end', (reason) => {
    console.log(`[Bot] Disconnected: ${reason || 'Unknown'}`);
    botState.connected = false;
    clearIntervals();
    scheduleReconnect();
  });

  bot.on('error', (err) => {
    console.log(`[Bot] Error: ${err.message}`);
  });

  bot.on('kicked', (reason) => {
    console.log(`[Bot] Kicked: ${reason}`);
  });
}

// ========================
// HELPERS
// ========================
function clearIntervals() {
  if (lookAroundInterval) clearInterval(lookAroundInterval);
  if (swingInterval) clearInterval(swingInterval);
  lookAroundInterval = null;
  swingInterval = null;
}

function scheduleReconnect() {
  const delay = config.utils['auto-reconnect-delay'] || 10000;
  console.log(`[Bot] Reconnecting in ${delay / 1000}s...`);
  setTimeout(createBot, delay);
}

// ========================
// START BOT
// ========================
createBot();

// ========================
// Console dashboard
// ========================
setInterval(() => {
  const uptime = Math.floor((Date.now() - botState.startTime) / 1000);
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = uptime % 60;
  console.log(`[Status] Connected: ${botState.connected} | Uptime: ${h}h ${m}m ${s}s`);
}, 15000);
