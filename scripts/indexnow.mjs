// Notify IndexNow search engines (Bing, Yandex, Seznam, Naver; Bing also feeds ChatGPT search and Copilot)
// that public URLs changed. Run AFTER the deploy is live, so the key file is reachable.
//
//   node scripts/indexnow.mjs /features/load-balancing-failover /blog/mikrotik-load-balancing-failover-isp
//   node scripts/indexnow.mjs --all      # every URL in the live sitemap (max 10,000)
//
// Google does not use IndexNow: use Search Console > URL Inspection > Request indexing for Google.

const HOST = "netily.co.ke"
const KEY = "ceb5d096574f3f8751f33f8f725ed9ed" // served at https://netily.co.ke/<KEY>.txt
const args = process.argv.slice(2)

async function sitemapUrls() {
  const index = await (await fetch(`https://${HOST}/sitemap.xml`)).text()
  return [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
}

const urls = args.includes("--all")
  ? await sitemapUrls()
  : args.map((p) => (p.startsWith("http") ? p : `https://${HOST}${p.startsWith("/") ? p : `/${p}`}`))

if (!urls.length) {
  console.error("Pass one or more paths, or --all")
  process.exit(1)
}

const keyCheck = await fetch(`https://${HOST}/${KEY}.txt`)
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
  console.error(`Key file https://${HOST}/${KEY}.txt is not live yet. Deploy first.`)
  process.exit(1)
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(0, 10000) }),
})
console.log(`IndexNow: HTTP ${res.status} for ${urls.length} URL(s)`)
if (res.status >= 400) console.log(await res.text())
