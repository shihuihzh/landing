async function fetchAndCacheIcon(iconUrl) {
  try {
    const response = await fetch(iconUrl, { cf: { cacheTTL: 86400, cacheEverything: true } });
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
    const base64 = btoa(binary);

    const contentType = response.headers.get("content-type") || "image/x-icon";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Request body cannot be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      let { name } = item;
      
      if (!name) {
        errors.push({ item, error: "Missing required field: name" });
        continue;
      }

      name = name.trim();

      // 获取已有数据以进行合并更新
      let existingData = {};
      const existingValue = await env.URL_STORE.get(name);
      if (existingValue) {
        existingData = JSON.parse(existingValue);
      }

      // 合并数据：只更新提供的字段
      const mergedData = { ...existingData, ...item, name };

      // 更新时间戳
      mergedData.updated_at = new Date().toISOString();

      // 缓存图标逻辑
      if (item.icon) {
        // 如果提供了 icon，抓取提供的 icon URL
        mergedData.cache_icon = await fetchAndCacheIcon(item.icon);
      } else {
        // 如果没提供 icon，抓取目标网站的 favicon.ico
        const targetUrl = item.url || existingData.url;
        if (targetUrl) {
          try {
            const { origin } = new URL(targetUrl);
            mergedData.cache_icon = await fetchAndCacheIcon(`${origin}/favicon.ico`);
          } catch {
            mergedData.cache_icon = null;
          }
        }
      }

      await env.URL_STORE.put(name, JSON.stringify(mergedData));
      results.push({ name, status: "saved" });
    }

    const status = errors.length > 0 ? 207 : 200;

    return new Response(
      JSON.stringify({
        success: results.length > 0,
        results,
        errors,
      }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const names = body.names || (body.name ? [body.name] : []);

    if (names.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required field: name or names" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const results = [];
    const errors = [];

    for (const name of names) {
      const sanitizedName = name.trim();
      const exists = await env.URL_STORE.get(sanitizedName);
      if (!exists) {
        errors.push({ name, error: "URL not found" });
        continue;
      }

      await env.URL_STORE.delete(sanitizedName);
      results.push({ name: sanitizedName, status: "deleted" });
    }

    const status = errors.length > 0 ? 207 : 200;

    return new Response(
      JSON.stringify({ success: results.length > 0, results, errors }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestGet(context) {
  const { env } = context;

  const entries = [];
  let cursor = null;

  while (true) {
    const listResult = await env.URL_STORE.list({ cursor, limit: 100 });
    for (const key of listResult.keys) {
      const value = await env.URL_STORE.get(key.name);
      if (value) {
        entries.push(JSON.parse(value));
      }
    }
    if (!listResult.list_complete) {
      cursor = listResult.cursor;
    } else {
      break;
    }
  }

  return new Response(JSON.stringify(entries), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
