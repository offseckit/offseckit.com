export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  const host = url.hostname;

  if (host === "offseckit.pages.dev" || host === "www.offseckit.com") {
    return Response.redirect(
      "https://offseckit.com" + url.pathname + url.search,
      301,
    );
  }

  return next();
};
