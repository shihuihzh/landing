export async function onRequestGet(context) {
  const { request, env, params } = context;
  const { name } = params;

  if (!name) {
    return new Response("Not Found", { status: 404 });
  }

  const data = await env.URL_STORE.get(name);

  if (!data) {
    return new Response("URL not found", { status: 404 });
  }

  const { url } = JSON.parse(data);

  return Response.redirect(url, 302);
}
