// SPDX-License-Identifier: MIT
export async function onRequestGet(context) {
  const { env } = context;

  if (!env.NTFY_REPLY_TOPIC) {
    return new Response(
      JSON.stringify({ error: "NTFY_REPLY_TOPIC is not configured." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return new Response(
    JSON.stringify({ replyTopic: env.NTFY_REPLY_TOPIC }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}
