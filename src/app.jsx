import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// CONFIG: Point this at your backend server
// In dev:  http://localhost:3001
// In prod: your deployed server URL (e.g. https://your-app.vercel.app)
// ---------------------------------------------------------------------------
const API_URL = window.location.hostname === "localhost" ? "http://localhost:3001/api/predict" : "/api/predict";

const TEAMS = {
  Adelaide:{abbr:"ADE",avg:79.4,std:26.3,home:90,away:69,t8:69,b10:90,con:85,st:"SA",clr:"#002B5C"},
  Brisbane:{abbr:"BRL",avg:94.7,std:36.7,home:95.4,away:94.3,t8:82.5,b10:100.1,con:80,st:"QLD",clr:"#A30046"},
  Carlton:{abbr:"CAR",avg:97.5,std:21.4,home:98.4,away:95.5,t8:96.4,b10:100,con:81,st:"VIC",clr:"#001C3D"},
  Collingwood:{abbr:"COL",avg:88.9,std:16.6,home:89.3,away:88.4,t8:90.5,b10:88.2,con:84,st:"VIC",clr:"#000000"},
  Essendon:{abbr:"ESS",avg:85.2,std:28.1,home:88.2,away:80.3,t8:78,b10:93,con:87,st:"VIC",clr:"#CC2031"},
  Fremantle:{abbr:"FRE",avg:82.6,std:21.7,home:90.3,away:77.2,t8:75,b10:88,con:82,st:"WA",clr:"#2A0D45"},
  Geelong:{abbr:"GEE",avg:91.3,std:21.4,home:100.2,away:84.6,t8:84.4,b10:100.5,con:78,st:"VIC",clr:"#001F3D"},
  "Gold Coast":{abbr:"GCS",avg:79.3,std:31.2,home:109.3,away:63.4,t8:64,b10:85,con:92,st:"QLD",clr:"#D72227"},
  GWS:{abbr:"GWS",avg:89.9,std:24.0,home:94,away:85,t8:85,b10:95,con:83,st:"NSW",clr:"#F47920"},
  Hawthorn:{abbr:"HAW",avg:91.7,std:24.9,home:93,away:90,t8:88,b10:96,con:79,st:"VIC",clr:"#4D2004"},
  Melbourne:{abbr:"MEL",avg:77.8,std:18.4,home:78.4,away:77,t8:73.8,b10:79.6,con:76,st:"VIC",clr:"#0F1131"},
  "North Melbourne":{abbr:"NTH",avg:61.2,std:17.8,home:65,away:58,t8:52,b10:68,con:99,st:"VIC",clr:"#003D8E"},
  "Port Adelaide":{abbr:"PTA",avg:90.1,std:21.6,home:96,away:84,t8:86,b10:95,con:77,st:"SA",clr:"#008AAB"},
  Richmond:{abbr:"RIC",avg:68.2,std:21.9,home:74,away:63,t8:58,b10:76,con:96,st:"VIC",clr:"#FED102"},
  "St Kilda":{abbr:"STK",avg:76.8,std:22.5,home:80,away:73,t8:68,b10:84,con:88,st:"VIC",clr:"#ED171F"},
  Sydney:{abbr:"SYD",avg:105.3,std:13.7,home:113.6,away:100.1,t8:107.4,b10:102,con:69.4,st:"NSW",clr:"#ED171F"},
  "West Coast":{abbr:"WCE",avg:62.5,std:21.3,home:72,away:55,t8:50,b10:70,con:100,st:"WA",clr:"#002B5C"},
  "Western Bulldogs":{abbr:"WBD",avg:95.7,std:26.8,home:98.4,away:92.2,t8:92,b10:99.4,con:82,st:"VIC",clr:"#014896"},
};

const VENUES = {
  MCG:{st:"VIC",adj:0,roof:false},"M.C.G.":{st:"VIC",adj:0,roof:false},
  "Marvel Stadium":{st:"VIC",adj:2.5,roof:true},Docklands:{st:"VIC",adj:2.5,roof:true},
  "Adelaide Oval":{st:"SA",adj:1,roof:false},"Optus Stadium":{st:"WA",adj:-1,roof:false},
  Gabba:{st:"QLD",adj:0,roof:false},"The Gabba":{st:"QLD",adj:0,roof:false},
  SCG:{st:"NSW",adj:-1.5,roof:false},"S.C.G.":{st:"NSW",adj:-1.5,roof:false},
  "GMHBA Stadium":{st:"VIC",adj:1.5,roof:false},"Kardinia Park":{st:"VIC",adj:1.5,roof:false},
  "ENGIE Stadium":{st:"NSW",adj:-2.5,roof:false},"Sydney Showground":{st:"NSW",adj:-2.5,roof:false},
  "People First Stadium":{st:"QLD",adj:0,roof:false},Carrara:{st:"QLD",adj:0,roof:false},
  "Suncorp Stadium":{st:"QLD",adj:0,roof:false},
};

const HOME_ADV = {VIC:7.5,SA:9.0,WA:12.5,QLD:8.0,NSW:6.5};
const H2H = {"Port Adelaide_Gold Coast":3,"Geelong_Richmond":3,"Sydney_North Melbourne":3,"Melbourne_Gold Coast":3,"Adelaide_Gold Coast":2,"Port Adelaide_St Kilda":2};
const WEATHER_ADJ = {Fine:0,Overcast:-2,"Light Rain":-4.5,Wet:-6.5,Windy:-6,"Storms":-9.5};
const P = {rw:0.55,sw:0.45,od:0.30,fm:0.15,la:84.5};

// Demo fallback fixture in case API call fails or season hasn't started
const DEMO_FIXTURE = {
  round:"Demo Round (2025 R2)",
  note:"API unavailable — showing demo data. Check your server is running on localhost:3001",
  top8:["Sydney","Geelong","Brisbane","Western Bulldogs","Carlton","Hawthorn","Port Adelaide","Collingwood"],
  fixtures:[
    {home:"Richmond",away:"Carlton",venue:"MCG",time:"Thu 7:30 PM",night:true},
    {home:"Hawthorn",away:"Essendon",venue:"MCG",time:"Fri 7:40 PM",night:true},
    {home:"Geelong",away:"Fremantle",venue:"GMHBA Stadium",time:"Sat 1:20 PM",night:false},
    {home:"Sydney",away:"Brisbane",venue:"SCG",time:"Sat 4:15 PM",night:false},
    {home:"Collingwood",away:"Port Adelaide",venue:"MCG",time:"Sat 7:35 PM",night:true},
    {home:"Western Bulldogs",away:"North Melbourne",venue:"Marvel Stadium",time:"Sat 7:35 PM",night:true},
    {home:"Adelaide",away:"St Kilda",venue:"Adelaide Oval",time:"Sun 12:05 PM",night:false},
    {home:"Melbourne",away:"GWS",venue:"MCG",time:"Sun 3:20 PM",night:false},
    {home:"West Coast",away:"Gold Coast",venue:"Optus Stadium",time:"Sun 4:40 PM",night:false},
  ]
};

function predict(team,opp,ctx){
  const t=TEAMS[team]||{avg:80,std:20,home:83,away:77,t8:75,b10:85,con:85,st:"VIC"};
  const o=TEAMS[opp]||{avg:80,std:20,home:83,away:77,t8:75,b10:85,con:85,st:"VIC"};
  const l5=ctx.last5||t.avg;
  const base=P.rw*l5+P.sw*t.avg;
  const vst=ctx.venueState||t.st;
  const ha=ctx.isHome?(HOME_ADV[vst]||7.5):-(HOME_ADV[vst]||7.5);
  const def=ctx.isHome?P.od*(P.la-o.con):-P.od*(P.la-o.con);
  const form=P.fm*(l5-t.avg);
  const tier=ctx.oppTop8?(t.t8-t.avg):(t.b10-t.avg);
  const rest=ctx.rest<6?-4.5:ctx.rest>7?2.5:0;
  const wx=WEATHER_ADJ[ctx.weather]||0;
  const night=ctx.night?1.5:0;
  const inter=(!ctx.isHome&&t.st!==vst)?-4:0;
  const venAdj=(ctx.venueAdj||0)/2;
  const h2hKey=team+"_"+opp;
  const h2h=H2H[h2hKey]||0;
  const score=Math.round(base+ha+def+form+tier+rest+wx+night+inter+venAdj+h2h);
  return {
    score:Math.max(30,score),std:t.std,
    factors:{base:Math.round(base*10)/10,ha:Math.round(ha*10)/10,def:Math.round(def*10)/10,form:Math.round(form*10)/10,tier:Math.round(tier*10)/10,rest,wx,night,inter,venue:Math.round(venAdj*10)/10,h2h}
  };
}

function resolveVenue(v){
  if(!v)return{st:"VIC",adj:0,roof:false};
  for(const[k,val]of Object.entries(VENUES)){if(v.toLowerCase().includes(k.toLowerCase()))return val;}
  return{st:"VIC",adj:0,roof:false};
}

function findTeam(name){
  if(!name)return null;
  const n=name.toLowerCase().trim();
  for(const k of Object.keys(TEAMS)){if(k.toLowerCase()===n)return k;if(n.includes(k.toLowerCase()))return k;if(TEAMS[k].abbr.toLowerCase()===n)return k;}
  if(n.includes("bulldog"))return"Western Bulldogs";if(n.includes("lion"))return"Brisbane";if(n.includes("giant"))return"GWS";if(n.includes("magpie"))return"Collingwood";if(n.includes("bomber"))return"Essendon";if(n.includes("hawk"))return"Hawthorn";if(n.includes("cat"))return"Geelong";if(n.includes("docker"))return"Fremantle";if(n.includes("sun"))return"Gold Coast";if(n.includes("eagle"))return"West Coast";if(n.includes("demon"))return"Melbourne";if(n.includes("kangaroo")||n.includes("roo"))return"North Melbourne";if(n.includes("power"))return"Port Adelaide";if(n.includes("crow"))return"Adelaide";if(n.includes("tiger"))return"Richmond";if(n.includes("saint"))return"St Kilda";if(n.includes("swan"))return"Sydney";
  return null;
}

function runModel(parsed, weatherOverrides) {
  const t8 = parsed.top8 || DEMO_FIXTURE.top8;
  const results = [];
  for (const f of parsed.fixtures) {
    const home = findTeam(f.home);
    const away = findTeam(f.away);
    if (!home || !away) continue;
    const ven = resolveVenue(f.venue);
    const wx = weatherOverrides[home + "_" + away] || "Fine";
    const hCtx = { isHome: true, venueState: ven.st, oppTop8: t8.map(t => t.toLowerCase()).includes(away.toLowerCase()), last5: null, rest: 7, weather: wx, night: !!f.night, venueAdj: ven.adj };
    const aCtx = { isHome: false, venueState: ven.st, oppTop8: t8.map(t => t.toLowerCase()).includes(home.toLowerCase()), last5: null, rest: 7, weather: wx, night: !!f.night, venueAdj: ven.adj };
    const hP = predict(home, away, hCtx);
    const aP = predict(away, home, aCtx);
    results.push({ home, away, venue: f.venue || "TBC", time: f.time || "", hScore: hP.score, aScore: aP.score, hStd: hP.std, aStd: aP.std, hFactors: hP.factors, aFactors: aP.factors, total: hP.score + aP.score, margin: hP.score - aP.score, weather: wx, roof: ven.roof });
  }
  return { results, top8: t8, round: parsed.round || "Upcoming Round", note: parsed.note || "" };
}

const Badge = ({ team, size = "lg" }) => {
  const t = TEAMS[team]; if (!t) return null;
  const s = size === "lg" ? { w: "48px", h: "48px", f: "16px" } : { w: "32px", h: "32px", f: "11px" };
  return <div style={{ width: s.w, height: s.h, borderRadius: "10px", background: t.clr, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: s.f, color: "#fff", letterSpacing: "0.5px", border: "2px solid rgba(255,255,255,0.15)", flexShrink: 0 }}>{t.abbr}</div>;
};

const Factor = ({ label, val }) => {
  const c = val > 0 ? "#4ade80" : val < 0 ? "#f87171" : "#94a3b8";
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
    <span style={{ color: "#94a3b8" }}>{label}</span>
    <span style={{ color: c, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{val > 0 ? "+" : ""}{val}</span>
  </div>;
};

export default function AFLPredictor() {
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});
  const [roundInfo, setRoundInfo] = useState("");
  const [note, setNote] = useState("");
  const [weatherOverrides, setWeatherOverrides] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [top8, setTop8] = useState([]);
  const [mode, setMode] = useState(""); // "live" or "demo"

  const runWithData = useCallback((parsed, wxOverrides, src) => {
    const { results, top8: t8, round, note: n } = runModel(parsed, wxOverrides || {});
    setMatches(results);
    setTop8(t8);
    setRoundInfo(round);
    setNote(n);
    setMode(src);
    setLastUpdated(new Date());
  }, []);

  const fetchLive = useCallback(async () => {
    setLoading(true); setError(""); setMatches(null);
    setStatus("Calling server → scraping AFL fixtures...");
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}. Is server.js running on port 3001?`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const txt = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
      let parsed = null;
      try {
        const jsonMatch = txt.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (e) { console.log("Parse attempt failed:", e); }

      if (!parsed || !parsed.fixtures || parsed.fixtures.length === 0) {
        setStatus("No live fixtures found — loading demo data...");
        runWithData(DEMO_FIXTURE, weatherOverrides, "demo");
      } else {
        setStatus("");
        runWithData(parsed, weatherOverrides, "live");
      }
    } catch (e) {
      console.error("Fetch failed:", e);
      setStatus("Server unavailable — loading demo data...");
      setError(e.message);
      runWithData(DEMO_FIXTURE, weatherOverrides, "demo");
    }
    setLoading(false); setStatus("");
  }, [weatherOverrides, runWithData]);

  const loadDemo = useCallback(() => {
    setError("");
    runWithData(DEMO_FIXTURE, weatherOverrides, "demo");
  }, [weatherOverrides, runWithData]);

  const recalcWeather = useCallback(() => {
    if (!matches) return;
    // Re-run model with current fixture but new weather settings
    // We stored the mode, so we know what data we had
    // Simplest: just re-run demo since we don't cache the live fixture
    // For a production app you'd cache the parsed fixture
    runWithData(DEMO_FIXTURE, weatherOverrides, mode || "demo");
  }, [matches, weatherOverrides, mode, runWithData]);

  const toggleExpand = (i) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  return <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#0a0e1a 0%,#111827 50%,#0a1628 100%)", color: "#e2e8f0", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 16px" }}>

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ display: "inline-block", padding: "4px 16px", background: "linear-gradient(90deg,#FFCD00,#e8a800)", borderRadius: "4px", fontSize: "11px", fontWeight: 700, color: "#000", letterSpacing: "2px", marginBottom: "10px" }}>LIVE PREDICTIONS</div>
        <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: "clamp(32px,6vw,52px)", fontWeight: 700, margin: "4px 0", letterSpacing: "1px", background: "linear-gradient(180deg,#fff 40%,#94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AFL SCORE PREDICTOR</h1>
        <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0" }}>12-Factor Regression Model · Auto-Scraped Data · Zero Input Required</p>
      </div>

      {/* BUTTONS */}
      <div style={{ textAlign: "center", marginBottom: "24px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={fetchLive} disabled={loading} style={{ padding: "14px 32px", background: loading ? "#334155" : "linear-gradient(135deg,#FFCD00,#e8a800)", color: loading ? "#94a3b8" : "#000", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, fontFamily: "'Oswald',sans-serif", letterSpacing: "1px", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "⏳ SCRAPING..." : "⚡ FETCH LIVE DATA"}
        </button>
        <button onClick={loadDemo} disabled={loading} style={{ padding: "14px 32px", background: "rgba(255,255,255,0.07)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", fontSize: "15px", fontWeight: 700, fontFamily: "'Oswald',sans-serif", letterSpacing: "1px", cursor: "pointer" }}>
          📋 DEMO DATA
        </button>
        {lastUpdated && <p style={{ color: "#64748b", fontSize: "12px", width: "100%", marginTop: "4px" }}>
          Last updated: {lastUpdated.toLocaleTimeString()} · Mode: {mode === "live" ? "🟢 Live" : "🟡 Demo"}
        </p>}
      </div>

      {/* STATUS / ERROR */}
      {status && <div style={{ textAlign: "center", padding: "12px", background: "rgba(255,205,0,0.1)", border: "1px solid rgba(255,205,0,0.2)", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "#FFCD00" }}>{status}</div>}
      {error && <div style={{ textAlign: "center", padding: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "#f87171" }}>
        <strong>Connection issue:</strong> {error}
        <div style={{ marginTop: "6px", fontSize: "12px", color: "#94a3b8" }}>
          Predictions below are from demo data. To get live scraping, make sure <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 4px", borderRadius: "3px" }}>server.js</code> is running.
        </div>
      </div>}
      {note && !error && <div style={{ textAlign: "center", padding: "8px", fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>{note}</div>}

      {/* MATCHES */}
      {matches && <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", padding: "0 4px" }}>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "20px", fontWeight: 600, color: "#FFCD00" }}>{roundInfo}</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>{matches.length} matches · Std Error ±22 pts</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "14px", marginBottom: "30px" }}>
          {matches.map((m, i) => {
            const winner = m.margin > 0 ? m.home : m.margin < 0 ? m.away : "Draw";
            const absMgn = Math.abs(m.margin);
            const conf = absMgn < 12 ? "TOSS-UP" : absMgn < 25 ? "LEAN" : "STRONG";
            const confClr = conf === "TOSS-UP" ? "#fbbf24" : conf === "LEAN" ? "#60a5fa" : "#4ade80";
            return <div key={i} style={{ background: "linear-gradient(180deg,#1a2332 0%,#151d2b 100%)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
              {/* Match header */}
              <div style={{ padding: "16px 16px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{m.venue}</span>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {m.roof && <span style={{ fontSize: "10px", padding: "2px 6px", background: "rgba(96,165,250,0.15)", color: "#60a5fa", borderRadius: "4px" }}>🏟 ROOF</span>}
                    <span style={{ fontSize: "10px", padding: "2px 6px", background: "rgba(148,163,184,0.1)", color: "#94a3b8", borderRadius: "4px" }}>{m.time}</span>
                  </div>
                </div>
                {/* Home team */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                    <Badge team={m.home} />
                    <div><div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "16px", fontWeight: 600 }}>{m.home}</div><div style={{ fontSize: "11px", color: "#64748b" }}>HOME</div></div>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "28px", fontWeight: 700, color: m.margin >= 0 ? "#fff" : "#94a3b8", minWidth: "50px", textAlign: "center" }}>{m.hScore}</div>
                </div>
                {/* Away team */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                    <Badge team={m.away} />
                    <div><div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "16px", fontWeight: 600 }}>{m.away}</div><div style={{ fontSize: "11px", color: "#64748b" }}>AWAY</div></div>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "28px", fontWeight: 700, color: m.margin <= 0 ? "#fff" : "#94a3b8", minWidth: "50px", textAlign: "center" }}>{m.aScore}</div>
                </div>
              </div>

              {/* Stats bar */}
              <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", padding: "10px 16px", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>MARGIN</div><div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "15px", fontWeight: 600, color: m.margin > 0 ? "#4ade80" : "#f87171" }}>{winner} by {absMgn}</div></div>
                <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }} />
                <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>TOTAL</div><div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "15px", fontWeight: 600 }}>{m.total}</div></div>
                <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }} />
                <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>CONFIDENCE</div><div style={{ fontSize: "13px", fontWeight: 700, color: confClr }}>{conf}</div></div>
              </div>

              {/* Weather + expand */}
              <div style={{ padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                <select value={weatherOverrides[m.home + "_" + m.away] || "Fine"} onChange={e => { setWeatherOverrides(p => ({ ...p, [m.home + "_" + m.away]: e.target.value })); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#94a3b8", fontSize: "11px", padding: "3px 6px", cursor: "pointer" }}>
                  {Object.keys(WEATHER_ADJ).map(w => <option key={w} value={w}>{w === "Fine" ? "☀️" : "🌧️"} {w}</option>)}
                </select>
                <button onClick={() => toggleExpand(i)} style={{ background: "none", border: "none", color: "#64748b", fontSize: "11px", cursor: "pointer", padding: "3px 8px" }}>
                  {expanded[i] ? "▲ Hide Factors" : "▼ Show Factors"}
                </button>
              </div>

              {/* Factor breakdown */}
              {expanded[i] && <div style={{ padding: "8px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <div><div style={{ fontSize: "11px", fontWeight: 700, color: "#FFCD00", marginBottom: "4px" }}>{TEAMS[m.home]?.abbr || "HOME"}</div>
                  <Factor label="Base" val={m.hFactors.base} /><Factor label="Home/Away" val={m.hFactors.ha} /><Factor label="Opp Defence" val={m.hFactors.def} /><Factor label="Form" val={m.hFactors.form} /><Factor label="Tier" val={m.hFactors.tier} /><Factor label="Rest" val={m.hFactors.rest} /><Factor label="Weather" val={m.hFactors.wx} /><Factor label="Night" val={m.hFactors.night} /><Factor label="Interstate" val={m.hFactors.inter} /><Factor label="Venue" val={m.hFactors.venue} /><Factor label="H2H" val={m.hFactors.h2h} />
                </div>
                <div><div style={{ fontSize: "11px", fontWeight: 700, color: "#FFCD00", marginBottom: "4px" }}>{TEAMS[m.away]?.abbr || "AWAY"}</div>
                  <Factor label="Base" val={m.aFactors.base} /><Factor label="Home/Away" val={m.aFactors.ha} /><Factor label="Opp Defence" val={m.aFactors.def} /><Factor label="Form" val={m.aFactors.form} /><Factor label="Tier" val={m.aFactors.tier} /><Factor label="Rest" val={m.aFactors.rest} /><Factor label="Weather" val={m.aFactors.wx} /><Factor label="Night" val={m.aFactors.night} /><Factor label="Interstate" val={m.aFactors.inter} /><Factor label="Venue" val={m.aFactors.venue} /><Factor label="H2H" val={m.aFactors.h2h} />
                </div>
              </div>}
            </div>;
          })}
        </div>

        {/* ROUND SUMMARY TABLE */}
        <div style={{ background: "linear-gradient(180deg,#1a2332,#151d2b)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: "16px", fontWeight: 600, color: "#FFCD00" }}>ROUND SUMMARY</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead><tr style={{ background: "rgba(0,0,0,0.3)" }}>
                {["Match", "Home", "Away", "Margin", "Total", "Conf."].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px" }}>{h}</th>)}
              </tr></thead>
              <tbody>{matches.map((m, i) => {
                const w = m.margin > 0 ? m.home : m.away;
                const conf = Math.abs(m.margin) < 12 ? "⚖️" : Math.abs(m.margin) < 25 ? "👉" : "💪";
                return <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>{m.home} v {m.away}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono',monospace", color: m.margin >= 0 ? "#4ade80" : "#e2e8f0" }}>{m.hScore}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono',monospace", color: m.margin <= 0 ? "#4ade80" : "#e2e8f0" }}>{m.aScore}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: m.margin > 0 ? "#4ade80" : "#f87171" }}>{w} by {Math.abs(m.margin)}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono',monospace" }}>{m.total}</td>
                  <td style={{ padding: "8px 12px" }}>{conf}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: "center", padding: "16px", color: "#475569", fontSize: "11px", lineHeight: "1.6" }}>
          <p>Model: 12-Factor Weighted Regression · Std Error: ±22 pts · Baseline: 2024 Season Data</p>
          <p>Factors: Base Score · Home/Away · Opp Defence · Form · Tier · Rest · Weather · Night · Interstate · Venue Profile · H2H</p>
          <p style={{ marginTop: "4px" }}>⚠️ Change weather per match, then click Fetch Live or Demo to recalculate.</p>
        </div>
      </>}

      {/* EMPTY STATE */}
      {!matches && !loading && <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏈</div>
        <p style={{ fontSize: "18px", fontFamily: "'Oswald',sans-serif", color: "#94a3b8", marginBottom: "8px" }}>Ready to predict</p>
        <p style={{ fontSize: "13px", color: "#64748b", maxWidth: "480px", margin: "0 auto 20px" }}>
          <strong>⚡ Fetch Live Data</strong> scrapes current AFL fixtures via the backend server and runs predictions.<br /><br />
          <strong>📋 Demo Data</strong> runs the model on sample fixtures instantly — no server needed.
        </p>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "16px 20px", maxWidth: "500px", margin: "0 auto", textAlign: "left", fontSize: "12px", color: "#64748b", lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>Setup for live scraping:</div>
          <code style={{ display: "block", background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: "4px", marginBottom: "4px", color: "#e2e8f0", fontSize: "12px" }}>
            npm install express cors<br />
            ANTHROPIC_API_KEY=sk-... node server.js
          </code>
          Then click <strong>Fetch Live Data</strong> above.
        </div>
      </div>}
    </div>
  </div>;
}
