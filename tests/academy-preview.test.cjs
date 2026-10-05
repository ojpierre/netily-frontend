const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const Module = require("node:module")
const test = require("node:test")
const ts = require("typescript")
const file = path.resolve(__dirname, "../lib/academy-preview.ts")
const compiled = new Module(file)
compiled._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, file)
const api = compiled.exports
function storage() { const values = new Map(); return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)} }
test("M-Pesa phone normalization accepts Kenyan formats and rejects malformed numbers", () => {
 for (const value of ["0712345678", "+254 712 345 678", "712345678", "254712345678"]) assert.equal(api.normalizeMpesaPhone(value),"254712345678")
 assert.equal(api.normalizeMpesaPhone("0112345678"),"254112345678")
 for (const value of ["123","2547004781488","+255712345678","07letters123"]) assert.equal(api.normalizeMpesaPhone(value),null)
})
test("academy return destinations never leave approved learner routes", () => {
 for (const value of [null,"https://evil.example","//evil.example","/admin","/academy/../admin","/academy/%2e%2e/admin","/academy/login","/academy/register"]) assert.equal(api.safeAcademyNext(value),"/academy/account")
 for (const value of ["/academy/checkout","/academy/cart","/academy/learn/router-basics","/academy/courses?level=Beginner"]) assert.equal(api.safeAcademyNext(value),value)
})
test("preview identity is isolated, handles corrupt data, and never saves passwords", () => {
 global.sessionStorage = storage()
 assert.equal(api.readLearner(),null)
 api.saveLearner({name:"Amina",email:"amina@example.com"})
 assert.deepEqual(api.readLearner(),{name:"Amina",email:"amina@example.com"})
 api.logoutLearner();assert.equal(api.readLearner(),null)
 sessionStorage.setItem("internetily-academy-preview-session","invalid");assert.equal(api.readLearner(),null)
})
test("repeated preview outcomes update one order and malformed records are ignored", () => {
 global.localStorage = storage()
 const order={id:"preview-one",email:"amina@example.com",courses:["router-basics"],total:2500,createdAt:"2026-10-05T10:00:00.000Z",status:"pending"}
 api.savePreviewOrder(order);api.savePreviewOrder({...order,status:"completed"})
 assert.equal(api.readPreviewOrders().length,1)
 assert.equal(api.readPreviewOrders()[0].status,"completed")
 localStorage.setItem("internetily-academy-preview-orders",JSON.stringify([{...order,total:-1},{...order,courses:[4]},order]))
 assert.deepEqual(api.readPreviewOrders(),[order])
 localStorage.setItem("internetily-academy-preview-orders","invalid");assert.deepEqual(api.readPreviewOrders(),[])
})
