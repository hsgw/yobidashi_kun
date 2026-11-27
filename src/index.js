// SPDX-License-Identifier: MIT
import { onRequestPost as callPost } from "../functions/api/call.js";
import { onRequestGet as configGet } from "../functions/api/config.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/call" && request.method === "POST") {
      return callPost({ request, env, ctx });
    }

    if (url.pathname === "/api/config" && request.method === "GET") {
      return configGet({ request, env, ctx });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
