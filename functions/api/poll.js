// SPDX-License-Identifier: MIT
const PRESET_REPLIES = {
  "preset:now": "すぐ向かいます！",
  "preset:5min": "5分ぐらいで戻ります！",
  "preset:10min": "10分ぐらいで戻ります！",
  "preset:30min": "30分ぐらいで戻ります！",
};

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function answerCallback(botToken, callbackQueryId, text) {
  try {
    await fetch(
      `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
        }),
      }
    );
  } catch (err) {
    console.warn("answerCallbackQuery failed:", err);
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return jsonResponse(
      { error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured." },
      500
    );
  }

  const url = new URL(request.url);
  const offsetParam = url.searchParams.get("offset");
  const isInit = url.searchParams.get("init") === "1";

  const telegramUrl = new URL(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates`
  );
  telegramUrl.searchParams.set("timeout", "0");
  telegramUrl.searchParams.set(
    "allowed_updates",
    JSON.stringify(["message", "callback_query"])
  );
  if (offsetParam && /^\d+$/.test(offsetParam)) {
    telegramUrl.searchParams.set("offset", offsetParam);
  }

  try {
    const res = await fetch(telegramUrl.toString());
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      return jsonResponse(
        {
          error: "Failed to poll Telegram updates.",
          detail: data?.description || `HTTP ${res.status}`,
        },
        500
      );
    }

    const updates = Array.isArray(data.result) ? data.result : [];
    let nextOffset = offsetParam ? Number(offsetParam) : 0;
    const messages = [];
    const expectedChatId = String(env.TELEGRAM_CHAT_ID);

    for (const update of updates) {
      if (typeof update.update_id === "number" && update.update_id >= nextOffset) {
        nextOffset = update.update_id + 1;
      }

      if (isInit) continue;

      if (update.callback_query) {
        const cq = update.callback_query;
        const chatId = String(cq.message?.chat?.id ?? "");
        if (chatId === expectedChatId) {
          const replyText = PRESET_REPLIES[cq.data];
          if (replyText) {
            messages.push(replyText);
            await answerCallback(
              env.TELEGRAM_BOT_TOKEN,
              cq.id,
              `ブースへ送信: ${replyText}`
            );
          }
        }
      } else if (update.message?.text) {
        const chatId = String(update.message.chat?.id ?? "");
        const text = update.message.text.trim();
        if (chatId === expectedChatId && text && !text.startsWith("/")) {
          messages.push(text);
        }
      }
    }

    const body = { nextOffset, messages };
    if (isInit) {
      body.profile = {
        name: typeof env.STAFF_NAME === "string" ? env.STAFF_NAME.trim() : "",
        hasIcon: Boolean(typeof env.STAFF_ICON === "string" && env.STAFF_ICON.trim()),
      };
    }

    return jsonResponse(body, 200);
  } catch (err) {
    console.error("Telegram poll failed:", err);
    return jsonResponse(
      {
        error: "Failed to reach Telegram API.",
        detail: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
}
