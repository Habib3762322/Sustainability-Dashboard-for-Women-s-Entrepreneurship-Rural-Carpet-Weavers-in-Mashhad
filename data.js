/* ================================================================
   داده‌ها و ترجمه‌ها — نسخهٔ نهایی
   شامل: DATA, CVPAT, HYPOTHESES, VIF, RELIABILITY, DESCRIPTIVE
   ================================================================ */

const DATA = {
  indicators: ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8","Q9","Q10","Q11",
               "Q12","Q13","Q14","Q15","Q16","Q17","Q18","Q19","Q20",
               "Q21","Q22","Q23","Q24","Q25","Q26","Q27","Q28","Q29","Q30"],
  Q2:       [0.2248,0.1700,0.2110,0.2474,0.1446,0.1952,0.1532,0.2227,0.2043,0.1827,0.2435,
             0.1177,0.0901,0.0935,0.1158,0.1217,0.1440,0.0831,0.1337,0.1016,
             0.1717,0.1966,0.1878,0.1498,0.1506,0.1391,0.1028,0.0972,0.1587,0.1754],
  PLS_RMSE: [0.8245,0.8922,0.8437,0.8367,0.8255,0.9004,0.8439,0.8454,0.8176,0.8636,0.7788,
             0.8233,0.8403,0.8182,0.8270,0.8237,0.7957,0.8015,0.8244,0.8434,
             0.7864,0.7239,0.8073,0.7854,0.8062,0.7889,0.8232,0.8339,0.8294,0.7849],
  LM_RMSE:  [0.8647,0.9274,0.8760,0.8752,0.8566,0.9324,0.8810,0.8650,0.8575,0.8964,0.8044,
             0.8624,0.8701,0.8493,0.8605,0.8446,0.8175,0.8269,0.8484,0.8770,
             0.8235,0.7561,0.8487,0.8299,0.8314,0.8077,0.8481,0.8715,0.8516,0.8090],
  IA_RMSE:  [0.9364,0.9794,0.9499,0.9644,0.8926,1.0037,0.9170,0.9589,0.9166,0.9553,0.8954,
             0.8766,0.8809,0.8594,0.8795,0.8789,0.8600,0.8370,0.8858,0.8898,
             0.8641,0.8077,0.8958,0.8518,0.8747,0.8503,0.8691,0.8777,0.9043,0.8644],
  SD:       [0.8240,0.8918,0.8433,0.8362,0.8252,0.8999,0.8435,0.8449,0.8172,0.8632,0.7783,
             0.8228,0.8399,0.8177,0.8265,0.8232,0.7953,0.8011,0.8240,0.8430,
             0.7809,0.7194,0.8018,0.7803,0.8011,0.7843,0.8178,0.8295,0.8243,0.7794],
  errors_mean: [-0.0281,-0.0283,-0.0279,-0.0291,-0.0240,-0.0296,-0.0260,-0.0285,-0.0275,-0.0277,-0.0260,
                -0.0288,-0.0272,-0.0273,-0.0279,-0.0283,-0.0257,-0.0249,-0.0279,-0.0279,
                -0.0930,-0.0810,-0.0942,-0.0890,-0.0903,-0.0855,-0.0937,-0.0851,-0.0922,-0.0928],
};

const CVPAT = {
  entities: ["DT","SUS","PR","Overall"],
  comparisons: ["PLS vs IA","PLS vs LM"],
  Diff: [[-0.0848,-0.1145,-0.1782,-0.1289],[-0.0483,-0.0500,-0.0570,-0.0521]],
  t:    [[2.9513,3.0582,4.3619,4.4375],[3.1766,2.3250,3.9073,4.3437]],
  p:    [[0.00347,0.00247,1.89e-5,1.37e-5],[0.00168,0.0209,1.20e-4,2.04e-5]]
};

const HYPOTHESES = [
  {id:'H1a', type:'direct',      path:'PR → DT',              sd:0.067, beta:0.262,  t:3.92,  p:'< 0.001', pval:0.0001, f2:0.068, variance:null,  result:'confirmed'},
  {id:'H1b', type:'direct',      path:'PR → SUS',             sd:0.053, beta:0.230,  t:4.34,  p:'< 0.001', pval:0.0001, f2:0.066, variance:null,  result:'confirmed'},
  {id:'H1c', type:'direct',      path:'DT → SUS',             sd:0.052, beta:0.374,  t:7.21,  p:'< 0.001', pval:0.0001, f2:0.210, variance:null,  result:'confirmed'},
  {id:'H2a', type:'direct',      path:'HG → PR',              sd:0.048, beta:0.542,  t:11.37, p:'< 0.001', pval:0.0001, f2:0.403, variance:null,  result:'confirmed'},
  {id:'H2b', type:'direct',      path:'HG → DT',              sd:0.065, beta:0.274,  t:4.21,  p:'< 0.001', pval:0.0001, f2:0.072, variance:null,  result:'confirmed'},
  {id:'H2c', type:'direct',      path:'HG → SUS',             sd:0.059, beta:0.210,  t:3.52,  p:'< 0.001', pval:0.0001, f2:0.055, variance:null,  result:'confirmed'},
  {id:'H3a', type:'mediation',   path:'PR → DT → SUS',        sd:0.030, beta:0.098,  t:3.27,  p:'0.001',   pval:0.001,  f2:null,  variance:29.81, result:'confirmed'},
  {id:'H3b', type:'mediation',   path:'HG → PR → DT',         sd:0.039, beta:0.142,  t:3.63,  p:'< 0.001', pval:0.0001, f2:null,  variance:34.13, result:'confirmed'},
  {id:'H3c', type:'mediation',   path:'HG → DT → SUS',        sd:0.027, beta:0.102,  t:3.73,  p:'< 0.001', pval:0.0001, f2:null,  variance:20.92, result:'confirmed'},
  {id:'H3d', type:'mediation',   path:'HG → PR → SUS',        sd:0.032, beta:0.125,  t:3.92,  p:'< 0.001', pval:0.0001, f2:null,  variance:25.53, result:'confirmed'},
  {id:'H3e', type:'chained',     path:'HG → PR → DT → SUS',   sd:0.017, beta:0.053,  t:3.11,  p:'0.002',   pval:0.002,  f2:null,  variance:10.84, result:'confirmed'},
  {id:'H4a', type:'moderator',   path:'HG × PR → DT',         sd:0.073, beta:0.256,  t:3.52,  p:'< 0.001', pval:0.0001, f2:0.065, variance:null,  result:'confirmed'},
  {id:'H4b', type:'moderator',   path:'HG × PR → SUS',        sd:0.031, beta:0.096,  t:3.05,  p:'0.002',   pval:0.002,  f2:null,  variance:100,   result:'confirmed'},
  {id:'H4c', type:'moderator',   path:'HG × DT → SUS',        sd:0.060, beta:0.177,  t:2.94,  p:'0.003',   pval:0.003,  f2:0.049, variance:null,  result:'confirmed'},
  {id:'H5a', type:'nonlinear',   path:'QE → PR',              sd:0.037, beta:0.032,  t:0.87,  p:'0.382',   pval:0.382,  f2:0.003, variance:null,  result:'rejected'},
  {id:'H5b', type:'nonlinear',   path:'QE → DT',              sd:0.049, beta:-0.105, t:2.13,  p:'0.034',   pval:0.034,  f2:0.017, variance:null,  result:'confirmed'},
  {id:'H5c', type:'nonlinear',   path:'QE → SUS',             sd:0.045, beta:0.026,  t:0.57,  p:'0.571',   pval:0.571,  f2:0.002, variance:null,  result:'rejected'},
  {id:'H6a', type:'interaction', path:'HG×PR → DT',           sd:0.073, beta:0.256,  t:3.52,  p:'< 0.001', pval:0.0001, f2:0.065, variance:null,  result:'confirmed'},
  {id:'H6b', type:'interaction', path:'HG×PR → SUS',          sd:0.031, beta:0.096,  t:3.05,  p:'0.002',   pval:0.002,  f2:null,  variance:100,   result:'confirmed'},
  {id:'H6c', type:'interaction', path:'HG×DT → SUS',          sd:0.060, beta:0.177,  t:2.94,  p:'0.003',   pval:0.003,  f2:0.049, variance:null,  result:'confirmed'}
];

const FALLBACK_VIF_TABLE = [
  {id:'Q1',vif:3.755,construct:'PR'},{id:'Q2',vif:3.116,construct:'PR'},{id:'Q3',vif:3.370,construct:'PR'},
  {id:'Q4',vif:4.142,construct:'PR'},{id:'Q5',vif:2.311,construct:'PR'},{id:'Q6',vif:3.370,construct:'PR'},
  {id:'Q7',vif:3.025,construct:'PR'},{id:'Q8',vif:3.513,construct:'PR'},{id:'Q9',vif:4.010,construct:'PR'},
  {id:'Q10',vif:3.179,construct:'PR'},{id:'Q11',vif:3.134,construct:'PR'},
  {id:'Q12',vif:3.495,construct:'DT'},{id:'Q13',vif:2.603,construct:'DT'},{id:'Q14',vif:2.983,construct:'DT'},
  {id:'Q15',vif:2.922,construct:'DT'},{id:'Q16',vif:3.193,construct:'DT'},{id:'Q17',vif:2.283,construct:'DT'},
  {id:'Q18',vif:2.257,construct:'DT'},{id:'Q19',vif:3.092,construct:'DT'},{id:'Q20',vif:2.825,construct:'DT'},
  {id:'Q21',vif:3.109,construct:'SUS'},{id:'Q22',vif:2.375,construct:'SUS'},{id:'Q23',vif:2.821,construct:'SUS'},
  {id:'Q24',vif:2.846,construct:'SUS'},{id:'Q25',vif:2.703,construct:'SUS'},{id:'Q26',vif:2.403,construct:'SUS'},
  {id:'Q27',vif:3.321,construct:'SUS'},{id:'Q28',vif:2.225,construct:'SUS'},{id:'Q29',vif:2.529,construct:'SUS'},
  {id:'Q30',vif:3.101,construct:'SUS'},
  {id:'Q31',vif:2.652,construct:'HG'},{id:'Q32',vif:3.322,construct:'HG'},{id:'Q33',vif:2.483,construct:'HG'},
  {id:'Q34',vif:3.261,construct:'HG'},{id:'Q35',vif:2.293,construct:'HG'},{id:'Q36',vif:4.167,construct:'HG'},
  {id:'Q37',vif:3.345,construct:'HG'},{id:'Q38',vif:3.273,construct:'HG'},{id:'Q39',vif:2.365,construct:'HG'},
  {id:'Q40',vif:3.788,construct:'HG'},{id:'Q41',vif:3.573,construct:'HG'},{id:'Q42',vif:4.020,construct:'HG'},
  {id:'Q43',vif:3.018,construct:'HG'},{id:'Q44',vif:2.909,construct:'HG'},{id:'Q45',vif:2.972,construct:'HG'},
  {id:'Q46',vif:3.219,construct:'HG'},
  {id:'QE',vif:1.000,construct:'QE'},{id:'HG×PR',vif:1.000,construct:'HG×PR'},{id:'HG×DT',vif:1.000,construct:'HG×DT'}
];

const FALLBACK_RELIABILITY = {
  indicatorReliability: [
    {construct:'PR',  label:'پیش‌نیازهای کارآفرینی (PR)', items:'Q1–Q11',  loading_min:0.786, loading_max:0.893, rel_min:0.618, rel_max:0.797, comm_min:0.618, comm_max:0.797},
    {construct:'DT',  label:'تحول دیجیتال (DT)',           items:'Q12–Q20', loading_min:0.796, loading_max:0.878, rel_min:0.634, rel_max:0.771, comm_min:0.634, comm_max:0.771},
    {construct:'SUS', label:'پایداری کارآفرینی (SUS)',      items:'Q21–Q30', loading_min:0.778, loading_max:0.865, rel_min:0.605, rel_max:0.748, comm_min:0.605, comm_max:0.748},
    {construct:'HG',  label:'جغرافیای انسانی (HG)',         items:'Q31–Q46', loading_min:0.766, loading_max:0.881, rel_min:0.587, rel_max:0.776, comm_min:0.587, comm_max:0.776}
  ],
  convergent: [
    {construct:'DT',  label:'تحول دیجیتال',          cronbach:0.947, rho_a:0.948, rho_c:0.955, ave:0.703},
    {construct:'HG',  label:'جغرافیای انسانی',        cronbach:0.971, rho_a:0.972, rho_c:0.973, ave:0.696},
    {construct:'SUS', label:'پایداری کارآفرینی',      cronbach:0.950, rho_a:0.951, rho_c:0.957, ave:0.689},
    {construct:'PR',  label:'پیش‌نیازهای کارآفرینی',  cronbach:0.965, rho_a:0.966, rho_c:0.969, ave:0.739}
  ],
  crossLoadings: [
    {construct:'PR',    label:'پیش‌نیازهای کارآفرینی', items:'Q1–Q11',  own_min:0.786, own_max:0.893, cross_min:0.404, cross_max:0.508, result:'confirmed'},
    {construct:'DT',    label:'تحول دیجیتال',           items:'Q12–Q20', own_min:0.796, own_max:0.878, cross_min:0.447, cross_max:0.515, result:'confirmed'},
    {construct:'SUS',   label:'پایداری کارآفرینی',      items:'Q21–Q30', own_min:0.778, own_max:0.865, cross_min:0.390, cross_max:0.526, result:'confirmed'},
    {construct:'HG',    label:'جغرافیای انسانی',         items:'Q31–Q46', own_min:0.766, own_max:0.881, cross_min:0.381, cross_max:0.503, result:'confirmed'},
    {construct:'QE',    label:'اثر درجه دوم',            items:'QE',      own_min:1.000, own_max:1.000, cross_min:0.679, cross_max:0.679, result:'confirmed'},
    {construct:'HG×PR', label:'تعامل HG×PR',             items:'HG×PR',   own_min:1.000, own_max:1.000, cross_min:0.679, cross_max:0.679, result:'confirmed'},
    {construct:'HG×DT', label:'تعامل HG×DT',             items:'HG×DT',   own_min:1.000, own_max:1.000, cross_min:0.485, cross_max:0.485, result:'confirmed'}
  ],
  fornellLarcker: {
    constructs: ['DT','HG','SUS','PR'],
    labels: ['تحول دیجیتال','جغرافیای انسانی','پایداری کارآفرینی','پیش‌نیازهای کارآفرینی'],
    matrix: [
      [0.838, null,  null,  null ],
      [0.424, 0.834, null,  null ],
      [0.568, 0.484, 0.830, null ],
      [0.412, 0.535, 0.531, 0.859]
    ]
  }
};

/* ================================================================
   DESCRIPTIVE STATISTICS — آمار توصیفی (داده‌های داخلی)
   پرسشنامه فرش دستباف زنان روستایی (n = 250)
   ================================================================ */
const FALLBACK_DESCRIPTIVE = {
  gender: {
    labels: ['زن'],
    values: [250],
    percent: [100.0],
    colors: ['#e91e63'],
    stats: {N: 250, Missing: 0, Mean: 1.00, SD: 0.000, Skew: null, Kurt: null, Range: 0}
  },
  age: {
    labels: ['< 29 سال', '30 تا 39 سال', '40 تا 49 سال', '> 50 سال'],
    values: [6, 90, 111, 43],
    percent: [2.4, 36.0, 44.4, 17.2],
    colors: ['#1abc9c', '#3498db', '#9b59b6', '#e74c3c'],
    stats: {N: 250, Missing: 0, Mean: 2.76, SD: 0.758, Skew: 0.089, Kurt: -0.676, Range: 3}
  },
  education: {
    labels: ['کاردانی و کمتر', 'کارشناسی', 'کارشناسی ارشد'],
    values: [151, 88, 11],
    percent: [60.4, 35.2, 4.4],
    colors: ['#27ae60', '#f39c12', '#8e44ad'],
    stats: {N: 250, Missing: 0, Mean: 1.44, SD: 0.579, Skew: 0.923, Kurt: -0.136, Range: 2}
  },
  distance: {
    labels: ['< 39', '40-59', '60-79', '80-99', '100-119', '> 120'],
    values: [31, 120, 39, 25, 15, 20],
    percent: [12.4, 48.0, 15.6, 10.0, 6.0, 8.0],
    colors: ['#1abc9c', '#3498db', '#9b59b6', '#f39c12', '#e67e22', '#e74c3c'],
    stats: {N: 250, Missing: 0, Mean: 2.73, SD: 1.404, Skew: 1.048, Kurt: 0.197, Range: 5}
  },
  cost: {
    labels: ['< 100', '100-200', '200-300', '300-400', '400-500', '> 500'],
    values: [31, 120, 39, 25, 21, 14],
    percent: [12.4, 48.0, 15.6, 10.0, 8.4, 5.6],
    colors: ['#1abc9c', '#3498db', '#9b59b6', '#f39c12', '#e67e22', '#e74c3c'],
    stats: {N: 250, Missing: 0, Mean: 2.71, SD: 1.356, Skew: 0.991, Kurt: 0.115, Range: 5}
  }
};

const FALLBACK_PATHS = [
  {Path:"DT→SUS",Original:0.3735,Mean:0.3709,STDEV:0.0519,T:7.208,P:6.25e-13,CI_low:0.2660,CI_high:0.4698},
  {Path:"HG→DT",Original:0.2742,Mean:0.2774,STDEV:0.0652,T:4.205,P:2.66e-5,CI_low:0.1472,CI_high:0.4026},
  {Path:"HG→SUS",Original:0.2096,Mean:0.2100,STDEV:0.0595,T:3.516,P:4.42e-4,CI_low:0.0935,CI_high:0.3259},
  {Path:"HG→PR",Original:0.5424,Mean:0.5438,STDEV:0.0477,T:11.367,P:5.68e-14,CI_low:0.4480,CI_high:0.6322},
  {Path:"PR→DT",Original:0.2619,Mean:0.2634,STDEV:0.0669,T:3.915,P:9.15e-5,CI_low:0.1299,CI_high:0.3946},
  {Path:"PR→SUS",Original:0.2305,Mean:0.2329,STDEV:0.0531,T:4.345,P:1.42e-5,CI_low:0.1288,CI_high:0.3356},
  {Path:"QE→DT",Original:-0.1053,Mean:-0.1080,STDEV:0.0495,T:2.127,P:0.0335,CI_low:-0.2048,CI_high:-0.0114},
  {Path:"QE→SUS",Original:0.0258,Mean:0.0255,STDEV:0.0455,T:0.566,P:0.5713,CI_low:-0.0635,CI_high:0.1162},
  {Path:"QE→PR",Original:0.0321,Mean:0.0336,STDEV:0.0367,T:0.874,P:0.3822,CI_low:-0.0353,CI_high:0.1080},
  {Path:"HG×PR→DT",Original:0.2563,Mean:0.2564,STDEV:0.0727,T:3.523,P:4.31e-4,CI_low:0.1134,CI_high:0.3946},
  {Path:"HG×DT→SUS",Original:0.1765,Mean:0.1805,STDEV:0.0601,T:2.937,P:3.33e-3,CI_low:0.0665,CI_high:0.3015}
];

const FALLBACK_R2 = [
  {Construct:"DT",R2:0.2775,R2_Adj:0.2657},
  {Construct:"SUS",R2:0.4892,R2_Adj:0.4788},
  {Construct:"PR",R2:0.2883,R2_Adj:0.2825}
];

const FALLBACK_F2 = [
  {Path:"DT→SUS",f2:0.2102},{Path:"HG→DT",f2:0.0718},{Path:"HG→SUS",f2:0.0552},
  {Path:"HG→PR",f2:0.4028},{Path:"PR→DT",f2:0.0675},{Path:"PR→SUS",f2:0.0659},
  {Path:"QE→DT",f2:0.0169},{Path:"QE→SUS",f2:0.0020},{Path:"QE→PR",f2:0.0035},
  {Path:"HG×PR→DT",f2:0.0653},{Path:"HG×DT→SUS",f2:0.0488}
];

const FALLBACK_LOADINGS = {
  DT:  {Q12:0.878,Q13:0.819,Q14:0.851,Q15:0.851,Q16:0.861,Q17:0.800,Q18:0.796,Q19:0.846,Q20:0.840},
  HG:  {Q31:0.803,Q32:0.849,Q33:0.792,Q34:0.847,Q35:0.768,Q36:0.881,Q37:0.846,Q38:0.848,Q39:0.766,Q40:0.870,Q41:0.863,Q42:0.877,Q43:0.829,Q44:0.825,Q45:0.829,Q46:0.846},
  SUS: {Q21:0.861,Q22:0.802,Q23:0.843,Q24:0.836,Q25:0.828,Q26:0.806,Q27:0.866,Q28:0.778,Q29:0.816,Q30:0.859},
  PR:  {Q1:0.881,Q2:0.850,Q3:0.864,Q4:0.893,Q5:0.786,Q6:0.868,Q7:0.843,Q8:0.873,Q9:0.887,Q10:0.853,Q11:0.853}
};

const FALLBACK_VIF = {
  DT:  {Q12:3.495,Q13:2.603,Q14:2.983,Q15:2.922,Q16:3.193,Q17:2.283,Q18:2.257,Q19:3.092,Q20:2.825},
  HG:  {Q31:2.652,Q32:3.322,Q33:2.483,Q34:3.261,Q35:2.293,Q36:4.167,Q37:3.345,Q38:3.273,Q39:2.365,
        Q40:3.788,Q41:3.573,Q42:4.020,Q43:3.018,Q44:2.909,Q45:2.972,Q46:3.219},
  SUS: {Q21:3.109,Q22:2.375,Q23:2.821,Q24:2.846,Q25:2.703,Q26:2.403,Q27:3.321,Q28:2.225,Q29:2.529,Q30:3.101},
  PR:  {Q1:3.755,Q2:3.116,Q3:3.370,Q4:4.142,Q5:2.311,Q6:3.370,Q7:3.025,Q8:3.513,Q9:4.010,Q10:3.179,Q11:3.134}
};

const FALLBACK_QUALITY = {
  DT:  {Cronbach:0.947,rho_a:0.948,rho_c:0.955,AVE:0.703},
  HG:  {Cronbach:0.971,rho_a:0.972,rho_c:0.973,AVE:0.696},
  SUS: {Cronbach:0.950,rho_a:0.951,rho_c:0.957,AVE:0.689},
  PR:  {Cronbach:0.965,rho_a:0.966,rho_c:0.969,AVE:0.739}
};

const FALLBACK_HTMT = {
  labels: ["DT","HG","SUS","PR","QE","HG×PR","HG×DT"],
  data: {
    "0-1":0.440,"0-2":0.596,"0-3":0.430,"0-4":0.045,"0-5":0.181,"0-6":0.058,
    "1-2":0.500,"1-3":0.550,"1-4":0.163,"1-5":0.056,"1-6":0.034,
    "2-3":0.552,"2-4":0.087,"2-5":0.235,"2-6":0.276,
    "3-4":0.042,"3-5":0.022,"3-6":0.198,
    "4-5":0.679,"4-6":0.485,
    "5-6":0.406
  }
};

function mulberry32(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function seededNormal(seed,n){
  const rng=mulberry32(seed);const out=[];
  for(let i=0;i<n;i++){const u1=rng()||1e-9,u2=rng();const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);out.push(z);}
  return out;
}
const FALLBACK_LATENT = {
  DT:  seededNormal(42,250),
  SUS: seededNormal(43,250),
  PR:  seededNormal(44,250)
};

/* ================================================================
   I18N — ترجمه‌ها
   ================================================================ */
const I18N = {
  fa:{
    app_title:"داشبورد جامع SmartPLS",
    app_subtitle:"PLS Algorithm · Bootstrapping · PLS Predict — روستا و توسعه پایدار فضا",
    menu_layer:"لایه‌های تحلیل",
    menu_layer1:"تحلیل نهایی — PLS Algorithm",
    menu_layer2:"تحلیل میانی — Bootstrapping",
    menu_layer3:"تحلیل پیش‌بینانه — PLS Predict",
    menu_tools:"ابزارها",

    /* ============ Navigation ============ */
    nav_overview:"نمای کلی",
    nav_data:"جدول داده",
    nav_hypotheses:"خلاصه جدول فرضیه‌ها",
    nav_method:"روش‌شناسی",
    nav_download:"دانلود داده",
    nav_descriptive:"آمار توصیفی",
    nav_l1_path:"دیاگرام مسیر",
    nav_l1_quality:"R² · f² · پایایی",
    nav_l1_loadings:"بارهای عاملی",
    nav_l1_vif_table:"جدول VIF",
    nav_l1_reliability:"پایایی و روایی",
    nav_l1_htmt:"HTMT",
    nav_l1_mod:"اثر تعدیل‌گری",
    nav_l2_forest:"جنگل ضرایب مسیر",
    nav_l2_sig:"چشم‌انداز معناداری",
    nav_l2_land:"چشم‌انداز سه‌بعدی",
    nav_l3_overview:"نمای Q²",
    nav_l3_charts:"نمودارهای PLS Predict",
    nav_smartpls_graphical:"خروجی گرافیکی SmartPLS",

    /* ============ Descriptive Statistics ============ */
    desc_title:"📈 آمار توصیفی",
    desc_desc:"تحلیل توصیفی داده‌های پرسشنامه فرش دستباف زنان روستایی (n = 250) — فراوانی، درصد، میانگین، انحراف معیار و شاخص‌های پراکندگی",
    desc_chart_gender:"جنسیت پاسخ‌دهندگان",
    desc_chart_age:"توزیع سنی",
    desc_chart_edu:"سطح تحصیلات",
    desc_chart_distance:"فاصله مکانی روستا تا مشهد",
    desc_chart_cost:"هزینه رفت و آمد",
    desc_chart_sd:"مقایسه انحراف معیار متغیرها (SD)",
    desc_table_title:"📋 جدول آماره‌های توصیفی",
    desc_kpi_total:"کل نمونه",
    desc_kpi_missing:"داده‌های گمشده",
    desc_kpi_mean_sd:"میانگین SD",
    desc_kpi_max_sd:"بیشترین پراکندگی",
    desc_col_variable:"متغیر",
    desc_col_n:"N",
    desc_col_missing:"Missing",
    desc_col_mean:"Mean",
    desc_col_sd:"SD",
    desc_col_skew:"Skewness",
    desc_col_kurt:"Kurtosis",
    desc_col_range:"Range",

    /* ============ Filters ============ */
    filter_indicators:"فیلتر شاخص‌ها:",filter_reset:"↺ بازنشانی",
    status_ready:"آماده",status_filtered:"فیلتر شد",
    all_indicators:"همه ۳۰ شاخص",indicators_selected:"شاخص",
    select_all:"انتخاب همه",select_none:"حذف همه",

    /* ============ Overview ============ */
    overview_title:"🏠 نمای کلی",
    overview_desc:"داشبورد جامع SmartPLS — سه لایه: مدل‌یابی PLS، آزمون معناداری بوت‌استرپ، و قدرت پیش‌بینانه.",
    overview_diagram:"دیاگرام مسیر مدل ساختاری",

    /* ============ Data / Method / Download ============ */
    data_title:"📋 جدول داده",data_desc:"",search_ph:"جستجو...",
    method_title:"📖 روش‌شناسی",
    method_h1:"سه لایهٔ تحلیل",
    method_p1:"داشبورد به‌صورت سلسله‌مراتبی: PLS Algorithm (برازش مدل) → Bootstrapping (معناداری) → PLS Predict (قدرت پیش‌بینانه).",
    method_h2:"منبع داده",
    method_p2:"داده‌ها ابتدا از فایل‌های اکسل بارگذاری می‌شوند. در صورت نبود، از داده‌های داخلی استفاده می‌شود.",
    download_title:"📥 دانلود داده",download_csv_title:"داده‌های کامل",download_btn:"دانلود CSV",

    /* ============ Layer 1 ============ */
    l1_path_title:"🗺️ دیاگرام مسیر — تحلیل نهایی (PLS Algorithm)",
    l1_path_desc:"مسیرهای ساختاری با مقادیر β (بدون معناداری)",
    l1_quality_title:"🎨 R² · f² · پایایی و روایی",
    l1_loadings_title:"📦 بارهای عاملی بیرونی",
    l1_vif_table_title:"📊 جدول VIF — عامل تورم واریانس",
    l1_vif_table_desc:"جدول جامع شاخص‌های VIF برای تمام ۴۶ شاخص و ۳ سازهٔ تعاملی. مقدار VIF کمتر از ۵ نشان‌دهندهٔ نبود هم‌خطی چندگانهٔ مشکل‌ساز است.",
    l1_reliability_title:"🧬 پایایی و روایی",
    l1_reliability_desc:"چهار جدول کلیدی برای بررسی پایایی و روایی مدل: پایایی شاخص‌ها، پایایی و روایی همگرا، روایی واگرا با بارهای متقابل و معیار فرونل-لارکر.",
    l1_htmt_title:"🔥 ماتریس HTMT",l1_htmt_desc:"آستانه واگرایی: ۰٫۸۵",
    l1_mod_title:"⚡ اثر تعدیل‌گری",

    /* ============ Layer 2 ============ */
    l2_forest_title:"🌲 جنگل ضرایب مسیر — Bootstrapping",
    l2_forest_desc:"با فاصله اطمینان ۹۵٪ (Percentile)",
    l2_sig_title:"⭐ چشم‌انداز معناداری",
    l2_land_title:"🏔️ چشم‌انداز سه‌بعدی ضرایب مسیر",

    /* ============ Layer 3 ============ */
    l3_overview_title:"📈 نمای Q² — PLS Predict",
    l3_overview_desc:"قدرت پیش‌بینانه ۳۰ شاخص",
    l3_charts_title:"",l3_charts_desc:"",

    /* ============ Chart Titles ============ */
    chart_path_diagram:"دیاگرام مسیر ساختاری",
    chart_beta_bars:"مقایسه ضرایب مسیر",
    chart_r2:"سطح سه‌بعدی R²",
    chart_f2:"چشم‌انداز سه‌بعدی f²",
    chart_quality:"پایایی و روایی همگرا",
    chart_loadings:"سطح سه‌بعدی Outer Loadings",
    chart_vif:"سطح سه‌بعدی VIF",
    chart_htmt:"HTMT Heatmap",
    chart_slopes:"شیب‌های ساده",
    chart_raincloud:"توزیع امتیازهای پنهان",
    chart_forest:"Forest Plot",
    chart_sig:"β × T × −log10(p)",
    chart_beta_land:"رنگ بر اساس آماره T",
    chart_q2_columns:"ستون‌های سه‌بعدی Q²predict",
    chart_rmse_stems:"جنگل سه‌بعدی RMSE",
    chart_rmse_landscape:"چشم‌انداز RMSE",
    chart_ridge_q2:"پشته Q²predict",
    chart_cvpat:"سطح CVPAT",
    chart_ridgeline:"توزیع خطاها",
    chart_scatter:"پراکندگی PLS vs LM",
    chart_forest_cvpat:"نمودار جنگلی CVPAT",

    /* ============ Excel Viewer ============ */
    excel_viewer_title:"📁 فایل‌های اصلی تحقیق",
    excel_bootstrap:"خروجی Bootstrapping",
    excel_pls_algo:"خروجی PLS Algorithm",
    excel_pls_predict:"خروجی PLS Predict",
    excel_questionnaire:"پرسشنامه تحقیق",
    excel_educational_data:"داده‌های جمع‌آوری‌شده (SPSS)",
    excel_preview_btn:"👁 پیش‌نمایش",
    excel_download_btn:"⬇ دانلود",
    excel_no_preview:"— بدون پیش‌نمایش —",
    excel_docx_note:"فایل Word — برای مشاهده کامل دانلود کنید",
    excel_sav_note:"فایل SPSS — برای مشاهده کامل دانلود کنید",
    excel_loading:"در حال بارگذاری...",
    excel_not_found:"فایل در دسترس نیست (احتمالاً از داده داخلی استفاده می‌شود)",
    excel_showing_rows:"نمایش ردیف",

    /* ============ KPI ============ */
    kpi_strong:"شاخص‌های قوی",kpi_mid:"شاخص‌های متوسط",kpi_weak:"شاخص‌های ضعیف",
    kpi_mean_q2:"میانگین Q²",kpi_pls_vs_ia:"برتری بر IA",kpi_pls_vs_lm:"برتری بر LM",
    kpi_paths:"مسیر معنادار",kpi_r2_max:"بالاترین R²",kpi_ave_min:"حداقل AVE",
    kpi_constructs:"تعداد سازه‌ها",kpi_htmt_max:"بالاترین HTMT",

    /* ============ Columns ============ */
    col_indicator:"شاخص",col_q2:"Q²predict",col_pls:"PLS RMSE",col_lm:"LM RMSE",
    col_ia:"IA RMSE",col_status:"وضعیت",col_path:"مسیر",col_beta:"β",col_t:"T",
    col_p:"p",col_ci:"CI 95%",col_f2:"f²",col_vif:"VIF",

    /* ============ Badges ============ */
    badge_good:"قوی",badge_mid:"متوسط",badge_bad:"ضعیف",
    badge_sig:"معنادار ✅",badge_nosig:"غیرمعنادار ⚪",

    /* ============ Info Panel ============ */
    info_beta:"ضریب مسیر",info_t:"آماره T",info_p:"مقدار p",info_ci:"فاصله اطمینان",
    info_best:"بهترین روش",info_q2:"Q²predict",info_pls:"PLS RMSE",info_lm:"LM RMSE",
    info_ia:"IA RMSE",info_sd:"انحراف معیار",info_status:"وضعیت",

    ds_loading:"در حال بارگذاری...",ds_loaded:"✓ از فایل اکسل",ds_fallback:"✓ از داده داخلی",

    /* ============ Hypotheses ============ */
    hypotheses_title:"🧪 خلاصه جدول فرضیه‌ها",
    hypotheses_desc:"جدول جامع ۲۰ فرضیهٔ پژوهش با شاخص‌های آماری: انحراف معیار، β، آماره t، مقدار p و اندازهٔ اثر f².",
    hyp_search_ph:"جستجوی فرضیه یا مسیر...",
    hyp_filter_all:"همه",
    hyp_filter_confirmed:"تأییدشده",
    hyp_filter_rejected:"ردشده",
    hyp_type_direct:"مستقیم",
    hyp_type_mediation:"میانجی",
    hyp_type_chained:"زنجیره‌ای",
    hyp_type_moderator:"تعدیل‌گر",
    hyp_type_nonlinear:"غیرخطی",
    hyp_type_interaction:"تعاملی",
    hyp_col_hyp:"فرضیه",
    hyp_col_type:"نوع",
    hyp_col_path:"مسیر",
    hyp_col_sd:"انحراف معیار",
    hyp_col_beta:"β",
    hyp_col_t:"t",
    hyp_col_p:"p",
    hyp_col_f2:"f²",
    hyp_col_var:"واریانس تبیین‌شده",
    hyp_col_result:"نتیجه",
    hyp_result_confirmed:"تأیید",
    hyp_result_rejected:"رد",
    hyp_kpi_total:"کل فرضیه‌ها",
    hyp_kpi_confirmed:"تأییدشده",
    hyp_kpi_rejected:"ردشده",
    hyp_kpi_ratio:"نسبت تأیید",
    hyp_empty:"فرضیه‌ای یافت نشد",
    hyp_effect_weak:"ناچیز",
    hyp_effect_small:"ضعیف",
    hyp_effect_medium:"متوسط",
    hyp_effect_strong:"قوی",
    hyp_click_hint:"برای دیدن تأثیر بر دادهٔ اصلی، روی هر ردیف کلیک کنید",

    /* ============ VIF ============ */
    vif_kpi_total:"کل شاخص‌ها",
    vif_kpi_mean:"میانگین VIF",
    vif_kpi_min:"کمترین VIF",
    vif_kpi_max:"بیشترین VIF",
    vif_kpi_warning:"هشدار (VIF>3.3)",
    vif_kpi_critical:"بحرانی (VIF≥5)",
    vif_col_indicator:"شاخص",
    vif_col_construct:"سازه",
    vif_col_vif:"مقدار VIF",
    vif_col_status:"وضعیت",
    vif_col_bar:"نمودار",
    vif_status_excellent:"عالی",
    vif_status_good:"خوب",
    vif_status_acceptable:"قابل قبول",
    vif_status_warning:"هشدار",
    vif_status_critical:"بحرانی",
    vif_filter_all:"همه",
    vif_filter_pr:"PR",
    vif_filter_dt:"DT",
    vif_filter_sus:"SUS",
    vif_filter_hg:"HG",
    vif_filter_qe:"QE / تعاملی",
    vif_filter_warning:"نیازمند بازبینی",
    vif_filter_excellent:"بدون مشکل",
    vif_search_ph:"جستجوی شاخص...",
    vif_empty:"شاخصی یافت نشد",
    vif_threshold_hint:"آستانهٔ کلاسیک: VIF < 5 = بدون مشکل هم‌خطی چندگانه",
    vif_legend:"راهنمای رنگ:",
    vif_badge_excel:"✓ از فایل PLS Algorithm.xlsx",
    vif_badge_fallback:"⚠ از دادهٔ داخلی داشبورد",

    /* ============ Reliability ============ */
    rel_table1_title:"۱. پایایی شاخص‌ها (Indicator Reliability)",
    rel_table1_sub:"پایایی شاخص‌ها با استفاده از بارهای عاملی، مجذور بار عاملی λ² و اشتراکی",
    rel_table2_title:"۲. پایایی و روایی همگرا (Convergent Reliability & Validity)",
    rel_table3_title:"۳. روایی واگرا با بارهای عاملی متقابل (Discriminant Validity — Cross-Loadings)",
    rel_table4_title:"۴. معیار فرونل-لارکر (Fornell-Larcker Criterion)",
    rel_col_construct:"سازه",
    rel_col_items:"گویه‌ها",
    rel_col_loading:"بارهای عاملی",
    rel_col_reliability:"پایایی شاخص (بار²)",
    rel_col_communal:"اشتراکی",
    rel_col_cronbach:"آلفای کرونباخ",
    rel_col_rho_a:"rho_a (Dijkstra-Henseler)",
    rel_col_rho_c:"rho_c (CR)",
    rel_col_ave:"AVE",
    rel_col_own:"بارهای عاملی خودی",
    rel_col_cross:"بیشترین بار متقابل",
    rel_col_result:"نتیجه",
    rel_result_confirmed:"تأیید",
    rel_result_rejected:"رد",
    rel_note_rho_a:"(rho_a) پایایی دیجسترا-هنسلر، معیاری جایگزین برای پایایی ترکیبی است که حساسیت کمتری به تعداد گویه‌ها دارد.",
    rel_note_rho_c:"(rho_c) پایایی ترکیبی در خروجی SmartPLS با عنوان Composite reliability گزارش می‌شود.",
    rel_source_excel:"✓ خوانده‌شده از PLS Algorithm.xlsx",
    rel_source_fallback:"⚠ از داده‌های داخلی داشبورد (فایل اکسل در دسترس نبود)",
    rel_threshold_note:"آستانه‌ها: بار عاملی ≥ 0.7 · AVE ≥ 0.5 · CR ≥ 0.7 · Cronbach ≥ 0.7 · ریشهٔ دوم AVE > همبستگی با سایر سازه‌ها",
    rel_ave_ok:"بالای آستانه",
    rel_ave_warn:"زیر آستانه",
    rel_fl_hint:"اعداد روی قطر (مشکی) ریشهٔ دوم AVE هستند و باید از همبستگی‌های زیرین خود بزرگ‌تر باشند.",

    /* ============ SmartPLS Graphical ============ */
    smartpls_graphical_title:"🖼️ خروجی گرافیکی SmartPLS",
    smartpls_graphical_desc:"سه خروجی گرافیکی اصلی نرم‌افزار SmartPLS. ابتدا از فایل‌های اکسل استخراج می‌شوند و در صورت عدم دسترسی، نسخهٔ بازسازی‌شده با رنگ‌های اصلی Excel نمایش داده می‌شود.",
    smartpls_fig1_title:"مدل اندازه‌گیری (Measurement Model)",
    smartpls_fig2_title:"مدل ساختاری با ضرایب مسیر",
    smartpls_fig3_title:"نتیجهٔ نهایی Bootstrapping",
    smartpls_fig1_caption:"نمودار کامل با ۴۶ شاخص و ۵ سازه — خروجی مستقیم SmartPLS",
    smartpls_fig2_caption:"مسیرهای ساختاری همراه با ضرایب β و R²",
    smartpls_fig3_caption:"خروجی نهایی Bootstrapping با آماره t روی مسیرها",
    smartpls_loading:"در حال بارگذاری از فایل اکسل...",
    smartpls_found_in_excel:"✓ استخراج‌شده از فایل اکسل",
    smartpls_recreated:"⚠ نسخهٔ بازسازی‌شده (فایل اکسل در دسترس نبود)"
  },

  en:{
    app_title:"SmartPLS Comprehensive Dashboard",
    app_subtitle:"PLS Algorithm · Bootstrapping · PLS Predict — VSSD Birjand",
    menu_layer:"Analysis Layers",
    menu_layer1:"Final Analysis — PLS Algorithm",
    menu_layer2:"Intermediate — Bootstrapping",
    menu_layer3:"Predictive — PLS Predict",
    menu_tools:"Tools",

    nav_overview:"Overview",
    nav_data:"Data Table",
    nav_hypotheses:"Hypotheses Summary",
    nav_method:"Methodology",
    nav_download:"Download",
    nav_descriptive:"Descriptive Statistics",
    nav_l1_path:"Path Diagram",
    nav_l1_quality:"R² · f² · Quality",
    nav_l1_loadings:"Outer Loadings",
    nav_l1_vif_table:"VIF Table",
    nav_l1_reliability:"Reliability & Validity",
    nav_l1_htmt:"HTMT",
    nav_l1_mod:"Moderation",
    nav_l2_forest:"Path Forest",
    nav_l2_sig:"Significance Landscape",
    nav_l2_land:"3D Landscape",
    nav_l3_overview:"Q² Overview",
    nav_l3_charts:"PLS Predict Charts",
    nav_smartpls_graphical:"SmartPLS Graphical Output",

    desc_title:"📈 Descriptive Statistics",
    desc_desc:"Descriptive analysis of rural women's hand-woven carpet questionnaire (n = 250) — frequency, percentage, mean, SD, and dispersion indices",
    desc_chart_gender:"Respondents Gender",
    desc_chart_age:"Age Distribution",
    desc_chart_edu:"Education Level",
    desc_chart_distance:"Spatial Distance to Mashhad",
    desc_chart_cost:"Commuting Cost",
    desc_chart_sd:"Standard Deviation Comparison",
    desc_table_title:"📋 Descriptive Statistics Table",
    desc_kpi_total:"Total Sample",
    desc_kpi_missing:"Missing Values",
    desc_kpi_mean_sd:"Mean SD",
    desc_kpi_max_sd:"Max Dispersion",
    desc_col_variable:"Variable",
    desc_col_n:"N",
    desc_col_missing:"Missing",
    desc_col_mean:"Mean",
    desc_col_sd:"SD",
    desc_col_skew:"Skewness",
    desc_col_kurt:"Kurtosis",
    desc_col_range:"Range",

    filter_indicators:"Filter:",filter_reset:"↺ Reset",
    status_ready:"Ready",status_filtered:"Filtered",
    all_indicators:"All 30 Indicators",indicators_selected:"indicators",
    select_all:"Select All",select_none:"Clear",

    overview_title:"🏠 Overview",
    overview_desc:"SmartPLS Comprehensive Dashboard — three layers: PLS modeling, bootstrap significance, and predictive power.",
    overview_diagram:"Structural Model Path Diagram",

    data_title:"📋 Data Table",data_desc:"",search_ph:"Search...",
    method_title:"📖 Methodology",
    method_h1:"Three Analysis Layers",
    method_p1:"Hierarchical dashboard: PLS Algorithm (model fit) → Bootstrapping (significance) → PLS Predict (predictive power).",
    method_h2:"Data Source",
    method_p2:"Data is first loaded from Excel files. If unavailable, internal data is used.",
    download_title:"📥 Download",download_csv_title:"Full Data",download_btn:"Download CSV",

    l1_path_title:"🗺️ Path Diagram — Final Analysis (PLS Algorithm)",
    l1_path_desc:"Structural paths with β (without significance)",
    l1_quality_title:"🎨 R² · f² · Reliability & Validity",
    l1_loadings_title:"📦 Outer Loadings",
    l1_vif_table_title:"📊 VIF Table — Variance Inflation Factor",
    l1_vif_table_desc:"Comprehensive VIF table for all 46 indicators and 3 interaction constructs. VIF below 5 indicates no problematic multicollinearity.",
    l1_reliability_title:"🧬 Reliability & Validity",
    l1_reliability_desc:"Four key tables for model reliability and validity assessment.",
    l1_htmt_title:"🔥 HTMT Matrix",l1_htmt_desc:"Discriminant threshold: 0.85",
    l1_mod_title:"⚡ Moderation Effects",

    l2_forest_title:"🌲 Path Coefficients Forest — Bootstrapping",
    l2_forest_desc:"95% Confidence Intervals (Percentile)",
    l2_sig_title:"⭐ Significance Landscape",
    l2_land_title:"🏔️ 3D Path Coefficients Landscape",

    l3_overview_title:"📈 Q² Overview — PLS Predict",
    l3_overview_desc:"Predictive power of 30 indicators",
    l3_charts_title:"",l3_charts_desc:"",

    chart_path_diagram:"Structural Path Diagram",
    chart_beta_bars:"Path Coefficients Comparison",
    chart_r2:"3D R² Surface",
    chart_f2:"3D f² Landscape",
    chart_quality:"Reliability & Convergent Validity",
    chart_loadings:"3D Outer Loadings Surface",
    chart_vif:"3D VIF Surface",
    chart_htmt:"HTMT Heatmap",
    chart_slopes:"Simple Slopes",
    chart_raincloud:"Latent Score Distribution",
    chart_forest:"Forest Plot",
    chart_sig:"β × T × −log10(p)",
    chart_beta_land:"Color by T statistic",
    chart_q2_columns:"3D Q²predict Columns",
    chart_rmse_stems:"3D RMSE Forest",
    chart_rmse_landscape:"RMSE Landscape",
    chart_ridge_q2:"Q²predict Ridge",
    chart_cvpat:"CVPAT Surface",
    chart_ridgeline:"Error Distribution",
    chart_scatter:"PLS vs LM Scatter",
    chart_forest_cvpat:"CVPAT Forest",

    excel_viewer_title:"📁 Main Research Files",
    excel_bootstrap:"Bootstrapping Output",
    excel_pls_algo:"PLS Algorithm Output",
    excel_pls_predict:"PLS Predict Output",
    excel_questionnaire:"Research Questionnaire",
    excel_educational_data:"Collected Data (SPSS)",
    excel_preview_btn:"👁 Preview",
    excel_download_btn:"⬇ Download",
    excel_no_preview:"— No preview —",
    excel_docx_note:"Word file — download to view",
    excel_sav_note:"SPSS file — download to view",
    excel_loading:"Loading...",
    excel_not_found:"File not found (probably using fallback data)",
    excel_showing_rows:"Showing rows",

    kpi_strong:"Strong (Q²>0.10)",kpi_mid:"Moderate",kpi_weak:"Weak",
    kpi_mean_q2:"Mean Q²",kpi_pls_vs_ia:"Better than IA",kpi_pls_vs_lm:"Better than LM",
    kpi_paths:"Significant Paths",kpi_r2_max:"Max R²",kpi_ave_min:"Min AVE",
    kpi_constructs:"Constructs",kpi_htmt_max:"Max HTMT",

    col_indicator:"Indicator",col_q2:"Q²predict",col_pls:"PLS RMSE",col_lm:"LM RMSE",
    col_ia:"IA RMSE",col_status:"Status",col_path:"Path",col_beta:"β",col_t:"T",
    col_p:"p",col_ci:"95% CI",col_f2:"f²",col_vif:"VIF",

    badge_good:"Strong",badge_mid:"Moderate",badge_bad:"Weak",
    badge_sig:"Significant ✅",badge_nosig:"Not Sig ⚪",

    info_beta:"Path Coef",info_t:"T value",info_p:"p value",info_ci:"Confidence Interval",
    info_best:"Best Method",info_q2:"Q²predict",info_pls:"PLS RMSE",info_lm:"LM RMSE",
    info_ia:"IA RMSE",info_sd:"Std Dev",info_status:"Status",

    ds_loading:"Loading...",ds_loaded:"✓ From Excel",ds_fallback:"✓ From fallback",

    hypotheses_title:"🧪 Hypotheses Summary",
    hypotheses_desc:"Comprehensive table of 20 research hypotheses with statistical indices.",
    hyp_search_ph:"Search hypothesis or path...",
    hyp_filter_all:"All",
    hyp_filter_confirmed:"Confirmed",
    hyp_filter_rejected:"Rejected",
    hyp_type_direct:"Direct",
    hyp_type_mediation:"Mediation",
    hyp_type_chained:"Chained",
    hyp_type_moderator:"Moderator",
    hyp_type_nonlinear:"Non-linear",
    hyp_type_interaction:"Interaction",
    hyp_col_hyp:"Hypothesis",
    hyp_col_type:"Type",
    hyp_col_path:"Path",
    hyp_col_sd:"Std. Deviation",
    hyp_col_beta:"β",
    hyp_col_t:"t",
    hyp_col_p:"p",
    hyp_col_f2:"f²",
    hyp_col_var:"Explained Variance",
    hyp_col_result:"Result",
    hyp_result_confirmed:"Confirmed",
    hyp_result_rejected:"Rejected",
    hyp_kpi_total:"Total Hypotheses",
    hyp_kpi_confirmed:"Confirmed",
    hyp_kpi_rejected:"Rejected",
    hyp_kpi_ratio:"Confirmation Ratio",
    hyp_empty:"No hypothesis found",
    hyp_effect_weak:"Negligible",
    hyp_effect_small:"Weak",
    hyp_effect_medium:"Medium",
    hyp_effect_strong:"Strong",
    hyp_click_hint:"Click any row to link with main data",

    vif_kpi_total:"Total Indicators",
    vif_kpi_mean:"Mean VIF",
    vif_kpi_min:"Min VIF",
    vif_kpi_max:"Max VIF",
    vif_kpi_warning:"Warning (VIF>3.3)",
    vif_kpi_critical:"Critical (VIF≥5)",
    vif_col_indicator:"Indicator",
    vif_col_construct:"Construct",
    vif_col_vif:"VIF Value",
    vif_col_status:"Status",
    vif_col_bar:"Bar",
    vif_status_excellent:"Excellent",
    vif_status_good:"Good",
    vif_status_acceptable:"Acceptable",
    vif_status_warning:"Warning",
    vif_status_critical:"Critical",
    vif_filter_all:"All",
    vif_filter_pr:"PR",
    vif_filter_dt:"DT",
    vif_filter_sus:"SUS",
    vif_filter_hg:"HG",
    vif_filter_qe:"QE / Interaction",
    vif_filter_warning:"Need Review",
    vif_filter_excellent:"No Issue",
    vif_search_ph:"Search indicator...",
    vif_empty:"No indicator found",
    vif_threshold_hint:"Classic threshold: VIF < 5 = no problematic multicollinearity",
    vif_legend:"Color legend:",
    vif_badge_excel:"✓ From PLS Algorithm.xlsx",
    vif_badge_fallback:"⚠ From dashboard fallback data",

    rel_table1_title:"1. Indicator Reliability",
    rel_table1_sub:"Indicator reliability using factor loadings, squared loading λ², and communality",
    rel_table2_title:"2. Convergent Reliability & Validity",
    rel_table3_title:"3. Discriminant Validity — Cross-Loadings",
    rel_table4_title:"4. Fornell-Larcker Criterion",
    rel_col_construct:"Construct",
    rel_col_items:"Items",
    rel_col_loading:"Factor Loadings",
    rel_col_reliability:"Indicator Reliability (λ²)",
    rel_col_communal:"Communality",
    rel_col_cronbach:"Cronbach's α",
    rel_col_rho_a:"rho_a (Dijkstra-Henseler)",
    rel_col_rho_c:"rho_c (CR)",
    rel_col_ave:"AVE",
    rel_col_own:"Own Loadings",
    rel_col_cross:"Max Cross-Loading",
    rel_col_result:"Result",
    rel_result_confirmed:"Confirmed",
    rel_result_rejected:"Rejected",
    rel_note_rho_a:"(rho_a) Dijkstra-Henseler's reliability is an alternative to composite reliability.",
    rel_note_rho_c:"(rho_c) Composite reliability is reported as 'Composite reliability' in SmartPLS output.",
    rel_source_excel:"✓ Read from PLS Algorithm.xlsx",
    rel_source_fallback:"⚠ From dashboard fallback data",
    rel_threshold_note:"Thresholds: Loading ≥ 0.7 · AVE ≥ 0.5 · CR ≥ 0.7 · Cronbach ≥ 0.7 · √AVE > inter-construct correlations",
    rel_ave_ok:"Above threshold",
    rel_ave_warn:"Below threshold",
    rel_fl_hint:"Diagonal values (black) are √AVE and must exceed their underlying correlations.",

    smartpls_graphical_title:"🖼️ SmartPLS Graphical Output",
    smartpls_graphical_desc:"Three main SmartPLS graphical outputs. First extracted from Excel files; if unavailable, recreated versions with original Excel colors are shown.",
    smartpls_fig1_title:"Measurement Model",
    smartpls_fig2_title:"Structural Model with Path Coefficients",
    smartpls_fig3_title:"Final Bootstrapping Result",
    smartpls_fig1_caption:"Full diagram with 46 indicators and 5 constructs — direct SmartPLS output",
    smartpls_fig2_caption:"Structural paths with β coefficients and R²",
    smartpls_fig3_caption:"Final Bootstrapping output with t-values on paths",
    smartpls_loading:"Loading from Excel file...",
    smartpls_found_in_excel:"✓ Extracted from Excel",
    smartpls_recreated:"⚠ Recreated version (Excel file unavailable)"
  }
};