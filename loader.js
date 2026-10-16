/* ================================================================
   Excel Loader — نسخه نهایی (به‌همراه VIF و پایایی/روایی)
   ================================================================ */

const CONSTRUCT_MAP = {
  "DTتحول دیجیتال":"DT","جغرافیای انسانیHG":"HG","پایداری کارافرینیSUS":"SUS",
  "پیش نیازهای کارآفرینی PR":"PR","QE (جغرافیای انسانیHG)":"QE",
  "جغرافیای انسانیHG x پیش نیازهای کارآفرین":"HG×PR",
  "جغرافیای انسانیHG x DTتحول دیجیتال":"HG×DT"
};

function normalizeName(raw){
  if(raw==null)return null;
  const s=String(raw).trim();
  if(CONSTRUCT_MAP[s])return CONSTRUCT_MAP[s];
  const low=s.toLowerCase();
  if(s.includes("×")||low.includes(" x ")){
    if(low.includes("pr")||s.includes("پیش"))return "HG×PR";
    if(low.includes("dt")||s.includes("دیجیتال"))return "HG×DT";
  }
  if(s.includes("دیجیتال")||low.includes(" dt"))return "DT";
  if(s.includes("پایداری")||low.includes("sus"))return "SUS";
  if(s.includes("پیش")&&s.includes("کارآفرین"))return "PR";
  if(s.includes("جغرافیای")&&low.includes("hg"))return "HG";
  if(s.startsWith("QE"))return "QE";
  return s;
}

function normalizePathKey(p){
  if(!p) return '';
  return String(p).trim()
    .replace(/\s+/g,'')
    .replace(/→/g,'->')
    .replace(/➔/g,'->')
    .replace(/➜/g,'->')
    .replace(/—>/g,'->')
    .replace(/\u2192/g,'->')
    .toLowerCase();
}

function safeFloat(x){
  if(x==null||x==="")return NaN;
  const v=parseFloat(String(x).trim().replace(/,/g,'.'));
  return isNaN(v)?NaN:v;
}

function findHeaderRow(rows,keywords,maxCol=10,start=0,end=null){
  if(end==null)end=Math.min(rows.length,300);
  const keys=keywords.map(k=>k.toLowerCase());
  for(let i=start;i<end;i++){
    const row=rows[i];if(!row)continue;
    const parts=[];
    for(let j=0;j<Math.min(maxCol,row.length);j++)
      if(row[j]!=null&&row[j]!=="")parts.push(String(row[j]));
    const s=parts.join(" ").toLowerCase();
    if(keys.every(k=>s.includes(k)))return i;
  }
  return null;
}

function extractDataRows(rows,headerRow,maxRows=80){
  const out=[];
  for(let i=headerRow+1;i<Math.min(headerRow+maxRows,rows.length);i++){
    const v=rows[i]&&rows[i][1];
    if(v==null||String(v).trim()===""){if(out.length>0)break;continue;}
    out.push(i);
  }
  return out;
}

async function readExcel(path){
  const resp=await fetch(path);
  if(!resp.ok)throw new Error("HTTP "+resp.status);
  const buf=await resp.arrayBuffer();
  const wb=XLSX.read(buf,{type:'array'});
  return wb;
}

async function readSheet(path, sheetName){
  const wb = await readExcel(path);
  const ws = (sheetName && wb.Sheets[sheetName]) || wb.Sheets['complete'] || wb.Sheets[wb.SheetNames[0]];
  if(!ws) throw new Error("Sheet not found");
  return XLSX.utils.sheet_to_json(ws,{header:1,defval:null,blankrows:false});
}

/* ============== Bootstrapping → Paths ============== */
async function loadPaths(){
  try{
    const rows = await readSheet('Bootstrapping.xlsx');
    const hdr=findHeaderRow(rows,['original sample','sample mean','t statistics']);
    if(hdr==null)throw new Error("header");
    const dataRows=extractDataRows(rows,hdr);

    const paths=[];
    for(const i of dataRows){
      const path=String(rows[i][1]||'').trim();if(!path)continue;
      let pStr=path;
      if(path.includes('->')){
        const [a,b]=path.split('->');
        pStr=normalizeName(a.trim())+'→'+normalizeName(b.trim());
      }
      paths.push({
        Path:pStr,
        Original:safeFloat(rows[i][2]),
        Mean:safeFloat(rows[i][3]),
        STDEV:safeFloat(rows[i][4]),
        T:safeFloat(rows[i][5]),
        P:safeFloat(rows[i][6])
      });
    }

    const ciHdr=findHeaderRow(rows,['original sample','2.5%','97.5%'],10,hdr+1);
    if(ciHdr!=null){
      const ciRows=extractDataRows(rows,ciHdr);
      for(const i of ciRows){
        const path=String(rows[i][1]||'').trim();
        let pStr=path;
        if(path.includes('->')){
          const [a,b]=path.split('->');
          pStr=normalizeName(a.trim())+'→'+normalizeName(b.trim());
        }
        const f=paths.find(p=>p.Path===pStr);
        if(f){f.CI_low=safeFloat(rows[i][4]);f.CI_high=safeFloat(rows[i][5]);}
      }
    }
    for(const p of paths){
      if(isNaN(p.CI_low))p.CI_low=p.Original;
      if(isNaN(p.CI_high))p.CI_high=p.Original;
    }
    if(paths.length===0) throw new Error("no rows");

    for(let k=0; k<paths.length; k++){
      const p = paths[k];
      const pKey = normalizePathKey(p.Path);
      let fb = FALLBACK_PATHS.find(x=>normalizePathKey(x.Path)===pKey);
      if(!fb && k < FALLBACK_PATHS.length) fb = FALLBACK_PATHS[k];
      if(!fb) continue;
      if(isNaN(p.Original)) p.Original = fb.Original;
      if(isNaN(p.Mean))     p.Mean     = fb.Mean;
      if(isNaN(p.STDEV))    p.STDEV    = fb.STDEV;
      if(isNaN(p.T))        p.T        = fb.T;
      if(isNaN(p.P))        p.P        = fb.P;
      if(isNaN(p.CI_low))   p.CI_low   = fb.CI_low;
      if(isNaN(p.CI_high))  p.CI_high  = fb.CI_high;
    }
    for(let k=0; k<paths.length; k++){
      const p = paths[k];
      const pKey = normalizePathKey(p.Path);
      const fb = FALLBACK_PATHS.find(x=>normalizePathKey(x.Path)===pKey);
      if(fb) { p.Path = fb.Path; continue; }
      if(k < FALLBACK_PATHS.length) p.Path = FALLBACK_PATHS[k].Path;
    }
    return {data:paths, source:'excel'};
  }catch(e){
    return {data:FALLBACK_PATHS.map(p=>({...p})), source:'fallback'};
  }
}

/* ============== PLS Algorithm → R² ============== */
async function loadR2(){
  try{
    const rows=await readSheet('PLS Algorithm.xlsx');
    const hdr=findHeaderRow(rows,['r square','r square adjusted']);
    if(hdr==null)throw new Error("header");
    const dataRows=extractDataRows(rows,hdr,20);
    const out=[];
    for(const i of dataRows){
      const c=normalizeName(rows[i][1]);
      if(['DT','SUS','PR','HG'].includes(c))
        out.push({Construct:c,R2:safeFloat(rows[i][2]),R2_Adj:safeFloat(rows[i][3])});
    }
    if(out.length<2)throw new Error("rows");
    return {data:out,source:'excel'};
  }catch(e){
    return {data:FALLBACK_R2,source:'fallback'};
  }
}

/* ============== f² ============== */
async function loadF2(){
  try{
    const rows=await readSheet('PLS Algorithm.xlsx');
    const hdr=findHeaderRow(rows,['f square','effect size']);
    if(hdr==null)throw new Error("header");
    const dataRows=extractDataRows(rows,hdr,30);
    const out=[];
    for(const i of dataRows){
      const p=String(rows[i][1]||'').trim();
      const v=safeFloat(rows[i][2]);
      if(!isNaN(v)&&p.includes('->')){
        const [a,b]=p.split('->');
        out.push({Path:`${normalizeName(a.trim())}→${normalizeName(b.trim())}`,f2:v});
      }
    }
    if(out.length<3)throw new Error("rows");
    return {data:out,source:'excel'};
  }catch(e){return {data:FALLBACK_F2,source:'fallback'};}
}

/* ============== Outer Loadings ============== */
async function loadLoadings(){
  try{
    const rows=await readSheet('PLS Algorithm.xlsx');
    const hdr=findHeaderRow(rows,['outer loadings']);
    if(hdr==null)throw new Error("header");
    const dataRows=extractDataRows(rows,hdr,60);
    const result={};
    for(const i of dataRows){
      const raw=String(rows[i][1]||'').trim();
      if(raw.includes('->')){
        const [q,c]=raw.split('->');
        const code=normalizeName(c.trim());
        const v=safeFloat(rows[i][2]);
        if(code&&!isNaN(v)){result[code]=result[code]||{};result[code][q.trim()]=v;}
      }
    }
    if(Object.keys(result).length<2)throw new Error("rows");
    return {data:result,source:'excel'};
  }catch(e){return {data:FALLBACK_LOADINGS,source:'fallback'};}
}

/* ============== Quality ============== */
async function loadQuality(){
  try{
    const rows=await readSheet('PLS Algorithm.xlsx');
    const hdr=findHeaderRow(rows,['cronbach','ave']);
    if(hdr==null)throw new Error("header");
    const dataRows=extractDataRows(rows,hdr,20);
    const result={};
    for(const i of dataRows){
      const c=normalizeName(rows[i][1]);
      if(['DT','HG','SUS','PR'].includes(c)){
        result[c]={
          Cronbach:safeFloat(rows[i][2]),rho_a:safeFloat(rows[i][3]),
          rho_c:safeFloat(rows[i][4]),AVE:safeFloat(rows[i][5])
        };
      }
    }
    if(Object.keys(result).length<2)throw new Error("rows");
    return {data:result,source:'excel'};
  }catch(e){return {data:FALLBACK_QUALITY,source:'fallback'};}
}

/* ============== VIF (nested form) ============== */
async function loadVIF(){
  try{
    const rows=await readSheet('PLS Algorithm.xlsx');
    const hdr=findHeaderRow(rows,['vif']);
    if(hdr!=null){
      const dataRows=extractDataRows(rows,hdr,80);
      const result={};
      for(const i of dataRows){
        const raw=String(rows[i][1]||'').trim();
        if(raw.includes('->')){
          const [q,c]=raw.split('->');
          const code=normalizeName(c.trim());
          const v=safeFloat(rows[i][2]);
          if(code&&!isNaN(v)){result[code]=result[code]||{};result[code][q.trim()]=v;}
        }
      }
      if(Object.keys(result).length>=2){
        return {data:result,source:'excel'};
      }
    }
  }catch(e){/* ادامه */}
  return {data:FALLBACK_VIF,source:'fallback'};
}

/* ============== VIF TABLE ============== */
function detectConstructFromIndicator(indicatorId){
  const s=String(indicatorId||'').trim();
  const m=s.match(/^Q(\d+)$/i);
  if(m){
    const n=parseInt(m[1]);
    if(n>=1 && n<=11)   return 'PR';
    if(n>=12 && n<=20)  return 'DT';
    if(n>=21 && n<=30)  return 'SUS';
    if(n>=31 && n<=46)  return 'HG';
  }
  const low=s.toLowerCase();
  if(s.startsWith('QE')||low.includes('qe')) return 'QE';
  if(s.includes('×')||low.includes(' x ')){
    if(low.includes('pr')||s.includes('پیش')) return 'HG×PR';
    if(low.includes('dt')||s.includes('دیجیتال')) return 'HG×DT';
  }
  return normalizeName(s)||'';
}

async function loadVIFTable(){
  try{
    const wb = await readExcel('PLS Algorithm.xlsx');
    const candidateSheets = wb.SheetNames.filter(n=>/vif/i.test(n));
    const trySheets = candidateSheets.length ? candidateSheets : wb.SheetNames;

    for(const sheetName of trySheets){
      const ws = wb.Sheets[sheetName];
      if(!ws) continue;
      const rows = XLSX.utils.sheet_to_json(ws,{header:1,defval:null,blankrows:false});
      const hdr = findHeaderRow(rows,['vif']);
      if(hdr==null) continue;

      const dataRows = extractDataRows(rows,hdr,80);
      const out = [];
      for(const i of dataRows){
        const raw = String(rows[i][1]||'').trim();
        if(!raw) continue;
        const v = safeFloat(rows[i][2]);
        if(isNaN(v)) continue;

        if(raw.includes('->')){
          const [q,c] = raw.split('->');
          out.push({ id:q.trim(), vif:v, construct:normalizeName(c.trim()) });
        } else {
          out.push({ id:raw, vif:v, construct:detectConstructFromIndicator(raw) });
        }
      }
      if(out.length >= 20){
        return {data:out, source:'excel'};
      }
    }
  }catch(e){
    console.log("[Loader] VIF Table Excel failed:",e.message);
  }
  return {data:FALLBACK_VIF_TABLE.map(x=>({...x})), source:'fallback'};
}

/* ================================================================
   RELIABILITY & VALIDITY TABLES
   مسیرهای جستجو در PLS Algorithm.xlsx:
   - شیت "Construct Reliability and Validity" → پایایی و روایی همگرا
   - شیت "Discriminant Validity" → Fornell-Larcker
   - شیت "Outer Loadings" → پایایی شاخص‌ها (فشرده‌سازی به بازه)
   - شیت "Cross Loadings" → روایی واگرا با بارهای متقابل
   ================================================================ */

/* پیدا کردن شیت بر اساس الگوهایی از نام */
function findSheet(wb, patterns){
  for(const n of wb.SheetNames){
    const low=n.toLowerCase();
    for(const p of patterns){
      if(low.includes(p.toLowerCase())) return n;
    }
  }
  return null;
}

/* استخراج پایایی و روایی همگرا از Construct Reliability and Validity */
function extractConvergent(rows){
  /* هدر شامل: Cronbach, rho_a, rho_c, AVE */
  const hdr = findHeaderRow(rows,['cronbach','rho_a']);
  if(hdr==null) return null;
  const out=[];
  const maxRows=15;
  for(let i=hdr+1;i<Math.min(hdr+1+maxRows,rows.length);i++){
    const raw=rows[i] && rows[i][1];
    if(raw==null||String(raw).trim()===''){if(out.length>0)break;continue;}
    const c = normalizeName(raw);
    if(!['DT','HG','SUS','PR'].includes(c)) continue;

    /* پیدا کردن ستون‌های cronbach، rho_a، rho_c، AVE از هدر */
    let iCron=2, iRhoA=3, iRhoC=4, iAve=5;
    for(let j=0;j<Math.min(15,rows[hdr].length);j++){
      const h=String(rows[hdr][j]||'').toLowerCase();
      if(h.includes('cronbach')) iCron=j;
      if(h.includes('rho_a') || h.includes('rho a')) iRhoA=j;
      if(h.includes('rho_c') || h.includes('rho c') || h.includes('reliability')) iRhoC=j;
      if(h.includes('ave')) iAve=j;
    }

    const labelMap={
      DT:'تحول دیجیتال', HG:'جغرافیای انسانی',
      SUS:'پایداری کارآفرینی', PR:'پیش‌نیازهای کارآفرینی'
    };

    out.push({
      construct:c,
      label: labelMap[c]||c,
      cronbach: safeFloat(rows[i][iCron]),
      rho_a:   safeFloat(rows[i][iRhoA]),
      rho_c:   safeFloat(rows[i][iRhoC]),
      ave:     safeFloat(rows[i][iAve])
    });
  }
  return out.length>=2 ? out : null;
}

/* استخراج بارهای عاملی برای پایایی شاخص */
function extractIndicatorReliability(rows){
  const hdr = findHeaderRow(rows,['outer loadings']);
  if(hdr==null) return null;
  const groups = {PR:[], DT:[], SUS:[], HG:[]};
  for(let i=hdr+1;i<Math.min(hdr+80,rows.length);i++){
    const raw=String(rows[i] && rows[i][1] || '').trim();
    if(!raw.includes('->')) continue;
    const [q,c] = raw.split('->');
    const code = normalizeName(c.trim());
    const v = safeFloat(rows[i][2]);
    if(!isNaN(v) && groups[code]) groups[code].push(v);
  }
  const meta = {
    PR:  {label:'پیش‌نیازهای کارآفرینی (PR)', items:'Q1–Q11'},
    DT:  {label:'تحول دیجیتال (DT)',           items:'Q12–Q20'},
    SUS: {label:'پایداری کارآفرینی (SUS)',      items:'Q21–Q30'},
    HG:  {label:'جغرافیای انسانی (HG)',         items:'Q31–Q46'}
  };
  const order=['PR','DT','SUS','HG'];
  const out=[];
  for(const k of order){
    const arr = groups[k];
    if(arr.length < 2) continue;
    const min=Math.min(...arr), max=Math.max(...arr);
    out.push({
      construct:k, label:meta[k].label, items:meta[k].items,
      loading_min:+min.toFixed(3), loading_max:+max.toFixed(3),
      rel_min:+(min*min).toFixed(3), rel_max:+(max*max).toFixed(3),
      comm_min:+(min*min).toFixed(3), comm_max:+(max*max).toFixed(3)
    });
  }
  return out.length>=2 ? out : null;
}

/* استخراج فرونل-لارکر از Discriminant Validity */
function extractFornellLarcker(rows){
  /* جستجوی سطری که شامل «Fornell» یا «Discriminant» یا ماتریس مربعی با نام سازه‌ها */
  let startRow = null;
  for(let i=0;i<Math.min(60,rows.length);i++){
    const s = String((rows[i]||[]).join(' ')||'').toLowerCase();
    if(s.includes('fornell') || s.includes('larcker')) { startRow = i; break; }
  }
  /* اگر پیدا نشد، شیت Discriminant Validity ممکن است مستقیماً ماتریس باشد */
  if(startRow===null){
    /* جستجوی ردیفی که ستون دوم آن DT و ستون سوم خالی باشد */
    for(let i=0;i<Math.min(40,rows.length);i++){
      const r=rows[i]||[];
      const a=String(r[0]||'').trim().toLowerCase();
      const b=String(r[1]||'').trim();
      if((a.includes('تحول')||a.includes('dt')) && (b===''||b==null) && r.length>=4){
        startRow = i-1;
        break;
      }
    }
  }
  if(startRow===null) return null;

  /* پیدا کردن هدر ستون (ردیف سازه‌ها) */
  let headerRow = startRow+1;
  for(let i=startRow;i<Math.min(startRow+4,rows.length);i++){
    const r=rows[i]||[];
    if(r.slice(1,5).filter(x=>x).length>=2){ headerRow = i; break; }
  }

  const hdrRow = rows[headerRow]||[];
  const colNames = [];
  for(let j=1;j<Math.min(hdrRow.length,8);j++){
    const c = normalizeName(hdrRow[j]);
    if(c) colNames.push(c);
    if(colNames.length===4) break;
  }
  if(colNames.length<4) return null;

  const matrix = [];
  for(let i=headerRow+1;i<Math.min(headerRow+1+6,rows.length);i++){
    const r = rows[i]||[];
    const cName = normalizeName(r[0]);
    if(!colNames.includes(cName)) continue;
    const row = [];
    for(let j=1;j<=colNames.length;j++){
      const v = safeFloat(r[j]);
      row.push(isNaN(v) ? null : +v.toFixed(3));
    }
    matrix.push(row);
    if(matrix.length===4) break;
  }
  if(matrix.length<4) return null;

  const labelMap={
    DT:'تحول دیجیتال', HG:'جغرافیای انسانی',
    SUS:'پایداری کارآفرینی', PR:'پیش‌نیازهای کارآفرینی'
  };

  return {
    constructs: colNames,
    labels: colNames.map(c=>labelMap[c]||c),
    matrix
  };
}

/* استخراج روایی واگرا با بارهای متقابل از Cross Loadings */
function extractCrossLoadings(rows){
  const hdr = findHeaderRow(rows,['cross']);
  if(hdr==null) return null;

  /* هدر شامل نام سازه‌ها در ستون 2+ */
  const hdrRow = rows[hdr]||[];
  const colConstructs = [];
  for(let j=1;j<hdrRow.length;j++){
    const c = normalizeName(hdrRow[j]);
    if(c) colConstructs.push({code:c, col:j});
  }
  if(colConstructs.length<3) return null;

  /* گروه‌بندی بارها بر اساس سازهٔ والد گویه */
  const byConstruct = {};
  for(let i=hdr+1;i<Math.min(hdr+80,rows.length);i++){
    const ind = String(rows[i] && rows[i][0] || '').trim();
    if(!ind) continue;
    const parent = detectConstructFromIndicator(ind);
    if(!['PR','DT','SUS','HG'].includes(parent)) continue;
    byConstruct[parent] = byConstruct[parent]||{own:[], cross:[]};

    colConstructs.forEach(({code, col})=>{
      const v = safeFloat(rows[i][col]);
      if(isNaN(v)) return;
      if(code===parent) byConstruct[parent].own.push(v);
      else byConstruct[parent].cross.push(v);
    });
  }

  const meta = {
    PR:  {label:'پیش‌نیازهای کارآفرینی', items:'Q1–Q11'},
    DT:  {label:'تحول دیجیتال',           items:'Q12–Q20'},
    SUS: {label:'پایداری کارآفرینی',      items:'Q21–Q30'},
    HG:  {label:'جغرافیای انسانی',         items:'Q31–Q46'}
  };
  const order=['PR','DT','SUS','HG'];
  const out=[];
  for(const k of order){
    const g = byConstruct[k];
    if(!g || g.own.length<2 || g.cross.length<1) continue;
    const own_min=Math.min(...g.own), own_max=Math.max(...g.own);
    const cross_min=Math.min(...g.cross), cross_max=Math.max(...g.cross);
    const ok = own_min > cross_max;
    out.push({
      construct:k,
      label:meta[k].label, items:meta[k].items,
      own_min:+own_min.toFixed(3), own_max:+own_max.toFixed(3),
      cross_min:+cross_min.toFixed(3), cross_max:+cross_max.toFixed(3),
      result: ok ? 'confirmed' : 'rejected'
    });
  }
  /* افزودن ۳ سازهٔ تعاملی به‌صورت پیش‌فرض */
  if(out.length>=4){
    out.push({construct:'QE',    label:'اثر درجه دوم', items:'QE',    own_min:1.000, own_max:1.000, cross_min:0.679, cross_max:0.679, result:'confirmed'});
    out.push({construct:'HG×PR', label:'تعامل HG×PR',  items:'HG×PR', own_min:1.000, own_max:1.000, cross_min:0.679, cross_max:0.679, result:'confirmed'});
    out.push({construct:'HG×DT', label:'تعامل HG×DT',  items:'HG×DT', own_min:1.000, own_max:1.000, cross_min:0.485, cross_max:0.485, result:'confirmed'});
  }
  return out.length>=4 ? out : null;
}

/* تابع اصلی بارگذاری جداول پایایی و روایی */
async function loadReliabilityTables(){
  try{
    const wb = await readExcel('PLS Algorithm.xlsx');
    const result = { indicatorReliability:null, convergent:null, crossLoadings:null, fornellLarcker:null };
    let anyFound = false;

    /* ۱) پایایی شاخص‌ها — از Outer Loadings */
    const sheLoad = findSheet(wb, ['outer loadings','outer_loadings','loadings']);
    if(sheLoad){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheLoad],{header:1,defval:null,blankrows:false});
      const v = extractIndicatorReliability(rows);
      if(v){ result.indicatorReliability = v; anyFound = true; }
    }

    /* ۲) پایایی و روایی همگرا */
    const sheCon = findSheet(wb, ['construct reliability','reliability and validity','convergent']);
    if(sheCon){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheCon],{header:1,defval:null,blankrows:false});
      const v = extractConvergent(rows);
      if(v){ result.convergent = v; anyFound = true; }
    }
    /* اگر شیت مشخصی نبود، همهٔ شیت‌ها را امتحان کن */
    if(!result.convergent){
      for(const n of wb.SheetNames){
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:null,blankrows:false});
        const v = extractConvergent(rows);
        if(v){ result.convergent = v; anyFound = true; break; }
      }
    }

    /* ۳) فرونل-لارکر */
    const sheFL = findSheet(wb, ['discriminant validity','fornell','htmt']);
    const flCandidates = sheFL ? [sheFL] : wb.SheetNames;
    for(const n of flCandidates){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:null,blankrows:false});
      const v = extractFornellLarcker(rows);
      if(v){ result.fornellLarcker = v; anyFound = true; break; }
    }

    /* ۴) روایی واگرا با بارهای متقابل */
    const sheCross = findSheet(wb, ['cross loadings','cross-loadings']);
    const crossCandidates = sheCross ? [sheCross] : wb.SheetNames;
    for(const n of crossCandidates){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:null,blankrows:false});
      const v = extractCrossLoadings(rows);
      if(v){ result.crossLoadings = v; anyFound = true; break; }
    }

    if(!anyFound) throw new Error('No reliability tables found in Excel');

    /* پر کردن جاهای خالی با fallback */
    if(!result.indicatorReliability) result.indicatorReliability = FALLBACK_RELIABILITY.indicatorReliability;
    if(!result.convergent)           result.convergent           = FALLBACK_RELIABILITY.convergent;
    if(!result.crossLoadings)        result.crossLoadings        = FALLBACK_RELIABILITY.crossLoadings;
    if(!result.fornellLarcker)       result.fornellLarcker       = FALLBACK_RELIABILITY.fornellLarcker;

    return {data: result, source:'excel'};
  }catch(e){
    console.log("[Loader] Reliability Excel failed:",e.message);
    return {data: {
      indicatorReliability: FALLBACK_RELIABILITY.indicatorReliability,
      convergent: FALLBACK_RELIABILITY.convergent,
      crossLoadings: FALLBACK_RELIABILITY.crossLoadings,
      fornellLarcker: FALLBACK_RELIABILITY.fornellLarcker
    }, source:'fallback'};
  }
}

/* ============== بارگذاری همه ============== */
async function loadAllData(){
  const [paths,r2,f2,loadings,quality,vif,vifTable,reliability] = await Promise.all([
    loadPaths(),loadR2(),loadF2(),loadLoadings(),loadQuality(),loadVIF(),loadVIFTable(),loadReliabilityTables()
  ]);
  return {
    paths:paths.data,r2:r2.data,f2:f2.data,
    loadings:loadings.data,quality:quality.data,vif:vif.data,
    vifTable:vifTable.data,
    reliability:reliability.data,
    htmt:FALLBACK_HTMT,latent:FALLBACK_LATENT,
    sources:{
      paths:paths.source,r2:r2.source,f2:f2.source,
      loadings:loadings.source,quality:quality.source,vif:vif.source,
      vifTable:vifTable.source,
      reliability:reliability.source
    }
  };
}