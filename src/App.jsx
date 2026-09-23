import React, { useState, useMemo, useEffect, useRef, useCallback, startTransition } from "react";
import {
ComposedChart, Line, Bar, XAxis, YAxis,
CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceArea, ResponsiveContainer,
RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

function monthlyPI(P, annRate, yrs) {
if (annRate === 0) return P / (yrs * 12);
const r = annRate / 100 / 12, n = yrs * 12;
return P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);}
function loanBal(P, annRate, yrs, yearsElapsed) {
if (yearsElapsed >= yrs) return 0;
if (annRate === 0) return P - (P / (yrs * 12)) * (yearsElapsed * 12);
const r = annRate / 100 / 12, n = yrs * 12, m = yearsElapsed * 12;
return monthlyPI(P, annRate, yrs) * (1 - Math.pow(1 + r, -(n - m))) / r;}
function fmtMoney(n) {
if (!isFinite(n)) return "\u2014";
const neg = n < 0, a = Math.abs(n);
let s;
if (a < 1000) s = "$" + Math.round(a);
else if (a < 1000000) s = "$" + (a / 1000).toFixed(2) + "K";
else s = "$" + (a / 1000000).toFixed(2) + "M";
return neg ? "-" + s : s;}
function fmtNum(n) {
if (!isFinite(n)) return "\u2014";
const a = Math.abs(n);
if (a < 1000) return String(Math.round(a));
if (a < 1000000) return (a / 1000).toFixed(1) + "K";
return (a / 1000000).toFixed(2) + "M";}
function fmtBig(n) { if (!isFinite(n)) return "—"; const a = Math.abs(n), sg = n < 0 ? "-" : ""; if (a >= 1e6) return sg + "$" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + "M"; if (a >= 1e5) return sg + "$" + Math.round(a / 1e3) + "K"; return sg + "$" + Math.round(a).toLocaleString("en-US"); }
function fmtAxis(n) { const a = Math.abs(n), sg = n < 0 ? "-" : ""; if (a >= 1e6) return sg + "$" + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M"; if (a >= 1e3) return sg + "$" + Math.round(a / 1e3) + "K"; return sg + "$" + Math.round(a); }
function fmtPct(n) { return n.toFixed(2) + "%"; }
function moToYrMo(mo) { return Math.floor(mo / 12) + "年" + (mo % 12 ? (mo % 12) + "个月" : ""); }
function getAgeSavings(age) {
const t = [[20,500],[25,8000],[30,22000],[35,45000],[40,78000],[45,115000],[50,160000],[55,210000],[60,270000],[65,350000]];
for (let i = t.length - 1; i >= 0; i--) {
if (age >= t[i][0]) {
if (i < t.length - 1) {
const [a1, s1] = [t[i][0], t[i][1]], [a2, s2] = [t[i + 1][0], t[i + 1][1]];
return Math.round(s1 + (s2 - s1) * (age - a1) / (a2 - a1));}
return t[i][1];}}
return 0;}

function IncomeBar(props) {
const { x, y, width, height, payload, fiGoal } = props;
if (!height || height <= 0 || !payload) return null;
const inFire = payload.inRetirement;
const pct = fiGoal > 0 ? Math.min((payload.monthlyTotalPsv || 0) / fiGoal, 1) : 0.5;
const fillOp = inFire ? 0.12 + pct * 0.28 : pct * 0.15;
return (
<g>
<rect x={x} y={y} width={Math.max(width, 1)} height={height} fill="#C66A2C" fillOpacity={fillOp} rx={0} />
{!inFire && <rect x={x} y={y} width={Math.max(width, 1)} height={height} fill="none" stroke="#C66A2C" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.35} rx={0} />}
</g>
);}

const pF = v => parseFloat(v) || 0;
const pI = v => parseInt(v) || 0;
const C = {
bg: "#FFFFFF", surface: "#FFFFFF", inset: "#F7F7F7",
border: "#DFDFDF", borderIn: "#C7C7C7", accent: "#121212",
text: "#121212", sub: "#333333", muted: "#727272",
blue: "#326891", green: "#2A7A4B", orange: "#B35C1E", red: "#B8312F",
cta: "#121212", rule: "#121212",
serif: "var(--nyt-serif)", sans: "var(--nyt-sans)",
};
const FG6 = { display: "flex", gap: 6 };
const FG4 = { display: "flex", gap: 4 };
const FG8 = { display: "flex", gap: 8 };
const FAC = { display: "flex", alignItems: "center", gap: 3 };
const FACB = (mb) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: mb || 4 });
const GOLD = { display: "flex", alignItems: "center", height: 38, background: "#fff", borderRadius: 0, padding: "0 10px", border: "1px solid " + C.border, boxSizing: "border-box" };
const PILL = (bg) => ({ display: "inline-flex", alignItems: "center", gap: 3, background: "transparent", borderRadius: 0, padding: "0 0 1px", marginBottom: 5, borderBottom: "2px solid " + (bg || "#121212") });
const SEC = (border) => ({ background: "#FFFFFF", borderRadius: 0, padding: "8px 2px 8px", marginBottom: 6, overflow: "hidden", borderTop: "1px solid #121212" });
const EXP_RATIOS = [0.30, 0.35, 0.40, 0.45];
const EXP_LABELS = ["30% \u81ea\u7ba1\u00b7\u4e0d\u5305", "35% \u81ea\u7ba1\u00b7\u5305", "40% \u6258\u7ba1\u00b7\u4e0d\u5305", "45% \u6258\u7ba1\u00b7\u5305", "\u81ea\u5b9a\u4e49"];

function NumInp({ label, val, setVal, prefix = "", suffix = "", money = false, decimals = null, style = {} }) {
const [editing, setEditing] = useState(false);
let displayVal;
if (editing || val === "") displayVal = val;
else if (money) displayVal = (parseFloat(val) || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
else if (decimals !== null) { const n = parseFloat(val); displayVal = isNaN(n) ? val : n.toFixed(decimals); }
else displayVal = val;
return (
<div style={style}>
{label && <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>}
<div style={{ display: "flex", alignItems: "center", height: 32, background: "#FFFFFF", border: "1px solid " + C.borderIn, borderRadius: 0, padding: "0 6px" }}>
{prefix && <span style={{ color: C.muted, fontSize: 12.5, paddingLeft: 2, flexShrink: 0 }}>{prefix}</span>}
<input type="text" inputMode="decimal" aria-label={typeof label === "string" ? label : undefined} value={displayVal}
onFocus={() => setEditing(true)}
onChange={e => setVal(e.target.value.replace(/,/g, ""))}
onBlur={() => { setEditing(false); const v = parseFloat((val + "").replace(/,/g, "")); if (!isNaN(v)) setVal(v.toString()); }}
style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 13, fontWeight: 500, padding: "0 4px", width: 0, minWidth: 0 }} />
{suffix && <span style={{ color: C.muted, fontSize: 12.5, paddingRight: 2, flexShrink: 0 }}>{suffix}</span>}</div></div>
);}
function InfoCell({ label, val, color, style: st = {} }) {
return (
<div style={{ flex: 1, minWidth: 0, ...st }}>
<div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden" }}>{label}</div>
<div style={{ height: 26, display: "flex", alignItems: "center", paddingLeft: 0, background: "transparent", borderBottom: "1px solid " + C.border, overflow: "hidden" }}>
<span style={{ fontSize: 13, fontWeight: 700, color: color || C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{val}</span></div></div>
);}
function Card({ label, val, color, style: st = {} }) {
return (
<div style={{ padding: "3px 0 4px", background: "transparent", borderTop: "1px solid " + C.border, flex: 1, minWidth: 0, overflow: "hidden", ...st }}>
<div style={{ fontSize: 10, color: C.muted, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden" }}>{label}</div>
<div style={{ fontSize: 13, fontWeight: 700, color: color || C.text, whiteSpace: "nowrap", overflow: "hidden" }}>{val}</div></div>
);}
function FeatCard({ label, val, sub, color, style: st = {} }) {
return (
<div style={{ padding: "6px 0 4px", flex: 1, minWidth: 0, overflow: "hidden", background: "transparent", borderTop: "2px solid " + color, ...st }}>
<div style={{ fontSize: 10, color: C.sub, fontWeight: 700, marginBottom: 2, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
<div style={{ fontSize: 22, fontWeight: 700, color: color, fontFamily: C.serif, letterSpacing: "-0.01em", lineHeight: 1.15 }}>{val}</div>
{sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 3, whiteSpace: "nowrap" }}>{sub}</div>}</div>
);}
function SHdr({ zh, en }) {
return (
<div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 5 }}>
<span style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: C.serif, letterSpacing: "0", whiteSpace: "nowrap", flexShrink: 0 }}>{zh}</span>
{en && <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{en}</span>}</div>
);}
// ── NYT editorial building blocks for the report pages ──
function todayZh() { const d = new Date(); return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日"; }
function Kicker({ children, color }) {
return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: color || C.sub, marginBottom: 6 }}>{children}</div>;}
function ArticleHead({ kicker, title, deck, byline, right }) {
return (
<header style={{ padding: "6px 0 14px" }}>
{kicker && <Kicker>{kicker}</Kicker>}
<h1 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 27, lineHeight: 1.22, color: C.text, margin: 0, letterSpacing: "-0.005em" }}>{title}</h1>
{deck && <p style={{ fontFamily: C.serif, fontSize: 15, lineHeight: 1.55, color: C.sub, margin: "10px 0 0" }}>{deck}</p>}
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12, fontSize: 11, color: C.muted }}>
<span>{byline || ("钱景 QianJing · " + todayZh())}</span>{right}</div>
</header>);}
function Section({ kicker, title, deck, right, children, style: st = {} }) {
return (
<section style={{ borderTop: "1px solid " + C.rule, padding: "14px 0 18px", ...st }}>
<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
<div style={{ minWidth: 0 }}>
{kicker && <Kicker>{kicker}</Kicker>}
{title && <h2 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: C.text, margin: 0 }}>{title}</h2>}
</div>
{right && <div style={{ flexShrink: 0 }}>{right}</div>}</div>
{deck && <p style={{ fontFamily: C.serif, fontSize: 13.5, lineHeight: 1.55, color: C.sub, margin: "6px 0 0" }}>{deck}</p>}
<div style={{ marginTop: 12 }}>{children}</div>
</section>);}
function StatRow({ items, size }) {
const nItems = items.filter(Boolean).length;
const auto = nItems >= 5 ? Math.min(size || 14, 14) : (size || (nItems >= 4 ? 19 : 22));
const padL = nItems >= 5 ? 6 : 10;
const list = items.filter(Boolean);
return (
<div style={{ display: "flex", borderTop: "1px solid " + C.border, borderBottom: "1px solid " + C.border }}>
{list.map(function(it, i) { return (
<div key={i} style={{ flex: 1, minWidth: 0, padding: "9px " + (nItems >= 5 ? 3 : 8) + "px 9px " + (i ? padL : 0) + "px", borderLeft: i ? "1px solid " + C.border : "none" }}>
<div style={{ fontSize: 10.5, fontWeight: 600, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</div>
<div style={{ fontFamily: C.serif, fontSize: auto, fontWeight: 700, color: it.color || C.text, lineHeight: 1.2, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.value}</div>
{it.sub && <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.sub}</div>}
</div>); })}
</div>);}
function HBar({ label, value, pct, color, note, faded }) {
return (
<div style={{ marginBottom: 9 }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12, marginBottom: 3 }}>
<span style={{ color: C.sub }}>{label}{note && <span style={{ color: C.muted, fontSize: 11 }}> {note}</span>}</span>
<span style={{ fontWeight: 700, color: C.text }}>{value}</span></div>
<div style={{ height: 8, background: "#EEEEEE" }}><div style={{ height: "100%", width: Math.max(0, Math.min(100, pct)) + "%", background: color || C.text, opacity: faded ? 0.35 : 1 }} /></div>
</div>);}
function StackBar({ items, total, height }) {
const tot = total || items.reduce(function(a, x) { return a + Math.max(0, x.v); }, 0) || 1;
return <div style={{ display: "flex", height: height || 12, background: "#EEEEEE" }}>{items.map(function(x, i) { return <div key={i} title={x.l} style={{ width: (Math.max(0, x.v) / tot * 100) + "%", background: x.c, borderRight: "1px solid #fff" }} />; })}</div>;}
function Seg({ options, value, onChange }) {
return (
<div role="group" style={{ display: "inline-flex", border: "1px solid " + C.rule, height: 26 }}>
{options.map(function(o) { var on = o[1] === value; return <button key={o[1]} aria-pressed={on} onClick={function() { onChange(o[1]); }} style={{ padding: "0 10px", height: "100%", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, background: on ? C.text : "#fff", color: on ? "#fff" : C.text }}>{o[0]}</button>; })}
</div>);}
function LinkBtn({ children, onClick }) {
return <button onClick={onClick} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: C.blue }}>{children}</button>;}
function KeyRow({ items }) {
return <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: 11, color: C.sub, marginTop: 6 }}>{items.filter(Boolean).map(function(it) { return <span key={it[0]} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: it[2] === "line" ? 14 : 9, height: it[2] === "line" ? 2 : 9, background: it[1], opacity: it[3] || 1 }} />{it[0]}</span>; })}</div>;}
function ModalHead({ kicker, title, deck, onClose }) {
return (
<div style={{ marginBottom: 12 }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
<div>{kicker && <Kicker>{kicker}</Kicker>}
<h2 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: 21, lineHeight: 1.25, margin: 0, color: C.text }}>{title}</h2></div>
<button aria-label="关闭" onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 22, lineHeight: 1, cursor: "pointer", color: C.sub, padding: "0 2px", flexShrink: 0 }}>×</button></div>
{deck && <p style={{ fontFamily: C.serif, fontSize: 13.5, lineHeight: 1.55, color: C.sub, margin: "8px 0 0" }}>{deck}</p>}
</div>);}
function CustomTooltip({ active, payload }) {
if (!active || !payload?.length) return null;
const d = payload[0].payload;
return (
<div style={{ background: "#fffF", border: "1px solid " + C.border, padding: "4px 6px", borderRadius: 0, boxShadow: "none", fontSize: 10, lineHeight: 1.5, maxWidth: 170, pointerEvents: "none" }}>
<div style={{ fontWeight: 700, color: C.accent, fontSize: 10.5 }}>{d.age}岁 · 第{d.yr}年</div>
<div>净资产 <b style={{ color: C.blue }}>{fmtMoney(d.netWorth)}</b></div>
{d.nwReal != null && d.nwReal !== d.netWorth && <div style={{ color: "#B35C1E", fontSize: 9.5 }}>↳ 按今日物价值 <b>{fmtMoney(d.nwReal)}</b></div>}
<div>被动收入 <b style={{ color: C.orange }}>{fmtMoney(d.monthlyTotalPsv)}/月</b></div>
{d.psvReal != null && d.psvReal !== d.monthlyTotalPsv && d.monthlyTotalPsv > 0 && <div style={{ color: "#B35C1E", fontSize: 9.5 }}>↳ 按今日物价值 <b>{fmtMoney(d.psvReal)}/月</b></div>}
<div style={{ color: "#727272" }}>流动现金 <b style={{ color: C.green }}>{fmtMoney(d.cashPool)}</b></div>
{d.units > 0 && <div style={{ color: "#727272" }}>持有 <b style={{ color: C.blue }}>{d.units}</b> 套投资房</div>}
{d.events && d.events.length > 0 && <div style={{ borderTop: "1px dashed #DFDFDF", marginTop: 2, paddingTop: 2 }}>
{d.events.map(function(e, i) { return <div key={i} style={{ fontSize: 9, color: "#2A7A4B", fontWeight: 600 }}>{e}</div>; })}
</div>}</div>
);}
function Logo({ small }) {
  return <span style={{ display: "inline-flex", alignItems: "baseline", gap: small ? 4 : 6, color: "#121212", lineHeight: 1 }}>
    <span style={{ fontFamily: C.serif, fontWeight: 900, fontSize: small ? 17 : 22, letterSpacing: "0.02em" }}>钱景</span>
    <span style={{ fontFamily: "UnifrakturMaguntia, 'Old English Text MT', serif", fontSize: small ? 13 : 16 }}>QianJing</span></span>;}
export default function App() {
const [listP, setListP] = useState("500000"); const [saleP, setSaleP] = useState("450000"); const [portfolioMode, setPortfolioMode] = useState(false); const [propType, setPropType] = useState("sf"); const [mfUnits, setMfUnits] = useState("2"); const [unitRents, setUnitRents] = useState(["5000"]); const [homeListP, setHomeListP] = useState("600000"); const [homeSaleP, setHomeSaleP] = useState("550000"); const [homePropType, setHomePropType] = useState("sf"); const [homeMfUnits, setHomeMfUnits] = useState("2"); const [homeUnitRents, setHomeUnitRents] = useState(["10000"]); const [rentPeriod, setRentPeriod] = useState("mo");
const [portfolio, setPortfolio] = useState([
{ id: 1, listP: "500000", saleP: "450000", type: "sf", mfUnits: "2", unitRents: ["9700"], purchaseYear: "2022", purchaseMonth: "1", purchaseDay: "15" },
]);
const [downPct, setDownPct] = useState("20"); const [downMode, setDownMode] = useState("pct"); const [downAmt, setDownAmt] = useState(""); const [annRate, setAnnRate] = useState("6.875"); const [loanYrs, setLoanYrs] = useState("30"); const [closing, setClosing] = useState("20000"); const [expIdx, setExpIdx] = useState(1); const [hmAmt, setHmAmt] = useState("0"); const [hmRate, setHmRate] = useState("10"); const [capRate, setCapRate] = useState("8"); const [modal, setModal] = useState(null); const [wfViewAll, setWfViewAll] = useState(true); const [scnInc, setScnInc] = useState(0); const [scnSav, setScnSav] = useState(0); const [scnTgt, setScnTgt] = useState(0); const [modalXtra, setModalXtra] = useState(0); const [showReport, setShowReport] = useState(false); const [userName, setUserName] = useState(""); const [propAddress, setPropAddress] = useState(""); const [showFormulas, setShowFormulas] = useState(false); const [showGuide, setShowGuide] = useState(false); const [introMode, setIntroMode] = useState(""); const [wantHome, setWantHome] = useState(false); const [wantFire, setWantFire] = useState(false); const [wantInvest, setWantInvest] = useState(false); const [extraPmt, setExtraPmt] = useState("0"); const [homeExtraPmt, setHomeExtraPmt] = useState("0"); const [wYears, setWYears] = useState("30"); const [birthYear, setBirthYear] = useState("2000"); const [birthMonth, setBirthMonth] = useState("1"); const [selSimIdx, setSelSimIdx] = useState(null);
const [rptStep, setRptStep] = useState(0);
const [rptYear, setRptYear] = useState("2036");
const [rptPrepay, setRptPrepay] = useState(0);
const [rptStyle, setRptStyle] = useState("list");
const userAge = String(Math.max(0, new Date().getFullYear() - (parseInt(birthYear)||2000) - (parseInt(birthMonth) > new Date().getMonth()+1 ? 1 : 0)));
const setUserAge = () => {};
const [appRate, setAppRate] = useState("3"); const [showStockComp, setShowStockComp] = useState(true); const [showInflAdj, setShowInflAdj] = useState(true); const [showNominal, setShowNominal] = useState(false); const [stockCAGR, setStockCAGR] = useState("8"); const [stockSWR, setStockSWR] = useState("4"); const [calcMode, setCalcMode] = useState("invest"); const [propMode, setPropMode] = useState("buy"); const [purchaseYear, setPurchaseYear] = useState("2022"); const [purchaseMonth, setPurchaseMonth] = useState("1"); const [purchaseDay, setPurchaseDay] = useState("15"); const [alreadyBought, setAlreadyBought] = useState(true); const [investOwn, setInvestOwn] = useState("100"); const [homeOwn, setHomeOwn] = useState("100"); const [hmEnabled, setHmEnabled] = useState(false); const [investOther, setInvestOther] = useState("0"); const [investExtras, setInvestExtras] = useState([]); const [portfolioCollapsed, setPortfolioCollapsed] = useState(true); const [homeHasLoan, setHomeHasLoan] = useState(true); const [homeDownPct, setHomeDownPct] = useState("20"); const [homeAnnRate, setHomeAnnRate] = useState("6.75"); const [homeLoanYrs, setHomeLoanYrs] = useState("30"); const [homeClosing, setHomeClosing] = useState("30000"); const [homeRenovation, setHomeRenovation] = useState("0"); const [homePurchaseYear, setHomePurchaseYear] = useState(""); const [homePurchaseMonth, setHomePurchaseMonth] = useState("1"); const [landPct, setLandPct] = useState("20"); const [costSeg, setCostSeg] = useState(false); const [taxRate, setTaxRate] = useState("24"); const [arv, setArv] = useState(""); const [refiLtv, setRefiLtv] = useState("75"); const [refiRate, setRefiRate] = useState(""); const [renoAmt, setRenoAmt] = useState("60000"); const [homeInsurance, setHomeInsurance] = useState("0"); const [homeTax, setHomeTax] = useState("0"); const [homeUtils, setHomeUtils] = useState("0"); const [homeMaint, setHomeMaint] = useState("0"); const [poolRate, setPoolRate] = useState("4"); const [ffMode, setFfMode] = useState("income"); const [compoundMode, setCompoundMode] = useState("mix"); const [ffIncomeTgt, setFfIncomeTgt] = useState("10000"); const [ffWealthTgt, setFfWealthTgt] = useState("3000000"); const [ffWithdraw, setFfWithdraw] = useState("8000"); const [initSavings, setInitSavings] = useState("80000"); const [annualIncome, setAnnualIncome] = useState("100000"); const [savingsRate, setSavingsRate] = useState("8"); const [k401Balance, setK401Balance] = useState("40000"); const [k401CAGR, setK401CAGR] = useState("8"); const [k401DrawAge, setK401DrawAge] = useState("60"); const [k401Penalty, setK401Penalty] = useState(false); const [k401SWR, setK401SWR] = useState("4"); const [ssWorkStart, setSsWorkStart] = useState("24"); const [ssClaimAge, setSsClaimAge] = useState("67"); const [showIncomeLine, setShowIncomeLine] = useState(true); const [bankSavings, setBankSavings] = useState("50000"); const [cdRate, setCdRate] = useState("4"); const [savingsAlloc, setSavingsAlloc] = useState("compare"); const [bankWithdrawPct, setBankWithdrawPct] = useState("0"); const [compoundYears, setCompoundYears] = useState("44"); const [stockAccount, setStockAccount] = useState("30000"); const [retireAge, setRetireAge] = useState(""); const [retireManual, setRetireManual] = useState(false); const [savBankPct, setSavBankPct] = useState("10"); const [savStockPct, setSavStockPct] = useState("44"); const [savREPct, setSavREPct] = useState("40"); const [sav401Pct, setSav401Pct] = useState("6"); const [savInvestPrepay, setSavInvestPrepay] = useState("0"); const [savHomePrepay, setSavHomePrepay] = useState("0"); const [incomeGrowth, setIncomeGrowth] = useState("3"); const [effectiveTax, setEffectiveTax] = useState("15"); const [inflRate, setInflRate] = useState("2"); const [gender, setGender] = useState("M"); const [marital, setMarital] = useState("single"); const [dependents, setDependents] = useState("0"); const [city, setCity] = useState("New York"); const [currency, setCurrency] = useState("USD");
const FX = { USD: 1, CNY: 7.24, EUR: 0.92, GBP: 0.79, JPY: 149.5, CAD: 1.36, TWD: 32.2, HKD: 7.82, MOP: 8.06 };
const CUR_SYM = { USD: "$", CNY: "¥", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", TWD: "NT$", HKD: "HK$", MOP: "MOP$" };
const RET_NAME = { USD: "401K", CNY: "社保养老", EUR: "养老金", GBP: "Pension", JPY: "厚生年金", CAD: "RRSP", TWD: "勞退基金", HKD: "MPF強積金", MOP: "社保基金" };
const SS_NAME = { USD: "SS社保", CNY: "养老保险", EUR: "国家养老", GBP: "State Pension", JPY: "国民年金", CAD: "CPP", TWD: "勞保年金", HKD: "長者津貼", MOP: "養老金" };
const BANK_NAME = { USD: "存款 Bank", CNY: "存款 银行", EUR: "存款 Bank", GBP: "存款 Bank", JPY: "預金", CAD: "存款 Bank", TWD: "存款 銀行", HKD: "存款 銀行", MOP: "存款 銀行" };
const STOCK_NAME = { USD: "股票 Stock", CNY: "股票 A股", EUR: "股票 Stock", GBP: "股票 ISA", JPY: "株式 NISA", CAD: "股票 TFSA", TWD: "股票 台股", HKD: "股票 港股", MOP: "股票" };
const retLabel = RET_NAME[currency] || "401K";
const ssLabel = SS_NAME[currency] || "SS社保";
const bankLabel = BANK_NAME[currency] || "存款 Bank";
const stockLabel = STOCK_NAME[currency] || "股票 Stock";
const fx = FX[currency] || 1;
const cs = CUR_SYM[currency] || "$";
const fxM = (n) => { if (!isFinite(n)) return "—"; const v = n * fx; const neg = v < 0; const a = Math.abs(v); let s; if (a < 1000) s = cs + Math.round(a); else if (a < 1000000) s = cs + (a/1000).toFixed(1) + "K"; else s = cs + (a/1000000).toFixed(2) + "M"; return neg ? "-" + s : s; };
const CITIES_BY_CUR = {
USD: ["Atlanta","Austin","Boston","Charlotte","Chicago","Dallas","Denver","Detroit","Houston","Indianapolis","Jacksonville","Las Vegas","Los Angeles","Memphis","Miami","Milwaukee","Minneapolis","Nashville","New York","Oakland","Oklahoma City","Orlando","Philadelphia","Phoenix","Pittsburgh","Portland","Raleigh","Sacramento","Salt Lake City","San Antonio","San Diego","San Francisco","San Jose","Seattle","St. Louis","Tampa","Washington DC"],
CNY: ["Beijing 北京","Chengdu 成都","Chongqing 重庆","Guangzhou 广州","Hangzhou 杭州","Nanjing 南京","Shanghai 上海","Shenzhen 深圳","Suzhou 苏州","Wuhan 武汉","Xi'an 西安"],
EUR: ["Amsterdam","Barcelona","Berlin","Dublin","Frankfurt","Madrid","Milan","Munich","Paris","Rome","Vienna","Zurich"],
GBP: ["Birmingham","Edinburgh","London","Manchester"],
JPY: ["Osaka 大阪","Tokyo 东京","Yokohama 横滨"],
CAD: ["Calgary","Montreal","Ottawa","Toronto","Vancouver"],
TWD: ["Taipei 台北","Kaohsiung 高雄","Taichung 台中","Tainan 台南","Hsinchu 新竹"],
HKD: ["Hong Kong 香港","Kowloon 九龙","New Territories 新界"],
MOP: ["Macau 澳门","Taipa 氹仔","Coloane 路环"],
};
const cityList = CITIES_BY_CUR[currency] || CITIES_BY_CUR.USD;
const [vacancyPct, setVacancyPct] = useState("5"); const [maintMo, setMaintMo] = useState("500"); const [mgmtPct, setMgmtPct] = useState("10"); const [taxMo, setTaxMo] = useState("500"); const [insuranceMo, setInsuranceMo] = useState("500"); const [utilitiesMo, setUtilitiesMo] = useState("300"); const [otherMo, setOtherMo] = useState("50"); const [expSlider, setExpSlider] = useState("35"); const [expDetail, setExpDetail] = useState(false); const [hoaMo, setHoaMo] = useState("0"); const [homeHoa, setHomeHoa] = useState("0"); const [homeCoopMaint, setHomeCoopMaint] = useState("2000"); const [homeRentMo, setHomeRentMo] = useState("0"); const [homeCostGrowth, setHomeCostGrowth] = useState("3"); const [eqLock, setEqLock] = useState({}); const [homePmiRate, setHomePmiRate] = useState("0.5"); const [investPmiRate, setInvestPmiRate] = useState("0.5");
const [saveModal, setSaveModal] = useState(null); // "export" | "import" | null
const [aiSearching, setAiSearching] = useState(false); const [aiResult, setAiResult] = useState(null);
const [userGeo, setUserGeo] = useState(null);
const ANALYTICS_URL = ""; // ← 部署Worker后填入URL
const CITY_COORDS = {
"Atlanta":[33.75,-84.39],"Austin":[30.27,-97.74],"Boston":[42.36,-71.06],"Charlotte":[35.23,-80.84],"Chicago":[41.88,-87.63],"Dallas":[32.78,-96.80],"Denver":[39.74,-104.99],"Detroit":[42.33,-83.05],"Houston":[29.76,-95.37],"Indianapolis":[39.77,-86.16],"Jacksonville":[30.33,-81.66],"Las Vegas":[36.17,-115.14],"Los Angeles":[34.05,-118.24],"Memphis":[35.15,-90.05],"Miami":[25.76,-80.19],"Milwaukee":[43.04,-87.91],"Minneapolis":[44.98,-93.27],"Nashville":[36.16,-86.78],"New York":[40.71,-74.01],"Oakland":[37.80,-122.27],"Oklahoma City":[35.47,-97.52],"Orlando":[28.54,-81.38],"Philadelphia":[39.95,-75.17],"Phoenix":[33.45,-112.07],"Pittsburgh":[40.44,-80.00],"Portland":[45.52,-122.68],"Raleigh":[35.78,-78.64],"Sacramento":[38.58,-121.49],"Salt Lake City":[40.76,-111.89],"San Antonio":[29.42,-98.49],"San Diego":[32.72,-117.16],"San Francisco":[37.77,-122.42],"San Jose":[37.34,-121.89],"Seattle":[47.61,-122.33],"St. Louis":[38.63,-90.20],"Tampa":[27.95,-82.46],"Washington DC":[38.91,-77.04],
"Beijing 北京":[39.90,116.40],"Chengdu 成都":[30.57,104.07],"Chongqing 重庆":[29.56,106.55],"Guangzhou 广州":[23.13,113.26],"Hangzhou 杭州":[30.27,120.15],"Nanjing 南京":[32.06,118.80],"Shanghai 上海":[31.23,121.47],"Shenzhen 深圳":[22.54,114.06],"Suzhou 苏州":[31.30,120.59],"Wuhan 武汉":[30.59,114.31],"Xi'an 西安":[34.26,108.94],
"Amsterdam":[52.37,4.90],"Barcelona":[41.39,2.17],"Berlin":[52.52,13.41],"Dublin":[53.35,-6.26],"Frankfurt":[50.11,8.68],"Madrid":[40.42,-3.70],"Milan":[45.46,9.19],"Munich":[48.14,11.58],"Paris":[48.86,2.35],"Rome":[41.90,12.50],"Vienna":[48.21,16.37],"Zurich":[47.38,8.54],
"Birmingham":[52.49,-1.90],"Edinburgh":[55.95,-3.19],"London":[51.51,-0.13],"Manchester":[53.48,-2.24],
"Osaka 大阪":[34.69,135.50],"Tokyo 东京":[35.68,139.69],"Yokohama 横滨":[35.44,139.64],
"Calgary":[51.05,-114.07],"Montreal":[45.50,-73.57],"Ottawa":[45.42,-75.70],"Toronto":[43.65,-79.38],"Vancouver":[49.28,-123.12],
"Taipei 台北":[25.03,121.57],"Kaohsiung 高雄":[22.62,120.31],"Taichung 台中":[24.15,120.67],"Tainan 台南":[22.99,120.21],"Hsinchu 新竹":[24.80,120.97],
"Hong Kong 香港":[22.32,114.17],"Kowloon 九龙":[22.32,114.17],"New Territories 新界":[22.45,114.17],
"Macau 澳门":[22.20,113.55],"Taipa 氹仔":[22.16,113.56],"Coloane 路环":[22.13,113.56],
};
const CUR_BY_REGION = {"US":"USD","CN":"CNY","TW":"TWD","HK":"HKD","MO":"MOP","JP":"JPY","CA":"CAD","GB":"GBP","DE":"EUR","FR":"EUR","IT":"EUR","ES":"EUR","NL":"EUR","AT":"EUR","IE":"EUR","CH":"EUR"};
const [geoStatus, setGeoStatus] = useState(""); // ""=idle, "loading", "done", "denied"
const autoDetectCity = useCallback(() => {
  if (!navigator.geolocation) { setGeoStatus("denied"); return; }
  setGeoStatus("loading");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      setUserGeo({ lat: lat.toFixed(4), lng: lng.toFixed(4) });
      // find nearest city across ALL currencies
      let bestDist = Infinity, bestCity = null, bestCur = null;
      for (const [cur, cities] of Object.entries(CITIES_BY_CUR)) {
        for (const cName of cities) {
          const coord = CITY_COORDS[cName];
          if (!coord) continue;
          const d = Math.pow(lat - coord[0], 2) + Math.pow(lng - coord[1], 2);
          if (d < bestDist) { bestDist = d; bestCity = cName; bestCur = cur; }
        }
      }
      if (bestCity) { setCity(bestCity); setCurrency(bestCur); }
      setGeoStatus("done");
    },
    (err) => { setGeoStatus("denied"); },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
  );
}, []);
const trackEvent = useCallback((mode, extraData) => {
  if (!ANALYTICS_URL) return;
  const payload = {
    ts: new Date().toISOString(),
    mode: mode,
    geo: userGeo,
    ua: navigator.userAgent,
    screen: window.innerWidth + "x" + window.innerHeight,
    lang: navigator.language,
    ref: document.referrer || null,
    currency: currency,
    city: city,
    ...(mode === "invest" ? {
      salePrice: saleP, rent: unitRents[0], downPct, annRate, loanYrs,
      closing, investOwn, alreadyBought, units: mfUnits, propType,
    } : {}),
    ...(mode === "home" ? {
      homePrice: homeSaleP, homeDownPct, homeAnnRate, homeLoanYrs,
      homeType: homePropType, homeHasLoan,
    } : {}),
    ...(mode === "fire" || mode === "overview" ? {
      annualIncome, savingsRate, retireAge, birthYear, compoundMode,
      initSavings, k401Balance, stockAccount, bankSavings,
    } : {}),
    ...extraData,
  };
  try { fetch(ANALYTICS_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }); } catch(e) {}
}, [userGeo, currency, city, saleP, unitRents, downPct, annRate, loanYrs, closing, investOwn, alreadyBought, mfUnits, propType, homeSaleP, homeDownPct, homeAnnRate, homeLoanYrs, homePropType, homeHasLoan, annualIncome, savingsRate, retireAge, birthYear, compoundMode, initSavings, k401Balance, stockAccount, bankSavings]);

const searchPropertyTax = async (address) => {
  if (!address || address.length < 5) { setAiResult({ notes: "请输入完整地址" }); return; }
  setAiSearching(true);
  setAiResult(null);
  try {
    var resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
     role: "user",
     content: "For US property: " + address + "\nEstimate annual property tax, tax rate %, assessed value, annual insurance.\nRespond ONLY with JSON, no other text:\n{\"tax_annual\":0,\"tax_rate\":0,\"insurance_annual\":0,\"assessed_value\":0,\"notes\":\"\"}"
        }]
      })});
    var rawBody = await resp.text();
    if (!resp.ok) {
      setAiResult({ notes: "HTTP" + resp.status + ": " + rawBody.substring(0, 80) });
      setAiSearching(false);
      return;}
    var data = JSON.parse(rawBody);
    if (data.error) {
      setAiResult({ notes: "API: " + (data.error.message || rawBody.substring(0, 80)) });
      setAiSearching(false);
      return;}
    var blocks = data.content || [];
    var txt = "";
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].text) txt += blocks[i].text;}
    txt = txt.trim();
    if (!txt) {
      var bt = [];
      for (var j = 0; j < blocks.length; j++) bt.push(blocks[j].type || "?");
      setAiResult({ notes: "无文本: types=" + bt.join(",") });
      setAiSearching(false);
      return;}
    var clean = txt.replace(/```json/g, "").replace(/```/g, "").trim();
    var m = clean.match(/\{[\s\S]*\}/);
    if (!m) {
      setAiResult({ notes: "非JSON: " + clean.substring(0, 60) });
      setAiSearching(false);
      return;}
    var parsed = JSON.parse(m[0]);
    setAiResult(parsed);
    if (parsed.tax_annual) setTaxMo(String(Math.round(parsed.tax_annual / 12)));
    if (parsed.insurance_annual) setInsuranceMo(String(Math.round(parsed.insurance_annual / 12)));
  } catch (err) {
    setAiResult({ notes: "失败: " + String(err).substring(0, 100) });}
  setAiSearching(false);
};
const [saveMsg, setSaveMsg] = useState(""); const [importText, setImportText] = useState("");

const getStateSnapshot = () => ({
  listP, saleP, propType, mfUnits, unitRents, homeListP, homeSaleP, homePropType,
  homeMfUnits, homeUnitRents, rentPeriod, downPct, annRate, loanYrs, closing,
  expIdx, hmAmt, hmRate, capRate, extraPmt, wYears, birthYear, birthMonth,
  appRate, stockCAGR, stockSWR, calcMode, propMode, purchaseYear, purchaseMonth, purchaseDay, alreadyBought,
  investOwn, homeOwn, hmEnabled, investOther, investExtras, landPct, taxRate, arv, refiLtv,
  refiRate, renoAmt, homeInsurance, homeTax, homeUtils, homeMaint, poolRate,
  ffMode, compoundMode, ffIncomeTgt, ffWealthTgt, ffWithdraw, initSavings,
  annualIncome, savingsRate, k401Balance, k401CAGR, k401DrawAge, k401Penalty,
  k401SWR, ssWorkStart, ssClaimAge, bankSavings, cdRate, bankWithdrawPct,
  compoundYears, stockAccount, retireAge, retireManual, savBankPct, savStockPct,
  savREPct, sav401Pct, incomeGrowth, effectiveTax, inflRate, gender, marital,
  dependents, city, currency, vacancyPct, maintMo, mgmtPct, taxMo, insuranceMo,
  utilitiesMo, otherMo, showStockComp, showInflAdj, showNominal, showIncomeLine,
  homeHasLoan, homeDownPct, homeAnnRate, homeLoanYrs, homeClosing, homeRenovation,
  homePurchaseYear, homePurchaseMonth, homeHoa, homeCoopMaint, homeRentMo, homeCostGrowth,
  homePmiRate, expSlider, expDetail, hoaMo, portfolioMode, wantInvest, wantHome, wantFire, introMode,
  modalXtra, userName, propAddress, savInvestPrepay, savHomePrepay,
});

const applyState = (saved) => {
  const S = {
    listP: setListP, saleP: setSaleP, propType: setPropType, mfUnits: setMfUnits,
    unitRents: setUnitRents, homeListP: setHomeListP, homeSaleP: setHomeSaleP,
    homePropType: setHomePropType, homeMfUnits: setHomeMfUnits,
    homeUnitRents: setHomeUnitRents, rentPeriod: setRentPeriod, downPct: setDownPct,
    annRate: setAnnRate, loanYrs: setLoanYrs, closing: setClosing, expIdx: setExpIdx,
    hmAmt: setHmAmt, hmRate: setHmRate, capRate: setCapRate, extraPmt: setExtraPmt,
    wYears: setWYears, birthYear: setBirthYear, birthMonth: setBirthMonth,
    appRate: setAppRate, stockCAGR: setStockCAGR, stockSWR: setStockSWR,
    calcMode: setCalcMode, propMode: setPropMode, purchaseYear: setPurchaseYear,
    purchaseMonth: setPurchaseMonth, purchaseDay: setPurchaseDay, alreadyBought: setAlreadyBought, investOwn: setInvestOwn, homeOwn: setHomeOwn,
    hmEnabled: setHmEnabled, investOther: setInvestOther, investExtras: setInvestExtras, landPct: setLandPct,
    taxRate: setTaxRate, arv: setArv, refiLtv: setRefiLtv, refiRate: setRefiRate,
    renoAmt: setRenoAmt, homeInsurance: setHomeInsurance, homeTax: setHomeTax,
    homeUtils: setHomeUtils, homeMaint: setHomeMaint, poolRate: setPoolRate,
    ffMode: setFfMode, compoundMode: setCompoundMode, ffIncomeTgt: setFfIncomeTgt,
    ffWealthTgt: setFfWealthTgt, ffWithdraw: setFfWithdraw,
    initSavings: setInitSavings, annualIncome: setAnnualIncome,
    savingsRate: setSavingsRate, k401Balance: setK401Balance, k401CAGR: setK401CAGR,
    k401DrawAge: setK401DrawAge, k401Penalty: setK401Penalty, k401SWR: setK401SWR,
    ssWorkStart: setSsWorkStart, ssClaimAge: setSsClaimAge,
    bankSavings: setBankSavings, cdRate: setCdRate,
    bankWithdrawPct: setBankWithdrawPct, compoundYears: setCompoundYears,
    stockAccount: setStockAccount, retireAge: setRetireAge,
    retireManual: setRetireManual, savBankPct: setSavBankPct,
    savStockPct: setSavStockPct, savREPct: setSavREPct, sav401Pct: setSav401Pct,
    incomeGrowth: setIncomeGrowth, effectiveTax: setEffectiveTax,
    inflRate: setInflRate, gender: setGender, marital: setMarital,
    dependents: setDependents, city: setCity, currency: setCurrency,
    vacancyPct: setVacancyPct, maintMo: setMaintMo, mgmtPct: setMgmtPct,
    taxMo: setTaxMo, insuranceMo: setInsuranceMo, utilitiesMo: setUtilitiesMo,
    otherMo: setOtherMo, showStockComp: setShowStockComp,
    showInflAdj: setShowInflAdj, showNominal: setShowNominal,
    showIncomeLine: setShowIncomeLine,
    homeHasLoan: setHomeHasLoan, homeDownPct: setHomeDownPct, homeAnnRate: setHomeAnnRate,
    homeLoanYrs: setHomeLoanYrs, homeClosing: setHomeClosing, homeRenovation: setHomeRenovation,
    homePurchaseYear: setHomePurchaseYear, homePurchaseMonth: setHomePurchaseMonth,
    homeHoa: setHomeHoa, homeCoopMaint: setHomeCoopMaint, homeRentMo: setHomeRentMo,
    homeCostGrowth: setHomeCostGrowth, homePmiRate: setHomePmiRate,
    expSlider: setExpSlider, expDetail: setExpDetail, hoaMo: setHoaMo,
    portfolioMode: setPortfolioMode, wantInvest: setWantInvest, wantHome: setWantHome, wantFire: setWantFire, introMode: setIntroMode,
    modalXtra: setModalXtra, userName: setUserName, propAddress: setPropAddress,
    savInvestPrepay: setSavInvestPrepay, savHomePrepay: setSavHomePrepay,
  };
  for (const [key, setter] of Object.entries(S)) {
    if (saved[key] !== undefined) setter(saved[key]);}
};

const handleCopyExport = useCallback(() => {
  const snap = getStateSnapshot();
  snap._savedAt = new Date().toISOString();
  const text = JSON.stringify(snap);
  try {
    navigator.clipboard.writeText(text).then(() => {
      setSaveMsg("✓ 已复制！粘贴到备忘录保存");
      setTimeout(() => setSaveMsg(""), 3000);
    }).catch(() => {
      // fallback: select textarea content
      setSaveMsg("↑ 请长按上方文本框 → 全选 → 拷贝");});
  } catch(e) {
    setSaveMsg("↑ 请长按上方文本框 → 全选 → 拷贝");}
}, [listP, saleP, propType, mfUnits, unitRents, homeListP, homeSaleP, downPct, annRate, loanYrs, closing, annualIncome, savingsRate, bankSavings, stockAccount, k401Balance, currency, calcMode, compoundMode, birthYear, birthMonth, expIdx, hmAmt, hmRate, capRate, investOwn, homeOwn, hmEnabled, investOther, compoundYears, ffMode, ffIncomeTgt, ffWealthTgt, effectiveTax, inflRate, savREPct, savStockPct, savBankPct, sav401Pct, incomeGrowth, retireAge]);

const handleApplyImport = useCallback(() => {
  try {
    const saved = JSON.parse(importText.trim());
    setSaveModal(null);
    setImportText("");
    setSaveMsg("正在恢复...");
    startTransition(() => {
      applyState(saved);
      setSaveMsg("✓ 已恢复");
      setTimeout(() => setSaveMsg(""), 2000);
    });
  } catch (err) {
    setSaveMsg("✗ 格式错误，请检查粘贴内容");
    setTimeout(() => setSaveMsg(""), 3000);}
}, [importText]);

const toMonthly = (v) => parseFloat(v) || 0;

const computedRent = useMemo(() => {
if (calcMode === "home") return homeUnitRents.reduce((s, r) => s + toMonthly(r), 0);
if (!portfolioMode) return unitRents.reduce((s, r) => s + toMonthly(r), 0);
return portfolio.reduce((total, p) => total + p.unitRents.reduce((s, r) => s + toMonthly(r), 0), 0);
}, [portfolioMode, calcMode, homeUnitRents, unitRents, portfolio]);

const computedRentIncome = useMemo(() => {
if (calcMode === "home") {
const rents = (homePropType === "mf" && homeUnitRents.length > 1) ? homeUnitRents.slice(1) : homeUnitRents;
return rents.reduce((s, r) => s + toMonthly(r), 0);}
if (!portfolioMode) return unitRents.reduce((s, r) => s + toMonthly(r), 0);
return portfolio.reduce((total, p) => total + p.unitRents.reduce((s, r) => s + toMonthly(r), 0), 0);
}, [portfolioMode, calcMode, homePropType, homeUnitRents, unitRents, portfolio]);

const activeSaleP = calcMode === "home" ? homeSaleP : saleP;
const activeListP = calcMode === "home" ? homeListP : listP;
const activePropType = calcMode === "home" ? homePropType : propType;
const activeMfUnits = calcMode === "home" ? homeMfUnits : mfUnits;
const activeUnitRents = calcMode === "home" ? homeUnitRents : unitRents;
const setActiveSaleP = calcMode === "home" ? setHomeSaleP : setSaleP;
const setActiveListP = calcMode === "home" ? setHomeListP : setListP;
const setActivePropType = calcMode === "home" ? setHomePropType : setPropType;
const setActiveMfUnits = calcMode === "home" ? setHomeMfUnits : setMfUnits;
const setActiveUnitRents = calcMode === "home" ? setHomeUnitRents : setUnitRents;

const computedListP = useMemo(() => {
if (calcMode === "home") return parseFloat(homeListP) || 0;
if (!portfolioMode) return parseFloat(listP) || 0;
return portfolio.reduce((s, p) => s + (parseFloat(p.listP) || 0), 0);
}, [portfolioMode, calcMode, homeListP, listP, portfolio]);

const computedSalePTotal = useMemo(() => {
if (calcMode === "home") return parseFloat(homeSaleP) || 0;
if (!portfolioMode) return parseFloat(saleP) || 0;
return portfolio.reduce((s, p) => s + (parseFloat(p.saleP) || 0), 0);
}, [portfolioMode, calcMode, homeSaleP, saleP, portfolio]);

const calc = useMemo(() => {
const lP = computedListP;
const sP = portfolioMode ? computedSalePTotal : pF(saleP);
const dPct = parseFloat(downPct) || 0;
const aR = parseFloat(annRate) || 0;
const lY = parseInt(loanYrs) || 30;
const cl = pF(closing) + pF(investOther) + investExtras.reduce(function(s, e) { return s + (parseFloat(e.amt) || 0); }, 0);
const r = computedRent;
const hm = hmEnabled ? (parseFloat(hmAmt) || 0) : 0;
const hmR = parseFloat(hmRate) || 0;
const cR = parseFloat(capRate) || 0;
const discount = lP - sP;
const discountRate = lP > 0 ? discount / lP : 0;
const ownDown = sP * (dPct / 100);
const loanAmt = Math.max(0, sP - ownDown - hm);
const totalDebt = loanAmt + hm;
const tci = ownDown + cl;
const mPI = monthlyPI(loanAmt, aR, lY);
const annualDS = mPI * 12;
const hmInterest = hm * (hmR / 100);
const hmMonthly = hmInterest / 12;
const totalMonthly = mPI + hmMonthly;
const totalAnnDS = annualDS + hmInterest;
const grossRent = r * 12;
const vacP = parseFloat(vacancyPct) || 0;
const mntMo = parseFloat(maintMo) || 0;
const mgmP = parseFloat(mgmtPct) || 0;
const txMo_ = parseFloat(taxMo) || 0;
const insMo = parseFloat(insuranceMo) || 0;
const utlMo = parseFloat(utilitiesMo) || 0;
const othMo = parseFloat(otherMo) || 0;
const hoaM = parseFloat(hoaMo) || 0;
const customAnnExp = grossRent * (vacP / 100) + grossRent * (mgmP / 100) + (mntMo + txMo_ + insMo + utlMo + othMo + hoaM) * 12;
const customRatio = grossRent > 0 ? Math.min(Math.max(customAnnExp / grossRent, 0), 0.99) : 0;
const expRatio = expIdx === 4 ? customRatio : expIdx === 5 ? (parseInt(expSlider) || 35) / 100 : (EXP_RATIOS[expIdx] ?? 0.40);
const annualExp = grossRent * expRatio;
const noi = grossRent - annualExp;
const netCF = noi - totalAnnDS;
const yr1Principal = loanAmt - loanBal(loanAmt, aR, lY, 1);
const coc = tci > 0 ? netCF / tci : 0;
const cocNoDbt = tci > 0 ? noi / tci : 0;
const eqAdj = tci > 0 ? (netCF + yr1Principal) / tci : 0;
const impliedVal = cR > 0 ? noi / (cR / 100) : 0;
const actualCap = sP > 0 ? noi / sP : 0;
const cocColor = coc >= 0.09 ? C.green : coc >= 0.05 ? C.orange : C.red;
return { discount, discountRate, ownDown, loanAmt, totalDebt, tci, hm, cl, sP, mPI, hmInterest, hmMonthly, totalMonthly, annualDS: annualDS, totalAnnDS, grossRent, annualExp, noi, netCF, yr1Principal, coc, cocNoDbt, eqAdj, impliedVal, actualCap, cocColor, customRatio, expRatio, aR, lY };
}, [computedListP, computedSalePTotal, computedRent, portfolioMode, saleP, downPct, annRate, loanYrs, closing, investOther, expIdx, expSlider, hmAmt, hmRate, hmEnabled, capRate, vacancyPct, maintMo, mgmtPct, taxMo, insuranceMo, utilitiesMo, otherMo]);

const annSavAmt = pF(annualIncome) * pF(savingsRate) / 100;
const xtra = Math.round(annSavAmt * (parseFloat(savInvestPrepay) || 0) / 100 / 12);
const homeXtra = Math.round(annSavAmt * (parseFloat(savHomePrepay) || 0) / 100 / 12);

const prepayCalc = useMemo(() => {
const { loanAmt, aR, lY } = calc;
function amortize(P, annR, yrs, extra) {
const r = annR / 100 / 12, n = yrs * 12, pmt = monthlyPI(P, annR, yrs);
let bal = P, totalInterest = 0, months = 0;
const annualRows = [];
let annPmt = 0, annPrin = 0, annInt = 0, yr = 1;
for (let mo = 1; mo <= n; mo++) {
const interest = bal * r;
const actualPrin = Math.min(Math.max(0, pmt - interest) + extra, bal);
totalInterest += interest;
annPmt += interest + actualPrin; annPrin += actualPrin; annInt += interest;
months++; bal -= actualPrin; if (bal < 0) bal = 0;
if (mo % 12 === 0 || bal === 0) { annualRows.push({ yr, annPmt, annPrin, annInt, endBal: bal }); yr++; annPmt = 0; annPrin = 0; annInt = 0; }
if (bal === 0) break;}
return { months, totalInterest, annualRows };}
const base = amortize(loanAmt, aR, lY, 0);
const withExtra = amortize(loanAmt, aR, lY, xtra);
return { base, withExtra, moSaved: base.months - withExtra.months, intSaved: base.totalInterest - withExtra.totalInterest };
}, [calc, xtra]);
// Years already held — empty purchase year means today (0 years)
const investHeld = useMemo(() => {
  if (!alreadyBought || !purchaseYear) return 0;
  var py = parseInt(purchaseYear)||2026, pm = parseInt(purchaseMonth)||1, pd = parseInt(purchaseDay)||15;
  // Mid-month: if close >= 15th, first payment = 2 months later; < 15th, first payment = next month
  var firstPmtMo = pd >= 15 ? pm + 1 : pm;
  var firstPmtYr = py; if (firstPmtMo > 12) { firstPmtMo -= 12; firstPmtYr++; }
  var now = new Date(); var nowY = now.getFullYear(), nowM = now.getMonth() + 1;
  var monthsPaid = (nowY - firstPmtYr) * 12 + (nowM - firstPmtMo);
  return Math.max(0, monthsPaid / 12);
}, [alreadyBought, purchaseYear, purchaseMonth, purchaseDay]);
const homeHeld = useMemo(() => homePurchaseYear ? Math.max(0, (2026 + 4/12) - (parseInt(homePurchaseYear)||2026) - ((parseInt(homePurchaseMonth)||1)-1)/12) : 0, [homePurchaseYear, homePurchaseMonth]);
// Adjusted investment equity (accounting for appreciation + loan paydown)
const investCurrentVal = (parseFloat(saleP)||0) * Math.pow(1 + (parseFloat(appRate)||3)/100, investHeld);
const investCurrentBal = investHeld > 0 ? loanBal(calc.loanAmt, parseFloat(annRate)||0, parseInt(loanYrs)||30, investHeld) : calc.loanAmt;
const investAdjEquity = investCurrentVal - investCurrentBal;
// Home monthly costs (split for payoff logic)
const homePI = useMemo(() => {
  if (!wantHome || !homeHasLoan) return 0;
  const hSP = parseFloat(homeSaleP) || 0;
  const hDown = hSP * (pF(homeDownPct) || 20) / 100;
  const hLoan = hSP - hDown;
  const hR = (pF(homeAnnRate) || 6.75) / 100 / 12;
  const hN = (pI(homeLoanYrs) || 30) * 12;
  return hLoan > 0 && hR > 0 ? hLoan * hR / (1 - Math.pow(1 + hR, -hN)) : 0;
}, [wantHome, homeHasLoan, homeSaleP, homeDownPct, homeAnnRate, homeLoanYrs]);
const homeFixed = useMemo(() => {
  const hSP = parseFloat(homeSaleP) || 0;
  const tax = pF(homeTax) || (homePropType !== "coop" ? Math.round(hSP * 0.011 / 12) : 0);
  const ins = pF(homeInsurance) || (homePropType === "coop" ? 50 : Math.round(hSP * 0.004 / 12));
  const util = pF(homeUtils) || (homePropType === "coop" ? 100 : homePropType === "condo" ? 150 : 200);
  const maint = pF(homeMaint) || (homePropType === "coop" ? 0 : homePropType === "condo" ? Math.round(hSP * 0.005 / 12) : Math.round(hSP * 0.01 / 12));
  const coopM = homePropType === "coop" ? pF(homeCoopMaint) || Math.round(hSP * 0.008 / 12 + 500) : 0;
  const hoa = parseFloat(homeHoa) || 0;
  return homePropType === "coop" ? coopM + ins + util : tax + ins + util + maint + hoa;
}, [homeTax, homeInsurance, homeUtils, homeMaint, homeHoa, homeSaleP, homePropType, homeCoopMaint]);
const homeMonthlyBurden = useMemo(() => wantHome ? homePI + homeFixed : 0, [wantHome, homePI, homeFixed]);
// Actual payoff years (with extra payments)
const calcPayoffYrs = (loan, annR, termYrs, extra) => {
  if (loan <= 0 || annR <= 0) return termYrs;
  const r = annR / 100 / 12;
  const pi = loan * r / (1 - Math.pow(1 + r, -(termYrs * 12)));
  const totalPmt = pi + extra;
  if (totalPmt <= loan * r) return termYrs;
  const n = -Math.log(1 - loan * r / totalPmt) / Math.log(1 + r);
  return Math.min(termYrs, n / 12);
};
const investPayoffYrs = useMemo(() => calcPayoffYrs(calc.loanAmt, parseFloat(annRate)||0, parseInt(loanYrs)||30, xtra), [calc.loanAmt, annRate, loanYrs, xtra]);
const homePayoffYrs = useMemo(() => homeHasLoan ? calcPayoffYrs(
  (parseFloat(homeSaleP)||0) * (1 - (parseFloat(homeDownPct)||20)/100),
  parseFloat(homeAnnRate)||6.75, parseInt(homeLoanYrs)||30, homeXtra
) : 0, [homeHasLoan, homeSaleP, homeDownPct, homeAnnRate, homeLoanYrs, homeXtra]);
const homeLoanTermYrs = useMemo(() => homePayoffYrs > 0 ? homePayoffYrs : parseInt(homeLoanYrs) || 30, [homePayoffYrs, homeLoanYrs]);
const wealthSim = useMemo(() => {
const { coc, cocNoDbt, tci, loanAmt, aR, lY, sP } = calc;
const wY = parseInt(wYears) || 30;
const uAge = parseInt(userAge) || 30;
if (wY <= 0) return { rows: [], freedomYear: null, freedomAge: null, ssEstimate: 0 };
const aR2 = parseFloat(appRate) || 3;
const sg = parseFloat(stockCAGR) / 100 || 0.08;
const stockSwr = parseFloat(stockSWR) / 100 || 0.04;
const pr = parseFloat(poolRate) / 100 || 0.04;
const ffInc = parseFloat(ffIncomeTgt) || 0;
const ffWlth = parseFloat(ffWealthTgt) || 0;
const eTax = parseFloat(effectiveTax) / 100 || 0.15;
const initS = parseFloat(bankSavings) || 0;
const baseAnnS = pF(annualIncome) * pF(savingsRate) / 100;
const incGr = parseFloat(incomeGrowth) / 100 || 0.03;
const rAge = Math.max(parseInt(retireAge) || 70, uAge + 1);
const k401B = parseFloat(k401Balance) || 0;
const k401g = parseFloat(k401CAGR) / 100 || 0.08;
const k401dAge = parseInt(k401DrawAge) || 60;
const k401swr = parseFloat(k401SWR) / 100 || 0.04;
const ssWS = parseInt(ssWorkStart) || 25;
const ssCa = parseInt(ssClaimAge) || 67;
const grossInc = parseFloat(annualIncome) || 0;
const workYrs = Math.max(0, Math.min(uAge - ssWS, 35));
const aime = workYrs > 0 ? (grossInc * workYrs / 35) / 12 : 0;
const pia = aime <= 0 ? 0 : aime <= 1115 ? aime * 0.90 : aime <= 6721 ? 1115 * 0.90 + (aime - 1115) * 0.32 : 1115 * 0.90 + 5606 * 0.32 + (aime - 6721) * 0.15;
const claimAdj = ssCa >= 70 ? 1.24 : ssCa >= 67 ? 1 + (ssCa - 67) * 0.08 : ssCa >= 62 ? Math.max(0.70, 1 - (67 - ssCa) * 0.067) : 0.70;
const ssEstimate = Math.round(pia * claimAdj);
const dPctW = parseFloat(downPct) / 100 || 0.25;
const invOwnPct = (parseFloat(investOwn) || 100) / 100;
const isIndexMode = compoundMode === "index" || !wantInvest;
const isMixMode = compoundMode === "mix";
const indexCAGR = parseFloat(stockCAGR) / 100 || 0.08;
let cashPool = initS, units = isIndexMode ? 0 : 1, cumulativeCF = 0, k401Val = k401B;
let indexPool = isIndexMode ? (tci > 0 ? tci : initS) : 0;
let stockPool = parseFloat(stockAccount) || 0;
const purchases = isIndexMode ? [] : [{ buyYr: -investHeld, purchaseSP: sP, pLoan: loanAmt, tciPaid: tci }];
const rows = [];
let freedomYear = null;
for (let yr = 1; yr <= wY; yr++) {
const age = uAge + yr;
const userRetired = age >= rAge;
const annS = baseAnnS * Math.pow(1 + incGr, yr);
const rePct = parseFloat(savREPct)||0, stPct = parseFloat(savStockPct)||0, bkPct = parseFloat(savBankPct)||0, k4Pct = parseFloat(sav401Pct)||0;
const annToRE = annS * rePct / 100, annToStock = annS * stPct / 100, annToBank = annS * bkPct / 100, annTo401 = annS * k4Pct / 100;
const curSP = sP * Math.pow(1 + aR2 / 100, yr);
const curOwnDown = curSP * dPctW;
const curPLoan = Math.max(0, curSP - curOwnDown - (parseFloat(hmAmt) || 0));
const curTCI = curOwnDown + pF(closing);
k401Val = k401Val * (1 + k401g) + (userRetired ? 0 : annTo401);
let k401AnnIncome = 0;
const earlyOK = k401Penalty && age >= 55;
const normalOK = age >= k401dAge;
if ((normalOK || earlyOK) && k401Val > 0 && userRetired) {
const gross = k401Val * k401swr;
const penalty = (!normalOK && earlyOK) ? 0.10 : 0;
k401AnnIncome = gross * (1 - penalty);
k401Val = Math.max(0, k401Val - gross);}
const ssAnnIncome = age >= ssCa ? ssEstimate * 12 : 0;
let annCF, netWorth, yearStockDiv = 0;
if (isIndexMode) {
indexPool = indexPool * (1 + indexCAGR) + (userRetired ? 0 : annToStock);
cashPool = cashPool * (1 + pr) + (userRetired ? 0 : annToBank) + k401AnnIncome + ssAnnIncome;
const indexDiv = indexPool * 0.04;
annCF = indexDiv;
if (userRetired) { indexPool = Math.max(0, indexPool - indexDiv); cashPool += indexDiv; cashPool -= (indexDiv + k401AnnIncome + ssAnnIncome); }
netWorth = indexPool + cashPool + k401Val;
} else if (isMixMode) {
stockPool = stockPool * (1 + indexCAGR) + (userRetired ? 0 : annToStock);
const stockDiv = userRetired ? stockPool * 0.04 : 0;
yearStockDiv = stockDiv;
if (userRetired) stockPool = Math.max(0, stockPool - stockDiv);
annCF = purchases.reduce(function(sum, p) { var held = yr - p.buyYr; return sum + p.tciPaid * (held >= investPayoffYrs ? cocNoDbt : coc); }, 0) * invOwnPct;
const grossPsvAnn = annCF + stockDiv + k401AnnIncome + ssAnnIncome;
cashPool = cashPool * (1 + pr) + annCF + stockDiv + (userRetired ? 0 : (annToRE + annToBank)) + k401AnnIncome + ssAnnIncome;
if (userRetired) { cashPool -= grossPsvAnn; }
else { while (cashPool >= curTCI * invOwnPct && units < 500) { cashPool -= curTCI * invOwnPct; units++; purchases.push({ buyYr: yr, purchaseSP: curSP, pLoan: curPLoan, tciPaid: curTCI }); } }
let totalMV = 0, totalDebtW = 0;
for (const p of purchases) { const held = yr - p.buyYr; totalMV += p.purchaseSP * Math.pow(1 + aR2 / 100, held); totalDebtW += (held >= investPayoffYrs) ? 0 : loanBal(p.pLoan, aR, lY, held); }
netWorth = (totalMV - totalDebtW) * invOwnPct + cashPool + k401Val + stockPool;
} else {
stockPool = stockPool * (1 + indexCAGR) + (userRetired ? 0 : annToStock);
const stockDiv = userRetired ? stockPool * 0.04 : 0;
yearStockDiv = stockDiv;
if (userRetired) stockPool = Math.max(0, stockPool - stockDiv);
annCF = purchases.reduce(function(sum, p) { var held = yr - p.buyYr; return sum + p.tciPaid * (held >= investPayoffYrs ? cocNoDbt : coc); }, 0) * invOwnPct;
const grossPsvAnn = annCF + stockDiv + k401AnnIncome + ssAnnIncome;
cashPool = cashPool * (1 + pr) + annCF + stockDiv + (userRetired ? 0 : (annToRE + annToBank)) + k401AnnIncome + ssAnnIncome;
if (userRetired) { cashPool -= grossPsvAnn; }
else { while (cashPool >= curTCI * invOwnPct && units < 500) { cashPool -= curTCI * invOwnPct; units++; purchases.push({ buyYr: yr, purchaseSP: curSP, pLoan: curPLoan, tciPaid: curTCI }); } }
let totalMV = 0, totalDebtW = 0;
for (const p of purchases) { const held = yr - p.buyYr; totalMV += p.purchaseSP * Math.pow(1 + aR2 / 100, held); totalDebtW += (held >= investPayoffYrs) ? 0 : loanBal(p.pLoan, aR, lY, held); }
netWorth = (totalMV - totalDebtW) * invOwnPct + cashPool + k401Val + stockPool;}
cumulativeCF += annCF;
// Theoretical passive income = what you'd earn IF you retired this year
const theoStockDiv = stockPool * 0.04;
const theoK401 = (age >= (parseInt(k401DrawAge)||60)) ? k401Val * (parseFloat(k401SWR)/100||0.04) : 0;
const theoSS = (age >= (parseInt(ssClaimAge)||67)) ? (ssEstimate || 0) : 0;
const theoBankInt = cashPool * (pr > 0 ? pr : 0.02);
const monthlyTotalPsv = (annCF + (userRetired ? yearStockDiv : theoStockDiv) + (userRetired ? k401AnnIncome : theoK401) + (userRetired ? ssAnnIncome : theoSS) + theoBankInt) / 12;
const dynHomeBurden = wantHome ? ((homeHeld + yr < homeLoanTermYrs) ? homePI + homeFixed : homeFixed) : 0;
const effectivePsv = monthlyTotalPsv - dynHomeBurden;
const monthlyRE = isIndexMode ? 0 : annCF / 12;
const actualStockPool = isIndexMode ? indexPool : stockPool;
const prevStock = rows.length > 0 ? rows[rows.length - 1].stockValue : (isIndexMode ? (tci > 0 ? tci : initS) : parseFloat(stockAccount)||0);
const stockGrown = prevStock * (1 + sg);
const stockWithdraw = userRetired ? prevStock * stockSwr : 0;
const stockValue = isIndexMode ? indexPool : Math.max(0, stockGrown - stockWithdraw);
// Home equity for wealth check
let homeEqAtYr = 0;
if (wantHome) {
  const hSP2 = parseFloat(homeSaleP) || 0;
  const hDP2 = (parseFloat(homeDownPct)||20)/100;
  const hLoan2 = homeHasLoan ? hSP2 * (1 - hDP2) : 0;
  const hAppR = (parseFloat(appRate)||3) / 100;
  const hAR2 = (parseFloat(homeAnnRate)||6.75) / 100 / 12;
  const hLY2 = (parseInt(homeLoanYrs)||30) * 12;
  const totalYrs = homeHeld + yr;
  const hBal = hLoan2 > 0 && hAR2 > 0 ? hLoan2 * (Math.pow(1+hAR2, hLY2) - Math.pow(1+hAR2, Math.min(totalYrs*12, hLY2))) / (Math.pow(1+hAR2, hLY2) - 1) : 0;
  homeEqAtYr = hSP2 * Math.pow(1 + hAppR, totalYrs) - Math.max(0, hBal);}
const nwWithHome = netWorth + Math.max(0, homeEqAtYr) * invOwnPct;
if (freedomYear === null && !userRetired) {
const byIncome = ffMode === "income" && ffInc > 0 && effectivePsv >= ffInc;
const byWealth = ffMode === "wealth" && ffWlth > 0 && nwWithHome >= ffWlth;
if (byIncome || byWealth) freedomYear = yr;}
const inRetirement = userRetired;
const inflD = Math.pow(1 + (parseFloat(inflRate)||2)/100, yr);
var evts = [];
var prevU = yr > 1 && rows.length > 0 ? rows[rows.length-1].units || 1 : (isIndexMode ? 0 : 1);
if (units > prevU) evts.push("购入第"+units+"套房");
if (wantInvest && yr === Math.ceil(investPayoffYrs - investHeld) && investPayoffYrs < 90) evts.push("投资房清贷·被动收入↑");
if (wantHome && homeHasLoan && yr === Math.ceil(homePayoffYrs - homeHeld) && homePayoffYrs < 90) evts.push("自住房清贷·月支出↓");
if (age === (parseInt(k401DrawAge)||60)) evts.push(""+retLabel+"可提取");
if (age === (parseInt(ssClaimAge)||67)) evts.push(""+ssLabel+"开始领取");
if (freedomYear === yr) evts.push("FIRE达成");
rows.push({ yr, age, units, cashPool, cashReal: cashPool / inflD, k401Val, netWorth: nwWithHome, cumulativeCF, stockValue, monthlyRE, k401AnnIncome, ssAnnIncome, monthlyTotalPsv: effectivePsv, annPsv: effectivePsv * 12, psvReal: effectivePsv / inflD, annPsvReal: effectivePsv * 12 / inflD, inRetirement, netWorthPre: !userRetired ? nwWithHome : null, netWorthPost: userRetired ? nwWithHome : null, nwReal: nwWithHome / inflD, homeMonthlyBurden: dynHomeBurden, events: evts });
}
let theoFireYear = null;
if (freedomYear === null) {
let cp2 = parseFloat(bankSavings) || 0, u2 = isIndexMode ? 0 : 1, ip2 = isIndexMode ? (tci > 0 ? tci : cp2) : 0;
const purchases2 = isIndexMode ? [] : [{ tciPaid: tci }];
for (let yr2 = 1; yr2 <= wY; yr2++) {
const annS2 = baseAnnS * Math.pow(1 + incGr, yr2);
const curTCI2 = (sP * Math.pow(1 + aR2/100, yr2)) * dPctW + (parseFloat(closing)||0);
if (isIndexMode) {
ip2 = ip2 * (1 + (parseFloat(stockCAGR)/100||0.08)) + annS2;
const div2 = ip2 * 0.04;
if (ffMode === "income" && ffInc > 0 && div2/12 - ((homeHeld + yr2 < homeLoanTermYrs) ? homePI + homeFixed : homeFixed) >= ffInc) { theoFireYear = yr2; break; }
if (ffMode === "wealth" && ffWlth > 0 && ip2 + cp2 >= ffWlth) { theoFireYear = yr2; break; }
} else {
const annCF2 = purchases2.reduce(function(s,p) { return s + p.tciPaid * (yr2 >= investPayoffYrs ? cocNoDbt : coc); }, 0) * invOwnPct;
cp2 = cp2 * (1+pr) + annCF2 + annS2;
while (cp2 >= curTCI2 * invOwnPct && u2 < 500) { cp2 -= curTCI2 * invOwnPct; u2++; purchases2.push({ tciPaid: curTCI2 }); }
const annCF2b = purchases2.reduce(function(s,p) { return s + p.tciPaid * (yr2 >= investPayoffYrs ? cocNoDbt : coc); }, 0) * invOwnPct;
const nw2 = cp2;
if (ffMode === "income" && ffInc > 0 && annCF2b/12 - ((homeHeld + yr2 < homeLoanTermYrs) ? homePI + homeFixed : homeFixed) >= ffInc) { theoFireYear = yr2; break; }
if (ffMode === "wealth" && ffWlth > 0 && nw2 >= ffWlth) { theoFireYear = yr2; break; }}
}}
const finalFireYear = freedomYear || theoFireYear;
return { rows, freedomYear: finalFireYear, freedomAge: finalFireYear ? uAge + finalFireYear : null, ssEstimate };
}, [calc, wYears, userAge, appRate, downPct, hmAmt, closing, stockCAGR, stockSWR, poolRate, ffMode, ffIncomeTgt, ffWealthTgt, ffWithdraw, annualIncome, savingsRate, k401Balance, k401CAGR, k401DrawAge, k401Penalty, k401SWR, ssWorkStart, ssClaimAge, investOwn, retireAge, incomeGrowth, effectiveTax, compoundMode, inflRate, savREPct, savStockPct, savBankPct, sav401Pct, wantInvest, wantHome, homeSaleP, homeMonthlyBurden, homeHasLoan, homeDownPct, homeAnnRate, homeLoanYrs, investHeld, homeHeld, homePI, homeFixed, homeLoanTermYrs, investPayoffYrs, homePayoffYrs]);

const { discount, discountRate, ownDown, loanAmt, totalDebt, tci, hm, cl, sP, mPI, hmInterest, hmMonthly, totalMonthly, totalAnnDS, grossRent, annualExp, noi, netCF, yr1Principal, coc, eqAdj, impliedVal, actualCap, cocColor, customRatio } = calc;
const eqAdjColor = eqAdj >= 0.09 ? C.green : eqAdj >= 0.05 ? C.orange : C.red;

// Top-level deal score for hero card
const norm = (v, low, high) => Math.max(0, Math.min(100, ((v - low) / (high - low)) * 100));
const dscr0 = noi > 0 && totalAnnDS > 0 ? noi / totalAnnDS : 0;
const irrEst = tci > 0 ? (netCF + yr1Principal + sP * 0.03) / tci : 0;
const beOcc0 = grossRent > 0 ? (annualExp + totalAnnDS) / grossRent : 0;
const dealScores = [norm(coc, 0, 0.12), norm(dscr0, 0.8, 1.5), norm(eqAdj, 0, 0.15), norm(irrEst, 0, 0.25), norm(beOcc0, 1.0, 0.5), norm(actualCap, 0.02, 0.10)];
const dealAvg = Math.round(dealScores.reduce((a, b) => a + b, 0) / 6);
const dealGrade = dealAvg >= 90 ? "A+" : dealAvg >= 80 ? "A" : dealAvg >= 70 ? "A-" : dealAvg >= 60 ? "B+" : dealAvg >= 50 ? "B" : dealAvg >= 40 ? "B-" : dealAvg >= 25 ? "C" : "D";
const dealDesc = dealAvg >= 90 ? "极品 Excellent" : dealAvg >= 80 ? "优质 Great" : dealAvg >= 70 ? "良好 Good" : dealAvg >= 60 ? "可考虑 Fair" : dealAvg >= 50 ? "一般 Average" : dealAvg >= 40 ? "偏弱 Weak" : dealAvg >= 25 ? "谨慎 Caution" : "高风险 Risky";
const dealColor = dealAvg >= 80 ? C.green : dealAvg >= 70 ? "#4E9A6A" : dealAvg >= 60 ? "#8A6D1F" : dealAvg >= 50 ? C.orange : dealAvg >= 40 ? "#B35C1E" : C.red;
const { rows: wealthRows, freedomYear, freedomAge, ssEstimate } = wealthSim;
const lastW = wealthRows[wealthRows.length - 1] || null;
const fireRow = freedomYear ? wealthRows.find(d => d.yr === freedomYear) : null;

// Sync expIdx → expSlider
useEffect(() => {
if (expIdx >= 0 && expIdx <= 3) setExpSlider(String(Math.round(EXP_RATIOS[expIdx] * 100)));
}, [expIdx]);

const bankCompare = useMemo(() => {
const principal = parseFloat(bankSavings) || 0;
const cd = parseFloat(cdRate) / 100 || 0.04;
const sg = parseFloat(stockCAGR) / 100 || 0.08;
const reCoc = coc > 0 ? coc : 0.08;
const yrs = parseInt(compoundYears) || 30;
const rows = [];
let bankVal = principal, stockVal = principal, reVal = principal;
for (let yr = 1; yr <= yrs; yr++) {
bankVal = bankVal * (1 + cd);
stockVal = stockVal * (1 + sg);
reVal = reVal * (1 + reCoc) + reVal * reCoc * 0.3;
rows.push({ yr, age: (pI(userAge) || 30) + yr, bankVal, stockVal, reVal });}
const last = rows[rows.length - 1] || { bankVal: principal, stockVal: principal, reVal: principal };
return { rows, principal, last, bankGain: last.bankVal - principal, stockGain: last.stockVal - principal, reGain: last.reVal - principal };
}, [bankSavings, cdRate, stockCAGR, coc, compoundYears, userAge]);

const homeSim = useMemo(() => {
const hSP = parseFloat(homeSaleP) || 0;
if (hSP <= 0) return [];
const hDP = (pF(homeDownPct) || 20) / 100;
const hLoan = homeHasLoan ? hSP * (1 - hDP) : 0;
const hAR = parseFloat(homeAnnRate) || 6.75;
const hLY = parseInt(homeLoanYrs) || 30;
const hR = hAR / 100 / 12;
const hN = hLY * 12;
const hPI = hLoan > 0 && hR > 0 ? hLoan * hR / (1 - Math.pow(1 + hR, -hN)) : 0;
const aR2 = parseFloat(appRate) || 3;
const yrs = Math.min(parseInt(wYears) || 30, 80);
const uAge = parseInt(userAge) || 30;
const hXtra = modalXtra || 0;
const buyYr = alreadyBought && purchaseYear ? parseInt(purchaseYear) || 2026 : 2026;
const heldYrs = Math.max(0, 2026 - buyYr);
const totalYrs = heldYrs + yrs;
const cgRate = (pF(homeCostGrowth) || 3) / 100;
const rows = [];
var balBase = hLoan, balPrepay = hLoan;
for (var yr = 0; yr <= totalYrs; yr++) {
  var homeVal = hSP * Math.pow(1 + aR2 / 100, yr);
  var isHeld = yr < heldYrs;
  var yrsFrom26 = Math.max(0, yr - heldYrs);
  var gm = Math.pow(1 + cgRate, yrsFrom26);
  var piCost = balPrepay > 0.01 ? hPI : 0;
  rows.push({ yr: yr, age: uAge - heldYrs + yr, calYr: buyYr + yr, held: isHeld, homeVal: homeVal, debt: Math.max(0, balPrepay), debtBase: Math.max(0, balBase), equity: homeVal - Math.max(0, balPrepay), cPI: piCost, cFixed: Math.round(homeFixed * gm) - piCost > 0 ? Math.round((homeFixed - piCost > 0 ? homeFixed - piCost : homeFixed) * gm) : Math.round(homeFixed * gm) });
  if (yr < totalYrs) {
    for (var mo = 0; mo < 12; mo++) {
      if (balBase > 0.01) { var intB = balBase * hR; balBase = Math.max(0, balBase - Math.max(0, hPI - intB)); }
      if (balPrepay > 0.01) { var intP = balPrepay * hR; balPrepay = Math.max(0, balPrepay - Math.max(0, hPI - intP) - (isHeld ? 0 : hXtra)); }}
  }}
return rows;
}, [homeSaleP, homeDownPct, homeHasLoan, homeAnnRate, homeLoanYrs, appRate, wYears, userAge, modalXtra, alreadyBought, purchaseYear, homeFixed, homeCostGrowth]);

const sec = () => ({ background: C.surface, borderRadius: 0, padding: "8px 2px 8px", marginBottom: 6, overflow: "hidden", borderTop: "1px solid " + C.rule });

const overlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(18,18,18,0.55)", zIndex: 10, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto" };
const mBox = { background: C.surface, borderRadius: 0, borderTop: "4px solid #121212", padding: "16px 16px 18px", width: "calc(100% - 24px)", maxWidth: 520, margin: "40px 12px 24px", boxSizing: "border-box" };
if (!showReport) {
  const fi = (label, val, setter, ph, pfx) => (
    <div style={{ marginBottom: 8, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: C.sub, marginBottom: 2, letterSpacing: "0.01em" }}>{label}</div>
      <div style={GOLD}>
        {pfx && <span style={{ color: C.muted, fontSize: 14, marginRight: 4, fontWeight: 500 }}>{pfx}</span>}
        <input type="text" value={val} onChange={e => setter(e.target.value.replace(/,/g, ""))} placeholder={ph} style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#121212", fontSize: 14, fontFamily: "inherit", fontWeight: 600, boxSizing: "border-box" }} />
      </div></div>);
  const fs2 = (label, val, setter, opts) => (
    <div style={{ marginBottom: 8, flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: C.sub, marginBottom: 2 }}>{label}</div>
      <select value={val} onChange={e => setter(e.target.value)} style={{ width: "100%", height: 38, fontSize: 13, fontWeight: 600, fontFamily: "inherit", border: "1px solid " + C.border, borderRadius: 0, background: "#fff", color: "#121212", padding: "0 8px", cursor: "pointer", boxSizing: "border-box" }}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select></div>);
  return (
    <div className={"page-enter" + (introMode ? "" : " qj-landing")} style={{ maxWidth: introMode ? 430 : undefined, margin: "0 auto", background: "#FFFFFF", minHeight: "100vh", fontFamily: 'var(--nyt-sans)', color: C.text, WebkitFontSmoothing: "antialiased", padding: "0", boxSizing: "border-box" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .sec-anim { animation: fadeUp 0.5s ease-out both; }
        .page-enter { animation: slideIn 0.35s ease-out both; }
        .btn3d { transition: transform 0.15s, box-shadow 0.15s; }
        .btn3d:active { transform: translateY(1px); }
        .btn3d:hover { background: #333333 !important; }
        .qj-story:hover h2 { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
        .qj-landing { max-width: 430px; }
        @media (min-width: 880px) {
          .qj-landing { max-width: 980px; }
          .qj-mast-title { font-size: 64px !important; }
          .qj-stories { display: grid; grid-template-columns: 2fr 1fr; column-gap: 28px; }
          .qj-stories article:first-child { grid-row: span 2; border-right: 1px solid #DFDFDF; padding-right: 28px !important; }
          .qj-stories article:nth-child(2) { border-top: none !important; padding-top: 4px !important; }
          .qj-stories article:first-child h2 { font-size: 36px !important; }
          .qj-stories article:first-child p { font-size: 17px !important; }
        }
      `}</style>
      {/* Masthead — NYT style */}
      {(() => { const _d = new Date(); const dateStr = _d.getFullYear() + "年" + (_d.getMonth() + 1) + "月" + _d.getDate() + "日 星期" + "日一二三四五六"[_d.getDay()];
      const tBtn = { background: "transparent", border: "none", padding: "0 0 0 10px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, color: C.sub, height: 24 };
      return <header style={{ padding: "8px 14px 0", marginBottom: 14, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: C.sub, fontWeight: 600, paddingBottom: 6 }}>
          <span>{dateStr}</span>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button onClick={() => { handleCopyExport(); setSaveMsg("✓ 已保存到剪贴板"); setTimeout(() => setSaveMsg(""), 2000); }} style={tBtn}>存档</button>
            <button onClick={() => setSaveModal("import")} style={tBtn}>读档</button>
            <button onClick={autoDetectCity} style={{ ...tBtn, color: geoStatus === "done" ? C.green : geoStatus === "denied" ? C.red : C.sub }}>{geoStatus === "loading" ? "定位中…" : geoStatus === "done" ? city.split(" ")[0].slice(0, 8) : geoStatus === "denied" ? "定位失败" : "定位"}</button>
            <select aria-label="货币" value={currency} onChange={function(e) { setCurrency(e.target.value); }} style={{ marginLeft: 8, height: 24, fontSize: 11, fontWeight: 600, fontFamily: "inherit", border: "1px solid " + C.borderIn, borderRadius: 0, background: "#fff", color: C.text, padding: "0 2px", cursor: "pointer" }}>
              {Object.keys(FX).map(function(c) { return <option key={c} value={c}>{CUR_SYM[c]} {c}</option>; })}
            </select></div></div>
        {saveMsg && <span role="status" style={{ fontSize: 11, fontWeight: 600, color: C.green, position: "absolute", top: 36, right: 14, background: "#fff", padding: "3px 8px", border: "1px solid " + C.border }}>{saveMsg}</span>}
        <div onClick={function() { setIntroMode(""); }} style={{ textAlign: "center", borderTop: "1px solid " + C.border, paddingTop: introMode ? 8 : 16, paddingBottom: introMode ? 6 : 10, cursor: introMode ? "pointer" : "default" }}>
          <div className={introMode ? "" : "qj-mast-title"} style={{ fontFamily: C.serif, fontWeight: 900, fontSize: introMode ? 28 : 46, lineHeight: 1, letterSpacing: "0.06em", color: C.text }}>钱景</div>
          <div style={{ fontFamily: "UnifrakturMaguntia, 'Old English Text MT', serif", fontSize: introMode ? 15 : 22, lineHeight: 1.3, color: C.text, marginTop: introMode ? 2 : 6 }}>The QianJing</div>
          {!introMode && <div style={{ fontFamily: C.serif, fontStyle: "italic", fontSize: 12, color: C.sub, marginTop: 6 }}>财务自由规划 · 房产投资分析 · 自住房分析</div>}
        </div>
        <div style={{ borderTop: "1px solid " + C.rule, borderBottom: "3px double " + C.rule, display: "flex", justifyContent: "center" }}>
          {[["home", "自住房"], ["invest", "房产投资"], ["fire", "FIRE 财务自由"]].map(function(t, i) { var on = introMode === t[0]; return (
            <button key={t[0]} onClick={function() { setIntroMode(t[0]); if (t[0] === "fire") setWantFire(true); }} style={{ background: "transparent", border: "none", borderLeft: i ? "1px solid " + C.border : "none", padding: "0 14px", height: 32, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: on ? 800 : 600, color: C.text, textDecoration: on ? "underline" : "none", textUnderlineOffset: 5, textDecorationThickness: 2 }}>{t[1]}</button>); })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, paddingTop: 4 }}>
          <span>by JMJ Invest LLC</span><span>{introMode ? "" : "三个工具 · 免费使用"}</span></div>
      </header>; })()}
  {/* Landing — story list */}
  {!introMode && <main className="sec-anim qj-stories" style={{ margin: "0 14px 8px" }}>
    {[
      { k: "fire", kicker: "FIRE 财务自由", h: "离财务自由还有几年？把收入、存款、股票和房产放进同一张时间表", d: "按你的年龄、储蓄率和资产配置逐年推演净资产与被动收入，看被动收入哪一年能盖过生活开支。", lead: true },
      { k: "invest", kicker: "房产投资", h: "这套房值不值得买？现金流与回报率一页算清", d: "输入挂牌价、租金与贷款条件，得到每月现金流、Cap Rate、现金回报率和持有多年后的总回报。" },
      { k: "home", kicker: "自住房", h: "买房自住，每月到底花多少？", d: "月供、地税、保险、维修与机会成本一起算，再看房价增值之后的净资产变化。" },
    ].map(function(st, i) { return (
      <article key={st.k} className="qj-story" role="link" tabIndex={0} onKeyDown={function(e) { if (e.key === "Enter") { setIntroMode(st.k); if (st.k === "fire") setWantFire(true); } }} onClick={function() { setIntroMode(st.k); if (st.k === "fire") setWantFire(true); }} style={{ cursor: "pointer", padding: st.lead ? "4px 0 14px" : "12px 0", borderTop: i ? "1px solid " + C.border : "none" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.sub, marginBottom: 4 }}>{st.kicker}</div>
        <h2 style={{ fontFamily: C.serif, fontWeight: 700, fontSize: st.lead ? 24 : 18, lineHeight: 1.25, color: C.text, margin: 0 }}>{st.h}</h2>
        <p style={{ fontFamily: C.serif, fontSize: st.lead ? 14 : 13, lineHeight: 1.55, color: C.sub, margin: "6px 0 6px" }}>{st.d}</p>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>开始分析 →</span>
        {st.lead && <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
          {["薪资、股票、存款、401K 与社保五条收入线逐年合并", "可选把投资房的正现金流滚动复投", "支持 9 种货币与各地退休金制度名称"].map(function(t) { return <li key={t} style={{ fontFamily: C.serif, fontSize: 13, lineHeight: 1.5, color: C.sub, padding: "7px 0", borderTop: "1px solid " + C.border }}>{t}</li>; })}
        </ul>}
      </article>); })}
  </main>}
  {/* Back link when in a mode */}
  {introMode && <div style={{ margin: "-6px 14px 10px" }}>
    <button onClick={function() { setIntroMode(""); setShowReport(false); }} style={{ padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, border: "none", background: "transparent", color: C.blue }}>← 返回首页</button>
  </div>}
  {/* FIRE Mode */}
  {introMode === "fire" && <>
      <div className="sec-anim" style={{ background: "#fff", borderRadius: 0, padding: "4px 0 8px", margin: "0 14px 10px", boxShadow: "none", animationDelay: "0.1s" }}>
        {/* Investment Path Selection */}
        <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: C.serif, color: C.text, margin: "0 0 10px" }}>投资路径</h2>
        <div style={FG8}>
          <div onClick={function() { setWantInvest(false); }} style={{ flex: 1, aspectRatio: "1", borderRadius: 0, cursor: "pointer", padding: "10px 8px", border: wantInvest ? "1px solid " + C.border : "2px solid #121212", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, opacity: wantInvest ? 0.6 : 1, transition: "all 0.2s" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: C.serif, color: wantInvest ? C.sub : C.text, textAlign: "center" }}>纯股票+存款</div>
            <div style={{ fontSize: 10, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>薪资储蓄 → 股票复利<br/>+ 银行存款利息<br/>+ 401K/退休账户</div>
            {!wantInvest && <div style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: "#121212", borderRadius: 0, padding: "1px 6px" }}>当前选择</div>}
          </div>
          <div onClick={function() { setWantInvest(true); }} style={{ flex: 1, aspectRatio: "1", borderRadius: 0, cursor: "pointer", padding: "10px 8px", border: !wantInvest ? "1px solid " + C.border : "2px solid #121212", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, opacity: !wantInvest ? 0.6 : 1, transition: "all 0.2s" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: C.serif, color: !wantInvest ? C.sub : C.text, textAlign: "center" }}>股票+房地产</div>
            <div style={{ fontSize: 10, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>股票复利 + 投资房<br/>正现金流复投买房<br/>被动收入加速FIRE</div>
            {wantInvest && <div style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: "#121212", borderRadius: 0, padding: "1px 6px" }}>当前选择</div>}
          </div>
        </div>
        {wantInvest ? <div style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
     <div style={PILL("#2A7A4B")}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>房产基本信息</span></div>
     <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 4 }}>
      <span style={{ fontSize: 9.5, color: C.muted }}>持股</span>
      <select value={investOwn} onChange={function(e) { setInvestOwn(e.target.value); }} style={{ height: 20, fontSize: 10, fontWeight: 700, fontFamily: "inherit", border: "1px solid " + C.border, borderRadius: 0, background: "#fff", color: "#121212", padding: "0 4px", cursor: "pointer" }}>
       {[25,30,40,50,60,70,80,90,100].map(function(v) { return <option key={v} value={String(v)}>{v}%</option>; })}
      </select></div></div>
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          {[["","独栋","sf"],["","多家庭","mf"],["","房产组合","portfolio"]].map(function(t) { return (
            <button key={t[2]} onClick={function() { setPropType(t[2]); if (t[2] === "portfolio") setPortfolioMode(true); else setPortfolioMode(false); }} style={{ flex: 1, padding: "4px 2px", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, border: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "2px solid #121212" : "1px solid " + C.border, background: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "#FFFFFF" : "#fff", color: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "#2A7A4B" : C.sub, textAlign: "center" }}>
              <div style={{ fontSize: 14 }}>{t[0]}</div>
              <div>{t[1]}</div>
            </button>
          ); })}
        </div>
        {portfolioMode && <div style={{ fontSize: 9, color: "#B35C1E", marginBottom: 6, padding: "3px 6px", background: "#F7F7F7", borderRadius: 0, lineHeight: 1.5 }}>房产组合模式: 请输入所有房产的<b>总成交价</b>、<b>总月租金</b>、<b>总过户费</b>，系统将按组合整体分析回报率。单独分析请切换至独栋/多家庭模式。</div>}
        {propType === "mf" && <div style={FG6}>{fs2("单元数", mfUnits, setMfUnits, [2,3,4,5,6,8,10,12,16,20].map(v=>({v:String(v),l:v+"户"})))}</div>}
        <div style={FG8}>
     <div style={{ flex: 1, minWidth: 0 }}>{fi(portfolioMode ? "总成交价" : "成交价", saleP, setSaleP, portfolioMode ? "1500000" : "450000", "$")}</div>
     <div style={{ flex: 1, minWidth: 0 }}>{fi(portfolioMode ? "总月租金" : (propType === "mf" ? "总月租金" : "月租金"), activeUnitRents[0], function(v) { setActiveUnitRents([v]); }, propType === "mf" ? "8000" : "5000", "$")}</div></div>
        <div style={PILL("#326891")}>
     <span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>贷款与过户</span></div>
        <div style={FG6}>
     <div style={{ flex: 1, minWidth: 0, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
       <span style={{ fontSize: 10, fontWeight: 500, color: C.sub }}>首付</span>
       <div style={{ display: "flex", borderRadius: 0, overflow: "hidden", border: "1px solid #2A7A4B" }}>
        <button onClick={function() { setDownMode("pct"); }} style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: downMode === "pct" ? "#2A7A4B" : "transparent", color: downMode === "pct" ? "#fff" : "#2A7A4B" }}>%</button>
        <button onClick={function() { setDownMode("amt"); }} style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: downMode === "amt" ? "#2A7A4B" : "transparent", color: downMode === "amt" ? "#fff" : "#2A7A4B" }}>$</button>
       </div></div>
      <div style={GOLD}>
       {downMode === "amt" && <span style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</span>}
       <input type="text" inputMode="decimal" value={downMode === "pct" ? downPct : downAmt} onChange={function(e) { var v = e.target.value; if (downMode === "pct") { setDownPct(v); setDownAmt(""); } else { setDownAmt(v); var sp = parseFloat(saleP) || 1; setDownPct(String(Math.round((parseFloat(v) || 0) / sp * 1000) / 10)); } }} placeholder={downMode === "pct" ? "20" : "90000"} style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#121212", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }} />
       <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{downMode === "pct" ? "=" + fmtMoney((parseFloat(saleP)||0) * (parseFloat(downPct)||0) / 100) : downPct + "%"}</span></div></div>
     <div style={{ flex: 1, minWidth: 0 }}>{fi("利率 %", annRate, setAnnRate, "6.875")}</div></div>
        <div style={FG6}>{fs2("贷款年限", loanYrs, setLoanYrs, ["15","20","25","30"].map(function(y) { return {v:y, l:y+"年"}; }))}
     {fs2("过户费", closing, setClosing, [0,5000,10000,15000,20000,30000,50000,60000].map(function(v) { return {v:String(v), l:fmtMoney(v)}; }))}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
     {fs2("装修费", investOther, setInvestOther, [0,5000,10000,15000,20000,30000,50000,80000,100000].map(function(v) { return {v:String(v), l:fmtMoney(v)}; }))}
     {investExtras.map(function(ext, ei) { return (
      <div key={ei} style={{ flex: 1, minWidth: 0, marginBottom: 8 }}>
       <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
        <select value={ext.name} onChange={function(e) { var n = investExtras.slice(); n[ei] = { name: e.target.value, amt: ext.amt }; setInvestExtras(n); }} style={{ flex: 1, fontSize: 10, fontWeight: 500, color: C.sub, border: "none", outline: "none", background: "transparent", padding: 0, fontFamily: "inherit", cursor: "pointer" }}><option value="">选择类型</option><option value="律师费">律师费</option><option value="验房费">验房费</option><option value="评估费">评估费</option><option value="产权保险">产权保险</option><option value="贷款手续费">贷款手续费</option><option value="点数">点数 Points</option><option value="预付税">预付税</option><option value="预付保险">预付保险</option><option value="中介佣金">中介佣金</option><option value="其他">其他</option></select>
        <button onClick={function() { setInvestExtras(investExtras.filter(function(_, i) { return i !== ei; })); }} style={{ fontSize: 10, border: "none", background: "transparent", color: C.muted, cursor: "pointer", padding: 0 }}>×</button>
       </div>
       <div style={GOLD}>
        <span style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</span>
        <input type="text" value={ext.amt} onChange={function(e) { var n = investExtras.slice(); n[ei] = { name: ext.name, amt: e.target.value.replace(/,/g,"") }; setInvestExtras(n); }} placeholder="0" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#121212", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }} />
       </div></div>); })}
     <button onClick={function() { setInvestExtras(investExtras.concat([{ name: "", amt: "0" }])); }} style={{ width: 38, height: 38, borderRadius: 0, border: "1px dashed " + C.border, background: "#F7F7F7", color: C.muted, fontSize: 18, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={PILL("#B35C1E")}><span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>运营费用</span></div>
          <div onClick={function() { setExpDetail(!expDetail); if (!expDetail) setExpIdx(4); else setExpIdx(5); }} style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: expDetail ? C.muted : "#B35C1E" }}>默认%</span>
            <div style={{ width: 28, height: 16, borderRadius: 0, background: expDetail ? "#B35C1E" : "#999999", padding: 2, transition: "background 0.2s" }}>
              <div style={{ width: 12, height: 12, borderRadius: 0, background: "#fff", boxShadow: "none", transform: expDetail ? "translateX(12px)" : "translateX(0)", transition: "transform 0.2s" }} /></div>
            <span style={{ fontSize: 9, fontWeight: 600, color: expDetail ? "#B35C1E" : C.muted }}>自定义</span></div></div>
        {!expDetail ? <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <div style={{ width: 70, flexShrink: 0 }}>{fs2("费率%", expSlider, setExpSlider, [20,25,30,35,40,45,50,55,60].map(function(v) { return {v:String(v), l:v+"%"}; }))}</div>
            <div style={{ flex: 1, marginBottom: 10, padding: "4px 6px", background: "#F7F7F7", borderRadius: 0, fontSize: 9, color: "#B35C1E", lineHeight: 1.4 }}>{parseInt(expSlider) <= 25 ? "NNN净租约 · 租客承担税险Utilities维修" : parseInt(expSlider) <= 30 ? "房东自管 · 不含Utilities · 新手小型" : parseInt(expSlider) <= 35 ? "房东自管 · 包Utilities · 中西部多家庭" : parseInt(expSlider) <= 40 ? "委托物管 · 不含Utilities · 管理费8-10%" : parseInt(expSlider) <= 45 ? "委托物管 · 全包Utilities · 远程投资" : parseInt(expSlider) <= 50 ? "高维护物业 · 老旧建筑 · 大城市" : "注意 高费率 · 大修/高空置/高管理成本"}</div></div>
        : (() => {
          var gri = (parseFloat(activeUnitRents[0])||0) * 12;
          var items = [
            { l: "空置", v: gri*(parseFloat(vacancyPct)||0)/100, k: "vac" },
            { l: "管理", v: gri*(parseFloat(mgmtPct)||0)/100, k: "mgmt" },
            { l: "地税", v: (parseFloat(taxMo)||0)*12, k: "tax" },
            { l: "保险", v: (parseFloat(insuranceMo)||0)*12, k: "ins" },
            { l: "维修", v: (parseFloat(maintMo)||0)*12, k: "mnt" },
            { l: "杂费", v: (parseFloat(utilitiesMo)||0)*12, k: "utl" },
            { l: "HOA", v: (parseFloat(hoaMo)||0)*12, k: "hoa" },
            { l: "其他", v: (parseFloat(otherMo)||0)*12, k: "oth" },
          ];
          var total = items.reduce(function(s,x){return s+x.v;},0);
          var pctOfGri = gri > 0 ? (total/gri*100).toFixed(0) : 0;
          var maxV = Math.max.apply(null, items.map(function(x){return x.v;}))||1;
          return <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4, padding:"2px 0" }}>
              <span style={{ fontSize:9.5, color:"#B35C1E", fontWeight:700 }}>年运营费 {fmtMoney(total)}</span>
              <span style={{ fontSize:10, fontWeight:800, color:"#B35C1E" }}>{pctOfGri}%<span style={{ fontSize:8.5, color:"#767676" }}> of GRI</span></span></div>
            {(() => {
              var expCats = [
                { k:"vac", l:"空置", v:parseFloat(vacancyPct)||0, set:setVacancyPct, c:"#8A4F9E", max:20, unit:"%", mo: gri*(parseFloat(vacancyPct)||0)/100/12 },
                { k:"mgmt", l:"管理", v:parseFloat(mgmtPct)||0, set:setMgmtPct, c:"#326891", max:20, unit:"%", mo: gri*(parseFloat(mgmtPct)||0)/100/12 },
                { k:"tax", l:"地税", v:parseFloat(taxMo)||0, set:setTaxMo, c:"#1A4B6E", max:1500, unit:"$", mo: parseFloat(taxMo)||0 },
                { k:"ins", l:"保险", v:parseFloat(insuranceMo)||0, set:setInsuranceMo, c:"#1D5536", max:1000, unit:"$", mo: parseFloat(insuranceMo)||0 },
                { k:"mnt", l:"维修", v:parseFloat(maintMo)||0, set:setMaintMo, c:"#B35C1E", max:1000, unit:"$", mo: parseFloat(maintMo)||0 },
                { k:"utl", l:"杂费", v:parseFloat(utilitiesMo)||0, set:setUtilitiesMo, c:"#C47526", max:500, unit:"$", mo: parseFloat(utilitiesMo)||0 },
                { k:"hoa", l:"HOA", v:parseFloat(hoaMo)||0, set:setHoaMo, c:"#4A3563", max:1000, unit:"$", mo: parseFloat(hoaMo)||0 },
                { k:"oth", l:"其他", v:parseFloat(otherMo)||0, set:setOtherMo, c:"#4F5B63", max:500, unit:"$", mo: parseFloat(otherMo)||0 },
              ];
              return expCats.map(function(cat) {
                var barPct = cat.max > 0 ? cat.v / cat.max * 100 : 0;
                var annV = cat.unit === "%" ? gri * cat.v / 100 : cat.v * 12;
                var griPct = gri > 0 ? (annV / gri * 100).toFixed(1) : 0;
                var step = cat.unit === "%" ? 1 : (cat.max >= 1000 ? 50 : 10);
                return <div key={cat.k} style={{ display:"flex", alignItems:"center", gap:3, marginBottom:3 }}>
                  <div style={{ width:46, fontSize:9, fontWeight:600, color:cat.c, flexShrink:0 }}>{cat.l}</div>
                  <div style={{ flex:1, position:"relative", height:20, background:C.inset, borderRadius:0, overflow:"hidden", cursor:"pointer", border:"1px solid "+C.border }}
                    onPointerDown={function(e) {
                      e.preventDefault();
                      var bar = e.currentTarget; var rect = bar.getBoundingClientRect();
                      var mv = function(cx) { var raw = Math.max(0, Math.min(cat.max, (cx - rect.left) / rect.width * cat.max)); cat.set(String(Math.round(raw / step) * step)); };
                      mv(e.clientX);
                      var onM = function(ev) { ev.preventDefault(); mv(ev.clientX); };
                      var onU = function() { window.removeEventListener("pointermove", onM); window.removeEventListener("pointerup", onU); };
                      window.addEventListener("pointermove", onM); window.addEventListener("pointerup", onU);
                    }}>
                    <div style={{ position:"absolute", top:0, bottom:0, left:0, width:barPct+"%", background:cat.c+"20", borderRadius:0, transition:"width 0.1s", display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight: barPct >= 25 ? 8 : 0 }}>
                      {barPct >= 25 && <span style={{ fontSize:8.5, fontWeight:700, color:cat.c, pointerEvents:"none" }}>{cat.unit==="$" ? "$"+cat.v+"/月" : cat.v+"%"}</span>}
                      <div style={{ position:"absolute", right:0, top:2, bottom:2, width:6, borderRadius:0, background:cat.c, boxShadow:"none"}} /></div></div>
                  <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", height:20, background:"#fff", borderRadius:0, border:"1px solid "+C.border, padding:"0 3px", width:46 }}>
                      {cat.unit==="$" && <span style={{ fontSize:8.5, color:C.muted }}>$</span>}
                      <input type="text" inputMode="decimal" value={cat.v} onChange={function(e){ cat.set(e.target.value.replace(/[^0-9.]/g,"")); }} style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:9.5, fontWeight:700, color:cat.c, fontFamily:"inherit", textAlign:"right", padding:0 }} />
                      {cat.unit==="%" && <span style={{ fontSize:8.5, color:C.muted }}>%</span>}
                    </div>
                    <span style={{ fontSize:7.5, color:"#767676", width:22, textAlign:"right" }}>{griPct}%</span></div></div>;
              });
            })()}
          </div>;
        })()}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
     <div style={PILL("#4F5B63")}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>购入时间</span></div>
     <div onClick={function() { setAlreadyBought(!alreadyBought); if (alreadyBought) setPurchaseYear(""); }} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
      <span style={{ fontSize: 9.5, fontWeight: 600, color: alreadyBought ? "#2A7A4B" : C.muted }}>{alreadyBought ? "已购入" : "尚未购入"}</span>
      <div style={{ width: 28, height: 16, borderRadius: 0, background: alreadyBought ? "#2A7A4B" : "#999999", padding: 2, transition: "background 0.2s" }}>
       <div style={{ width: 12, height: 12, borderRadius: 0, background: "#fff", boxShadow: "none", transform: alreadyBought ? "translateX(12px)" : "translateX(0)", transition: "transform 0.2s" }} />
      </div></div></div>
        {alreadyBought && <div style={FG6}>
     {fs2("购入年", purchaseYear, setPurchaseYear, Array.from({length:20},(_,i)=>({v:String(2026-i),l:String(2026-i)})))}
     {fs2("月", purchaseMonth, setPurchaseMonth, Array.from({length:12},(_,i)=>({v:String(i+1),l:(i+1)+"月"})))}
     {fs2("日", purchaseDay, setPurchaseDay, Array.from({length:31},(_,i)=>({v:String(i+1),l:(i+1)+"日"})))}
        </div>}
        </div> : null}</div>
  {/* FIRE inputs - always shown in fire mode */}
      <div className="sec-anim" style={{ background: "#fff", borderRadius: 0, padding: "4px 0 8px", margin: "0 14px 10px", boxShadow: "none", animationDelay: "0.3s" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: C.serif, color: C.text, margin: "0 0 10px" }}>FIRE 财务自由规划</h2>
        <div style={{ paddingTop: 0 }}>
     <div style={PILL("#326891")}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>收入与储蓄</span></div>
     <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
      <div style={{ flex: 1, minWidth: 0 }}>{fi("年收入 Income", annualIncome, setAnnualIncome, "120000", "$")}</div>
      <div style={{ flex: 1, minWidth: 0 }}>{fi("储蓄率 Savings %", savingsRate, setSavingsRate, "30")}</div></div>
     <div style={PILL("#2B7A78")}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>现有资产</span></div>
     <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
      {fs2(bankLabel, bankSavings, setBankSavings, [0,10000,20000,30000,50000,80000,100000,150000,200000,500000].map(v=>({v:String(v),l:fmtMoney(v)})))}
      {fs2(stockLabel, stockAccount, setStockAccount, [0,10000,20000,30000,50000,80000,100000,200000,500000].map(v=>({v:String(v),l:fmtMoney(v)})))}
      {fs2(retLabel, k401Balance, setK401Balance, [0,10000,20000,40000,60000,80000,100000,200000,500000].map(v=>({v:String(v),l:fmtMoney(v)})))}</div>
     <div style={PILL("#B35C1E")}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>退休目标</span></div>
     <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
      {fs2("月收入目标", ffIncomeTgt, setFfIncomeTgt, [3000,5000,6000,7000,8000,10000,12000,15000,20000].map(v=>({v:String(v),l:fmtMoney(v)})))}
      {fs2("净值目标", ffWealthTgt, setFfWealthTgt, [1000000,2000000,3000000,5000000,8000000,10000000,15000000,20000000].map(v=>({v:String(v),l:fmtMoney(v)})))}
      {fs2("有效税率", effectiveTax, setEffectiveTax, [0,5,10,12,15,18,20,22,24,28,32,37].map(function(v){return {v:String(v),l:v+"%"};}))}</div>
     <div style={PILL("#4F5B63")}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>基本设置</span></div>
     <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
      {fs2("通胀率", inflRate, setInflRate, [0,1,1.5,2,2.5,3,3.5,4,5].map(function(v){return {v:String(v),l:v>0?v+"%":"不考虑"};}))}
      {fs2("出生年", birthYear, setBirthYear, Array.from({length:60},function(_,i){var y=2010-i; return {v:String(y),l:String(y)};}))}
      {fs2("月", birthMonth, setBirthMonth, Array.from({length:12},(_,i)=>({v:String(i+1),l:(i+1)+"月"})))}</div>
     <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-end" }}>
      {fs2("所在城市", city, setCity, cityList.map(function(c){return {v:c,l:c};}))}
      <div style={{ marginBottom: 8 }}>
        <button onClick={autoDetectCity} style={{ height: 38, padding: "0 10px", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 700, border: "none", borderRadius: 0, background: geoStatus === "done" ? "#FFFFFF" : geoStatus === "denied" ? "#FFFFFF" : "#C9D8E4", color: geoStatus === "done" ? "#2A7A4B" : geoStatus === "denied" ? "#B8312F" : "#326891", whiteSpace: "nowrap" }}>{geoStatus === "loading" ? "定位中..." : geoStatus === "done" ? "" + city.split(" ")[0].slice(0,4) : geoStatus === "denied" ? "失败" : "自动定位"}</button>
      </div></div>
     {/* Savings Equalizer */}
     <div style={{ background: "#fff", borderRadius: 0, padding: "8px 10px", marginBottom: 6, boxShadow: "none", border: "1px solid " + C.border }}>
      <div style={{ fontSize: 9.5, fontWeight: 600, color: C.sub, marginBottom: 6 }}>储蓄分配 · 总计100% <span style={{ fontWeight: 400, color: C.muted }}>· 年储蓄{fmtMoney(annSavAmt)}</span></div>
      {(() => {
       var cats = [];
       if (wantInvest) cats.push({ k: "re", l: "房产", v: parseInt(savREPct)||0, set: setSavREPct, c: "#2A7A4B" });
       cats.push({ k: "st", l: "股票", v: parseInt(savStockPct)||0, set: setSavStockPct, c: "#7D3C8C" });
       cats.push({ k: "bk", l: "存款", v: parseInt(savBankPct)||0, set: setSavBankPct, c: "#326891" });
       cats.push({ k: "rt", l: "" + retLabel, v: parseInt(sav401Pct)||0, set: setSav401Pct, c: "#A8385F" });
       if (wantInvest) cats.push({ k: "ip", l: "投资提前还贷", v: parseInt(savInvestPrepay)||0, set: setSavInvestPrepay, c: "#B35C1E" });
       if (wantHome && homeHasLoan) cats.push({ k: "hp", l: "自住提前还贷", v: parseInt(savHomePrepay)||0, set: setSavHomePrepay, c: "#2B7A78" });
       var adjust = function(idx, newVal) {
        var lockedTotal = 0;
        cats.forEach(function(c, i) { if (i !== idx && eqLock[c.k]) lockedTotal += c.v; });
        var maxAllowed = 100 - lockedTotal;
        var nv = Math.max(0, Math.min(maxAllowed, newVal));
        cats[idx].set(String(nv));
        var others = cats.filter(function(_, i) { return i !== idx && !eqLock[cats[i].k]; });
        var remaining = Math.max(0, 100 - nv - lockedTotal);
        var othersTotal = others.reduce(function(s, c) { return s + c.v; }, 0);
        if (others.length === 0) return;
        if (othersTotal <= 0) {
         var each = Math.floor(remaining / others.length);
         others.forEach(function(c, i) { c.set(String(i === others.length - 1 ? remaining - each * (others.length - 1) : each)); });
         return;}
        var assigned = 0;
        others.forEach(function(c, i) {
         if (i === others.length - 1) { c.set(String(Math.max(0, remaining - assigned))); }
         else { var share = Math.max(0, Math.round(c.v / othersTotal * remaining)); c.set(String(share)); assigned += share; }});
       };
       return cats.map(function(cat, idx) {
        var moAmt = Math.round(annSavAmt * cat.v / 100 / 12);
        var locked = eqLock[cat.k];
        return <div key={cat.k} style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
         <div onClick={function() { var n = {}; for (var k in eqLock) n[k]=eqLock[k]; n[cat.k] = !locked; setEqLock(n); }} style={{ width: 14, height: 14, borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, background: locked ? cat.c + "15" : "transparent", border: "1px solid " + (locked ? cat.c + "40" : C.border), color: locked ? cat.c : C.muted, flexShrink: 0 }}>{locked ? "" : "·"}</div>
         <div style={{ width: 50, fontSize: 9, fontWeight: 600, color: cat.c, flexShrink: 0 }}>{cat.l}</div>
         <div style={{ flex: 1, position: "relative", height: 20, background: C.inset, borderRadius: 0, overflow: "hidden", cursor: locked ? "default" : "pointer", border: "1px solid " + C.border, opacity: locked ? 0.6 : 1 }}
          onPointerDown={locked ? undefined : function(e) {
           e.preventDefault();
           var bar = e.currentTarget;
           var rect = bar.getBoundingClientRect();
           var mv = function(cx) { adjust(idx, Math.round(Math.max(0, Math.min(100, (cx - rect.left) / rect.width * 100)) / 5) * 5); };
           mv(e.clientX);
           var onM = function(ev) { ev.preventDefault(); mv(ev.clientX); };
           var onU = function() { window.removeEventListener("pointermove", onM); window.removeEventListener("pointerup", onU); };
           window.addEventListener("pointermove", onM);
           window.addEventListener("pointerup", onU);
          }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: cat.v+"%", background: cat.c + "20", borderRadius: 0, transition: "width 0.1s", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: cat.v >= 20 ? 8 : 0 }}>
           {cat.v >= 20 && <span style={{ fontSize: 8.5, fontWeight: 700, color: cat.c, pointerEvents: "none" }}>${moAmt}/月</span>}
           <div style={{ position: "absolute", right: 0, top: 2, bottom: 2, width: 6, borderRadius: 0, background: cat.c, boxShadow: "none"}} /></div></div>
         <div style={{ width: 48, textAlign: "right", fontSize: 10, fontWeight: 700, color: cat.c, flexShrink: 0 }}>{cat.v}% <span style={{ fontSize: 7.5, fontWeight: 500, color: cat.c + "90" }}>${moAmt}</span></div></div>;
       });
      })()}</div>
     {/* Sub-option: include primary home */}
     <div onClick={function() { setWantHome(!wantHome); }} style={{ display: "flex", alignItems: "center", padding: "6px 8px", cursor: "pointer", background: wantHome ? C.green + "08" : C.inset, borderRadius: 0, border: "1px solid " + (wantHome ? C.green + "25" : C.border) }}>
      <div style={{ flex: 1 }}>
       <div style={{ fontSize: 11, fontWeight: 600, color: wantHome ? C.text : C.muted }}>将自住房纳入净值计算</div>
       <div style={{ fontSize: 9.5, color: C.muted }}>房产增值计入总资产 · 持有成本纳入支出</div></div>
      <div style={{ width: 32, height: 18, borderRadius: 0, background: wantHome ? C.green : C.border, padding: 2, transition: "background 0.2s", flexShrink: 0 }}>
       <div style={{ width: 14, height: 14, borderRadius: 0, background: "#fff", boxShadow: "none", transform: wantHome ? "translateX(14px)" : "translateX(0)", transition: "transform 0.2s" }}></div></div>
     </div>
     {wantHome && <div style={{ paddingTop: 6 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
       <div style={{ flex: 1, minWidth: 0 }}>{fi("买入价 Purchase", homeSaleP, setHomeSaleP, "1050000", "$")}</div>
       <div style={{ flex: 1, minWidth: 0 }}>{fi("当前市值 Value", homeListP, setHomeListP, "1200000", "$")}</div></div>
      <div onClick={function() { setHomeHasLoan(!homeHasLoan); }} style={{ display: "flex", alignItems: "center", padding: "4px 0", cursor: "pointer", marginBottom: 4 }}>
       <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: homeHasLoan ? C.text : "#2A7A4B" }}>{homeHasLoan ? "有房贷 Mortgage" : "无房贷 No Mortgage"}</span>
       <div style={{ width: 32, height: 18, borderRadius: 0, background: homeHasLoan ? C.blue : C.border, padding: 2, transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: 0, background: "#fff", boxShadow: "none", transform: homeHasLoan ? "translateX(14px)" : "translateX(0)", transition: "transform 0.2s" }}></div></div>
      </div>
      {homeHasLoan && <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
       {fs2("首付%", homeDownPct, setHomeDownPct, [0,3,5,10,15,20,25,30,40,50].map(function(v){return {v:String(v),l:v+"%"};}))}
       {fs2("利率%", homeAnnRate, setHomeAnnRate, Array.from({length:33},function(_,i){return {v:(3+i*0.25).toFixed(2),l:(3+i*0.25).toFixed(2)+"%"};}))}
       {fs2("年限", homeLoanYrs, setHomeLoanYrs, ["10","15","20","25","30"].map(function(y){return {v:y,l:y+"yr"};}))}
       {(parseFloat(homeDownPct)||20) < 20 && fs2("PMI%", homePmiRate, setHomePmiRate, [0.3,0.4,0.5,0.6,0.7,0.8,1.0,1.2,1.5,2.0].map(function(v){return {v:String(v),l:v+"%/yr"};}))}
      </div>}
      {(parseFloat(homeDownPct)||20) < 20 && homeHasLoan && <div style={{ fontSize: 8.5, color: "#A8385F", marginBottom: 4, padding: "2px 6px", background: "#F7F7F7", borderRadius: 0}}>注意 首付低于20%需缴PMI · 权益达20%后可申请取消 · 22%自动取消</div>}
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
       {fs2("交割费", homeClosing, setHomeClosing, [0,10000,20000,30000,40000,50000,60000].map(v=>({v:String(v),l:fmtMoney(v)})))}
       {fs2("装修", homeRenovation, setHomeRenovation, [0,10000,20000,30000,50000,80000,100000].map(v=>({v:String(v),l:fmtMoney(v)})))}
       {fs2("持股%", homeOwn, setHomeOwn, [25,50,60,70,80,90,100].map(function(v){return {v:String(v),l:v+"%"};}))}
       {fs2("购入年", homePurchaseYear, setHomePurchaseYear, [{v:"",l:"当前"}].concat(Array.from({length:30},(_,i)=>({v:String(2026-i),l:String(2026-i)}))))}
       {fs2("月", homePurchaseMonth, setHomePurchaseMonth, Array.from({length:12},(_,i)=>({v:String(i+1),l:(i+1)+"月"})))}</div>
      <div style={FG6}>{fs2("地税/月", homeTax, setHomeTax, [0,100,150,200,250,300,400,500,600,800,1000].map(v=>({v:String(v),l:"$"+v})))}
       {fs2("保险/月", homeInsurance, setHomeInsurance, [0,50,100,150,200,250,300,400,500].map(v=>({v:String(v),l:"$"+v})))}
       {fs2("Utilities/月", homeUtils, setHomeUtils, [0,50,100,150,200,250,300,400,500].map(v=>({v:String(v),l:"$"+v})))}
       {fs2("维修/月", homeMaint, setHomeMaint, [0,50,100,150,200,250,300,400,500].map(v=>({v:String(v),l:"$"+v})))}
       {fs2("HOA/月", homeHoa, setHomeHoa, [0,100,200,300,400,500,600,800,1000].map(v=>({v:String(v),l:"$"+v})))}
      </div></div>}</div></div>
  {/* FIRE Action */}
      <div className="sec-anim" style={{ margin: "0 14px 8px", animationDelay: "0.4s", display: "flex", gap: 6 }}>
        <button className="btn3d" onClick={function() { setShowReport(true); setCalcMode("overview"); setWantFire(true); trackEvent("overview"); }} style={{ flex: 2, padding: "14px 0", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, border: "none", background: "#121212", color: "#fff", boxSizing: "border-box", boxShadow: "none", textShadow: "none" }}>
     FIRE规划
        </button>
        {wantInvest && <button className="btn3d" onClick={function() { setShowReport(true); setCalcMode("invest"); setWantFire(true); trackEvent("invest"); }} style={{ flex: 1, padding: "14px 0", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, border: "none", background: "#121212", color: "#fff", boxSizing: "border-box", boxShadow: "none", textShadow: "none" }}>
     房产投资分析
        </button>}
        {wantHome && <button className="btn3d" onClick={function() { setShowReport(true); setCalcMode("home"); setWantFire(true); trackEvent("home"); }} style={{ flex: 1, padding: "14px 0", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, border: "none", background: "#121212", color: "#fff", boxSizing: "border-box", boxShadow: "none", textShadow: "none" }}>
     自住分析
        </button>}</div>
  </>}
  {/* Standalone Invest Mode */}
  {introMode === "invest" && <>
      <div className="sec-anim" style={{ background: "#fff", borderRadius: 0, padding: "4px 0 8px", margin: "0 14px 10px", boxShadow: "none", animationDelay: "0.1s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
     <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: C.serif, color: C.text, margin: 0 }}>投资房交易分析</h2>
     <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 9.5, color: C.muted }}>持股</span>
      <select value={investOwn} onChange={function(e) { setInvestOwn(e.target.value); }} style={{ height: 20, fontSize: 10, fontWeight: 700, fontFamily: "inherit", border: "1px solid " + C.border, borderRadius: 0, background: "#fff", color: "#121212", padding: "0 4px", cursor: "pointer" }}>
       {[25,30,40,50,60,70,80,90,100].map(function(v) { return <option key={v} value={String(v)}>{v}%</option>; })}
      </select></div></div>
        <div>
        <div style={PILL("#2A7A4B")}>
     <span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>房产基本信息</span></div>
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          {[["","独栋","sf"],["","多家庭","mf"],["","房产组合","portfolio"]].map(function(t) { return (
            <button key={t[2]} onClick={function() { setPropType(t[2]); if (t[2] === "portfolio") setPortfolioMode(true); else setPortfolioMode(false); }} style={{ flex: 1, padding: "4px 2px", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, border: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "2px solid #121212" : "1px solid " + C.border, background: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "#FFFFFF" : "#fff", color: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "#2A7A4B" : C.sub, textAlign: "center" }}>
              <div style={{ fontSize: 14 }}>{t[0]}</div>
              <div>{t[1]}</div>
            </button>
          ); })}
        </div>
        {portfolioMode && <div style={{ fontSize: 9, color: "#B35C1E", marginBottom: 6, padding: "3px 6px", background: "#F7F7F7", borderRadius: 0, lineHeight: 1.5 }}>房产组合模式: 请输入所有房产的<b>总成交价</b>、<b>总月租金</b>、<b>总过户费</b>，系统将按组合整体分析回报率。</div>}
        {propType === "mf" && <div style={FG6}>{fs2("单元数", mfUnits, setMfUnits, [2,3,4,5,6,8,10,12,16,20].map(v=>({v:String(v),l:v+"户"})))}</div>}
        <div style={FG8}>
     <div style={{ flex: 1, minWidth: 0 }}>{fi(portfolioMode ? "总成交价" : "成交价", saleP, setSaleP, portfolioMode ? "1500000" : "450000", "$")}</div>
     <div style={{ flex: 1, minWidth: 0 }}>{fi(portfolioMode ? "总月租金" : (propType === "mf" ? "总月租金" : "月租金"), activeUnitRents[0], function(v) { setActiveUnitRents([v]); }, propType === "mf" ? "8000" : "5000", "$")}</div></div>
        <div style={PILL("#326891")}>
     <span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>贷款与过户</span></div>
        <div style={FG6}>
     <div style={{ flex: 1, minWidth: 0, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
       <span style={{ fontSize: 10, fontWeight: 500, color: C.sub }}>首付</span>
       <div style={{ display: "flex", borderRadius: 0, overflow: "hidden", border: "1px solid #2A7A4B" }}>
        <button onClick={function() { setDownMode("pct"); }} style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: downMode === "pct" ? "#2A7A4B" : "transparent", color: downMode === "pct" ? "#fff" : "#2A7A4B" }}>%</button>
        <button onClick={function() { setDownMode("amt"); }} style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: downMode === "amt" ? "#2A7A4B" : "transparent", color: downMode === "amt" ? "#fff" : "#2A7A4B" }}>$</button>
       </div></div>
      <div style={GOLD}>
       {downMode === "amt" && <span style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</span>}
       <input type="text" inputMode="decimal" value={downMode === "pct" ? downPct : downAmt} onChange={function(e) { var v = e.target.value; if (downMode === "pct") { setDownPct(v); setDownAmt(""); } else { setDownAmt(v); var sp = parseFloat(saleP) || 1; setDownPct(String(Math.round((parseFloat(v) || 0) / sp * 1000) / 10)); } }} placeholder={downMode === "pct" ? "20" : "90000"} style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#121212", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }} />
       <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{downMode === "pct" ? "=" + fmtMoney((parseFloat(saleP)||0) * (parseFloat(downPct)||0) / 100) : downPct + "%"}</span></div></div>
     <div style={{ flex: 1, minWidth: 0 }}>{fi("利率 %", annRate, setAnnRate, "6.875")}</div></div>
        <div style={FG6}>{fs2("贷款年限", loanYrs, setLoanYrs, ["15","20","25","30"].map(function(y) { return {v:y, l:y+"年"}; }))}
     {fs2("过户费", closing, setClosing, [0,5000,10000,15000,20000,30000,50000,60000].map(function(v) { return {v:String(v), l:fmtMoney(v)}; }))}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
     {fs2("装修费", investOther, setInvestOther, [0,5000,10000,15000,20000,30000,50000,80000,100000].map(function(v) { return {v:String(v), l:fmtMoney(v)}; }))}
     {investExtras.map(function(ext, ei) { return (
      <div key={ei} style={{ flex: 1, minWidth: 0, marginBottom: 8 }}>
       <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
        <select value={ext.name} onChange={function(e) { var n = investExtras.slice(); n[ei] = { name: e.target.value, amt: ext.amt }; setInvestExtras(n); }} style={{ flex: 1, fontSize: 10, fontWeight: 500, color: C.sub, border: "none", outline: "none", background: "transparent", padding: 0, fontFamily: "inherit", cursor: "pointer" }}><option value="">选择类型</option><option value="律师费">律师费</option><option value="验房费">验房费</option><option value="评估费">评估费</option><option value="产权保险">产权保险</option><option value="贷款手续费">贷款手续费</option><option value="点数">点数 Points</option><option value="预付税">预付税</option><option value="预付保险">预付保险</option><option value="中介佣金">中介佣金</option><option value="其他">其他</option></select>
        <button onClick={function() { setInvestExtras(investExtras.filter(function(_, i) { return i !== ei; })); }} style={{ fontSize: 10, border: "none", background: "transparent", color: C.muted, cursor: "pointer", padding: 0 }}>×</button>
       </div>
       <div style={GOLD}>
        <span style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</span>
        <input type="text" value={ext.amt} onChange={function(e) { var n = investExtras.slice(); n[ei] = { name: ext.name, amt: e.target.value.replace(/,/g,"") }; setInvestExtras(n); }} placeholder="0" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#121212", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }} />
       </div></div>); })}
     <button onClick={function() { setInvestExtras(investExtras.concat([{ name: "", amt: "0" }])); }} style={{ width: 38, height: 38, borderRadius: 0, border: "1px dashed " + C.border, background: "#F7F7F7", color: C.muted, fontSize: 18, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={PILL("#B35C1E")}><span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>运营费用</span></div>
          <div onClick={function() { setExpDetail(!expDetail); if (!expDetail) setExpIdx(4); else setExpIdx(5); }} style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: expDetail ? C.muted : "#B35C1E" }}>默认%</span>
            <div style={{ width: 28, height: 16, borderRadius: 0, background: expDetail ? "#B35C1E" : "#999999", padding: 2, transition: "background 0.2s" }}>
              <div style={{ width: 12, height: 12, borderRadius: 0, background: "#fff", boxShadow: "none", transform: expDetail ? "translateX(12px)" : "translateX(0)", transition: "transform 0.2s" }} /></div>
            <span style={{ fontSize: 9, fontWeight: 600, color: expDetail ? "#B35C1E" : C.muted }}>自定义</span></div></div>
        {!expDetail ? <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <div style={{ width: 70, flexShrink: 0 }}>{fs2("费率%", expSlider, setExpSlider, [20,25,30,35,40,45,50,55,60].map(function(v) { return {v:String(v), l:v+"%"}; }))}</div>
            <div style={{ flex: 1, marginBottom: 10, padding: "4px 6px", background: "#F7F7F7", borderRadius: 0, fontSize: 9, color: "#B35C1E", lineHeight: 1.4 }}>{parseInt(expSlider) <= 25 ? "NNN净租约 · 租客承担税险Utilities维修" : parseInt(expSlider) <= 30 ? "房东自管 · 不含Utilities · 新手小型" : parseInt(expSlider) <= 35 ? "房东自管 · 包Utilities · 中西部多家庭" : parseInt(expSlider) <= 40 ? "委托物管 · 不含Utilities · 管理费8-10%" : parseInt(expSlider) <= 45 ? "委托物管 · 全包Utilities · 远程投资" : parseInt(expSlider) <= 50 ? "高维护物业 · 老旧建筑 · 大城市" : "注意 高费率 · 大修/高空置/高管理成本"}</div></div>
        : (() => {
          var gri = (parseFloat(activeUnitRents[0])||0) * 12;
          var items = [
            { l: "空置", v: gri*(parseFloat(vacancyPct)||0)/100, k: "vac" },
            { l: "管理", v: gri*(parseFloat(mgmtPct)||0)/100, k: "mgmt" },
            { l: "地税", v: (parseFloat(taxMo)||0)*12, k: "tax" },
            { l: "保险", v: (parseFloat(insuranceMo)||0)*12, k: "ins" },
            { l: "维修", v: (parseFloat(maintMo)||0)*12, k: "mnt" },
            { l: "杂费", v: (parseFloat(utilitiesMo)||0)*12, k: "utl" },
            { l: "HOA", v: (parseFloat(hoaMo)||0)*12, k: "hoa" },
            { l: "其他", v: (parseFloat(otherMo)||0)*12, k: "oth" },
          ];
          var total = items.reduce(function(s,x){return s+x.v;},0);
          var pctOfGri = gri > 0 ? (total/gri*100).toFixed(0) : 0;
          var maxV = Math.max.apply(null, items.map(function(x){return x.v;}))||1;
          return <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4, padding:"2px 0" }}>
              <span style={{ fontSize:9.5, color:"#B35C1E", fontWeight:700 }}>年运营费 {fmtMoney(total)}</span>
              <span style={{ fontSize:10, fontWeight:800, color:"#B35C1E" }}>{pctOfGri}%<span style={{ fontSize:8.5, color:"#767676" }}> of GRI</span></span></div>
            {(() => {
              var expCats = [
                { k:"vac", l:"空置", v:parseFloat(vacancyPct)||0, set:setVacancyPct, c:"#8A4F9E", max:20, unit:"%", mo: gri*(parseFloat(vacancyPct)||0)/100/12 },
                { k:"mgmt", l:"管理", v:parseFloat(mgmtPct)||0, set:setMgmtPct, c:"#326891", max:20, unit:"%", mo: gri*(parseFloat(mgmtPct)||0)/100/12 },
                { k:"tax", l:"地税", v:parseFloat(taxMo)||0, set:setTaxMo, c:"#1A4B6E", max:1500, unit:"$", mo: parseFloat(taxMo)||0 },
                { k:"ins", l:"保险", v:parseFloat(insuranceMo)||0, set:setInsuranceMo, c:"#1D5536", max:1000, unit:"$", mo: parseFloat(insuranceMo)||0 },
                { k:"mnt", l:"维修", v:parseFloat(maintMo)||0, set:setMaintMo, c:"#B35C1E", max:1000, unit:"$", mo: parseFloat(maintMo)||0 },
                { k:"utl", l:"杂费", v:parseFloat(utilitiesMo)||0, set:setUtilitiesMo, c:"#C47526", max:500, unit:"$", mo: parseFloat(utilitiesMo)||0 },
                { k:"hoa", l:"HOA", v:parseFloat(hoaMo)||0, set:setHoaMo, c:"#4A3563", max:1000, unit:"$", mo: parseFloat(hoaMo)||0 },
                { k:"oth", l:"其他", v:parseFloat(otherMo)||0, set:setOtherMo, c:"#4F5B63", max:500, unit:"$", mo: parseFloat(otherMo)||0 },
              ];
              return expCats.map(function(cat) {
                var barPct = cat.max > 0 ? cat.v / cat.max * 100 : 0;
                var annV = cat.unit === "%" ? gri * cat.v / 100 : cat.v * 12;
                var griPct = gri > 0 ? (annV / gri * 100).toFixed(1) : 0;
                var step = cat.unit === "%" ? 1 : (cat.max >= 1000 ? 50 : 10);
                return <div key={cat.k} style={{ display:"flex", alignItems:"center", gap:3, marginBottom:3 }}>
                  <div style={{ width:46, fontSize:9, fontWeight:600, color:cat.c, flexShrink:0 }}>{cat.l}</div>
                  <div style={{ flex:1, position:"relative", height:20, background:C.inset, borderRadius:0, overflow:"hidden", cursor:"pointer", border:"1px solid "+C.border }}
                    onPointerDown={function(e) {
                      e.preventDefault();
                      var bar = e.currentTarget; var rect = bar.getBoundingClientRect();
                      var mv = function(cx) { var raw = Math.max(0, Math.min(cat.max, (cx - rect.left) / rect.width * cat.max)); cat.set(String(Math.round(raw / step) * step)); };
                      mv(e.clientX);
                      var onM = function(ev) { ev.preventDefault(); mv(ev.clientX); };
                      var onU = function() { window.removeEventListener("pointermove", onM); window.removeEventListener("pointerup", onU); };
                      window.addEventListener("pointermove", onM); window.addEventListener("pointerup", onU);
                    }}>
                    <div style={{ position:"absolute", top:0, bottom:0, left:0, width:barPct+"%", background:cat.c+"20", borderRadius:0, transition:"width 0.1s", display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight: barPct >= 25 ? 8 : 0 }}>
                      {barPct >= 25 && <span style={{ fontSize:8.5, fontWeight:700, color:cat.c, pointerEvents:"none" }}>{cat.unit==="$" ? "$"+cat.v+"/月" : cat.v+"%"}</span>}
                      <div style={{ position:"absolute", right:0, top:2, bottom:2, width:6, borderRadius:0, background:cat.c, boxShadow:"none"}} /></div></div>
                  <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", height:20, background:"#fff", borderRadius:0, border:"1px solid "+C.border, padding:"0 3px", width:46 }}>
                      {cat.unit==="$" && <span style={{ fontSize:8.5, color:C.muted }}>$</span>}
                      <input type="text" inputMode="decimal" value={cat.v} onChange={function(e){ cat.set(e.target.value.replace(/[^0-9.]/g,"")); }} style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:9.5, fontWeight:700, color:cat.c, fontFamily:"inherit", textAlign:"right", padding:0 }} />
                      {cat.unit==="%" && <span style={{ fontSize:8.5, color:C.muted }}>%</span>}
                    </div>
                    <span style={{ fontSize:7.5, color:"#767676", width:22, textAlign:"right" }}>{griPct}%</span></div></div>;
              });
            })()}
          </div>;
        })()}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
     <div style={PILL("#4F5B63")}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>购入时间</span></div>
     <div onClick={function() { setAlreadyBought(!alreadyBought); if (alreadyBought) setPurchaseYear(""); }} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
      <span style={{ fontSize: 9.5, fontWeight: 600, color: alreadyBought ? "#2A7A4B" : C.muted }}>{alreadyBought ? "已购入" : "尚未购入"}</span>
      <div style={{ width: 28, height: 16, borderRadius: 0, background: alreadyBought ? "#2A7A4B" : "#999999", padding: 2, transition: "background 0.2s" }}>
       <div style={{ width: 12, height: 12, borderRadius: 0, background: "#fff", boxShadow: "none", transform: alreadyBought ? "translateX(12px)" : "translateX(0)", transition: "transform 0.2s" }} />
      </div></div></div>
        {alreadyBought && <div style={FG6}>
     {fs2("购入年", purchaseYear, setPurchaseYear, Array.from({length:20},(_,i)=>({v:String(2026-i),l:String(2026-i)})))}
     {fs2("月", purchaseMonth, setPurchaseMonth, Array.from({length:12},(_,i)=>({v:String(i+1),l:(i+1)+"月"})))}
     {fs2("日", purchaseDay, setPurchaseDay, Array.from({length:31},(_,i)=>({v:String(i+1),l:(i+1)+"日"})))}
        </div>}</div></div>
      <div className="sec-anim" style={{ margin: "0 14px 8px", animationDelay: "0.2s" }}>
        <button className="btn3d" onClick={function() { setShowReport(true); setCalcMode("invest"); setWantInvest(true); trackEvent("invest"); }} style={{ width: "100%", padding: "14px 0", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, border: "none", background: "#121212", color: "#fff", boxSizing: "border-box", boxShadow: "none", textShadow: "none" }}>
     房产投资分析
        </button></div>
  </>}
  {/* Standalone Home Mode */}
  {introMode === "home" && <>
      <div className="sec-anim" style={{ background: "#fff", borderRadius: 0, padding: "4px 0 8px", margin: "0 14px 10px", boxShadow: "none", animationDelay: "0.1s" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: C.serif, color: C.text, margin: "0 0 10px" }}>自住房分析</h2>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
     {[["","独栋","sf","550000"],["","联排","th","420000"],["","Condo","condo","350000"],["","Co-op","coop","380000"],["","多户","mf","850000"]].map(function(t) { return (
      <button key={t[2]} onClick={function() { setHomePropType(t[2]); setHomeSaleP(t[3]); setHomeListP(String(Math.round(parseFloat(t[3]) * 1.1))); if (t[2] === "coop") { var p = parseInt(t[3]); var maint = Math.round((p * 0.008 / 12 + 500) / 100) * 100; setHomeCoopMaint(String(maint)); setHomeInsurance("50"); setHomeUtils("100"); } }} style={{ flex: 1, padding: "4px 2px", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, border: homePropType === t[2] ? "2px solid #121212" : "1px solid " + C.border, background: homePropType === t[2] ? "#FFFFFF" : "#fff", color: homePropType === t[2] ? "#326891" : C.sub, textAlign: "center" }}>
       <div style={{ fontSize: 14 }}>{t[0]}</div>
       <div>{t[1]}</div>
       <div style={{ fontSize: 8, color: C.muted }}>~{fmtMoney(parseInt(t[3]))}</div>
      </button>); })}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
     <div style={{ flex: 1, minWidth: 0 }}>{fi(homePropType === "coop" ? "股份价" : "买入价", homeSaleP, setHomeSaleP, "550000", "$")}</div>
     {fs2("持股%", homeOwn, setHomeOwn, [25,50,60,70,80,90,100].map(function(v){return {v:String(v),l:v+"%"};}))}
     {fs2("交割费", homeClosing, setHomeClosing, [0,10000,20000,30000,40000,50000,60000].map(v=>({v:String(v),l:fmtMoney(v)})))}</div>
        <div onClick={function() { setHomeHasLoan(!homeHasLoan); }} style={{ display: "flex", alignItems: "center", padding: "4px 0", cursor: "pointer", marginBottom: 4 }}>
     <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: homeHasLoan ? C.text : "#2A7A4B" }}>{homeHasLoan ? "有房贷 Mortgage" : "无房贷 No Mortgage"}</span>
     <div style={{ width: 32, height: 18, borderRadius: 0, background: homeHasLoan ? C.blue : C.border, padding: 2, transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: 0, background: "#fff", boxShadow: "none", transform: homeHasLoan ? "translateX(14px)" : "translateX(0)", transition: "transform 0.2s" }}></div></div>
        </div>
        {homeHasLoan && <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
     {fs2("首付%", homeDownPct, setHomeDownPct, [0,3,5,10,15,20,25,30,40,50].map(function(v){return {v:String(v),l:v+"%"};}))}
     {fs2("利率%", homeAnnRate, setHomeAnnRate, Array.from({length:33},function(_,i){return {v:(3+i*0.25).toFixed(2),l:(3+i*0.25).toFixed(2)+"%"};}))}
     {fs2("年限", homeLoanYrs, setHomeLoanYrs, ["10","15","20","25","30"].map(function(y){return {v:y,l:y+"yr"};}))}
     {(parseFloat(homeDownPct)||20) < 20 && fs2("PMI%", homePmiRate, setHomePmiRate, [0.3,0.4,0.5,0.6,0.7,0.8,1.0,1.2,1.5,2.0].map(function(v){return {v:String(v),l:v+"%/yr"};}))}
        </div>}
        {(parseFloat(homeDownPct)||20) < 20 && homeHasLoan && <div style={{ fontSize: 8.5, color: "#A8385F", marginBottom: 4, padding: "2px 6px", background: "#F7F7F7", borderRadius: 0}}>注意 首付低于20%需缴PMI · 权益达20%后可申请取消 · 22%自动取消</div>}
        {homePropType === "coop" ? <>
     <div style={{ fontSize: 8.5, color: C.muted, marginBottom: 3, padding: "2px 6px", background: "#F7F7F7", borderRadius: 0}}>Co-op管理费通常包含地税+保险+部分Utilities+人员+维修基金</div>
     <div style={FG6}>{fs2("管理费/月", homeCoopMaint, setHomeCoopMaint, [500,600,700,800,900,1000,1100,1200,1400,1600,1800,2000,2500,3000].map(function(v){ return {v:String(v),l:"$"+v};}))}
      {fs2("个人保险/月", homeInsurance, setHomeInsurance, [0,25,50,75,100,150,200,300].map(v=>({v:String(v),l:"$"+v})))}
      {fs2("Utilities/月", homeUtils, setHomeUtils, [0,50,75,100,150,200,250,300].map(v=>({v:String(v),l:"$"+v})))}</div>
     <div style={FG6}>{fs2("成本涨幅/年", homeCostGrowth, setHomeCostGrowth, [0,1,2,3,4,5,6,7,8].map(function(v){return {v:String(v),l:v>0?v+"%":"不涨"};}))}
      {fs2("升值涨幅/年", appRate, setAppRate, [{v:"2",l:"保守2%"},{v:"3",l:"普通3%"},{v:"4",l:"4%"},{v:"5",l:"热门5%"},{v:"6",l:"6%"},{v:"7",l:"高速7%"},{v:"8",l:"8%"}])}</div>
        </> : <>
     <div style={FG6}>{fs2("地税/月", homeTax, setHomeTax, [0,100,150,200,250,300,400,500,600,800,1000].map(v=>({v:String(v),l:"$"+v})))}
      {fs2("保险/月", homeInsurance, setHomeInsurance, [0,50,100,150,200,250,300,400,500].map(v=>({v:String(v),l:"$"+v})))}
      {fs2("Utilities/月", homeUtils, setHomeUtils, [0,50,100,150,200,250,300,400,500].map(v=>({v:String(v),l:"$"+v})))}
      {fs2("维修/月", homeMaint, setHomeMaint, [0,50,100,150,200,250,300,400,500].map(v=>({v:String(v),l:"$"+v})))}</div>
     <div style={FG6}>
      {(homePropType === "th" || homePropType === "mf") && fs2("HOA/月", homeHoa, setHomeHoa, [0,100,200,300,400,500,600,800,1000,1500,2000].map(v=>({v:String(v),l:"$"+v})))}
      {homePropType === "mf" && fs2("租金收入/月", homeRentMo, setHomeRentMo, [0,500,1000,1500,2000,2500,3000,4000,5000].map(v=>({v:String(v),l:"$"+v})))}</div>
     <div style={FG6}>{fs2("成本涨幅/年", homeCostGrowth, setHomeCostGrowth, [0,1,2,3,4,5,6,7,8].map(function(v){return {v:String(v),l:v>0?v+"%":"不涨"};}))}
      {fs2("升值涨幅/年", appRate, setAppRate, [{v:"2",l:"保守2%"},{v:"3",l:"普通3%"},{v:"4",l:"4%"},{v:"5",l:"热门5%"},{v:"6",l:"6%"},{v:"7",l:"高速7%"},{v:"8",l:"8%"}])}</div>
        </>}</div>
      <div className="sec-anim" style={{ margin: "0 14px 8px", animationDelay: "0.2s" }}>
        <button className="btn3d" onClick={function() { setShowReport(true); setCalcMode("home"); setWantHome(true); trackEvent("home"); }} style={{ width: "100%", padding: "14px 0", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, border: "none", background: "#121212", color: "#fff", boxSizing: "border-box", boxShadow: "none", textShadow: "none" }}>
     自住房分析
        </button></div>
  </>}
      {/* Usage Guide */}
      <div style={{ margin: "8px 14px 0" }}>
        <button onClick={() => setShowGuide(!showGuide)} style={{ width: "100%", padding: "10px 0", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, border: "none", borderTop: "1px solid " + C.rule, background: "transparent", color: C.text, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between", letterSpacing: "0.02em" }}>
     <span>使用说明 User Guide</span>
     <span style={{ fontSize: 12, transform: showGuide ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
        </button>
        {showGuide && <div style={{ background: "#fff", borderRadius: 0, padding: "2px 0 12px", fontSize: 13, fontFamily: C.serif, color: C.sub, lineHeight: 1.7 }}>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, textTransform: "uppercase", letterSpacing: "0.06em", color: C.text, marginBottom: 4 }}>三大模式</div>
     <div><b>FIRE财务自由</b> — 综合模拟薪资储蓄+股票复利+投资房+自住房，计算何时达成财务自由</div>
     <div><b>房产投资分析</b> — 单套投资房Deal评分(A-F)，含NOI瀑布图、雷达图、估值对比、税盾BRRRR</div>
     <div><b>自住房分析</b> — 房价预测+贷款+持有成本模拟，含提前还贷对比和PMI计算</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, textTransform: "uppercase", letterSpacing: "0.06em", color: C.text, marginTop: 10, marginBottom: 4 }}>自住房特色功能</div>
     <div><b>房型选择</b> — 独栋/联排/Condo/Co-op/多户，不同房型有不同默认费用和输入项</div>
     <div><b>折线图交互</b> — 点击图表任意年份查看该年房价、净资产、贷款余额，成本明细同步更新</div>
     <div><b>提前还贷</b> — 滑动slider实时对比加速还清vs原30年，显示节省时间和利息</div>
     <div><b>里程碑竖线</b> — 当前/本{">"+ ""}息交叉/还清时间点，自动标注在折线图上</div>
     <div><b>智能估算</b> — 地税1.1%·保险0.4%·维修1%·Utilities$150-200，未输入时自动套用市场均值</div>
     <div><b>PMI自动计算</b> — 首付{"<"}20%自动加入PMI费用，权益达20%后自动移除</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, textTransform: "uppercase", letterSpacing: "0.06em", color: C.text, marginTop: 10, marginBottom: 4 }}>投资分析特色</div>
     <div><b>Deal评分</b> — 6项指标(CoC/DSCR/Cap/IRR/盈亏平衡/折扣率)加权评分A+→F</div>
     <div><b>NOI瀑布图</b> — 从毛租金到净现金流的逐步分解</div>
     <div><b>税盾/BRRRR</b> — 折旧节税计算和BRRRR策略模拟</div>
     <div>+ <b>自定义费用</b> — 装修费+律师费/验房费/评估费等可动态添加</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, textTransform: "uppercase", letterSpacing: "0.06em", color: C.text, marginTop: 10, marginBottom: 4 }}>通用功能</div>
     <div><b>多币种</b> — USD/CNY/EUR/GBP/JPY/CAD/TWD/HKD/MOP，按内置固定汇率换算（非实时）</div>
     <div><b>存档/读档</b> — 存档把全部参数复制到剪贴板，读档时粘贴回来即可恢复</div>
     <div><b>月/年切换</b> — 所有金额支持月度和年度视角切换</div>
        </div>}</div>
      {/* Formula Reference */}
      <div style={{ margin: "0 14px 10px", borderBottom: "1px solid " + C.rule }}>
        <button onClick={() => setShowFormulas(!showFormulas)} style={{ width: "100%", padding: "10px 0", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, border: "none", borderTop: "1px solid " + C.rule, background: "transparent", color: C.text, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between", letterSpacing: "0.02em" }}>
     <span>计算公式 & 逻辑 Formulas</span>
     <span style={{ fontSize: 12, transform: showFormulas ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
        </button>
        {showFormulas && <div style={{ background: "#fff", borderRadius: 0, padding: "2px 0 12px", fontSize: 11, color: C.sub, lineHeight: 1.8, fontFamily: "Menlo, Consolas, monospace" }}>
     <div style={{ fontWeight: 700, fontSize: 10, color: C.text, marginBottom: 4 }}>贷款 Mortgage</div>
     <div>月供 P&I = L × r / (1 - (1+r)^(-n))</div>
     <div>贷款余额 Bal(k) = L × ((1+r)^N - (1+r)^k) / ((1+r)^N - 1)</div>
     <div>提前还贷: 每月额外还 E → 新余额 = Bal - (P&I本金部分 + E)</div>
     <div style={{ color: C.muted }}>L=贷款额 r=月利率 n=总月数 k=已还月数 E=额外还款</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, color: C.text, marginTop: 10, marginBottom: 2 }}>PMI 私人抵押保险</div>
     <div>PMI/月 = 贷款额 × PMI费率% / 12</div>
     <div>触发条件: 首付 {"<"} 20%</div>
     <div>取消条件: 权益 ≥ 20%(申请) 或 ≥ 22%(自动)</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, color: C.text, marginTop: 10, marginBottom: 2 }}>现金流 Cash Flow</div>
     <div>毛租金 GRI = 月租 × 12</div>
     <div>运营费 OpEx = GRI × 费率%</div>
     <div>NOI = GRI - OpEx</div>
     <div>净CF = NOI - 年供DS - 硬钱贷利息</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, color: C.text, marginTop: 10, marginBottom: 2 }}>回报率 Returns</div>
     <div>Cap Rate = NOI / 成交价</div>
     <div>CoC = 净CF / TCI</div>
     <div>DSCR = NOI / 年供DS</div>
     <div>GRM = 成交价 / 年毛租金</div>
     <div>TCI = 首付 + 过户费 + 装修费 + 自定义费用</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, color: C.text, marginTop: 10, marginBottom: 2 }}>自住房预测 Home Projection</div>
     <div>未来房价 = 买入价 × (1 + 升值率)^年数</div>
     <div>未来净资产 = 房价 - 贷款余额</div>
     <div>持有成本(第N年) = 当前费用 × (1 + 成本涨幅)^N</div>
     <div>本{">"+""}息交叉: 月供中本金 {">"} 利息的时间点</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, color: C.text, marginTop: 10, marginBottom: 2 }}>智能默认值 Smart Defaults</div>
     <div>地税 = 房价 × 1.1% / 12</div>
     <div>保险 = 房价 × 0.4% / 12 (Co-op: $50)</div>
     <div>维修 = 房价 × 1.0% / 12 (Condo: 0.5%)</div>
     <div>Utilities = $200 (Condo: $150, Co-op: $100)</div>
     <div>Co-op管理费 = 房价 × 0.8% / 12 + $500</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, color: C.text, marginTop: 10, marginBottom: 2 }}>评分 Deal Score</div>
     <div>6项指标加权: CoC·DSCR·Cap·IRR·盈亏平衡·折扣率</div>
     <div>A+(≥90) A(≥80) B(≥65) C(≥45) D(≥25) F({"<"}25)</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, color: C.text, marginTop: 10, marginBottom: 2 }}>FIRE 财务自由</div>
     <div>被动收入 = 租金CF + 退休账户 + 社保 + 股息 + 存款利息</div>
     <div>净值 = 投资房净值 + 自住房净值 + 401K + 股票 + 存款</div>
     <div>FIRE达成: 被动收入 ≥ 月目标 或 净值 ≥ 目标</div>
     <div style={{ fontWeight: 700, fontSize: 11, fontFamily: C.sans, color: C.text, marginTop: 10, marginBottom: 2 }}>折旧税盾 Depreciation</div>
     <div>年折旧 = (成交价 × (1-土地占比)) / 27.5</div>
     <div>税盾节税 = 年折旧 × 边际税率</div>
     <div>税后CoC = (净CF + 税盾) / TCI</div>
        </div>}</div>
      <footer style={{ textAlign: "center", fontSize: 11, color: C.muted, margin: "0 14px 28px", lineHeight: 1.6 }}>
        <div style={{ fontFamily: C.serif, fontWeight: 900, fontSize: 16, color: C.text, letterSpacing: "0.06em" }}>钱景</div>© {new Date().getFullYear()} JMJ Invest LLC · 仅供参考，不构成投资建议</footer>
      {saveModal === "import" && (
    <div style={overlay} onClick={() => setSaveModal(null)}>
      <div style={mBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
     <span style={{ fontSize: 18, fontWeight: 700, fontFamily: C.serif, color: C.text}}>读取配置</span>
     <button onClick={() => setSaveModal(null)} style={{ background: C.inset, border: "none", borderRadius: 0, color: C.sub, fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button></div>
        <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 6 }}>从备忘录复制之前保存的配置，粘贴到下方，点击「应用」。</div>
        <textarea placeholder='在此粘贴配置内容...' value={importText} onChange={e => setImportText(e.target.value)} style={{ width: "100%", height: 120, fontSize: 10.5, fontFamily: "monospace", border: "1px solid " + C.border, borderRadius: 0, padding: 8, boxSizing: "border-box", background: "#fff", color: C.text, resize: "none" }} />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
     <button onClick={function() { navigator.clipboard.readText().then(function(t) { setImportText(t); }).catch(function() {}); }} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, background: C.inset, color: C.sub, border: "1px solid " + C.border, borderRadius: 0, cursor: "pointer" }}>粘贴</button>
     <button onClick={handleApplyImport} disabled={!importText.trim()} style={{ flex: 2, padding: "10px 0", fontSize: 14, fontWeight: 700, background: importText.trim() ? C.blue : C.border, color: "#fff", border: "none", borderRadius: 0, cursor: importText.trim() ? "pointer" : "default" }}>✓ 应用配置</button></div>
        {saveMsg && <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: saveMsg.startsWith("✓") ? C.green : C.red, textAlign: "center" }}>{saveMsg}</div>}</div></div>
      )}</div>
  );}
return (
<div className="page-enter qj-report" style={{ margin: "0 auto", background: "#FFFFFF", padding: "0 14px 24px", boxSizing: "border-box", minHeight: "100vh", position: "relative", fontFamily: 'var(--nyt-sans)', color: C.text, overflowX: "clip", WebkitFontSmoothing: "antialiased", width: "100%" }}>
<style>{`
  @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .page-enter { animation: slideIn 0.35s ease-out both; }
  .qj-report { max-width: 460px; }
  @media (min-width: 760px) {
    .qj-report { max-width: 700px; padding-left: 24px !important; padding-right: 24px !important; }
    .qj-report h1 { font-size: 36px !important; }
    .qj-report .qj-two { grid-template-columns: 1fr 1fr !important; }
  }
`}</style>
{/* App Header */}
<div style={{ position: "sticky", top: 0, zIndex: 5, background: "#FFFFFF", margin: "0 0 8px", padding: "8px 0 0", borderBottom: "3px double " + C.rule }}>
<div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 6, borderBottom: "1px solid " + C.border }}>
<div onClick={function() { setShowReport(false); setIntroMode(""); }} style={{ cursor: "pointer", flexShrink: 0 }} title="回到首页"><Logo small /></div>
<div style={{ flex: 1 }}></div>
<div role="group" aria-label="金额按月或按年显示" style={{ display: "flex", height: 24, border: "1px solid " + C.rule }}>
{[["月", "mo"], ["年", "yr"]].map(([lbl, p]) => (
<button key={p} onClick={() => setRentPeriod(p)} aria-pressed={rentPeriod === p} style={{ padding: "0 9px", height: "100%", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, border: "none", background: rentPeriod === p ? C.text : "transparent", color: rentPeriod === p ? "#fff" : C.text, borderRadius: 0 }}>{lbl}</button>
))}</div>
<button onClick={() => { handleCopyExport(); setSaveMsg("✓ 已保存到剪贴板"); setTimeout(() => setSaveMsg(""), 2000); }} style={{ padding: "0 0 0 6px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, border: "none", background: "transparent", color: C.sub, height: 24 }}>存档</button>
<button onClick={() => setSaveModal("import")} style={{ padding: "0 0 0 6px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, border: "none", background: "transparent", color: C.sub, height: 24 }}>读档</button>
{saveMsg && <span role="status" style={{ fontSize: 11, fontWeight: 600, color: C.green, position: "absolute", top: 38, right: 12, background: "#fff", padding: "3px 8px", border: "1px solid " + C.border, zIndex: 6 }}>{saveMsg}</span>}
</div>
<div style={{ display: "flex", alignItems: "center", height: 32 }}>
<button onClick={() => setShowReport(false)} style={{ padding: "0 10px 0 0", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, border: "none", background: "transparent", color: C.blue, flexShrink: 0 }}>← 修改参数</button>
<div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
{[wantInvest && ["房产投资", "invest"], wantHome && ["自住房", "home"], wantFire && ["FIRE", "overview"]].filter(Boolean).map(([lbl, mode], i) => (
<button key={mode} onClick={() => setCalcMode(mode)} aria-pressed={calcMode === mode} style={{ padding: "0 10px", height: 20, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: calcMode === mode ? 800 : 500, border: "none", borderLeft: i ? "1px solid " + C.border : "none", background: "transparent", color: calcMode === mode ? C.text : C.sub, textDecoration: calcMode === mode ? "underline" : "none", textUnderlineOffset: 5, textDecorationThickness: 2, borderRadius: 0 }}>{lbl}</button>
))}
</div></div>
{calcMode === "overview" && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0 8px", borderTop: "1px solid " + C.border }}>
<span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>每年储蓄分配</span>
<div style={{ flex: 1, minWidth: 0 }}>
  <StackBar height={6} items={[{ l: "房产", v: parseInt(savREPct)||0, c: C.green }, { l: "股票", v: parseInt(savStockPct)||0, c: "#6B4E8C" }, { l: "存款", v: parseInt(savBankPct)||0, c: "#B35C1E" }, { l: retLabel, v: parseInt(sav401Pct)||0, c: "#A8385F" }]} />
  <div style={{ fontSize: 10.5, color: C.sub, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>房产 {savREPct}% · 股票 {savStockPct}% · 存款 {savBankPct}% · {retLabel} {sav401Pct}%</div></div>
<select aria-label="货币" value={currency} onChange={e => setCurrency(e.target.value)} style={{ height: 26, fontSize: 11.5, fontWeight: 600, fontFamily: "inherit", border: "1px solid " + C.borderIn, borderRadius: 0, background: "#fff", color: C.text, padding: "0 2px", cursor: "pointer", flexShrink: 0 }}>
{Object.keys(FX).map(c => <option key={c} value={c}>{CUR_SYM[c]} {c}</option>)}
</select>
</div>}</div>
  {/* ═══ INVEST MODE ═══ */}
  {calcMode === "invest" && <>
    {(() => {
      const ownerPct = Math.min(100, Math.max(0, parseFloat(investOwn) || 100)) / 100;
      const isPartner = ownerPct < 1;
      const isYr = rentPeriod === "yr"; const mul = isYr ? 12 : 1; const per = isYr ? "年" : "月";
      const held = investHeld > 0;
      const total = tci + totalDebt;
      const cfMo = netCF / 12;
      const title = (cfMo >= 0 ? "这套房每" + per + "净赚 " + fmtBig(cfMo * mul) : "这套房每" + per + "要倒贴 " + fmtBig(-cfMo * mul)) + "，综合评级 " + dealGrade;
      const deck = "按成交价 " + fmtBig(sP) + "、首付 " + (parseFloat(downPct) || 0) + "%、利率 " + annRate + "% 计算，现金回报率 " + (coc * 100).toFixed(1) + "%，Cap Rate " + (actualCap * 100).toFixed(1) + "%，净营运收入是月供的 " + (dscr0 > 0 ? dscr0.toFixed(2) : "—") + " 倍。";
      const byline = "钱景 QianJing · " + todayZh() + ((userName || propAddress) ? " · " + [userName, propAddress].filter(Boolean).join(" · ") : "");
      return <>
        <ArticleHead kicker="房产投资分析" title={title} deck={deck} byline={byline}
          right={<label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.sub }}>持股
            <select value={investOwn} onChange={e => setInvestOwn(e.target.value)} style={{ height: 24, fontSize: 11.5, fontWeight: 700, fontFamily: "inherit", border: "1px solid " + C.borderIn, borderRadius: 0, background: "#fff", color: C.text, padding: "0 2px", cursor: "pointer" }}>
              {[5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100].map(v => <option key={v} value={String(v)}>{v}%</option>)}
            </select></label>} />
        <StatRow items={[
          { label: held ? "当前市值" : "成交价", value: fmtBig(held ? investCurrentVal : sP) },
          { label: isYr ? "年租金" : "月租金", value: fmtBig((parseFloat(activeUnitRents[0]) || 0) * mul) },
          { label: "投入资金 TCI", value: fmtBig(tci) },
          { label: isYr ? "年净现金流" : "月净现金流", value: fmtBig(cfMo * mul), color: netCF >= 0 ? C.green : C.red },
        ]} />
        <div style={{ margin: "12px 0 4px" }}>
          <StackBar height={10} items={[{ l: "现金", v: tci, c: C.text }, { l: "贷款", v: totalDebt, c: "#BDBDBD" }]} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.sub, marginTop: 5 }}>
            <span><b style={{ color: C.text }}>现金 {fmtBig(tci)}</b> + 贷款 {fmtBig(totalDebt)}</span>
            <span>合计 {fmtBig(total)}{isPartner ? " · 你占 " + investOwn + "% ≈ " + fmtBig(total * ownerPct) : ""}</span></div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.5, margin: "12px 0 16px" }}>
          <span style={{ color: C.muted }}>延伸计算</span>
          <LinkBtn onClick={() => setModal("prepay")}>摊销时间表</LinkBtn>
          <LinkBtn onClick={() => setModal("depreciation")}>折旧税盾</LinkBtn>
          <LinkBtn onClick={() => setModal("brrrr")}>BRRRR 再融资</LinkBtn>
        </div>
        <Section kicker="综合评分" title={dealDesc.split(" ")[0] + "：六项指标加权得分 " + dealAvg + " 分"}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "center", paddingRight: 16, borderRight: "1px solid " + C.border, flexShrink: 0 }}>
              <div style={{ fontFamily: C.serif, fontSize: 48, fontWeight: 700, lineHeight: 1, color: dealColor }}>{dealGrade}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{dealAvg} / 100</div></div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
              {[
                ["现金回报率 CoC", coc > 0 && coc < 10 ? (coc*100).toFixed(1)+"%" : "—", coc >= 0.08 ? C.green : coc >= 0.04 ? C.orange : C.muted],
                ["偿债覆盖 DSCR", dscr0 > 0 && dscr0 < 100 ? dscr0.toFixed(2)+"x" : "—", dscr0 >= 1.25 ? C.green : dscr0 >= 1 ? C.orange : C.muted],
                ["月净现金流", fmtBig(netCF/12), netCF >= 0 ? C.green : C.red],
                ["Cap Rate", actualCap > 0 ? (actualCap*100).toFixed(1)+"%" : "—", actualCap >= 0.07 ? C.green : actualCap >= 0.04 ? C.orange : C.muted],
              ].map(([k, v, c]) => (
                <div key={k}><div style={{ fontSize: 11, color: C.muted }}>{k}</div><div style={{ fontSize: 16, fontWeight: 700, color: c }}>{v}</div></div>
              ))}</div>
          </div>
        </Section>
      </>;
    })()}
  {/* Cash Flow Waterfall + Expense slider */}
    {(() => {
      const rawOwnerPct = Math.min(100, Math.max(0, parseFloat(investOwn) || 100)) / 100;
      const isPartnerWf = rawOwnerPct < 1;
      const ownerPct = (wfViewAll || !isPartnerWf) ? 1 : rawOwnerPct;
      const scale = rentPeriod === "yr" ? 12 : 1;
      const per = rentPeriod === "yr" ? "年" : "月";
      const sliderVal = parseInt(expSlider) || 35;
      const gross = computedRent * ownerPct * scale;
      const effectiveExpPct = expIdx === 4 ? Math.round(customRatio * 100) : sliderVal;
      const expColor = effectiveExpPct <= 32 ? C.green : effectiveExpPct <= 45 ? C.orange : C.red;
      const expLabel = sliderVal <= 25 ? "NNN 净租约：租客承担地税、保险、Utilities 和维修"
        : sliderVal <= 30 ? "房东自管、不含 Utilities，适合新手小型物业"
        : sliderVal <= 35 ? "房东自管、包 Utilities，中西部多家庭常见"
        : sliderVal <= 40 ? "委托物管、不含 Utilities，管理费约 8–10%"
        : sliderVal <= 45 ? "委托物管、全包 Utilities，远程投资常见"
        : sliderVal <= 50 ? "50% 法则：BiggerPockets 的经验估算"
        : sliderVal <= 55 ? "偏保守：老旧物业或空置率较高"
        : "最保守：含大修预留，适合 40 年以上老房";
      const handleExpSlider = (v) => {
        const val = parseInt(v);
        setExpSlider(v);
        if (val === 30) setExpIdx(0);
        else if (val === 35) setExpIdx(1);
        else if (val === 40) setExpIdx(2);
        else if (val === 45) setExpIdx(3);
        else setExpIdx(5);
      };
      const isCustomExp = expIdx === 4;
      let expBreak;
      let totalExp;
      if (isCustomExp) {
        const vac = gross * (parseFloat(vacancyPct) || 0) / 100;
        const mgm = gross * (parseFloat(mgmtPct) || 0) / 100;
        const tax = (parseFloat(taxMo) || 0) * scale * ownerPct;
        const ins = (parseFloat(insuranceMo) || 0) * scale * ownerPct;
        const mnt = (parseFloat(maintMo) || 0) * scale * ownerPct;
        const utl = (parseFloat(utilitiesMo) || 0) * scale * ownerPct;
        const oth = (parseFloat(otherMo) || 0) * scale * ownerPct;
        totalExp = vac + mgm + tax + ins + mnt + utl + oth;
        expBreak = [];
        if (tax + ins > 0) expBreak.push(["税险", tax + ins]);
        if (mgm > 0) expBreak.push(["管理", mgm]);
        if (utl > 0) expBreak.push(["杂费", utl]);
        const misc = mnt + vac + oth;
        if (misc > 0) expBreak.push(["其他", misc]);
      } else {
        totalExp = gross * sliderVal / 100;
        const eb = sliderVal <= 35
     ? [["税险",26],["其他",74]]
     : sliderVal <= 45
     ? [["税险",22],["管理",22],["杂费",20],["其他",36]]
     : [["税险",19],["管理",18],["杂费",18],["CapEx",15],["其他",30]];
        const ebTotal = eb.reduce((s,a) => s+a[1], 0);
        expBreak = eb.map(function(item) { return [item[0], totalExp * item[1] / ebTotal]; });}
      const noiVal = gross - totalExp;
      const piAmt = totalMonthly * scale * ownerPct;
      const netCFVal = noiVal - piAmt;
      const ncfColor = netCFVal >= 0 ? C.green : C.red;
      const principalAmt = (yr1Principal / 12) * scale * ownerPct;
      const interestAmt = piAmt - principalAmt;
      const DED = "#C4C4C4";
      var wfItems = [];
      wfItems.push({ name: "租金", amt: gross, top: gross, bottom: 0, color: C.text, isTotal: true });
      var cursor = gross;
      for (var ei = 0; ei < expBreak.length; ei++) {
        var ea = expBreak[ei][1];
        if (ea <= 0) continue;
        wfItems.push({ name: expBreak[ei][0], amt: ea, top: cursor, bottom: cursor - ea, color: DED });
        cursor -= ea;}
      wfItems.push({ name: "NOI", amt: Math.abs(noiVal), top: Math.max(noiVal, 0), bottom: Math.min(noiVal, 0), color: C.blue, isTotal: true, isNOI: true });
      cursor = noiVal;
      if (interestAmt > 0) { wfItems.push({ name: "利息", amt: interestAmt, top: cursor, bottom: cursor - interestAmt, color: "#D9A9A7" }); cursor -= interestAmt; }
      if (principalAmt > 0) { wfItems.push({ name: "还本", amt: principalAmt, top: cursor, bottom: cursor - principalAmt, color: DED }); cursor -= principalAmt; }
      wfItems.push({ name: "净现金流", amt: Math.abs(netCFVal), top: Math.max(netCFVal, 0), bottom: Math.min(netCFVal, 0), color: ncfColor, isTotal: true });
      var wfMin = 0, wfMax = gross;
      for (var wi2 = 0; wi2 < wfItems.length; wi2++) { if (wfItems[wi2].top > wfMax) wfMax = wfItems[wi2].top; if (wfItems[wi2].bottom < wfMin) wfMin = wfItems[wi2].bottom; }
      var wfRange = (wfMax - wfMin) * 1.08; if (wfRange <= 0) wfRange = 1;
      const barH = 200;
      const usableH = barH - 26;
      const keepPct = gross > 0 ? Math.round(netCFVal / gross * 100) : 0;
      return (
        <Section kicker="现金流" title={"每收 $100 租金，最后落袋 $" + Math.max(keepPct, 0)}
          deck={"从" + per + "租金 " + fmtBig(gross) + " 开始，依次扣掉运营费、贷款利息和本金，剩下的 " + fmtBig(netCFVal) + " 才是真正到手的现金流。"}
          right={isPartnerWf ? <Seg options={[["全部", "all"], ["我的 " + investOwn + "%", "mine"]]} value={wfViewAll ? "all" : "mine"} onChange={v => setWfViewAll(v === "all")} /> : null}>
     <div style={{ position: "relative" }}>
      {(() => {
       var range = wfMax - wfMin;
       var step = range <= 500 ? 100 : range <= 1500 ? 250 : range <= 3000 ? 500 : range <= 8000 ? 1000 : range <= 15000 ? 2500 : range <= 40000 ? 5000 : range <= 100000 ? 20000 : 50000;
       var gridMin = Math.floor(wfMin / step) * step;
       var gridMax = Math.ceil(wfMax / step) * step;
       var lines = [];
       for (var gv = gridMin; gv <= gridMax; gv += step) {
        var yPct = ((gv - wfMin) / wfRange) * usableH;
        if (yPct >= -2 && yPct <= usableH + 2) lines.push({ val: gv, px: yPct });}
       return lines.map(function(line, li) {
        var isZero = line.val === 0;
        return <div key={li} style={{ position: "absolute", left: 38, right: 0, bottom: 22 + line.px, height: 0, borderTop: isZero ? "1px solid #121212" : "1px solid #EBEBEB", zIndex: isZero ? 5 : 0 }}>
         <span style={{ position: "absolute", left: -38, top: -7, fontSize: 10, color: C.muted, width: 34, textAlign: "right" }}>{fmtAxis(line.val)}</span>
        </div>;});
      })()}
      <div style={{ display: "flex", gap: 0, height: barH, position: "relative", marginLeft: 38 }}>
       {wfItems.map(function(item, idx) {
        var topPx = ((item.top - wfMin) / wfRange) * usableH;
        var botPx = ((item.bottom - wfMin) / wfRange) * usableH;
        var h = Math.max(2, Math.abs(topPx - botPx));
        var bot = Math.max(0, Math.min(botPx, topPx));
        var isT = item.isTotal;
        var isNeg = item.top <= 0 && item.bottom < 0;
        var valText = (isNeg || (!isT) ? "−" : "") + (item.amt >= 1000 ? "$" + (item.amt / 1000).toFixed(item.amt >= 10000 ? 0 : 1) + "K" : "$" + Math.round(item.amt));
        return (
         <div key={idx} style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <div style={{ position: "absolute", left: "14%", right: "14%", bottom: 22 + bot, height: h, background: item.color, zIndex: 2 }} />
          <div style={{ position: "absolute", left: -4, right: -4, bottom: 22 + bot + h + 3, textAlign: "center", fontSize: 10.5, fontWeight: isT ? 700 : 500, color: isT ? C.text : C.sub, zIndex: 3, whiteSpace: "nowrap" }}>{valText}</div>
          <div style={{ position: "absolute", bottom: 3, left: -2, right: -2, textAlign: "center", fontSize: 11, fontWeight: isT ? 700 : 400, color: isT ? C.text : C.sub, lineHeight: 1, whiteSpace: "nowrap" }}>{item.name}</div></div>
        );
       })}</div></div>
     <KeyRow items={[["收入与小计", C.text], ["NOI 净营运收入", C.blue], ["运营费与还本", DED], ["贷款利息", "#D9A9A7"]]} />
     <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid " + C.border }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
       <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>运营费占租金</span>
       <Seg options={[["快速估算", "quick"], ["逐项输入", "custom"]]} value={isCustomExp ? "custom" : "quick"} onChange={v => { if (v === "custom") setExpIdx(4); else if (expIdx === 4) setExpIdx(3); }} />
       <div style={{ flex: 1 }}></div>
       <span style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 700, color: expColor }}>{isCustomExp ? Math.round(customRatio*100) : sliderVal}%</span></div>
      {!isCustomExp && (
       <div>
        <input type="range" aria-label="运营费占租金比例" min={20} max={60} step={1} value={sliderVal} onChange={e => handleExpSlider(e.target.value)} style={{ width: "100%", accentColor: C.text, cursor: "pointer", margin: 0 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.muted, marginTop: 2 }}>
         <span>20% 租客全包</span><span>60% 房东全包</span></div>
        <p style={{ fontFamily: C.serif, fontStyle: "italic", fontSize: 13, color: C.sub, margin: "6px 0 0" }}>{expLabel}</p></div>
      )}
      {isCustomExp && (() => {
       const isYr = rentPeriod === "yr";
       const mul = isYr ? 12 : 1;
       const pSfx = isYr ? "/年" : "/月";
       const mkOpts = (max, step) => Array.from({length: Math.floor(max/step)+1}, (_, i) => i*step);
       const selStyle = { width: "100%", height: 30, fontSize: 12, fontWeight: 600, fontFamily: "inherit", border: "1px solid " + C.borderIn, borderRadius: 0, background: "#fff", color: C.text, padding: "0 4px", cursor: "pointer", boxSizing: "border-box" };
       const items = [
        ["空置率", vacancyPct, setVacancyPct, mkOpts(30,1).map(v=>({v:String(v),l:v+"%"}))],
        ["管理费", mgmtPct, setMgmtPct, mkOpts(20,1).map(v=>({v:String(v),l:v+"%"}))],
        ["维修"+pSfx, maintMo, setMaintMo, mkOpts(2000,50).map(v=>({v:String(v),l:"$"+(v*mul).toLocaleString("en-US")}))],
        ["地税"+pSfx, taxMo, setTaxMo, mkOpts(2000,50).map(v=>({v:String(v),l:"$"+(v*mul).toLocaleString("en-US")}))],
        ["保险"+pSfx, insuranceMo, setInsuranceMo, mkOpts(1000,50).map(v=>({v:String(v),l:"$"+(v*mul).toLocaleString("en-US")}))],
        ["杂费"+pSfx, utilitiesMo, setUtilitiesMo, mkOpts(2000,50).map(v=>({v:String(v),l:"$"+(v*mul).toLocaleString("en-US")}))],
        ["其他"+pSfx, otherMo, setOtherMo, mkOpts(1000,50).map(v=>({v:String(v),l:"$"+(v*mul).toLocaleString("en-US")}))],
       ];
       return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8 }}>
         {items.map(([label, val, setter, opts]) => (
          <label key={label} style={{ display: "block" }}>
           <div style={{ fontSize: 11, color: C.sub, marginBottom: 2 }}>{label}</div>
           <select value={val} onChange={e => setter(e.target.value)} style={selStyle}>
            {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
           </select></label>
         ))}</div>);
      })()}</div>
        </Section>);
    })()}
    {/* Valuation + Radar */}
      {(() => {
        const dscr = totalAnnDS > 0 ? noi / totalAnnDS : 0;
        const breakevenOcc = grossRent > 0 ? (annualExp + totalAnnDS) / grossRent : 0;
        const aR2 = parseFloat(appRate) / 100 || 0.03;
        const exitVal2 = sP * Math.pow(1 + aR2, 5);
        const exitDebt2 = loanBal(loanAmt, calc.aR, calc.lY, 5);
        const cfs2 = [-tci, netCF, netCF, netCF, netCF, netCF + exitVal2 - exitDebt2];
        const npvFn = r => cfs2.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
        let irrVal = null;
        if (tci > 0 && npvFn(-0.5) * npvFn(5) < 0) {
     let lo2 = -0.5, hi2 = 5;
     for (let i = 0; i < 200; i++) { const mid = (lo2 + hi2) / 2; if (Math.abs(hi2 - lo2) < 1e-6) { irrVal = mid; break; } npvFn(mid) * npvFn(lo2) < 0 ? (hi2 = mid) : (lo2 = mid); }}
        const capRateActual = sP > 0 ? noi / sP : 0;
        const cocScore = norm(coc, 0, 0.12);
        const dscrScore = norm(dscr, 0.8, 1.5);
        const eqScore = norm(eqAdj, 0, 0.15);
        const irrScore = irrVal !== null ? norm(irrVal, 0, 0.25) : 0;
        const beScore = norm(breakevenOcc, 1.0, 0.5);
        const capScore = norm(capRateActual, 0.02, 0.10);
        const vm = { "CoC": coc>0&&coc<10?fmtPct(coc*100):"—", "DSCR": dscr>0&&dscr<100?dscr.toFixed(2)+"x":"—", "权益回报": eqAdj>-5&&eqAdj<5?fmtPct(eqAdj*100):"—", "IRR": irrVal!==null&&irrVal>-1&&irrVal<5?fmtPct(irrVal*100):"—", "盈亏平衡": grossRent>0&&breakevenOcc<5?fmtPct(breakevenOcc*100):"—", "Cap": capRateActual>0&&capRateActual<1?fmtPct(capRateActual*100):"—" };
        const smap = { "CoC": cocScore, "DSCR": dscrScore, "权益回报": eqScore, "IRR": irrScore, "盈亏平衡": beScore, "Cap": capScore };
        const hmap = { "CoC": "基准 ≥8%", "DSCR": "基准 ≥1.25x", "权益回报": "基准 ≥10%", "IRR": "基准 ≥15%", "盈亏平衡": "基准 ≤70%", "Cap": "基准 3–8%" };
        const rd = [
     { metric: "CoC", you: Math.round(cocScore), benchmark: 60 },
     { metric: "DSCR", you: Math.round(dscrScore), benchmark: 65 },
     { metric: "权益回报", you: Math.round(eqScore), benchmark: 55 },
     { metric: "IRR", you: Math.round(irrScore), benchmark: 50 },
     { metric: "盈亏平衡", you: Math.round(beScore), benchmark: 60 },
     { metric: "Cap", you: Math.round(capScore), benchmark: 50 },
        ];
        const renderTick = (props) => {
     const { x, y, payload, viewBox } = props;
     const name = payload.value;
     const val = vm[name] || "";
     const sc = smap[name] || 0;
     const hint = hmap[name] || "";
     const clr = sc >= 60 ? C.green : sc >= 35 ? C.orange : C.red;
     const vcx = viewBox && viewBox.cx ? viewBox.cx : 100;
     const vcy = viewBox && viewBox.cy ? viewBox.cy : 100;
     const ddx = x - vcx, ddy = y - vcy;
     const dist = Math.sqrt(ddx*ddx + ddy*ddy);
     const push = 16;
     const fx = dist > 0 ? x + ddx/dist * push : x;
     const fy = dist > 0 ? y + ddy/dist * push : y - push;
     const anchor = fx > vcx + 5 ? "start" : fx < vcx - 5 ? "end" : "middle";
     const yOff = fy < vcy - 15 ? -14 : fy > vcy + 15 ? 4 : -6;
     return (
      <g>
       <text x={fx} y={fy+yOff} textAnchor={anchor} style={{ fontSize: 10.5, fontWeight: 700, fill: C.sub, fontFamily: "var(--nyt-sans)" }}>{name}</text>
       <text x={fx} y={fy+yOff+13} textAnchor={anchor} style={{ fontSize: 12.5, fontWeight: 700, fill: clr, fontFamily: "var(--nyt-sans)" }}>{val}</text>
       <text x={fx} y={fy+yOff+24} textAnchor={anchor} style={{ fontSize: 9, fill: C.muted, fontFamily: "var(--nyt-sans)" }}>{hint}</text>
      </g>);
        };
        const cr = parseFloat(capRate) || 5;
        const crLabel = cr <= 3 ? "顶级地段" : cr <= 4 ? "核心区" : cr <= 5 ? "优质区" : cr <= 6 ? "成熟区" : cr <= 7 ? "热门区" : cr <= 8 ? "成长区" : cr <= 9 ? "现金流型" : cr <= 10 ? "高收益区" : cr <= 11 ? "高风险区" : "投机型";
        const priceDiscount = sP > 0 ? (impliedVal - sP) / sP : 0;
        const maxBar = Math.max(sP, impliedVal, grossRent * 10) * 1.05;
        const actualCR = sP > 0 ? noi / sP : 0;
        const diff = actualCR - cr / 100;
        return <>
        <Section kicker="估值" title={priceDiscount >= 0 ? "成交价比现金流估值低 " + fmtPct(priceDiscount*100) : "成交价比现金流估值高 " + fmtPct(Math.abs(priceDiscount)*100)}
          deck={"现金流估值 = 净营运收入 ÷ 你设定的 Cap Rate（" + cr + "%）；租金估值按年租金的 10 倍粗算。" + (impliedVal >= sP && grossRent * 10 >= sP ? "两种估值都高于成交价，价格偏便宜。" : impliedVal < sP && grossRent * 10 < sP ? "两种估值都低于成交价，价格偏贵。" : "两种估值一高一低，价格大致合理。")}>
          <HBar label="成交价" value={fmtBig(sP)} pct={maxBar > 0 ? sP / maxBar * 100 : 0} color={C.text} />
          <HBar label="现金流估值" note={"Cap " + cr + "%"} value={fmtBig(impliedVal)} pct={maxBar > 0 ? impliedVal / maxBar * 100 : 0} color={C.blue} />
          <HBar label="租金估值" note={"GRM " + (grossRent > 0 && sP/grossRent < 100 ? (sP/grossRent).toFixed(1) : "—") + "x"} value={fmtBig(grossRent * 10)} pct={maxBar > 0 ? grossRent * 10 / maxBar * 100 : 0} color="#999999" />
          <div style={{ marginTop: 14 }}>
           <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>设定 Cap Rate</span>
            <span><span style={{ fontFamily: C.serif, fontSize: 20, fontWeight: 700 }}>{cr}%</span> <span style={{ fontSize: 11.5, color: C.sub }}>{crLabel}</span></span></div>
           <input type="range" aria-label="设定 Cap Rate" min={2} max={12} step={0.5} value={capRate} onChange={e => setCapRate(e.target.value)} style={{ width: "100%", accentColor: C.text, cursor: "pointer", margin: 0 }} />
           <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.muted, marginTop: 2 }}>
            <span>2% 核心区</span><span>5% 优质</span><span>8% 现金流</span><span>12% 高风险</span></div>
           {actualCR > 0 && <p style={{ fontSize: 12, color: C.sub, margin: "8px 0 0" }}>这套房实际 Cap Rate 为 <b style={{ color: C.text }}>{(actualCR*100).toFixed(1)}%</b>，<b style={{ color: diff >= 0 ? C.green : C.red }}>{diff >= 0 ? "高于" : "低于"}</b>设定值 {Math.abs(diff*100).toFixed(1)} 个百分点。</p>}
          </div>
        </Section>
        <Section kicker="尽职调查" title="六项指标，和基准比一比" deck="实线是这套房的得分，虚线是一般投资人要求的基准；越往外越好。">
          <ResponsiveContainer width="100%" height={300}>
           <RadarChart data={rd} cx="50%" cy="50%" outerRadius={88} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <PolarGrid stroke="#E2E2E2" />
            <PolarAngleAxis dataKey="metric" tick={renderTick} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="benchmark" stroke="#999999" fill="#999999" fillOpacity={0.06} strokeWidth={1} strokeDasharray="4 3" />
            <Radar dataKey="you" stroke={C.text} fill={C.text} fillOpacity={0.08} strokeWidth={2} />
           </RadarChart>
          </ResponsiveContainer>
        </Section>
        </>;
      })()}
  </>}
  {/* ═══ HOME MODE ═══ */}
  {calcMode === "home" && <>
      {(() => {
        const hSP = parseFloat(homeSaleP) || 0;
        const hLP = parseFloat(homeListP) || 0;
        const hOwn = (pF(homeOwn) || 100) / 100;
        const hDP = (pF(homeDownPct) || 20) / 100;
        const hLoan = homeHasLoan ? hSP * (1 - hDP) : 0;
        const hR = (pF(homeAnnRate) || 6.75) / 100 / 12;
        const hN = (pI(homeLoanYrs) || 30) * 12;
        const hPI = hLoan > 0 && hR > 0 ? hLoan * hR / (1 - Math.pow(1 + hR, -hN)) : 0;
        const hCurBal = homeHeld > 0 && hLoan > 0 ? loanBal(hLoan, parseFloat(homeAnnRate)||6.75, parseInt(homeLoanYrs)||30, homeHeld) : hLoan;
        const hHoa = parseFloat(homeHoa) || 0;
        // Smart defaults based on market averages when user hasn't set values
        const autoTax = homePropType !== "coop" ? Math.round(hSP * 0.011 / 12) : 0;
        const autoIns = homePropType === "coop" ? 50 : Math.round(hSP * 0.004 / 12);
        const autoUtil = homePropType === "coop" ? 100 : homePropType === "condo" ? 150 : 200;
        const autoMaint = homePropType === "coop" ? 0 : homePropType === "condo" ? Math.round(hSP * 0.005 / 12) : Math.round(hSP * 0.01 / 12);
        const useTax = pF(homeTax) || autoTax;
        const useIns = pF(homeInsurance) || autoIns;
        const useUtil = pF(homeUtils) || autoUtil;
        const useMaint = pF(homeMaint) || autoMaint;
        const useCoopM = homePropType === "coop" ? pF(homeCoopMaint) || Math.round(hSP * 0.008 / 12 + 500) : 0;
        const hEquityPct = hLP > 0 ? (hLP - hCurBal) / hLP : 1;
        const hNeedsPMI = homeHasLoan && hDP < 0.20 && hEquityPct < 0.20;
        const hPmiMo = hNeedsPMI ? hLoan * (pF(homePmiRate) || 0.5) / 100 / 12 : 0;
        const hFixed = homePropType === "coop" ? useCoopM + useIns + useUtil + hPmiMo : useTax + useIns + useUtil + useMaint + hHoa + hPmiMo;
        const hTotalMo = hPI + hFixed;
        const hEquity = hLP - hCurBal;
        const hClose = parseFloat(homeClosing) || 0;
        const hReno = parseFloat(homeRenovation) || 0;
        const hTCI = (homeHasLoan ? hSP * hDP : hSP) + hClose + hReno;
        const isYr = rentPeriod === "yr";
        const mul = isYr ? 12 : 1;
        const per = isYr ? "年" : "月";
        const costItems = [
     hPI > 0 && { l: "月供", v: hPI, c: C.text, xtra: modalXtra > 0 ? modalXtra : 0 },
     hPmiMo > 0 && { l: "PMI", v: hPmiMo, c: "#A8385F" },
     homePropType === "coop" && useCoopM > 0 && { l: "管理费", v: useCoopM, c: "#5A5A5A", est: !pF(homeCoopMaint) },
     homePropType !== "coop" && useTax > 0 && { l: "地税", v: useTax, c: "#5A5A5A", est: !pF(homeTax) },
     useIns > 0 && { l: "保险", v: useIns, c: "#5A5A5A", est: !pF(homeInsurance) },
     hHoa > 0 && { l: "HOA", v: hHoa, c: "#5A5A5A" },
     useUtil > 0 && { l: "杂费", v: useUtil, c: "#5A5A5A", est: !pF(homeUtils) },
     homePropType !== "coop" && useMaint > 0 && { l: "维修", v: useMaint, c: "#5A5A5A", est: !pF(homeMaint) },
        ].filter(Boolean);
        const hasEstimates = costItems.some(function(x) { return x.est; });
        const lastSim = homeSim.length ? homeSim[homeSim.length - 1] : null;
        const title = "住这套房，每" + per + "实际要花 " + fmtBig(hTotalMo * mul);
        const deck = (hPI > 0 ? "其中月供 " + fmtBig(hPI * mul) + "，" : "没有房贷，") + "地税、保险、维修等固定开支 " + fmtBig(hFixed * mul) + "。" + (lastSim ? "按每年升值 " + appRate + "% 估算，" + lastSim.calYr + " 年房子约值 " + fmtBig(lastSim.homeVal) + "，净资产 " + fmtBig(lastSim.equity) + "。" : "");
        return <>
      <ArticleHead kicker="自住房分析" title={title} deck={deck}
        right={<label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.sub }}>持股
          <select value={homeOwn} onChange={function(e) { setHomeOwn(e.target.value); }} style={{ height: 24, fontSize: 11.5, fontWeight: 700, fontFamily: "inherit", border: "1px solid " + C.borderIn, borderRadius: 0, background: "#fff", color: C.text, padding: "0 2px", cursor: "pointer" }}>
           {[25,50,60,70,80,90,100].map(function(v) { return <option key={v} value={String(v)}>{v}%</option>; })}
          </select></label>} />
      <StatRow items={[
        { label: "当前市值", value: fmtBig(hLP) },
        { label: "净资产", value: fmtBig(hEquity * hOwn), color: hEquity >= 0 ? C.green : C.red },
        { label: homeHasLoan && hPI > 0 ? per + "持有成本" : per + "固定费用", value: fmtBig(hTotalMo * mul) },
        { label: "总投入", value: fmtBig(hTCI) },
      ]} />
      {hTotalMo > 0 && (() => {
       var selRow = selSimIdx !== null && selSimIdx < homeSim.length ? homeSim[selSimIdx] : null;
       var projYr = selRow ? selRow.calYr : 2026;
       var yrsOut = Math.max(0, projYr - 2026);
       var cgr = 1 + (pF(homeCostGrowth) || 3) / 100;
       var projMul = Math.pow(cgr, yrsOut);
       var projPI = selRow && selRow.debt < 0.01 ? 0 : hPI;
       var projItems = costItems.map(function(item) {
         if (item.l === "月供") {
           var actualPI = projPI + (projPI > 0 ? (modalXtra||0) : 0);
           return { l: modalXtra > 0 ? "月供+提前还" : "月供", v: actualPI, orig: hPI, c: item.c, changed: actualPI !== hPI };
         }
         if (item.l === "PMI") return selRow && selRow.debt < 0.01 ? null : item;
         var projected = Math.round(item.v * projMul);
         return { l: item.l, v: projected, orig: item.v, c: item.c, est: item.est, changed: yrsOut > 0 && projected !== item.v };
       }).filter(Boolean);
       var projTotal = projItems.reduce(function(s, x) { return s + x.v; }, 0);
       var maxV = Math.max.apply(null, projItems.map(function(x) { return x.v; })) || 1;
       var top = projItems.slice().sort(function(a, b) { return b.v - a.v; })[0];
       return <Section style={{ marginTop: 18 }} kicker={selRow ? projYr + " 年预测" : "持有成本"}
         title={"每" + per + " " + fmtBig(projTotal * mul) + "，" + (top ? top.l + "占 " + Math.round(top.v / (projTotal || 1) * 100) + "%" : "")}
         deck={selRow ? "按固定开支每年上涨 " + (pF(homeCostGrowth)||3) + "% 推算到 " + projYr + " 年；在下方图表上点一下可换年份。" : "今天的持有成本构成。灰色是房贷以外的固定开支；标 * 的是你没填、按市场平均估算的数。"}>
       {projItems.map(function(item, i) {
        var isPayoff = item.l.indexOf("月供") === 0 && item.v === 0;
        var pct = projTotal > 0 ? Math.round(item.v / projTotal * 100) : 0;
        return (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, height: 22 }}>
          <span style={{ fontSize: 12, color: C.sub, width: 76, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.l}{item.est ? "*" : ""}</span>
          <div style={{ flex: 1, height: 10, background: "#F0F0F0", position: "relative" }}>
           {item.changed && <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: (item.orig / maxV * 100) + "%", borderRight: "2px solid #121212" }} />}
           <div style={{ height: "100%", width: (item.v / maxV * 100) + "%", background: item.c, opacity: item.est ? 0.45 : 1 }} /></div>
          <span style={{ fontSize: 12, fontWeight: 700, width: 64, textAlign: "right", flexShrink: 0, color: isPayoff ? C.green : C.text }}>{isPayoff ? "已还清" : fmtBig(item.v * mul)}</span>
          <span style={{ fontSize: 11, color: C.muted, width: 30, textAlign: "right", flexShrink: 0 }}>{pct}%</span>
        </div>); })}
       {hasEstimates && <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic", marginTop: 4 }}>* 按市场平均估算</div>}
       </Section>;
      })()}
      </>;
      })()}
      {homeSim.length > 0 && (() => {
        const last = homeSim[homeSim.length - 1];
        var msPrepayOff = null, msBaseOff = null, msCrossover = null, msCrossPrepay = null;
        var hAR_m = (parseFloat(homeAnnRate)||6.75)/100/12;
        var hLoan_m = homeHasLoan ? (parseFloat(homeSaleP)||0) * (1 - (parseFloat(homeDownPct)||20)/100) : 0;
        var hPI_m = hLoan_m > 0 && hAR_m > 0 ? hLoan_m * hAR_m / (1 - Math.pow(1 + hAR_m, -(parseInt(homeLoanYrs)||30)*12)) : 0;
        var buyYr_m = alreadyBought && purchaseYear ? parseInt(purchaseYear)||2026 : 2026;
        if (hLoan_m > 0) {
     var bP = hLoan_m, bB = hLoan_m;
     for (var yrM = 0; yrM < 60; yrM++) {
      for (var moM = 0; moM < 12; moM++) {
       if (bB > 0.01) { var iB = bB * hAR_m; var pB = Math.max(0, hPI_m - iB); bB = Math.max(0, bB - pB); if (bB < 0.01 && !msBaseOff) msBaseOff = buyYr_m + yrM; if (!msCrossover && pB > iB) msCrossover = buyYr_m + yrM; }
       if (bP > 0.01) { var iP = bP * hAR_m; var pPrepay = Math.max(0, hPI_m - iP) + (yrM >= (2026 - buyYr_m) ? (modalXtra||0) : 0); bP = Math.max(0, bP - pPrepay); if (bP < 0.01 && !msPrepayOff) msPrepayOff = buyYr_m + yrM; if (!msCrossPrepay && pPrepay > iP) msCrossPrepay = buyYr_m + yrM; }
      }}}
        var chartEnd = last.calYr, chartStart = homeSim[0].calYr;
        var sel = selSimIdx !== null && selSimIdx < homeSim.length ? homeSim[selSimIdx] : last;
        var selYr = sel.calYr;
        var isFaded = function(yr) { return selSimIdx !== null && yr >= selYr; };
        const PAD_L = 50, PAD_R = 8;
        return <Section kicker={"未来 " + wYears + " 年"} title={!homeHasLoan ? "房价会涨到多少" : modalXtra > 0 && msPrepayOff && msBaseOff && msBaseOff > msPrepayOff ? "多还一点，贷款提前 " + (msBaseOff - msPrepayOff) + " 年还清" : "房价、净资产与贷款余额"}
          deck={"黑线是房价（每年升值 " + appRate + "%），绿线是净资产，红线是贷款余额。在图上点一下或拖动，可以看某一年的数字。"}
          right={selSimIdx !== null ? <LinkBtn onClick={() => setSelSimIdx(null)}>回到 {last.calYr} ✕</LinkBtn> : null}>
     <StatRow size={17} items={[
        { label: sel.calYr + " 房价", value: fmtBig(sel.homeVal) },
        { label: "净资产", value: fmtBig(sel.equity), color: C.green },
        homeHasLoan && { label: "贷款余额", value: sel.debt > 0.01 ? fmtBig(sel.debt) : "已还清", color: sel.debt > 0.01 ? C.red : C.green },
        { label: "固定开支/月", value: fmtBig(sel.cFixed) },
     ]} />
     <div style={{ position: "relative", touchAction: "none", marginTop: 10 }}
       onPointerDown={function(e) {
         var el = e.currentTarget;
         var rect = el.getBoundingClientRect();
         var chartW = rect.width - PAD_L - PAD_R;
         var calcIdx = function(cx) {
           var rel = (cx - rect.left - PAD_L) / chartW;
           rel = Math.max(0, Math.min(1, rel));
           return Math.round(rel * (homeSim.length - 1));
         };
         setSelSimIdx(calcIdx(e.clientX));
         var onMove = function(ev) { ev.preventDefault(); setSelSimIdx(calcIdx(ev.clientX)); };
         var onUp = function() { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
         window.addEventListener("pointermove", onMove);
         window.addEventListener("pointerup", onUp);
       }}
     >
      <ResponsiveContainer width="100%" height={230}>
       <ComposedChart data={homeSim} margin={{ top: 22, right: PAD_R, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#EBEBEB" />
        <XAxis dataKey="calYr" tickFormatter={v => String(v)} tick={{ fill: C.muted, fontSize: 10.5 }} interval={Math.max(0, Math.ceil(homeSim.length / 6) - 1)} axisLine={{ stroke: C.text }} tickLine={false} />
        <YAxis yAxisId="left" tickFormatter={v => fmtAxis(v)} tick={{ fill: C.muted, fontSize: 10.5 }} width={PAD_L} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" hide={true} domain={[0, function(m) { return m * 3.2; }]} />
        {homeHasLoan && <Bar yAxisId="right" dataKey="cPI" stackId="cost" fill="#121212" fillOpacity={0.07} barSize={8} />}
        <Bar yAxisId="right" dataKey="cFixed" stackId="cost" fill="#121212" fillOpacity={0.04} barSize={8} />
        {homeSim[0].held && <ReferenceArea yAxisId="left" x1={chartStart} x2={2026} fill="#121212" fillOpacity={0.05} />}
        {homeSim[0].held && <ReferenceLine yAxisId="left" x={2026} stroke="#999999" strokeWidth={1} label={{ value: "今天", position: "top", fontSize: 10.5, fill: C.sub }} />}
        {msCrossover && msCrossover <= chartEnd && <ReferenceLine yAxisId="left" x={modalXtra > 0 && msCrossPrepay ? msCrossPrepay : msCrossover} stroke="#999999" strokeDasharray="3 3" strokeWidth={1} opacity={isFaded(msCrossover) ? 0.3 : 1} label={{ value: "本金>利息", position: "top", fontSize: 10.5, fill: C.sub }} />}
        {msPrepayOff && modalXtra > 0 && msPrepayOff <= chartEnd && <ReferenceLine yAxisId="left" x={msPrepayOff} stroke={C.red} strokeWidth={1} label={{ value: "提前还清", position: "insideTopLeft", fontSize: 10.5, fill: C.red }} />}
        {msBaseOff && msBaseOff <= chartEnd && <ReferenceLine yAxisId="left" x={msBaseOff} stroke="#999999" strokeDasharray="3 3" strokeWidth={1} opacity={isFaded(msBaseOff) ? 0.3 : 1} label={{ value: (modalXtra > 0 ? "原" : "") + homeLoanYrs + "年还清", position: "insideTopRight", fontSize: 10.5, fill: C.sub }} />}
        {selSimIdx !== null && sel && <ReferenceLine yAxisId="left" x={sel.calYr} stroke={C.blue} strokeWidth={1.5} label={{ value: String(sel.calYr), position: "insideBottomRight", fontSize: 11, fontWeight: 700, fill: C.blue }} />}
        <Line yAxisId="left" dataKey="homeVal" stroke="#121212" dot={false} strokeWidth={2.5} isAnimationActive={false} />
        <Line yAxisId="left" dataKey="equity" stroke={C.green} dot={false} strokeWidth={2} isAnimationActive={false} />
        {modalXtra > 0 && <Line yAxisId="left" dataKey="debtBase" stroke={C.red} strokeOpacity={0.35} dot={false} strokeWidth={1.5} strokeDasharray="5 3" isAnimationActive={false} />}
        {homeHasLoan && <Line yAxisId="left" dataKey="debt" stroke={C.red} dot={false} strokeWidth={2} isAnimationActive={false} />}
       </ComposedChart>
      </ResponsiveContainer>
      </div>
     <KeyRow items={[["房价", "#121212", "line"], ["净资产", C.green, "line"], homeHasLoan && ["贷款余额", C.red, "line"], modalXtra > 0 && ["原计划贷款", C.red, "line", 0.35], ["每年持有成本（柱）", "#121212", "box", 0.12], homeSim[0].held && ["已持有年份", "#121212", "box", 0.08]]} />
     <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
      <span style={{ fontSize: 12, color: C.sub, flexShrink: 0 }}>预测年数</span>
      <input type="range" aria-label="预测年数" min={5} max={50} step={1} value={wYears} onChange={e => setWYears(e.target.value)} style={{ flex: 1, accentColor: C.text, cursor: "pointer", margin: 0 }} />
      <span style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 700, width: 52, textAlign: "right" }}>{wYears} 年</span>
     </div>
        </Section>;
      })()}
    {/* Prepayment & Amortization */}
    {homeHasLoan && (() => {
      var hSP2 = parseFloat(homeSaleP)||0, hDP2 = (parseFloat(homeDownPct)||20)/100;
      var hLoan2 = hSP2 * (1 - hDP2);
      var hAR2 = (parseFloat(homeAnnRate)||6.75)/100/12, hN2 = (parseInt(homeLoanYrs)||30)*12;
      var hPI2 = hLoan2 > 0 && hAR2 > 0 ? hLoan2 * hAR2 / (1 - Math.pow(1 + hAR2, -hN2)) : 0;
      var buyYr2 = alreadyBought && purchaseYear ? parseInt(purchaseYear)||2026 : 2026;
      var heldMo = Math.max(0, (2026 - buyYr2) * 12);
      var paidPrin = 0, paidInt = 0, bal2 = hLoan2;
      for (var mm = 0; mm < heldMo && bal2 > 0.01; mm++) { var ii = bal2 * hAR2; var pp = Math.max(0, hPI2 - ii); paidPrin += pp; paidInt += ii; bal2 = Math.max(0, bal2 - pp); }
      var balB = bal2, balP = bal2, moBase = 0, moPrep = 0, intB2 = 0, intP2 = 0;
      for (var mm2 = 0; mm2 < hN2 - heldMo && balB > 0.01; mm2++) { var i1 = balB * hAR2; balB = Math.max(0, balB - Math.max(0, hPI2 - i1)); intB2 += i1; moBase = mm2 + 1; }
      for (var mm3 = 0; mm3 < hN2 - heldMo && balP > 0.01; mm3++) { var i2 = balP * hAR2; balP = Math.max(0, balP - Math.max(0, hPI2 - i2) - modalXtra); intP2 += i2; moPrep = mm3 + 1; }
      var moSaved = moBase - moPrep, intSaved = intB2 - intP2;
      return <Section kicker="提前还贷" title={modalXtra > 0 ? "每月多还 $" + modalXtra.toLocaleString("en-US") + "，省下 " + fmtBig(intSaved) + " 利息" : "每月多还一点，能省多少利息？"}
        deck={heldMo > 0 ? "你已经还了 " + Math.floor(heldMo/12) + " 年 " + (heldMo%12) + " 个月：本金 " + fmtBig(paidPrin) + "，利息 " + fmtBig(paidInt) + "，剩余贷款 " + fmtBig(bal2) + "。" : "拖动下面的滑杆，看每月额外还款能让贷款提前几年还清。"}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
     <span style={{ fontSize: 12, color: C.sub, flexShrink: 0 }}>每月多还</span>
     <input type="range" aria-label="每月提前还款" min={0} max={5000} step={50} value={modalXtra} onChange={function(e) { setModalXtra(parseInt(e.target.value)); }} style={{ flex: 1, accentColor: C.text, cursor: "pointer", margin: 0 }} />
     <span style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 700, width: 70, textAlign: "right", flexShrink: 0 }}>{modalXtra > 0 ? "$" + modalXtra.toLocaleString("en-US") : "$0"}</span>
        </div>
        {modalXtra > 0 && <StatRow size={17} items={[
      { label: "原计划还清", value: moToYrMo(moBase + heldMo) },
      { label: "提前后还清", value: moToYrMo(moPrep + heldMo) },
      { label: "少还时间", value: moSaved > 0 ? moToYrMo(moSaved) : "—", color: C.green },
      { label: "少付利息", value: intSaved > 0 ? fmtBig(intSaved) : "—", color: C.green },
        ]} />}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
     <button onClick={() => setModal("prepay")} style={{ flex: 1, height: 40, borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, background: "#fff", border: "1px solid #121212", color: "#121212" }}>摊销时间表</button>
     <button onClick={() => { setRptStep(0); setRptYear(String(2026 + Math.min(parseInt(wYears)||30, 20))); setRptPrepay(modalXtra); setModal("homeReport"); }} style={{ flex: 1, height: 40, borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, background: "#121212", border: "1px solid #121212", color: "#fff" }}>自住房报告</button>
        </div></Section>;
    })()}
  </>}
  {/* ═══ OVERVIEW — FIRE Journey ═══ */}
  {calcMode === "overview" && (() => {
    const invOwn = (parseFloat(investOwn) || 100) / 100;
    const hmOwn = (pF(homeOwn) || 100) / 100;
    const invEquity = wantInvest ? (investHeld > 0 ? investAdjEquity : (computedSalePTotal || pF(saleP)) - loanAmt) : 0;
    const homeEquity = wantHome ? (() => {
      const hSP = parseFloat(homeSaleP)||0;
      if (hSP <= 0) return 0;
      const hVal = hSP * Math.pow(1 + (parseFloat(appRate)||3)/100, homeHeld);
      if (!homeHasLoan) return hVal;
      const hLn = hSP * (1 - (parseFloat(homeDownPct)||20)/100);
      const hBal = homeHeld > 0 ? loanBal(hLn, parseFloat(homeAnnRate)||6.75, parseInt(homeLoanYrs)||30, homeHeld) : hLn;
      return hVal - hBal;
    })() : 0;
    const k401B = parseFloat(k401Balance) || 0;
    const bankB = parseFloat(bankSavings) || 0;
    const stockB = parseFloat(stockAccount) || 0;
    const cdR = parseFloat(cdRate) / 100 || 0.04;
    const bwPct = parseFloat(bankWithdrawPct) / 100 || 0;
    const totalNW = invEquity * invOwn + homeEquity * hmOwn + k401B + bankB + stockB;
    const cmpYrs = parseInt(compoundYears) || 40;
    const uAge = parseInt(userAge) || 30;
    const rAge = parseInt(retireAge) || freedomAge || Math.max(uAge + 5, 40);
    const eTax = parseFloat(effectiveTax) / 100 || 0.15;
    const futureLastW = wealthRows.length > 0 ? wealthRows[wealthRows.length - 1] : null;
    const fireYrRow = fireRow || futureLastW;
    const fireYrs = freedomAge ? Math.max(0, freedomAge - uAge) : cmpYrs;
    const futureHomeEq = wantHome && homeSim.length > 0 ? homeSim[Math.min(cmpYrs, homeSim.length - 1)].equity : 0;
    const futureBankVal = bankB * Math.pow(1 + cdR * (1 - bwPct), cmpYrs);
    const futureStockVal = stockB * Math.pow(1 + (parseFloat(stockCAGR)/100 || 0.08), cmpYrs);
    const futureNW = (futureLastW ? futureLastW.netWorth : totalNW) + futureHomeEq * hmOwn + futureBankVal + futureStockVal;
    const fireHomeEq = wantHome && homeSim.length > 0 ? homeSim[Math.min(fireYrs, homeSim.length - 1)].equity : 0;
    const fireBankVal = bankB * Math.pow(1 + cdR * (1 - bwPct), fireYrs);
    const fireStockVal = stockB * Math.pow(1 + (parseFloat(stockCAGR)/100 || 0.08), fireYrs);
    const fireNW = freedomAge && fireYrRow ? fireYrRow.netWorth + fireHomeEq * hmOwn + fireBankVal + fireStockVal : futureNW;
    const reMonthly = wantInvest && netCF > 0 ? (netCF / 12) * invOwn : 0;
    const k401g = parseFloat(k401CAGR) / 100 || 0.08;
    const yrsTo401 = Math.max(0, (parseInt(k401DrawAge)||60) - uAge);
    const k401Future = k401B * Math.pow(1 + k401g, yrsTo401);
    const k401MonthlyEst = k401Future * (parseFloat(k401SWR)/100 || 0.04) / 12;
    const ssMonthly = ssEstimate || 0;
    const totalPassive = reMonthly + (uAge >= (parseInt(k401DrawAge)||60) ? k401MonthlyEst : 0) + (uAge >= (parseInt(ssClaimAge)||67) ? ssMonthly : 0);
    const fireTarget = ffMode === "income" ? parseFloat(ffIncomeTgt) || 10000 : parseFloat(ffWealthTgt) || 3000000;
    const fireCurrent = ffMode === "income" ? totalPassive : totalNW;
    const fireProgress = fireTarget > 0 ? Math.min(fireCurrent / fireTarget, 1) : 0;
    const minFireAge = freedomAge || (uAge + 1);
    const mul = rentPeriod === "yr" ? 12 : 1;
    const retireYrs = Math.max(0, rAge - uAge);
    const retireRow = wealthRows.find(d => d.age === rAge) || futureLastW;
    const rRE = wantInvest ? (retireRow ? (retireRow.monthlyRE || reMonthly) : reMonthly) : 0;
    const rK401 = rAge >= (parseInt(k401DrawAge)||60) ? (retireRow && retireRow.k401Val ? retireRow.k401Val * (parseFloat(k401SWR)/100||0.04) / 12 : k401MonthlyEst) : 0;
    const rSS = rAge >= (parseInt(ssClaimAge)||67) ? ssMonthly : 0;
    const actualBankAtRetire = retireRow && retireRow.cashPool ? retireRow.cashPool : bankB * Math.pow(1+cdR, retireYrs);
    const actualStockAtRetire = retireRow && retireRow.stockValue ? retireRow.stockValue : stockB * Math.pow(1+(parseFloat(stockCAGR)/100||0.08), retireYrs);
    const rBank = actualBankAtRetire * Math.max(cdR, 0.02) / 12;
    const rStock = actualStockAtRetire * 0.04 / 12;
    const rTotal = rRE + rK401 + rSS + rBank + rStock;
    const rWithdraw = rTotal * (1 - eTax);
    const assets = [
      wantInvest && { l: "投资房"+investOwn+"%", v: invEquity*invOwn, c: C.blue },
      wantHome && { l: "自住"+homeOwn+"%", v: homeEquity*hmOwn, c: C.accent },
      { l: retLabel, v: k401B, c: "#6A93B3" },
      { l: "股票", v: stockB, c: "#6B4E8C" },
      { l: "存款", v: bankB, c: C.green },
    ].filter(Boolean);
    const totalAssets = assets.reduce((s,a) => s+Math.max(0,a.v), 0);
    const D = (v) => rentPeriod === "yr" ? fxM(v * 12) : fxM(v);
    const pfx = rentPeriod === "yr" ? "/年" : "/月";
    const rRow = retireRow || {};
    const realOrNom = function(row) { return row ? (showNominal ? (row.netWorth || 0) : (row.nwReal || row.netWorth || 0)) : 0; };
    const tgtLabel = ffMode === "income" ? "每" + (rentPeriod === "yr" ? "年" : "月") + "被动收入 " + D(parseFloat(ffIncomeTgt)||10000) : "净资产 " + fxM(parseFloat(ffWealthTgt)||3000000);
    const title = freedomAge ? "按现在的计划，你 " + freedomAge + " 岁就能财务自由" : "按现在的计划，被动收入还追不上目标";
    const deck = "你今年 " + uAge + " 岁，净资产 " + fxM(totalNW) + "，目标是" + tgtLabel + "。" + (freedomAge ? "比 67 岁法定退休早 " + Math.max(0, 67 - freedomAge) + " 年；" : "可以提高储蓄率、调低目标或加入投资房再试。") + (retireRow ? rAge + " 岁退休时，净资产约 " + fxM(realOrNom(rRow)) + (showNominal ? "。" : "（按今天的购买力）。") : "");
    var stage, stageColor, stageNote;
    if (!freedomAge) { stage = "尚需积累"; stageColor = C.muted; stageNote = "当前设定下达不到 FIRE，请调整目标或储蓄率"; }
    else if (rAge <= freedomAge - 5) { stage = "激进退休"; stageColor = C.red; stageNote = "比 FIRE 早 " + (freedomAge-rAge) + " 年，存款可能不够，需要额外收入"; }
    else if (rAge < freedomAge) { stage = "半退休"; stageColor = C.orange; stageNote = "比 FIRE 早 " + (freedomAge-rAge) + " 年，还需要少量工作或兼职"; }
    else if (rAge === freedomAge) { stage = "财务自由"; stageColor = C.green; stageNote = "被动收入正好覆盖目标，再工作 " + Math.max(0,rAge-uAge) + " 年"; }
    else if (rAge <= freedomAge + 3) { stage = "稳妥退休"; stageColor = C.green; stageNote = "比 FIRE 多攒 " + (rAge-freedomAge) + " 年，安全边际更厚"; }
    else if (rAge < 67) { stage = "宽裕退休"; stageColor = C.blue; stageNote = "多攒 " + (rAge-freedomAge) + " 年，退休生活很宽裕"; }
    else { stage = "延迟退休"; stageColor = C.blue; stageNote = "工作到法定退休年龄，积累最多"; }
    return (
      <div>
        <ArticleHead kicker="FIRE 财务自由" title={title} deck={deck} />
        <StatRow items={[
          { label: "今天 · " + uAge + " 岁", value: fxM(totalNW), sub: "被动收入 " + D(totalPassive) + pfx },
          { label: rAge + " 岁退休时", value: fxM(realOrNom(rRow)), color: freedomAge && rAge >= freedomAge ? C.green : C.text, sub: "被动收入 " + D(rRow.monthlyTotalPsv || 0) + pfx },
          { label: (uAge + cmpYrs) + " 岁 · 模拟终点", value: lastW ? fxM(realOrNom(lastW)) : "—", sub: lastW ? "被动收入 " + D(lastW.monthlyTotalPsv || 0) + pfx : "" },
        ]} />
        <p style={{ fontSize: 11, color: C.muted, margin: "6px 0 0" }}>{showNominal ? "以上为名义金额。" : "以上按通胀 " + inflRate + "% 折算成今天的购买力。"}{wantInvest && calc.cocNoDbt > coc ? " 投资房还清贷款后，每" + (rentPeriod === "yr" ? "年" : "月") + "现金流可再多 " + D((totalAnnDS/12)*invOwn) + "。" : ""}</p>
        <Section style={{ marginTop: 16 }} kicker="目标进度" title={"已经完成目标的 " + (fireProgress*100).toFixed(0) + "%"}
          deck={"目标按" + (ffMode === "income" ? "被动收入（已扣税 " + effectiveTax + "%）" : "净资产") + "计算；拖动滑杆改目标，上面的结论会跟着变。"}
          right={<Seg options={[["按收入", "income"], ["按净资产", "wealth"]]} value={ffMode} onChange={setFfMode} />}>
     <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: C.sub, flexShrink: 0 }}>目标</span>
      {ffMode === "income" ?
       <input type="range" aria-label="目标被动收入" min={2000} max={20000} step={500} value={parseInt(ffIncomeTgt)||10000} onChange={function(e) { setFfIncomeTgt(e.target.value); }} style={{ flex: 1, accentColor: C.text, cursor: "pointer", margin: 0 }} /> :
       <input type="range" aria-label="目标净资产" min={1000000} max={20000000} step={500000} value={parseInt(ffWealthTgt)||3000000} onChange={function(e) { setFfWealthTgt(e.target.value); }} style={{ flex: 1, accentColor: C.text, cursor: "pointer", margin: 0 }} />
      }
      <span style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 700, whiteSpace: "nowrap" }}>{ffMode==="income"?D(parseFloat(ffIncomeTgt)||10000)+pfx:fxM(parseFloat(ffWealthTgt)||3000000)}</span>
     </div>
     <div style={{ position: "relative", height: 12, background: "#EEEEEE" }}>
      <div style={{ height: "100%", width: (fireProgress*100)+"%", background: fireProgress>=1 ? C.green : C.text, transition: "width 0.3s" }} />
      {[25,50,75].map(m => <div key={m} style={{ position: "absolute", left: m+"%", top: 0, width: 1, height: "100%", background: "#fff" }} />)}
     </div>
     <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.muted, marginTop: 3 }}>
      <span>现在 {ffMode==="income"?D(totalPassive)+pfx:fxM(totalNW)}</span><span>50%</span><span>目标</span></div>
        </Section>
        <Section kicker="退休时间" title={freedomAge ? stage + "：" + rAge + " 岁退休" : "还没到能退休的时候"}
          deck={stageNote + "。" + (rAge < (parseInt(ssClaimAge)||67) ? ssLabel + " " + ssClaimAge + " 岁起领" : "已含" + ssLabel) + "，" + (rAge >= (parseInt(k401DrawAge)||60) ? retLabel + "可以提取" : retLabel + " " + k401DrawAge + " 岁起提取") + "。"}>
     {freedomAge ? <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, color: C.sub, flexShrink: 0 }}>自选退休年龄</span>
      <input type="range" aria-label="自选退休年龄" min={uAge+1} max={70} step={1} value={rAge} onChange={function(e) { var v = parseInt(e.target.value); setRetireAge(String(v)); setRetireManual(true); }} style={{ flex: 1, accentColor: C.text, cursor: "pointer", margin: 0 }} />
      <span style={{ fontFamily: C.serif, fontSize: 22, fontWeight: 700, color: stageColor, width: 56, textAlign: "right" }}>{rAge} 岁</span>
     </div> : null}
     {freedomAge && freedomAge !== rAge && <p style={{ fontSize: 11.5, color: C.muted, margin: "6px 0 0" }}>最早可 FIRE 的年龄是 {freedomAge} 岁。</p>}
        </Section>
        {wealthRows.length > 0 && (
        <Section kicker="净资产走势" title={"从 " + uAge + " 岁到 " + (uAge + cmpYrs) + " 岁，资产怎么长"}
          deck={(showInflAdj && parseFloat(inflRate) > 0 ? "橙线是扣掉通胀后的真实购买力，" : "蓝线是退休前、绿线是退休后的净资产，") + (showIncomeLine ? "灰柱是每年的被动收入（右轴）" : "") + (showStockComp ? "，紫色虚线是同样的钱全放指数基金的结果" : "") + "。"}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontSize: 12, marginBottom: 8 }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", color: C.sub }}><input type="checkbox" checked={showIncomeLine} onChange={function(e) { setShowIncomeLine(e.target.checked); }} style={{ accentColor: C.text, cursor: "pointer" }} />被动收入</label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", color: C.sub }}><input type="checkbox" checked={showStockComp} onChange={function(e) { setShowStockComp(e.target.checked); }} style={{ accentColor: C.text, cursor: "pointer" }} />指数基金对比</label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", color: C.sub }}><input type="checkbox" checked={showInflAdj} onChange={function(e) { if (!e.target.checked) { setShowInflAdj(false); setShowNominal(false); } else { setShowInflAdj(true); } }} style={{ accentColor: C.text, cursor: "pointer" }} />扣除通胀</label>
      </div>
      <ResponsiveContainer width="100%" height={230}>
       <ComposedChart data={wealthRows} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#EBEBEB" />
        <XAxis dataKey="age" tickFormatter={v => v+"岁"} tick={{ fill: C.muted, fontSize: 10.5 }} interval={Math.max(0, Math.ceil(wealthRows.length/6)-1)} axisLine={{ stroke: C.text }} tickLine={false} />
        <YAxis yAxisId="left" tickFormatter={v => fmtAxis(v)} tick={{ fill: C.muted, fontSize: 10.5 }} width={50} axisLine={false} tickLine={false} />
        {showIncomeLine && <YAxis yAxisId="right" orientation="right" tickFormatter={v => fmtAxis(v)} tick={{ fill: "#999999", fontSize: 10.5 }} width={42} axisLine={false} tickLine={false} />}
        <Tooltip content={<CustomTooltip />} />
        {showIncomeLine && <Bar yAxisId="right" dataKey={rentPeriod==="yr"?(showInflAdj&&parseFloat(inflRate)>0?"annPsvReal":"annPsv"):(showInflAdj&&parseFloat(inflRate)>0?"psvReal":"monthlyTotalPsv")} name={rentPeriod==="yr"?"年收入":"月收入"} fill="#121212" opacity={0.1} maxBarSize={10} isAnimationActive={false} />}
        {(!showInflAdj || parseFloat(inflRate)<=0 || showNominal) && <Line yAxisId="left" dataKey="netWorthPre" name="积累期(名义)" stroke={C.blue} dot={false} strokeWidth={showInflAdj&&parseFloat(inflRate)>0?1.5:2.5} strokeDasharray={showInflAdj&&parseFloat(inflRate)>0?"4 2":""} opacity={showInflAdj&&parseFloat(inflRate)>0?0.35:1} connectNulls={false} isAnimationActive={false} />}
        {(!showInflAdj || parseFloat(inflRate)<=0 || showNominal) && <Line yAxisId="left" dataKey="netWorthPost" name="退休期(名义)" stroke={C.green} dot={false} strokeWidth={showInflAdj&&parseFloat(inflRate)>0?1.5:2.5} strokeDasharray={showInflAdj&&parseFloat(inflRate)>0?"4 2":""} opacity={showInflAdj&&parseFloat(inflRate)>0?0.35:1} connectNulls={false} isAnimationActive={false} />}
        {showInflAdj && parseFloat(inflRate) > 0 && <Line yAxisId="left" dataKey="nwReal" name="实际购买力" stroke={C.orange} dot={false} strokeWidth={2.5} isAnimationActive={false} />}
        {(() => {
         const refLines = [];
         if (freedomAge) refLines.push({ x: freedomAge, label: rAge===freedomAge?"FIRE=退休":"FIRE", color: C.green });
         if (rAge !== freedomAge) refLines.push({ x: rAge, label: "退休", color: C.text });
         if ((uAge+cmpYrs)>=67) refLines.push({ x: 67, label: "法定退休", color: "#999999" });
         var investPayoffAge = Math.round(uAge + Math.max(0, investPayoffYrs - investHeld));
         if (wantInvest && investPayoffAge > uAge && investPayoffAge <= uAge+cmpYrs) refLines.push({ x: investPayoffAge, label: "投资房清贷", color: C.blue });
         if (wantHome && homeHasLoan) { var homePayoffAge = Math.round(uAge + Math.max(0, homePayoffYrs - homeHeld)); if (homePayoffAge > uAge && homePayoffAge <= uAge+cmpYrs) refLines.push({ x: homePayoffAge, label: "自住房清贷", color: "#2B7A78" }); }
         refLines.sort((a,b) => a.x - b.x);
         return refLines.map((r, i) => (
          <ReferenceLine key={i} yAxisId="left" x={r.x} stroke={r.color} strokeDasharray="3 3" strokeWidth={1}
           label={({ viewBox: vb }) => <text x={(vb.x||0) + 3} y={(vb.y||0) + 11 + (i % 3) * 13} style={{ fontSize: 10.5, fontWeight: 700, fill: r.color, fontFamily: "var(--nyt-sans)" }}>{r.label} {r.x}</text>} />
         ));
        })()}
        {showStockComp && <Line yAxisId="left" dataKey="stockValue" name="指数" stroke="#6B4E8C" dot={false} strokeWidth={1.5} strokeDasharray="6 3" isAnimationActive={false} />}
       </ComposedChart>
      </ResponsiveContainer>
      <KeyRow items={[(!showInflAdj || parseFloat(inflRate)<=0 || showNominal) && ["退休前净资产", C.blue, "line"], (!showInflAdj || parseFloat(inflRate)<=0 || showNominal) && ["退休后净资产", C.green, "line"], showInflAdj && parseFloat(inflRate) > 0 && ["今日购买力", C.orange, "line"], showStockComp && ["全投指数", "#6B4E8C", "line"], showIncomeLine && ["被动收入（右轴）", "#121212", "box", 0.15]]} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
       <span style={{ fontSize: 12, color: C.sub, flexShrink: 0 }}>模拟年数</span>
       <input type="range" aria-label="模拟年数" min={5} max={60} step={1} value={parseInt(compoundYears)||44} onChange={function(e) { setCompoundYears(e.target.value); setWYears(e.target.value); }} style={{ flex: 1, accentColor: C.text, cursor: "pointer", margin: 0 }} />
       <span style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 700, width: 52, textAlign: "right" }}>{compoundYears} 年</span></div>
        </Section>
        )}
        {retireRow && (() => {
     const eTax2 = parseFloat(effectiveTax) / 100 || 0.15;
     const reM = wantInvest ? (rRow.monthlyRE || 0) : 0;
     const k401M = rAge >= (parseInt(k401DrawAge)||60) ? (rRow.k401Val ? rRow.k401Val * (parseFloat(k401SWR)/100||0.04) / 12 : k401MonthlyEst) : 0;
     const ssM = rAge >= (parseInt(ssClaimAge)||67) ? (ssEstimate||0) : 0;
     const accBank = rRow.cashPool || (parseFloat(bankSavings)||0) * Math.pow(1+(parseFloat(cdRate)/100||0.04), Math.max(0,rAge-uAge));
     const accStock = rRow.stockValue || (parseFloat(stockAccount)||0) * Math.pow(1+(parseFloat(stockCAGR)/100||0.08), Math.max(0,rAge-uAge));
     const bankM = accBank * Math.max(parseFloat(cdRate)/100||0.04, 0.02) / 12;
     const stockM = accStock * 0.04 / 12;
     const totM = reM + k401M + ssM + bankM + stockM;
     const aftTax = totM * (1 - eTax2);
     const CL2 = { re: C.green, k401: "#A8385F", ss: C.blue, bank: "#B35C1E", stock: "#6B4E8C" };
     const replRate2 = (parseFloat(annualIncome)||100000) > 0 ? aftTax*12/((parseFloat(annualIncome)||100000)*Math.pow(1+(parseFloat(incomeGrowth)/100||0.03), Math.max(0,rAge-uAge)))*100 : 0;
     const retireNW = rRow.nwReal || rRow.netWorth || 0;
     const invOwnP = (parseFloat(investOwn)||100)/100;
     const reEquity = (rRow.netWorth||0) - (rRow.cashPool||0) - (rRow.k401Val||0);
     const assetItems = (wantInvest ? [["房产", Math.max(0,reEquity*invOwnP), CL2.re]] : []).concat([[retLabel, rRow.k401Val||0, CL2.k401], ["股票", accStock, CL2.stock], ["存款", accBank, CL2.bank]]).filter(function(a){return a[1]>0;});
     const assetTotal = assetItems.reduce(function(s,a){return s+a[1];}, 0);
     const incItems = (wantInvest ? [["租金",reM,CL2.re]] : []).concat([[retLabel,k401M,CL2.k401],[ssLabel,ssM,CL2.ss],["存款利息",bankM,CL2.bank],["股息",stockM,CL2.stock]]).filter(function(a){return a[1]>0;});
     const table = (items, total, fmt) => (
      <div>
       <StackBar height={12} total={total} items={items.map(function(a) { return { l: a[0], v: a[1], c: a[2] }; })} />
       <div style={{ marginTop: 8 }}>
        {items.map(([l,v,cl]) => (
         <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: "1px solid #EEEEEE", fontSize: 12.5 }}>
          <span style={{ width: 9, height: 9, background: cl, flexShrink: 0 }} />
          <span style={{ flex: 1, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l}</span>
          <span style={{ fontWeight: 700 }}>{fmt(v)}</span>
          <span style={{ width: 36, textAlign: "right", color: C.muted, fontSize: 11 }}>{total>0?Math.round(v/total*100):0}%</span></div>
        ))}</div></div>);
     return <>
      <Section kicker={rAge + " 岁退休那年"} title={"每" + (rentPeriod==="yr"?"年":"月") + "税后收入 " + (rentPeriod==="yr"?fxM(aftTax*12):fxM(aftTax)) + "，相当于退休前工资的 " + replRate2.toFixed(0) + "%"}
        deck={"一般认为退休收入达到退休前工资的 70–80% 才能维持原来的生活水平。" + (replRate2 >= 80 ? "你的计划达标了。" : replRate2 >= 60 ? "你的计划接近达标。" : "你的计划还有差距。")}>
       <div className="qj-two" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
        <div>
         <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>净资产构成 · 合计 {fxM(retireNW)}</div>
         {table(assetItems, assetTotal, function(v) { return fxM(v); })}</div>
        <div>
         <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{rentPeriod==="yr"?"每年":"每月"}收入来源 · 税前 {rentPeriod==="yr"?fxM(totM*12):fxM(totM)}</div>
         {table(incItems, totM, function(v) { return rentPeriod==="yr"?fxM(v*12):fxM(v); })}</div>
       </div>
       <div style={{ marginTop: 16 }}>
        <HBar label="收入替代率" note="（退休后税后收入 ÷ 退休前工资）" value={replRate2.toFixed(0) + "%"} pct={Math.min(replRate2, 100)} color={replRate2 >= 80 ? C.green : replRate2 >= 60 ? C.orange : C.red} />
       </div>
      </Section></>;
        })()}
        <div style={{ marginTop: 4 }}>
     <button onClick={() => setModal("fireReport")} style={{ width: "100%", height: 44, borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, background: "#121212", border: "none", color: "#fff" }}>FIRE 加速规划器：怎样提前退休 →</button>
        </div></div>);
  })()}
  {/* ═══ SAVE/LOAD MODAL ═══ */}
  {saveModal === "export" && (
    <div style={overlay} onClick={() => setSaveModal(null)}>
      <div style={mBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
     <span style={{ fontSize: 18, fontWeight: 700, fontFamily: C.serif, color: C.text}}>保存配置</span>
     <button onClick={() => setSaveModal(null)} style={{ background: C.inset, border: "none", borderRadius: 0, color: C.sub, fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 6 }}>点击「复制」，然后粘贴到备忘录/Notes保存。下次用「读取」恢复。</div>
        <textarea readOnly value={JSON.stringify(getStateSnapshot())} style={{ width: "100%", height: 120, fontSize: 10.5, fontFamily: "monospace", border: "1px solid " + C.border, borderRadius: 0, padding: 8, boxSizing: "border-box", background: C.inset, color: C.text, resize: "none" }} onFocus={e => e.target.select()} />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
     <button onClick={() => { handleCopyExport(); }} style={{ flex: 1, padding: "10px 0", fontSize: 14, fontWeight: 700, background: C.green, color: "#fff", border: "none", borderRadius: 0, cursor: "pointer" }}>复制到剪贴板</button>
        </div>
        {saveMsg && <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: saveMsg.startsWith("✓") ? C.green : C.orange, textAlign: "center" }}>{saveMsg}</div>}</div></div>
  )}
  {saveModal === "import" && (
    <div style={overlay} onClick={() => setSaveModal(null)}>
      <div style={mBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
     <span style={{ fontSize: 18, fontWeight: 700, fontFamily: C.serif, color: C.text}}>读取配置</span>
     <button onClick={() => setSaveModal(null)} style={{ background: C.inset, border: "none", borderRadius: 0, color: C.sub, fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 6 }}>从备忘录复制之前保存的配置，粘贴到下方，点击「应用」。</div>
        <textarea placeholder='在此粘贴配置内容...' value={importText} onChange={e => setImportText(e.target.value)} style={{ width: "100%", height: 120, fontSize: 10.5, fontFamily: "monospace", border: "1px solid " + C.border, borderRadius: 0, padding: 8, boxSizing: "border-box", background: "#fff", color: C.text, resize: "none" }} />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
     <button onClick={function() { navigator.clipboard.readText().then(function(t) { setImportText(t); }).catch(function() {}); }} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, background: C.inset, color: C.sub, border: "1px solid " + C.border, borderRadius: 0, cursor: "pointer" }}>粘贴</button>
     <button onClick={handleApplyImport} disabled={!importText.trim()} style={{ flex: 2, padding: "10px 0", fontSize: 14, fontWeight: 700, background: importText.trim() ? C.blue : C.border, color: "#fff", border: "none", borderRadius: 0, cursor: importText.trim() ? "pointer" : "default" }}>✓ 应用配置</button>
        </div>
        {saveMsg && <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: saveMsg.startsWith("✓") ? C.green : C.red, textAlign: "center" }}>{saveMsg}</div>}</div></div>
  )}
  {/* ═══ PREPAY MODAL ═══ */}
  {modal === "prepay" && (() => {
    var isHomeLoan = calcMode === "home" && homeHasLoan;
    var lAmt = isHomeLoan ? (parseFloat(homeSaleP)||0) * (1 - (parseFloat(homeDownPct)||20)/100) : calc.loanAmt;
    var aR2 = isHomeLoan ? (parseFloat(homeAnnRate)||6.75) : calc.aR, lY2 = isHomeLoan ? (parseInt(homeLoanYrs)||30) : calc.lY;
    var r = aR2 / 100 / 12, n = lY2 * 12;
    var basePmt = lAmt > 0 && r > 0 ? lAmt * r / (1 - Math.pow(1 + r, -n)) : 0;
    // Mid-month: calculate months already paid
    var py = isHomeLoan ? (alreadyBought && purchaseYear ? parseInt(purchaseYear)||0 : 0) : parseInt(purchaseYear)||0, pm = parseInt(purchaseMonth)||1, pd = parseInt(purchaseDay)||15;
    var firstPmtMo = pd >= 15 ? pm + 1 : pm;
    var firstPmtYr = py; if (firstPmtMo > 12) { firstPmtMo -= 12; firstPmtYr++; }
    var now = new Date(); var nowY = now.getFullYear(), nowM = now.getMonth() + 1;
    var monthsPaid = (alreadyBought && py > 0) ? Math.max(0, (nowY - firstPmtYr) * 12 + (nowM - firstPmtMo)) : 0;
    // Calculate equity built so far
    var paidPrin = 0, paidInt = 0, curBal = lAmt;
    for (var mp = 0; mp < monthsPaid && curBal > 0.01; mp++) {
      var ii = curBal * r;
      var pp = Math.min(Math.max(0, basePmt - ii), curBal);
      paidPrin += pp; paidInt += ii; curBal = Math.max(0, curBal - pp);}
    var equityPct = lAmt > 0 ? paidPrin / lAmt * 100 : 0;
    var doAmort = function(extra) {
      var bal = lAmt, totalInt = 0, months = 0, rows = [];
      var annPmt = 0, annPrin = 0, annInt = 0, yr = 1;
      for (var mo = 1; mo <= n && bal > 0.01; mo++) {
        var interest = bal * r;
        var prin = Math.min(Math.max(0, basePmt - interest) + (mo > monthsPaid ? extra : 0), bal);
        bal = Math.max(0, bal - prin);
        totalInt += interest; months = mo;
        annPmt += basePmt + (mo > monthsPaid ? extra : 0); annPrin += prin; annInt += interest;
        if (mo % 12 === 0 || bal <= 0.01) {
     rows.push({ yr: yr, annPmt: annPmt, annPrin: annPrin, annInt: annInt, endBal: bal, isPast: mo <= monthsPaid });
     annPmt = 0; annPrin = 0; annInt = 0; yr++;}}
return { months: months, totalInterest: totalInt, annualRows: rows };
    };
    var base = doAmort(0);
    var withX = doAmort(modalXtra);
    var moSaved = base.months - withX.months;
    var intSaved = base.totalInterest - withX.totalInterest;
    return (
    <div style={overlay} onClick={function() { setModal(null); }}>
      <div style={{ ...mBox, maxHeight: "92vh", overflowY: "auto" }} onClick={function(e) { e.stopPropagation(); }}>
        <ModalHead kicker={"延伸计算 · 摊销时间表 · " + (isHomeLoan ? "自住房" : "投资房") + "贷款"} onClose={function() { setModal(null); }}
          title={modalXtra > 0 && moSaved > 0 ? "每月多还 $" + modalXtra.toLocaleString("en-US") + "，提前 " + moToYrMo(moSaved) + " 还清" : fmtBig(lAmt) + " 贷款，" + lY2 + " 年共付利息 " + fmtBig(base.totalInterest)}
          deck={monthsPaid > 0 ? "已经还了 " + Math.floor(monthsPaid/12) + " 年 " + (monthsPaid%12) + " 个月：本金 " + fmtBig(paidPrin) + "，利息 " + fmtBig(paidInt) + "，剩余贷款 " + fmtBig(curBal) + "，还剩 " + (n - monthsPaid) + " 期。" : "按年列出每年还了多少本金和利息，以及年底剩多少贷款。"} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
     <span style={{ fontSize: 12, color: C.sub, flexShrink: 0 }}>每月多还</span>
     <input type="range" aria-label="每月提前还款" min={0} max={5000} step={50} value={modalXtra} onChange={function(e) { setModalXtra(parseInt(e.target.value)); }} style={{ flex: 1, accentColor: C.text, cursor: "pointer", margin: 0 }} />
     <span style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 700, width: 70, textAlign: "right" }}>${modalXtra.toLocaleString("en-US")}</span></div>
        <StatRow size={15} items={[
      { label: "原计划", value: moToYrMo(base.months) },
      { label: modalXtra > 0 ? "提前后" : "当前", value: moToYrMo(withX.months) },
      { label: "少还时间", value: moSaved > 0 ? moToYrMo(moSaved) : "—", color: C.green },
      { label: "少付利息", value: intSaved > 0 ? fmtBig(intSaved) : "—", color: C.green },
        ]} />
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 14 }}>
     <thead>
      <tr style={{ borderBottom: "1px solid " + C.text }}>
       {["年", "年供", "本金", "利息", "年底余额"].map(function(h, i) { return (
        <th key={i} style={{ padding: "5px 0", textAlign: i === 0 ? "left" : "right", fontWeight: 700, color: C.sub, fontSize: 11.5, position: "sticky", top: 0, background: "#fff" }}>{h}</th>); })}
      </tr>
     </thead>
     <tbody>
      {withX.annualRows.map(function(row, i) { return (
       <tr key={i} style={{ borderBottom: "1px solid #EEEEEE", color: row.isPast ? C.muted : C.text }}>
        <td style={{ padding: "5px 0" }}>{row.yr}{row.isPast ? " ✓" : ""}</td>
        <td style={{ padding: "5px 0", textAlign: "right" }}>{fmtBig(row.annPmt)}</td>
        <td style={{ padding: "5px 0", textAlign: "right", fontWeight: 600 }}>{fmtBig(row.annPrin)}</td>
        <td style={{ padding: "5px 0", textAlign: "right" }}>{fmtBig(row.annInt)}</td>
        <td style={{ padding: "5px 0", textAlign: "right", fontWeight: row.endBal < 1 ? 700 : 400, color: row.endBal < 1 ? C.green : "inherit" }}>{row.endBal < 1 ? "还清" : fmtBig(row.endBal)}</td>
       </tr>); })}
     </tbody>
        </table>
        <p style={{ fontSize: 11, color: C.muted, margin: "8px 0 0" }}>打 ✓ 的是已经还过的年份。</p></div></div>);
  })()}
  {/* ═══ DEPRECIATION TAX SHIELD ═══ */}
  {modal === "depreciation" && (() => {
    const saleVal = parseFloat(saleP) || 0;
    const land = (parseFloat(landPct) || 20) / 100;
    const buildingVal = saleVal * (1 - land);
    const annualDep = buildingVal / 27.5;
    const tRate = (parseFloat(taxRate) || 24) / 100;
    const annualSaving = annualDep * tRate;
    const annualCF = netCF;
    const taxableNoShield = annualCF;
    const taxNoShield = Math.max(0, taxableNoShield * tRate);
    const afterTaxNoShield = annualCF - taxNoShield;
    const taxableWithShield = annualCF - annualDep;
    const taxWithShield = Math.max(0, taxableWithShield * tRate);
    const afterTaxWithShield = annualCF - taxWithShield;
    const cocNoShield = tci > 0 ? afterTaxNoShield / tci : 0;
    const cocWithShield = tci > 0 ? afterTaxWithShield / tci : 0;
    const cocBoost = cocWithShield - cocNoShield;
    const saved = taxNoShield - taxWithShield;
    const shieldH = 150;
    const maxWf = Math.max(Math.abs(annualCF), annualDep, 1) * 1.15;
    const wfItems = [
      { name: "年净现金流", val: annualCF, color: C.text },
      { name: "折旧抵扣", val: -annualDep, color: "#C4C4C4" },
      { name: "应税收入", val: taxableWithShield, color: C.blue },
      { name: "缴税 " + (tRate*100).toFixed(0) + "%", val: -taxWithShield, color: "#D9A9A7" },
      { name: "税后现金流", val: afterTaxWithShield, color: C.green },
    ];
    return (
      <div style={overlay} onClick={function() { setModal(null); }}>
        <div style={mBox} onClick={function(e) { e.stopPropagation(); }}>
     <ModalHead kicker="延伸计算 · 折旧税盾" title={"折旧每年帮你少缴 " + fmtBig(saved) + " 税"} onClose={function() { setModal(null); }}
       deck="房子的建筑部分可以按 27.5 年折旧，折旧是“纸面支出”：你没真的花钱，但能从应税收入里扣掉。" />
     <div style={{ display: "grid", gap: 10, margin: "4px 0 14px" }}>
      {[["边际税率", taxRate, setTaxRate, 10, 50, 1], ["土地占比", landPct, setLandPct, 5, 50, 5]].map(function(r) { return (
       <div key={r[0]} style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: C.sub, width: 60, flexShrink: 0 }}>{r[0]}</span>
        <input type="range" aria-label={r[0]} min={r[3]} max={r[4]} step={r[5]} value={parseInt(r[1])||0} onChange={function(e) { r[2](e.target.value); }} style={{ flex: 1, accentColor: C.text, cursor: "pointer", margin: 0 }} />
        <span style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 700, width: 44, textAlign: "right" }}>{r[1]}%</span></div>); })}
     </div>
     <StackBar height={10} items={[{ l: "土地", v: land, c: "#999999" }, { l: "建筑", v: 1 - land, c: C.text }]} />
     <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.sub, marginTop: 5, marginBottom: 16 }}>
      <span>土地 {fmtBig(saleVal*land)}（不折旧）</span><span><b style={{ color: C.text }}>建筑 {fmtBig(buildingVal)}</b> ÷ 27.5 年 = {fmtBig(annualDep)}/年</span></div>
     <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>税是怎么算的</div>
     <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: shieldH, borderBottom: "1px solid " + C.text }}>
      {wfItems.map(function(item, idx) {
       var absVal = Math.abs(item.val);
       var barHeight = maxWf > 0 ? Math.max(2, (absVal / maxWf) * (shieldH - 24)) : 2;
       return (
        <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", minWidth: 0 }}>
         <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3, whiteSpace: "nowrap" }}>{item.val < 0 ? "−" : ""}{fmtBig(absVal)}</div>
         <div style={{ width: "70%", height: barHeight, background: item.color }}></div></div>);
      })}</div>
     <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
      {wfItems.map(function(item, idx) { return <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: 11, color: C.sub, marginTop: 4, lineHeight: 1.2 }}>{item.name}</div>; })}</div>
     <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 12 }}>
      <thead><tr style={{ borderBottom: "1px solid " + C.text }}>
       {["", "不算折旧", "算上折旧"].map(function(h, i) { return <th key={i} style={{ padding: "4px 0", textAlign: i ? "right" : "left", fontWeight: 700, fontSize: 11.5, color: C.sub }}>{h}</th>; })}
      </tr></thead>
      <tbody>
       {[
        ["应税收入", fmtBig(taxableNoShield), taxableWithShield <= 0 ? "亏损 " + fmtBig(Math.abs(taxableWithShield)) : fmtBig(taxableWithShield)],
        ["缴税", fmtBig(taxNoShield), fmtBig(taxWithShield)],
        ["税后现金流", fmtBig(afterTaxNoShield), fmtBig(afterTaxWithShield)],
        ["税后现金回报率", fmtPct(cocNoShield*100), fmtPct(cocWithShield*100)],
       ].map(function(row, i) { return (
        <tr key={i} style={{ borderBottom: "1px solid #EEEEEE" }}>
         <td style={{ padding: "6px 0", color: C.sub }}>{row[0]}</td>
         <td style={{ padding: "6px 0", textAlign: "right", color: C.muted }}>{row[1]}</td>
         <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 700 }}>{row[2]}</td></tr>); })}
      </tbody></table>
     <p style={{ fontFamily: C.serif, fontSize: 13, lineHeight: 1.55, color: C.sub, margin: "0 0 8px" }}>
      现金回报率因此提高 <b style={{ color: C.green }}>{fmtPct(cocBoost*100)}</b>，相当于每月多收 <b>{fmtBig(annualSaving/12)}</b>。{taxableWithShield <= 0 ? "折旧之后账面还亏 " + fmtBig(Math.abs(taxableWithShield)) + "，符合条件的话能抵其他收入。" : ""}</p>
     <p style={{ fontSize: 11, lineHeight: 1.6, color: C.muted, margin: 0 }}>
      账面亏损抵扣工资等其他收入，需要 MAGI ≤ $150K 或具备 Real Estate Professional 身份。卖房时要按 §1250 缴回折旧税，税率最高 25%。</p>
        </div>
      </div>);
  })()}
  {/* ═══ BRRRR ANALYSIS ═══ */}
  {modal === "brrrr" && (() => {
    const buyPrice = parseFloat(saleP) || 0;
    const reno = parseFloat(renoAmt) || 0;
    const arvVal = parseFloat(arv) || Math.round(buyPrice + reno * 1.5);
    const ltv = (parseFloat(refiLtv) || 75) / 100;
    const rRate = parseFloat(refiRate) || parseFloat(annRate) || 6.75;
    const refiLoan = arvVal * ltv;
    const origLoan = loanAmt;
    const cashOutRaw = refiLoan - origLoan;
    const totalCashIn = tci + reno;
    const cashRecovered = Math.max(0, Math.min(cashOutRaw, totalCashIn));
    const cashLeft = Math.max(0, totalCashIn - cashOutRaw);
    const recoveryPct = totalCashIn > 0 ? cashRecovered / totalCashIn : 0;
    const refiMonthly = refiLoan > 0 ? refiLoan * (rRate/100/12) / (1 - Math.pow(1 + rRate/100/12, -(parseFloat(loanYrs)||30)*12)) : 0;
    const refiNOI = noi;
    const refiCF = refiNOI / 12 - refiMonthly;
    const refiDSCR = refiMonthly > 0 ? (refiNOI / 12) / refiMonthly : 0;
    const infiniteCoC = cashLeft <= 0;
    const refiCoC = !infiniteCoC && cashLeft > 0 ? (refiCF * 12) / cashLeft : 0;
    return (
      <div style={overlay} onClick={function() { setModal(null); }}>
        <div style={mBox} onClick={function(e) { e.stopPropagation(); }}>
     <ModalHead kicker="延伸计算 · BRRRR" title={infiniteCoC ? "再融资后，投进去的钱全部拿回来" : "再融资后，能拿回投入的 " + (recoveryPct*100).toFixed(0) + "%"} onClose={function() { setModal(null); }}
       deck="BRRRR 就是低价买入、翻新增值、出租，再按翻新后的估值（ARV）重新贷款，把本金取出来去买下一套。" />
     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
      <NumInp label="装修预算" val={renoAmt} setVal={setRenoAmt} prefix="$" money />
      <NumInp label="翻新后估值 ARV" val={arv || String(arvVal)} setVal={setArv} prefix="$" money />
      <NumInp label="再融资成数 LTV" val={refiLtv} setVal={setRefiLtv} suffix="%" />
      <NumInp label="再融资利率" val={refiRate || String(rRate)} setVal={setRefiRate} suffix="%" /></div>
     <StatRow size={15} items={[
      { label: "买入", value: fmtAxis(buyPrice) },
      { label: "翻新", value: fmtAxis(reno) },
      { label: "月租", value: fmtAxis(computedRent) },
      { label: "再贷款", value: fmtAxis(refiLoan) },
      { label: "回报率", value: infiniteCoC ? "∞" : (refiCoC*100).toFixed(1) + "%", color: infiniteCoC ? C.green : C.text },
     ]} />
     <div style={{ marginTop: 14 }}>
      <HBar label="现金回收率" note={"投入 " + fmtBig(totalCashIn) + "，取回 " + fmtBig(cashRecovered)} value={(recoveryPct*100).toFixed(0) + "%"} pct={recoveryPct*100} color={recoveryPct >= 1 ? C.green : recoveryPct >= 0.7 ? C.orange : C.red} /></div>
     <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, margin: "8px 0 12px" }}>
      <thead><tr style={{ borderBottom: "1px solid " + C.text }}>
       {["", "原贷款", "再融资后"].map(function(h, i) { return <th key={i} style={{ padding: "4px 0", textAlign: i ? "right" : "left", fontWeight: 700, fontSize: 11.5, color: C.sub }}>{h}</th>; })}
      </tr></thead>
      <tbody>
       {[
        ["贷款额", fmtBig(origLoan), fmtBig(refiLoan)],
        ["月供", fmtBig(totalMonthly), fmtBig(refiMonthly)],
        ["月净现金流", fmtBig(netCF/12), fmtBig(refiCF)],
        ["DSCR", dscr0 > 0 ? dscr0.toFixed(2) + "x" : "—", refiDSCR > 0 ? refiDSCR.toFixed(2) + "x" : "—"],
        ["留在房里的现金", fmtBig(tci), infiniteCoC ? "$0" : fmtBig(cashLeft)],
        ["现金回报率", fmtPct(coc*100), infiniteCoC ? "无限" : fmtPct(refiCoC*100)],
       ].map(function(row, i) { return (
        <tr key={i} style={{ borderBottom: "1px solid #EEEEEE" }}>
         <td style={{ padding: "6px 0", color: C.sub }}>{row[0]}</td>
         <td style={{ padding: "6px 0", textAlign: "right", color: C.muted }}>{row[1]}</td>
         <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 700 }}>{row[2]}</td></tr>); })}
      </tbody></table>
     <p style={{ fontSize: 11, lineHeight: 1.6, color: C.muted, margin: 0 }}>回收率达到 100% 时，你留在这套房里的现金是零，之后的现金流就是“无限回报”。</p>
        </div>
      </div>);
  })()}
  {modal === "homeReport" && (() => {
    var closeModal = function() { setModal(null); setRptStep(0); };
    // Step 0: Setup
    if (rptStep === 0) {
      var buyYr0 = alreadyBought && purchaseYear ? parseInt(purchaseYear)||2026 : 2026;
      var yrOptions = []; for (var yi = 2026; yi <= buyYr0 + 50; yi++) yrOptions.push(yi);
      var chip = function(on) { return { padding: "6px 10px", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: on ? 700 : 500, border: on ? "2px solid #121212" : "1px solid #CCCCCC", background: "#fff", color: C.text }; };
      var lbl = { fontSize: 12.5, fontWeight: 700, marginBottom: 6 };
      return <div style={overlay} onClick={closeModal}>
        <div onClick={function(e){e.stopPropagation();}} style={mBox}>
         <ModalHead kicker="自住房报告" title="先定两件事：看哪一年，要不要提前还贷" onClose={closeModal} />
         <div style={{ marginBottom: 16 }}>
          <div style={lbl}>预测到哪一年</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
           {[5,10,15,20,25,30].map(function(n) { var yr = 2026 + n; return <button key={yr} onClick={function(){setRptYear(String(yr));}} style={chip(parseInt(rptYear) === yr)}>{yr}<span style={{ fontSize: 10.5, color: C.muted }}> · {n}年后</span></button>; })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12, color: C.sub }}>
           <span>或选择</span>
           <select value={rptYear} onChange={function(e){setRptYear(e.target.value);}} style={{ height: 28, borderRadius: 0, border: "1px solid #CCCCCC", fontSize: 12, fontWeight: 600, fontFamily: "inherit", color: C.text, cursor: "pointer" }}>
            {yrOptions.map(function(y){return <option key={y} value={String(y)}>{y} 年</option>;})}
           </select>
           <span style={{ color: C.muted }}>距今 {parseInt(rptYear)-2026} 年</span>
          </div>
         </div>
         {homeHasLoan && <div style={{ marginBottom: 16 }}>
          <div style={lbl}>每月提前还贷</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
           {[0,500,1000,1500,2000,3000,5000].map(function(v) { return <button key={v} onClick={function(){setRptPrepay(v);}} style={chip(rptPrepay === v)}>{v === 0 ? "不提前" : "$" + v.toLocaleString("en-US")}</button>; })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
           <input type="range" aria-label="每月提前还贷" min={0} max={5000} step={100} value={rptPrepay} onChange={function(e){setRptPrepay(parseInt(e.target.value));}} style={{ flex: 1, accentColor: C.text, cursor: "pointer", margin: 0 }} />
           <span style={{ fontFamily: C.serif, fontSize: 17, fontWeight: 700, width: 64, textAlign: "right" }}>{rptPrepay > 0 ? "$" + rptPrepay.toLocaleString("en-US") : "$0"}</span>
          </div>
         </div>}
         <div style={{ marginBottom: 18 }}>
          <div style={lbl}>版式</div>
          <Seg options={[["文章式", "list"], ["四格摘要", "grid"]]} value={rptStyle} onChange={setRptStyle} />
         </div>
         <button onClick={function(){setRptStep(1);}} style={{ width: "100%", height: 44, borderRadius: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, background: "#121212", border: "none", color: "#fff" }}>生成报告 →</button>
         <button onClick={closeModal} style={{ width: "100%", padding: "8px 0", marginTop: 4, cursor: "pointer", fontFamily: "inherit", fontSize: 12, background: "transparent", border: "none", color: C.muted }}>取消</button>
        </div></div>;
    }
    // Step 1: Report
    var hSP = parseFloat(homeSaleP)||0;
    var hDP = (parseFloat(homeDownPct)||20)/100;
    var hOwn = (parseFloat(homeOwn)||100)/100;
    var hLoan = homeHasLoan ? hSP * (1 - hDP) : 0;
    var hAR = (parseFloat(homeAnnRate)||6.75)/100/12;
    var hN = (parseInt(homeLoanYrs)||30)*12;
    var hPI = hLoan > 0 && hAR > 0 ? hLoan * hAR / (1 - Math.pow(1 + hAR, -hN)) : 0;
    var buyYr = alreadyBought && purchaseYear ? parseInt(purchaseYear)||2026 : 2026;
    var heldYrs = Math.max(0, 2026 - buyYr);
    var appR = parseFloat(appRate)||3;
    var tgtYr = parseInt(rptYear)||2036;
    var totalYrs = tgtYr - buyYr;
    var yrsFromNow = tgtYr - 2026;
    var curVal = hSP * Math.pow(1 + appR/100, heldYrs);
    var tgtVal = hSP * Math.pow(1 + appR/100, totalYrs);
    var curBal = homeHasLoan && hLoan > 0 ? loanBal(hLoan, parseFloat(homeAnnRate)||6.75, parseInt(homeLoanYrs)||30, heldYrs) : 0;
    var tgtBal = homeHasLoan && hLoan > 0 && totalYrs < (parseInt(homeLoanYrs)||30) ? loanBal(hLoan, parseFloat(homeAnnRate)||6.75, parseInt(homeLoanYrs)||30, totalYrs) : 0;
    var curEquity = curVal - curBal;
    var tgtEquity = tgtVal - tgtBal;
    var tci = (homeHasLoan ? hSP * hDP : hSP) + (parseFloat(homeClosing)||0) + (parseFloat(homeRenovation)||0);
    var costGrow = parseFloat(homeCostGrowth)||3;
    var fixedNow = homeFixed;
    var fixedTgt = Math.round(fixedNow * Math.pow(1 + costGrow/100, yrsFromNow));
    var totalAppreciation = tgtVal - hSP;
    var roi = tci > 0 ? (tgtEquity * hOwn - tci) / tci : 0;
    var annualizedRoi = totalYrs > 0 ? (Math.pow(1 + roi, 1/totalYrs) - 1) : 0;
    // Principal & interest paid from buy to target
    var totalPrinPaid = 0, totalIntPaid = 0, balTrack = hLoan;
    if (homeHasLoan && hLoan > 0) {
      for (var mp = 0; mp < Math.min(totalYrs * 12, hN) && balTrack > 0.01; mp++) { var ii = balTrack * hAR; var pp = Math.max(0, hPI - ii); totalPrinPaid += pp; totalIntPaid += ii; balTrack = Math.max(0, balTrack - pp); }
    }
    // Holding cost total
    var totalHoldingCost = 0;
    for (var yy = 0; yy < totalYrs; yy++) { totalHoldingCost += fixedNow * Math.pow(1 + costGrow/100, yy) * 12; }
    totalHoldingCost += hPI * Math.min(totalYrs, parseInt(homeLoanYrs)||30) * 12;
    // Prepay analysis
    var baseMo = 0, prepMo = 0, intBase = 0, intPrep = 0;
    if (homeHasLoan && hLoan > 0) {
      var bB = hLoan, bP = hLoan;
      for (var m = 0; m < hN && bB > 0.01; m++) { var i1 = bB * hAR; bB = Math.max(0, bB - Math.max(0, hPI - i1)); intBase += i1; baseMo = m + 1; }
      for (var m2 = 0; m2 < hN && bP > 0.01; m2++) { var i2 = bP * hAR; bP = Math.max(0, bP - Math.max(0, hPI - i2) - rptPrepay); intPrep += i2; prepMo = m2 + 1; }
    }
    var intSaved = intBase - intPrep;
    var moSaved = baseMo - prepMo;
    // Break-even year (equity > TCI)
    var breakEvenYr = null;
    for (var be = 0; be <= 50; be++) {
      var beVal = hSP * Math.pow(1 + appR/100, be);
      var beBal = homeHasLoan && be < (parseInt(homeLoanYrs)||30) ? loanBal(hLoan, parseFloat(homeAnnRate)||6.75, parseInt(homeLoanYrs)||30, be) : 0;
      if ((beVal - beBal) * hOwn >= tci) { breakEvenYr = buyYr + be; break; }
    }
    // Effective monthly cost (total cost - equity gain) / months
    var effectiveMoCost = totalYrs > 0 ? (totalHoldingCost - totalAppreciation) / (totalYrs * 12) : 0;
    var propLabel = homePropType === "sf" ? "独栋" : homePropType === "th" ? "联排" : homePropType === "condo" ? "Condo" : homePropType === "coop" ? "Co-op" : "多户";
    var tbl = function(rows) { return (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
       <tbody>{rows.filter(Boolean).map(function(r, i) { return (
        <tr key={i} style={{ borderBottom: "1px solid #EEEEEE" }}>
         <td style={{ padding: "6px 0", color: C.sub, verticalAlign: "top" }}>{r[0]}{r[3] && <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>{r[3]}</div>}</td>
         <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 700, color: r[2] || C.text, verticalAlign: "top", whiteSpace: "nowrap" }}>{r[1]}</td></tr>); })}
       </tbody></table>); };
    var sub = function(t) { return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.sub, borderTop: "1px solid #121212", paddingTop: 8, margin: "18px 0 4px" }}>{t}</div>; };
    var headline = effectiveMoCost < 0 ? "到 " + tgtYr + " 年，房价涨幅会盖过全部持有成本" : "到 " + tgtYr + " 年，扣掉增值后每月实际住房成本 " + fmtBig(effectiveMoCost);
    return <div style={overlay} onClick={closeModal}>
      <div onClick={function(e){e.stopPropagation();}} style={{ ...mBox, maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
       <ModalHead kicker={"自住房分析报告 · " + propLabel} title={headline} onClose={closeModal}
         deck={"买入价 " + fmtBig(hSP) + "，按每年升值 " + appR + "% 估算，" + tgtYr + " 年约值 " + fmtBig(tgtVal) + "，你的净资产 " + fmtBig(tgtEquity * hOwn) + "，投资回报率 " + fmtPct(roi*100) + "（年化 " + fmtPct(annualizedRoi*100) + "）。"} />
       <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 12 }}>
        <span>钱景 QianJing · {todayZh()}{rptPrepay > 0 ? " · 每月提前还 $" + rptPrepay.toLocaleString("en-US") : ""}</span>
        <LinkBtn onClick={function(){setRptStep(0);}}>← 改设置</LinkBtn></div>
       <StatRow size={17} items={[
        { label: "买入价", value: fmtBig(hSP) },
        { label: tgtYr + " 年市值", value: fmtBig(tgtVal) },
        { label: tgtYr + " 年净资产", value: fmtBig(tgtEquity * hOwn), color: C.green },
       ]} />
       {rptStyle === "grid" ? (
       <div className="qj-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
        <div>{sub("房价")}{tbl([["增值", "+" + fmtBig(totalAppreciation), C.green, "+" + fmtPct(totalAppreciation/hSP*100)], breakEvenYr && ["回本年份", breakEvenYr + " 年", null, "持有 " + (breakEvenYr-buyYr) + " 年"]])}</div>
        <div>{sub(homeHasLoan ? "贷款" : "全款持有")}{homeHasLoan ? tbl([["月供", fmtBig(hPI)], [tgtYr + " 年余额", tgtBal > 0.01 ? fmtBig(tgtBal) : "已还清", tgtBal > 0.01 ? C.red : C.green], ["累计利息", fmtBig(totalIntPaid)]]) : tbl([["负债", "$0", C.green]])}</div>
        <div>{sub("回报")}{tbl([["总投入", fmtBig(tci)], ["ROI", fmtPct(roi*100), roi >= 0 ? C.green : C.red], ["年化", fmtPct(annualizedRoi*100)]])}</div>
        <div>{rptPrepay > 0 && homeHasLoan ? <>{sub("提前还贷")}{tbl([["少还时间", moSaved > 0 ? moToYrMo(moSaved) : "—", C.green], ["少付利息", intSaved > 0 ? fmtBig(intSaved) : "—", C.green]])}</> : <>{sub("持有成本")}{tbl([["每月固定开支", fmtBig(fixedNow)], [totalYrs + " 年累计", fmtBig(totalHoldingCost)]])}</>}</div>
       </div>) : <>
       {sub("物业")}
       {tbl([
        ["买入价 → " + tgtYr + " 年", fmtBig(hSP) + " → " + fmtBig(tgtVal), C.green, "每年升值 " + appR + "%，共增值 " + fmtBig(totalAppreciation) + "（+" + fmtPct(totalAppreciation/hSP*100) + "）"],
        ["持股 " + (hOwn*100) + "% · 总投入", fmtBig(tci)],
        heldYrs > 0 && ["购入时间", buyYr + " 年 · 已持有 " + heldYrs + " 年"],
        ["今天的市值", fmtBig(curVal)],
       ])}
       {homeHasLoan ? <>{sub("贷款")}{tbl([
        ["贷款", fmtBig(hLoan) + " · " + (parseFloat(homeAnnRate)||6.75) + "% · " + (parseInt(homeLoanYrs)||30) + " 年"],
        ["月供（本金+利息）", fmtBig(hPI)],
        ["今天的余额", fmtBig(curBal)],
        [tgtYr + " 年余额", tgtBal > 0.01 ? fmtBig(tgtBal) : "已还清", tgtBal > 0.01 ? C.red : C.green],
        ["累计已还本金", fmtBig(totalPrinPaid)],
        ["累计已付利息", fmtBig(totalIntPaid), null, "利息占全部还款的 " + (totalPrinPaid + totalIntPaid > 0 ? fmtPct(totalIntPaid/(totalPrinPaid+totalIntPaid)*100) : "0%")],
       ])}</> : <>{sub("全款持有")}{tbl([["负债", "无房贷", C.green]])}</>}
       {sub("回报")}
       {tbl([
        ["总投入", fmtBig(tci)],
        [tgtYr + " 年净资产", fmtBig(tgtEquity * hOwn), C.green],
        ["投资回报率 ROI", fmtPct(roi * 100), roi >= 0 ? C.green : C.red, "（净资产 − 总投入）÷ 总投入"],
        totalYrs > 0 && ["年化回报率", fmtPct(annualizedRoi * 100)],
        breakEvenYr && ["回本年份", breakEvenYr + " 年", null, "净资产第一次超过总投入，持有 " + (breakEvenYr - buyYr) + " 年"],
       ])}
       {sub("持有成本")}
       {tbl([
        ["每月固定开支（今天）", fmtBig(fixedNow)],
        yrsFromNow > 0 && ["每月固定开支（" + tgtYr + " 年）", fmtBig(fixedTgt)],
        ["每月总支出（今天）", fmtBig(hPI + fixedNow)],
        [totalYrs + " 年累计持有成本", fmtBig(totalHoldingCost)],
        ["扣掉增值后的每月成本", effectiveMoCost < 0 ? "$0（增值更多）" : fmtBig(effectiveMoCost), effectiveMoCost < 0 ? C.green : null, "（累计持有成本 − 房价增值）÷ 总月数"],
       ])}
       {rptPrepay > 0 && homeHasLoan && <>{sub("提前还贷")}{tbl([
        ["每月多还", "$" + rptPrepay.toLocaleString("en-US")],
        ["原计划还清", moToYrMo(baseMo) + "（" + (buyYr + Math.ceil(baseMo/12)) + " 年）"],
        ["提前后还清", moToYrMo(prepMo) + "（" + (buyYr + Math.ceil(prepMo/12)) + " 年）"],
        ["少还时间", moSaved > 0 ? moToYrMo(moSaved) : "—", C.green],
        ["少付利息", intSaved > 0 ? fmtBig(intSaved) : "—", C.green, intBase > 0 ? "总利息 " + fmtBig(intBase) + " → " + fmtBig(intPrep) + "，少 " + fmtPct(intSaved/intBase*100) : null],
       ])}</>}
       </>}
       <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, margin: "16px 0 0", borderTop: "1px solid #DFDFDF", paddingTop: 8 }}>
        假设固定利率 {parseFloat(homeAnnRate)||6.75}%、房价每年升值 {appR}%、持有成本每年上涨 {costGrow}%。实际结果会受市场、利率和维修开支影响；本工具仅供参考，不构成投资建议。© JMJ Invest LLC</p>
      </div></div>;
  })()}
  {modal === "fireReport" && (() => {
    const uAge = parseInt(userAge) || 30;
    const curFireAge = freedomAge || null;
    const annInc = parseFloat(annualIncome) || 0;
    const savR = parseFloat(savingsRate) || 0;
    const tgtMo = parseFloat(ffIncomeTgt) || 10000;
    const cagr = parseFloat(stockCAGR) / 100 || 0.08;
    const pr2 = parseFloat(cdRate) / 100 || 0.04;
    const moRE2 = wantInvest ? (calc.netCF / 12) * ((parseFloat(investOwn)||100)/100) : 0;
    const totalNW2 = wealthRows.length > 0 ? wealthRows[0].netWorth || 0 : 0;
    var simFire = function(incBoost, savBoost, tgtReduce) {
      var inc = annInc * (1 + incBoost / 100);
      var sr = Math.min(savR + savBoost, 80);
      var tgt = tgtMo * (1 - tgtReduce / 100);
      var annSv = inc * sr / 100;
      var stPct = (parseInt(savStockPct)||44) / 100;
      var bkPct = (parseInt(savBankPct)||10) / 100;
      var pool = parseFloat(stockAccount) || 0;
      var bank = parseFloat(bankSavings) || 0;
      var k4 = parseFloat(k401Balance) || 0;
      var ig = parseFloat(incomeGrowth) / 100 || 0.03;
      for (var yr = 0; yr < 50; yr++) {
        var curInc = annSv * Math.pow(1+ig, yr);
        pool = pool * (1+cagr) + curInc * stPct;
        bank = bank * (1+pr2) + curInc * bkPct;
        k4 = k4 * (1+(parseFloat(k401CAGR)/100||0.08)) + curInc * ((parseInt(sav401Pct)||6)/100);
        var psv = pool * 0.04 + bank * pr2 + (moRE2 > 0 ? moRE2 * 12 : 0) + (uAge+yr >= 67 ? (ssEstimate||0)*12 : 0);
        if (psv / 12 >= tgt) return uAge + yr;}
      return null;
    };
    var baseAge = simFire(0, 0, 0);
    var adjAge = simFire(scnInc, scnSav, scnTgt);
    var adjInc = annInc * (1 + scnInc/100);
    var adjSavR = Math.min(savR + scnSav, 80);
    var adjTgt = tgtMo * (1 - scnTgt/100);
    var adjAnnSav = adjInc * adjSavR / 100;
    var saved = baseAge && adjAge ? baseAge - adjAge : 0;
    var strategies = [];
    for (var si = 10; si <= 50; si += 10) { var a = simFire(si, 0, 0); if (a && baseAge && a < baseAge) strategies.push({ l: "收入+" + si + "%", age: a, save: baseAge - a, c: "#326891" }); }
    for (var ss = 5; ss <= 25; ss += 5) { var a2 = simFire(0, ss, 0); if (a2 && baseAge && a2 < baseAge) strategies.push({ l: "储蓄率+" + ss + "%", age: a2, save: baseAge - a2, c: "#2A7A4B" }); }
    for (var st = 10; st <= 30; st += 10) { var a3 = simFire(0, 0, st); if (a3 && baseAge && a3 < baseAge) strategies.push({ l: "目标-" + st + "%", age: a3, save: baseAge - a3, c: "#B35C1E" }); }
    strategies.sort(function(a,b) { return a.age - b.age; });
    return (
      <div style={overlay} onClick={() => { setModal(null); setScnInc(0); setScnSav(0); setScnTgt(0); }}>
        <div style={{ ...mBox, maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
     <ModalHead kicker="延伸计算 · FIRE 加速规划器" onClose={() => { setModal(null); setScnInc(0); setScnSav(0); setScnTgt(0); }}
       title={!baseAge ? "按现在的节奏还达不到 FIRE" : saved > 0 ? "这样调整，可以提前 " + saved + " 年、" + adjAge + " 岁退休" : "现在的计划是 " + baseAge + " 岁达成 FIRE"}
       deck="拖动下面三根滑杆，看多赚一点、多存一点，或者把目标降低一点，各能把 FIRE 提前几年。" />
     <StatRow items={[{ label: "当前预测", value: baseAge ? baseAge + " 岁" : "—" }, (scnInc > 0 || scnSav > 0 || scnTgt > 0) && { label: "调整后", value: adjAge ? adjAge + " 岁" : "—", color: adjAge && adjAge < (baseAge||99) ? C.green : C.text, sub: saved > 0 ? "提前 " + saved + " 年" : "" }]} />
     <div style={{ display: "grid", gap: 12, margin: "14px 0 16px" }}>
      {[["收入提升", scnInc, setScnInc, 100, 5, (scnInc > 0 ? "+" + scnInc + "%" : "不变") + " → " + fmtBig(adjInc) + "/年"],
        ["储蓄率提升", scnSav, setScnSav, 40, 2, (scnSav > 0 ? "+" + scnSav + " 个百分点" : "不变") + " → " + adjSavR + "%（" + fmtBig(adjAnnSav) + "/年）"],
        ["降低月目标", scnTgt, setScnTgt, 50, 5, (scnTgt > 0 ? "−" + scnTgt + "%" : "不变") + " → " + fmtBig(adjTgt) + "/月"]].map(function(r) { return (
       <div key={r[0]}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
         <span style={{ color: C.sub }}>{r[0]}</span><span style={{ fontWeight: 700, color: r[1] > 0 ? C.text : C.muted }}>{r[5]}</span></div>
        <input type="range" aria-label={r[0]} min={0} max={r[3]} step={r[4]} value={r[1]} onChange={function(e) { r[2](parseInt(e.target.value)); }} style={{ width: "100%", accentColor: C.text, cursor: "pointer", margin: 0 }} />
       </div>); })}
     </div>
     {strategies.length > 0 && <>
     <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>单项调整，各能提前几年</div>
     <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 16 }}>
      <thead><tr style={{ borderBottom: "1px solid " + C.text }}>
       {["方案（点一下套用）", "FIRE 年龄", "提前"].map(function(h, i) { return <th key={i} style={{ padding: "4px 0", textAlign: i ? "right" : "left", fontWeight: 700, fontSize: 11.5, color: C.sub }}>{h}</th>; })}</tr></thead>
      <tbody>
      {strategies.slice(0, 8).map(function(s, i) { return (
       <tr key={i} style={{ borderBottom: "1px solid #EEEEEE", cursor: "pointer" }} onClick={function() {
        if (s.l.includes("收入")) setScnInc(parseInt(s.l.match(/\d+/)[0]));
        else if (s.l.includes("储蓄率")) setScnSav(parseInt(s.l.match(/\d+/)[0]));
        else if (s.l.includes("目标")) setScnTgt(parseInt(s.l.match(/\d+/)[0]));
       }}>
        <td style={{ padding: "6px 0", color: C.blue, fontWeight: 600 }}>{s.l}</td>
        <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 700 }}>{s.age} 岁</td>
        <td style={{ padding: "6px 0", textAlign: "right", color: C.green }}>{s.save} 年</td></tr>); })}
      </tbody></table></>}
     <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>建议</div>
     <ul style={{ margin: 0, paddingLeft: 18, fontFamily: C.serif, fontSize: 13, lineHeight: 1.65, color: C.sub }}>
      {savR < 15 && <li>储蓄率 {savR}% 偏低，每多存 5 个百分点，大约能提前 {strategies.find(function(s){return s.l==="储蓄率+5%";})?.save||2} 年退休。</li>}
      {savR >= 15 && savR < 30 && <li>储蓄率 {savR}% 属于中等，提到 25% 以上会明显加快进度。</li>}
      {savR >= 30 && <li>储蓄率 {savR}% 已经很高，关键是长期坚持。</li>}
      {annInc < 80000 && <li>提高收入是最有力的杠杆：技能、副业或换工作。</li>}
      {annInc >= 80000 && annInc < 200000 && <li>收入不错，重点放在储蓄率和投资回报上。</li>}
      {!wantInvest && <li>可以考虑加入投资房，租金现金流能加快被动收入的积累。</li>}
      {wantInvest && moRE2 < 0 && <li>投资房现金流是负的，先想办法提高租金或压低运营成本。</li>}
      <li>坚持长期投资，复利的效果越到后期越明显。</li></ul></div></div>);
  })()}</div>
);}
