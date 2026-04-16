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
function fmtPct(n) { return n.toFixed(2) + "%"; }
function moToYrMo(mo) { return Math.floor(mo / 12) + "yr " + (mo % 12) + "mo"; }
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
<rect x={x} y={y} width={Math.max(width, 1)} height={height} fill="#E07830" fillOpacity={fillOp} rx={1} />
{!inFire && <rect x={x} y={y} width={Math.max(width, 1)} height={height} fill="none" stroke="#E07830" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.35} rx={1} />}
</g>
);}

const pF = v => parseFloat(v) || 0;
const pI = v => parseInt(v) || 0;
const C = {
bg: "#FAF9F6", surface: "#FFFFFF", inset: "#F0EDE8",
border: "#D1D1D6", borderIn: "#C7C7CC", accent: "#8B6F5E",
text: "#1C1C1E", sub: "#636366", muted: "#8E8E93",
blue: "#007AFF", green: "#34C759", orange: "#FF9500", red: "#FF3B30",
cta: "#8B6F5E",
};
const FG6 = { display: "flex", gap: 6 };
const FG4 = { display: "flex", gap: 4 };
const FG8 = { display: "flex", gap: 8 };
const FAC = { display: "flex", alignItems: "center", gap: 3 };
const FACB = (mb) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: mb || 4 });
const GOLD = { display: "flex", alignItems: "center", height: 38, background: "#fff", borderRadius: 8, padding: "0 10px", border: "1px solid " + C.border, boxSizing: "border-box" };
const PILL = (bg) => ({ display: "inline-flex", alignItems: "center", gap: 3, background: bg, borderRadius: 10, padding: "2px 8px", marginBottom: 4 });
const SEC = (border) => ({ background: "#FAF9F6", borderRadius: 12, padding: "6px 10px", marginBottom: 4, overflow: "hidden", borderLeft: "3px solid " + border });
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
{label && <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 500, marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>}
<div style={{ display: "flex", alignItems: "center", height: 32, background: C.inset, borderRadius: 8, padding: "0 8px" }}>
{prefix && <span style={{ color: C.muted, fontSize: 12.5, paddingLeft: 6, flexShrink: 0 }}>{prefix}</span>}
<input type="text" value={displayVal}
onFocus={() => setEditing(true)}
onChange={e => setVal(e.target.value.replace(/,/g, ""))}
onBlur={() => { setEditing(false); const v = parseFloat((val + "").replace(/,/g, "")); if (!isNaN(v)) setVal(v.toString()); }}
style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 12.5, padding: "0 5px", width: 0, minWidth: 0 }} />
{suffix && <span style={{ color: C.muted, fontSize: 12.5, paddingRight: 6, flexShrink: 0 }}>{suffix}</span>}</div></div>
);}
function InfoCell({ label, val, color, style: st = {} }) {
return (
<div style={{ flex: 1, minWidth: 0, ...st }}>
<div style={{ fontSize: 9.5, color: C.muted, fontWeight: 500, marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden" }}>{label}</div>
<div style={{ height: 26, display: "flex", alignItems: "center", paddingLeft: 6, background: C.inset, border: "1px solid " + C.border, borderRadius: 4, overflow: "hidden" }}>
<span style={{ fontSize: 12.5, fontWeight: 600, color: color || C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{val}</span></div></div>
);}
function Card({ label, val, color, style: st = {} }) {
return (
<div style={{ padding: "3px 5px", background: C.inset, border: "1px solid " + C.border, borderRadius: 4, flex: 1, minWidth: 0, overflow: "hidden", ...st }}>
<div style={{ fontSize: 9.5, color: C.muted, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden" }}>{label}</div>
<div style={{ fontSize: 12.5, fontWeight: 600, color: color || C.text, whiteSpace: "nowrap", overflow: "hidden" }}>{val}</div></div>
);}
function FeatCard({ label, val, sub, color, style: st = {} }) {
return (
<div style={{ padding: "6px 8px", flex: 1, minWidth: 0, overflow: "hidden", background: color + "16", border: "1.5px solid " + color + "55", borderRadius: 6, ...st }}>
<div style={{ fontSize: 9.5, color: color, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap" }}>{label}</div>
<div style={{ fontSize: 18, fontWeight: 700, color: color, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{val}</div>
{sub && <div style={{ fontSize: 9.5, color: color, opacity: 0.65, marginTop: 3, whiteSpace: "nowrap" }}>{sub}</div>}</div>
);}
function SHdr({ zh, en }) {
return (
<div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 3 }}>
<span style={{ fontSize: 13, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>{zh}</span>
{en && <span style={{ fontSize: 9, fontWeight: 400, color: C.muted }}>{en}</span>}</div>
);}
function CustomTooltip({ active, payload }) {
if (!active || !payload?.length) return null;
const d = payload[0].payload;
return (
<div style={{ background: "#fffF", border: "1px solid " + C.border, padding: "4px 6px", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.10)", fontSize: 9, lineHeight: 1.5, maxWidth: 170, pointerEvents: "none" }}>
<div style={{ fontWeight: 700, color: C.accent, fontSize: 9.5 }}>{d.age}岁 · 第{d.yr}年</div>
<div>净资产 <b style={{ color: C.blue }}>{fmtMoney(d.netWorth)}</b></div>
{d.nwReal != null && d.nwReal !== d.netWorth && <div style={{ color: "#E65100", fontSize: 8 }}>↳ 按今日物价值 <b>{fmtMoney(d.nwReal)}</b></div>}
<div>被动收入 <b style={{ color: C.orange }}>{fmtMoney(d.monthlyTotalPsv)}/月</b></div>
{d.psvReal != null && d.psvReal !== d.monthlyTotalPsv && d.monthlyTotalPsv > 0 && <div style={{ color: "#E65100", fontSize: 8 }}>↳ 按今日物价值 <b>{fmtMoney(d.psvReal)}/月</b></div>}
<div style={{ color: "#78909C" }}>流动现金 <b style={{ color: C.green }}>{fmtMoney(d.cashPool)}</b></div>
{d.units > 0 && <div style={{ color: "#78909C" }}>持有 <b style={{ color: C.blue }}>{d.units}</b> 套投资房</div>}
{d.events && d.events.length > 0 && <div style={{ borderTop: "1px dashed #E0E0E0", marginTop: 2, paddingTop: 2 }}>
{d.events.map(function(e, i) { return <div key={i} style={{ fontSize: 7.5, color: "#2E7D32", fontWeight: 600 }}>{e}</div>; })}
</div>}</div>
);}
function Logo({ small }) {
  return <div style={{ display: "inline-flex", alignItems: "center", gap: small ? 3 : 4, background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 60%, #1B5E20 100%)", borderRadius: small ? 6 : 8, padding: small ? "2px 6px 2px 4px" : "3px 8px 3px 6px", boxShadow: "0 2px 6px rgba(46,125,50,0.3)" }}>
    <div style={{ width: small ? 13 : 16, height: small ? 13 : 16, borderRadius: small ? 3 : 4, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: small ? 8 : 10, fontWeight: 800, color: "#fff" }}>Q</div>
    <span style={{ fontSize: small ? 9 : 12, fontWeight: 800, color: "#fff", letterSpacing: "0.05em" }}>钱景</span></div>;}
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
      setSaveMsg("✅ 已复制！粘贴到备忘录保存");
      setTimeout(() => setSaveMsg(""), 3000);
    }).catch(() => {
      // fallback: select textarea content
      setSaveMsg("⬆️ 请长按上方文本框 → 全选 → 拷贝");});
  } catch(e) {
    setSaveMsg("⬆️ 请长按上方文本框 → 全选 → 拷贝");}
}, [listP, saleP, propType, mfUnits, unitRents, homeListP, homeSaleP, downPct, annRate, loanYrs, closing, annualIncome, savingsRate, bankSavings, stockAccount, k401Balance, currency, calcMode, compoundMode, birthYear, birthMonth, expIdx, hmAmt, hmRate, capRate, investOwn, homeOwn, hmEnabled, investOther, compoundYears, ffMode, ffIncomeTgt, ffWealthTgt, effectiveTax, inflRate, savREPct, savStockPct, savBankPct, sav401Pct, incomeGrowth, retireAge]);

const handleApplyImport = useCallback(() => {
  try {
    const saved = JSON.parse(importText.trim());
    setSaveModal(null);
    setImportText("");
    setSaveMsg("⏳ 正在恢复...");
    startTransition(() => {
      applyState(saved);
      setSaveMsg("✅ 已恢复");
      setTimeout(() => setSaveMsg(""), 2000);
    });
  } catch (err) {
    setSaveMsg("❌ 格式错误，请检查粘贴内容");
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
if (units > prevU) evts.push("🏠 购入第"+units+"套房");
if (wantInvest && yr === Math.ceil(investPayoffYrs - investHeld) && investPayoffYrs < 90) evts.push("🔓 投资房清贷·被动收入↑");
if (wantHome && homeHasLoan && yr === Math.ceil(homePayoffYrs - homeHeld) && homePayoffYrs < 90) evts.push("🏡 自住房清贷·月支出↓");
if (age === (parseInt(k401DrawAge)||60)) evts.push("💰 "+retLabel+"可提取");
if (age === (parseInt(ssClaimAge)||67)) evts.push("🏛 "+ssLabel+"开始领取");
if (freedomYear === yr) evts.push("🔥 FIRE达成");
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
const dealColor = dealAvg >= 80 ? C.green : dealAvg >= 70 ? "#43A047" : dealAvg >= 60 ? "#8B6914" : dealAvg >= 50 ? C.orange : dealAvg >= 40 ? "#E65100" : C.red;
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

const sec = () => ({ background: C.surface, borderRadius: 12, padding: "6px 10px", marginBottom: 4, overflow: "hidden" });

const overlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", zIndex: 10, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" };
const mBox = { background: C.surface, borderRadius: 14, padding: "14px 12px 10px", width: "calc(100% - 24px)", maxWidth: 400, margin: "50px 12px 20px" };
if (!showReport) {
  const fi = (label, val, setter, ph, pfx) => (
    <div style={{ marginBottom: 8, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: C.sub, marginBottom: 2, letterSpacing: "0.01em" }}>{label}</div>
      <div style={GOLD}>
        {pfx && <span style={{ color: C.muted, fontSize: 14, marginRight: 4, fontWeight: 500 }}>{pfx}</span>}
        <input type="text" value={val} onChange={e => setter(e.target.value.replace(/,/g, ""))} placeholder={ph} style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#3E2723", fontSize: 14, fontFamily: "inherit", fontWeight: 600, boxSizing: "border-box" }} />
      </div></div>);
  const fs2 = (label, val, setter, opts) => (
    <div style={{ marginBottom: 8, flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: C.sub, marginBottom: 2 }}>{label}</div>
      <select value={val} onChange={e => setter(e.target.value)} style={{ width: "100%", height: 38, fontSize: 13, fontWeight: 600, fontFamily: "inherit", border: "1px solid " + C.border, borderRadius: 8, background: "#fff", color: "#3E2723", padding: "0 8px", cursor: "pointer", boxSizing: "border-box" }}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select></div>);
  return (
    <div className="page-enter" style={{ maxWidth: 430, margin: "0 auto", background: "#F0F4F8", minHeight: "100vh", fontFamily: '"SF Pro Display","SF Pro Text",system-ui,sans-serif', color: C.text, WebkitFontSmoothing: "antialiased", padding: "0", boxSizing: "border-box" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .sec-anim { animation: fadeUp 0.5s ease-out both; }
        .page-enter { animation: slideIn 0.35s ease-out both; }
        .btn3d { transition: transform 0.15s, box-shadow 0.15s; }
        .btn3d:active { transform: translateY(1px) scale(0.98); box-shadow: 0 2px 6px rgba(0,0,0,0.12) !important; }
      `}</style>
      {/* Hero Header — minimal */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "10px 16px 8px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
     <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Logo /><span style={{ fontSize: 9, color: C.muted, opacity: 0.6 }}>by JMJ Invest LLC</span></div>
     <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
       <button onClick={() => { handleCopyExport(); setSaveMsg("✅ 已保存到剪贴板"); setTimeout(() => setSaveMsg(""), 2000); }} style={{ padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", fontSize: 8, fontWeight: 700, border: "none", borderRadius: 10, background: C.green, color: "#fff", height: 22, display: "flex", alignItems: "center", gap: 2 }}>💾 存档</button>
       <button onClick={() => setSaveModal("import")} style={{ padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", fontSize: 8, fontWeight: 700, border: "none", borderRadius: 10, background: C.blue, color: "#fff", height: 22, display: "flex", alignItems: "center", gap: 2 }}>📂 读档</button>
       {saveMsg && <span style={{ fontSize: 7, fontWeight: 700, color: C.green, position: "absolute", top: 32, right: 16, background: "#fff", padding: "2px 6px", borderRadius: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>{saveMsg}</span>}
       <select value={currency} onChange={function(e) { setCurrency(e.target.value); }} style={{ height: 22, fontSize: 9, fontWeight: 600, fontFamily: "inherit", border: "1px solid " + C.border, borderRadius: 6, background: "#fff", color: C.text, padding: "0 4px", cursor: "pointer" }}>
      {Object.keys(FX).map(function(c) { return <option key={c} value={c}>{CUR_SYM[c]} {c}</option>; })}
     </select>
       <button onClick={autoDetectCity} style={{ height: 22, padding: "0 6px", cursor: "pointer", fontFamily: "inherit", fontSize: 8, fontWeight: 700, border: "none", borderRadius: 6, background: geoStatus === "done" ? "#E8F5E9" : geoStatus === "denied" ? "#FFEBEE" : "#E3F2FD", color: geoStatus === "done" ? "#2E7D32" : geoStatus === "denied" ? "#C62828" : "#1565C0" }}>{geoStatus === "loading" ? "⏳" : geoStatus === "done" ? "📍" + city.split(" ")[0].slice(0,6) : geoStatus === "denied" ? "📍✗" : "📍定位"}</button></div></div></div>
  {/* Landing — choose mode */}
  {!introMode && <div className="sec-anim" style={{ margin: "20px 14px", animationDelay: "0.05s" }}>
    <div style={{ textAlign: "center", marginBottom: 16 }}></div>
    <div style={FG8}>
    {[
      { k: "home", icon: "🏡", l: "自住房\n分析", c: "#2F80ED", grad: "linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)" },
      { k: "invest", icon: "🏠", l: "房产\n投资分析", c: "#EE5A24", grad: "linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)" },
      { k: "fire", icon: "🔥", l: "FIRE\n财务自由", c: "#00897B", grad: "linear-gradient(135deg, #00B894 0%, #00897B 100%)" },
    ].map(function(card) { return (
      <button key={card.k} onClick={function() { setIntroMode(card.k); if (card.k === "fire") setWantFire(true); }} style={{ flex: 1, aspectRatio: "1", padding: "12px 8px", borderRadius: 16, cursor: "pointer", fontFamily: "inherit", border: "none", background: card.grad, color: "#fff", boxShadow: "0 4px 14px " + card.c + "25", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 32 }}>{card.icon}</div>
        <div style={{ fontSize: 12, fontWeight: 800, textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line" }}>{card.l}</div>
      </button>); })}
    </div></div>}
  {/* Back button when in a mode */}
  {introMode && <div style={{ margin: "0 14px 6px", display: "flex", gap: 4 }}>
    <button onClick={function() { setIntroMode(""); }} style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, border: "1px solid " + C.border, background: "#fff", color: C.sub, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>← 返回选择</button>
    <button onClick={function() { setIntroMode(""); setShowReport(false); }} style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, border: "1px solid " + C.border, background: "#fff", color: C.sub, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>🏠 主页</button>
  </div>}
  {/* FIRE Mode */}
  {introMode === "fire" && <>
      <div className="sec-anim" style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", margin: "0 14px 10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)", animationDelay: "0.1s" }}>
        {/* Investment Path Selection */}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>投资路径</div>
        <div style={FG8}>
          <div onClick={function() { setWantInvest(false); }} style={{ flex: 1, aspectRatio: "1", borderRadius: 12, cursor: "pointer", padding: "10px 8px", border: wantInvest ? "1.5px solid " + C.border : "2px solid #1565C0", background: wantInvest ? "#fff" : "#E3F2FD", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, opacity: wantInvest ? 0.6 : 1, transition: "all 0.2s" }}>
            <div style={{ fontSize: 28 }}>📈</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: wantInvest ? C.sub : "#1565C0", textAlign: "center" }}>纯股票+存款</div>
            <div style={{ fontSize: 9, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>薪资储蓄 → 股票复利<br/>+ 银行存款利息<br/>+ 401K/退休账户</div>
            {!wantInvest && <div style={{ fontSize: 8, fontWeight: 700, color: "#1565C0", background: "#1565C018", borderRadius: 4, padding: "1px 6px" }}>当前选择</div>}
          </div>
          <div onClick={function() { setWantInvest(true); }} style={{ flex: 1, aspectRatio: "1", borderRadius: 12, cursor: "pointer", padding: "10px 8px", border: !wantInvest ? "1.5px solid " + C.border : "2px solid #2E7D32", background: !wantInvest ? "#fff" : "#E8F5E9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, opacity: !wantInvest ? 0.6 : 1, transition: "all 0.2s" }}>
            <div style={{ fontSize: 28 }}>🏠📈</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: !wantInvest ? C.sub : "#2E7D32", textAlign: "center" }}>股票+房地产</div>
            <div style={{ fontSize: 9, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>股票复利 + 投资房<br/>正现金流复投买房<br/>被动收入加速FIRE</div>
            {wantInvest && <div style={{ fontSize: 8, fontWeight: 700, color: "#2E7D32", background: "#2E7D3218", borderRadius: 4, padding: "1px 6px" }}>当前选择</div>}
          </div>
        </div>
        {wantInvest ? <div style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
     <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#2E7D32", borderRadius: 10, padding: "2px 8px", marginBottom: 4 }}>
      <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>🏠 房产基本信息</span></div>
     <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 4 }}>
      <span style={{ fontSize: 8, color: C.muted }}>持股</span>
      <select value={investOwn} onChange={function(e) { setInvestOwn(e.target.value); }} style={{ height: 20, fontSize: 9, fontWeight: 700, fontFamily: "inherit", border: "1px solid " + C.border, borderRadius: 6, background: "#fff", color: "#3E2723", padding: "0 4px", cursor: "pointer" }}>
       {[25,30,40,50,60,70,80,90,100].map(function(v) { return <option key={v} value={String(v)}>{v}%</option>; })}
      </select></div></div>
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          {[["🏠","独栋","sf"],["🏘","多家庭","mf"],["📦","房产组合","portfolio"]].map(function(t) { return (
            <button key={t[2]} onClick={function() { setPropType(t[2]); if (t[2] === "portfolio") setPortfolioMode(true); else setPortfolioMode(false); }} style={{ flex: 1, padding: "4px 2px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 9, fontWeight: 600, border: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "1.5px solid #2E7D32" : "1px solid " + C.border, background: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "#E8F5E9" : "#fff", color: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "#2E7D32" : C.sub, textAlign: "center" }}>
              <div style={{ fontSize: 14 }}>{t[0]}</div>
              <div>{t[1]}</div>
            </button>
          ); })}
        </div>
        {portfolioMode && <div style={{ fontSize: 7.5, color: "#E65100", marginBottom: 6, padding: "3px 6px", background: "#FFF3E0", borderRadius: 4, lineHeight: 1.5 }}>📦 房产组合模式: 请输入所有房产的<b>总成交价</b>、<b>总月租金</b>、<b>总过户费</b>，系统将按组合整体分析回报率。单独分析请切换至独栋/多家庭模式。</div>}
        {propType === "mf" && <div style={FG6}>{fs2("单元数", mfUnits, setMfUnits, [2,3,4,5,6,8,10,12,16,20].map(v=>({v:String(v),l:v+"户"})))}</div>}
        <div style={FG8}>
     <div style={{ flex: 1, minWidth: 0 }}>{fi(portfolioMode ? "总成交价" : "成交价", saleP, setSaleP, portfolioMode ? "1500000" : "450000", "$")}</div>
     <div style={{ flex: 1, minWidth: 0 }}>{fi(portfolioMode ? "总月租金" : (propType === "mf" ? "总月租金" : "月租金"), activeUnitRents[0], function(v) { setActiveUnitRents([v]); }, propType === "mf" ? "8000" : "5000", "$")}</div></div>
        <div style={PILL("#1565C0")}>
     <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>💳 贷款与过户</span></div>
        <div style={FG6}>
     <div style={{ flex: 1, minWidth: 0, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
       <span style={{ fontSize: 10, fontWeight: 500, color: C.sub }}>首付</span>
       <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", border: "1px solid #2E7D32" }}>
        <button onClick={function() { setDownMode("pct"); }} style={{ padding: "2px 6px", fontSize: 9, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: downMode === "pct" ? "#2E7D32" : "transparent", color: downMode === "pct" ? "#fff" : "#2E7D32" }}>%</button>
        <button onClick={function() { setDownMode("amt"); }} style={{ padding: "2px 6px", fontSize: 9, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: downMode === "amt" ? "#2E7D32" : "transparent", color: downMode === "amt" ? "#fff" : "#2E7D32" }}>$</button>
       </div></div>
      <div style={GOLD}>
       {downMode === "amt" && <span style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</span>}
       <input type="text" inputMode="decimal" value={downMode === "pct" ? downPct : downAmt} onChange={function(e) { var v = e.target.value; if (downMode === "pct") { setDownPct(v); setDownAmt(""); } else { setDownAmt(v); var sp = parseFloat(saleP) || 1; setDownPct(String(Math.round((parseFloat(v) || 0) / sp * 1000) / 10)); } }} placeholder={downMode === "pct" ? "20" : "90000"} style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#3E2723", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }} />
       <span style={{ fontSize: 9, color: C.muted, flexShrink: 0 }}>{downMode === "pct" ? "=" + fmtMoney((parseFloat(saleP)||0) * (parseFloat(downPct)||0) / 100) : downPct + "%"}</span></div></div>
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
        <input type="text" value={ext.amt} onChange={function(e) { var n = investExtras.slice(); n[ei] = { name: ext.name, amt: e.target.value.replace(/,/g,"") }; setInvestExtras(n); }} placeholder="0" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#3E2723", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }} />
       </div></div>); })}
     <button onClick={function() { setInvestExtras(investExtras.concat([{ name: "", amt: "0" }])); }} style={{ width: 38, height: 38, borderRadius: 8, border: "1px dashed " + C.border, background: "#FAFAFA", color: C.muted, fontSize: 18, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={PILL("#E65100")}><span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>📊 运营费用</span></div>
          <div onClick={function() { setExpDetail(!expDetail); if (!expDetail) setExpIdx(4); else setExpIdx(5); }} style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
            <span style={{ fontSize: 7.5, fontWeight: 600, color: expDetail ? C.muted : "#E65100" }}>默认%</span>
            <div style={{ width: 28, height: 16, borderRadius: 8, background: expDetail ? "#E65100" : "#BDBDBD", padding: 2, transition: "background 0.2s" }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)", transform: expDetail ? "translateX(12px)" : "translateX(0)", transition: "transform 0.2s" }} /></div>
            <span style={{ fontSize: 7.5, fontWeight: 600, color: expDetail ? "#E65100" : C.muted }}>自定义</span></div></div>
        {!expDetail ? <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <div style={{ width: 70, flexShrink: 0 }}>{fs2("费率%", expSlider, setExpSlider, [20,25,30,35,40,45,50,55,60].map(function(v) { return {v:String(v), l:v+"%"}; }))}</div>
            <div style={{ flex: 1, marginBottom: 10, padding: "4px 6px", background: "#FFF3E0", borderRadius: 6, fontSize: 7.5, color: "#E65100", lineHeight: 1.4 }}>{parseInt(expSlider) <= 25 ? "🤝 NNN净租约 · 租客承担税险Utilities维修" : parseInt(expSlider) <= 30 ? "👤 房东自管 · 不含Utilities · 新手小型" : parseInt(expSlider) <= 35 ? "👤 房东自管 · 包Utilities · 中西部多家庭" : parseInt(expSlider) <= 40 ? "🏢 委托物管 · 不含Utilities · 管理费8-10%" : parseInt(expSlider) <= 45 ? "🏢 委托物管 · 全包Utilities · 远程投资" : parseInt(expSlider) <= 50 ? "🏙 高维护物业 · 老旧建筑 · 大城市" : "⚠ 高费率 · 大修/高空置/高管理成本"}</div></div>
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
              <span style={{ fontSize:8, color:"#E65100", fontWeight:700 }}>年运营费 {fmtMoney(total)}</span>
              <span style={{ fontSize:9, fontWeight:800, color:"#E65100" }}>{pctOfGri}%<span style={{ fontSize:7, color:"#90A4AE" }}> of GRI</span></span></div>
            {(() => {
              var expCats = [
                { k:"vac", l:"🏚 空置", v:parseFloat(vacancyPct)||0, set:setVacancyPct, c:"#9C27B0", max:20, unit:"%", mo: gri*(parseFloat(vacancyPct)||0)/100/12 },
                { k:"mgmt", l:"👔 管理", v:parseFloat(mgmtPct)||0, set:setMgmtPct, c:"#1565C0", max:20, unit:"%", mo: gri*(parseFloat(mgmtPct)||0)/100/12 },
                { k:"tax", l:"🏛 地税", v:parseFloat(taxMo)||0, set:setTaxMo, c:"#0D47A1", max:1500, unit:"$", mo: parseFloat(taxMo)||0 },
                { k:"ins", l:"🛡 保险", v:parseFloat(insuranceMo)||0, set:setInsuranceMo, c:"#00695C", max:1000, unit:"$", mo: parseFloat(insuranceMo)||0 },
                { k:"mnt", l:"🔧 维修", v:parseFloat(maintMo)||0, set:setMaintMo, c:"#E65100", max:1000, unit:"$", mo: parseFloat(maintMo)||0 },
                { k:"utl", l:"⚡ 杂费", v:parseFloat(utilitiesMo)||0, set:setUtilitiesMo, c:"#F57C00", max:500, unit:"$", mo: parseFloat(utilitiesMo)||0 },
                { k:"hoa", l:"🏢 HOA", v:parseFloat(hoaMo)||0, set:setHoaMo, c:"#4A148C", max:1000, unit:"$", mo: parseFloat(hoaMo)||0 },
                { k:"oth", l:"📋 其他", v:parseFloat(otherMo)||0, set:setOtherMo, c:"#546E7A", max:500, unit:"$", mo: parseFloat(otherMo)||0 },
              ];
              return expCats.map(function(cat) {
                var barPct = cat.max > 0 ? cat.v / cat.max * 100 : 0;
                var annV = cat.unit === "%" ? gri * cat.v / 100 : cat.v * 12;
                var griPct = gri > 0 ? (annV / gri * 100).toFixed(1) : 0;
                var step = cat.unit === "%" ? 1 : (cat.max >= 1000 ? 50 : 10);
                return <div key={cat.k} style={{ display:"flex", alignItems:"center", gap:3, marginBottom:3 }}>
                  <div style={{ width:46, fontSize:7.5, fontWeight:600, color:cat.c, flexShrink:0 }}>{cat.l}</div>
                  <div style={{ flex:1, position:"relative", height:20, background:C.inset, borderRadius:10, overflow:"hidden", cursor:"pointer", border:"1px solid "+C.border }}
                    onPointerDown={function(e) {
                      e.preventDefault();
                      var bar = e.currentTarget; var rect = bar.getBoundingClientRect();
                      var mv = function(cx) { var raw = Math.max(0, Math.min(cat.max, (cx - rect.left) / rect.width * cat.max)); cat.set(String(Math.round(raw / step) * step)); };
                      mv(e.clientX);
                      var onM = function(ev) { ev.preventDefault(); mv(ev.clientX); };
                      var onU = function() { window.removeEventListener("pointermove", onM); window.removeEventListener("pointerup", onU); };
                      window.addEventListener("pointermove", onM); window.addEventListener("pointerup", onU);
                    }}>
                    <div style={{ position:"absolute", top:0, bottom:0, left:0, width:barPct+"%", background:cat.c+"20", borderRadius:10, transition:"width 0.1s", display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight: barPct >= 25 ? 8 : 0 }}>
                      {barPct >= 25 && <span style={{ fontSize:7, fontWeight:700, color:cat.c, pointerEvents:"none" }}>{cat.unit==="$" ? "$"+cat.v+"/月" : cat.v+"%"}</span>}
                      <div style={{ position:"absolute", right:0, top:2, bottom:2, width:6, borderRadius:3, background:cat.c, boxShadow:"0 0 4px "+cat.c+"40" }} /></div></div>
                  <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", height:20, background:"#fff", borderRadius:5, border:"1px solid "+C.border, padding:"0 3px", width:46 }}>
                      {cat.unit==="$" && <span style={{ fontSize:7, color:C.muted }}>$</span>}
                      <input type="text" inputMode="decimal" value={cat.v} onChange={function(e){ cat.set(e.target.value.replace(/[^0-9.]/g,"")); }} style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:8, fontWeight:700, color:cat.c, fontFamily:"inherit", textAlign:"right", padding:0 }} />
                      {cat.unit==="%" && <span style={{ fontSize:7, color:C.muted }}>%</span>}
                    </div>
                    <span style={{ fontSize:6, color:"#90A4AE", width:22, textAlign:"right" }}>{griPct}%</span></div></div>;
              });
            })()}
          </div>;
        })()}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
     <div style={PILL("#546E7A")}>
      <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>📅 购入时间</span></div>
     <div onClick={function() { setAlreadyBought(!alreadyBought); if (alreadyBought) setPurchaseYear(""); }} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
      <span style={{ fontSize: 8, fontWeight: 600, color: alreadyBought ? "#2E7D32" : C.muted }}>{alreadyBought ? "已购入" : "尚未购入"}</span>
      <div style={{ width: 28, height: 16, borderRadius: 8, background: alreadyBought ? "#2E7D32" : "#BDBDBD", padding: 2, transition: "background 0.2s" }}>
       <div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)", transform: alreadyBought ? "translateX(12px)" : "translateX(0)", transition: "transform 0.2s" }} />
      </div></div></div>
        {alreadyBought && <div style={FG6}>
     {fs2("购入年", purchaseYear, setPurchaseYear, Array.from({length:20},(_,i)=>({v:String(2026-i),l:String(2026-i)})))}
     {fs2("月", purchaseMonth, setPurchaseMonth, Array.from({length:12},(_,i)=>({v:String(i+1),l:(i+1)+"月"})))}
     {fs2("日", purchaseDay, setPurchaseDay, Array.from({length:31},(_,i)=>({v:String(i+1),l:(i+1)+"日"})))}
        </div>}
        </div> : null}</div>
  {/* FIRE inputs - always shown in fire mode */}
      <div className="sec-anim" style={{ background: "#fff", borderRadius: 16, padding: "12px 16px", margin: "0 14px 10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)", animationDelay: "0.3s" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>🔥 FIRE 财务自由规划</div>
        <div style={{ paddingTop: 0 }}>
     <div style={PILL("#1565C0")}>
      <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>💰 收入与储蓄</span></div>
     <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
      <div style={{ flex: 1, minWidth: 0 }}>{fi("年收入 Income", annualIncome, setAnnualIncome, "120000", "$")}</div>
      <div style={{ flex: 1, minWidth: 0 }}>{fi("储蓄率 Savings %", savingsRate, setSavingsRate, "30")}</div></div>
     <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#00897B", borderRadius: 10, padding: "2px 8px", marginBottom: 4 }}>
      <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>🏦 现有资产</span></div>
     <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
      {fs2(bankLabel, bankSavings, setBankSavings, [0,10000,20000,30000,50000,80000,100000,150000,200000,500000].map(v=>({v:String(v),l:fmtMoney(v)})))}
      {fs2(stockLabel, stockAccount, setStockAccount, [0,10000,20000,30000,50000,80000,100000,200000,500000].map(v=>({v:String(v),l:fmtMoney(v)})))}
      {fs2(retLabel, k401Balance, setK401Balance, [0,10000,20000,40000,60000,80000,100000,200000,500000].map(v=>({v:String(v),l:fmtMoney(v)})))}</div>
     <div style={PILL("#E65100")}>
      <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>🎯 退休目标</span></div>
     <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
      {fs2("月收入目标", ffIncomeTgt, setFfIncomeTgt, [3000,5000,6000,7000,8000,10000,12000,15000,20000].map(v=>({v:String(v),l:fmtMoney(v)})))}
      {fs2("净值目标", ffWealthTgt, setFfWealthTgt, [1000000,2000000,3000000,5000000,8000000,10000000,15000000,20000000].map(v=>({v:String(v),l:fmtMoney(v)})))}
      {fs2("有效税率", effectiveTax, setEffectiveTax, [0,5,10,12,15,18,20,22,24,28,32,37].map(function(v){return {v:String(v),l:v+"%"};}))}</div>
     <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#546E7A", borderRadius: 10, padding: "2px 8px", marginBottom: 4 }}>
      <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>⚙️ 基本设置</span></div>
     <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
      {fs2("通胀率", inflRate, setInflRate, [0,1,1.5,2,2.5,3,3.5,4,5].map(function(v){return {v:String(v),l:v>0?v+"%":"不考虑"};}))}
      {fs2("出生年", birthYear, setBirthYear, Array.from({length:60},function(_,i){var y=2010-i; return {v:String(y),l:String(y)};}))}
      {fs2("月", birthMonth, setBirthMonth, Array.from({length:12},(_,i)=>({v:String(i+1),l:(i+1)+"月"})))}</div>
     <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-end" }}>
      {fs2("所在城市", city, setCity, cityList.map(function(c){return {v:c,l:c};}))}
      <div style={{ marginBottom: 8 }}>
        <button onClick={autoDetectCity} style={{ height: 38, padding: "0 10px", cursor: "pointer", fontFamily: "inherit", fontSize: 9, fontWeight: 700, border: "none", borderRadius: 8, background: geoStatus === "done" ? "#E8F5E9" : geoStatus === "denied" ? "#FFEBEE" : "linear-gradient(135deg, #E3F2FD, #BBDEFB)", color: geoStatus === "done" ? "#2E7D32" : geoStatus === "denied" ? "#C62828" : "#1565C0", whiteSpace: "nowrap" }}>{geoStatus === "loading" ? "⏳ 定位中..." : geoStatus === "done" ? "📍 " + city.split(" ")[0].slice(0,4) : geoStatus === "denied" ? "📍 失败" : "📍 自动定位"}</button>
      </div></div>
     {/* Savings Equalizer */}
     <div style={{ background: "#fff", borderRadius: 10, padding: "8px 10px", marginBottom: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid " + C.border }}>
      <div style={{ fontSize: 8, fontWeight: 600, color: C.sub, marginBottom: 6 }}>储蓄分配 · 总计100% <span style={{ fontWeight: 400, color: C.muted }}>· 年储蓄{fmtMoney(annSavAmt)}</span></div>
      {(() => {
       var cats = [];
       if (wantInvest) cats.push({ k: "re", l: "🏠 房产", v: parseInt(savREPct)||0, set: setSavREPct, c: "#2E7D32" });
       cats.push({ k: "st", l: "📈 股票", v: parseInt(savStockPct)||0, set: setSavStockPct, c: "#7B1FA2" });
       cats.push({ k: "bk", l: "🏦 存款", v: parseInt(savBankPct)||0, set: setSavBankPct, c: "#1565C0" });
       cats.push({ k: "rt", l: "🎯 " + retLabel, v: parseInt(sav401Pct)||0, set: setSav401Pct, c: "#C2185B" });
       if (wantInvest) cats.push({ k: "ip", l: "⚡ 投资提前还贷", v: parseInt(savInvestPrepay)||0, set: setSavInvestPrepay, c: "#E65100" });
       if (wantHome && homeHasLoan) cats.push({ k: "hp", l: "🏡 自住提前还贷", v: parseInt(savHomePrepay)||0, set: setSavHomePrepay, c: "#00897B" });
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
         <div onClick={function() { var n = {}; for (var k in eqLock) n[k]=eqLock[k]; n[cat.k] = !locked; setEqLock(n); }} style={{ width: 14, height: 14, borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, background: locked ? cat.c + "15" : "transparent", border: "1px solid " + (locked ? cat.c + "40" : C.border), color: locked ? cat.c : C.muted, flexShrink: 0 }}>{locked ? "🔒" : "·"}</div>
         <div style={{ width: 50, fontSize: 7.5, fontWeight: 600, color: cat.c, flexShrink: 0 }}>{cat.l}</div>
         <div style={{ flex: 1, position: "relative", height: 20, background: C.inset, borderRadius: 10, overflow: "hidden", cursor: locked ? "default" : "pointer", border: "1px solid " + C.border, opacity: locked ? 0.6 : 1 }}
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
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: cat.v+"%", background: cat.c + "20", borderRadius: 10, transition: "width 0.1s", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: cat.v >= 20 ? 8 : 0 }}>
           {cat.v >= 20 && <span style={{ fontSize: 7, fontWeight: 700, color: cat.c, pointerEvents: "none" }}>${moAmt}/月</span>}
           <div style={{ position: "absolute", right: 0, top: 2, bottom: 2, width: 6, borderRadius: 3, background: cat.c, boxShadow: "0 0 4px " + cat.c + "40" }} /></div></div>
         <div style={{ width: 48, textAlign: "right", fontSize: 9, fontWeight: 700, color: cat.c, flexShrink: 0 }}>{cat.v}% <span style={{ fontSize: 6, fontWeight: 500, color: cat.c + "90" }}>${moAmt}</span></div></div>;
       });
      })()}</div>
     {/* Sub-option: include primary home */}
     <div onClick={function() { setWantHome(!wantHome); }} style={{ display: "flex", alignItems: "center", padding: "6px 8px", cursor: "pointer", background: wantHome ? C.green + "08" : C.inset, borderRadius: 8, border: "1px solid " + (wantHome ? C.green + "25" : C.border) }}>
      <div style={{ flex: 1 }}>
       <div style={{ fontSize: 11, fontWeight: 600, color: wantHome ? C.text : C.muted }}>将自住房纳入净值计算</div>
       <div style={{ fontSize: 8, color: C.muted }}>房产增值计入总资产 · 持有成本纳入支出</div></div>
      <div style={{ width: 32, height: 18, borderRadius: 9, background: wantHome ? C.green : C.border, padding: 2, transition: "background 0.2s", flexShrink: 0 }}>
       <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)", transform: wantHome ? "translateX(14px)" : "translateX(0)", transition: "transform 0.2s" }}></div></div>
     </div>
     {wantHome && <div style={{ paddingTop: 6 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
       <div style={{ flex: 1, minWidth: 0 }}>{fi("买入价 Purchase", homeSaleP, setHomeSaleP, "1050000", "$")}</div>
       <div style={{ flex: 1, minWidth: 0 }}>{fi("当前市值 Value", homeListP, setHomeListP, "1200000", "$")}</div></div>
      <div onClick={function() { setHomeHasLoan(!homeHasLoan); }} style={{ display: "flex", alignItems: "center", padding: "4px 0", cursor: "pointer", marginBottom: 4 }}>
       <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: homeHasLoan ? C.text : "#2E7D32" }}>{homeHasLoan ? "有房贷 Mortgage" : "无房贷 No Mortgage"}</span>
       <div style={{ width: 32, height: 18, borderRadius: 9, background: homeHasLoan ? C.blue : C.border, padding: 2, transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)", transform: homeHasLoan ? "translateX(14px)" : "translateX(0)", transition: "transform 0.2s" }}></div></div>
      </div>
      {homeHasLoan && <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
       {fs2("首付%", homeDownPct, setHomeDownPct, [0,3,5,10,15,20,25,30,40,50].map(function(v){return {v:String(v),l:v+"%"};}))}
       {fs2("利率%", homeAnnRate, setHomeAnnRate, Array.from({length:33},function(_,i){return {v:(3+i*0.25).toFixed(2),l:(3+i*0.25).toFixed(2)+"%"};}))}
       {fs2("年限", homeLoanYrs, setHomeLoanYrs, ["10","15","20","25","30"].map(function(y){return {v:y,l:y+"yr"};}))}
       {(parseFloat(homeDownPct)||20) < 20 && fs2("PMI%", homePmiRate, setHomePmiRate, [0.3,0.4,0.5,0.6,0.7,0.8,1.0,1.2,1.5,2.0].map(function(v){return {v:String(v),l:v+"%/yr"};}))}
      </div>}
      {(parseFloat(homeDownPct)||20) < 20 && homeHasLoan && <div style={{ fontSize: 7, color: "#AD1457", marginBottom: 4, padding: "2px 6px", background: "#FCE4EC", borderRadius: 4 }}>⚠ 首付低于20%需缴PMI · 权益达20%后可申请取消 · 22%自动取消</div>}
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
        <button className="btn3d" onClick={function() { setShowReport(true); setCalcMode("overview"); setWantFire(true); trackEvent("overview"); }} style={{ flex: 2, padding: "14px 0", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #00B894, #00897B)", color: "#fff", boxSizing: "border-box", boxShadow: "0 4px 14px rgba(0,184,148,0.3), inset 0 1px 0 rgba(255,255,255,0.25)", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
     🔥 FIRE规划
        </button>
        {wantInvest && <button className="btn3d" onClick={function() { setShowReport(true); setCalcMode("invest"); setWantFire(true); trackEvent("invest"); }} style={{ flex: 1, padding: "14px 0", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #FF6B6B, #EE5A24)", color: "#fff", boxSizing: "border-box", boxShadow: "0 4px 14px rgba(238,90,36,0.25), inset 0 1px 0 rgba(255,255,255,0.25)", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
     🏠 房产投资分析
        </button>}
        {wantHome && <button className="btn3d" onClick={function() { setShowReport(true); setCalcMode("home"); setWantFire(true); trackEvent("home"); }} style={{ flex: 1, padding: "14px 0", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #56CCF2, #2F80ED)", color: "#fff", boxSizing: "border-box", boxShadow: "0 4px 14px rgba(47,128,237,0.25), inset 0 1px 0 rgba(255,255,255,0.25)", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
     🏡 自住分析
        </button>}</div>
  </>}
  {/* Standalone Invest Mode */}
  {introMode === "invest" && <>
      <div className="sec-anim" style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", margin: "0 14px 10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)", animationDelay: "0.1s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
     <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>🏠 投资房交易分析</div>
     <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 8, color: C.muted }}>持股</span>
      <select value={investOwn} onChange={function(e) { setInvestOwn(e.target.value); }} style={{ height: 20, fontSize: 9, fontWeight: 700, fontFamily: "inherit", border: "1px solid " + C.border, borderRadius: 6, background: "#fff", color: "#3E2723", padding: "0 4px", cursor: "pointer" }}>
       {[25,30,40,50,60,70,80,90,100].map(function(v) { return <option key={v} value={String(v)}>{v}%</option>; })}
      </select></div></div>
        <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#2E7D32", borderRadius: 10, padding: "2px 8px", marginBottom: 4 }}>
     <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>🏠 房产基本信息</span></div>
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          {[["🏠","独栋","sf"],["🏘","多家庭","mf"],["📦","房产组合","portfolio"]].map(function(t) { return (
            <button key={t[2]} onClick={function() { setPropType(t[2]); if (t[2] === "portfolio") setPortfolioMode(true); else setPortfolioMode(false); }} style={{ flex: 1, padding: "4px 2px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 9, fontWeight: 600, border: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "1.5px solid #2E7D32" : "1px solid " + C.border, background: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "#E8F5E9" : "#fff", color: (propType === t[2] || (t[2] === "portfolio" && portfolioMode)) ? "#2E7D32" : C.sub, textAlign: "center" }}>
              <div style={{ fontSize: 14 }}>{t[0]}</div>
              <div>{t[1]}</div>
            </button>
          ); })}
        </div>
        {portfolioMode && <div style={{ fontSize: 7.5, color: "#E65100", marginBottom: 6, padding: "3px 6px", background: "#FFF3E0", borderRadius: 4, lineHeight: 1.5 }}>📦 房产组合模式: 请输入所有房产的<b>总成交价</b>、<b>总月租金</b>、<b>总过户费</b>，系统将按组合整体分析回报率。</div>}
        {propType === "mf" && <div style={FG6}>{fs2("单元数", mfUnits, setMfUnits, [2,3,4,5,6,8,10,12,16,20].map(v=>({v:String(v),l:v+"户"})))}</div>}
        <div style={FG8}>
     <div style={{ flex: 1, minWidth: 0 }}>{fi(portfolioMode ? "总成交价" : "成交价", saleP, setSaleP, portfolioMode ? "1500000" : "450000", "$")}</div>
     <div style={{ flex: 1, minWidth: 0 }}>{fi(portfolioMode ? "总月租金" : (propType === "mf" ? "总月租金" : "月租金"), activeUnitRents[0], function(v) { setActiveUnitRents([v]); }, propType === "mf" ? "8000" : "5000", "$")}</div></div>
        <div style={PILL("#1565C0")}>
     <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>💳 贷款与过户</span></div>
        <div style={FG6}>
     <div style={{ flex: 1, minWidth: 0, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
       <span style={{ fontSize: 10, fontWeight: 500, color: C.sub }}>首付</span>
       <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", border: "1px solid #2E7D32" }}>
        <button onClick={function() { setDownMode("pct"); }} style={{ padding: "2px 6px", fontSize: 9, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: downMode === "pct" ? "#2E7D32" : "transparent", color: downMode === "pct" ? "#fff" : "#2E7D32" }}>%</button>
        <button onClick={function() { setDownMode("amt"); }} style={{ padding: "2px 6px", fontSize: 9, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: downMode === "amt" ? "#2E7D32" : "transparent", color: downMode === "amt" ? "#fff" : "#2E7D32" }}>$</button>
       </div></div>
      <div style={GOLD}>
       {downMode === "amt" && <span style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</span>}
       <input type="text" inputMode="decimal" value={downMode === "pct" ? downPct : downAmt} onChange={function(e) { var v = e.target.value; if (downMode === "pct") { setDownPct(v); setDownAmt(""); } else { setDownAmt(v); var sp = parseFloat(saleP) || 1; setDownPct(String(Math.round((parseFloat(v) || 0) / sp * 1000) / 10)); } }} placeholder={downMode === "pct" ? "20" : "90000"} style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#3E2723", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }} />
       <span style={{ fontSize: 9, color: C.muted, flexShrink: 0 }}>{downMode === "pct" ? "=" + fmtMoney((parseFloat(saleP)||0) * (parseFloat(downPct)||0) / 100) : downPct + "%"}</span></div></div>
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
        <input type="text" value={ext.amt} onChange={function(e) { var n = investExtras.slice(); n[ei] = { name: ext.name, amt: e.target.value.replace(/,/g,"") }; setInvestExtras(n); }} placeholder="0" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#3E2723", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }} />
       </div></div>); })}
     <button onClick={function() { setInvestExtras(investExtras.concat([{ name: "", amt: "0" }])); }} style={{ width: 38, height: 38, borderRadius: 8, border: "1px dashed " + C.border, background: "#FAFAFA", color: C.muted, fontSize: 18, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={PILL("#E65100")}><span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>📊 运营费用</span></div>
          <div onClick={function() { setExpDetail(!expDetail); if (!expDetail) setExpIdx(4); else setExpIdx(5); }} style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
            <span style={{ fontSize: 7.5, fontWeight: 600, color: expDetail ? C.muted : "#E65100" }}>默认%</span>
            <div style={{ width: 28, height: 16, borderRadius: 8, background: expDetail ? "#E65100" : "#BDBDBD", padding: 2, transition: "background 0.2s" }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)", transform: expDetail ? "translateX(12px)" : "translateX(0)", transition: "transform 0.2s" }} /></div>
            <span style={{ fontSize: 7.5, fontWeight: 600, color: expDetail ? "#E65100" : C.muted }}>自定义</span></div></div>
        {!expDetail ? <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <div style={{ width: 70, flexShrink: 0 }}>{fs2("费率%", expSlider, setExpSlider, [20,25,30,35,40,45,50,55,60].map(function(v) { return {v:String(v), l:v+"%"}; }))}</div>
            <div style={{ flex: 1, marginBottom: 10, padding: "4px 6px", background: "#FFF3E0", borderRadius: 6, fontSize: 7.5, color: "#E65100", lineHeight: 1.4 }}>{parseInt(expSlider) <= 25 ? "🤝 NNN净租约 · 租客承担税险Utilities维修" : parseInt(expSlider) <= 30 ? "👤 房东自管 · 不含Utilities · 新手小型" : parseInt(expSlider) <= 35 ? "👤 房东自管 · 包Utilities · 中西部多家庭" : parseInt(expSlider) <= 40 ? "🏢 委托物管 · 不含Utilities · 管理费8-10%" : parseInt(expSlider) <= 45 ? "🏢 委托物管 · 全包Utilities · 远程投资" : parseInt(expSlider) <= 50 ? "🏙 高维护物业 · 老旧建筑 · 大城市" : "⚠ 高费率 · 大修/高空置/高管理成本"}</div></div>
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
              <span style={{ fontSize:8, color:"#E65100", fontWeight:700 }}>年运营费 {fmtMoney(total)}</span>
              <span style={{ fontSize:9, fontWeight:800, color:"#E65100" }}>{pctOfGri}%<span style={{ fontSize:7, color:"#90A4AE" }}> of GRI</span></span></div>
            {(() => {
              var expCats = [
                { k:"vac", l:"🏚 空置", v:parseFloat(vacancyPct)||0, set:setVacancyPct, c:"#9C27B0", max:20, unit:"%", mo: gri*(parseFloat(vacancyPct)||0)/100/12 },
                { k:"mgmt", l:"👔 管理", v:parseFloat(mgmtPct)||0, set:setMgmtPct, c:"#1565C0", max:20, unit:"%", mo: gri*(parseFloat(mgmtPct)||0)/100/12 },
                { k:"tax", l:"🏛 地税", v:parseFloat(taxMo)||0, set:setTaxMo, c:"#0D47A1", max:1500, unit:"$", mo: parseFloat(taxMo)||0 },
                { k:"ins", l:"🛡 保险", v:parseFloat(insuranceMo)||0, set:setInsuranceMo, c:"#00695C", max:1000, unit:"$", mo: parseFloat(insuranceMo)||0 },
                { k:"mnt", l:"🔧 维修", v:parseFloat(maintMo)||0, set:setMaintMo, c:"#E65100", max:1000, unit:"$", mo: parseFloat(maintMo)||0 },
                { k:"utl", l:"⚡ 杂费", v:parseFloat(utilitiesMo)||0, set:setUtilitiesMo, c:"#F57C00", max:500, unit:"$", mo: parseFloat(utilitiesMo)||0 },
                { k:"hoa", l:"🏢 HOA", v:parseFloat(hoaMo)||0, set:setHoaMo, c:"#4A148C", max:1000, unit:"$", mo: parseFloat(hoaMo)||0 },
                { k:"oth", l:"📋 其他", v:parseFloat(otherMo)||0, set:setOtherMo, c:"#546E7A", max:500, unit:"$", mo: parseFloat(otherMo)||0 },
              ];
              return expCats.map(function(cat) {
                var barPct = cat.max > 0 ? cat.v / cat.max * 100 : 0;
                var annV = cat.unit === "%" ? gri * cat.v / 100 : cat.v * 12;
                var griPct = gri > 0 ? (annV / gri * 100).toFixed(1) : 0;
                var step = cat.unit === "%" ? 1 : (cat.max >= 1000 ? 50 : 10);
                return <div key={cat.k} style={{ display:"flex", alignItems:"center", gap:3, marginBottom:3 }}>
                  <div style={{ width:46, fontSize:7.5, fontWeight:600, color:cat.c, flexShrink:0 }}>{cat.l}</div>
                  <div style={{ flex:1, position:"relative", height:20, background:C.inset, borderRadius:10, overflow:"hidden", cursor:"pointer", border:"1px solid "+C.border }}
                    onPointerDown={function(e) {
                      e.preventDefault();
                      var bar = e.currentTarget; var rect = bar.getBoundingClientRect();
                      var mv = function(cx) { var raw = Math.max(0, Math.min(cat.max, (cx - rect.left) / rect.width * cat.max)); cat.set(String(Math.round(raw / step) * step)); };
                      mv(e.clientX);
                      var onM = function(ev) { ev.preventDefault(); mv(ev.clientX); };
                      var onU = function() { window.removeEventListener("pointermove", onM); window.removeEventListener("pointerup", onU); };
                      window.addEventListener("pointermove", onM); window.addEventListener("pointerup", onU);
                    }}>
                    <div style={{ position:"absolute", top:0, bottom:0, left:0, width:barPct+"%", background:cat.c+"20", borderRadius:10, transition:"width 0.1s", display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight: barPct >= 25 ? 8 : 0 }}>
                      {barPct >= 25 && <span style={{ fontSize:7, fontWeight:700, color:cat.c, pointerEvents:"none" }}>{cat.unit==="$" ? "$"+cat.v+"/月" : cat.v+"%"}</span>}
                      <div style={{ position:"absolute", right:0, top:2, bottom:2, width:6, borderRadius:3, background:cat.c, boxShadow:"0 0 4px "+cat.c+"40" }} /></div></div>
                  <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", height:20, background:"#fff", borderRadius:5, border:"1px solid "+C.border, padding:"0 3px", width:46 }}>
                      {cat.unit==="$" && <span style={{ fontSize:7, color:C.muted }}>$</span>}
                      <input type="text" inputMode="decimal" value={cat.v} onChange={function(e){ cat.set(e.target.value.replace(/[^0-9.]/g,"")); }} style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:8, fontWeight:700, color:cat.c, fontFamily:"inherit", textAlign:"right", padding:0 }} />
                      {cat.unit==="%" && <span style={{ fontSize:7, color:C.muted }}>%</span>}
                    </div>
                    <span style={{ fontSize:6, color:"#90A4AE", width:22, textAlign:"right" }}>{griPct}%</span></div></div>;
              });
            })()}
          </div>;
        })()}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
     <div style={PILL("#546E7A")}>
      <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>📅 购入时间</span></div>
     <div onClick={function() { setAlreadyBought(!alreadyBought); if (alreadyBought) setPurchaseYear(""); }} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
      <span style={{ fontSize: 8, fontWeight: 600, color: alreadyBought ? "#2E7D32" : C.muted }}>{alreadyBought ? "已购入" : "尚未购入"}</span>
      <div style={{ width: 28, height: 16, borderRadius: 8, background: alreadyBought ? "#2E7D32" : "#BDBDBD", padding: 2, transition: "background 0.2s" }}>
       <div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)", transform: alreadyBought ? "translateX(12px)" : "translateX(0)", transition: "transform 0.2s" }} />
      </div></div></div>
        {alreadyBought && <div style={FG6}>
     {fs2("购入年", purchaseYear, setPurchaseYear, Array.from({length:20},(_,i)=>({v:String(2026-i),l:String(2026-i)})))}
     {fs2("月", purchaseMonth, setPurchaseMonth, Array.from({length:12},(_,i)=>({v:String(i+1),l:(i+1)+"月"})))}
     {fs2("日", purchaseDay, setPurchaseDay, Array.from({length:31},(_,i)=>({v:String(i+1),l:(i+1)+"日"})))}
        </div>}</div></div>
      <div className="sec-anim" style={{ margin: "0 14px 8px", animationDelay: "0.2s" }}>
        <button className="btn3d" onClick={function() { setShowReport(true); setCalcMode("invest"); setWantInvest(true); trackEvent("invest"); }} style={{ width: "100%", padding: "14px 0", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #FF6B6B, #EE5A24)", color: "#fff", boxSizing: "border-box", boxShadow: "0 4px 14px rgba(238,90,36,0.3), inset 0 1px 0 rgba(255,255,255,0.25)", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
     🏠 房产投资分析
        </button></div>
  </>}
  {/* Standalone Home Mode */}
  {introMode === "home" && <>
      <div className="sec-anim" style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", margin: "0 14px 10px", boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)", animationDelay: "0.1s" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>🏡 自住房分析</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
     {[["🏠","独栋","sf","550000"],["🏘","联排","th","420000"],["🏢","Condo","condo","350000"],["🏛","Co-op","coop","380000"],["🏗","多户","mf","850000"]].map(function(t) { return (
      <button key={t[2]} onClick={function() { setHomePropType(t[2]); setHomeSaleP(t[3]); setHomeListP(String(Math.round(parseFloat(t[3]) * 1.1))); if (t[2] === "coop") { var p = parseInt(t[3]); var maint = Math.round((p * 0.008 / 12 + 500) / 100) * 100; setHomeCoopMaint(String(maint)); setHomeInsurance("50"); setHomeUtils("100"); } }} style={{ flex: 1, padding: "4px 2px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 9, fontWeight: 600, border: homePropType === t[2] ? "1.5px solid #1565C0" : "1px solid " + C.border, background: homePropType === t[2] ? "#E3F2FD" : "#fff", color: homePropType === t[2] ? "#1565C0" : C.sub, textAlign: "center" }}>
       <div style={{ fontSize: 14 }}>{t[0]}</div>
       <div>{t[1]}</div>
       <div style={{ fontSize: 6.5, color: C.muted }}>~{fmtMoney(parseInt(t[3]))}</div>
      </button>); })}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
     <div style={{ flex: 1, minWidth: 0 }}>{fi(homePropType === "coop" ? "股份价" : "买入价", homeSaleP, setHomeSaleP, "550000", "$")}</div>
     {fs2("持股%", homeOwn, setHomeOwn, [25,50,60,70,80,90,100].map(function(v){return {v:String(v),l:v+"%"};}))}
     {fs2("交割费", homeClosing, setHomeClosing, [0,10000,20000,30000,40000,50000,60000].map(v=>({v:String(v),l:fmtMoney(v)})))}</div>
        <div onClick={function() { setHomeHasLoan(!homeHasLoan); }} style={{ display: "flex", alignItems: "center", padding: "4px 0", cursor: "pointer", marginBottom: 4 }}>
     <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: homeHasLoan ? C.text : "#2E7D32" }}>{homeHasLoan ? "有房贷 Mortgage" : "无房贷 No Mortgage"}</span>
     <div style={{ width: 32, height: 18, borderRadius: 9, background: homeHasLoan ? C.blue : C.border, padding: 2, transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)", transform: homeHasLoan ? "translateX(14px)" : "translateX(0)", transition: "transform 0.2s" }}></div></div>
        </div>
        {homeHasLoan && <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
     {fs2("首付%", homeDownPct, setHomeDownPct, [0,3,5,10,15,20,25,30,40,50].map(function(v){return {v:String(v),l:v+"%"};}))}
     {fs2("利率%", homeAnnRate, setHomeAnnRate, Array.from({length:33},function(_,i){return {v:(3+i*0.25).toFixed(2),l:(3+i*0.25).toFixed(2)+"%"};}))}
     {fs2("年限", homeLoanYrs, setHomeLoanYrs, ["10","15","20","25","30"].map(function(y){return {v:y,l:y+"yr"};}))}
     {(parseFloat(homeDownPct)||20) < 20 && fs2("PMI%", homePmiRate, setHomePmiRate, [0.3,0.4,0.5,0.6,0.7,0.8,1.0,1.2,1.5,2.0].map(function(v){return {v:String(v),l:v+"%/yr"};}))}
        </div>}
        {(parseFloat(homeDownPct)||20) < 20 && homeHasLoan && <div style={{ fontSize: 7, color: "#AD1457", marginBottom: 4, padding: "2px 6px", background: "#FCE4EC", borderRadius: 4 }}>⚠ 首付低于20%需缴PMI · 权益达20%后可申请取消 · 22%自动取消</div>}
        {homePropType === "coop" ? <>
     <div style={{ fontSize: 7, color: C.muted, marginBottom: 3, padding: "2px 6px", background: "#E8EAF6", borderRadius: 4 }}>Co-op管理费通常包含地税+保险+部分Utilities+人员+维修基金</div>
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
        <button className="btn3d" onClick={function() { setShowReport(true); setCalcMode("home"); setWantHome(true); trackEvent("home"); }} style={{ width: "100%", padding: "14px 0", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #56CCF2, #2F80ED)", color: "#fff", boxSizing: "border-box", boxShadow: "0 4px 14px rgba(47,128,237,0.3), inset 0 1px 0 rgba(255,255,255,0.25)", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
     🏡 自住房分析
        </button></div>
  </>}
      {/* Usage Guide */}
      <div style={{ margin: "0 14px 6px" }}>
        <button onClick={() => setShowGuide(!showGuide)} style={{ width: "100%", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, border: "1px solid " + C.border, background: "#fff", color: C.sub, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
     <span>📖 使用说明 User Guide</span>
     <span style={{ fontSize: 12, transform: showGuide ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
        </button>
        {showGuide && <div style={{ background: "#fff", borderRadius: "0 0 10px 10px", padding: "10px 12px", fontSize: 8.5, color: C.sub, lineHeight: 1.9, marginTop: -1, border: "1px solid " + C.border, borderTop: "none" }}>
     <div style={{ fontWeight: 700, fontSize: 9, color: "#1565C0", marginBottom: 4 }}>三大模式</div>
     <div>🔥 <b>FIRE财务自由</b> — 综合模拟薪资储蓄+股票复利+投资房+自住房，计算何时达成财务自由</div>
     <div>📊 <b>房产投资分析</b> — 单套投资房Deal评分(A-F)，含NOI瀑布图、雷达图、估值对比、税盾BRRRR</div>
     <div>🏡 <b>自住房分析</b> — 房价预测+贷款+持有成本模拟，含提前还贷对比和PMI计算</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: "#2E7D32", marginTop: 6, marginBottom: 4 }}>自住房特色功能</div>
     <div>🏠 <b>房型选择</b> — 独栋/联排/Condo/Co-op/多户，不同房型有不同默认费用和输入项</div>
     <div>📈 <b>折线图交互</b> — 点击图表任意年份查看该年房价、净资产、贷款余额，成本明细同步更新</div>
     <div>⚡ <b>提前还贷</b> — 滑动slider实时对比加速还清vs原30年，显示节省时间和利息</div>
     <div>📊 <b>里程碑竖线</b> — 当前/本{">"+ ""}息交叉/还清时间点，自动标注在折线图上</div>
     <div>💡 <b>智能估算</b> — 地税1.1%·保险0.4%·维修1%·Utilities$150-200，未输入时自动套用市场均值</div>
     <div>📋 <b>PMI自动计算</b> — 首付{"<"}20%自动加入PMI费用，权益达20%后自动移除</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: "#E65100", marginTop: 6, marginBottom: 4 }}>投资分析特色</div>
     <div>🎯 <b>Deal评分</b> — 6项指标(CoC/DSCR/Cap/IRR/盈亏平衡/折扣率)加权评分A+→F</div>
     <div>📊 <b>NOI瀑布图</b> — 从毛租金到净现金流的逐步分解</div>
     <div>🛡 <b>税盾/BRRRR</b> — 折旧节税计算和BRRRR策略模拟</div>
     <div>➕ <b>自定义费用</b> — 装修费+律师费/验房费/评估费等可动态添加</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: "#7B1FA2", marginTop: 6, marginBottom: 4 }}>通用功能</div>
     <div>💱 <b>多币种</b> — USD/CNY/HKD/GBP/EUR/JPY/CAD/AUD/SGD实时换算</div>
     <div>💾 <b>存档/读档</b> — 导出JSON保存，随时导入恢复所有参数</div>
     <div>📊 <b>月/年切换</b> — 所有金额支持月度和年度视角切换</div>
        </div>}</div>
      {/* Formula Reference */}
      <div style={{ margin: "0 14px 10px" }}>
        <button onClick={() => setShowFormulas(!showFormulas)} style={{ width: "100%", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, border: "1px solid " + C.border, background: "#fff", color: C.sub, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
     <span>📐 计算公式 & 逻辑 Formulas</span>
     <span style={{ fontSize: 12, transform: showFormulas ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
        </button>
        {showFormulas && <div style={{ background: "#fff", borderRadius: "0 0 10px 10px", padding: "10px 12px", fontSize: 8, color: C.sub, lineHeight: 1.8, fontFamily: "monospace", marginTop: -1, border: "1px solid " + C.border, borderTop: "none" }}>
     <div style={{ fontWeight: 700, fontSize: 9, color: C.text, marginBottom: 4 }}>贷款 Mortgage</div>
     <div>月供 P&I = L × r / (1 - (1+r)^(-n))</div>
     <div>贷款余额 Bal(k) = L × ((1+r)^N - (1+r)^k) / ((1+r)^N - 1)</div>
     <div>提前还贷: 每月额外还 E → 新余额 = Bal - (P&I本金部分 + E)</div>
     <div style={{ color: C.muted }}>L=贷款额 r=月利率 n=总月数 k=已还月数 E=额外还款</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: C.text, marginTop: 6, marginBottom: 4 }}>PMI 私人抵押保险</div>
     <div>PMI/月 = 贷款额 × PMI费率% / 12</div>
     <div>触发条件: 首付 {"<"} 20%</div>
     <div>取消条件: 权益 ≥ 20%(申请) 或 ≥ 22%(自动)</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: C.text, marginTop: 6, marginBottom: 4 }}>现金流 Cash Flow</div>
     <div>毛租金 GRI = 月租 × 12</div>
     <div>运营费 OpEx = GRI × 费率%</div>
     <div>NOI = GRI - OpEx</div>
     <div>净CF = NOI - 年供DS - 硬钱贷利息</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: C.text, marginTop: 6, marginBottom: 4 }}>回报率 Returns</div>
     <div>Cap Rate = NOI / 成交价</div>
     <div>CoC = 净CF / TCI</div>
     <div>DSCR = NOI / 年供DS</div>
     <div>GRM = 成交价 / 年毛租金</div>
     <div>TCI = 首付 + 过户费 + 装修费 + 自定义费用</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: C.text, marginTop: 6, marginBottom: 4 }}>自住房预测 Home Projection</div>
     <div>未来房价 = 买入价 × (1 + 升值率)^年数</div>
     <div>未来净资产 = 房价 - 贷款余额</div>
     <div>持有成本(第N年) = 当前费用 × (1 + 成本涨幅)^N</div>
     <div>本{">"+""}息交叉: 月供中本金 {">"} 利息的时间点</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: C.text, marginTop: 6, marginBottom: 4 }}>智能默认值 Smart Defaults</div>
     <div>地税 = 房价 × 1.1% / 12</div>
     <div>保险 = 房价 × 0.4% / 12 (Co-op: $50)</div>
     <div>维修 = 房价 × 1.0% / 12 (Condo: 0.5%)</div>
     <div>Utilities = $200 (Condo: $150, Co-op: $100)</div>
     <div>Co-op管理费 = 房价 × 0.8% / 12 + $500</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: C.text, marginTop: 6, marginBottom: 4 }}>评分 Deal Score</div>
     <div>6项指标加权: CoC·DSCR·Cap·IRR·盈亏平衡·折扣率</div>
     <div>A+(≥90) A(≥80) B(≥65) C(≥45) D(≥25) F({"<"}25)</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: C.text, marginTop: 6, marginBottom: 4 }}>FIRE 财务自由</div>
     <div>被动收入 = 租金CF + 退休账户 + 社保 + 股息 + 存款利息</div>
     <div>净值 = 投资房净值 + 自住房净值 + 401K + 股票 + 存款</div>
     <div>FIRE达成: 被动收入 ≥ 月目标 或 净值 ≥ 目标</div>
     <div style={{ fontWeight: 700, fontSize: 9, color: C.text, marginTop: 6, marginBottom: 4 }}>折旧税盾 Depreciation</div>
     <div>年折旧 = (成交价 × (1-土地占比)) / 27.5</div>
     <div>税盾节税 = 年折旧 × 边际税率</div>
     <div>税后CoC = (净CF + 税盾) / TCI</div>
        </div>}</div>
      <div style={{ textAlign: "center", fontSize: 7, color: C.muted, marginBottom: 24, letterSpacing: "0.04em", lineHeight: 1.6, padding: "0 14px", opacity: 0.6 }}>
        © JMJ Invest LLC · All Rights Reserved</div>
      {saveModal === "import" && (
    <div style={overlay} onClick={() => setSaveModal(null)}>
      <div style={mBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
     <span style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>📂 读取配置</span>
     <button onClick={() => setSaveModal(null)} style={{ background: C.inset, border: "none", borderRadius: 5, color: C.sub, fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button></div>
        <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 6 }}>从备忘录复制之前保存的配置，粘贴到下方，点击「应用」。</div>
        <textarea placeholder='在此粘贴配置内容...' value={importText} onChange={e => setImportText(e.target.value)} style={{ width: "100%", height: 120, fontSize: 9.5, fontFamily: "monospace", border: "1px solid " + C.border, borderRadius: 6, padding: 8, boxSizing: "border-box", background: "#fff", color: C.text, resize: "none" }} />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
     <button onClick={function() { navigator.clipboard.readText().then(function(t) { setImportText(t); }).catch(function() {}); }} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, background: C.inset, color: C.sub, border: "1px solid " + C.border, borderRadius: 6, cursor: "pointer" }}>📋 粘贴</button>
     <button onClick={handleApplyImport} disabled={!importText.trim()} style={{ flex: 2, padding: "10px 0", fontSize: 14, fontWeight: 700, background: importText.trim() ? C.blue : C.border, color: "#fff", border: "none", borderRadius: 6, cursor: importText.trim() ? "pointer" : "default" }}>✅ 应用配置</button></div>
        {saveMsg && <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: saveMsg.startsWith("✅") ? C.green : C.red, textAlign: "center" }}>{saveMsg}</div>}</div></div>
      )}</div>
  );}
return (
<div className="page-enter" style={{ maxWidth: 430, margin: "0 auto", background: "#FAF9F6", padding: "0 10px 10px", boxSizing: "border-box", minHeight: "100vh", position: "relative", fontFamily: '-apple-system,"SF Pro Display","SF Pro Text",system-ui,sans-serif', color: C.text, overflowX: "hidden", WebkitFontSmoothing: "antialiased", width: "100%" }}>
<style>{`
  @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .page-enter { animation: slideIn 0.35s ease-out both; }
`}</style>
{/* App Header */}
<div style={{ position: "sticky", top: 0, zIndex: 5, paddingTop: 6, paddingBottom: 4, marginBottom: 4, borderBottom: "none" }}>
<div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: calcMode === "invest" ? (dealAvg >= 70 ? "linear-gradient(90deg, #00B894, #00897B)" : dealAvg >= 40 ? "linear-gradient(90deg, #F39C12, #E67E22)" : "linear-gradient(90deg, #E74C3C, #C0392B)") : calcMode === "home" ? "linear-gradient(90deg, #56CCF2, #2F80ED)" : "linear-gradient(90deg, #00B894, #2F80ED)", borderRadius: 1 }}></div>
<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
<div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 4 }}>
<Logo small />
<div style={{ fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", lineHeight: 1 }}>{calcMode === "invest" ? "房产投资分析" : calcMode === "home" ? "自住分析" : "FIRE"} <span style={{ fontSize: 8, fontWeight: 500, color: C.muted }}>{calcMode === "invest" ? "Deal" : calcMode === "home" ? "Home" : "Planning"}</span></div></div>
<div style={{ display: "flex", borderRadius: 6, overflow: "hidden", background: C.accent + "12", height: 22, border: "1px solid " + C.accent + "25" }}>
{[["月", "mo"], ["年", "yr"]].map(([lbl, p]) => (
<button key={p} onClick={() => setRentPeriod(p)} style={{ padding: "0 8px", height: "100%", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 700, border: "none", background: rentPeriod === p ? C.accent : "transparent", color: rentPeriod === p ? "#fff" : C.accent, borderRadius: rentPeriod === p ? 5 : 0 }}>{lbl}</button>
))}</div>
{(wantHome || wantFire) && <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", background: C.inset, height: 22 }}>
{[wantInvest && ["投资", "invest"], wantHome && ["自住", "home"], wantFire && ["FIRE", "overview"]].filter(Boolean).map(([lbl, mode]) => (
<button key={mode} onClick={() => setCalcMode(mode)} style={{ padding: "0 6px", height: "100%", cursor: "pointer", fontFamily: "inherit", fontSize: 9, fontWeight: 600, border: "none", background: calcMode === mode ? C.surface : "transparent", color: calcMode === mode ? C.text : C.muted, borderRadius: calcMode === mode ? 5 : 0, boxShadow: calcMode === mode ? "0 1px 2px rgba(0,0,0,0.08)" : "none" }}>{lbl}</button>
))}
</div>}
<button onClick={() => { handleCopyExport(); setSaveMsg("✅ 已保存到剪贴板"); setTimeout(() => setSaveMsg(""), 2000); }} style={{ padding: "2px 6px", cursor: "pointer", fontFamily: "inherit", fontSize: 8, fontWeight: 700, border: "none", borderRadius: 10, background: C.green, color: "#fff", height: 22, display: "flex", alignItems: "center", gap: 2 }}>💾 存档</button>
<button onClick={() => setSaveModal("import")} style={{ padding: "2px 6px", cursor: "pointer", fontFamily: "inherit", fontSize: 8, fontWeight: 700, border: "none", borderRadius: 10, background: C.blue, color: "#fff", height: 22, display: "flex", alignItems: "center", gap: 2 }}>📂 读档</button>
</div>
<div style={{ marginTop: 4 }}>
<button onClick={() => setShowReport(false)} style={{ padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, border: "1px solid " + C.border, borderRadius: 6, background: "#fff", color: C.sub, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>← 返回</button>
<button onClick={function() { setShowReport(false); setIntroMode(""); }} style={{ padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, border: "1px solid " + C.border, borderRadius: 6, background: "#fff", color: C.sub, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>🏠 主页</button>
</div>
{calcMode === "overview" && <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
<div style={{ display: "flex", alignItems: "center", gap: 4, flex: 2, height: 24, background: C.inset, borderRadius: 8, padding: "0 8px", overflow: "hidden" }}>
  <span style={{ fontSize: 8, color: C.muted, flexShrink: 0 }}>配置</span>
  <div style={{ flex: 1, display: "flex", height: 10, borderRadius: 3, overflow: "hidden" }}>
    {(parseInt(savREPct)||0) > 0 && <div style={{ width: (parseInt(savREPct)||0)+"%", background: "#2E7D32", opacity: 0.7 }}></div>}
    <div style={{ width: (parseInt(savStockPct)||0)+"%", background: "#7B1FA2", opacity: 0.6 }}></div>
    <div style={{ width: (parseInt(savBankPct)||0)+"%", background: "#1565C0", opacity: 0.5 }}></div>
    <div style={{ flex: 1, background: "#C2185B", opacity: 0.5 }}></div></div>
  <span style={{ fontSize: 7.5, fontWeight: 700, color: "#2E7D32", flexShrink: 0 }}>房{savREPct}%</span>
  <span style={{ fontSize: 7.5, fontWeight: 700, color: "#7B1FA2", flexShrink: 0 }}>股{savStockPct}%</span></div>
<select value={currency} onChange={e => setCurrency(e.target.value)} style={{ height: 24, fontSize: 9, fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: 8, background: C.inset, color: C.text, padding: "0 4px", cursor: "pointer" }}>
{Object.keys(FX).map(c => <option key={c} value={c}>{CUR_SYM[c]} {c}</option>)}
</select>
</div>}</div>
  {/* ═══ INVEST MODE ═══ */}
  {calcMode === "invest" && <>
    {/* Property (left 50%) + Donut (right 50%) */}
    <div style={{ background: "#FAF9F6", borderRadius: 12, padding: "6px 10px", marginBottom: 4, overflow: "hidden", borderLeft: "3px solid #D4A853" }}>
      {(() => {
        const ownerPct = Math.min(100, Math.max(0, parseFloat(investOwn) || 100)) / 100;
        const isPartner = ownerPct < 1;
        const total = tci + totalDebt;
        const cashPct = total > 0 ? tci / total : 0.5;
        const cashEnd = Math.max(1, Math.min(359, cashPct * 360));
        const sz = 130, cx2 = sz/2, cy2 = sz/2, r1 = 48, r2 = 36, rInner = 26;
        const arc = (acx, acy, ar, startAngle, endAngle) => {
     const s = startAngle * Math.PI / 180 - Math.PI/2;
     const e = endAngle * Math.PI / 180 - Math.PI/2;
     const x1 = acx + ar * Math.cos(s), y1 = acy + ar * Math.sin(s);
     const x2 = acx + ar * Math.cos(e), y2 = acy + ar * Math.sin(e);
     const large = endAngle - startAngle > 180 ? 1 : 0;
     return "M " + x1 + " " + y1 + " A " + ar + " " + ar + " 0 " + large + " 1 " + x2 + " " + y2;
        };
        return (
     <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
       <SHdr zh="投资概览" en="Deal Overview" />
       <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {[["📋 摊销","prepay","#1565C0"],["🛡 税盾","depreciation","#2E7D32"],["♻️ BRRRR","brrrr","#E65100"]].map(function(pair) { return (
         <button key={pair[1]} onClick={function() { setModal(pair[1]); }} style={{ padding: "2px 6px", fontSize: 7, fontWeight: 700, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", border: "none", background: pair[2], color: "#fff" }}>{pair[0]}</button>
        ); })}
        <select value={investOwn} onChange={e => setInvestOwn(e.target.value)} style={{ width: 44, height: 18, fontSize: 8, fontWeight: 700, fontFamily: "inherit", border: "1px solid " + C.border, borderRadius: 6, background: "#fff", color: "#3E2723", padding: "0 2px", cursor: "pointer" }}>
         {[5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100].map(v => <option key={v} value={String(v)}>{v}%</option>)}
        </select></div></div>
      {(userName || propAddress) && <div style={{ fontSize: 8, color: C.muted, marginBottom: 3 }}>{userName && <span style={{ fontWeight: 600 }}>{userName}</span>}{userName && propAddress && " · "}{propAddress}</div>}
      <div style={{ display: "flex", gap: 0, alignItems: "center", overflow: "hidden" }}>
       {/* LEFT: Deal summary */}
       <div style={{ flex: 1, minWidth: 0, paddingRight: 4, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
         {(() => { const isYr = rentPeriod === "yr"; const mul = isYr ? 12 : 1; const held = investHeld > 0; return [
          [held?"当前市值":"成交价", fmtMoney(held?investCurrentVal:(parseFloat(saleP)||0)), "#5D4037", "#FFF8E1"],
          [isYr?"年租金":"月租金", fmtMoney((parseFloat(activeUnitRents[0])||0)*mul), "#1B5E20", "#E8F5E9"],
          ["投入 TCI", fmtMoney(tci), "#E65100", "#FFF3E0"],
          [isYr?"年净CF":"月净CF", fmtMoney(netCF/(isYr?1:12)), netCF >= 0 ? "#1B5E20" : "#B71C1C", netCF >= 0 ? "#E8F5E9" : "#FFEBEE"],
         ]; })().map(([k, v, c, bg], i) => (
          <div key={i} style={{ background: bg, borderRadius: 5, padding: "4px 6px" }}>
           <div style={{ fontSize: 7, color: "#78909C" }}>{k}</div>
           <div style={{ fontSize: 11, fontWeight: 800, color: c }}>{v}</div></div>
         ))}</div></div>
       {/* RIGHT: Donut */}
       <div style={{ width: 80, height: 80, flexShrink: 0 }}>
        {isPartner ? (
         <svg viewBox="0 0 100 100" width={80} height={80}>
          <defs>
           <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#D4A574" /><stop offset="100%" stopColor="#C4956A" /></linearGradient>
           <linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7BA7C9" /><stop offset="100%" stopColor="#5B8DAF" /></linearGradient>
          </defs>
          <g transform="rotate(-90 50 50)">
           <path d={arc(50,50,40,0,cashEnd)} fill="none" stroke="url(#cg)" strokeWidth={10} strokeLinecap="butt" opacity={0.55} />
           {cashEnd < 359 && <path d={arc(50,50,40,cashEnd,360)} fill="none" stroke="url(#dg)" strokeWidth={10} strokeLinecap="butt" opacity={0.4} />}
          </g>
          <g transform="rotate(-90 50 50)">
           <circle cx={50} cy={50} r={28} fill="none" stroke={C.blue} strokeWidth={4} strokeDasharray="3 2" opacity={0.2} />
           <path d={arc(50,50,28,0,ownerPct*360)} fill="none" stroke={C.blue} strokeWidth={4} strokeLinecap="butt" opacity={0.5} />
          </g>
          <text x={50} y={42} textAnchor="middle" style={{ fontSize: 5, fill: C.muted, fontWeight: 600 }}>{fmtMoney(total)}</text>
          <text x={50} y={52} textAnchor="middle" style={{ fontSize: 5, fill: C.blue, fontWeight: 700 }}>你{investOwn}%</text>
          <text x={50} y={61} textAnchor="middle" style={{ fontSize: 8, fill: C.blue, fontWeight: 800 }}>{fmtMoney(total*ownerPct)}</text>
         </svg>
        ) : (
         <svg viewBox={"0 0 "+sz+" "+sz} width={80} height={80}>
          <defs>
           <linearGradient id="cashG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#D4A574" /><stop offset="100%" stopColor="#C4956A" /></linearGradient>
           <linearGradient id="debtG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7BA7C9" /><stop offset="100%" stopColor="#5B8DAF" /></linearGradient>
          </defs>
          <g transform={"rotate(-90 "+cx2+" "+cy2+")"}>
           <path d={arc(cx2,cy2,r1,0,cashEnd)} fill="none" stroke="url(#cashG)" strokeWidth={r1-r2} strokeLinecap="butt" opacity={0.55} />
           {cashEnd < 359 && <path d={arc(cx2,cy2,r1,cashEnd,360)} fill="none" stroke="url(#debtG)" strokeWidth={r1-r2} strokeLinecap="butt" opacity={0.45} />}
          </g>
          <circle cx={cx2} cy={cy2} r={r2} fill="none" stroke={C.border} strokeWidth={0.5} />
          <text x={cx2} y={cy2-10} textAnchor="middle" style={{ fontSize: 5, fill: C.muted, fontWeight: 600 }}>总价</text>
          <text x={cx2} y={cy2+2} textAnchor="middle" style={{ fontSize: 12, fill: C.text, fontWeight: 800 }}>{fmtMoney(total)}</text>
          <text x={cx2} y={cy2+13} textAnchor="middle" style={{ fontSize: 6, fill: "#C4956A", fontWeight: 700 }}>现金 {fmtMoney(tci)}</text>
          <text x={cx2} y={cy2+22} textAnchor="middle" style={{ fontSize: 6, fill: totalDebt > 0 ? "#5B8DAF" : "#2E7D32", fontWeight: 700 }}>{totalDebt > 0 ? "贷款 " + fmtMoney(totalDebt) : "全款购入 ✓"}</text>
         </svg>
        )}</div></div>
     </div>);
      })()}</div>
    {/* ═══ DEAL SCORE ═══ */}
    <div style={{ background: C.surface, borderRadius: 12, padding: "6px 10px", marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: 24, background: dealColor + "12", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
     <div style={{ fontSize: 18, fontWeight: 800, color: dealColor, lineHeight: 1 }}>{dealGrade}</div>
     <div style={{ fontSize: 7, fontWeight: 500, color: dealColor, opacity: 0.6 }}>{dealAvg}分</div></div>
        <div style={{ flex: 1, minWidth: 0 }}>
     <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{dealDesc}</div>
     <div style={FG6}>
      {[
       ["CoC", coc > 0 && coc < 10 ? (coc*100).toFixed(1)+"%" : "—", coc >= 0.08 ? C.green : coc >= 0.04 ? C.orange : C.muted],
       ["DSCR", dscr0 > 0 && dscr0 < 100 ? dscr0.toFixed(2)+"x" : "—", dscr0 >= 1.25 ? C.green : dscr0 >= 1 ? C.orange : C.muted],
       ["净CF", fmtMoney(netCF/12)+"/月", netCF >= 0 ? C.green : C.red],
       ["Cap", actualCap > 0 ? (actualCap*100).toFixed(1)+"%" : "—", actualCap >= 0.07 ? C.green : actualCap >= 0.04 ? C.orange : C.muted],
      ].map(([k, v, c], i) => (
       <div key={i} style={{ fontSize: 9, color: C.muted }}>
        {k} <span style={{ fontWeight: 600, color: c }}>{v}</span></div>
      ))}</div></div>
      </div></div>
  {/* Cash Flow Waterfall + Expense slider merged */}
    {(() => {
      const rawOwnerPct = Math.min(100, Math.max(0, parseFloat(investOwn) || 100)) / 100;
      const isPartnerWf = rawOwnerPct < 1;
      const ownerPct = (wfViewAll || !isPartnerWf) ? 1 : rawOwnerPct;
      const scale = rentPeriod === "yr" ? 12 : 1;
      const sliderVal = parseInt(expSlider) || 35;
      const gross = computedRent * ownerPct * scale;
      const effectiveExpPct = expIdx === 4 ? Math.round(customRatio * 100) : sliderVal;
      const expColor = effectiveExpPct <= 25 ? "#2E7D32" : effectiveExpPct <= 32 ? C.green : effectiveExpPct <= 38 ? "#8B6914" : effectiveExpPct <= 45 ? C.orange : effectiveExpPct <= 52 ? "#E65100" : C.red;
      const expLabel = sliderVal <= 25 ? "NNN净租约 · 租客承担税险Utilities维修"
        : sliderVal <= 30 ? "房东自管·不含Utilities · 适合新手小型物业"
        : sliderVal <= 35 ? "房东自管·包Utilities · 中西部多家庭常见"
        : sliderVal <= 40 ? "委托物管·不含Utilities · 管理费8-10%"
        : sliderVal <= 45 ? "委托物管·全包Utilities · 远程投资首选"
        : sliderVal <= 50 ? "50%法则 · BiggerPockets经验法则"
        : sliderVal <= 55 ? "高支出·保守 · 老旧物业+高空置率"
        : "最保守·含CapEx · 适合40年+老房大修预留";
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
      // Waterfall with explicit top/bottom positions — bulletproof
      var wfItems = [];
      wfItems.push({ name: "租金Rent", amt: gross, top: gross, bottom: 0, color: C.green, isTotal: true });
      var cursor = gross;
      for (var ei = 0; ei < expBreak.length; ei++) {
        var ea = expBreak[ei][1];
        if (ea <= 0) continue;
        wfItems.push({ name: expBreak[ei][0], amt: ea, top: cursor, bottom: cursor - ea, color: C.orange });
        cursor -= ea;}
      wfItems.push({ name: "NOI", amt: Math.abs(noiVal), top: Math.max(noiVal, 0), bottom: Math.min(noiVal, 0), color: C.blue, isTotal: true, isNOI: true });
      cursor = noiVal;
      if (interestAmt > 0) { wfItems.push({ name: "利息", amt: interestAmt, top: cursor, bottom: cursor - interestAmt, color: C.red }); cursor -= interestAmt; }
      if (principalAmt > 0) { wfItems.push({ name: "还本", amt: principalAmt, top: cursor, bottom: cursor - principalAmt, color: "#E65100" }); cursor -= principalAmt; }
      wfItems.push({ name: "净CF", amt: Math.abs(netCFVal), top: Math.max(netCFVal, 0), bottom: Math.min(netCFVal, 0), color: ncfColor, isTotal: true });
      // Compute pixel scale from data range
      var wfMin = 0, wfMax = gross;
      for (var wi2 = 0; wi2 < wfItems.length; wi2++) { if (wfItems[wi2].top > wfMax) wfMax = wfItems[wi2].top; if (wfItems[wi2].bottom < wfMin) wfMin = wfItems[wi2].bottom; }
      var wfRange = (wfMax - wfMin) * 1.06; if (wfRange <= 0) wfRange = 1;
      const barH = 165;
      const usableH = barH - 24;
      return (
        <div style={{ background: "#FAF9F6", borderRadius: 12, padding: "6px 10px", marginBottom: 4, overflow: "hidden", borderLeft: "3px solid #4CAF50" }}>
     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2, overflow: "hidden" }}>
      <div style={FAC}>
       <SHdr zh="租金收支分解" en="Cash Flow Breakdown" />
       {isPartnerWf && <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "none", height: 18 }}>
        <button onClick={() => setWfViewAll(true)} style={{ padding: "0 5px", height: "100%", cursor: "pointer", fontFamily: "inherit", fontSize: 7.5, fontWeight: 600, border: "none", background: wfViewAll ? C.accent : "#fff", color: wfViewAll ? "#fff" : C.muted }}>全部</button>
        <button onClick={() => setWfViewAll(false)} style={{ padding: "0 5px", height: "100%", cursor: "pointer", fontFamily: "inherit", fontSize: 7.5, fontWeight: 600, border: "none", background: !wfViewAll ? C.blue : "#fff", color: !wfViewAll ? "#fff" : C.muted }}>我的{investOwn}%</button>
       </div>}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
       <span style={{ fontSize: 9.5, color: C.muted }}>净现金流 Net CF</span>
       <span style={{ fontSize: 18, fontWeight: 800, color: ncfColor }}>{fmtMoney(netCFVal)}</span>
       <span style={{ fontSize: 9.5, color: C.muted }}>/{rentPeriod === "yr" ? "年" : "月"}</span></div></div>
     <div style={{ background: "#fff", borderRadius: 8, border: "1px solid " + C.border + "80", padding: "6px 4px 2px", position: "relative" }}>
      {/* Y-axis gridlines - smart intervals */}
      {(() => {
       var range = wfMax - wfMin;
       var step = range <= 500 ? 100 : range <= 1500 ? 250 : range <= 3000 ? 500 : range <= 8000 ? 1000 : range <= 15000 ? 2500 : 5000;
       var gridMin = Math.floor(wfMin / step) * step;
       var gridMax = Math.ceil(wfMax / step) * step;
       var lines = [];
       for (var gv = gridMin; gv <= gridMax; gv += step) {
        var yPct = ((gv - wfMin) / wfRange) * usableH;
        if (yPct >= -2 && yPct <= usableH + 2) lines.push({ val: gv, px: yPct });}
       return lines.map(function(line, li) {
        var isZero = line.val === 0;
        return <div key={li} style={{ position: "absolute", left: 30, right: 4, bottom: 18 + line.px, height: 0, borderTop: isZero ? "2px dashed #616161" : "1px dashed #E0E0E0", zIndex: isZero ? 5 : 0 }}>
         <span style={{ position: "absolute", left: -28, top: -6, fontSize: 6.5, color: isZero ? "#424242" : "#9E9E9E", fontWeight: isZero ? 700 : 500, width: 24, textAlign: "right" }}>{fmtMoney(line.val)}</span>
        </div>;});
      })()}
      <div style={{ display: "flex", gap: 0, height: barH, position: "relative", marginLeft: 28 }}>
       {wfItems.map(function(item, idx) {
        var topPx = ((item.top - wfMin) / wfRange) * usableH;
        var botPx = ((item.bottom - wfMin) / wfRange) * usableH;
        var h = Math.max(3, Math.abs(topPx - botPx));
        var bot = Math.max(0, Math.min(botPx, topPx));
        var thinBar = h < 18;
        var pct = gross > 0 ? Math.round(item.amt / gross * 100) : 0;
        var bc = item.color;
        var isT = item.isTotal;
        var isNeg = item.top <= 0 && item.bottom < 0;
        var valText = (isNeg ? "-" : "") + fmtMoney(item.amt);
        return (
         <div key={idx} style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <div style={{
           position: "absolute",
           left: isT ? 2 : 3, right: isT ? 2 : 3,
           bottom: 18 + bot, height: h,
           background: bc + (isT ? "30" : "20"),
           borderRadius: 2,
           border: "1px solid " + bc + "50",
           zIndex: 2,
           boxSizing: "border-box",
          }}>
           {h >= 18 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: h > 30 ? 9 : h > 22 ? 7.5 : 6.5, fontWeight: 700, color: bc }}>{valText}</span>
           </div>}</div>
          {thinBar && <div style={{ position: "absolute", left: 0, right: 0, bottom: 18 + bot + h + 2, textAlign: "center", fontSize: 7, fontWeight: 700, color: bc, zIndex: 3, whiteSpace: "nowrap" }}>{valText}</div>}
          {!thinBar && <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 18 + bot + h + 1, fontSize: 6, fontWeight: 600, color: "#9E9E9E", zIndex: 3, whiteSpace: "nowrap" }}>{pct}%</div>}
          <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, textAlign: "center", fontSize: 7.5, fontWeight: isT ? 700 : 500, color: isT ? bc : "#616161", lineHeight: 1 }}>{item.name}</div></div>
        );
       })}</div></div>
     {/* Expense slider below waterfall */}
     <div style={{ marginTop: 6 }}>
      {/* Toggle: 快速估算 vs 自定义 */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 2 }}>
       <span style={{ fontSize: 10, fontWeight: 700, color: C.sub, marginRight: 6 }}>物业运营费 OpEx</span>
       <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid " + C.border, height: 22 }}>
        <button onClick={function() { if (expIdx === 4) setExpIdx(3); }} style={{ padding: "0 8px", height: "100%", cursor: "pointer", fontFamily: "inherit", fontSize: 9, fontWeight: 600, border: "none", background: expIdx !== 4 ? C.accent : "transparent", color: expIdx !== 4 ? "#fff" : C.muted }}>快速估算 Quick</button>
        <button onClick={function() { setExpIdx(4); }} style={{ padding: "0 8px", height: "100%", cursor: "pointer", fontFamily: "inherit", fontSize: 9, fontWeight: 600, border: "none", background: expIdx === 4 ? C.blue : "transparent", color: expIdx === 4 ? "#fff" : C.muted }}>自定义 Custom</button>
       </div>
       <div style={{ flex: 1 }}></div>
       <span style={{ fontSize: 16, fontWeight: 800, color: expColor }}>{isCustomExp ? Math.round(customRatio*100) : sliderVal}%</span></div>
      {/* Slider mode */}
      {!isCustomExp && (
       <div>
        <input type="range" min={20} max={60} step={1} value={sliderVal} onChange={e => handleExpSlider(e.target.value)} style={{ width: "100%", accentColor: expColor, cursor: "pointer", height: 14, margin: 0 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 1 }}>
         <span style={{ fontSize: 7, color: C.muted }}>20% 租客全包(NNN)</span>
         <span style={{ fontSize: 9, fontWeight: 600, color: expColor }}>{expLabel}</span>
         <span style={{ fontSize: 7, color: C.muted }}>60% 房东全包</span></div></div>
      )}</div>
     {expIdx === 4 && (() => {
      const isYr = rentPeriod === "yr";
      const mul = isYr ? 12 : 1;
      const pSfx = isYr ? "/年" : "/月";
      const mkOpts = (max, step) => Array.from({length: Math.floor(max/step)+1}, (_, i) => i*step);
      const selStyle = { width: "100%", height: 24, fontSize: 10, fontWeight: 600, fontFamily: "inherit", border: "1px solid " + C.border, borderRadius: 6, background: "#fff", color: C.text, padding: "0 4px", cursor: "pointer", boxSizing: "border-box" };
      const items = [
       ["空置 Vacancy", vacancyPct, setVacancyPct, mkOpts(30,1).map(v=>({v:String(v),l:v+"%"}))],
       ["管理 Mgmt", mgmtPct, setMgmtPct, mkOpts(20,1).map(v=>({v:String(v),l:v+"%"}))],
       ["维修"+pSfx, maintMo, setMaintMo, mkOpts(2000,50).map(v=>({v:String(v),l:fmtMoney(v*mul)}))],
       ["地税"+pSfx, taxMo, setTaxMo, mkOpts(2000,50).map(v=>({v:String(v),l:fmtMoney(v*mul)}))],
       ["保险"+pSfx, insuranceMo, setInsuranceMo, mkOpts(1000,50).map(v=>({v:String(v),l:fmtMoney(v*mul)}))],
       ["杂费"+pSfx, utilitiesMo, setUtilitiesMo, mkOpts(2000,50).map(v=>({v:String(v),l:fmtMoney(v*mul)}))],
       ["其他"+pSfx, otherMo, setOtherMo, mkOpts(1000,50).map(v=>({v:String(v),l:fmtMoney(v*mul)}))],
      ];
      return (
       <div style={{ background: C.blue + "06", border: "1px solid " + C.blue + "15", borderRadius: 8, padding: "6px 6px 4px", marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
         <span style={{ fontSize: 8, fontWeight: 600, color: C.blue }}>逐项输入各费用</span>
         <span style={{ fontSize: 9, fontWeight: 800, color: expColor }}>合计 {Math.round(customRatio*100)}%</span></div>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
         {items.map(([label, val, setter, opts]) => (
          <div key={label} style={{ flex: 1, minWidth: 46 }}>
           <div style={{ fontSize: 7.5, color: C.sub, marginBottom: 1, fontWeight: 500 }}>{label}</div>
           <select value={val} onChange={e => setter(e.target.value)} style={selStyle}>
            {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
           </select></div>
         ))}</div></div>);
     })()}</div>);
    })()}
    {/* Valuation (left 50%) + Radar (right 50%) */}
    <div style={{ background: "#FAF9F6", borderRadius: 12, padding: "6px 10px", marginBottom: 4, overflow: "hidden", borderLeft: "3px solid #5C6BC0" }}>
      {(() => {
        const grm = grossRent > 0 ? sP / grossRent : 0;
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
        const vm = { "CoC": coc>0&&coc<10?fmtPct(coc*100):"—", "DSCR": dscr>0&&dscr<100?dscr.toFixed(2)+"x":"—", "权益Adj": eqAdj>-5&&eqAdj<5?fmtPct(eqAdj*100):"—", "IRR": irrVal!==null&&irrVal>-1&&irrVal<5?fmtPct(irrVal*100):"—", "盈亏平衡": grossRent>0&&breakevenOcc<5?fmtPct(breakevenOcc*100):"—", "Cap": capRateActual>0&&capRateActual<1?fmtPct(capRateActual*100):"—" };
        const smap = { "CoC": cocScore, "DSCR": dscrScore, "权益Adj": eqScore, "IRR": irrScore, "盈亏平衡": beScore, "Cap": capScore };
        const hmap = { "CoC": "≥8%", "DSCR": "≥1.25x", "权益Adj": "≥10%", "IRR": "≥15%", "盈亏平衡": "≤70%", "Cap": "3-8%" };
        const rd = [
     { metric: "CoC", you: Math.round(cocScore), benchmark: 60 },
     { metric: "DSCR", you: Math.round(dscrScore), benchmark: 65 },
     { metric: "权益Adj", you: Math.round(eqScore), benchmark: 55 },
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
     const ddx = x - vcx;
     const ddy = y - vcy;
     const dist = Math.sqrt(ddx*ddx + ddy*ddy);
     const push = 8;
     const fx = dist > 0 ? x + ddx/dist * push : x;
     const fy = dist > 0 ? y + ddy/dist * push : y - push;
     const anchor = fx > vcx + 5 ? "start" : fx < vcx - 5 ? "end" : "middle";
     const isTop = fy < vcy - 15;
     const isBot = fy > vcy + 15;
     const yOff = isTop ? -2 : isBot ? 2 : 0;
     return (
      <g>
       <text x={fx} y={fy+yOff} textAnchor={anchor} style={{ fontSize: 6.5, fontWeight: 700, fill: C.sub }}>{name}</text>
       <text x={fx} y={fy+yOff+8} textAnchor={anchor} style={{ fontSize: 8.5, fontWeight: 800, fill: clr }}>{val}</text>
       <text x={fx} y={fy+yOff+15} textAnchor={anchor} style={{ fontSize: 5, fill: C.muted }}>{hint}</text>
      </g>);
        };
        const avgScore = dealAvg;
        const verdict = dealGrade + " " + dealDesc;
        const verdictColor = dealColor;
        const cr = parseFloat(capRate) || 5;
        const crColor = cr <= 4 ? "#7B5EA7" : cr <= 5.5 ? C.blue : cr <= 7 ? C.green : cr <= 9 ? C.orange : C.red;
        const crLabel = cr <= 3 ? "A+ 顶级地段" : cr <= 4 ? "A 核心区" : cr <= 5 ? "A- 优质区" : cr <= 6 ? "B+ 成熟区" : cr <= 7 ? "B 热门区" : cr <= 8 ? "B- 成长区" : cr <= 9 ? "C+ 现金流型" : cr <= 10 ? "C 高收益区" : cr <= 11 ? "C- 高风险区" : "D 投机型";
        const priceDiscount = sP > 0 ? (impliedVal - sP) / sP : 0;
        const discColor = priceDiscount >= 0.10 ? C.green : priceDiscount >= 0 ? C.orange : C.red;
        const maxBar = Math.max(sP, impliedVal, grossRent * 10) * 1.05;
        const grossYield = sP > 0 ? grossRent / sP : 0;
        const gyColor = grossYield >= 0.10 ? C.green : grossYield >= 0.07 ? C.orange : C.red;
        const grmColor = "#7B5EA7";
        return (
     <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
       <div style={FAC}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.sub }}>回报 & 尽调 Returns</span></div>
       <div style={FAC}>
        <span style={{ fontSize: 8.5, color: C.muted }}>总评分</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: verdictColor }}>{avgScore}</span></div></div>
      <div style={{ display: "flex", gap: 0, alignItems: "flex-start", overflow: "hidden" }}>
       {/* LEFT: Valuation — compact */}
       <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 1, paddingRight: 4, paddingTop: 2, minWidth: 0, overflow: "hidden" }}>
        <div>
         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: C.sub }}>估值 Valuation</span>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: discColor }}>{priceDiscount >= 0 ? "估值高于成交价" + fmtPct(priceDiscount*100) + " ✓" : "成交价高于估值" + fmtPct(Math.abs(priceDiscount)*100)}</span>
         </div>
         <div style={{ marginBottom: 2 }}>
          <div style={{ fontSize: 8.5, color: C.accent, fontWeight: 600, marginBottom: 1 }}>成交价 {fmtMoney(sP)}</div>
          <div style={{ height: 14, background: C.border + "50", borderRadius: 3, overflow: "hidden" }}>
           <div style={{ height: "100%", width: (maxBar > 0 ? sP / maxBar * 100 : 50) + "%", background: C.accent + "45", borderRadius: 3 }}></div></div></div>
         <div style={{ marginBottom: 2 }}>
          <div style={{ fontSize: 8.5, color: C.blue, fontWeight: 600, marginBottom: 1 }}>现金流估价 {fmtMoney(impliedVal)}</div>
          <div style={{ height: 14, background: C.border + "50", borderRadius: 3, overflow: "hidden" }}>
           <div style={{ height: "100%", width: (maxBar > 0 ? impliedVal / maxBar * 100 : 50) + "%", background: C.blue + "45", borderRadius: 3 }}></div></div></div>
         <div style={{ marginBottom: 2 }}>
          <div style={{ fontSize: 8.5, color: grmColor, fontWeight: 600, marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>租金估价 {fmtMoney(grossRent * 10)} <span style={{ fontSize: 7, color: C.muted }}>GRM {grossRent > 0 && sP/grossRent < 100 ? (sP/grossRent).toFixed(1) : "—"}x</span></div>
          <div style={{ height: 14, background: C.border + "50", borderRadius: 3, overflow: "hidden" }}>
           <div style={{ height: "100%", width: (maxBar > 0 ? grossRent * 10 / maxBar * 100 : 50) + "%", background: grmColor + "40", borderRadius: 3 }}></div></div></div></div>
        <div style={{ fontSize: 6.5, color: C.muted, marginTop: 1 }}>6项均分 · 灰虚线=基准</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
         <span style={{ fontSize: 7, color: C.muted, flexShrink: 0 }}>Cap</span>
         <input type="range" min={2} max={12} step={0.5} value={capRate} onChange={e => setCapRate(e.target.value)} style={{ flex: 1, accentColor: crColor, cursor: "pointer", height: 8, margin: 0 }} />
         <span style={{ fontSize: 9, fontWeight: 800, color: crColor, flexShrink: 0 }}>{cr}%</span>
         <span style={{ fontSize: 7, fontWeight: 600, color: crColor, flexShrink: 0 }}>{crLabel}</span></div>
        {/* Cap scale visual */}
        <div style={{ marginTop: 3 }}>
         <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 2 }}>
          <div style={{ flex: 3, background: "linear-gradient(90deg, #7B5EA7, #4A7FA5)" }}></div>
          <div style={{ flex: 2, background: "linear-gradient(90deg, #4A7FA5, #4A7C59)" }}></div>
          <div style={{ flex: 2, background: "linear-gradient(90deg, #4A7C59, #C4956A)" }}></div>
          <div style={{ flex: 3, background: "linear-gradient(90deg, #C4956A, #C62828)" }}></div></div>
         <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: C.muted }}>
          <span>2% 核心</span>
          <span>5% 优质</span>
          <span>8% 现金流</span>
          <span>12% 高风险</span></div>
         {(() => {
          var actualCR = sP > 0 ? noi / sP : 0;
          var diff = actualCR - cr / 100;
          return actualCR > 0 ? (
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2, fontSize: 7 }}>
            <span style={{ color: C.muted }}>实际Cap <b style={{ color: crColor }}>{(actualCR*100).toFixed(1)}%</b></span>
            <span style={{ color: diff >= 0 ? C.green : C.red, fontWeight: 700 }}>{diff >= 0 ? "高于" : "低于"}设定 {Math.abs(diff*100).toFixed(1)}%</span></div>
          ) : null;
         })()}</div></div>
       {/* RIGHT: Radar — fill space */}
       <div style={{ flex: 1, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={175}>
         <RadarChart data={rd} cx="50%" cy="48%" outerRadius="62%" margin={{ top: 16, right: 4, bottom: 20, left: 4 }}>
          <PolarGrid stroke={C.border} />
          <PolarAngleAxis dataKey="metric" tick={renderTick} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="benchmark" stroke="#B0BEC5" fill="#B0BEC5" fillOpacity={0.10} strokeWidth={1} strokeDasharray="4 3" />
          <Radar dataKey="you" stroke={verdictColor} fill={verdictColor} fillOpacity={0.20} strokeWidth={2.5} />
         </RadarChart>
        </ResponsiveContainer></div></div>
     </div>);
      })()}</div>
  </>}
  {/* ═══ HOME MODE ═══ */}
  {calcMode === "home" && <>
    {/* Home Overview Cards */}
    <div style={{ background: "#FAF9F6", borderRadius: 12, padding: "6px 10px", marginBottom: 4, overflow: "hidden", borderLeft: "3px solid #D4A853" }}>
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
        const costItems = [
     hPI > 0 && { l: "月供", v: hPI, c: "#1565C0", xtra: modalXtra > 0 ? modalXtra : 0 },
     hPmiMo > 0 && { l: "PMI", v: hPmiMo, c: "#AD1457" },
     homePropType === "coop" && useCoopM > 0 && { l: "管理", v: useCoopM, c: "#4A148C", est: !pF(homeCoopMaint) },
     homePropType !== "coop" && useTax > 0 && { l: "地税", v: useTax, c: "#0D47A1", est: !pF(homeTax) },
     useIns > 0 && { l: "保险", v: useIns, c: "#00695C", est: !pF(homeInsurance) },
     hHoa > 0 && { l: "HOA", v: hHoa, c: "#4A148C" },
     useUtil > 0 && { l: "杂费", v: useUtil, c: "#E65100", est: !pF(homeUtils) },
     homePropType !== "coop" && useMaint > 0 && { l: "维修", v: useMaint, c: "#546E7A", est: !pF(homeMaint) },
        ].filter(Boolean);
        const hasEstimates = costItems.some(function(x) { return x.est; });
        return (
     <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
       <SHdr zh="自住房概览" en="Home Overview" />
       <div style={FAC}>
        <span style={{ fontSize: 8, color: C.muted }}>持股</span>
        <select value={homeOwn} onChange={function(e) { setHomeOwn(e.target.value); }} style={{ width: 48, height: 18, fontSize: 8, fontWeight: 700, fontFamily: "inherit", border: "none", borderRadius: 3, background: "#fff", color: C.accent, padding: "0 2px", cursor: "pointer" }}>
         {[25,50,60,70,80,90,100].map(function(v) { return <option key={v} value={String(v)}>{v}%</option>; })}
        </select></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, marginBottom: 4 }}>
       {[
        ["当前市值", fmtMoney(hLP), "#1B5E20", "#E8F5E9"],
        ["净资产", fmtMoney(hEquity * hOwn), hEquity >= 0 ? "#1B5E20" : "#B71C1C", hEquity >= 0 ? "#E8F5E9" : "#FFEBEE"],
        [homeHasLoan && hPI > 0 ? (isYr?"年持有成本":"月持有成本") : "无房贷·" + (isYr?"年":"月") + "固定费", fmtMoney(hTotalMo*mul), homeHasLoan && hPI > 0 ? "#E65100" : "#2E7D32", homeHasLoan && hPI > 0 ? "#FFF3E0" : "#E8F5E9"],
        ["总投入 TCI", fmtMoney(hTCI), "#5D4037", "#FFF8E1"],
       ].map(function(item, i) { return (
        <div key={i} style={{ background: item[3], borderRadius: 5, padding: "4px 6px" }}>
         <div style={{ fontSize: 7, color: "#78909C" }}>{item[0]}</div>
         <div style={{ fontSize: 11, fontWeight: 800, color: item[2] }}>{item[1]}</div></div>); })}
      </div>
      {/* Monthly Cost Breakdown */}
      {hTotalMo > 0 && (() => {
       var selRow = selSimIdx !== null && selSimIdx < homeSim.length ? homeSim[selSimIdx] : null;
       var sel = selRow || homeSim[homeSim.length - 1];
       var projYr = selRow ? selRow.calYr : 2026;
       var yrsOut = Math.max(0, projYr - 2026);
       var cgr = 1 + (pF(homeCostGrowth) || 3) / 100;
       var projMul = Math.pow(cgr, yrsOut);
       var projPI = selRow && selRow.debt < 0.01 ? 0 : hPI;
       var projItems = costItems.map(function(item) {
         if (item.l === "月供") {
           var actualPI = projPI + (projPI > 0 ? (modalXtra||0) : 0);
           return { l: modalXtra > 0 ? "供+提" : "月供", v: actualPI, orig: hPI, c: item.c, changed: actualPI !== hPI };
         }
         if (item.l === "PMI") return selRow && selRow.debt < 0.01 ? null : item;
         var projected = Math.round(item.v * projMul);
         return { l: item.l, v: projected, orig: item.v, c: item.c, est: item.est, changed: yrsOut > 0 && projected !== item.v };
       }).filter(Boolean);
       var projTotal = projItems.reduce(function(s, x) { return s + x.v; }, 0);
       var maxV = Math.max.apply(null, projItems.map(function(x) { return x.v; }));
       return <div style={{ background: "#FAF9F6", borderRadius: 8, padding: "5px 8px", border: selRow ? "1px solid #1565C030" : "1px solid #E8E4DE" }}>
       {/* Cost bars */}
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", background: selRow ? "#1565C0" : "#5D4037", borderRadius: 6, padding: "2px 8px" }}>{isYr ? "年" : "月"}持有成本{!homeHasLoan ? " · 无房贷" : ""}{yrsOut > 0 ? " +" + (pF(homeCostGrowth)||3) + "%×" + yrsOut + "yr" : ""}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#BF360C" }}>{fmtMoney(projTotal * mul)}<span style={{ fontSize: 8, fontWeight: 500, color: "#90A4AE" }}>/{isYr ? "年" : "月"}</span></span>
       </div>
       {projItems.map(function(item, i) {
        var hasChange = item.changed;
        var origW = maxV > 0 ? Math.max(4, Math.min(80, item.orig / maxV * 80)) : 0;
        var projW = hasChange && maxV > 0 ? Math.min(80, item.v / maxV * 80) : 0;
        var isPayoff = item.l.includes("月供") && item.v === 0;
        var displayVal = hasChange ? item.v : item.orig;
        var pct = projTotal > 0 ? (item.v / projTotal * 100).toFixed(0) : "";
        return (
        <div key={i} style={{ display: "flex", alignItems: "center", height: 17, gap: 3, marginBottom: 1 }}>
          <span style={{ fontSize: 8, color: item.est ? "#BDBDBD" : item.c, width: 22, flexShrink: 0, overflow: "hidden", fontWeight: 700, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{item.l}{item.est ? "*" : ""}</span>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
           <div style={{ position: "relative", height: 12, width: (hasChange ? projW : origW) + "%", minWidth: 4, flexShrink: 0 }}>
            {hasChange && <div style={{ position: "absolute", top: 0, left: 0, width: (origW > 0 ? origW / projW * 100 : 100) + "%", height: 12, background: item.c + "12", borderRadius: 2, border: "1px dashed " + item.c + "25" }} />}
            <div style={{ width: "100%", height: 12, background: item.c, borderRadius: 2, opacity: item.est ? 0.25 : hasChange ? 0.85 : 0.55 }} />
           </div>
           <span style={{ fontSize: 8, fontWeight: 800, color: isPayoff ? "#2E7D32" : item.c, flexShrink: 0, whiteSpace: "nowrap" }}>{isPayoff ? "$0✓" : fmtMoney(displayVal * mul)}</span>
           {pct && <span style={{ fontSize: 7, color: "#90A4AE", flexShrink: 0 }}>{pct}%</span>}
          </div>
        </div>
       ); })}
       {hasEstimates && <div style={{ fontSize: 6, color: "#9E9E9E", fontStyle: "italic" }}>* 估算</div>}
       </div>;
      })()}</div>);
      })()}</div>
    <div style={{ background: "#FAF9F6", borderRadius: 12, padding: "6px 10px", marginBottom: 4, overflow: "hidden", borderLeft: "3px solid #C9A94E" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <SHdr zh={!homeHasLoan ? "房价增值预测" : modalXtra > 0 ? "房价与加速还贷" : "房价与贷款预测"} en="Projection" />
        <div style={FAC}>
     {selSimIdx !== null && homeSim[selSimIdx] && <div onClick={() => setSelSimIdx(null)} style={{ background: "#1565C0", borderRadius: 8, padding: "2px 8px", fontSize: 8, fontWeight: 800, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>{homeSim[selSimIdx].calYr}年 <span style={{ opacity: 0.6, fontSize: 10 }}>✕</span></div>}
     <div style={{ background: "#2E7D32", borderRadius: 8, padding: "2px 6px", fontSize: 7, fontWeight: 700, color: "#fff" }}>升值 ↑{appRate}%/年</div></div></div>
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
        var allMs = [2026, msCrossPrepay, msCrossover, msPrepayOff, msBaseOff].filter(Boolean).filter(v => v <= chartEnd).sort((a,b) => a-b);
        // Smart label: alternate top/bottom, skip if too close to previous
        var usedTop = {};
        var labelPos = function(yr) {
          for (var mi = 0; mi < allMs.length; mi++) {
            if (allMs[mi] === yr) {
              // Check if any earlier milestone within 3 years used top
              var prev = allMs.slice(0, mi).filter(m => Math.abs(m - yr) <= 3);
              if (prev.some(m => usedTop[m])) { return "insideBottomRight"; }
              usedTop[yr] = true;
              return "insideTopRight";
            }
          }
          return "insideTopRight";
        };
        var isFaded = function(yr) { return selSimIdx !== null && yr >= selYr; };
        // Cost growth for selected year
        var selYrsFromNow = Math.max(0, selYr - 2026);
        var costGrowthMul = Math.pow(1 + (pF(homeCostGrowth) || 3) / 100, selYrsFromNow);
        return <>
     <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
      {[
        { l: "🏠", n: "房价", v: sel.homeVal, c: "#5D4037", bg: "#FFF8E1" },
        { l: "📈", n: "净值", v: sel.equity, c: "#1B5E20", bg: "#E8F5E9" },
        homeHasLoan && (modalXtra > 0 && sel.debtBase > 0.01 && sel.debt !== sel.debtBase
          ? { l: "⚡", n: "加速", v: sel.debt, c: "#E53935", bg: "#FFEBEE" }
          : { l: "💳", n: "贷款", v: sel.debt, c: sel.debt > 0 ? "#B71C1C" : "#1B5E20", bg: sel.debt > 0 ? "#FFEBEE" : "#E8F5E9" }),
        homeHasLoan && sel.cPI > 0 && { l: "💰", n: "月供", v: sel.cPI, c: "#1565C0", bg: "#E3F2FD" },
        { l: "🏷", n: "固定", v: sel.cFixed, c: "#6A1B9A", bg: "#F3E5F5" },
        !homeHasLoan && { l: "✅", n: "全款", v: sel.homeVal, c: "#1B5E20", bg: "#E8F5E9" },
      ].filter(Boolean).map(function(r, i) { return <div key={i} style={{ flex: 1, background: r.bg, borderRadius: 8, padding: "4px 3px", textAlign: "center", minWidth: 0, cursor: "pointer", border: selSimIdx !== null ? "1px solid " + r.c + "25" : "1px solid transparent" }} onClick={() => setSelSimIdx(null)}>
        <div style={{ fontSize: 7, color: r.c, fontWeight: 600 }}>{r.l}{r.n}</div>
        <div style={{ fontSize: 10, fontWeight: 800, color: r.c, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmtMoney(r.v)}</div></div>; })}
     </div>
     <div style={{ background: C.surface, borderRadius: 6, border: "1px solid " + C.border, padding: "4px 4px 2px", position: "relative", touchAction: "none" }}
       onPointerDown={function(e) {
         var el = e.currentTarget;
         var rect = el.getBoundingClientRect();
         var padL = 52, padR = 8;
         var chartW = rect.width - padL - padR;
         var calcIdx = function(cx) {
           var rel = (cx - rect.left - padL) / chartW;
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
      <ResponsiveContainer width="100%" height={200}>
       <ComposedChart data={homeSim} margin={{ top: 14, right: 4, left: -4, bottom: 18 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="#E8E4DE" />
        <XAxis dataKey="calYr" tickFormatter={v => "'" + String(v).slice(-2)} tick={{ fill: C.muted, fontSize: 8 }} interval={Math.max(0, Math.ceil(homeSim.length / 7) - 1)} axisLine={{ stroke: C.border }} tickLine={false} />
        <YAxis yAxisId="left" tickFormatter={v => fmtMoney(v)} tick={{ fill: C.muted, fontSize: 8 }} width={48} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" hide={true} />
        {homeHasLoan && <Bar yAxisId="right" dataKey="cPI" stackId="cost" fill="#1565C0" fillOpacity={0.1} barSize={8} />}
        <Bar yAxisId="right" dataKey="cFixed" stackId="cost" fill="#FF9800" fillOpacity={0.12} barSize={8} radius={[1,1,0,0]} />
        {homeSim[0].held && <ReferenceArea yAxisId="left" x1={chartStart} x2={2026} fill="#9E9E9E" fillOpacity={0.18} />}
        {homeSim[0].held && <ReferenceLine yAxisId="left" x={2026} stroke="#616161" strokeDasharray="3 2" strokeWidth={1} />}
        {msCrossover && msCrossover > Math.max(2026, chartStart) && msCrossover <= chartEnd && <ReferenceArea yAxisId="left" x1={Math.max(2026, chartStart)} x2={modalXtra > 0 && msCrossPrepay ? msCrossPrepay : msCrossover} fill="#FFF3E0" fillOpacity={isFaded(msCrossover) ? 0.1 : 0.25} />}
        {modalXtra > 0 && msCrossPrepay && msCrossPrepay <= chartEnd && <ReferenceLine yAxisId="left" x={msCrossPrepay} stroke="#E53935" strokeDasharray="3 2" strokeWidth={1} opacity={isFaded(msCrossPrepay) ? 0.25 : 1} />}
        {msCrossover && msCrossover <= chartEnd && <ReferenceLine yAxisId="left" x={msCrossover} stroke={modalXtra > 0 ? "#FFCDD2" : "#E65100"} strokeDasharray="3 2" strokeWidth={1} opacity={isFaded(msCrossover) ? 0.25 : 1} />}
        {msPrepayOff && modalXtra > 0 && msPrepayOff <= chartEnd && <ReferenceLine yAxisId="left" x={msPrepayOff} stroke="#E53935" strokeWidth={1.5} opacity={isFaded(msPrepayOff) ? 0.25 : 1} />}
        {msPrepayOff && modalXtra > 0 && msBaseOff && msPrepayOff < msBaseOff && <ReferenceArea yAxisId="left" x1={msPrepayOff} x2={Math.min(msBaseOff, chartEnd)} fill="#E8F5E9" fillOpacity={isFaded(msPrepayOff) ? 0.1 : 0.25} />}
        {msBaseOff && msBaseOff <= chartEnd && <ReferenceLine yAxisId="left" x={msBaseOff} stroke={modalXtra > 0 ? "#FFCDD2" : "#EF9A9A"} strokeDasharray="3 2" strokeWidth={1} opacity={isFaded(msBaseOff) ? 0.2 : 1} />}
        {selSimIdx !== null && sel && <ReferenceLine yAxisId="left" x={sel.calYr} stroke="#1565C0" strokeWidth={1.5} strokeDasharray="2 2" />}
        <Line yAxisId="left" dataKey="homeVal" stroke="#5D4037" dot={false} strokeWidth={2.5} />
        <Line yAxisId="left" dataKey="equity" stroke="#2E7D32" dot={false} strokeWidth={2} />
        {modalXtra > 0 && <Line yAxisId="left" dataKey="debtBase" stroke="#FFCDD2" dot={false} strokeWidth={2} strokeDasharray="6 3" />}
        {homeHasLoan && <Line yAxisId="left" dataKey="debt" stroke={modalXtra > 0 ? "#E53935" : "#D32F2F"} dot={false} strokeWidth={modalXtra > 0 ? 2.5 : 2} />}
       </ComposedChart>
      </ResponsiveContainer>
      {/* Selected year label + dismiss — bottom of chart above x-axis */}
      {selSimIdx !== null && (() => {
        var rng = (chartEnd - chartStart) || 1;
        var pctX = (sel.calYr - chartStart) / rng;
        var leftCalc = "calc(48px + (100% - 56px) * " + pctX + ")";
        return <div onClick={() => setSelSimIdx(null)} style={{ position: "absolute", bottom: 28, left: leftCalc, transform: "translateX(-50%)", zIndex: 10, display: "flex", alignItems: "center", gap: 2, background: "#1565C0", borderRadius: 10, padding: "2px 8px 2px 10px", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{sel.calYr}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", opacity: 0.6 }}>✕</span>
        </div>;
      })()}
      {/* Milestone labels overlay - smart dodging including selected year */}
      {(() => {
        var range = chartEnd - chartStart || 1;
        var rawLabels = [];
        if (homeSim[0].held) rawLabels.push({ yr: 2026, text: "📍当前", color: "#616161", bg: "#fff" });
        if (modalXtra > 0 && msCrossPrepay && msCrossPrepay <= chartEnd) rawLabels.push({ yr: msCrossPrepay, text: "⚡本>息", color: "#E53935", bg: "#FFEBEE" });
        if (msCrossover && msCrossover <= chartEnd) rawLabels.push({ yr: msCrossover, text: modalXtra > 0 ? "原本>息" : "📐本>息", color: modalXtra > 0 ? "#BDBDBD" : "#E65100", bg: modalXtra > 0 ? "#f5f5f5" : "#FFF3E0" });
        if (msPrepayOff && modalXtra > 0 && msPrepayOff <= chartEnd) rawLabels.push({ yr: msPrepayOff, text: "✅还清", color: "#E53935", bg: "#FFEBEE" });
        if (msBaseOff && msBaseOff <= chartEnd) rawLabels.push({ yr: msBaseOff, text: modalXtra > 0 ? "原" + homeLoanYrs + "yr" : "🏁" + homeLoanYrs + "yr", color: modalXtra > 0 ? "#BDBDBD" : "#EF9A9A", bg: modalXtra > 0 ? "#f5f5f5" : "#FCE4EC" });
        rawLabels.sort(function(a, b) { return a.yr - b.yr; });
        var occupied = [];
        if (selSimIdx !== null) {
          occupied.push({ pct: (sel.calYr - chartStart) / range * 100, slot: 1 });
        }
        return rawLabels.map(function(lb, idx) {
          var pctRaw = (lb.yr - chartStart) / range;
          var leftCalc = "calc(48px + (100% - 56px) * " + pctRaw + ")";
          var leftPct = pctRaw * 100;
          var faded = isFaded(lb.yr);
          var useBottom = false;
          for (var oi = 0; oi < occupied.length; oi++) {
            if (Math.abs(occupied[oi].pct - leftPct) < 12 && occupied[oi].slot === 0) {
              useBottom = true; break;
            }
          }
          if (useBottom) {
            for (var oj = 0; oj < occupied.length; oj++) {
              if (Math.abs(occupied[oj].pct - leftPct) < 10 && occupied[oj].slot === 1) {
                useBottom = false; break;
              }
            }
          }
          occupied.push({ pct: leftPct, slot: useBottom ? 1 : 0 });
          return <div key={lb.text} style={{ position: "absolute", [useBottom ? "bottom" : "top"]: useBottom ? 20 : 2, left: leftCalc, transform: "translateX(-50%)", pointerEvents: "none", zIndex: 2 }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: faded ? "#ccc" : lb.color, background: faded ? "#f5f5f5" : lb.bg, borderRadius: 6, padding: "1px 5px", whiteSpace: "nowrap", border: "1px solid " + (faded ? "#e0e0e0" : lb.color + "30"), boxShadow: faded ? "none" : "0 1px 3px " + lb.color + "20" }}>{lb.text}</div></div>;
        });
      })()}
      <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, display: "flex", alignItems: "center", gap: 0 }}>
       <div style={{ width: 44, flexShrink: 0, textAlign: "right", paddingRight: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: "#5D4037" }}>{wYears}年</span>
       </div>
       <div style={{ flex: 1, position: "relative", height: 14 }}>
        {/* Gray unfilled track */}
        <div style={{ position: "absolute", top: 5, left: 0, right: 0, height: 4, borderRadius: 2, background: "#E0E0E0" }}></div>
        {/* Filled track - green to orange as years increase */}
        {(() => {
          var pct = (parseInt(wYears) - 5) / 45 * 100;
          var filledColor = parseInt(wYears) <= 15 ? "#43A047" : parseInt(wYears) <= 25 ? "#F9A825" : parseInt(wYears) <= 35 ? "#EF6C00" : "#D32F2F";
          return <div style={{ position: "absolute", top: 5, left: 0, width: pct + "%", height: 4, borderRadius: 2, background: filledColor, transition: "width 0.1s, background 0.3s" }}></div>;
        })()}
        <input type="range" min={5} max={50} step={1} value={wYears} onChange={e => setWYears(e.target.value)} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 14, opacity: 0, cursor: "pointer", margin: 0 }} />
        <div style={{ position: "absolute", top: 2, left: "calc(" + ((parseInt(wYears) - 5) / 45 * 100) + "% - 5px)", width: 10, height: 10, borderRadius: 5, background: "#fff", border: "2px solid #5D4037", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", pointerEvents: "none", transition: "left 0.1s" }}></div>
       </div>
      </div>
      {/* Legend overlay inside chart right */}
      </div>
     <div style={{ display: "flex", gap: 3, fontSize: 6.5, justifyContent: "center", marginBottom: 2, flexWrap: "wrap", color: "#90A4AE" }}>
        {homeSim[0].held && <span>▒持有</span>}
        <span><span style={{ color: "#5D4037" }}>■</span>房价</span>
        <span><span style={{ color: "#2E7D32" }}>■</span>净资产</span>
        <span><span style={{ color: "#D32F2F" }}>━</span>贷款</span>
        {modalXtra > 0 && <span><span style={{ color: "#FFCDD2" }}>╌</span>原供</span>}
        <span><span style={{ color: "#E53935", opacity: 0.3 }}>█</span>P&I</span>
        <span><span style={{ color: "#FF9800", opacity: 0.3 }}>█</span>固定</span>
        {msCrossover && msCrossover <= chartEnd && <span><span style={{ color: "#E65100" }}>┊</span>本&gt;息</span>}
      </div>
        </>;
      })()}</div>
    {/* Prepayment & Amortization Panel */}
    {homeHasLoan && (() => {
      var hSP2 = parseFloat(homeSaleP)||0, hDP2 = (parseFloat(homeDownPct)||20)/100;
      var hLoan2 = hSP2 * (1 - hDP2);
      var hAR2 = (parseFloat(homeAnnRate)||6.75)/100/12, hN2 = (parseInt(homeLoanYrs)||30)*12;
      var hPI2 = hLoan2 > 0 && hAR2 > 0 ? hLoan2 * hAR2 / (1 - Math.pow(1 + hAR2, -hN2)) : 0;
      var buyYr2 = alreadyBought && purchaseYear ? parseInt(purchaseYear)||2026 : 2026;
      var heldMo = Math.max(0, (2026 - buyYr2) * 12);
      var paidPrin = 0, paidInt = 0, bal2 = hLoan2;
      for (var mm = 0; mm < heldMo && bal2 > 0.01; mm++) { var ii = bal2 * hAR2; var pp = Math.max(0, hPI2 - ii); paidPrin += pp; paidInt += ii; bal2 = Math.max(0, bal2 - pp); }
      // Calc base vs prepay remaining
      var balB = bal2, balP = bal2, moBase = 0, moPrep = 0, intB2 = 0, intP2 = 0;
      for (var mm2 = 0; mm2 < hN2 - heldMo && balB > 0.01; mm2++) { var i1 = balB * hAR2; balB = Math.max(0, balB - Math.max(0, hPI2 - i1)); intB2 += i1; moBase = mm2 + 1; }
      for (var mm3 = 0; mm3 < hN2 - heldMo && balP > 0.01; mm3++) { var i2 = balP * hAR2; balP = Math.max(0, balP - Math.max(0, hPI2 - i2) - modalXtra); intP2 += i2; moPrep = mm3 + 1; }
      var moSaved = moBase - moPrep, intSaved = intB2 - intP2;
      return <div style={{ background: "#FAF9F6", borderRadius: 10, padding: "6px 10px", marginBottom: 4, borderLeft: "3px solid #1565C0" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#1565C0", marginBottom: 4 }}>📋 提前还贷模拟</div>
        {heldMo > 0 && <div style={{ display: "flex", gap: 6, marginBottom: 4, padding: "3px 6px", background: "#F5F5F5", borderRadius: 4 }}>
     <span style={{ fontSize: 7.5, color: "#78909C" }}>已还 <b style={{ color: "#2E7D32" }}>{Math.floor(heldMo/12)}年{heldMo%12}月</b></span>
     <span style={{ fontSize: 7.5, color: "#78909C" }}>本金 <b style={{ color: "#1565C0" }}>{fmtMoney(paidPrin)}</b></span>
     <span style={{ fontSize: 7.5, color: "#78909C" }}>利息 <b style={{ color: "#E65100" }}>{fmtMoney(paidInt)}</b></span>
     <span style={{ fontSize: 7.5, color: "#78909C" }}>余额 <b style={{ color: "#5D4037" }}>{fmtMoney(bal2)}</b></span>
        </div>}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
     <span style={{ fontSize: 8, color: "#78909C", flexShrink: 0 }}>提前还贷</span>
     <input type="range" min={0} max={5000} step={50} value={modalXtra} onChange={function(e) { setModalXtra(parseInt(e.target.value)); }} style={{ flex: 1, height: 12, accentColor: modalXtra > 0 ? "#1565C0" : "#BDBDBD", cursor: "pointer" }} />
     <span style={{ fontSize: 10, fontWeight: 800, color: modalXtra > 0 ? "#1565C0" : "#9E9E9E", width: 50, textAlign: "right", flexShrink: 0 }}>{modalXtra > 0 ? "$"+modalXtra+"/月" : "无"}</span>
        </div>
        {modalXtra > 0 && <div style={{ display: "flex", gap: 3 }}>
     {[
      { l: "原始还款", v: moToYrMo(moBase + heldMo), c: "#78909C", bg: "#F5F5F5" },
      { l: "提前还清", v: moToYrMo(moPrep + heldMo), c: "#1565C0", bg: "#E3F2FD" },
      { l: "节省时间", v: moSaved > 0 ? moToYrMo(moSaved) : "—", c: "#2E7D32", bg: "#E8F5E9" },
      { l: "节省利息", v: intSaved > 0 ? fmtMoney(intSaved) : "—", c: "#2E7D32", bg: "#E8F5E9" },
     ].map(function(s, si) { return <div key={si} style={{ flex: 1, background: s.bg, borderRadius: 8, padding: "5px 4px", textAlign: "center", border: "1px solid " + s.c + "20" }}>
      <div style={{ fontSize: 7, color: "#78909C", fontWeight: 600 }}>{s.l}</div>
      <div style={{ fontSize: 11, fontWeight: 800, color: s.c }}>{s.v}</div></div>; })}
        </div>}
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
     <button onClick={() => setModal("prepay")} style={{ flex: 1, padding: "6px 0", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, background: "#fff", border: "1px solid #1565C0", color: "#1565C0" }}>📋 摊销时间表</button>
     <button onClick={() => { setRptStep(0); setRptYear(String(2026 + Math.min(parseInt(wYears)||30, 20))); setRptPrepay(modalXtra); setModal("homeReport"); }} style={{ flex: 1, padding: "6px 0", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, background: "#1565C0", border: "1px solid #1565C0", color: "#fff" }}>📊 自住房报告</button>
        </div></div>;
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
      { l: retLabel, v: k401B, c: "#4A7FA5" },
      { l: "股票", v: stockB, c: "#7B5EA7" },
      { l: "存款", v: bankB, c: C.green },
    ].filter(Boolean);
    const totalAssets = assets.reduce((s,a) => s+Math.max(0,a.v), 0);
    const D = (v) => rentPeriod === "yr" ? fxM(v * 12) : fxM(v);
    const pfx = rentPeriod === "yr" ? "/年" : "/月";
    const rRow = retireRow || {};
    return (
      <div style={{ marginBottom: 2 }}>
        <div style={{ background: "linear-gradient(135deg,"+C.accent+"10 0%,"+C.green+"08 100%)", border: "1.5px solid "+C.accent+"30", borderRadius: 10, padding: "7px 8px", marginBottom: 2 }}>
     <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ flex: 1, textAlign: "center" }}>
       <div style={{ fontSize: 8.5, color: C.muted }}>当前净资产 · {uAge}岁</div>
       <div style={{ fontSize: 20, fontWeight: 800, color: C.accent, letterSpacing: "-0.02em" }}>{fxM(totalNW)}</div>
       <div style={{ fontSize: 7.5, color: C.muted, marginTop: 1 }}>被动 <b style={{ color: totalPassive>0?C.green:C.muted }}>{D(totalPassive)}{pfx}</b> · CoC <b style={{ color: cocColor }}>{fmtPct(coc*100)}</b></div>
       {wantInvest && calc.cocNoDbt > coc && <div style={{ fontSize: 6.5, color: C.blue, marginTop: 1 }}>清贷后 <b>{D((noi/12)*invOwn)}{pfx}</b> (+{D((totalAnnDS/12)*invOwn)}{pfx})</div>}</div>
      <div style={{ width: 1, height: 40, background: C.border, margin: "0 4px", flexShrink: 0 }} />
      <div style={{ flex: 1, textAlign: "center" }}>
       <div style={{ fontSize: 8.5, color: freedomAge&&rAge>=freedomAge?C.green:C.accent }}>{rAge}岁退休</div>
       <div style={{ fontSize: 18, fontWeight: 800, color: freedomAge&&rAge>=freedomAge?C.green:C.accent, letterSpacing: "-0.02em" }}>{fxM(showNominal?(rRow.netWorth||0):(rRow.nwReal||rRow.netWorth||0))}</div>
       <div style={{ fontSize: 7.5, color: C.muted, marginTop: 1 }}>{showNominal?"名义":"通胀"+inflRate+"%调整"} · 被动<b style={{ color: C.green }}>{D(rRow.monthlyTotalPsv||0)}{pfx}</b></div></div>
      <div style={{ width: 1, height: 40, background: C.border, margin: "0 4px", flexShrink: 0 }} />
      <div style={{ flex: 1, textAlign: "center" }}>
       <div style={{ fontSize: 8.5, color: "#5C6BC0" }}>{uAge+cmpYrs}岁 · 模拟终点</div>
       <div style={{ fontSize: 18, fontWeight: 800, color: "#5C6BC0", letterSpacing: "-0.02em" }}>{lastW?fxM(showNominal?(lastW.netWorth||0):(lastW.nwReal||lastW.netWorth||0)):"—"}</div>
       <div style={{ fontSize: 7.5, color: C.muted, marginTop: 1 }}>被动<b style={{ color: "#5C6BC0" }}>{lastW?D(lastW.monthlyTotalPsv||0):"—"}{pfx}</b>{lastW&&totalNW>0?<> · <b style={{ color: "#5C6BC0" }}>{(((showNominal?(lastW.netWorth||0):(lastW.nwReal||lastW.netWorth||0))/totalNW-1)*100).toFixed(0)}%</b></>:""}</div></div>
     </div></div>
        <div style={{ background: C.surface, border: "1.5px solid "+(freedomAge?C.green:C.border)+"50", borderRadius: 7, padding: "5px 8px", marginBottom: 2 }}>
     <div style={{ display: "flex", gap: 3, alignItems: "center", marginBottom: 3 }}>
      {[["收入","income"],["净值","wealth"]].map(([lbl,m]) => (
       <button key={m} onClick={() => setFfMode(m)} style={{ padding: "2px 5px", fontSize: 8, borderRadius: 3, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, whiteSpace: "nowrap", border: "1px solid "+(ffMode===m?C.green:C.borderIn), background: ffMode===m?C.green:"#fff", color: ffMode===m?"#fff":C.sub }}>{lbl}</button>
      ))}
      <span style={{ fontSize: 7.5, color: C.orange, fontWeight: 600, whiteSpace: "nowrap" }}>税{effectiveTax}%</span>
      <span style={{ fontSize: 8, fontWeight: 700, color: C.accent, whiteSpace: "nowrap" }}>{ffMode==="income"?D(totalPassive)+pfx:fxM(totalNW)}</span>
      <span style={{ fontSize: 7, color: C.muted }}>→</span>
      {ffMode === "income" ?
       <input type="range" min={2000} max={20000} step={500} value={parseInt(ffIncomeTgt)||10000} onChange={function(e) { setFfIncomeTgt(e.target.value); }} style={{ flex: 1, accentColor: C.green, cursor: "pointer", height: 8, margin: 0 }} /> :
       <input type="range" min={1000000} max={20000000} step={500000} value={parseInt(ffWealthTgt)||3000000} onChange={function(e) { setFfWealthTgt(e.target.value); }} style={{ flex: 1, accentColor: C.green, cursor: "pointer", height: 8, margin: 0 }} />
      }
      <span style={{ fontSize: 10, fontWeight: 800, color: C.green, whiteSpace: "nowrap" }}>{ffMode==="income"?D(parseFloat(ffIncomeTgt)||10000)+pfx:fxM(parseFloat(ffWealthTgt)||3000000)}</span>
     </div>
     <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, color: freedomAge?C.green:C.accent }}>🔥 {freedomAge?freedomAge+"岁FIRE":"未达成"}</span>
      <div style={{ flex: 1 }}></div>
      {freedomAge && <span style={{ fontSize: 8, color: C.green, background: C.green+"12", borderRadius: 3, padding: "1px 5px" }}>早{67-(freedomAge||67)}年</span>}
      <span style={{ fontSize: 11, fontWeight: 800, color: fireProgress>=1?C.green:C.orange }}>{(fireProgress*100).toFixed(0)}%</span></div>
     <div style={{ position: "relative" }}>
      <div style={{ height: 14, background: C.border, borderRadius: 7, overflow: "hidden" }}>
       <div style={{ height: "100%", width: (fireProgress*100)+"%", background: fireProgress>=1 ? "linear-gradient(90deg,"+C.green+",#43A047)" : "linear-gradient(90deg,"+C.blue+","+C.accent+")", borderRadius: 7, transition: "width 0.3s" }} />
      </div>
      {[25,50,75].map(m => (
       <div key={m} style={{ position: "absolute", left: m+"%", top: 0, width: 1, height: 14, background: "#fff8", zIndex: 1 }} />
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
       <span style={{ fontSize: 7.5, color: C.muted }}>0%</span>
       <span style={{ fontSize: 7.5, color: fireProgress>=0.25?C.green:C.muted }}>25%</span>
       <span style={{ fontSize: 7.5, color: fireProgress>=0.5?C.green:C.muted }}>50%</span>
       <span style={{ fontSize: 7.5, color: fireProgress>=0.75?C.green:C.muted }}>75%</span>
       <span style={{ fontSize: 7.5, color: fireProgress>=1?C.green:C.muted }}>100%</span></div></div>
        </div>
        <div style={{ background: C.bg, border: "1.5px solid "+(freedomAge?C.green:C.accent)+"30", borderRadius: 6, padding: "5px 8px", marginBottom: 2 }}>
     {(() => {
      var stage, stageColor, stageEmoji, stageNote;
      if (!freedomAge) {
       stage = "尚需积累"; stageColor = "#9E9E9E"; stageEmoji = "⏳"; stageNote = "当前设定下无法达到FIRE · 请调整收入目标或储蓄率";
      } else if (rAge <= freedomAge - 5) {
       stage = "激进退休"; stageColor = "#C62828"; stageEmoji = "⚡"; stageNote = "比FIRE早"+(freedomAge-rAge)+"年 · 存款可能不足 · 需额外收入补贴";
      } else if (rAge < freedomAge) {
       stage = "轻退休"; stageColor = "#E65100"; stageEmoji = "🌤"; stageNote = "比FIRE早"+(freedomAge-rAge)+"年 · 需少量工作或兼职补贴";
      } else if (rAge === freedomAge) {
       stage = "FIRE 财务自由"; stageColor = "#2E7D32"; stageEmoji = "🔥"; stageNote = "被动收入完全覆盖支出 · 工作"+Math.max(0,rAge-uAge)+"年";
      } else if (rAge <= freedomAge + 3) {
       stage = "安全退休"; stageColor = "#00897B"; stageEmoji = "🛡"; stageNote = "比FIRE多积累"+(rAge-freedomAge)+"年 · 更充裕的安全边际";
      } else if (rAge < 67) {
       stage = "充裕退休"; stageColor = "#1565C0"; stageEmoji = "💎"; stageNote = "超额积累"+(rAge-freedomAge)+"年 · 退休生活非常宽裕";
      } else {
       stage = "延迟退休"; stageColor = "#5C6BC0"; stageEmoji = "🏢"; stageNote = "工作至法定退休 · 最大化积累";}
      return <div>
       <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
         <span style={{ fontSize: 6, fontWeight: 600, color: "#fff", background: C.accent, borderRadius: 6, padding: "1px 5px", marginBottom: 1 }}>当前年龄</span>
         <span style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{uAge}<span style={{ fontSize: 9, fontWeight: 600 }}>岁</span></span></div>
        <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
         <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: stageColor, background: stageColor + "12", borderRadius: 4, padding: "1px 5px" }}>{stageEmoji} {stage}</span>
          {freedomAge && freedomAge !== rAge && <span style={{ fontSize: 7, color: C.muted }}>FIRE={freedomAge}岁</span>}</div>
         {freedomAge ? <div>
          <div style={{ fontSize: 7, color: C.muted, marginBottom: 1 }}>自选退休年龄</div>
          <input type="range" min={uAge+1} max={70} step={1} value={rAge} onChange={function(e) { var v = parseInt(e.target.value); setRetireAge(String(v)); setRetireManual(true); }} style={{ width: "100%", height: 14, accentColor: stageColor, cursor: "pointer" }} />
         </div> : null}</div>
        {freedomAge && <span style={{ fontSize: 20, fontWeight: 800, color: stageColor, flexShrink: 0 }}>{rAge}<span style={{ fontSize: 9, fontWeight: 600 }}>岁</span></span>}</div>
       <div style={{ fontSize: 7.5, color: stageColor, marginBottom: 2, opacity: 0.8 }}>{stageNote} · {rAge < (parseInt(ssClaimAge)||67) ? ssLabel+" "+ssClaimAge+"岁起" : "含"+ssLabel} · {rAge >= (parseInt(k401DrawAge)||60) ? retLabel+"可提取" : retLabel+" "+k401DrawAge+"岁起"}</div></div>;
     })()}</div>
        {wealthRows.length > 0 && (
     <div style={{ background: C.surface, borderRadius: 6, border: "1px solid "+C.border, padding: "3px 0 0", marginBottom: 2 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 2px" }}>
       <span style={{ fontSize: 7.5, fontWeight: 600, color: C.sub }}>{showInflAdj&&parseFloat(inflRate)>0?"橙=今日购买力":"蓝=积累 绿=退休"}{showIncomeLine?" · 灰柱=被动收入":""}{showStockComp?" · 紫=指数对比":""}</span>
       <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", fontSize: 7.5, color: C.muted }}><input type="checkbox" checked={showIncomeLine} onChange={function(e) { setShowIncomeLine(e.target.checked); }} style={{ accentColor: C.orange, cursor: "pointer", width: 8, height: 8 }} />收入</label>
        <label style={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", fontSize: 7.5, color: C.muted }}><input type="checkbox" checked={showStockComp} onChange={function(e) { setShowStockComp(e.target.checked); }} style={{ accentColor: "#7B5EA7", cursor: "pointer", width: 8, height: 8 }} />指数</label>
        <div onClick={function() { if (showInflAdj) { setShowInflAdj(false); setShowNominal(false); } else { setShowInflAdj(true); } }} style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer", padding: "1px 4px", borderRadius: 4, background: showInflAdj ? "#E65100" + "15" : "transparent", border: "0.5px solid " + (showInflAdj ? "#E65100" + "40" : C.border) }}>
         <div style={{ width: 18, height: 10, borderRadius: 5, background: showInflAdj ? "#E65100" : "#BDBDBD", padding: 1, transition: "background 0.2s", flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: "#fff", transform: showInflAdj ? "translateX(8px)" : "translateX(0)", transition: "transform 0.2s" }} /></div>
         <span style={{ fontSize: 7.5, fontWeight: 600, color: showInflAdj ? "#E65100" : C.muted }}>{showInflAdj ? "考虑通胀" : "不考虑通胀"}</span></div></div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
       <ComposedChart data={wealthRows} margin={{ top: 2, right: 2, left: -4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
        <XAxis dataKey="age" tickFormatter={v => v+"岁"} tick={{ fill: C.muted, fontSize: 9.5 }} interval={Math.max(0, Math.ceil(wealthRows.length/6)-1)} axisLine={{ stroke: C.border }} tickLine={false} />
        <YAxis yAxisId="left" tickFormatter={v => fmtMoney(v)} tick={{ fill: C.muted, fontSize: 8 }} width={38} axisLine={false} tickLine={false} />
        {showIncomeLine && <YAxis yAxisId="right" orientation="right" tickFormatter={v => fmtMoney(v)} tick={{ fill: C.orange, fontSize: 7.5 }} width={30} axisLine={false} tickLine={false} />}
        <Tooltip content={<CustomTooltip />} />
        {(!showInflAdj || parseFloat(inflRate)<=0 || showNominal) && <Line yAxisId="left" dataKey="netWorthPre" name="积累期(名义)" stroke={C.blue} dot={false} strokeWidth={showInflAdj&&parseFloat(inflRate)>0?1.5:2.5} strokeDasharray={showInflAdj&&parseFloat(inflRate)>0?"4 2":""} opacity={showInflAdj&&parseFloat(inflRate)>0?0.35:1} connectNulls={false} />}
        {(!showInflAdj || parseFloat(inflRate)<=0 || showNominal) && <Line yAxisId="left" dataKey="netWorthPost" name="退休期(名义)" stroke={C.green} dot={false} strokeWidth={showInflAdj&&parseFloat(inflRate)>0?1.5:2.5} strokeDasharray={showInflAdj&&parseFloat(inflRate)>0?"4 2":""} opacity={showInflAdj&&parseFloat(inflRate)>0?0.35:1} connectNulls={false} />}
        {showInflAdj && parseFloat(inflRate) > 0 && <Line yAxisId="left" dataKey="nwReal" name="实际购买力" stroke="#E65100" dot={false} strokeWidth={2.5} />}
        {showIncomeLine && <Bar yAxisId="right" dataKey={rentPeriod==="yr"?(showInflAdj&&parseFloat(inflRate)>0?"annPsvReal":"annPsv"):(showInflAdj&&parseFloat(inflRate)>0?"psvReal":"monthlyTotalPsv")} name={rentPeriod==="yr"?"年收入":"月收入"} fill="#90A4AE" opacity={0.45} maxBarSize={10} isAnimationActive={false} radius={[2,2,0,0]} />}
        {(() => {
         const refLines = [];
         if (freedomAge) refLines.push({ x: freedomAge, label: rAge===freedomAge?"FIRE=退休 "+freedomAge:"FIRE "+freedomAge, color: C.green, bg: "#E8F5E9", dash: "4 2", w: 1 });
         if (rAge !== freedomAge) refLines.push({ x: rAge, label: "退休 "+rAge, color: C.accent, bg: "#FFF3E0", dash: "6 2", w: 1.5 });
         if ((uAge+cmpYrs)>=67) refLines.push({ x: 67, label: "法定退休", color: "#8B6914", bg: "#FFF8E1", dash: "3 3", w: 0.5 });
         if ((uAge+cmpYrs)>=(parseInt(k401DrawAge)||60)) refLines.push({ x: parseInt(k401DrawAge)||60, label: retLabel+" "+(parseInt(k401DrawAge)||60), color: "#C2185B", bg: "#FCE4EC", dash: "5 3", w: 0.5 });
         var investPayoffAge = Math.round(uAge + Math.max(0, investPayoffYrs - investHeld));
         if (wantInvest && investPayoffAge > uAge && investPayoffAge <= uAge+cmpYrs) refLines.push({ x: investPayoffAge, label: "投资房清贷", color: C.blue, bg: "#E3F2FD", dash: "4 2", w: 1 });
         if (wantHome && homeHasLoan) { var homePayoffAge = Math.round(uAge + Math.max(0, homePayoffYrs - homeHeld)); if (homePayoffAge > uAge && homePayoffAge <= uAge+cmpYrs) refLines.push({ x: homePayoffAge, label: "自住房清贷", color: "#00897B", bg: "#E0F2F1", dash: "4 2", w: 1 }); }
         refLines.sort((a,b) => a.x - b.x);
         return refLines.map((r, i) => (
          <ReferenceLine key={i} yAxisId="left" x={r.x} stroke={r.color} strokeDasharray={r.dash} strokeWidth={r.w}
           label={({ viewBox: vb }) => {
            const lw = r.label.length > 6 ? 42 : 34;
            const rx = (vb.x||0) - lw - 2;
            const ry = (vb.y||0) + 4 + i * 14;
            return <g><rect x={Math.max(0,rx)} y={ry} width={lw} height={11} rx={3} fill={r.bg} stroke={r.color} strokeWidth={0.5} opacity={0.92} /><text x={Math.max(0,rx)+lw/2} y={ry+8} textAnchor="middle" style={{ fontSize: 6, fontWeight: 700, fill: r.color }}>{r.label}</text></g>;
           }} />
         ));
        })()}
        {showStockComp && <Line yAxisId="left" dataKey="stockValue" name="指数" stroke="#7B5EA7" dot={false} strokeWidth={1.8} strokeDasharray="6 3" />}
       </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 8px 4px", borderTop: "1px solid "+C.border }}>
       <span style={{ fontSize: 8.5, fontWeight: 600, color: C.sub }}>{uAge}岁</span>
       <input type="range" min={5} max={60} step={1} value={parseInt(compoundYears)||44} onChange={function(e) { setCompoundYears(e.target.value); setWYears(e.target.value); }} style={{ flex: 1, accentColor: C.accent, cursor: "pointer", height: 12 }} />
       <span style={{ fontSize: 8.5, fontWeight: 600, color: C.accent }}>{uAge+cmpYrs}岁</span>
       <span style={{ fontSize: 8.5, fontWeight: 700, color: C.accent, background: C.accent+"12", borderRadius: 3, padding: "1px 4px", whiteSpace: "nowrap" }}>模拟{compoundYears}年</span></div></div>
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
     const CL2 = { re: "#2E7D32", k401: "#C2185B", ss: "#0277BD", bank: "#E65100", stock: "#7B1FA2" };
     const replRate2 = (parseFloat(annualIncome)||100000) > 0 ? aftTax*12/((parseFloat(annualIncome)||100000)*Math.pow(1+(parseFloat(incomeGrowth)/100||0.03), Math.max(0,rAge-uAge)))*100 : 0;
     const retireNW = rRow.nwReal || rRow.netWorth || 0;
     const invOwnP = (parseFloat(investOwn)||100)/100;
     const reEquity = (rRow.netWorth||0) - (rRow.cashPool||0) - (rRow.k401Val||0);
     const assetItems = (wantInvest ? [["房产", Math.max(0,reEquity*invOwnP), CL2.re]] : []).concat([[retLabel, rRow.k401Val||0, CL2.k401], ["股票", accStock, CL2.stock], ["存款", accBank, CL2.bank]]).filter(function(a){return a[1]>0;});
     const assetTotal = assetItems.reduce(function(s,a){return s+a[1];}, 0);
     const incItems = (wantInvest ? [["租金",reM,CL2.re]] : []).concat([[retLabel,k401M,CL2.k401],[ssLabel,ssM,CL2.ss],["利息",bankM,CL2.bank],["股息",stockM,CL2.stock]]).filter(function(a){return a[1]>0;});
     const r2 = 38, cx2 = 44, cy2 = 44, circ2 = 2*Math.PI*r2;
     const makeDonut = (items, total, c1, c2) => {
      let off = 0;
      return <svg width={88} height={88} viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
       <circle cx={cx2} cy={cy2} r={r2} fill="none" stroke={C.border} strokeWidth={9} />
       {items.map(([l,v,cl]) => { const p = total > 0 ? v/total : 0; const d = p*circ2; const el = <circle key={l} cx={cx2} cy={cy2} r={r2} fill="none" stroke={cl} strokeWidth={9} strokeDasharray={d+" "+(circ2-d)} strokeDashoffset={-off} transform={"rotate(-90 "+cx2+" "+cy2+")"} />; off += d; return el; })}
       <text x={cx2} y={cy2} textAnchor="middle" style={{ fontSize: c1.length > 8 ? 8 : 11, fontWeight: 800, fill: C.green }}>{c1}</text>
       <text x={cx2} y={cy2+8} textAnchor="middle" style={{ fontSize: 7.5, fill: C.muted }}>{c2}</text>
      </svg>;
     };
     return <div style={{ marginBottom: 2 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 3 }}>
       <div style={{ background: C.surface, border: "1px solid "+C.border, borderRadius: 7, padding: "5px 6px" }}>
        <div style={{ fontSize: 8.5, fontWeight: 700, color: C.sub, marginBottom: 2 }}>{rAge}岁退休时净资产</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
         {makeDonut(assetItems, assetTotal, fxM(retireNW), rAge+"岁")}
         <div style={{ flex: 1, minWidth: 0 }}>
          {assetItems.map(([l,v,cl], i) => (
           <div key={i} style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
            <div style={{ width: 5, height: 5, borderRadius: 1, background: cl, flexShrink: 0 }} />
            <span style={{ fontSize: 8.5, color: C.muted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l}</span>
            <span style={{ fontSize: 8.5, fontWeight: 700 }}>{assetTotal>0?Math.round(v/assetTotal*100):0}%</span></div>
          ))}</div></div>
       </div>
       <div style={{ background: C.surface, border: "1px solid "+C.border, borderRadius: 7, padding: "5px 6px" }}>
        <div style={{ fontSize: 8.5, fontWeight: 700, color: C.sub, marginBottom: 2 }}>退休{rentPeriod==="yr"?"每年":"每月"}收入分配</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
         {makeDonut(incItems, totM, rentPeriod==="yr"?fxM(aftTax*12):fxM(aftTax), rentPeriod==="yr"?"税后/年":"税后/月")}
         <div style={{ flex: 1, minWidth: 0 }}>
          {incItems.map(([l,v,cl], i) => (
           <div key={i} style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
            <div style={{ width: 5, height: 5, borderRadius: 1, background: cl, flexShrink: 0 }} />
            <span style={{ fontSize: 8.5, color: C.muted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l}</span>
            <span style={{ fontSize: 8.5, fontWeight: 700 }}>{rentPeriod==="yr"?fxM(v*12):fxM(v)}</span></div>
          ))}</div></div>
       </div></div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, background: C.surface, border: "1px solid "+C.border, borderRadius: 5, padding: "4px 8px" }}>
       <span style={{ fontSize: 8.5, color: C.sub }}>收入替代率</span>
       <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: Math.min(replRate2,100)+"%", background: "linear-gradient(90deg,"+(replRate2>=80?"#43A047":"#E53935")+","+(replRate2>=80?"#2E7D32":"#FF9800")+")", borderRadius: 4 }} />
       </div>
       <span style={{ fontSize: 12.5, fontWeight: 800, color: replRate2>=80?C.green:replRate2>=60?"#FF9800":"#E53935" }}>{replRate2.toFixed(0)}%</span>
       <span style={{ fontSize: 7.5, color: C.muted }}>{replRate2 >= 80 ? "优秀" : replRate2 >= 60 ? "良好" : "偏低"}</span>
      </div></div>;
        })()}
        <div style={{ marginTop: 3 }}>
     <button onClick={() => setModal("fireReport")} style={{ width: "100%", padding: "8px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, background: "linear-gradient(135deg, #00B894, #00897B)", border: "none", color: "#fff", boxShadow: "0 2px 8px rgba(0,184,148,0.25)" }}>🔮 FIRE 加速规划器</button>
        </div></div>);
  })()}
  {/* ═══ SAVE/LOAD MODAL ═══ */}
  {saveModal === "export" && (
    <div style={overlay} onClick={() => setSaveModal(null)}>
      <div style={mBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
     <span style={{ fontSize: 15, fontWeight: 700, color: C.green }}>💾 保存配置</span>
     <button onClick={() => setSaveModal(null)} style={{ background: C.inset, border: "none", borderRadius: 5, color: C.sub, fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 6 }}>点击「复制」，然后粘贴到备忘录/Notes保存。下次用「读取」恢复。</div>
        <textarea readOnly value={JSON.stringify(getStateSnapshot())} style={{ width: "100%", height: 120, fontSize: 9.5, fontFamily: "monospace", border: "1px solid " + C.border, borderRadius: 6, padding: 8, boxSizing: "border-box", background: C.inset, color: C.text, resize: "none" }} onFocus={e => e.target.select()} />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
     <button onClick={() => { handleCopyExport(); }} style={{ flex: 1, padding: "10px 0", fontSize: 14, fontWeight: 700, background: C.green, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>📋 复制到剪贴板</button>
        </div>
        {saveMsg && <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: saveMsg.startsWith("✅") ? C.green : C.orange, textAlign: "center" }}>{saveMsg}</div>}</div></div>
  )}
  {saveModal === "import" && (
    <div style={overlay} onClick={() => setSaveModal(null)}>
      <div style={mBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
     <span style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>📂 读取配置</span>
     <button onClick={() => setSaveModal(null)} style={{ background: C.inset, border: "none", borderRadius: 5, color: C.sub, fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 6 }}>从备忘录复制之前保存的配置，粘贴到下方，点击「应用」。</div>
        <textarea placeholder='在此粘贴配置内容...' value={importText} onChange={e => setImportText(e.target.value)} style={{ width: "100%", height: 120, fontSize: 9.5, fontFamily: "monospace", border: "1px solid " + C.border, borderRadius: 6, padding: 8, boxSizing: "border-box", background: "#fff", color: C.text, resize: "none" }} />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
     <button onClick={function() { navigator.clipboard.readText().then(function(t) { setImportText(t); }).catch(function() {}); }} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, background: C.inset, color: C.sub, border: "1px solid " + C.border, borderRadius: 6, cursor: "pointer" }}>📋 粘贴</button>
     <button onClick={handleApplyImport} disabled={!importText.trim()} style={{ flex: 2, padding: "10px 0", fontSize: 14, fontWeight: 700, background: importText.trim() ? C.blue : C.border, color: "#fff", border: "none", borderRadius: 6, cursor: importText.trim() ? "pointer" : "default" }}>✅ 应用配置</button>
        </div>
        {saveMsg && <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: saveMsg.startsWith("✅") ? C.green : C.red, textAlign: "center" }}>{saveMsg}</div>}</div></div>
  )}
  {/* ═══ PREPAY MODAL ═══ */}
  {modal === "prepay" && (() => {
    var lAmt = calc.loanAmt, aR2 = calc.aR, lY2 = calc.lY;
    var r = aR2 / 100 / 12, n = lY2 * 12;
    var basePmt = lAmt > 0 && r > 0 ? lAmt * r / (1 - Math.pow(1 + r, -n)) : 0;
    // Mid-month: calculate months already paid
    var py = parseInt(purchaseYear)||0, pm = parseInt(purchaseMonth)||1, pd = parseInt(purchaseDay)||15;
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
    <div style={overlay}>
      <div style={{ ...mBox, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
     <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>摊销时间表</span>
     <button onClick={function() { setModal(null); setModalXtra(0); }} style={{ background: C.inset, border: "none", borderRadius: 5, color: C.sub, fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {monthsPaid > 0 && <div style={{ background: "#E8F5E9", borderRadius: 6, padding: "5px 8px", marginBottom: 4, border: "1px solid #C8E6C9" }}>
     <div style={{ fontSize: 8.5, fontWeight: 600, color: "#2E7D32", marginBottom: 2 }}>📅 已持有 {Math.floor(monthsPaid/12)}年{monthsPaid%12}个月 · Mid-month {pd >= 15 ? "≥15日" : "<15日"}</div>
     <div style={{ display: "flex", gap: 8, fontSize: 8, color: "#1B5E20" }}>
      <span>已还本金 <b>{fmtMoney(paidPrin)}</b></span>
      <span>已付利息 <b>{fmtMoney(paidInt)}</b></span>
      <span>已建权益 <b>{equityPct.toFixed(1)}%</b></span></div>
     <div style={{ height: 6, background: "#C8E6C9", borderRadius: 3, marginTop: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: equityPct + "%", background: "#2E7D32", borderRadius: 3, transition: "width 0.3s" }} /></div>
     <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6.5, color: "#78909C", marginTop: 1 }}>
      <span>当前余额 {fmtMoney(curBal)}</span>
      <span>剩余 {n - monthsPaid} 期</span>
     </div></div>}
        <div style={{ background: C.inset, borderRadius: 8, padding: "6px 8px", marginBottom: 4 }}>
     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
      <span style={{ fontSize: 8, color: C.sub }}>每月提前还款</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: modalXtra > 0 ? C.green : C.muted }}>{modalXtra > 0 ? "$" + modalXtra + "/月" : "无"}</span></div>
     <input type="range" min={0} max={5000} step={50} value={modalXtra} onChange={function(e) { setModalXtra(parseInt(e.target.value)); }} style={{ width: "100%", height: 14, accentColor: modalXtra >= 2000 ? "#2E7D32" : modalXtra >= 1000 ? "#43A047" : modalXtra >= 500 ? "#66BB6A" : modalXtra > 0 ? "#FFA726" : C.border, cursor: "pointer" }} />
     <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: C.muted, marginTop: 1 }}><span>$0</span><span>$2,500</span><span>$5,000</span></div></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 3, marginBottom: 4 }}>
     {[
      { l: "原始还款期", v: moToYrMo(base.months), c: C.sub },
      { l: modalXtra > 0 ? "提前还清" : "当前还款期", v: moToYrMo(withX.months), c: modalXtra > 0 ? C.green : C.sub },
      { l: "节省时间", v: moSaved > 0 ? moToYrMo(moSaved) : "—", c: C.green },
      { l: "节省利息", v: intSaved > 0 ? fmtMoney(intSaved) : "—", c: C.green },
     ].map(function(item, i) { return (
      <div key={i} style={{ background: item.c + "08", borderRadius: 4, padding: "3px 4px", border: "0.5px solid " + item.c + "20", textAlign: "center" }}>
       <div style={{ fontSize: 6, color: C.muted }}>{item.l}</div>
       <div style={{ fontSize: 9, fontWeight: 800, color: item.c }}>{item.v}</div></div>); })}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
     <thead>
      <tr style={{ borderBottom: "1.5px solid " + C.border }}>
       {["Yr", "年供", "本金", "利息", "余额"].map(function(h, i) { return (
        <th key={i} style={{ padding: "2px 3px", textAlign: i === 0 ? "left" : "right", fontWeight: 600, color: C.muted, fontSize: 8, position: "sticky", top: 0, background: C.bg }}>{h}</th>); })}
      </tr>
     </thead>
     <tbody>
      {withX.annualRows.map(function(row, i) { return (
       <tr key={i} style={{ background: row.isPast ? "#E8F5E920" : i % 2 === 0 ? C.surface : "transparent" }}>
        <td style={{ padding: "1.5px 3px", fontWeight: 600, color: row.isPast ? "#2E7D32" : C.sub, fontSize: 8.5 }}>{row.yr}{row.isPast ? " ✓" : ""}</td>
        <td style={{ padding: "1.5px 3px", textAlign: "right", fontSize: 8.5 }}>{fmtMoney(row.annPmt)}</td>
        <td style={{ padding: "1.5px 3px", textAlign: "right", color: C.blue, fontWeight: 600, fontSize: 8.5 }}>{fmtMoney(row.annPrin)}</td>
        <td style={{ padding: "1.5px 3px", textAlign: "right", color: C.orange, fontSize: 8.5 }}>{fmtMoney(row.annInt)}</td>
        <td style={{ padding: "1.5px 3px", textAlign: "right", color: row.endBal < 1 ? C.green : C.muted, fontWeight: row.endBal < 1 ? 700 : 400, fontSize: 8.5 }}>{row.endBal < 1 ? "✓ 清" : fmtMoney(row.endBal)}</td>
       </tr>); })}
     </tbody>
        </table></div></div>);
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
    // Without depreciation
    const taxableNoShield = annualCF;
    const taxNoShield = Math.max(0, taxableNoShield * tRate);
    const afterTaxNoShield = annualCF - taxNoShield;
    // With depreciation
    const taxableWithShield = annualCF - annualDep;
    const taxWithShield = Math.max(0, taxableWithShield * tRate);
    const afterTaxWithShield = annualCF - taxWithShield;
    const cocNoShield = tci > 0 ? afterTaxNoShield / tci : 0;
    const cocWithShield = tci > 0 ? afterTaxWithShield / tci : 0;
    const cocBoost = cocWithShield - cocNoShield;
    // Waterfall for tax shield flow
    const shieldH = 130;
    const maxWf = Math.max(Math.abs(annualCF), annualDep, 1) * 1.2;
    const wfItems = [
      { name: "净CF", val: annualCF, color: C.green },
      { name: "折旧抵扣", val: -annualDep, color: C.orange },
      { name: "应税收入", val: taxableWithShield, color: taxableWithShield <= 0 ? C.green : C.blue },
      { name: "×税率" + (tRate*100).toFixed(0) + "%", val: -taxWithShield, color: C.red },
      { name: "税后CF", val: afterTaxWithShield, color: C.green },
    ];
    return (
      <div style={overlay}>
        <div style={mBox}>
     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <div>
       <div style={{ fontSize: 14, fontWeight: 700, color: C.orange }}>折旧税盾</div>
       <div style={{ fontSize: 8, color: C.muted }}>Depreciation Tax Shield · 纸面亏损 = 真实省税</div></div>
      <button onClick={function() { setModal(null); }} style={{ background: C.inset, border: "none", borderRadius: 5, color: C.sub, fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
     </div>
  {/* Interactive sliders */}
     <div style={{ background: C.inset, borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
       <span style={{ fontSize: 9, color: C.sub, fontWeight: 600, flexShrink: 0, width: 50 }}>边际税率</span>
       <input type="range" min={10} max={50} step={1} value={parseInt(taxRate)||24} onChange={function(e) { setTaxRate(e.target.value); }} style={{ flex: 1, accentColor: C.orange, cursor: "pointer", height: 10 }} />
       <span style={{ fontSize: 14, fontWeight: 800, color: C.orange, minWidth: 36, textAlign: "right" }}>{taxRate}%</span></div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
       <span style={{ fontSize: 9, color: C.sub, fontWeight: 600, flexShrink: 0, width: 50 }}>土地占比</span>
       <input type="range" min={5} max={50} step={5} value={parseInt(landPct)||20} onChange={function(e) { setLandPct(e.target.value); }} style={{ flex: 1, accentColor: "#8D6E63", cursor: "pointer", height: 10 }} />
       <span style={{ fontSize: 14, fontWeight: 800, color: "#8D6E63", minWidth: 36, textAlign: "right" }}>{landPct}%</span></div></div>
  {/* Cost basis bar */}
     <div style={{ display: "flex", height: 18, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ width: (land*100) + "%", background: "#8D6E63", display: "flex", alignItems: "center", justifyContent: "center" }}>
       <span style={{ fontSize: 8, color: "#fff", fontWeight: 700 }}>土地 {fmtMoney(saleVal*land)}</span></div>
      <div style={{ flex: 1, background: C.orange + "35", display: "flex", alignItems: "center", justifyContent: "center" }}>
       <span style={{ fontSize: 8, color: C.orange, fontWeight: 700 }}>建筑 {fmtMoney(buildingVal)} ÷ 27.5年 = {fmtMoney(annualDep)}/年</span></div></div>
  {/* Tax shield waterfall */}
     <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, marginBottom: 3 }}>税盾计算过程</div>
     <div style={{ background: "#FDFCFA", borderRadius: 6, border: "1px solid " + C.border, padding: "4px 2px 0", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: shieldH }}>
       {wfItems.map(function(item, idx) {
        var absVal = Math.abs(item.val);
        var barHeight = maxWf > 0 ? Math.max(4, (absVal / maxWf) * (shieldH - 30)) : 4;
        var isNeg = item.val < 0;
        return (
         <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: shieldH, justifyContent: "flex-end", minWidth: 0 }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: item.color, marginBottom: 2, whiteSpace: "nowrap" }}>{isNeg ? "-" : ""}{fmtMoney(absVal)}</div>
          <div style={{ width: "80%", height: barHeight, background: item.color + "25", border: "1.5px solid " + item.color + "50", borderRadius: 3 }}></div>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: item.color, marginTop: 6, textAlign: "center", lineHeight: 1.1 }}>{item.name}</div></div>);
       })}</div>
      <div style={{ textAlign: "center", fontSize: 7, color: C.muted, padding: "3px 0 2px" }}>
       净CF − 折旧 = 应税收入 × 税率 = 实际税额 → 税后现金流</div></div>
  {/* Before vs After comparison */}
     <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, marginBottom: 3 }}>有无税盾对比</div>
     <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
      <div style={{ flex: 1, background: C.red + "08", border: "1px solid " + C.red + "20", borderRadius: 8, padding: "8px 6px" }}>
       <div style={{ fontSize: 8, color: C.red, fontWeight: 600, marginBottom: 4 }}>❌ 无折旧</div>
       <div style={{ fontSize: 7, color: C.muted }}>应税收入</div>
       <div style={{ fontSize: 11, fontWeight: 800, color: C.text }}>{fmtMoney(taxableNoShield)}</div>
       <div style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>缴税额</div>
       <div style={{ fontSize: 11, fontWeight: 800, color: C.red }}>{fmtMoney(taxNoShield)}</div>
       <div style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>税后CF</div>
       <div style={{ fontSize: 11, fontWeight: 800, color: C.text }}>{fmtMoney(afterTaxNoShield)}</div>
       <div style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>税后CoC</div>
       <div style={{ fontSize: 11, fontWeight: 800, color: cocNoShield >= 0.08 ? C.green : C.orange }}>{fmtPct(cocNoShield*100)}</div></div>
      <div style={{ display: "flex", alignItems: "center", fontSize: 16, color: C.green }}>→</div>
      <div style={{ flex: 1, background: C.green + "08", border: "1px solid " + C.green + "20", borderRadius: 8, padding: "8px 6px" }}>
       <div style={{ fontSize: 8, color: C.green, fontWeight: 600, marginBottom: 4 }}>✅ 有折旧</div>
       <div style={{ fontSize: 7, color: C.muted }}>应税收入</div>
       <div style={{ fontSize: 11, fontWeight: 800, color: taxableWithShield <= 0 ? C.green : C.text }}>{taxableWithShield <= 0 ? "纸面亏损!" : fmtMoney(taxableWithShield)}</div>
       <div style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>缴税额</div>
       <div style={{ fontSize: 11, fontWeight: 800, color: C.green }}>{taxWithShield <= 0 ? "$0 ✓" : fmtMoney(taxWithShield)}</div>
       <div style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>税后CF</div>
       <div style={{ fontSize: 11, fontWeight: 800, color: C.green }}>{fmtMoney(afterTaxWithShield)}</div>
       <div style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>税后CoC</div>
       <div style={{ fontSize: 11, fontWeight: 800, color: cocWithShield >= 0.08 ? C.green : C.orange }}>{fmtPct(cocWithShield*100)}</div></div></div>
  {/* Boost summary */}
     <div style={{ background: C.green + "10", border: "1px solid " + C.green + "25", borderRadius: 8, padding: "6px 10px", marginBottom: 6, textAlign: "center" }}>
      <div style={{ fontSize: 8, color: C.green, fontWeight: 600 }}>税盾每年为你省下</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>{fmtMoney(annualSaving)}</div>
      <div style={{ fontSize: 8, color: C.muted }}>CoC提升 <b style={{ color: C.green }}>+{fmtPct(cocBoost*100)}</b> · 等效月收入 <b style={{ color: C.green }}>+{fmtMoney(annualSaving/12)}/月</b></div>
      {taxableWithShield <= 0 && <div style={{ fontSize: 8, fontWeight: 700, color: C.green, marginTop: 2 }}>纸面亏损 {fmtMoney(Math.abs(taxableWithShield))} 还可抵扣其他收入!</div>}</div>
     <div style={{ fontSize: 7, color: C.muted, lineHeight: 1.5 }}>
      住宅租赁物业按27.5年直线法折旧建筑部分(土地不折旧)。折旧是"纸面亏损"——你没有真实支出，但IRS允许你从应税收入中扣除。当应税收入变为负数时，多余的亏损可以抵扣W2工资等其他收入(需满足MAGI≤$150K或RE Professional身份)。卖出时需缴回折旧税(§1250 Recapture)，税率25%。</div></div>
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
    const cashRecovered = Math.min(cashOutRaw, totalCashIn);
    const cashLeft = Math.max(0, totalCashIn - cashOutRaw);
    const recoveryPct = totalCashIn > 0 ? cashRecovered / totalCashIn : 0;
    const refiMonthly = refiLoan > 0 ? refiLoan * (rRate/100/12) / (1 - Math.pow(1 + rRate/100/12, -(parseFloat(loanYrs)||30)*12)) : 0;
    const refiNOI = noi;
    const refiCF = refiNOI / 12 - refiMonthly;
    const refiDSCR = refiMonthly > 0 ? (refiNOI / 12) / refiMonthly : 0;
    const infiniteCoC = cashLeft <= 0;
    const refiCoC = !infiniteCoC && cashLeft > 0 ? (refiCF * 12) / cashLeft : 0;
    return (
      <div style={overlay}>
        <div style={mBox}>
     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#7B5EA7" }}>BRRRR 策略分析</span>
      <button onClick={function() { setModal(null); }} style={{ background: C.inset, border: "none", borderRadius: 5, color: C.sub, fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
     </div>
     <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
      <NumInp label="装修预算" val={renoAmt} setVal={setRenoAmt} prefix="$" money style={{ flex: 1 }} />
      <NumInp label="ARV估值" val={arv || String(arvVal)} setVal={setArv} prefix="$" money style={{ flex: 1 }} />
      <NumInp label="Refi LTV%" val={refiLtv} setVal={setRefiLtv} suffix="%" style={{ flex: 1 }} />
      <NumInp label="Refi利率%" val={refiRate || String(rRate)} setVal={setRefiRate} suffix="%" style={{ flex: 1 }} /></div>
     <div style={{ display: "flex", gap: 2, marginBottom: 6, alignItems: "stretch" }}>
      {[
       ["B", "Buy", fmtMoney(buyPrice), C.blue],
       ["R", "Rehab", fmtMoney(reno), C.orange],
       ["R", "Rent", fmtMoney(computedRent) + "/月", C.green],
       ["R", "Refi", fmtMoney(refiLoan), "#7B5EA7"],
       ["R", "Repeat", infiniteCoC ? "∞ CoC" : fmtPct(refiCoC*100), C.accent],
      ].map(function(item, idx) { return (
       <div key={idx} style={{ flex: 1, background: item[3] + "10", border: "1px solid " + item[3] + "25", borderRadius: 6, padding: "4px 2px", textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: item[3], lineHeight: 1 }}>{item[0]}</div>
        <div style={{ fontSize: 7, color: item[3], fontWeight: 600, marginTop: 1 }}>{item[1]}</div>
        <div style={{ fontSize: 9, fontWeight: 800, color: item[3], marginTop: 2 }}>{item[2]}</div></div>); })}
     </div>
     <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 2 }}>
       <span style={{ color: C.muted }}>现金回收率</span>
       <span style={{ fontWeight: 800, color: recoveryPct >= 1 ? C.green : recoveryPct >= 0.7 ? C.orange : C.red }}>{(recoveryPct*100).toFixed(0)}%</span></div>
      <div style={{ height: 16, background: C.border + "40", borderRadius: 4, overflow: "hidden", position: "relative" }}>
       <div style={{ height: "100%", width: Math.min(recoveryPct*100, 100) + "%", background: recoveryPct >= 1 ? C.green + "60" : recoveryPct >= 0.7 ? C.orange + "60" : C.red + "60", borderRadius: 4 }}></div>
       <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: C.text }}>投入 {fmtMoney(totalCashIn)} → 回收 {fmtMoney(cashRecovered)}</span></div></div>
     </div>
     <div style={{ background: C.inset, borderRadius: 6, padding: "6px 8px", marginBottom: 6 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, marginBottom: 4 }}>Refi 前后对比</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
       <thead>
        <tr style={{ borderBottom: "1px solid " + C.border }}>
         {["", "原始贷款", "Refi后"].map(function(h, i) { return (
          <th key={i} style={{ padding: "2px 4px", textAlign: i === 0 ? "left" : "right", fontWeight: 600, color: C.muted, fontSize: 8 }}>{h}</th>); })}
        </tr>
       </thead>
       <tbody>
        {[
         ["贷款额", fmtMoney(origLoan), fmtMoney(refiLoan)],
         ["月供", fmtMoney(totalMonthly), fmtMoney(refiMonthly)],
         ["月净CF", fmtMoney(netCF/12), fmtMoney(refiCF)],
         ["DSCR", dscr0 > 0 ? dscr0.toFixed(2) + "x" : "—", refiDSCR > 0 ? refiDSCR.toFixed(2) + "x" : "—"],
         ["投入现金", fmtMoney(tci), infiniteCoC ? "$0 ✓" : fmtMoney(cashLeft)],
         ["CoC", fmtPct(coc*100), infiniteCoC ? "∞ ✓" : fmtPct(refiCoC*100)],
        ].map(function(row, i) { return (
         <tr key={i} style={{ borderBottom: "0.5px solid " + C.border + "60" }}>
          <td style={{ padding: "3px 4px", fontWeight: 600, color: C.sub, fontSize: 8.5 }}>{row[0]}</td>
          <td style={{ padding: "3px 4px", textAlign: "right", color: C.muted, fontSize: 8.5 }}>{row[1]}</td>
          <td style={{ padding: "3px 4px", textAlign: "right", fontWeight: 700, color: C.text, fontSize: 8.5 }}>{row[2]}</td>
         </tr>); })}
       </tbody>
      </table></div>
     <div style={{ fontSize: 7, color: C.muted, lineHeight: 1.4 }}>
      BRRRR = Buy · Rehab · Rent · Refinance · Repeat。低价买入→翻新增值→按ARV再融资取出现金→买下一套。现金回收率≥100% = "无限回报"。</div></div>
      </div>);
  })()}
  {modal === "homeReport" && (() => {
    var overlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
    var closeModal = function() { setModal(null); setRptStep(0); };
    // Step 0: Setup
    if (rptStep === 0) {
      var buyYr0 = alreadyBought && purchaseYear ? parseInt(purchaseYear)||2026 : 2026;
      var yrOptions = []; for (var yi = 2026; yi <= buyYr0 + 50; yi++) yrOptions.push(yi);
      return <div style={overlay} onClick={closeModal}>
        <div onClick={function(e){e.stopPropagation();}} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", maxWidth: 340, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
         <div style={{ fontSize: 14, fontWeight: 800, color: "#1565C0", marginBottom: 4 }}>📊 报告设置</div>
         <div style={{ fontSize: 8, color: "#90A4AE", marginBottom: 12 }}>选择报告基准年份和还贷方案</div>
         <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#5D4037", marginBottom: 4 }}>📅 预测目标年份</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
           {[5,10,15,20,25,30].map(function(n) { var yr = 2026 + n; return <button key={yr} onClick={function(){setRptYear(String(yr));}} style={{ padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 700, border: parseInt(rptYear) === yr ? "2px solid #1565C0" : "1px solid #E0E0E0", background: parseInt(rptYear) === yr ? "#E3F2FD" : "#fff", color: parseInt(rptYear) === yr ? "#1565C0" : "#5D4037" }}>{yr}<span style={{ fontSize: 7, color: "#90A4AE" }}> ({n}yr)</span></button>; })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
           <span style={{ fontSize: 8, color: "#78909C" }}>自定义:</span>
           <select value={rptYear} onChange={function(e){setRptYear(e.target.value);}} style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid #E0E0E0", fontSize: 10, fontWeight: 600, fontFamily: "inherit", color: "#1565C0", cursor: "pointer" }}>
            {yrOptions.map(function(y){return <option key={y} value={String(y)}>{y}年</option>;})}
           </select>
           <span style={{ fontSize: 8, color: "#90A4AE" }}>距今{parseInt(rptYear)-2026}年</span>
          </div>
         </div>
         {homeHasLoan && <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#5D4037", marginBottom: 4 }}>⚡ 提前还贷方案</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
           {[0,500,1000,1500,2000,3000,5000].map(function(v) { return <button key={v} onClick={function(){setRptPrepay(v);}} style={{ padding: "5px 8px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 9, fontWeight: 600, border: rptPrepay === v ? "2px solid " + (v > 0 ? "#E53935" : "#78909C") : "1px solid #E0E0E0", background: rptPrepay === v ? (v > 0 ? "#FFEBEE" : "#F5F5F5") : "#fff", color: rptPrepay === v ? (v > 0 ? "#E53935" : "#5D4037") : "#78909C" }}>{v === 0 ? "不提前" : "$"+v+"/月"}</button>; })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
           <span style={{ fontSize: 8, color: "#78909C" }}>自定义:</span>
           <input type="range" min={0} max={5000} step={100} value={rptPrepay} onChange={function(e){setRptPrepay(parseInt(e.target.value));}} style={{ flex: 1, accentColor: rptPrepay > 0 ? "#E53935" : "#BDBDBD", cursor: "pointer" }} />
           <span style={{ fontSize: 10, fontWeight: 800, color: rptPrepay > 0 ? "#E53935" : "#78909C" }}>{rptPrepay > 0 ? "$"+rptPrepay+"/月" : "无"}</span>
          </div>
         </div>}
         <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#5D4037", marginBottom: 4 }}>🎨 报告风格</div>
          <div style={{ display: "flex", gap: 6 }}>
           {[["list","📋 详细列表","传统表格"],["grid","📊 卡片看板","2×2可视化"]].map(function(s) { return <button key={s[0]} onClick={function(){setRptStyle(s[0]);}} style={{ flex: 1, padding: "8px 6px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", border: rptStyle === s[0] ? "2px solid #1565C0" : "1px solid #E0E0E0", background: rptStyle === s[0] ? "#E3F2FD" : "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: rptStyle === s[0] ? "#1565C0" : "#5D4037" }}>{s[1]}</div>
            <div style={{ fontSize: 7, color: "#90A4AE" }}>{s[2]}</div></button>; })}
          </div>
         </div>
         <button onClick={function(){setRptStep(1);}} style={{ width: "100%", padding: "10px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: "linear-gradient(135deg, #1565C0, #1976D2)", border: "none", color: "#fff", boxShadow: "0 2px 8px rgba(21,101,192,0.3)" }}>生成报告 →</button>
         <button onClick={closeModal} style={{ width: "100%", padding: "6px 0", marginTop: 6, borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 9, fontWeight: 600, background: "transparent", border: "none", color: "#90A4AE" }}>取消</button>
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
    var tgtBal = homeHasLoan && hLoan > 0 && totalYrs < parseInt(homeLoanYrs)||30 ? loanBal(hLoan, parseFloat(homeAnnRate)||6.75, parseInt(homeLoanYrs)||30, totalYrs) : 0;
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
    var rSec = function(title, color) { return { fontSize: 10, fontWeight: 800, color: color, marginTop: 8, marginBottom: 4, paddingBottom: 2, borderBottom: "1px solid " + color + "30" }; };
    var rRow = function(label, val, color) { return <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span style={{ fontSize: 9, color: "#5D4037" }}>{label}</span><span style={{ fontSize: 9, fontWeight: 700, color: color || "#3E2723" }}>{val}</span></div>; };
    var rNote = function(text) { return <div style={{ fontSize: 7, color: "#90A4AE", marginTop: -1, marginBottom: 2 }}>{text}</div>; };
    return <div style={overlay} onClick={closeModal}>
      <div onClick={function(e){e.stopPropagation();}} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", maxWidth: 400, width: "100%", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1565C0" }}>📊 自住房分析报告</div>
        <div style={{ display: "flex", gap: 4 }}>
         <button onClick={function(){setRptStep(0);}} style={{ background: "#f5f5f5", border: "none", borderRadius: 5, color: "#1565C0", fontSize: 8, cursor: "pointer", padding: "2px 6px", fontFamily: "inherit", fontWeight: 600 }}>← 重选</button>
         <button onClick={closeModal} style={{ background: "#f5f5f5", border: "none", borderRadius: 5, color: "#78909C", fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
       </div>
       <div style={{ fontSize: 7, color: "#90A4AE", marginBottom: 6 }}>生成 {new Date().toLocaleDateString("zh-CN")} · 目标{tgtYr}年(距今{yrsFromNow}年) · 升值{appR}%/年{rptPrepay > 0 ? " · 提前还贷$"+rptPrepay+"/月" : ""}</div>

       {rptStyle === "grid" ? <>
       {/* === GRID STYLE: 2x2 cards === */}
       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
        {/* Card 1: Property & Appreciation */}
        <div style={{ background: "linear-gradient(135deg, #FFF8E1, #FFFDE7)", borderRadius: 12, padding: "10px 10px 8px", border: "1px solid #F9A82530", position: "relative", overflow: "hidden" }}>
         <div style={{ position: "absolute", top: -8, right: -8, fontSize: 40, opacity: 0.08 }}>🏠</div>
         <div style={{ fontSize: 8, fontWeight: 800, color: "#5D4037", marginBottom: 6 }}>🏠 物业增值</div>
         <div style={{ fontSize: 7, color: "#78909C" }}>买入价</div>
         <div style={{ fontSize: 14, fontWeight: 800, color: "#5D4037", marginBottom: 2 }}>{fmtMoney(hSP)}</div>
         <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#E0E0E0" }}>
           <div style={{ width: Math.min(100, totalAppreciation/hSP*100) + "%", height: 4, borderRadius: 2, background: "linear-gradient(90deg, #43A047, #1B5E20)" }}></div></div>
          <span style={{ fontSize: 7, fontWeight: 700, color: "#1B5E20" }}>+{fmtPct(totalAppreciation/hSP*100)}</span>
         </div>
         <div style={{ fontSize: 7, color: "#78909C" }}>{tgtYr}年市值</div>
         <div style={{ fontSize: 16, fontWeight: 800, color: "#1B5E20" }}>{fmtMoney(tgtVal)}</div>
         <div style={{ fontSize: 6, color: "#90A4AE", marginTop: 2 }}>{propLabel} · {hOwn*100}%持股 · 增{fmtMoney(totalAppreciation)}</div>
         {breakEvenYr && <div style={{ fontSize: 6, color: "#2E7D32", marginTop: 2, fontWeight: 600 }}>📍 {breakEvenYr}年回本(持有{breakEvenYr-buyYr}年)</div>}
        </div>

        {/* Card 2: Loan & Equity */}
        <div style={{ background: homeHasLoan ? "linear-gradient(135deg, #E3F2FD, #E8EAF6)" : "linear-gradient(135deg, #E8F5E9, #C8E6C9)", borderRadius: 12, padding: "10px 10px 8px", border: "1px solid " + (homeHasLoan ? "#1565C020" : "#2E7D3220"), position: "relative", overflow: "hidden" }}>
         <div style={{ position: "absolute", top: -8, right: -8, fontSize: 40, opacity: 0.08 }}>{homeHasLoan ? "💳" : "✅"}</div>
         <div style={{ fontSize: 8, fontWeight: 800, color: homeHasLoan ? "#1565C0" : "#2E7D32", marginBottom: 6 }}>{homeHasLoan ? "💳 贷款 & 净资产" : "✅ 全款持有"}</div>
         {homeHasLoan ? <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
           <div><div style={{ fontSize: 6, color: "#78909C" }}>贷款额</div><div style={{ fontSize: 10, fontWeight: 800, color: "#1565C0" }}>{fmtMoney(hLoan)}</div></div>
           <div style={{ textAlign: "right" }}><div style={{ fontSize: 6, color: "#78909C" }}>月供</div><div style={{ fontSize: 10, fontWeight: 800, color: "#1565C0" }}>{fmtMoney(hPI)}</div></div>
          </div>
          <div style={{ fontSize: 6, color: "#78909C" }}>{tgtYr}年余额</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: tgtBal > 0.01 ? "#D32F2F" : "#2E7D32" }}>{tgtBal > 0.01 ? fmtMoney(tgtBal) : "$0 ✓"}</div>
          <div style={{ fontSize: 6, color: "#78909C", marginTop: 3 }}>累计利息</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#E65100" }}>{fmtMoney(totalIntPaid)}<span style={{ fontSize: 6, color: "#90A4AE" }}> / 本金{fmtMoney(totalPrinPaid)}</span></div>
         </> : <>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#2E7D32", marginBottom: 2 }}>无房贷</div>
          <div style={{ fontSize: 8, color: "#2E7D32" }}>全款购入 · 零负债</div>
         </>}
         <div style={{ fontSize: 6, color: "#1565C0", marginTop: 3, fontWeight: 700 }}>净资产 {fmtMoney(tgtEquity * hOwn)}</div>
        </div>

        {/* Card 3: ROI */}
        <div style={{ background: "linear-gradient(135deg, #F3E5F5, #EDE7F6)", borderRadius: 12, padding: "10px 10px 8px", border: "1px solid #6A1B9A20", position: "relative", overflow: "hidden" }}>
         <div style={{ position: "absolute", top: -8, right: -8, fontSize: 40, opacity: 0.08 }}>📊</div>
         <div style={{ fontSize: 8, fontWeight: 800, color: "#6A1B9A", marginBottom: 6 }}>📊 投资回报</div>
         <div style={{ fontSize: 6, color: "#78909C" }}>总投入 TCI</div>
         <div style={{ fontSize: 10, fontWeight: 800, color: "#5D4037", marginBottom: 4 }}>{fmtMoney(tci)}</div>
         <div style={{ display: "flex", gap: 6 }}>
          <div><div style={{ fontSize: 6, color: "#78909C" }}>ROI</div><div style={{ fontSize: 16, fontWeight: 800, color: roi >= 0 ? "#2E7D32" : "#D32F2F" }}>{fmtPct(roi*100)}</div></div>
          <div><div style={{ fontSize: 6, color: "#78909C" }}>年化</div><div style={{ fontSize: 16, fontWeight: 800, color: "#6A1B9A" }}>{fmtPct(annualizedRoi*100)}</div></div>
         </div>
         <div style={{ fontSize: 6, color: "#90A4AE", marginTop: 4 }}>{totalYrs}年 · 净赚{fmtMoney(tgtEquity*hOwn - tci)}</div>
         {effectiveMoCost < 0 && <div style={{ fontSize: 6, color: "#2E7D32", fontWeight: 700, marginTop: 1 }}>🎉 增值覆盖全部持有成本!</div>}
        </div>

        {/* Card 4: Holding Cost OR Prepay */}
        {rptPrepay > 0 && homeHasLoan ? (
        <div style={{ background: "linear-gradient(135deg, #FFEBEE, #FCE4EC)", borderRadius: 12, padding: "10px 10px 8px", border: "1px solid #E5393520", position: "relative", overflow: "hidden" }}>
         <div style={{ position: "absolute", top: -8, right: -8, fontSize: 40, opacity: 0.08 }}>⚡</div>
         <div style={{ fontSize: 8, fontWeight: 800, color: "#E53935", marginBottom: 6 }}>⚡ 提前还贷</div>
         <div style={{ fontSize: 7, color: "#78909C" }}>额外${rptPrepay}/月</div>
         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, marginTop: 2 }}>
          <div><div style={{ fontSize: 6, color: "#78909C" }}>节省时间</div><div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D32" }}>{moSaved > 0 ? moToYrMo(moSaved) : "—"}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 6, color: "#78909C" }}>节省利息</div><div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D32" }}>{intSaved > 0 ? fmtMoney(intSaved) : "—"}</div></div>
         </div>
         <div style={{ display: "flex", gap: 4, fontSize: 6 }}>
          <span style={{ color: "#78909C" }}>原{moToYrMo(baseMo)}</span>
          <span style={{ color: "#E53935" }}>→</span>
          <span style={{ color: "#1565C0", fontWeight: 700 }}>{moToYrMo(prepMo)}</span>
         </div>
         {intBase > 0 && <div style={{ fontSize: 6, color: "#2E7D32", fontWeight: 600, marginTop: 2 }}>节省{fmtPct(intSaved/intBase*100)}利息</div>}
        </div>
        ) : (
        <div style={{ background: "linear-gradient(135deg, #FFF3E0, #FBE9E7)", borderRadius: 12, padding: "10px 10px 8px", border: "1px solid #E6510020", position: "relative", overflow: "hidden" }}>
         <div style={{ position: "absolute", top: -8, right: -8, fontSize: 40, opacity: 0.08 }}>🏷</div>
         <div style={{ fontSize: 8, fontWeight: 800, color: "#E65100", marginBottom: 6 }}>🏷 持有成本</div>
         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <div><div style={{ fontSize: 6, color: "#78909C" }}>月供P&I</div><div style={{ fontSize: 10, fontWeight: 800, color: "#1565C0" }}>{homeHasLoan ? fmtMoney(hPI) : "$0"}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 6, color: "#78909C" }}>月固定</div><div style={{ fontSize: 10, fontWeight: 800, color: "#6A1B9A" }}>{fmtMoney(fixedNow)}</div></div>
         </div>
         <div style={{ fontSize: 6, color: "#78909C" }}>{totalYrs}年累计</div>
         <div style={{ fontSize: 14, fontWeight: 800, color: "#BF360C" }}>{fmtMoney(totalHoldingCost)}</div>
         {yrsFromNow > 0 && <div style={{ fontSize: 6, color: "#E65100", marginTop: 2 }}>{tgtYr}年月固定预测: {fmtMoney(fixedTgt)}</div>}
         {effectiveMoCost >= 0 ? <div style={{ fontSize: 6, color: "#78909C", marginTop: 1 }}>等效月成本(扣增值): {fmtMoney(effectiveMoCost)}</div>
          : <div style={{ fontSize: 6, color: "#2E7D32", fontWeight: 600, marginTop: 1 }}>增值 &gt; 成本 · 等效免费住!</div>}
        </div>
        )}
       </div>
       </> : <>
       {/* === LIST STYLE === */}
       <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
        <div style={{ flex: 1, background: "#FFF8E1", borderRadius: 8, padding: "4px 6px", textAlign: "center" }}>
         <div style={{ fontSize: 7, color: "#5D4037" }}>🏠{propLabel}</div>
         <div style={{ fontSize: 11, fontWeight: 800, color: "#5D4037" }}>{fmtMoney(hSP)}</div></div>
        <div style={{ flex: 1, background: "#E8F5E9", borderRadius: 8, padding: "4px 6px", textAlign: "center" }}>
         <div style={{ fontSize: 7, color: "#1B5E20" }}>📈{tgtYr}年市值</div>
         <div style={{ fontSize: 11, fontWeight: 800, color: "#1B5E20" }}>{fmtMoney(tgtVal)}</div></div>
        <div style={{ flex: 1, background: "#E3F2FD", borderRadius: 8, padding: "4px 6px", textAlign: "center" }}>
         <div style={{ fontSize: 7, color: "#1565C0" }}>💰净资产</div>
         <div style={{ fontSize: 11, fontWeight: 800, color: "#1565C0" }}>{fmtMoney(tgtEquity * hOwn)}</div></div>
       </div>

       <div style={rSec("🏠 物业概况", "#5D4037")}>物业概况</div>
       {rRow("买入价 → " + tgtYr + "年", fmtMoney(hSP) + " → " + fmtMoney(tgtVal), "#1B5E20")}
       {rNote(fmtMoney(hSP) + " × (1+" + appR + "%)^" + totalYrs + " · 增值" + fmtMoney(totalAppreciation) + " (+" + fmtPct(totalAppreciation/hSP*100) + ")")}
       {rRow("持股 " + (hOwn*100) + "% · TCI", fmtMoney(tci))}
       {heldYrs > 0 && rRow("购入", buyYr + "年 · 已持有" + heldYrs + "年")}
       {rRow("当前市值(2026)", fmtMoney(curVal))}

       {homeHasLoan ? <>
        <div style={rSec("💳 贷款详情", "#1565C0")}>贷款</div>
        {rRow("贷款", fmtMoney(hLoan) + " @ " + (parseFloat(homeAnnRate)||6.75) + "% × " + (parseInt(homeLoanYrs)||30) + "年")}
        {rRow("月供 P&I", fmtMoney(hPI), "#1565C0")}
        {rRow("当前余额(2026)", fmtMoney(curBal), "#D32F2F")}
        {rRow(tgtYr + "年余额", fmtMoney(tgtBal), tgtBal > 0.01 ? "#D32F2F" : "#2E7D32")}
        {tgtBal < 0.01 && rNote("🎉 " + tgtYr + "年已还清贷款!")}
        {rRow("累计已付本金", fmtMoney(totalPrinPaid))}
        {rRow("累计已付利息", fmtMoney(totalIntPaid), "#E65100")}
        {rNote("利息占比: " + (totalPrinPaid + totalIntPaid > 0 ? fmtPct(totalIntPaid/(totalPrinPaid+totalIntPaid)*100) : "0%") + " · 本金占比: " + (totalPrinPaid + totalIntPaid > 0 ? fmtPct(totalPrinPaid/(totalPrinPaid+totalIntPaid)*100) : "0%"))}
       </> : <>
        <div style={rSec("✅ 全款购入", "#2E7D32")}>全款</div>
        {rRow("状态", "无房贷 · 全款持有", "#2E7D32")}
       </>}

       <div style={rSec("📊 投资回报", "#6A1B9A")}>回报</div>
       {rRow("总投入 TCI", fmtMoney(tci))}
       {rRow(tgtYr + "年净资产", fmtMoney(tgtEquity * hOwn), "#1B5E20")}
       {rRow("投资回报率 ROI", fmtPct(roi * 100), roi >= 0 ? "#2E7D32" : "#D32F2F")}
       {rNote("(" + fmtMoney(tgtEquity * hOwn) + " - " + fmtMoney(tci) + ") ÷ " + fmtMoney(tci))}
       {totalYrs > 0 && rRow("年化回报率", fmtPct(annualizedRoi * 100), "#6A1B9A")}
       {breakEvenYr && rRow("回本年份", breakEvenYr + "年 (持有" + (breakEvenYr - buyYr) + "年)", "#2E7D32")}
       {rNote("净资产 ≥ 总投入TCI的时间点")}

       <div style={rSec("🏷 持有成本", "#E65100")}>成本</div>
       {rRow("月固定(当前)", fmtMoney(fixedNow), "#6A1B9A")}
       {yrsFromNow > 0 && rRow("月固定(" + tgtYr + "年预测)", fmtMoney(fixedTgt), "#E65100")}
       {rRow("月总支出(当前)", fmtMoney(hPI + fixedNow), "#BF360C")}
       {rRow(totalYrs + "年累计总持有成本", fmtMoney(totalHoldingCost), "#BF360C")}
       {effectiveMoCost < 0 && rRow("等效月成本(扣增值)", fmtMoney(0) + " (增值>成本)", "#2E7D32")}
       {effectiveMoCost >= 0 && rRow("等效月成本(扣增值)", fmtMoney(effectiveMoCost), "#E65100")}
       {rNote("(总持有成本 - 房价增值) ÷ 总月数 · 负数=增值超过成本")}

       {rptPrepay > 0 && homeHasLoan && <>
        <div style={rSec("⚡ 提前还贷对比", "#E53935")}>提前还贷</div>
        {rRow("每月额外还贷", "$" + rptPrepay + "/月", "#E53935")}
        {rRow("原始还清", moToYrMo(baseMo) + " (" + (buyYr + Math.ceil(baseMo/12)) + "年)")}
        {rRow("提前还清", moToYrMo(prepMo) + " (" + (buyYr + Math.ceil(prepMo/12)) + "年)", "#1565C0")}
        {rRow("节省时间", moSaved > 0 ? moToYrMo(moSaved) : "—", "#2E7D32")}
        {rRow("节省利息", intSaved > 0 ? fmtMoney(intSaved) : "—", "#2E7D32")}
        {intBase > 0 && rNote("利息节省率: " + fmtPct(intSaved/intBase*100) + " · 原总利息" + fmtMoney(intBase) + " → " + fmtMoney(intPrep))}
        {rRow("每月多付$" + rptPrepay + "的回报", intSaved > 0 ? fmtMoney(intSaved / (rptPrepay * prepMo) * rptPrepay) + "/月等值" : "—", "#6A1B9A")}
       </>}
       </>}

       <div style={{ marginTop: 10, padding: "6px 8px", background: "#F5F5F5", borderRadius: 6, fontSize: 7, color: "#78909C", lineHeight: 1.5 }}>
        💡 本报告基于固定利率{parseFloat(homeAnnRate)||6.75}%、年升值{appR}%、年成本涨幅{costGrow}%假设。实际回报受市场波动、利率变化、维护费用等因素影响。本工具不构成投资建议，请结合专业人士评估。
       </div>
       <div style={{ fontSize: 6, color: "#BDBDBD", textAlign: "center", marginTop: 6 }}>© JMJ Invest LLC · 钱景 FIRE Calculator</div>
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
    for (var si = 10; si <= 50; si += 10) { var a = simFire(si, 0, 0); if (a && baseAge && a < baseAge) strategies.push({ l: "收入+" + si + "%", age: a, save: baseAge - a, c: "#1565C0" }); }
    for (var ss = 5; ss <= 25; ss += 5) { var a2 = simFire(0, ss, 0); if (a2 && baseAge && a2 < baseAge) strategies.push({ l: "储蓄率+" + ss + "%", age: a2, save: baseAge - a2, c: "#2E7D32" }); }
    for (var st = 10; st <= 30; st += 10) { var a3 = simFire(0, 0, st); if (a3 && baseAge && a3 < baseAge) strategies.push({ l: "目标-" + st + "%", age: a3, save: baseAge - a3, c: "#E65100" }); }
    strategies.sort(function(a,b) { return a.age - b.age; });
    return (
      <div style={overlay} onClick={() => { setModal(null); setScnInc(0); setScnSav(0); setScnTgt(0); }}>
        <div style={{ ...mBox, maxWidth: 420, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: C.green }}>🔮 FIRE 加速规划器</span>
      <button onClick={() => { setModal(null); setScnInc(0); setScnSav(0); setScnTgt(0); }} style={{ background: C.inset, border: "none", borderRadius: 5, color: C.sub, fontSize: 16, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
     </div>
     <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
      <div style={{ flex: 1, background: C.green+"10", borderRadius: 8, padding: "8px", textAlign: "center" }}>
       <div style={{ fontSize: 7, color: C.muted }}>当前预测</div>
       <div style={{ fontSize: 22, fontWeight: 800, color: baseAge ? C.green : C.red }}>{baseAge || "—"}<span style={{ fontSize: 10 }}>岁</span></div></div>
      {(scnInc > 0 || scnSav > 0 || scnTgt > 0) && <div style={{ display: "flex", alignItems: "center", fontSize: 16, color: C.muted }}>→</div>}
      {(scnInc > 0 || scnSav > 0 || scnTgt > 0) && <div style={{ flex: 1, background: adjAge && adjAge < (baseAge||99) ? "#E8F5E9" : C.accent+"10", borderRadius: 8, padding: "8px", textAlign: "center" }}>
       <div style={{ fontSize: 7, color: C.muted }}>调整后</div>
       <div style={{ fontSize: 22, fontWeight: 800, color: adjAge && adjAge < (baseAge||99) ? "#2E7D32" : C.accent }}>{adjAge || "—"}<span style={{ fontSize: 10 }}>岁</span></div>
       {saved > 0 && <div style={{ fontSize: 8, color: "#2E7D32", fontWeight: 700 }}>提前{saved}年 🎉</div>}
      </div>}</div>
     <div style={{ fontSize: 9, fontWeight: 700, color: C.text, marginBottom: 4 }}>📊 调整参数看影响</div>
     <div style={{ background: C.inset, borderRadius: 8, padding: "8px", marginBottom: 6 }}>
      <div style={{ marginBottom: 8 }}>
       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 8, color: C.sub }}>💰 收入提升</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: scnInc > 0 ? "#1565C0" : C.muted }}>{scnInc > 0 ? "+" + scnInc + "%" : "不变"} → {fmtMoney(adjInc)}/年</span></div>
       <input type="range" min={0} max={100} step={5} value={scnInc} onChange={function(e) { setScnInc(parseInt(e.target.value)); }} style={{ width: "100%", height: 12, accentColor: "#1565C0", cursor: "pointer" }} />
      </div>
      <div style={{ marginBottom: 8 }}>
       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 8, color: C.sub }}>📈 储蓄率提升</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: scnSav > 0 ? "#2E7D32" : C.muted }}>{scnSav > 0 ? "+" + scnSav + "%" : "不变"} → {adjSavR}% ({fmtMoney(adjAnnSav)}/年)</span></div>
       <input type="range" min={0} max={40} step={2} value={scnSav} onChange={function(e) { setScnSav(parseInt(e.target.value)); }} style={{ width: "100%", height: 12, accentColor: "#2E7D32", cursor: "pointer" }} />
      </div>
      <div>
       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 8, color: C.sub }}>🎯 降低月目标</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: scnTgt > 0 ? "#E65100" : C.muted }}>{scnTgt > 0 ? "-" + scnTgt + "%" : "不变"} → {fmtMoney(adjTgt)}/月</span></div>
       <input type="range" min={0} max={50} step={5} value={scnTgt} onChange={function(e) { setScnTgt(parseInt(e.target.value)); }} style={{ width: "100%", height: 12, accentColor: "#E65100", cursor: "pointer" }} />
      </div></div>
     {(scnInc > 0 || scnSav > 0 || scnTgt > 0) && <div style={{ background: "#E8F5E9", borderRadius: 6, padding: "6px 8px", marginBottom: 6, fontSize: 8, lineHeight: 1.8 }}>
      <div style={{ fontWeight: 700, fontSize: 9, color: "#2E7D32", marginBottom: 2 }}>📋 调整方案摘要</div>
      {scnInc > 0 && <div>收入从 <b>{fmtMoney(annInc)}</b> → <b>{fmtMoney(adjInc)}</b> (+{fmtMoney(adjInc-annInc)}/年)</div>}
      {scnSav > 0 && <div>储蓄率从 <b>{savR}%</b> → <b>{adjSavR}%</b> (年储蓄+{fmtMoney(adjAnnSav - annInc*savR/100)})</div>}
      {scnTgt > 0 && <div>月目标从 <b>{fmtMoney(tgtMo)}</b> → <b>{fmtMoney(adjTgt)}</b></div>}
      <div style={{ color: "#2E7D32", fontWeight: 700, marginTop: 2 }}>{saved > 0 ? "→ FIRE提前" + saved + "年，" + adjAge + "岁达成！" : adjAge ? adjAge + "岁达成FIRE" : "仍需更大调整"}</div></div>}
     <div style={{ fontSize: 9, fontWeight: 700, color: C.text, marginBottom: 4 }}>⚡ 快速策略对比</div>
     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, marginBottom: 6 }}>
      {strategies.slice(0, 8).map(function(s, i) { return (
       <div key={i} style={{ background: s.c + "08", border: "1px solid " + s.c + "20", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }} onClick={function() {
        if (s.l.includes("收入")) setScnInc(parseInt(s.l.match(/\d+/)[0]));
        else if (s.l.includes("储蓄率")) setScnSav(parseInt(s.l.match(/\d+/)[0]));
        else if (s.l.includes("目标")) setScnTgt(parseInt(s.l.match(/\d+/)[0]));
       }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: s.c }}>{s.l}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
         <span style={{ fontSize: 12, fontWeight: 800, color: s.c }}>{s.age}岁</span>
         <span style={{ fontSize: 7, color: "#2E7D32", fontWeight: 700 }}>早{s.save}年</span></div></div>
      ); })}</div>
     <div style={{ fontSize: 9, fontWeight: 700, color: C.text, marginBottom: 4 }}>💡 个性化建议</div>
     <div style={{ background: C.accent+"06", borderRadius: 6, padding: "6px 8px", fontSize: 8, lineHeight: 1.8, color: C.sub }}>
      {savR < 15 && <div>• 储蓄率{savR}%偏低，每增加5%储蓄率可提前约{strategies.find(function(s){return s.l==="储蓄率+5%";})?.save||2}年退休</div>}
      {savR >= 15 && savR < 30 && <div>• 储蓄率{savR}%中等，提升到25%+可显著加速FIRE</div>}
      {savR >= 30 && <div>• 储蓄率{savR}%优秀！保持纪律是关键</div>}
      {annInc < 80000 && <div>• 提升收入是最有力的杠杆 — 技能提升/副业/跳槽</div>}
      {annInc >= 80000 && annInc < 200000 && <div>• 收入良好，重点优化储蓄率和投资回报</div>}
      {!wantInvest && <div>• 考虑加入房地产投资，租金CF可加速被动收入积累</div>}
      {wantInvest && moRE2 < 0 && <div>• 投资房现金流为负，考虑提升租金或降低运营成本</div>}
      <div>• 坚持长期投资，复利效应在后期会越来越明显</div></div></div></div>);
  })()}</div>
);}
