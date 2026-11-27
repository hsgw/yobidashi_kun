// SPDX-License-Identifier: MIT
import { onRequestPost as callPost } from "../functions/api/call.js";
import { onRequestGet as pollGet } from "../functions/api/poll.js";
import { onRequestGet as iconGet } from "../functions/api/icon.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/call" && request.method === "POST") {
      return callPost({ request, env, ctx });
    }

    if (url.pathname === "/api/poll" && request.method === "GET") {
      return pollGet({ request, env, ctx });
    }

    if (url.pathname === "/api/icon" && request.method === "GET") {
      return iconGet({ request, env, ctx });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
