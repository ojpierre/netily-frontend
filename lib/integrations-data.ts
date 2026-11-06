// Single source for the payment, bank and SMS integrations shown on the marketing site.
// Mirrors the backend: billing/constants/bank_paybills.py (banks), messaging SMSGatewayConfig
// PROVIDER_CHOICES (SMS) and the admin Payment Methods page (gateways). Keep them in sync.

export type Brand = { name: string; logo: string }

export type PaymentRoute = {
  id: string
  label: string
  market: string
  brands: Brand[]
  pay: string
  lands: string
  keys: string
  status?: "soon"
}

const L = (file: string) => `/integrations/${file}`

export const PAYMENT_ROUTES: PaymentRoute[] = [
  {
    id: "daraja",
    label: "M-Pesa with your Daraja keys",
    market: "Kenya",
    brands: [{ name: "M-Pesa", logo: L("mpesa.png") }],
    pay: "STK push to the subscriber's phone, or Paybill / Till",
    lands: "Your own Paybill or Till",
    keys: "Your Safaricom Daraja API keys",
  },
  {
    id: "till",
    label: "Till or Paybill, no API keys",
    market: "Kenya",
    brands: [{ name: "M-Pesa", logo: L("mpesa.png") }],
    pay: "STK push prompt on the subscriber's phone",
    lands: "Your existing Till or Paybill number",
    keys: "No API keys. Just enter the number",
  },
  {
    id: "bank",
    label: "Straight to your bank",
    market: "Kenya",
    brands: [{ name: "M-Pesa", logo: L("mpesa.png") }],
    pay: "STK push to the bank's own Paybill",
    lands: "Your bank or SACCO account",
    keys: "No API keys. Pick your bank and account number",
  },
  {
    id: "momo",
    label: "Uganda Mobile Money",
    market: "Uganda",
    brands: [{ name: "MTN MoMo", logo: L("mtn-momo.png") }, { name: "Airtel Money", logo: L("airtel-money.webp") }],
    pay: "MTN MoMo or Airtel Money prompt via iotec",
    lands: "Your iotec wallet",
    keys: "Your iotec client ID, secret and wallet ID",
  },
]

export const PAYMENT_PARTNERS: (Brand & { note: string; status?: "soon" })[] = [
  { name: "M-Pesa", logo: L("mpesa.png"), note: "STK push, Paybill, Till" },
  { name: "MTN MoMo", logo: L("mtn-momo.png"), note: "Uganda, via iotec" },
  { name: "Airtel Money", logo: L("airtel-money.webp"), note: "Uganda, via iotec" },
  { name: "iotec", logo: L("iotec.png"), note: "Uganda mobile money" },
  { name: "KopoKopo", logo: L("kopokopo.png"), note: "Coming soon", status: "soon" },
]

/** Banks and SACCOs a Kenyan ISP can settle into (each via its own M-Pesa Paybill). */
export const BANKS: (Brand & { paybill: string; kind: "Bank" | "SACCO" })[] = [
  { name: "KCB Bank", logo: L("kcb.png"), paybill: "522522", kind: "Bank" },
  { name: "Equity Bank", logo: L("equity.png"), paybill: "247247", kind: "Bank" },
  { name: "Co-operative Bank", logo: L("coop.jpg"), paybill: "400200", kind: "Bank" },
  { name: "Absa Bank Kenya", logo: L("absa.png"), paybill: "303030", kind: "Bank" },
  { name: "NCBA Bank", logo: L("ncba.svg"), paybill: "880100", kind: "Bank" },
  { name: "Standard Chartered", logo: L("standard-chartered.png"), paybill: "329329", kind: "Bank" },
  { name: "Stanbic Bank", logo: L("stanbic.jpg"), paybill: "600100", kind: "Bank" },
  { name: "I&M Bank", logo: L("im-bank.webp"), paybill: "542542", kind: "Bank" },
  { name: "Diamond Trust Bank", logo: L("dtb.png"), paybill: "516600", kind: "Bank" },
  { name: "Family Bank", logo: L("family-bank.png"), paybill: "222111", kind: "Bank" },
  { name: "National Bank", logo: L("national-bank.jpg"), paybill: "547700", kind: "Bank" },
  { name: "Kingdom Bank", logo: L("kingdom-bank.png"), paybill: "529901", kind: "Bank" },
  { name: "SBM Bank", logo: L("sbm.png"), paybill: "552800", kind: "Bank" },
  { name: "Sidian Bank", logo: L("sidian.png"), paybill: "111999", kind: "Bank" },
  { name: "Bank of Africa", logo: L("bank-of-africa.png"), paybill: "972900", kind: "Bank" },
  { name: "Ecobank", logo: L("ecobank.png"), paybill: "700205", kind: "Bank" },
  { name: "Faulu Bank", logo: L("faulu.svg"), paybill: "328585", kind: "Bank" },
  { name: "Postbank", logo: L("postbank.png"), paybill: "200999", kind: "Bank" },
  { name: "LOOP", logo: L("loop.svg"), paybill: "714888", kind: "Bank" },
  { name: "Fortune Sacco", logo: L("fortune-sacco.png"), paybill: "852648", kind: "SACCO" },
  { name: "K-Unity Sacco", logo: L("kunity-sacco.png"), paybill: "4082977", kind: "SACCO" },
  { name: "Tower Sacco", logo: L("tower-sacco.png"), paybill: "506900", kind: "SACCO" },
]

export const SMS_GATEWAYS: (Brand & { region: string })[] = [
  { name: "Africa's Talking", logo: L("africastalking.png"), region: "Pan-Africa" },
  { name: "Advanta SMS", logo: L("advanta.png"), region: "Kenya" },
  { name: "Celcom Africa", logo: L("celcom.png"), region: "Kenya" },
  { name: "Talksasa", logo: L("talksasa.png"), region: "Kenya" },
  { name: "BlessedTexts", logo: L("blessedtexts.png"), region: "Kenya" },
  { name: "Texin", logo: L("texin.png"), region: "Kenya" },
  { name: "Bytewave", logo: L("bytewave.png"), region: "Kenya" },
  { name: "Beem Africa", logo: L("beem.png"), region: "Tanzania" },
  { name: "Hubtel", logo: L("hubtel.png"), region: "Ghana" },
  { name: "Twilio", logo: L("twilio.png"), region: "Global" },
  { name: "Vonage", logo: L("vonage.png"), region: "Global" },
  { name: "Infobip", logo: L("infobip.png"), region: "Global" },
]

/** Messages Internetily sends automatically (SMSGatewayConfig auto_* triggers). */
export const SMS_TRIGGERS = [
  { label: "Payment received", text: "Hi Jane, we received KSh 1,500. Your 10 Mbps plan is active until 12 Dec. Thank you!" },
  { label: "Expiry reminder", text: "Hi Brian, your internet expires tomorrow. Pay KSh 2,000 to Paybill 522522, account HOME-118." },
  { label: "Welcome", text: "Welcome to SkyNet Fibre, Amina. Your PPPoE username is amina.k. Reply HELP for support." },
  { label: "Service paused", text: "Hi Otieno, your service is paused. Renew anytime and you'll reconnect automatically." },
]

export const INTEGRATION_FAQS: Array<[string, string]> = [
  ["Which payment gateways does Internetily (Netily) support?", "In Kenya, Internetily supports M-Pesa STK push, Paybill and Till, either with your own Safaricom Daraja API keys or with no API keys at all, plus settlement straight into 22 Kenyan banks and SACCOs. In Uganda it supports MTN MoMo and Airtel Money through iotec. KopoKopo is coming soon."],
  ["Which banks can my ISP settle into with Internetily?", `Kenyan ISPs can settle subscriber payments directly into ${BANKS.map((b) => b.name).join(", ")}. The subscriber pays by M-Pesa and the money goes to your account through the bank's own Paybill.`],
  ["Does Internetily take a cut of subscriber payments?", "No. Payments settle into your own Till, Paybill, bank account or mobile money wallet. Internetily charges its own monthly fee: KSh 25 per billable PPPoE subscriber and 3% of hotspot revenue, with a KSh 500 monthly minimum."],
  ["Which SMS gateways work with Internetily?", `Internetily works with ${SMS_GATEWAYS.map((g) => g.name).join(", ")}. You can also use Internetily's built-in SMS with no provider account. Prepaid SMS units come from your wallet.`],
  ["Which SMS messages does Internetily send automatically?", "Payment confirmations, expiry reminders, welcome messages and service suspension notices. Each can be switched on or off, and you can send bulk SMS to subscribers at any time."],
]
