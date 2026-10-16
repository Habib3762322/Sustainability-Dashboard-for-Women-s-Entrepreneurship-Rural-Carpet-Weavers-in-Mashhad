/* ================================================================
   داشبورد جامع SmartPLS — app.js (نسخه نهایی)
   شامل:
   ✓ Hypotheses Summary
   ✓ VIF Table
   ✓ Reliability & Validity
   ✓ Descriptive Statistics (آمار توصیفی)
   ✓ SmartPLS Graphical Output
   ✓ Excel/Word Viewer
   ================================================================ */

const state={
  lang:'fa',theme:'dark',
  selected:new Set(DATA.indicators.map((_,i)=>i)),
  highlighted:null,
  loaded:null,
  sortCol:null,sortAsc:true,searchTerm:'',
  hypFilter:'all',
  hypSearch:'',
  vifFilter:'all',
  vifSearch:'',
  reliabilityFilter:'all',
  descFilter:'all'
};

const FONT_FA='Vazirmatn, Tahoma, sans-serif';
const $=(id)=>document.getElementById(id);
const t=(key)=>(I18N[state.lang][key]||key);

/* ================================================================
   FILE ACCESS HELPERS
   ================================================================ */
function isFileProtocol(){
  return location.protocol === 'file:';
}

function fileAccessHint(){
  if(isFileProtocol()){
    return 'داشبورد از محیط file:// باز شده است. مرورگرها به دلایل امنیتی اجازهٔ خواندن فایل‌های محلی از این محیط را نمی‌دهند.\n\n' +
           'راه‌حل: داشبورد را از طریق یک وب‌سرور محلی باز کنید.\n\n' +
           'مثال (Python):\n  cd مسیر پوشه\n  python -m http.server 8000\n\n' +
           'سپس در مرورگر باز کنید: http://localhost:8000';
  }
  return null;
}

async function fetchWithFallback(filename, asArrayBuffer){
  const variants = [];
  variants.push(filename);
  variants.push(encodeURI(filename));
  try{ variants.push(encodeURIComponent(filename)); }catch(e){}
  try{ variants.push(filename.normalize('NFC')); }catch(e){}
  try{ variants.push(encodeURI(filename.normalize('NFC'))); }catch(e){}

  let lastError = null;
  for(const v of variants){
    try{
      const resp = await fetch(v, {cache:'no-store'});
      if(resp.ok){
        return asArrayBuffer ? await resp.arrayBuffer() : await resp.blob();
      }
      lastError = new Error('HTTP '+resp.status);
    }catch(e){
      lastError = e;
    }
  }
  throw lastError || new Error('Fetch failed');
}

function showFileError(area, filename, err){
  const hint = fileAccessHint();
  const msg = hint
    ? `<div style="padding:20px;background:rgba(243,156,18,.10);border:1px solid rgba(243,156,18,.4);border-radius:10px;text-align:right;color:var(--text);line-height:2">
        <div style="font-size:16px;font-weight:800;color:var(--orange);margin-bottom:10px">⚠ خطای دسترسی به فایل</div>
        <div style="font-size:13px;margin-bottom:14px"><b>فایل:</b> <code>${filename}</code></div>
        <div style="font-size:13px;white-space:pre-wrap;font-family:inherit">${hint}</div>
       </div>`
    : `<div style="padding:20px;background:rgba(231,76,60,.10);border:1px solid rgba(231,76,60,.4);border-radius:10px;text-align:center;color:var(--red)">
        <div style="font-size:15px;font-weight:800;margin-bottom:8px">خطا در بارگذاری</div>
        <div style="font-size:13px"><b>فایل:</b> ${filename}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px">${err.message||err}</div>
       </div>`;
  if(area) area.innerHTML = msg;
}

/* ================================================================
   THEME & LAYOUT
   ================================================================ */
function themeColors(){
  const dark=state.theme==='dark';
  return{
    paper:dark?'#1e2433':'#fff',plot:dark?'#1e2433':'#fff',
    text:dark?'#e8ecf1':'#2c3e50',grid:dark?'#2d3446':'#e8ecf1',
    zero:dark?'#555':'#ccc',bg:dark?'#12161f':'#f0f2f5'
  };
}

function plotlyLayout(extra={}){
  const c=themeColors();
  return Object.assign({
    paper_bgcolor:c.paper,plot_bgcolor:c.plot,
    font:{family:FONT_FA,size:12,color:c.text},
    hoverlabel:{
      bgcolor:state.theme==='dark'?'#0a0e18':'#fff',
      bordercolor:'#3498db',
      font:{family:FONT_FA,size:14,color:state.theme==='dark'?'#fff':'#000'}
    },
    margin:{l:60,r:30,b:50,t:50}
  },extra);
}

const PLOTLY_CFG={
  responsive:true,displaylogo:false,
  modeBarButtonsToRemove:['lasso2d','select2d'],
  toImageButtonOptions:{format:'png',scale:3,filename:'smartpls_chart'}
};

const HT={template:(s)=>s+'<extra></extra>'};

function plasmaRGB(v,vmin,vmax){
  const tt=Math.max(0,Math.min(1,(v-vmin)/(vmax-vmin+1e-9)));
  const stops=[[0.05,0.03,0.53],[0.35,0,0.66],[0.62,0.13,0.62],[0.84,0.31,0.45],[0.96,0.53,0.30],[0.99,0.75,0.16],[0.94,0.98,0.13]];
  const idx=tt*(stops.length-1),i=Math.floor(idx),f=idx-i;
  const a=stops[i],b=stops[Math.min(i+1,stops.length-1)];
  return `rgb(${Math.round((a[0]+(b[0]-a[0])*f)*255)},${Math.round((a[1]+(b[1]-a[1])*f)*255)},${Math.round((a[2]+(b[2]-a[2])*f)*255)})`;
}

/* ================================================================
   DESCRIPTIVE STATISTICS — آمار توصیفی
   پرسشنامه فرش دستباف زنان روستایی (n = 250)
   ================================================================ */
function renderDescriptiveStatistics(){
  const D = (state.loaded && state.loaded.descriptive) || FALLBACK_DESCRIPTIVE;
  const LIGHT_TEXT = themeColors().text;
  const GRID = themeColors().grid;
  const CARD = themeColors().plot;

  const commonLayout = {
    paper_bgcolor: CARD, plot_bgcolor: CARD,
    font:{family:FONT_FA, size:11, color:LIGHT_TEXT},
    margin:{l:50, r:20, t:20, b:80},
    showlegend:false,
    hoverlabel:{bgcolor:'#fff', bordercolor:'#3498db',
                font:{family:FONT_FA, size:12, color:'#000'}}
  };

  /* ---- KPI Cards ---- */
  const kpiEl = document.getElementById('desc-kpi-grid');
  if(kpiEl){
    const total = D.gender.stats.N;
    const missing = 0;
    const allSD = [D.gender.stats.SD, D.age.stats.SD, D.education.stats.SD,
                   D.distance.stats.SD, D.cost.stats.SD];
    const meanSD = (allSD.reduce((a,b)=>a+b,0)/allSD.length).toFixed(3);
    const maxSD = Math.max(...allSD).toFixed(3);

    kpiEl.innerHTML = `
      <div class="kpi-card green"><div class="kpi-label">${t('desc_kpi_total')}</div><div class="kpi-value">${total}</div></div>
      <div class="kpi-card purple"><div class="kpi-label">${t('desc_kpi_missing')}</div><div class="kpi-value">${missing}</div></div>
      <div class="kpi-card orange"><div class="kpi-label">${t('desc_kpi_mean_sd')}</div><div class="kpi-value">${meanSD}</div></div>
      <div class="kpi-card red"><div class="kpi-label">${t('desc_kpi_max_sd')}</div><div class="kpi-value">${maxSD}</div></div>
    `;
  }

  /* ---- 1. Donut Chart — Gender ---- */
  const g = D.gender;
  Plotly.newPlot('chart-desc-gender', [{
    type:'pie',
    labels: g.labels,
    values: g.values,
    hole: 0.55,
    marker:{colors: g.colors, line:{color:'#fff', width:3}},
    textinfo: 'label+percent',
    textfont:{family:FONT_FA, size:15, color:'#fff'},
    hovertemplate: '<b>%{label}</b><br>فراوانی: %{value}<br>درصد: %{percent}<extra></extra>'
  }], Object.assign({}, commonLayout, {height: 360}), PLOTLY_CFG);

  /* ---- 2. Bar Chart — Age ---- */
  const a = D.age;
  Plotly.newPlot('chart-desc-age', [{
    type:'bar',
    x: a.labels,
    y: a.values,
    marker:{color: a.colors, line:{color:'#fff', width:1.5}},
    text: a.values.map((v,i)=>`${v}<br>(${a.percent[i]}%)`),
    textposition: 'outside',
    textfont:{family:FONT_FA, size:10, color:LIGHT_TEXT},
    hovertemplate: '<b>%{x}</b><br>فراوانی: %{y}<extra></extra>'
  }], Object.assign({}, commonLayout, {
    height: 360,
    xaxis:{gridcolor:GRID, tickfont:{family:FONT_FA, size:10}},
    yaxis:{gridcolor:GRID, tickfont:{family:FONT_FA, size:10}}
  }), PLOTLY_CFG);

  /* ---- 3. Horizontal Bar — Education ---- */
  const e = D.education;
  Plotly.newPlot('chart-desc-edu', [{
    type:'bar',
    orientation: 'h',
    y: e.labels,
    x: e.values,
    marker:{color: e.colors, line:{color:'#fff', width:1.5}},
    text: e.values.map((v,i)=>`${v} (${e.percent[i]}%)`),
    textposition: 'outside',
    textfont:{family:FONT_FA, size:11, color:LIGHT_TEXT},
    hovertemplate: '<b>%{y}</b><br>فراوانی: %{x}<extra></extra>'
  }], Object.assign({}, commonLayout, {
    height: 360,
    xaxis:{gridcolor:GRID, tickfont:{family:FONT_FA, size:10}},
    yaxis:{gridcolor:GRID, tickfont:{family:FONT_FA, size:11}}
  }), PLOTLY_CFG);

  /* ---- 4. Bar Chart — Distance ---- */
  const d = D.distance;
  Plotly.newPlot('chart-desc-distance', [{
    type:'bar',
    x: d.labels,
    y: d.values,
    marker:{color: d.colors, line:{color:'#fff', width:1.5}},
    text: d.values.map((v,i)=>`${v}<br>(${d.percent[i]}%)`),
    textposition: 'outside',
    textfont:{family:FONT_FA, size:10, color:LIGHT_TEXT},
    hovertemplate: '<b>%{x} کیلومتر</b><br>فراوانی: %{y}<extra></extra>'
  }], Object.assign({}, commonLayout, {
    height: 360,
    xaxis:{gridcolor:GRID, tickfont:{family:FONT_FA, size:10}},
    yaxis:{gridcolor:GRID, tickfont:{family:FONT_FA, size:10}}
  }), PLOTLY_CFG);

  /* ---- 5. Bar Chart — Cost ---- */
  const c = D.cost;
  Plotly.newPlot('chart-desc-cost', [{
    type:'bar',
    x: c.labels,
    y: c.values,
    marker:{color: c.colors, line:{color:'#fff', width:1.5}},
    text: c.values.map((v,i)=>`${v}<br>(${c.percent[i]}%)`),
    textposition: 'outside',
    textfont:{family:FONT_FA, size:10, color:LIGHT_TEXT},
    hovertemplate: '<b>%{x} هزار تومان</b><br>فراوانی: %{y}<extra></extra>'
  }], Object.assign({}, commonLayout, {
    height: 360,
    xaxis:{gridcolor:GRID, tickfont:{family:FONT_FA, size:10}},
    yaxis:{gridcolor:GRID, tickfont:{family:FONT_FA, size:10}}
  }), PLOTLY_CFG);

  /* ---- 6. Polar Bar — SD Comparison ---- */
  const sdNames = ['جنسیت', 'سن', 'تحصیلات', 'فاصله مکانی', 'هزینه'];
  const sdValues = [D.gender.stats.SD, D.age.stats.SD, D.education.stats.SD,
                    D.distance.stats.SD, D.cost.stats.SD];
  const sdColors = ['#e91e63', '#9b59b6', '#27ae60', '#f39c12', '#e74c3c'];

  Plotly.newPlot('chart-desc-sd', [{
    type:'barpolar',
    r: sdValues,
    theta: sdNames,
    marker:{color: sdColors, line:{color:'#fff', width:1.5}},
    text: sdValues.map(v=>v.toFixed(3)),
    hovertemplate: '<b>%{theta}</b><br>انحراف معیار = %{r:.3f}<extra></extra>'
  }], Object.assign({}, commonLayout, {
    height: 360,
    polar:{
      bgcolor: CARD,
      radialaxis:{gridcolor:GRID, tickfont:{size:10, color:LIGHT_TEXT},
                  range:[0, Math.max(...sdValues)*1.2]},
      angularaxis:{gridcolor:GRID, tickfont:{family:FONT_FA, size:11, color:LIGHT_TEXT}}
    }
  }), PLOTLY_CFG);

  /* ---- 7. Stats Table ---- */
  const tableEl = document.getElementById('desc-stats-table-container');
  if(tableEl){
    const rows = [
      {name:t('desc_chart_gender'), ...D.gender.stats},
      {name:t('desc_chart_age'), ...D.age.stats},
      {name:t('desc_chart_edu'), ...D.education.stats},
      {name:t('desc_chart_distance'), ...D.distance.stats},
      {name:t('desc_chart_cost'), ...D.cost.stats}
    ];
    let html = `
      <div class="desc-table-wrap">
        <table class="desc-table">
          <thead>
            <tr>
              <th>${t('desc_col_variable')}</th>
              <th>${t('desc_col_n')}</th>
              <th>${t('desc_col_missing')}</th>
              <th>${t('desc_col_mean')}</th>
              <th>${t('desc_col_sd')}</th>
              <th>${t('desc_col_skew')}</th>
              <th>${t('desc_col_kurt')}</th>
              <th>${t('desc_col_range')}</th>
            </tr>
          </thead>
          <tbody>`;
    rows.forEach(r=>{
      html += `<tr>
        <td class="desc-var-cell">${r.name}</td>
        <td>${r.N}</td>
        <td>${r.Missing}</td>
        <td>${r.Mean.toFixed(2)}</td>
        <td>${r.SD.toFixed(3)}</td>
        <td>${r.Skew === null ? '—' : r.Skew.toFixed(3)}</td>
        <td>${r.Kurt === null ? '—' : r.Kurt.toFixed(3)}</td>
        <td>${r.Range}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    tableEl.innerHTML = html;
  }
}

/* ================================================================
   HYPOTHESES
   ================================================================ */
function typeLabel(type){
  const map={
    direct:'hyp_type_direct', mediation:'hyp_type_mediation',
    chained:'hyp_type_chained', moderator:'hyp_type_moderator',
    nonlinear:'hyp_type_nonlinear', interaction:'hyp_type_interaction'
  };
  return t(map[type]||'hyp_type_direct');
}

function effectLabel(f2){
  if(f2==null) return '—';
  if(f2>=0.35) return t('hyp_effect_strong');
  if(f2>=0.15) return t('hyp_effect_medium');
  if(f2>=0.02) return t('hyp_effect_small');
  return t('hyp_effect_weak');
}

function betaHeatColor(beta){
  const v=Math.min(1,Math.abs(beta)/0.55);
  const hue=210-180*v;
  const sat=55+30*v;
  const lit=state.theme==='dark'?(28+18*(1-v)):(90-22*v);
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function renderHypotheses(){
  const cont=$('hypotheses-container');
  if(!cont) return;
  if(typeof HYPOTHESES==='undefined'){ cont.innerHTML=''; return; }

  const total=HYPOTHESES.length;
  const confirmed=HYPOTHESES.filter(h=>h.result==='confirmed').length;
  const rejected=HYPOTHESES.filter(h=>h.result==='rejected').length;
  const ratio=Math.round((confirmed/total)*100);
  const kpiEl=$('hyp-kpi-grid');
  if(kpiEl){
    kpiEl.innerHTML=`
      <div class="hyp-kpi hyp-kpi-total"><div class="hyp-kpi-icon">📚</div><div class="hyp-kpi-label">${t('hyp_kpi_total')}</div><div class="hyp-kpi-value">${total}</div></div>
      <div class="hyp-kpi hyp-kpi-conf"><div class="hyp-kpi-icon">✅</div><div class="hyp-kpi-label">${t('hyp_kpi_confirmed')}</div><div class="hyp-kpi-value">${confirmed}</div></div>
      <div class="hyp-kpi hyp-kpi-rej"><div class="hyp-kpi-icon">❌</div><div class="hyp-kpi-label">${t('hyp_kpi_rejected')}</div><div class="hyp-kpi-value">${rejected}</div></div>
      <div class="hyp-kpi hyp-kpi-ratio"><div class="hyp-kpi-icon">📈</div><div class="hyp-kpi-label">${t('hyp_kpi_ratio')}</div><div class="hyp-kpi-value">${ratio}%</div>
        <div class="hyp-kpi-bar"><span style="width:${ratio}%"></span></div>
      </div>
    `;
  }

  const f=state.hypFilter;
  const s=state.hypSearch.trim().toLowerCase();
  let rows=HYPOTHESES.slice();
  if(f==='confirmed'||f==='rejected') rows=rows.filter(h=>h.result===f);
  else if(f!=='all'){
    if(f==='mediation') rows=rows.filter(h=>h.type==='mediation'||h.type==='chained');
    else if(f==='moderator') rows=rows.filter(h=>h.type==='moderator'||h.type==='interaction');
    else rows=rows.filter(h=>h.type===f);
  }
  if(s) rows=rows.filter(h=>h.id.toLowerCase().includes(s)||h.path.toLowerCase().includes(s));

  if(rows.length===0){
    cont.innerHTML=`<div class="hyp-empty">${t('hyp_empty')}</div>`;
    return;
  }

  let html=`
    <div class="hyp-hint">💡 ${t('hyp_click_hint')}</div>
    <div class="hyp-table-wrap">
      <table class="hyp-table">
        <thead>
          <tr>
            <th>${t('hyp_col_hyp')}</th>
            <th>${t('hyp_col_type')}</th>
            <th>${t('hyp_col_path')}</th>
            <th>${t('hyp_col_sd')}</th>
            <th>${t('hyp_col_beta')}</th>
            <th>${t('hyp_col_t')}</th>
            <th>${t('hyp_col_p')}</th>
            <th>${t('hyp_col_f2')}</th>
            <th>${t('hyp_col_var')}</th>
            <th>${t('hyp_col_result')}</th>
          </tr>
        </thead>
        <tbody>`;

  rows.forEach(h=>{
    const typeCls=`hyp-type hyp-type-${h.type}`;
    const resultCls=h.result==='confirmed'?'hyp-res-confirmed':'hyp-res-rejected';
    const resultIcon=h.result==='confirmed'?'✓':'✕';
    const betaColor=betaHeatColor(h.beta);
    const betaTxt=(h.beta>=0?'':'−')+Math.abs(h.beta).toFixed(3);
    const pSig=h.pval<0.05;
    const pCell=`<span class="hyp-p ${pSig?'hyp-p-sig':'hyp-p-ns'}">${h.p}</span>`;
    const f2Cell=h.f2==null
      ? '<span class="hyp-dash">—</span>'
      : `<div class="hyp-f2-cell"><span class="hyp-f2-val">${h.f2.toFixed(3)}</span><span class="hyp-f2-tag">${effectLabel(h.f2)}</span></div>`;
    const varCell=h.variance==null
      ? '<span class="hyp-dash">—</span>'
      : `<span class="hyp-var">${h.variance.toFixed(2)}%</span>`;

    const pathParts=h.path.split(/\s*(?:→|->|×)\s*/);
    const pathHtml=pathParts.map((p,i)=>{
      const chip=`<span class="hyp-node">${p}</span>`;
      return i===0?chip:((h.path.includes('×')?'<span class="hyp-op">×</span>':'<span class="hyp-arrow">→</span>')+chip);
    }).join('');

    html+=`
      <tr class="hyp-row" data-hyp="${h.id}">
        <td class="hyp-id"><span class="hyp-id-chip">${h.id}</span></td>
        <td><span class="${typeCls}">${typeLabel(h.type)}</span></td>
        <td class="hyp-path">${pathHtml}</td>
        <td class="hyp-num">${h.sd.toFixed(3)}</td>
        <td class="hyp-num"><span class="hyp-beta" style="background:${betaColor}">${betaTxt}</span></td>
        <td class="hyp-num hyp-t"><span class="hyp-t-chip">${h.t.toFixed(2)}</span></td>
        <td class="hyp-num">${pCell}</td>
        <td class="hyp-num">${f2Cell}</td>
        <td class="hyp-num">${varCell}</td>
        <td><span class="hyp-res ${resultCls}"><span class="hyp-res-icon">${resultIcon}</span>${t(h.result==='confirmed'?'hyp_result_confirmed':'hyp_result_rejected')}</span></td>
      </tr>`;
  });

  html+=`</tbody></table></div>`;
  cont.innerHTML=html;
}

function bindHypothesisFilters(){
  document.querySelectorAll('.hyp-chip[data-hyp-filter]').forEach(btn=>{
    btn.onclick=()=>{
      document.querySelectorAll('.hyp-chip[data-hyp-filter]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.hypFilter=btn.dataset.hypFilter;
      renderHypotheses();
    };
  });
  const search=$('hyp-search');
  if(search){
    search.oninput=e=>{
      state.hypSearch=e.target.value;
      renderHypotheses();
    };
  }
}

/* ================================================================
   VIF TABLE
   ================================================================ */
function vifColor(v){
  if(v>=5)    return {bg:'linear-gradient(135deg,#c0392b,#e74c3c)', text:'#fff',     label:'vif_status_critical',   cls:'vif-status-critical'};
  if(v>=3.3)  return {bg:'linear-gradient(135deg,#e67e22,#f39c12)', text:'#fff',     label:'vif_status_warning',    cls:'vif-status-warning'};
  if(v>=3.0)  return {bg:'linear-gradient(135deg,#f1c40f,#f7dc6f)', text:'#2c3e50',  label:'vif_status_acceptable', cls:'vif-status-acceptable'};
  if(v>=2.0)  return {bg:'linear-gradient(135deg,#27ae60,#58d68d)', text:'#fff',     label:'vif_status_good',       cls:'vif-status-good'};
  return            {bg:'linear-gradient(135deg,#16a085,#1abc9c)', text:'#fff',     label:'vif_status_excellent',  cls:'vif-status-excellent'};
}

function vifBarColor(v){
  if(v>=5)    return '#e74c3c';
  if(v>=3.3)  return '#f39c12';
  if(v>=3.0)  return '#f1c40f';
  if(v>=2.0)  return '#27ae60';
  return '#1abc9c';
}

function renderVIFTable(){
  const cont = document.getElementById('vif-table-container');
  if(!cont) return;

  const V = (state.loaded && state.loaded.vifTable) || FALLBACK_VIF_TABLE;
  const src = (state.loaded && state.loaded.sources && state.loaded.sources.vifTable) || 'fallback';

  const total = V.length;
  const vals = V.map(x=>x.vif);
  const mean = vals.reduce((a,b)=>a+b,0)/total;
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const warnCount = V.filter(x=>x.vif>=3.3 && x.vif<5).length;
  const critCount = V.filter(x=>x.vif>=5).length;

  const kpiEl = document.getElementById('vif-kpi-grid');
  if(kpiEl){
    kpiEl.innerHTML = `
      <div class="vif-kpi vif-kpi-total"><div class="vif-kpi-icon">📊</div><div class="vif-kpi-label">${t('vif_kpi_total')}</div><div class="vif-kpi-value">${total}</div></div>
      <div class="vif-kpi vif-kpi-mean"><div class="vif-kpi-icon">📈</div><div class="vif-kpi-label">${t('vif_kpi_mean')}</div><div class="vif-kpi-value">${mean.toFixed(3)}</div></div>
      <div class="vif-kpi vif-kpi-min"><div class="vif-kpi-icon">✅</div><div class="vif-kpi-label">${t('vif_kpi_min')}</div><div class="vif-kpi-value">${minV.toFixed(3)}</div></div>
      <div class="vif-kpi vif-kpi-max"><div class="vif-kpi-icon">⚠</div><div class="vif-kpi-label">${t('vif_kpi_max')}</div><div class="vif-kpi-value">${maxV.toFixed(3)}</div></div>
      <div class="vif-kpi vif-kpi-warning"><div class="vif-kpi-icon">🔶</div><div class="vif-kpi-label">${t('vif_kpi_warning')}</div><div class="vif-kpi-value">${warnCount}</div></div>
      <div class="vif-kpi vif-kpi-critical"><div class="vif-kpi-icon">🔴</div><div class="vif-kpi-label">${t('vif_kpi_critical')}</div><div class="vif-kpi-value">${critCount}</div></div>
    `;
  }

  const f = state.vifFilter || 'all';
  const s = (state.vifSearch || '').trim().toLowerCase();

  let rows = V.slice();
  if(f === 'warning')       rows = rows.filter(x=>x.vif>=3.3);
  else if(f === 'excellent') rows = rows.filter(x=>x.vif<3.3);
  else if(f !== 'all'){
    if(f === 'QE') rows = rows.filter(x=>x.construct==='QE'||x.construct==='HG×PR'||x.construct==='HG×DT');
    else           rows = rows.filter(x=>x.construct===f);
  }
  if(s) rows = rows.filter(x=>x.id.toLowerCase().includes(s));

  rows.sort((a,b)=>{
    const am = a.id.match(/^Q(\d+)$/i);
    const bm = b.id.match(/^Q(\d+)$/i);
    if(am && bm) return parseInt(am[1]) - parseInt(bm[1]);
    if(am) return -1;
    if(bm) return 1;
    return a.id.localeCompare(b.id);
  });

  if(rows.length === 0){
    cont.innerHTML = `<div class="vif-empty">${t('vif_empty')}</div>`;
    return;
  }

  const badge = src === 'excel'
    ? `<span class="vif-source vif-source-excel">${t('vif_badge_excel')}</span>`
    : `<span class="vif-source vif-source-fallback">${t('vif_badge_fallback')}</span>`;

  const maxForBar = Math.max(5, maxV);

  let html = `
    <div class="vif-hint">
      ${badge}
      <span style="margin-inline-start:12px">💡 ${t('vif_threshold_hint')}</span>
    </div>
    <div class="vif-table-wrap">
      <table class="vif-table">
        <thead>
          <tr>
            <th>${t('vif_col_indicator')}</th>
            <th>${t('vif_col_construct')}</th>
            <th>${t('vif_col_vif')}</th>
            <th>${t('vif_col_bar')}</th>
            <th>${t('vif_col_status')}</th>
          </tr>
        </thead>
        <tbody>`;

  rows.forEach(item=>{
    const c = vifColor(item.vif);
    const barW = Math.min(100, (item.vif / maxForBar) * 100);
    const barC = vifBarColor(item.vif);

    let constructCls = 'vif-construct';
    if(item.construct === 'PR')       constructCls += ' vif-construct-pr';
    else if(item.construct === 'DT')  constructCls += ' vif-construct-dt';
    else if(item.construct === 'SUS') constructCls += ' vif-construct-sus';
    else if(item.construct === 'HG')  constructCls += ' vif-construct-hg';
    else if(item.construct === 'QE')  constructCls += ' vif-construct-qe';
    else if(item.construct && item.construct.startsWith('HG×')) constructCls += ' vif-construct-inter';

    const isHi = state.highlighted === item.id ? 'vif-row-hi' : '';

    html += `
      <tr class="vif-row ${isHi}">
        <td class="vif-cell-ind"><span class="vif-ind-chip">${item.id}</span></td>
        <td class="vif-cell-con"><span class="${constructCls}">${item.construct||'—'}</span></td>
        <td class="vif-cell-val"><span class="vif-val-chip" style="background:${c.bg};color:${c.text}">${item.vif.toFixed(3)}</span></td>
        <td class="vif-cell-bar">
          <div class="vif-bar-track">
            <div class="vif-bar-fill" style="width:${barW}%;background:${barC}"></div>
          </div>
        </td>
        <td class="vif-cell-status">
          <span class="vif-status ${c.cls}">
            ${item.vif < 3.3 ? '✓' : (item.vif < 5 ? '⚠' : '✕')}
            ${t(c.label)}
          </span>
        </td>
      </tr>`;
  });

  html += `</tbody></table></div>`;
  cont.innerHTML = html;
}

function bindVIFTableFilters(){
  document.querySelectorAll('.vif-chip[data-vif-filter]').forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll('.vif-chip[data-vif-filter]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.vifFilter = btn.dataset.vifFilter;
      renderVIFTable();
    };
  });
  const search = document.getElementById('vif-search');
  if(search){
    search.oninput = e => {
      state.vifSearch = e.target.value;
      renderVIFTable();
    };
  }
}

/* ================================================================
   RELIABILITY & VALIDITY
   ================================================================ */
function relLoadingColor(v){
  if(v>=0.85) return {bg:'linear-gradient(135deg,#16a085,#1abc9c)', text:'#fff'};
  if(v>=0.80) return {bg:'linear-gradient(135deg,#27ae60,#58d68d)', text:'#fff'};
  if(v>=0.70) return {bg:'linear-gradient(135deg,#f1c40f,#f7dc6f)', text:'#2c3e50'};
  return              {bg:'linear-gradient(135deg,#e67e22,#f39c12)', text:'#fff'};
}

function relQualityColor(v, threshold){
  if(v>=threshold+0.05) return {bg:'linear-gradient(135deg,#16a085,#1abc9c)', text:'#fff', status:'ok'};
  if(v>=threshold)      return {bg:'linear-gradient(135deg,#27ae60,#58d68d)', text:'#fff', status:'ok'};
  return                       {bg:'linear-gradient(135deg,#e74c3c,#ec7063)', text:'#fff', status:'warn'};
}

function relCrossColor(own_min, cross_max){
  const diff = own_min - cross_max;
  if(diff>=0.25) return {bg:'linear-gradient(135deg,#16a085,#1abc9c)', text:'#fff'};
  if(diff>=0.10) return {bg:'linear-gradient(135deg,#27ae60,#58d68d)', text:'#fff'};
  if(diff>=0)    return {bg:'linear-gradient(135deg,#f1c40f,#f7dc6f)', text:'#2c3e50'};
  return                {bg:'linear-gradient(135deg,#e74c3c,#ec7063)', text:'#fff'};
}

function renderReliabilityTables(){
  const cont = document.getElementById('reliability-container');
  if(!cont) return;

  const R = (state.loaded && state.loaded.reliability) || FALLBACK_RELIABILITY;
  const src = (state.loaded && state.loaded.sources && state.loaded.sources.reliability) || 'fallback';

  const badgeEl = document.getElementById('rel-source-badge');
  if(badgeEl){
    const cls = src==='excel' ? 'vif-source-excel' : 'vif-source-fallback';
    const txt = src==='excel' ? t('rel_source_excel') : t('rel_source_fallback');
    badgeEl.innerHTML = `<span class="vif-source ${cls}">${txt}</span>
      <span style="margin-inline-start:12px">💡 ${t('rel_threshold_note')}</span>`;
  }

  const constructChip = (c)=>{
    const map={
      'PR':'vif-construct-pr','DT':'vif-construct-dt','SUS':'vif-construct-sus',
      'HG':'vif-construct-hg','QE':'vif-construct-qe',
      'HG×PR':'vif-construct-inter','HG×DT':'vif-construct-inter'
    };
    return `<span class="vif-construct ${map[c]||''}">${c}</span>`;
  };

  let html = '';

  /* Table 1 */
  html += `
    <div class="rel-card">
      <div class="rel-card-head">
        <div class="rel-card-icon">۱</div>
        <div><div class="rel-card-title">${t('rel_table1_title')}</div>
        <div class="rel-card-sub">${t('rel_table1_sub')}</div></div>
      </div>
      <div class="rel-table-wrap">
        <table class="rel-table">
          <thead><tr>
            <th>${t('rel_col_construct')}</th><th>${t('rel_col_items')}</th>
            <th>${t('rel_col_loading')}</th><th>${t('rel_col_reliability')}</th>
            <th>${t('rel_col_communal')}</th>
          </tr></thead><tbody>`;

  (R.indicatorReliability||[]).forEach(row=>{
    const cLo = relLoadingColor(row.loading_min);
    const cHi = relLoadingColor(row.loading_max);
    html += `
      <tr class="rel-row">
        <td class="rel-cell-con">${constructChip(row.construct)}<span class="rel-con-label">${row.label}</span></td>
        <td><span class="rel-items-chip">${row.items}</span></td>
        <td><div class="rel-range"><span class="rel-range-chip" style="background:${cLo.bg};color:${cLo.text}">${row.loading_min.toFixed(3)}</span><span class="rel-range-dash">–</span><span class="rel-range-chip" style="background:${cHi.bg};color:${cHi.text}">${row.loading_max.toFixed(3)}</span></div></td>
        <td><div class="rel-range"><span class="rel-range-chip rel-range-sub">${row.rel_min.toFixed(3)}</span><span class="rel-range-dash">–</span><span class="rel-range-chip rel-range-sub">${row.rel_max.toFixed(3)}</span></div></td>
        <td><div class="rel-range"><span class="rel-range-chip rel-range-sub">${row.comm_min.toFixed(3)}</span><span class="rel-range-dash">–</span><span class="rel-range-chip rel-range-sub">${row.comm_max.toFixed(3)}</span></div></td>
      </tr>`;
  });
  html += `</tbody></table></div></div>`;

  /* Table 2 */
  html += `
    <div class="rel-card">
      <div class="rel-card-head">
        <div class="rel-card-icon">۲</div>
        <div><div class="rel-card-title">${t('rel_table2_title')}</div></div>
      </div>
      <div class="rel-table-wrap">
        <table class="rel-table">
          <thead><tr>
            <th>${t('rel_col_construct')}</th><th>${t('rel_col_cronbach')}</th>
            <th>${t('rel_col_rho_a')}</th><th>${t('rel_col_rho_c')}</th>
            <th>${t('rel_col_ave')}</th>
          </tr></thead><tbody>`;

  (R.convergent||[]).forEach(row=>{
    const cCron = relQualityColor(row.cronbach,0.7);
    const cRhoA = relQualityColor(row.rho_a,0.7);
    const cRhoC = relQualityColor(row.rho_c,0.7);
    const cAve  = relQualityColor(row.ave,0.5);
    html += `
      <tr class="rel-row">
        <td class="rel-cell-con">${constructChip(row.construct)}<span class="rel-con-label">${row.label}</span></td>
        <td><span class="rel-val-chip" style="background:${cCron.bg};color:${cCron.text}">${row.cronbach.toFixed(3)}</span></td>
        <td><span class="rel-val-chip" style="background:${cRhoA.bg};color:${cRhoA.text}">${row.rho_a.toFixed(3)}</span></td>
        <td><span class="rel-val-chip" style="background:${cRhoC.bg};color:${cRhoC.text}">${row.rho_c.toFixed(3)}</span></td>
        <td><span class="rel-val-chip" style="background:${cAve.bg};color:${cAve.text}">${row.ave.toFixed(3)}</span></td>
      </tr>`;
  });
  html += `</tbody></table></div>
    <div class="rel-notes">
      <div class="rel-note">📘 ${t('rel_note_rho_a')}</div>
      <div class="rel-note">📘 ${t('rel_note_rho_c')}</div>
    </div></div>`;

  /* Table 3 */
  html += `
    <div class="rel-card">
      <div class="rel-card-head">
        <div class="rel-card-icon">۳</div>
        <div><div class="rel-card-title">${t('rel_table3_title')}</div></div>
      </div>
      <div class="rel-table-wrap">
        <table class="rel-table">
          <thead><tr>
            <th>${t('rel_col_construct')}</th><th>${t('rel_col_items')}</th>
            <th>${t('rel_col_own')}</th><th>${t('rel_col_cross')}</th>
            <th>${t('rel_col_result')}</th>
          </tr></thead><tbody>`;

  (R.crossLoadings||[]).forEach(row=>{
    const cOwn = relLoadingColor(row.own_min);
    const cOwnHi = relLoadingColor(row.own_max);
    const cCross = relCrossColor(row.own_min, row.cross_max);
    const resCls = row.result==='confirmed' ? 'hyp-res-confirmed' : 'hyp-res-rejected';
    const resIcon = row.result==='confirmed' ? '✓' : '✕';
    html += `
      <tr class="rel-row">
        <td class="rel-cell-con">${constructChip(row.construct)}<span class="rel-con-label">${row.label}</span></td>
        <td><span class="rel-items-chip">${row.items}</span></td>
        <td><div class="rel-range"><span class="rel-range-chip" style="background:${cOwn.bg};color:${cOwn.text}">${row.own_min.toFixed(3)}</span><span class="rel-range-dash">–</span><span class="rel-range-chip" style="background:${cOwnHi.bg};color:${cOwnHi.text}">${row.own_max.toFixed(3)}</span></div></td>
        <td><div class="rel-range"><span class="rel-range-chip" style="background:${cCross.bg};color:${cCross.text}">${row.cross_min.toFixed(3)}</span><span class="rel-range-dash">–</span><span class="rel-range-chip" style="background:${cCross.bg};color:${cCross.text}">${row.cross_max.toFixed(3)}</span></div></td>
        <td><span class="hyp-res ${resCls}"><span class="hyp-res-icon">${resIcon}</span>${t(row.result==='confirmed'?'rel_result_confirmed':'rel_result_rejected')}</span></td>
      </tr>`;
  });
  html += `</tbody></table></div></div>`;

  /* Table 4 — Fornell-Larcker */
  const FL = R.fornellLarcker || {constructs:[], labels:[], matrix:[]};
  html += `
    <div class="rel-card">
      <div class="rel-card-head">
        <div class="rel-card-icon">۴</div>
        <div><div class="rel-card-title">${t('rel_table4_title')}</div>
        <div class="rel-card-sub">${t('rel_fl_hint')}</div></div>
      </div>
      <div class="rel-table-wrap">
        <table class="rel-table rel-fl-table">
          <thead><tr><th></th>`;
  (FL.constructs||[]).forEach(c=>{ html += `<th>${c}</th>`; });
  html += `</tr></thead><tbody>`;

  (FL.matrix||[]).forEach((row, i)=>{
    const cName = FL.constructs[i]||'';
    html += `<tr class="rel-row rel-fl-row">
      <td class="rel-cell-con rel-fl-head">${constructChip(cName)}<span class="rel-con-label">${FL.labels[i]||cName}</span></td>`;
    for(let j=0;j<(FL.constructs||[]).length;j++){
      const v = row[j];
      if(v==null){ html += `<td class="rel-fl-empty">—</td>`; }
      else {
        if(i===j){
          html += `<td class="rel-fl-diag"><span class="rel-fl-chip rel-fl-chip-diag">${v.toFixed(3)}</span></td>`;
        } else {
          const diagVal = row[i];
          const ok = diagVal!=null && diagVal > Math.abs(v);
          html += `<td class="rel-fl-cor"><span class="rel-fl-chip ${ok?'rel-fl-chip-ok':'rel-fl-chip-warn'}">${v.toFixed(3)}</span></td>`;
        }
      }
    }
    html += `</tr>`;
  });

  html += `</tbody></table></div></div>`;
  cont.innerHTML = html;
}

/* ================================================================
   SMARTPLS GRAPHICAL OUTPUT
   ================================================================ */
async function extractImagesFromExcel(filename){
  try{
    const buf = await fetchWithFallback(filename, true);
    const wb=XLSX.read(buf,{type:'array',bookFiles:true});
    const out=[];
    if(wb && wb.files){
      for(const file of wb.files){
        if(/\.(png|jpe?g|gif|bmp|tiff)$/i.test(file.name||'')){
          const bytes=file.content||file.data;
          if(!bytes) continue;
          let bin='';
          const u8=new Uint8Array(bytes);
          for(let i=0;i<u8.length;i++) bin+=String.fromCharCode(u8[i]);
          const ext=(file.name.split('.').pop()||'png').toLowerCase();
          const mime='image/'+(ext==='jpg'?'jpeg':ext);
          out.push({name:file.name, dataUrl:`data:${mime};base64,${btoa(bin)}`});
        }
      }
    }
    return out;
  }catch(e){ return []; }
}

async function tryLoadImage(path){
  try{ const blob = await fetchWithFallback(path, false); return URL.createObjectURL(blob); }
  catch(e){ return null; }
}

function drawSmartPLSReplica(containerId, variant){
  const el=document.getElementById(containerId);
  if(!el) return;
  const BG='#ffffff', YELLOW='#FFF200', BLACK='#000000', BLUE='#2E75B6';
  const ORANGE_QE='#F5B041', ORANGE_LINE='#E67E22', WHITE='#ffffff', GREY_TEXT='#333333';
  const constructs={
    PR:  {x:0.095, y:0.55, label:'پیش‌نیازهای کارآفرینی', short:'PR',  r2:0.2883, size:64},
    DT:  {x:0.500, y:0.855, label:'تحول دیجیتال',          short:'DT',  r2:0.2775, size:64},
    SUS: {x:0.905, y:0.55, label:'پایداری کارآفرینی',      short:'SUS', r2:0.4892, size:64},
    HG:  {x:0.500, y:0.145, label:'جغرافیای انسانی',       short:'HG',  r2:null,   size:64},
    QE:  {x:0.170, y:0.275, label:'QE',                   short:'QE',  r2:null,   size:34}
  };
  const indicators=[];
  for(let i=0;i<11;i++) indicators.push({ id:`Q${i+1}`,  x:0.030, y:0.895 - i*0.070, parent:'PR' });
  for(let i=0;i<9;i++)  indicators.push({ id:`Q${12+i}`, x:0.275 + i*0.0575, y:0.975, parent:'DT' });
  for(let i=0;i<10;i++) indicators.push({ id:`Q${21+i}`, x:0.970, y:0.895 - i*0.076, parent:'SUS' });
  for(let i=0;i<16;i++) indicators.push({ id:`Q${31+i}`, x:0.145 + i*0.051,  y:0.022, parent:'HG' });
  const paths=[
    {from:'HG', to:'PR',  beta:0.542, t:11.37, midOff:{x:-0.045, y: 0.015}},
    {from:'HG', to:'DT',  beta:0.274, t:4.21,  midOff:{x:-0.030, y:-0.035}},
    {from:'HG', to:'SUS', beta:0.210, t:3.52,  midOff:{x: 0.040, y: 0.040}},
    {from:'PR', to:'DT',  beta:0.262, t:3.92,  midOff:{x:-0.045, y: 0.010}},
    {from:'PR', to:'SUS', beta:0.230, t:4.34,  midOff:{x:-0.020, y: 0.045}},
    {from:'DT', to:'SUS', beta:0.374, t:7.21,  midOff:{x: 0.020, y: 0.015}}
  ];
  const qePaths=[
    {from:'QE', to:'PR',  beta: 0.032},
    {from:'QE', to:'DT',  beta:-0.105},
    {from:'QE', to:'SUS', beta: 0.026}
  ];
  const traces=[]; const annotations=[];
  indicators.forEach(ind=>{
    const p=constructs[ind.parent]; if(!p) return;
    const dx=p.x-ind.x, dy=p.y-ind.y, len=Math.sqrt(dx*dx+dy*dy)||1;
    const ux=dx/len, uy=dy/len;
    annotations.push({x:p.x-ux*0.048, y:p.y-uy*0.048, ax:ind.x+ux*0.030, ay:ind.y+uy*0.020, xref:'x', yref:'y', axref:'x', ayref:'y', showarrow:true, arrowhead:2, arrowsize:0.75, arrowwidth:0.9, arrowcolor:BLACK, text:''});
  });
  paths.forEach(p=>{
    const a=constructs[p.from], b=constructs[p.to];
    const dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy)||1;
    const ux=dx/len, uy=dy/len;
    const startX=a.x+ux*0.046, startY=a.y+uy*0.046;
    const endX=b.x-ux*0.046, endY=b.y-uy*0.046;
    annotations.push({x:endX, y:endY, ax:startX, ay:startY, xref:'x', yref:'y', axref:'x', ayref:'y', showarrow:true, arrowhead:3, arrowsize:1.35, arrowwidth:2.4, arrowcolor:BLACK, text:''});
    if(variant !== 'measurement'){
      const midX=(startX+endX)/2 + (p.midOff?.x||0);
      const midY=(startY+endY)/2 + (p.midOff?.y||0);
      const txt=(variant==='bootstrap') ? `t = ${p.t.toFixed(2)}` : p.beta.toFixed(3);
      annotations.push({x:midX, y:midY, xref:'x', yref:'y', showarrow:false, text:txt, bgcolor:WHITE, bordercolor:BLACK, borderwidth:1, borderpad:3, font:{size:11.5, color:BLACK, family:'Arial, sans-serif'}, align:'center'});
    }
  });
  qePaths.forEach(p=>{
    const a=constructs[p.from], b=constructs[p.to];
    const dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy)||1;
    const ux=dx/len, uy=dy/len;
    annotations.push({x:b.x-ux*0.048, y:b.y-uy*0.048, ax:a.x+ux*0.030, ay:a.y+uy*0.030, xref:'x', yref:'y', axref:'x', ayref:'y', showarrow:true, arrowhead:3, arrowsize:1.1, arrowwidth:1.6, arrowcolor:ORANGE_LINE, text:''});
  });
  indicators.forEach(ind=>{
    annotations.push({x:ind.x, y:ind.y, xref:'x', yref:'y', showarrow:false, text:ind.id, bgcolor:YELLOW, bordercolor:BLACK, borderwidth:1, borderpad:3, font:{size:10, color:BLACK, family:'Arial Black, Arial, sans-serif'}, align:'center'});
  });
  const cKeys=Object.keys(constructs);
  traces.push({type:'scatter', x:cKeys.map(k=>constructs[k].x), y:cKeys.map(k=>constructs[k].y), mode:'markers', marker:{size:cKeys.map(k=>constructs[k].size), color:cKeys.map(k=> constructs[k].short==='QE' ? ORANGE_QE : BLUE), line:{color:BLACK, width:1.8}}, hoverinfo:'skip', showlegend:false});
  cKeys.forEach(k=>{
    const c=constructs[k];
    if(k==='QE'){ annotations.push({x:c.x, y:c.y, xref:'x', yref:'y', showarrow:false, text:'QE', font:{size:12, color:BLACK, family:'Arial Black'}, align:'center'}); return; }
    annotations.push({x:c.x, y:c.y, xref:'x', yref:'y', showarrow:false, text:c.short, font:{size:13, color:WHITE, family:'Arial Black'}, align:'center'});
    const offY = (k==='DT' || k==='HG') ? 0.065 : -0.055;
    annotations.push({x:c.x, y:c.y + offY, xref:'x', yref:'y', showarrow:false, text:c.label, font:{size:11, color:BLACK, family:'Tahoma, Vazirmatn, sans-serif'}, align:'center'});
    if(c.r2 !== null){
      const r2OffY = (k==='DT' || k==='HG') ? 0.098 : -0.088;
      annotations.push({x:c.x, y:c.y + r2OffY, xref:'x', yref:'y', showarrow:false, text:`R² = ${c.r2.toFixed(3)}`, font:{size:10, color:GREY_TEXT, family:'Tahoma, sans-serif'}, align:'center'});
    }
  });
  Plotly.newPlot(el, traces, {
    paper_bgcolor: BG, plot_bgcolor: BG,
    font:{family:'Arial, Tahoma, Vazirmatn, sans-serif', color:BLACK},
    margin:{l:8, r:8, b:8, t:8}, height: 670, showlegend:false,
    xaxis:{showgrid:false, zeroline:false, showticklabels:false, range:[0,1], fixedrange:true},
    yaxis:{showgrid:false, zeroline:false, showticklabels:false, range:[0,1], fixedrange:true},
    annotations: annotations, hovermode:false
  }, Object.assign({}, PLOTLY_CFG, {displayModeBar:false}));
}

async function renderSmartPLSGraphics(){
  const variants=['measurement','structural','bootstrap'];
  const targets=['smartpls-graphic-1','smartpls-graphic-2','smartpls-graphic-3'];
  const imageFiles=['SmartPLS_Graphical_1.png','SmartPLS_Graphical_2.png','SmartPLS_Graphical_3.png'];
  let excelImages=[];
  try{ excelImages=await extractImagesFromExcel('PLS Algorithm.xlsx'); }catch(e){}
  if(excelImages.length===0){
    try{ excelImages=await extractImagesFromExcel('PLS Predict.xlsx'); }catch(e){}
  }
  for(let i=0;i<3;i++){
    const target=targets[i];
    const el=document.getElementById(target);
    if(!el) continue;
    if(excelImages[i]){
      el.innerHTML=`<div class="smartpls-img-wrap"><img src="${excelImages[i].dataUrl}" alt="SmartPLS Graphic ${i+1}" class="smartpls-img"><div class="smartpls-badge smartpls-badge-ok">${t('smartpls_found_in_excel')}</div></div>`;
      continue;
    }
    const url=await tryLoadImage(imageFiles[i]);
    if(url){
      el.innerHTML=`<div class="smartpls-img-wrap"><img src="${url}" alt="SmartPLS Graphic ${i+1}" class="smartpls-img"><div class="smartpls-badge smartpls-badge-ok">${t('smartpls_found_in_excel')}</div></div>`;
      continue;
    }
    drawSmartPLSReplica(target, variants[i]);
    const badge=document.createElement('div');
    badge.className='smartpls-badge smartpls-badge-warn';
    badge.textContent=t('smartpls_recreated');
    el.appendChild(badge);
  }
}

/* ================================================================
   LAYER 1 — Path Diagram
   ================================================================ */
function drawL1PathDiagram(){
  const pos={HG:[0.08,0.55],PR:[0.40,0.85],DT:[0.65,0.55],SUS:[0.92,0.30],M1:[0.40,0.15],M2:[0.65,0.15]};
  const labels={HG:'جغرافیای انسانی',PR:'پیش‌نیازهای کارآفرینی',DT:'تحول دیجیتال',SUS:'پایداری کارآفرینی',M1:'HG×PR',M2:'HG×DT'};
  const labelsEN={HG:'Human Geography',PR:'Entrepreneurship Prerequisites',DT:'Digital Transformation',SUS:'Entrepreneurship Sustainability',M1:'HG×PR',M2:'HG×DT'};
  const colors={HG:'#3498db',PR:'#e67e22',DT:'#9b59b6',SUS:'#2ecc71',M1:'#e74c3c',M2:'#e74c3c'};
  const L=state.lang==='fa'?labels:labelsEN;
  const get=(p,def)=>{ let f=state.loaded.paths.find(x=>x.Path===p); if(!f && typeof normalizePathKey==='function'){ const k=normalizePathKey(p); f=state.loaded.paths.find(x=>normalizePathKey(x.Path)===k);} return f?f.Original:def; };
  const edges=[
    ['HG','DT',get('HG→DT',0.274)],['HG','SUS',get('HG→SUS',0.210)],
    ['HG','PR',get('HG→PR',0.542)],['PR','DT',get('PR→DT',0.262)],
    ['PR','SUS',get('PR→SUS',0.230)],['DT','SUS',get('DT→SUS',0.374)],
    ['M1','DT',get('HG×PR→DT',0.256)],['M2','SUS',get('HG×DT→SUS',0.177)]
  ];
  const traces=[]; const annotations=[];
  edges.forEach(([s,d,c])=>{
    if(!pos[s] || !pos[d]) return;
    const [sx,sy]=pos[s],[dx,dy]=pos[d];
    annotations.push({x:dx,y:dy,ax:sx,ay:sy,xref:'x',yref:'y',axref:'x',ayref:'y',showarrow:true,arrowhead:3,arrowsize:1.2,arrowwidth:1.2+Math.abs(c)*3,arrowcolor:'#2c3e50',text:''});
    traces.push({type:'scatter',x:[(sx+dx)/2],y:[(sy+dy)/2],mode:'markers+text',marker:{size:38,color:'#fffde7',line:{color:'#f9a825',width:1.5}},text:[c.toFixed(3)],textposition:'middle center',textfont:{size:10,color:'#000'},hovertemplate:HT.template(`<b>${L[s]} → ${L[d]}</b><br>β = <b>${c.toFixed(3)}</b>`),showlegend:false});
  });
  Object.entries(pos).forEach(([n,[x,y]])=>{
    traces.push({type:'scatter',x:[x],y:[y],mode:'markers+text',marker:{size:78,color:colors[n],line:{color:'#fff',width:2}},text:[L[n]],textposition:'middle center',textfont:{size:9,color:'#fff',family:FONT_FA},hovertext:[`<b>${L[n]}</b>`],hoverinfo:'text',showlegend:false});
  });
  Plotly.newPlot('chart-l1-path',traces,plotlyLayout({
    title:{text:'',font:{size:14}},
    xaxis:{showgrid:false,zeroline:false,showticklabels:false,range:[-0.05,1.05]},
    yaxis:{showgrid:false,zeroline:false,showticklabels:false,range:[-0.05,1.05]},
    annotations:annotations,height:620,showlegend:false
  }),PLOTLY_CFG);
}

function drawL1BetaBar(){
  const paths=state.loaded.paths;
  const sorted=[...paths].sort((a,b)=>a.Original-b.Original);
  const markers=sorted.map(p=>{ const sig=(p.CI_low>0)||(p.CI_high<0); return sig?'#2ca02c':'#7f8c8d'; });
  Plotly.newPlot('chart-l1-beta-bar',[{
    type:'bar',orientation:'h',
    y:sorted.map(p=>p.Path),x:sorted.map(p=>p.Original),
    marker:{color:markers,line:{color:'#000',width:0.6}},
    text:sorted.map(p=>p.Original.toFixed(3)),textposition:'outside',textfont:{size:10},
    customdata:sorted.map(p=>[p.Path,p.Original,p.T,p.P]),
    hovertemplate:HT.template(`<b>%{customdata[0]}</b><br>β = <b>%{customdata[1]:.3f}</b><br>T = %{customdata[2]:.2f}<br>p = %{customdata[3]:.2e}`)
  }],plotlyLayout({xaxis:{title:t('col_beta'),gridcolor:themeColors().grid},yaxis:{title:'',tickfont:{size:11}},height:400,margin:{l:130,r:40,t:30,b:50}}),PLOTLY_CFG);
}

function drawL1R2(){
  const r2=state.loaded.r2;
  const constructs=r2.map(r=>r.Construct);
  const Z=[[...r2.map(r=>r.R2)],[...r2.map(r=>r.R2_Adj)]];
  const metrics=['R²','R² Adj'];
  Plotly.newPlot('chart-l1-r2',[{
    type:'surface',x:constructs,y:metrics,z:Z,
    colorscale:'RdYlGn',cmin:0,cmax:0.6,
    colorbar:{title:'R²',thickness:15,x:1.02,tickfont:{color:themeColors().text}},
    text:Z.map((row,j)=>row.map((v,i)=>`سازه: ${constructs[i]}<br>${metrics[j]} = ${v.toFixed(4)}`)),
    hovertemplate:HT.template('%{text}')
  }],plotlyLayout({height:600,scene:{xaxis:{title:t('col_indicator'),gridcolor:themeColors().grid},yaxis:{title:'',gridcolor:themeColors().grid},zaxis:{title:'R²',range:[0,0.6],gridcolor:themeColors().grid},camera:{eye:{x:1.6,y:-1.6,z:1.0}}}}),PLOTLY_CFG);
}

function drawL1F2(){
  const f2=state.loaded.f2;
  const vals=f2.map(x=>x.f2);
  const names=f2.map(x=>x.Path);
  Plotly.newPlot('chart-l1-f2',[{
    type:'bar',x:names,y:vals,
    marker:{color:vals,colorscale:[[0,'#d62728'],[0.35,'#ff7f0e'],[1,'#2ca02c']],cmin:0,cmax:Math.max(...vals),line:{color:'#000',width:0.6},colorbar:{title:'f²',thickness:15}},
    text:vals.map(v=>v.toFixed(3)),textposition:'outside',textfont:{size:9},
    customdata:names.map((p,i)=>[p,vals[i],vals[i]>=0.35?'قوی':vals[i]>=0.15?'متوسط':vals[i]>=0.02?'ضعیف':'ناچیز']),
    hovertemplate:HT.template(`<b>%{customdata[0]}</b><br>f² = <b>%{customdata[1]:.4f}</b><br>اندازه اثر: %{customdata[2]}`)
  }],plotlyLayout({height:520,xaxis:{title:'',tickangle:-40,gridcolor:themeColors().grid},yaxis:{title:'f²',gridcolor:themeColors().grid},margin:{l:60,r:40,t:30,b:150}}),PLOTLY_CFG);
}

function drawL1Quality(){
  const q=state.loaded.quality;
  const constructs=Object.keys(q);
  const metrics=['Cronbach','rho_a','rho_c','AVE'];
  const metricLabels=['آلفای کرونباخ','rho_a','rho_c','AVE'];
  const n_c=constructs.length,n_m=metrics.length;
  const Z=[];
  for(let j=0;j<n_m;j++){ const row=[]; for(let i=0;i<n_c;i++)row.push(q[constructs[i]][metrics[j]]); Z.push(row); }
  const thresholds={Cronbach:0.7,rho_a:0.7,rho_c:0.7,AVE:0.5};
  Plotly.newPlot('chart-l1-quality',[{
    type:'surface',x:constructs,y:metricLabels,z:Z,colorscale:'Viridis',cmin:0.5,cmax:1.0,
    colorbar:{title:'',thickness:15,x:1.02,tickfont:{color:themeColors().text}},
    text:Z.map((row,j)=>row.map((v,i)=>{const m=metrics[j],th=thresholds[m];return `سازه: ${constructs[i]}<br>${metricLabels[j]} = ${v.toFixed(4)}<br>${v>=th?'✅ بالای آستانه':'⚠ زیر آستانه'}`;})),
    hovertemplate:HT.template('%{text}')
  }],plotlyLayout({height:600,scene:{xaxis:{title:'سازه',gridcolor:themeColors().grid},yaxis:{title:'شاخص',gridcolor:themeColors().grid},zaxis:{title:'مقدار',range:[0.4,1.05],gridcolor:themeColors().grid},camera:{eye:{x:1.6,y:-1.6,z:1.0}}}}),PLOTLY_CFG);
}

function drawL1Loadings(){
  const L=state.loaded.loadings;
  const constructs=Object.keys(L);
  const maxInd=Math.max(...constructs.map(c=>Object.keys(L[c]).length));
  const Z=[];
  for(const c of constructs){ const qs=Object.keys(L[c]).sort(); const row=[]; for(let i=0;i<maxInd;i++)row.push(i<qs.length?L[c][qs[i]]:null); Z.push(row); }
  const qLabels=Array.from({length:maxInd},(_,i)=>`Q${i+1}`);
  Plotly.newPlot('chart-l1-loadings',[{
    type:'surface',x:qLabels,y:constructs,z:Z,colorscale:'RdYlGn',cmin:0.6,cmax:1.0,
    colorbar:{title:'بار',thickness:15,x:1.02,tickfont:{color:themeColors().text}},
    text:Z.map((row,i)=>row.map((v,j)=>{if(v==null)return '';const qs=Object.keys(L[constructs[i]]).sort();return `سازه: ${constructs[i]}<br>شاخص: ${qs[j]}<br>بار = ${v.toFixed(3)}<br>${v>=0.7?'✅':'⚠'}`;})),
    hovertemplate:HT.template('%{text}')
  }],plotlyLayout({height:600,scene:{xaxis:{title:'شاخص',gridcolor:themeColors().grid},yaxis:{title:'سازه',gridcolor:themeColors().grid},zaxis:{title:'بار عاملی',range:[0.6,1.0],gridcolor:themeColors().grid},camera:{eye:{x:1.6,y:-1.6,z:1.0}}}}),PLOTLY_CFG);
}

function drawL1VIF(){
  const el=document.getElementById('chart-l1-vif'); if(!el) return;
  const V=state.loaded.vif||FALLBACK_VIF;
  const constructs=Object.keys(V);
  const maxInd=Math.max(...constructs.map(c=>Object.keys(V[c]).length));
  const Z=[];
  for(const c of constructs){
    const qs=Object.keys(V[c]).sort((a,b)=>{const na=parseInt(a.replace(/\D/g,''))||0;const nb=parseInt(b.replace(/\D/g,''))||0;return na-nb;});
    const row=[]; for(let i=0;i<maxInd;i++) row.push(i<qs.length?V[c][qs[i]]:null); Z.push(row);
  }
  const qLabels=Array.from({length:maxInd},(_,i)=>`Q${i+1}`);
  Plotly.newPlot('chart-l1-vif',[{
    type:'surface',x:qLabels,y:constructs,z:Z,
    colorscale:[[0,'#2ca02c'],[0.5,'#ffd700'],[1,'#d62728']],cmin:1,cmax:5,
    colorbar:{title:'VIF',thickness:15,x:1.02,tickfont:{color:themeColors().text}},
    text:Z.map((row,i)=>row.map((v,j)=>{if(v==null)return '';const qs=Object.keys(V[constructs[i]]).sort();let status='✅ عالی';if(v>=5) status='❌ بحرانی';else if(v>=3.3) status='⚠ قابل قبول';else if(v>=3) status='✅ خوب';return `سازه: ${constructs[i]}<br>شاخص: ${qs[j]}<br>VIF = ${v.toFixed(3)}<br>${status}`;})),
    hovertemplate:HT.template('%{text}')
  }],plotlyLayout({height:600,scene:{xaxis:{title:'شاخص',gridcolor:themeColors().grid},yaxis:{title:'سازه',gridcolor:themeColors().grid},zaxis:{title:'VIF',range:[1,5],gridcolor:themeColors().grid},camera:{eye:{x:1.6,y:-1.6,z:1.0}}}}),PLOTLY_CFG);
}

function drawL1HTMT(){
  const h=state.loaded.htmt;
  const labels=h.labels,n=labels.length;
  const mat=Array.from({length:n},()=>Array(n).fill(null));
  Object.entries(h.data).forEach(([key,v])=>{const [i,j]=key.split('-').map(Number);mat[i][j]=v;mat[j][i]=v;});
  const z=mat.map((row,i)=>row.map((v,j)=>j>=i?v:null));
  const txt=z.map(row=>row.map(v=>v!=null?v.toFixed(3):''));
  Plotly.newPlot('chart-l1-htmt',[{
    type:'heatmap',z:z,x:labels,y:labels,
    colorscale:'RdYlGn_r',zmin:0,zmax:1,
    text:txt,texttemplate:'%{text}',textfont:{size:11,color:'#000',family:'Tahoma'},
    hovertemplate:HT.template('HTMT(%{y},%{x}) = <b>%{z:.3f}</b>'),
    colorbar:{title:'HTMT',thickness:15,tickfont:{color:themeColors().text}}
  }],plotlyLayout({height:600,xaxis:{side:'top',gridcolor:themeColors().grid},yaxis:{autorange:'reversed',gridcolor:themeColors().grid},margin:{l:80,r:40,t:80,b:50}}),PLOTLY_CFG);
}

function drawL1Slopes(){
  const x=Array.from({length:100},(_,i)=>-2+4*i/99);
  const get=(p,def)=>{ let f=state.loaded.paths.find(y=>y.Path===p); if(!f && typeof normalizePathKey==='function'){ const k=normalizePathKey(p); f=state.loaded.paths.find(y=>normalizePathKey(y.Path)===k);} return f?f.Original:def; };
  const b1=get('HG→DT',0.274),b2=get('PR→DT',0.262),b3=get('HG×PR→DT',0.256);
  const b4=get('HG→SUS',0.210),b5=get('DT→SUS',0.374),b6=get('HG×DT→SUS',0.177);
  const styles=[['کم (-1SD)',-1,'#e74c3c','dash'],['متوسط',0,'#7f8c8d','solid'],['زیاد (+1SD)',1,'#27ae60','dashdot']];
  const traces=[];
  styles.forEach(([lb,v,c,ls])=>{ traces.push({type:'scatter',x:x,y:x.map(xv=>b1*xv+b2*v+b3*xv*v),mode:'lines',name:lb,legendgroup:lb,line:{color:c,width:2.5,dash:ls},hovertemplate:HT.template(`PR=${v>=0?'+':''}${v}<br>HG=%{x:.2f}<br>DT=%{y:.3f}`),xaxis:'x',yaxis:'y'}); });
  styles.forEach(([lb,v,c,ls])=>{ traces.push({type:'scatter',x:x,y:x.map(xv=>b4*xv+b5*v+b6*xv*v),mode:'lines',name:lb,legendgroup:lb,showlegend:false,line:{color:c,width:2.5,dash:ls},hovertemplate:HT.template(`DT=${v>=0?'+':''}${v}<br>HG=%{x:.2f}<br>SUS=%{y:.3f}`),xaxis:'x2',yaxis:'y2'}); });
  Plotly.newPlot('chart-l1-slopes',traces,plotlyLayout({
    height:520, grid:{rows:1,columns:2,pattern:'independent'},
    xaxis:{title:'HG',gridcolor:themeColors().grid}, yaxis:{title:'DT',gridcolor:themeColors().grid},
    xaxis2:{title:'HG',gridcolor:themeColors().grid}, yaxis2:{title:'SUS',gridcolor:themeColors().grid},
    annotations:[{text:'HG × PR → DT',x:0.22,y:1.08,xref:'paper',yref:'paper',showarrow:false,font:{size:12}},{text:'HG × DT → SUS',x:0.78,y:1.08,xref:'paper',yref:'paper',showarrow:false,font:{size:12}}],
    legend:{x:0,y:1.15,orientation:'h',font:{color:themeColors().text}}
  }),PLOTLY_CFG);
}

function drawL1Raincloud(){
  const latent=state.loaded.latent;
  const nameMap={DT:'تحول دیجیتال',SUS:'پایداری کارآفرینی',PR:'پیش‌نیازها'};
  const nameMapEN={DT:'DT',SUS:'SUS',PR:'PR'};
  const colors={DT:'#9b59b6',SUS:'#2ecc71',PR:'#e67e22'};
  const traces=[];
  Object.entries(latent).forEach(([con,vals])=>{
    const nm=state.lang==='fa'?nameMap[con]:nameMapEN[con];
    traces.push({type:'violin',y:vals,name:nm,line:{color:colors[con]},fillcolor:colors[con],opacity:0.45,box:{visible:true},meanline:{visible:true},points:'all',pointpos:0,jitter:0.3,marker:{size:3.5,color:colors[con],opacity:0.4},hovertemplate:HT.template(`<b>${nm}</b><br>score = %{y:.3f}`)});
  });
  Plotly.newPlot('chart-l1-raincloud',traces,plotlyLayout({height:520,yaxis:{title:'امتیاز استاندارد',gridcolor:themeColors().grid},xaxis:{title:'',gridcolor:themeColors().grid},showlegend:false}),PLOTLY_CFG);
}

function drawL2Forest(){
  const paths=[...state.loaded.paths].sort((a,b)=>a.Original-b.Original);
  const y=paths.map(p=>p.Path), x=paths.map(p=>p.Original);
  const errPlus=paths.map(p=>Math.max(0,p.CI_high-p.Original));
  const errMinus=paths.map(p=>Math.max(0,p.Original-p.CI_low));
  const sig=paths.map(p=>(p.CI_low>0)||(p.CI_high<0));
  const colors=sig.map(s=>s?'#c0392b':'#7f8c8d');
  const cd=paths.map((p,i)=>[p.Path,p.Original,p.CI_low,p.CI_high,p.STDEV,p.T,p.P,sig[i]?t('badge_sig'):t('badge_nosig')]);
  Plotly.newPlot('chart-l2-forest',[{
    type:'scatter',x:x,y:y,
    error_x:{type:'data',symmetric:false,array:errPlus,arrayminus:errMinus,color:'#2c3e50',thickness:2.2,width:7},
    mode:'markers', marker:{size:15,color:'#fff',line:{color:colors,width:3}},
    customdata:cd,
    hovertemplate:HT.template(`<b>%{customdata[0]}</b><br>──────────<br>β = <b>%{customdata[1]:.3f}</b><br>CI 95%% = [%{customdata[2]:.3f} , %{customdata[3]:.3f}]<br>SE = %{customdata[4]:.3f}<br>t = %{customdata[5]:.2f}<br>p = %{customdata[6]:.2e}<br>%{customdata[7]}`),
    showlegend:false
  }],plotlyLayout({height:560,xaxis:{title:'β',gridcolor:themeColors().grid},yaxis:{title:'',tickfont:{size:11},gridcolor:themeColors().grid},shapes:[{type:'line',x0:0,x1:0,y0:-0.5,y1:y.length-0.5,line:{color:'red',dash:'dash',width:1.5}}],margin:{l:140,r:40,t:30,b:50}}),PLOTLY_CFG);
}

function drawL2Sig(){
  const paths=state.loaded.paths;
  const coefs=paths.map(p=>p.Original);
  const tVals=paths.map(p=>Number(p.T));
  const pVals=paths.map(p=>Number(p.P));
  const valid=coefs.map((c,i)=>!isNaN(c) && !isNaN(tVals[i]) && !isNaN(pVals[i]));
  if(!valid.some(v=>v)){ const el=document.getElementById('chart-l2-sig'); if(el) el.innerHTML='<div style="text-align:center;padding:60px;color:#888;">داده‌های T/P در فایل Excel یافت نشد.</div>'; return; }
  const idxValid=valid.map((v,i)=>v?i:-1).filter(i=>i>=0);
  const x=idxValid.map(i=>coefs[i]);
  const y=idxValid.map(i=>tVals[i]);
  const z=idxValid.map(i=>-Math.log10(pVals[i]+1e-10));
  const colors=idxValid.map(i=>pVals[i]<0.05?'#2ca02c':'#d62728');
  const sig=idxValid.map(i=>pVals[i]<0.05);
  const cd=idxValid.map((i,k)=>[paths[i].Path,coefs[i],tVals[i],pVals[i],-Math.log10(pVals[i]+1e-10),sig[k]?t('badge_sig'):t('badge_nosig')]);
  const xRange=[Math.min(...x)-0.1,Math.max(...x)+0.1];
  const yRange=[0,Math.max(...y)*1.15];
  const zRange=[0,Math.max(...z)*1.15];
  Plotly.newPlot('chart-l2-sig',[{
    type:'scatter3d',x:x,y:y,z:z,mode:'markers',
    marker:{size:sig.map(s=>s?11:8),color:colors,line:{color:'#000',width:1.5},symbol:sig.map(s=>s?'circle':'x')},
    customdata:cd,
    hovertemplate:HT.template(`<b>%{customdata[0]}</b><br>──────────<br>β = <b>%{customdata[1]:.3f}</b><br>T = %{customdata[2]:.2f}<br>p = %{customdata[3]:.4f}<br>%{customdata[5]}`),
    showlegend:false
  }],plotlyLayout({height:620,scene:{xaxis:{title:'β',range:xRange,gridcolor:themeColors().grid},yaxis:{title:'T',range:yRange,gridcolor:themeColors().grid},zaxis:{title:'−log10(p)',range:zRange,gridcolor:themeColors().grid},camera:{eye:{x:1.7,y:1.5,z:1.0}},aspectmode:'cube'}}),PLOTLY_CFG);
}

function drawL2Landscape(){
  const paths=state.loaded.paths;
  const coefs=paths.map(p=>p.Original);
  const tVals=paths.map(p=>p.T);
  const names=paths.map(p=>p.Path);
  Plotly.newPlot('chart-l2-landscape',[{
    type:'bar',x:names,y:coefs,
    marker:{color:tVals,colorscale:'RdYlGn',cmin:Math.min(...tVals),cmax:Math.max(...tVals),line:{color:'#000',width:0.6},colorbar:{title:'T',thickness:15,tickfont:{color:themeColors().text}}},
    text:coefs.map((c,i)=>`${c.toFixed(3)}<br>T=${tVals[i].toFixed(1)}`),
    textposition:'outside',textfont:{size:9},
    customdata:paths.map(p=>[p.Path,p.Original,p.T,p.P]),
    hovertemplate:HT.template(`<b>%{customdata[0]}</b><br>β = <b>%{customdata[1]:.3f}</b><br>T = %{customdata[2]:.2f}<br>p = %{customdata[3]:.2e}`)
  }],plotlyLayout({height:520,xaxis:{title:'',tickangle:-40,gridcolor:themeColors().grid},yaxis:{title:'β',gridcolor:themeColors().grid},margin:{l:60,r:40,t:30,b:150}}),PLOTLY_CFG);
}

function activeIndices(){return [...state.selected].sort((a,b)=>a-b);}

function drawL3Q2Columns(targetId){
  const idx=activeIndices();
  const xs=[],ys=[],zs=[];
  idx.forEach(i=>{xs.push(i,i,null);ys.push(0,0,null);zs.push(0,DATA.Q2[i],null);});
  const colors=idx.map(i=>DATA.Q2[i]>0.10?'#2ca02c':(DATA.Q2[i]>0?'#ff7f0e':'#d62728'));
  const sizes=idx.map(i=>state.highlighted===i?16:8);
  const outlines=idx.map(i=>state.highlighted===i?'#ffd700':'#000');
  const traces=[
    {type:'scatter3d',x:xs,y:ys,z:zs,mode:'lines',line:{color:'#7f8c9c',width:9},hoverinfo:'skip',showlegend:false},
    {type:'scatter3d',x:idx,y:idx.map(()=>0),z:idx.map(i=>DATA.Q2[i]),mode:'markers',marker:{size:sizes,color:colors,line:{color:outlines,width:1.2}},customdata:idx.map(i=>[DATA.indicators[i],DATA.Q2[i]]),hovertemplate:HT.template(`<b>${t('col_indicator')}: %{customdata[0]}</b><br>Q² = <b>%{customdata[1]:.4f}</b>`),showlegend:false}
  ];
  const n=DATA.indicators.length;
  traces.push({type:'surface',x:[[-1,n],[-1,n]],y:[[-1,-1],[1,1]],z:[[0.10,0.10],[0.10,0.10]],colorscale:[[0,'rgba(44,160,44,0.20)'],[1,'rgba(44,160,44,0.20)']],showscale:false,hoverinfo:'skip',showlegend:false});
  Plotly.newPlot(targetId,traces,plotlyLayout({
    margin:{l:0,r:0,b:0,t:30},height:600,
    scene:{
      xaxis:{title:'',tickmode:'array',tickvals:idx.filter(i=>i%2===0),ticktext:idx.filter(i=>i%2===0).map(i=>DATA.indicators[i]),tickfont:{size:10},gridcolor:themeColors().grid},
      yaxis:{showticklabels:false,range:[-1,1],gridcolor:themeColors().grid},
      zaxis:{title:'Q²predict',range:[0,Math.max(...DATA.Q2)*1.2],gridcolor:themeColors().grid},
      camera:{eye:{x:1.7,y:-1.6,z:0.9}}
    }
  }),PLOTLY_CFG);
  $(targetId).on('plotly_click',d=>{ if(d.points[0].customdata)selectIndicator(d.points[0].customdata[0]); });
}

function drawL3Stems(){
  const idx=activeIndices();
  const methods=['PLS-SEM','LM','IA'];
  const rmse=[DATA.PLS_RMSE,DATA.LM_RMSE,DATA.IA_RMSE];
  const allVals=idx.flatMap(i=>[DATA.PLS_RMSE[i],DATA.LM_RMSE[i],DATA.IA_RMSE[i]]);
  const vmin=Math.min(...allVals),vmax=Math.max(...allVals);
  const xs=[],ys=[],zs=[];
  for(let j=0;j<3;j++) idx.forEach(i=>{xs.push(i,i,null);ys.push(j,j,null);zs.push(0,rmse[j][i],null);});
  const traces=[{type:'scatter3d',x:xs,y:ys,z:zs,mode:'lines',line:{color:'#7f8c9c',width:5},hoverinfo:'skip',showlegend:false}];
  for(let j=0;j<3;j++){
    traces.push({type:'scatter3d',x:idx,y:idx.map(()=>j),z:idx.map(i=>rmse[j][i]),mode:'markers',name:methods[j],legendgroup:methods[j],marker:{size:6,color:idx.map(i=>plasmaRGB(rmse[j][i],vmin,vmax)),line:{color:'#000',width:1}},customdata:idx.map(i=>[DATA.indicators[i],methods[j],rmse[j][i]]),hovertemplate:HT.template(`<b>${t('col_indicator')}: %{customdata[0]}</b><br>${t('info_best')}: %{customdata[1]}<br>RMSE = <b>%{customdata[2]:.4f}</b>`)});
  }
  Plotly.newPlot('chart-l3-stems',traces,plotlyLayout({
    margin:{l:0,r:0,b:0,t:30},height:600,showlegend:true,
    legend:{x:0,y:1,bgcolor:state.theme==='dark'?'rgba(30,36,51,0.9)':'rgba(255,255,255,0.9)',font:{color:themeColors().text}},
    scene:{
      xaxis:{title:'',tickmode:'array',tickvals:idx.filter(i=>i%2===0),ticktext:idx.filter(i=>i%2===0).map(i=>DATA.indicators[i]),tickfont:{size:10},gridcolor:themeColors().grid},
      yaxis:{title:'',tickmode:'array',tickvals:[0,1,2],ticktext:methods,gridcolor:themeColors().grid},
      zaxis:{title:'RMSE',range:[0,vmax*1.15],gridcolor:themeColors().grid},
      camera:{eye:{x:1.7,y:-1.6,z:0.9}}
    }
  }),PLOTLY_CFG);
  $('chart-l3-stems').on('plotly_click',d=>{ if(d.points[0].customdata)selectIndicator(d.points[0].customdata[0]); });
}

function drawL3Landscape(){
  const idx=activeIndices();
  if(idx.length<2){Plotly.purge('chart-l3-landscape');return;}
  const n=DATA.indicators.length;
  const rmse=[DATA.PLS_RMSE,DATA.LM_RMSE,DATA.IA_RMSE];
  const NX=100,NY=30;
  const xg=Array.from({length:NX},(_,k)=>k*(n-1)/(NX-1));
  const yg=Array.from({length:NY},(_,k)=>k*2/(NY-1));
  const Z=yg.map(y=>xg.map(x=>{
    let s=0;
    for(const i of idx){ for(let j=0;j<3;j++){ const gx=Math.exp(-Math.pow(x-i,2)/(2*0.9*0.9)); const gy=Math.exp(-Math.pow(y-j,2)/(2*0.55*0.55)); s+=rmse[j][i]*gx*gy; } }
    return s;
  }));
  Plotly.newPlot('chart-l3-landscape',[{type:'surface',x:xg,y:yg,z:Z,colorscale:'Turbo',colorbar:{title:'RMSE',len:0.6,tickfont:{color:themeColors().text}},hovertemplate:HT.template(`شاخص ≈ %{x:.1f}<br>روش = %{y:.2f}<br>RMSE = <b>%{z:.4f}</b>`)}],plotlyLayout({margin:{l:0,r:0,b:0,t:30},height:600,scene:{xaxis:{title:'شاخص',gridcolor:themeColors().grid},yaxis:{title:'روش',gridcolor:themeColors().grid},zaxis:{title:'RMSE',gridcolor:themeColors().grid},camera:{eye:{x:1.5,y:-1.7,z:1.1}}}}),PLOTLY_CFG);
}

function drawL3Ridge(){
  const idx=activeIndices();
  const n=DATA.indicators.length;
  const NX=150,NY=22;
  const xg=Array.from({length:NX},(_,k)=>-0.5+k*n/(NX-1));
  const yg=Array.from({length:NY},(_,k)=>-0.6+k*1.2/(NY-1));
  const Z=yg.map(y=>xg.map(x=>{
    let s=0;
    for(const i of idx){ const gx=Math.exp(-Math.pow(x-i,2)/(2*0.55*0.55)); const gy=Math.exp(-Math.pow(y,2)/(2*0.2*0.2)); s+=DATA.Q2[i]*gx*gy; }
    return s;
  }));
  const traces=[{type:'surface',x:xg,y:yg,z:Z,colorscale:'Viridis',colorbar:{title:'Q²',len:0.6,tickfont:{color:themeColors().text}},hovertemplate:HT.template(`شاخص ≈ %{x:.1f}<br>Q² = <b>%{z:.4f}</b>`)}];
  Plotly.newPlot('chart-l3-ridge',traces,plotlyLayout({margin:{l:0,r:0,b:0,t:30},height:600,scene:{xaxis:{title:'شاخص',tickmode:'array',tickvals:idx.filter(i=>i%3===0),ticktext:idx.filter(i=>i%3===0).map(i=>DATA.indicators[i]),gridcolor:themeColors().grid},yaxis:{showticklabels:false,gridcolor:themeColors().grid},zaxis:{title:'Q²predict',gridcolor:themeColors().grid},camera:{eye:{x:1.7,y:-1.5,z:1.0}}}}),PLOTLY_CFG);
}

function drawL3CVPAT(){
  const z=CVPAT.Diff;
  Plotly.newPlot('chart-l3-cvpat',[{
    type:'surface',x:[0,1,2,3],y:[0,1],z:z,colorscale:'RdYlGn',cmin:-0.20,cmax:0.02,
    colorbar:{title:'Δ',thickness:15,x:1.02,tickfont:{color:themeColors().text}},
    text:z.map((row,i)=>row.map((v,j)=>`سازه: ${CVPAT.entities[j]}<br>مقایسه: ${CVPAT.comparisons[i]}<br>Δ = ${v.toFixed(4)}`)),
    hovertemplate:HT.template('%{text}')
  }],plotlyLayout({margin:{l:0,r:0,b:0,t:30},height:600,scene:{xaxis:{title:'',tickmode:'array',tickvals:[0,1,2,3],ticktext:CVPAT.entities,gridcolor:themeColors().grid},yaxis:{title:'',tickmode:'array',tickvals:[0,1],ticktext:CVPAT.comparisons,gridcolor:themeColors().grid},zaxis:{title:'Δ',gridcolor:themeColors().grid},camera:{eye:{x:1.7,y:-1.7,z:0.9}}}}),PLOTLY_CFG);
}

function drawL3Ridgeline(){
  const idx=activeIndices();
  const xg=Array.from({length:90},(_,k)=>-0.35+k*0.4/89);
  const traces=[];
  for(const i of idx){
    const mu=DATA.errors_mean[i],sig=DATA.SD[i]*0.08;
    const z=xg.map(x=>Math.exp(-Math.pow(x-mu,2)/(2*sig*sig)));
    const tt=i/Math.max(1,DATA.indicators.length-1);
    const isHi=state.highlighted===i;
    const color=isHi?'#ffd700':`rgb(${Math.round(253*tt)},${Math.round(231*tt+30)},${Math.round(37*tt+50)})`;
    traces.push({type:'scatter3d',x:xg,y:Array(xg.length).fill(i),z,mode:'lines',line:{color,width:isHi?8:4},name:DATA.indicators[i],showlegend:false,hovertemplate:HT.template(`<b>${DATA.indicators[i]}</b><br>μ=${mu.toFixed(4)}<br>σ=${DATA.SD[i].toFixed(4)}`)});
  }
  Plotly.newPlot('chart-l3-ridgeline',traces,plotlyLayout({margin:{l:0,r:0,b:0,t:30},height:600,scene:{xaxis:{title:'خطا',gridcolor:themeColors().grid},yaxis:{title:'شاخص',tickmode:'array',tickvals:idx.filter(i=>i%3===0),ticktext:idx.filter(i=>i%3===0).map(i=>DATA.indicators[i]),gridcolor:themeColors().grid},zaxis:{title:'PDF',gridcolor:themeColors().grid},camera:{eye:{x:1.5,y:-1.9,z:1.0}}}}),PLOTLY_CFG);
  $('chart-l3-ridgeline').on('plotly_click',d=>{ if(d.points[0]&&d.points[0].data&&d.points[0].data.name)selectIndicator(d.points[0].data.name); });
}

function drawL3Scatter(){
  const idx=activeIndices();
  const lim=[0.7,1.05];
  const x=idx.map(i=>DATA.LM_RMSE[i]);
  const y=idx.map(i=>DATA.PLS_RMSE[i]);
  const q2=idx.map(i=>DATA.Q2[i]);
  const sizes=idx.map(i=>12+22*(DATA.SD[i]-0.72)/(0.9-0.72));
  const outlines=idx.map(i=>state.highlighted===i?'#ffd700':'#000');
  Plotly.newPlot('chart-l3-scatter',[
    {type:'scatter',x,y,mode:'markers',marker:{size:sizes,color:q2,colorscale:'Plasma',colorbar:{title:'Q²',len:0.7,tickfont:{color:themeColors().text}},line:{color:outlines,width:1.5}},customdata:idx.map(i=>[DATA.indicators[i],DATA.Q2[i],DATA.SD[i]]),hovertemplate:HT.template(`<b>%{customdata[0]}</b><br>RMSE LM = %{x:.4f}<br>RMSE PLS = %{y:.4f}<br>Q² = <b>%{customdata[1]:.4f}</b>`)},
    {type:'scatter',x:lim,y:lim,mode:'lines',line:{color:themeColors().text,dash:'dash',width:2},name:'y=x',hoverinfo:'skip'}
  ],plotlyLayout({height:500,xaxis:{title:'RMSE (LM)',range:lim,gridcolor:themeColors().grid},yaxis:{title:'RMSE (PLS)',range:lim,scaleanchor:'x',gridcolor:themeColors().grid}}),PLOTLY_CFG);
  $('chart-l3-scatter').on('plotly_click',d=>{ if(d.points[0].customdata)selectIndicator(d.points[0].customdata[0]); });
}

function drawL3Forest(){
  const colors={'PLS vs IA':'#1f77b4','PLS vs LM':'#ff7f0e'};
  const markers={'PLS vs IA':'circle','PLS vs LM':'square'};
  const traces=CVPAT.comparisons.map((comp,ci)=>({
    type:'scatter',x:CVPAT.Diff[ci],y:[0,1,2,3],mode:'markers',name:comp,
    marker:{size:14,symbol:markers[comp],color:colors[comp],line:{color:'#000',width:1.2}},
    error_x:{type:'data',array:CVPAT.Diff[ci].map((d,i)=>1.96*Math.abs(d)/CVPAT.t[ci][i]),thickness:2,width:6,color:colors[comp]},
    customdata:CVPAT.entities.map((e,i)=>[e,comp,CVPAT.Diff[ci][i],CVPAT.p[ci][i],CVPAT.t[ci][i]]),
    hovertemplate:HT.template(`<b>%{customdata[0]}</b><br>%{customdata[1]}<br>Δ = <b>%{customdata[2]:.4f}</b><br>t = %{customdata[4]:.3f}<br>p = %{customdata[3]:.2e}`)
  }));
  Plotly.newPlot('chart-l3-forest',traces,plotlyLayout({height:460,xaxis:{title:'Δ',gridcolor:themeColors().grid},yaxis:{title:'',tickmode:'array',tickvals:[0,1,2,3],ticktext:CVPAT.entities,gridcolor:themeColors().grid},shapes:[{type:'line',x0:0,x1:0,y0:-0.5,y1:3.5,line:{color:'red',dash:'dash',width:2}}],legend:{bgcolor:state.theme==='dark'?'rgba(30,36,51,0.9)':'rgba(255,255,255,0.9)',font:{color:themeColors().text}}}),PLOTLY_CFG);
}

function drawOverviewPath(){
  const el=$('chart-overview-path');
  if(!el)return;
  const nodes={
    'PR':  {x:-3.5, y:0,    z:0,    color:'#00FFFF'},
    'DT':  {x:0,    y:4,    z:2,    color:'#00FFFF'},
    'SUS': {x:3.5,  y:0,    z:0,    color:'#00FFFF'},
    'HG':  {x:0,    y:-4,   z:-2,   color:'#FF00FF'},
    'QE':  {x:-3.5, y:-3.5, z:-3.5, color:'#FFA500'}
  };
  const hyps=[
    {name:'H1a: PR → DT',s:'PR', e:'DT',  c:'#00BFFF', d:'solid', off:[0,0,0]},
    {name:'H1b: PR → SUS',s:'PR', e:'SUS', c:'#00BFFF', d:'solid', off:[0,0,1.5]},
    {name:'H1c: DT → SUS',s:'DT', e:'SUS', c:'#00BFFF', d:'solid', off:[0,0,0]},
    {name:'H2a: HG → PR',s:'HG', e:'PR',  c:'#00BFFF', d:'solid', off:[0,0,0]},
    {name:'H2b: HG → DT',s:'HG', e:'DT',  c:'#00BFFF', d:'solid', off:[0,0,0]},
    {name:'H2c: HG → SUS',s:'HG', e:'SUS', c:'#00BFFF', d:'solid', off:[0,0,-1.5]},
    {name:'H3a: PR → DT → SUS',s:'PR', e:'SUS', c:'#FFD700', d:'dash',  off:[0,1.5,2.5]},
    {name:'H3b: HG → PR → DT',s:'HG', e:'DT',  c:'#FFD700', d:'dash',  off:[-1.5,0,1.5]},
    {name:'H3c: HG → DT → SUS',s:'HG', e:'SUS', c:'#FFD700', d:'dash',  off:[1.5,0,2.5]},
    {name:'H3d: HG → PR → SUS',s:'HG', e:'SUS', c:'#FFD700', d:'dash',  off:[2.5,0,3.5]},
    {name:'H4a: HG × PR → DT',s:'HG', e:'DT',  c:'#FF69B4', d:'dot',   off:[-2.5,0,-1.5]},
    {name:'H4b: HG × PR → SUS',s:'HG', e:'SUS', c:'#FF69B4', d:'dot',   off:[-2.5,0,-2.5]},
    {name:'H4c: HG × DT → SUS',s:'HG', e:'SUS', c:'#FF69B4', d:'dot',   off:[-1.5,1.5,-2.5]},
    {name:'H6a: HG×PR → DT',s:'HG', e:'DT',  c:'#FF69B4', d:'dot',   off:[-3.5,0,-2.5]},
    {name:'H6b: HG×PR → SUS',s:'HG', e:'SUS', c:'#FF69B4', d:'dot',   off:[-3.5,0,-3.5]},
    {name:'H6c: HG×DT → SUS',s:'HG', e:'SUS', c:'#FF69B4', d:'dot',   off:[-2.5,1.5,-3.5]},
    {name:'H5a: QE → PR',s:'QE', e:'PR',  c:'#32CD32', d:'solid', off:[0,0,0]},
    {name:'H5b: QE → DT',s:'QE', e:'DT',  c:'#32CD32', d:'solid', off:[1.5,0,1.5]},
    {name:'H5c: QE → SUS',s:'QE', e:'SUS', c:'#32CD32', d:'solid', off:[2.5,0,2.5]},
    {name:'H3e: HG → PR → DT → SUS',s:'HG', e:'SUS', c:'#FF4500', d:'dash',  off:[3.5,0,4.5]}
  ];
  function bezier(p1,p2,off){
    const N=50,x=[],y=[],z=[];
    const mx=(p1.x+p2.x)/2+off[0], my=(p1.y+p2.y)/2+off[1], mz=(p1.z+p2.z)/2+off[2];
    for(let i=0;i<N;i++){
      const tt=i/(N-1);
      x.push((1-tt)*(1-tt)*p1.x + 2*(1-tt)*tt*mx + tt*tt*p2.x);
      y.push((1-tt)*(1-tt)*p1.y + 2*(1-tt)*tt*my + tt*tt*p2.y);
      z.push((1-tt)*(1-tt)*p1.z + 2*(1-tt)*tt*mz + tt*tt*p2.z);
    }
    return {x,y,z};
  }
  const traces=[];
  hyps.forEach(h=>{
    const p1=nodes[h.s],p2=nodes[h.e];
    if(!p1||!p2)return;
    const {x,y,z}=bezier(p1,p2,h.off);
    traces.push({type:'scatter3d',x,y,z,mode:'lines',line:{color:h.c,width:8,dash:h.d},name:h.name,hovertemplate:`<b>${h.name}</b><extra></extra>`,opacity:0.9,showlegend:false});
  });
  Object.entries(nodes).forEach(([n,c])=>{
    traces.push({type:'scatter3d',x:[c.x],y:[c.y],z:[c.z],mode:'markers+text',marker:{size:18,color:c.color,line:{color:'#fff',width:2}},text:[n],textposition:'top center',textfont:{size:18,color:'#fff',family:'Arial Black'},name:n,hovertemplate:`<b>متغیر: ${n}</b><extra></extra>`,showlegend:false});
  });
  const gridAxis={showbackground:true,backgroundcolor:'rgba(0,0,0,0.1)',showgrid:true,gridcolor:'rgba(0,255,255,0.2)',gridwidth:1,zeroline:true,zerolinecolor:'rgba(0,255,255,0.5)',showticklabels:false,title:''};
  Plotly.newPlot(el,traces,{
    paper_bgcolor:'rgb(5,5,10)',plot_bgcolor:'rgb(5,5,10)',
    font:{family:FONT_FA,color:'#fff'},
    margin:{l:0,r:0,b:0,t:30},height:640,showlegend:false,
    scene:{xaxis:Object.assign({},gridAxis),yaxis:Object.assign({},gridAxis),zaxis:Object.assign({},gridAxis),bgcolor:'rgb(5,5,10)',camera:{eye:{x:1.6,y:1.6,z:1.6},up:{x:0,y:1,z:0}},aspectmode:'cube'}
  },PLOTLY_CFG);
}

function renderKPIs(){
  const paths=state.loaded.paths;
  const sig=paths.filter(p=>p.P<0.05).length;
  const r2=state.loaded.r2;
  const maxR2=Math.max(...r2.map(r=>r.R2));
  const q=state.loaded.quality;
  const minAVE=Math.min(...Object.values(q).map(v=>v.AVE));
  const idx=activeIndices();
  const q2=idx.map(i=>DATA.Q2[i]);
  const strong=q2.filter(v=>v>0.10).length;
  const mid=q2.filter(v=>v>0&&v<=0.10).length;
  const weak=q2.filter(v=>v<=0).length;
  $('kpi-grid').innerHTML=`
    <div class="kpi-card purple"><div class="kpi-label">${t('kpi_paths')}</div><div class="kpi-value">${sig}/${paths.length}</div></div>
    <div class="kpi-card green"><div class="kpi-label">${t('kpi_r2_max')}</div><div class="kpi-value">${maxR2.toFixed(3)}</div></div>
    <div class="kpi-card orange"><div class="kpi-label">${t('kpi_ave_min')}</div><div class="kpi-value">${minAVE.toFixed(3)}</div></div>
    <div class="kpi-card"><div class="kpi-label">${t('kpi_constructs')}</div><div class="kpi-value">${Object.keys(q).length}</div></div>
  `;
  if($('kpi-grid-l3')){
    $('kpi-grid-l3').innerHTML=`
      <div class="kpi-card green"><div class="kpi-label">${t('kpi_strong')}</div><div class="kpi-value">${strong}</div></div>
      <div class="kpi-card orange"><div class="kpi-label">${t('kpi_mid')}</div><div class="kpi-value">${mid}</div></div>
      <div class="kpi-card red"><div class="kpi-label">${t('kpi_weak')}</div><div class="kpi-value">${weak}</div></div>
      <div class="kpi-card"><div class="kpi-label">${t('kpi_mean_q2')}</div><div class="kpi-value">${(q2.reduce((a,b)=>a+b,0)/(q2.length||1)).toFixed(3)}</div></div>
    `;
  }
}

function renderTable(){
  const idx=activeIndices().filter(i=>DATA.indicators[i].toLowerCase().includes(state.searchTerm.toLowerCase()));
  const arrow=(c)=>state.sortCol===c?(state.sortAsc?' sort-asc':' sort-desc'):'';
  let html=`<table class="data-table"><thead><tr>
    <th class="${arrow('ind')}" onclick="setSort('ind')">${t('col_indicator')}</th>
    <th class="${arrow('q2')}" onclick="setSort('q2')">${t('col_q2')}</th>
    <th class="${arrow('pls')}" onclick="setSort('pls')">${t('col_pls')}</th>
    <th class="${arrow('lm')}" onclick="setSort('lm')">${t('col_lm')}</th>
    <th class="${arrow('ia')}" onclick="setSort('ia')">${t('col_ia')}</th>
    <th>${t('col_status')}</th></tr></thead><tbody>`;
  for(const i of idx){
    const qv=DATA.Q2[i];
    const badge=qv>0.10?`<span class="badge badge-good">${t('badge_good')}</span>`:qv>0?`<span class="badge badge-mid">${t('badge_mid')}</span>`:`<span class="badge badge-bad">${t('badge_bad')}</span>`;
    const cls=state.highlighted===DATA.indicators[i]?'selected':'';
    html+=`<tr class="${cls}" onclick="selectIndicator('${DATA.indicators[i]}')">
      <td><b>${DATA.indicators[i]}</b></td>
      <td>${qv.toFixed(4)}</td>
      <td>${DATA.PLS_RMSE[i].toFixed(4)}</td>
      <td>${DATA.LM_RMSE[i].toFixed(4)}</td>
      <td>${DATA.IA_RMSE[i].toFixed(4)}</td>
      <td>${badge}</td></tr>`;
  }
  html+='</tbody></table>';
  $('data-table-wrapper').innerHTML=html;
}

function setSort(c){ if(state.sortCol===c)state.sortAsc=!state.sortAsc; else{state.sortCol=c;state.sortAsc=true;} renderTable(); }
function selectIndicator(name){ state.highlighted=state.highlighted===name?null:name; renderAll(); if(state.highlighted)showInfoPanel(state.highlighted); else $('info-panel').classList.add('hidden'); }

function showInfoPanel(name){
  const i=DATA.indicators.indexOf(name);
  if(i<0)return;
  const best=Math.min(DATA.PLS_RMSE[i],DATA.LM_RMSE[i],DATA.IA_RMSE[i]);
  const bestM=best===DATA.PLS_RMSE[i]?'PLS':best===DATA.LM_RMSE[i]?'LM':'IA';
  $('info-title').textContent=name;
  $('info-body').innerHTML=`
    <div class="row"><span class="label">${t('info_q2')}</span><span class="value">${DATA.Q2[i].toFixed(4)}</span></div>
    <div class="row"><span class="label">${t('info_pls')}</span><span class="value">${DATA.PLS_RMSE[i].toFixed(4)}</span></div>
    <div class="row"><span class="label">${t('info_lm')}</span><span class="value">${DATA.LM_RMSE[i].toFixed(4)}</span></div>
    <div class="row"><span class="label">${t('info_ia')}</span><span class="value">${DATA.IA_RMSE[i].toFixed(4)}</span></div>
    <div class="row"><span class="label">${t('info_best')}</span><span class="value" style="color:#27ae60">${bestM}</span></div>`;
  $('info-panel').classList.remove('hidden');
}

$('info-close').onclick=()=>$('info-panel').classList.add('hidden');

function renderMultiSelect(){
  const dd=$('ms-dropdown');
  let html='';
  DATA.indicators.forEach((ind,i)=>{
    html+=`<label class="ms-item"><input type="checkbox" data-idx="${i}" ${state.selected.has(i)?'checked':''}><span>${ind}</span></label>`;
  });
  html+=`<div class="ms-actions"><button onclick="selectAllInd()">${t('select_all')}</button><button onclick="selectNoneInd()">${t('select_none')}</button></div>`;
  dd.innerHTML=html;
  dd.querySelectorAll('input[type=checkbox]').forEach(cb=>{
    cb.onchange=()=>{
      const i=+cb.dataset.idx;
      if(cb.checked)state.selected.add(i);else state.selected.delete(i);
      renderAll();
    };
  });
}
function selectAllInd(){DATA.indicators.forEach((_,i)=>state.selected.add(i));renderAll();}
function selectNoneInd(){state.selected.clear();renderAll();}
$('ms-toggle').onclick=e=>{e.stopPropagation();$('ms-dropdown').classList.toggle('open');};
document.addEventListener('click',e=>{if(!e.target.closest('.multi-select'))$('ms-dropdown').classList.remove('open');});

/* ================================================================
   Excel Viewer — پنج فایل
   ================================================================ */
function renderExcelViewer(){
  const container=document.getElementById('excel-viewer-container');
  if(!container) return;
  const files=[
    {name:'Bootstrapping.xlsx',    label:t('excel_bootstrap'),        type:'excel', icon:'📊'},
    {name:'PLS Algorithm.xlsx',    label:t('excel_pls_algo'),         type:'excel', icon:'📊'},
    {name:'PLS Predict.xlsx',      label:t('excel_pls_predict'),      type:'excel', icon:'📊'},
    {name:'پرسشنامه.docx',         label:t('excel_questionnaire'),    type:'docx',  icon:'📄'},
    {name:'educational_data.sav',  label:t('excel_educational_data'), type:'sav',   icon:'🗂'}
  ];
  let html=`<h4>${t('excel_viewer_title')}</h4>`;
  if(isFileProtocol()){
    html += `<div class="file-protocol-warning">
      ⚠ <b>هشدار محیط:</b> داشبورد در محیط <code>file://</code> باز شده است. برای دسترسی به فایل‌ها، داشبورد را از طریق یک وب‌سرور محلی باز کنید.
      <div style="margin-top:8px;font-size:11.5px;color:var(--text-muted)">
        مثال: در ترمینال پوشهٔ پروژه اجرا کنید: <code style="background:var(--bg2);padding:2px 6px;border-radius:4px">python -m http.server 8000</code> — سپس باز کنید: <code>http://localhost:8000</code>
      </div>
    </div>`;
  }
  html += `<div class="excel-file-list">`;
  files.forEach(f=>{
    let previewBtn = '';
    if(f.type === 'excel') previewBtn = `<button onclick="previewExcel('${f.name}')">${t('excel_preview_btn')}</button>`;
    else if(f.type === 'docx') previewBtn = `<button onclick="previewDocx('${f.name}')">${t('excel_preview_btn')}</button>`;

    html+=`<div class="excel-file-item excel-file-${f.type}">
      <div class="file-name"><span class="file-icon file-icon-${f.type}">${f.icon}</span> ${f.label} <span class="excel-status">(${f.name})</span></div>
      <div class="file-actions">
        ${previewBtn}
        <button class="download" onclick="downloadExcel('${f.name}')">${t('excel_download_btn')}</button>
      </div>
    </div>`;
  });
  html+='</div><div id="excel-preview-area"></div>';
  container.innerHTML=html;
}

async function downloadExcel(filename){
  try{
    const blob = await fetchWithFallback(filename, false);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  }catch(e){
    try{
      const a = document.createElement('a');
      a.href = filename; a.download = filename;
      a.rel = 'noopener'; a.target = '_blank';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }catch(err2){
      const hint = fileAccessHint();
      alert((hint ? hint + '\n\n' : '') + t('excel_not_found') + '\n' + filename);
    }
  }
}

async function previewExcel(filename){
  const area=document.getElementById('excel-preview-area');
  if(!area) return;
  area.innerHTML=`<div style="padding:20px;text-align:center;color:var(--text-muted)">${t('excel_loading')}</div>`;
  try{
    const buf = await fetchWithFallback(filename, true);
    const wb=XLSX.read(buf,{type:'array'});
    window._excelWB=wb; window._excelFile=filename;
    renderSheetPreview(filename, wb.SheetNames[0]);
  }catch(e){ showFileError(area, filename, e); }
}

async function previewDocx(filename){
  const area=document.getElementById('excel-preview-area');
  if(!area) return;
  area.innerHTML=`<div style="padding:20px;text-align:center;color:var(--text-muted)">${t('excel_loading')}</div>`;
  try{
    if(typeof mammoth === 'undefined') throw new Error('Mammoth.js not loaded');
    const buf = await fetchWithFallback(filename, true);
    const result = await mammoth.convertToHtml({arrayBuffer: buf});
    area.innerHTML = `
      <div class="docx-preview">
        <div class="docx-preview-head">
          <span class="docx-preview-icon">📄</span>
          <span class="docx-preview-title">${t('excel_questionnaire')}</span>
          <span class="docx-preview-file">${filename}</span>
        </div>
        <div class="docx-preview-body">${result.value || '<p style="text-align:center;color:var(--text-muted)">محتوایی یافت نشد</p>'}</div>
      </div>`;
  }catch(e){ showFileError(area, filename, e); }
}

function renderSheetPreview(filename, sheetName){
  const area=document.getElementById('excel-preview-area');
  if(!area) return;
  const wb=window._excelWB; if(!wb) return;
  let sheetTabs='';
  if(wb.SheetNames.length>1){
    sheetTabs='<div style="margin-bottom:10px;display:flex;gap:6px;flex-wrap:wrap">'+
      wb.SheetNames.map(n=>{
        const active=n===sheetName;
        return `<button onclick="renderSheetPreview('${filename.replace(/'/g,"\\'")}','${n.replace(/'/g,"\\'")}')" style="padding:5px 12px;border-radius:6px;border:1px solid var(--border);background:${active?'var(--accent)':'var(--bg2)'};color:${active?'#fff':'var(--text)'};cursor:pointer;font-size:11.5px;font-family:inherit">${n}</button>`;
      }).join('')+'</div>';
  }
  const ws=wb.Sheets[sheetName];
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
  const display=rows.slice(0,40);
  let tableHtml='<div class="excel-preview"><table>';
  display.forEach((row,i)=>{
    tableHtml+='<tr>';
    row.forEach(cell=>{
      const val=cell==null?'':String(cell);
      if(i===0) tableHtml+=`<th>${val}</th>`; else tableHtml+=`<td>${val}</td>`;
    });
    tableHtml+='</tr>';
  });
  tableHtml+='</table></div>';
  tableHtml+=`<div style="margin-top:8px;font-size:11px;color:var(--text-muted)">${t('excel_showing_rows')} ${Math.min(40,rows.length)} / ${rows.length} — Sheet: <b>${sheetName}</b></div>`;
  area.innerHTML=sheetTabs+tableHtml;
}

function renderChartsForActiveTab(){
  const active = document.querySelector('.page.active');
  if(!active) return;
  const id = active.id.replace('section-','');
  document.querySelectorAll('.plot').forEach(el => {
    if(el.children && el.children.length) { try { Plotly.purge(el); } catch(e){} }
  });
  try{
    switch(id){
      case 'overview':          drawOverviewPath(); break;
      case 'descriptive':       renderDescriptiveStatistics(); break;
      case 'l1-path':           drawL1PathDiagram(); drawL1BetaBar(); break;
      case 'l1-quality':        drawL1R2(); drawL1F2(); drawL1Quality(); break;
      case 'l1-loadings':       drawL1Loadings(); drawL1VIF(); break;
      case 'l1-vif-table':      renderVIFTable(); break;
      case 'l1-reliability':    renderReliabilityTables(); break;
      case 'l1-htmt':           drawL1HTMT(); break;
      case 'l1-moderation':     drawL1Slopes(); drawL1Raincloud(); break;
      case 'l2-forest':         drawL2Forest(); break;
      case 'l2-significance':   drawL2Sig(); break;
      case 'l2-landscape':      drawL2Landscape(); break;
      case 'l3-overview':       drawL3Q2Columns('chart-l3-q2'); break;
      case 'l3-charts':
        drawL3Q2Columns('chart-l3-q2-2');
        drawL3Stems(); drawL3Landscape(); drawL3Ridge();
        drawL3CVPAT(); drawL3Ridgeline(); drawL3Scatter(); drawL3Forest();
        break;
      case 'hypotheses':        renderHypotheses(); break;
      case 'smartpls-graphical': renderSmartPLSGraphics(); break;
    }
  }catch(e){ console.error('Chart draw error:', e); }
}

function renderAll(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.innerHTML=t(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{el.placeholder=t(el.dataset.i18nPh);});
  document.documentElement.lang=state.lang;
  document.documentElement.dir=state.lang==='fa'?'rtl':'ltr';
  document.documentElement.dataset.theme=state.theme;
  if(!state.loaded)return;
  renderKPIs();
  renderMultiSelect();
  renderTable();
  updateStatus();
  renderChartsForActiveTab();
  renderExcelViewer();
  bindHypothesisFilters();
  bindVIFTableFilters();
  renderReliabilityTables();
}

function updateStatus(){
  const n=state.selected.size,total=DATA.indicators.length;
  const txt=n===total?`${t('status_ready')} · ${total}`:`${t('status_filtered')} · ${n}/${total}`;
  $('status-text').textContent=txt;
  $('status-dot').style.background=n===total?'#27ae60':'#f39c12';
  $('ms-label').textContent=n===total?t('all_indicators'):`${n} ${t('indicators_selected')}`;
}

function downloadCSV(){
  let csv='Layer,Entity,Metric,Value1,Value2,Value3\n';
  DATA.indicators.forEach((ind,i)=>{
    csv+=`PLS_Predict,${ind},Q2,${DATA.Q2[i]},,\n`;
    csv+=`PLS_Predict,${ind},RMSE_PLS,${DATA.PLS_RMSE[i]},,\n`;
    csv+=`PLS_Predict,${ind},RMSE_LM,${DATA.LM_RMSE[i]},,\n`;
    csv+=`PLS_Predict,${ind},RMSE_IA,${DATA.IA_RMSE[i]},,\n`;
  });
  state.loaded.paths.forEach(p=>{ csv+=`Bootstrapping,${p.Path},Path,${p.Original},${p.T},${p.P}\n`; });
  state.loaded.r2.forEach(r=>{ csv+=`PLS_Algorithm,${r.Construct},R2,${r.R2},${r.R2_Adj},\n`; });
  state.loaded.f2.forEach(f=>{ csv+=`PLS_Algorithm,${f.Path},f2,${f.f2},,\n`; });
  if(state.loaded.vif){
    Object.entries(state.loaded.vif).forEach(([c,vals])=>{ Object.entries(vals).forEach(([q,v])=>{ csv+=`PLS_Algorithm,${c},VIF_${q},${v},,\n`; }); });
  }
  if(state.loaded.vifTable){
    state.loaded.vifTable.forEach(item=>{ csv+=`PLS_Algorithm,${item.id},VIF_${item.construct||''},${item.vif},,\n`; });
  }
  if(state.loaded.reliability){
    const R=state.loaded.reliability;
    if(R.convergent){ R.convergent.forEach(row=>{
      csv+=`Reliability,${row.construct},Cronbach,${row.cronbach},,\n`;
      csv+=`Reliability,${row.construct},rho_a,${row.rho_a},,\n`;
      csv+=`Reliability,${row.construct},rho_c,${row.rho_c},,\n`;
      csv+=`Reliability,${row.construct},AVE,${row.ave},,\n`;
    }); }
  }
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='smartpls_data.csv'; a.click();
}

$('lang-btn').onclick=()=>{ state.lang=state.lang==='fa'?'en':'fa'; $('lang-btn').textContent=state.lang==='fa'?'EN':'FA'; renderAll(); };
$('theme-btn').onclick=()=>{ state.theme=state.theme==='dark'?'light':'dark'; $('theme-btn').textContent=state.theme==='dark'?'🌙':'☀️'; renderAll(); };
$('print-btn').onclick=()=>window.print();

document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    const sec=$('section-'+btn.dataset.section);
    if(sec)sec.classList.add('active');
    const inL3=['l3-overview','l3-charts'].includes(btn.dataset.section);
    $('filter-bar').style.display=inL3?'flex':'none';
    renderChartsForActiveTab();
    renderExcelViewer();
    bindHypothesisFilters();
    bindVIFTableFilters();
    setTimeout(()=>window.dispatchEvent(new Event('resize')),100);
  };
});

$('table-search').oninput=e=>{state.searchTerm=e.target.value;renderTable();};
$('reset-filter').onclick=()=>{ state.selected=new Set(DATA.indicators.map((_,i)=>i)); state.highlighted=null; renderAll(); $('info-panel').classList.add('hidden'); };

window.addEventListener('DOMContentLoaded',async()=>{
  $('theme-btn').textContent='🌙';
  state.loaded={
    paths:FALLBACK_PATHS, r2:FALLBACK_R2, f2:FALLBACK_F2,
    loadings:FALLBACK_LOADINGS, quality:FALLBACK_QUALITY,
    vif:FALLBACK_VIF, vifTable:FALLBACK_VIF_TABLE,
    reliability:FALLBACK_RELIABILITY, descriptive:FALLBACK_DESCRIPTIVE,
    htmt:FALLBACK_HTMT, latent:FALLBACK_LATENT,
    sources:{}
  };
  renderAll();
  const src=$('data-source');
  src.textContent=t('ds_loading');
  try{
    const loaded=await loadAllData();
    const useExcel=Object.values(loaded.sources).some(s=>s==='excel');
    if(useExcel){
      state.loaded=loaded;
      src.textContent=t('ds_loaded');
      src.classList.add('loaded');
      renderAll();
    }else{
      src.textContent=t('ds_fallback');
    }
  }catch(e){
    console.log('Excel load failed:',e);
    src.textContent=t('ds_fallback');
  }
});