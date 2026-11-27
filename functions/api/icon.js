// SPDX-License-Identifier: MIT
export async function onRequestGet(context) {
  const { env } = context;
  const raw = typeof env.STAFF_ICON === "string" ? env.STAFF_ICON.trim() : "";

  if (!raw) {
    return new Response("Not Found", { status: 404 });
  }

  // data:image/...;base64,... 形式
  const dataMatch = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataMatch) {
    try {
      const contentType = dataMatch[1];
      const binaryStr = atob(dataMatch[2]);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return new Response(bytes, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=300",
        },
      });
    } catch (err) {
      console.error("Invalid STAFF_ICON data URI:", err);
      return new Response("Invalid icon data", { status: 500 });
    }
  }

  // https:// または http:// URL の場合は中継（プロキシ）して返す
  if (/^https?:\/\//i.test(raw)) {
    try {
      const upstream = await fetch(raw);
      if (!upstream.ok) {
        return new Response("Upstream icon fetch failed", { status: 502 });
      }
      const contentType = upstream.headers.get("Content-Type") || "image/png";
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=300",
        },
      });
    } catch (err) {
      console.error("Failed to proxy STAFF_ICON:", err);
      return new Response("Bad Gateway", { status: 502 });
    }
  }

  return new Response("Unsupported STAFF_ICON format", { status: 400 });
}
