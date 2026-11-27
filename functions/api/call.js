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
  const { env } = context;

  if (!env.NTFY_CALL_TOPIC || !env.NTFY_REPLY_TOPIC) {
    return jsonResponse(
      { error: "Server configuration error: NTFY topics are not set." },
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

  const replyUrl = `https://ntfy.sh/${env.NTFY_REPLY_TOPIC}`;

  // Fetch API のヘッダーは非ASCII文字（日本語）を扱えないため、ntfy.sh の JSON 形式 API を使用
  const payload = {
    topic: env.NTFY_CALL_TOPIC,
    title: "呼び出しボタン",
    message: "会場から呼び出しがありました！",
    priority: 5, // urgent
    tags: ["bell"],
    actions: [
      {
        action: "http",
        label: "今向かいます",
        url: replyUrl,
        body: "今向かっています！少々お待ちください",
      },
      {
        action: "http",
        label: "あと5分",
        url: replyUrl,
        body: "5分ほどで戻ります！",
      },
    ],
  };

  try {
    const response = await fetch("https://ntfy.sh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("ntfy.sh error:", response.status, errorText);
      return jsonResponse({ error: "Failed to send notification." }, 500);
    }

    lastCallTime = Date.now();
    return jsonResponse({ ok: true, cooldownSeconds: COOLDOWN_MS / 1000 }, 200);
  } catch (err) {
    console.error("ntfy.sh fetch failed:", err);
    return jsonResponse({ error: "Failed to reach notification service." }, 500);
  }
}
