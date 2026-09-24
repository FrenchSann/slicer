import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "https://slicer-navy.vercel.app";
const supabase = "https://xoqgrlpzpjymsjbbhwan.supabase.co";
const headers = { apikey: "sb_publishable_lEti1e6cvIZInOi-rmJ1sA_4gfMs_FM" };
for (const route of [
  "/",
  "/collection",
  "/produit/bloom-flow-02",
  "/panier",
  "/la-marque",
  "/guide-des-tailles",
  "/contact",
  "/livraison-retours",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-de-vente",
  "/confirmation",
  "/paiement-annule",
  "/suivi",
  "/admin",
]) {
  const r = await fetch(base + route);
  assert.equal(r.status, 200, route);
  const html = await r.text();
  assert.ok(html.includes("SLICER"), route);
  if (route === "/admin") assert.ok(html.includes("Se connecter"));
  console.log("PASS", route);
}
const jobs = await fetch(base + "/api/jobs");
assert.equal(jobs.status, 401);
console.log("PASS jobs authorization");
const checkout = await fetch(base + "/api/checkout", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ items: [], country: "FR", total: 1 }),
});
assert.equal(checkout.status, 409);
console.log("PASS preview payment gate");
for (const table of [
  "orders",
  "order_lines",
  "payments",
  "newsletter",
  "administrators",
  "email_outbox",
]) {
  const r = await fetch(supabase + "/rest/v1/" + table + "?select=*", {
    headers,
  });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), []);
  console.log("PASS anonymous RLS", table);
}
const rpc = await fetch(supabase + "/rest/v1/rpc/reserve_order", {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({
    p_items: [],
    p_country: "FR",
    p_hash: "test",
    p_mode: "live",
  }),
});
assert.ok([401, 403, 404].includes(rpc.status));
console.log("PASS private stock function");
