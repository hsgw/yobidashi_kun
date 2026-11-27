// SPDX-License-Identifier: MIT
// インメモリ連打防止用の最終送信時刻（ms）
let lastCallTime = 0;

const COOLDOWN_MS = 30_000;

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DISCORD_WEBHOOK_URL) {
    return jsonResponse(
      { error: "Server configuration error: DISCORD_WEBHOOK_URL is not set." },
      500
    );
  }

  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (lastCallTime > 0 && elapsed < COOLDOWN_MS) {
    const retryAfter = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    return jsonResponse(
      {
        error: "Too Many Requests",
        retryAfter,
      },
      429,
      { "Retry-After": String(retryAfter) }
    );
  }

  const origin = new URL(request.url).origin;
  const replyPageUrl = `${origin}/reply.html`;

  const payload = {
    username: "呼び出しボタン",
    content: "@here 🔔 **会場から呼び出しがありました！**",
    allowed_mentions: {
      parse: ["everyone"],
    },
    embeds: [
      {
        title: "ブースへ返信する",
        description: `[返信ページを開く](${replyPageUrl})`,
        color: 0xdc2626,
        timestamp: new Date(now).toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Discord Webhook error:", response.status, errorText);
      return jsonResponse(
        {
          error: "Failed to send notification.",
          discordStatus: response.status,
          detail: errorText.slice(0, 200),
        },
        500
      );
    }

    lastCallTime = Date.now();
    return jsonResponse({ ok: true, cooldownSeconds: COOLDOWN_MS / 1000 }, 200);
  } catch (err) {
    console.error("Discord Webhook fetch failed:", err);
    return jsonResponse(
      {
        error: "Failed to reach notification service.",
        detail: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
}
