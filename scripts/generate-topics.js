// SPDX-License-Identifier: MIT
const { randomUUID } = require("crypto");

const callTopic = randomUUID();
const replyTopic = randomUUID();

console.log("# Cloudflare Pages Secrets / .dev.vars 用トピック名");
console.log(`NTFY_CALL_TOPIC=${callTopic}`);
console.log(`NTFY_REPLY_TOPIC=${replyTopic}`);
