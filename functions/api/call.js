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

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return jsonResponse(
      {
        error:
          "Server configuration error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set.",
      },
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

  const apiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  // 日本時間 (UTC+9) の次の正時を計算
  const jstNextHour = new Date(now + 9 * 60 * 60 * 1000 + 60 * 60 * 1000).getUTCHours();

  const payload = {
    chat_id: env.TELEGRAM_CHAT_ID,
    text: "🔔 会場から呼び出しがありました！\n返信ボタンを押すか、このままメッセージを送ってください。",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "すぐ向かいます", callback_data: "preset:now" },
          { text: "5分ぐらい", callback_data: "preset:5min" },
        ],
        [
          { text: "30分ぐらい", callback_data: "preset:30min" },
          { text: `${jstNextHour}:00頃`, callback_data: `preset:hour:${jstNextHour}` },
        ],
      ],
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      console.error("Telegram sendMessage error:", response.status, data);
      return jsonResponse(
        {
          error: "Failed to send notification.",
          telegramStatus: response.status,
          detail: data?.description || "Unknown Telegram API error",
        },
        500
      );
    }

    lastCallTime = Date.now();
    return jsonResponse({ ok: true, cooldownSeconds: COOLDOWN_MS / 1000 }, 200);
  } catch (err) {
    console.error("Telegram fetch failed:", err);
    return jsonResponse(
      {
        error: "Failed to reach Telegram API.",
        detail: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
}
