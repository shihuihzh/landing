export async function onRequestGet(context) {
  const { request, env, params } = context;
  const { name } = params;

  if (!name) {
    return new Response("Not Found", { status: 404 });
  }

  // 解码并去除首尾空格，确保与存储时的格式一致
  const sanitizedName = decodeURIComponent(name).trim();

  const data = await env.URL_STORE.get(sanitizedName);

  if (!data) {
    return new Response("URL not found", { status: 404 });
  }

  const { url } = JSON.parse(data);

  return Response.redirect(url, 302);
}
