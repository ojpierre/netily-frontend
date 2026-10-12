import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const base = process.env.MARKETING_URL || process.env.PREVIEW_URL || "http://localhost:3002"
const chrome = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe"
assert(existsSync(chrome), "Set CHROME_PATH to a Chromium browser executable")
const output = mkdtempSync(join(tmpdir(), "internetily-marketing-"))
const browser = spawn(chrome, ["--headless=new", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${output}`, "about:blank"], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] })
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let socket
try {
  const browserUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Browser startup timed out")), 20000)
    browser.on("error", reject)
    browser.stderr.on("data", (chunk) => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/)
      if (match) { clearTimeout(timer); resolve(match[1]) }
    })
  })
  socket = new WebSocket(browserUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  let nextId = 0
  const pending = new Map()
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) {
      const item = pending.get(message.id)
      if (item) { pending.delete(message.id); clearTimeout(item.timer); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result) }
    }
  }
  const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)) }, 30000)
    pending.set(id, { resolve, reject, timer })
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
  const { targetId } = await call("Target.createTarget", { url: "about:blank" })
  const { sessionId } = await call("Target.attachToTarget", { targetId, flatten: true })
  const page = (method, params) => call(method, params, sessionId)
  const evaluate = async (expression) => {
    const result = await page("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  await page("Page.enable")
  await page("Page.addScriptToEvaluateOnNewDocument", { source: `localStorage.setItem('netily-cookie-preferences', JSON.stringify({necessary:true,analytics:false,marketing:false}));` })
  async function navigate(path) {
    await page("Page.navigate", { url: `${base}${path}` })
    for (let i = 0; i < 200; i++) {
      if (await evaluate(`location.pathname === ${JSON.stringify(path.split("?")[0])} && !!document.querySelector('#marketing-main h1') && document.readyState === 'complete'`)) break
      await delay(150)
    }
    assert(await evaluate("!!document.querySelector('#marketing-main h1')"), `Page did not render: ${path}`)
    await delay(700)
  }
  const content = JSON.parse(readFileSync(new URL("../components/marketing/content.json", import.meta.url), "utf8"))
  const paths = ["", "/features", "/solutions", "/pricing", "/contact", "/resources", "/integrations", "/countries", "/countries/kenya", ...content.map((item) => item.path)]
  for (const path of paths) {
    const response = await fetch(`${base}${path || "/"}`, { headers: { Host: "netily.co.ke" } })
    assert.equal(response.status, 200, path)
    assert(!/noindex/.test(response.headers.get("x-robots-tag") || ""), path)
    const html = await response.text()
    assert.match(html, /name="robots" content="index, follow/, path)
    assert(html.includes(`rel="canonical" href="https://netily.co.ke${path || "/"}"`), `Canonical: ${path}`)
    assert(!/<title>[^<]*Preview/.test(html), path)
    assert(!html.includes('name="googlebot" content="noindex'), path)
  }
  for (const path of paths.filter(Boolean)) {
    const response = await fetch(`${base}/landing-page${path}?ref=MIGRATION123&utm_source=review`, { redirect: "manual" })
    assert.equal(response.status, 308, path)
    assert.equal(response.headers.get("location"), `${path}?ref=MIGRATION123&utm_source=review`, path)
  }
  const archived = await fetch(`${base}/landing-page`)
  assert.equal(archived.status, 200)
  assert.match(archived.headers.get("x-robots-tag") || "", /noindex/)
  const archiveHtml = await archived.text()
  assert(archiveHtml.includes('id="main-content"'), "Archive must render the old homepage")
  assert(!archiveHtml.includes('id="marketing-main"'), "Archive must not wrap old page in new header")
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text()
  for (const path of paths.filter(Boolean)) assert(sitemap.includes(`https://netily.co.ke${path}</loc>`), path)
  assert(!sitemap.includes("/landing-page"))
  const robots = await (await fetch(`${base}/robots.txt`)).text()
  for (const path of ["/features/", "/countries/", "/pricing$", "/contact$", "/resources$", "/integrations$"]) assert(robots.includes(`Allow: ${path}`), path)
  const legacy = await fetch(`${base}/solutions/isp-billing-software-kenya`)
  assert.equal(legacy.status, 200, "Existing country solution must survive")
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false })
    await navigate("/")
    assert(await evaluate("document.documentElement.scrollWidth <= innerWidth"), `Horizontal overflow at ${width}`)
    assert(await evaluate("[...document.querySelectorAll('#marketing-main img')].filter(i => i.loading !== 'lazy').every(i => i.complete && i.naturalWidth > 0)"), "Hero image failed")
    if (width < 921) await evaluate("document.querySelector('[aria-controls=preview-navigation]').click()")
    await evaluate("document.querySelector('[aria-controls=preview-Features]').click()")
    assert(await evaluate("!!document.querySelector('#preview-Features')"), "Features menu failed")
    assert(await evaluate("document.documentElement.scrollWidth <= innerWidth"), `Menu overflow at ${width}`)
    await page("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 })
    await evaluate("document.querySelector('[aria-controls=preview-Features]').focus()")
    await page("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 })
    await evaluate("document.querySelectorAll('header button[aria-expanded=true]').forEach(b => b.click())")
    await page("Page.captureScreenshot", { format: "png" }).then(({ data }) => writeFileSync(join(output, `home-${width}.png`), Buffer.from(data, "base64")))
  }
  await navigate("/")
  await evaluate("location.hash = 'calculator'")
  for (let i = 0; i < 100; i++) {
    if (await evaluate("location.pathname === '/pricing' && !!document.querySelector('output')")) break
    await delay(150)
  }
  assert(await evaluate("location.pathname === '/pricing' && location.hash === '#calculator'"), "Old calculator anchor must resolve")
  await navigate("/pricing")
  assert(await evaluate("document.querySelector('output').textContent.includes('2,800')"), "Default estimate must be 100 * 25 + 10000 * 3%")
  await navigate("/features/mpesa-billing")
  assert(await evaluate("document.documentElement.scrollWidth <= innerWidth"), "Feature overflow")
  await evaluate("document.documentElement.classList.add('dark')")
  await page("Page.captureScreenshot", { format: "png" }).then(({ data }) => writeFileSync(join(output, "feature-dark-mobile.png"), Buffer.from(data, "base64")))
  await navigate("/contact")
  assert(await evaluate("document.documentElement.scrollWidth <= innerWidth"), "Contact overflow")
  await page("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await evaluate("document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light')")
  await page("Page.captureScreenshot", { format: "png" }).then(({ data }) => writeFileSync(join(output, "contact-light-desktop.png"), Buffer.from(data, "base64")))
  // Intercept only the lead request in this test tab. Never send test enquiries to production.
  await evaluate(`(() => {
    const original = window.fetch;
    window.testLeads = [];
    window.fetch = async (url, options) => {
      if (String(url).includes('/api/public/core/leads/submit') || String(url).includes('/lead-submit')) {
        window.testLeads.push(JSON.parse(options.body));
        await new Promise(resolve => setTimeout(resolve, 300));
        return new Response(JSON.stringify({message:'Enquiry received',lead_id:1}),{status:200,headers:{'Content-Type':'application/json'}});
      }
      return original(url, options);
    };
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    for (const [name,value] of [['name','Preview Test'],['email','preview@example.com']]) {
      const input=document.querySelector('input[name='+name+']'); setter.call(input,value); input.dispatchEvent(new Event('input',{bubbles:true}));
    }
    document.querySelector('#marketing-main form').requestSubmit();
    document.querySelector('#marketing-main form').requestSubmit();
  })()`)
  await delay(1000)
  assert(await evaluate("document.querySelector('#marketing-main').innerText.includes('Your enquiry is with us') || document.querySelector('#marketing-main').innerText.includes('your enquiry is with us')"), "Submission success feedback missing")
  assert.equal(await evaluate("window.testLeads.length"), 1, "Double submission must be blocked")
  await evaluate(`document.querySelector('#marketing-main button').click()`)
  await delay(200)
  await evaluate(`(() => {
    window.fetch = async () => new Response(JSON.stringify({error:'Please try again later.'}),{status:400,headers:{'Content-Type':'application/json'}});
    for (const [name,value] of [['name','Preview Test'],['email','preview@example.com']]) { const input=document.querySelector('input[name='+name+']'); input.value=value; input.dispatchEvent(new Event('input',{bubbles:true})); }
    document.querySelector('#marketing-main form').requestSubmit();
  })()`)
  await delay(600)
  assert(await evaluate("document.querySelector('[role=alert]').textContent.includes('Please try again later')"), "Submission error feedback missing")
  assert(await evaluate("!document.querySelector('#marketing-main button[type=submit]').disabled"), "Retry must be available")
  assert.equal((await fetch(`${base}/features/not-a-page`)).status, 404)
  assert.equal((await fetch(`${base}/landing-page/not-a-page`)).status, 404)
  console.log(`PASS: ${paths.length} public routes, canonicals, archive noindex, redirects, sitemap/robots, 5 viewports, navigation, images, pricing, 404, mocked lead success/error/retry and double-submit protection. Screenshots: ${output}`)
} finally {
  socket?.close()
  browser.kill()
}
