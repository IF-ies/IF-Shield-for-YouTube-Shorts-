// content.js

let quotes = [];
fetch(chrome.runtime.getURL('sozler.json'))
  .then(res => res.json())
  .then(data => { quotes = data; })
  .catch(err => console.error('IF-Shield: Error loading quotes:', err));

let ifShieldModalActive = false;

function forceSilenceLoop() {
  if (ifShieldModalActive) {
    document.querySelectorAll('video').forEach(v => {
      v.muted = true;
      v.volume = 0;
      v.playbackRate = 0;
      if (!v.paused) v.pause();
    });
    requestAnimationFrame(forceSilenceLoop);
  }
}

function restoreVideos() {
  ifShieldModalActive = false;
  document.querySelectorAll('video').forEach(v => {
    v.muted = false;
    v.playbackRate = 1;
  });
}

const i18n = {
  tr: {
    appName: "IF-Shield for YouTube Shorts™",
    modalCancel: "İptal Et",
    modalStart: "Başlat",
    alertTitle: "Zaman Doldu!",
    alertDesc: "Zamanınız en değerli varlığınızdır, onu sonsuz bir döngüde harcamayın!",
    alertBtn: "Ana Sayfaya Dön",
    optSaniye: "Saniye",
    optDakika: "Dakika",
    optSaat: "Saat",
    optGunluk: "Gün",
    unitAdet: "Adet",
    modalTitle: "Limit Belirleyin",
    modalCountQ: "Kaç Shorts izlemek istersiniz?",
    modalTimeQ_saniye: "Kaç saniye izlemek istersiniz?",
    modalTimeQ_dakika: "Kaç dakika izlemek istersiniz?",
    modalTimeQ_saat: "Kaç saat izlemek istersiniz?",
    modalTimeQ_günlük: "Kaç gün izlemek istersiniz?",
    unitSN: "SN",
    unitDK: "DK",
    unitSA: "SA",
    unitGUN: "GÜN"
  },
  en: {
    appName: "IF-Shield for YouTube Shorts™",
    modalCancel: "Cancel",
    modalStart: "Start",
    alertTitle: "Time is up!",
    alertDesc: "Time is your most valuable asset, don't waste it on an endless loop!",
    alertBtn: "Return to Home",
    optSaniye: "Seconds",
    optDakika: "Minutes",
    optSaat: "Hours",
    optGunluk: "Days",
    unitAdet: "Count",
    modalTitle: "Set Your Limit",
    modalCountQ: "How many Shorts to watch?",
    modalTimeQ_saniye: "How many seconds to watch?",
    modalTimeQ_dakika: "How many minutes to watch?",
    modalTimeQ_saat: "How many hours to watch?",
    modalTimeQ_günlük: "How many days to watch?",
    unitSN: "SEC",
    unitDK: "MIN",
    unitSA: "HR",
    unitGUN: "DAY"
  }
};

let currentUrl = window.location.href;
let shortsSessionActive = false;
let shortsWatchedCount = 0;
let shortsStartTime = 0;

let shortsLimitCountValue = null;
let shortsLimitTimeValue = null;
let shortsLimitTimeUnit = 'dakika';
let limitInterval = null;

const defaultLang = navigator.language.startsWith('tr') ? 'tr' : 'en';
const defaultTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

let settings = {
  hideHome: true,
  hideSearch: false,
  hideSponsored: false,
  enableCountLimit: true,
  countLimitValue: 5,
  enableTimeLimit: false,
  timeLimitValue: 1,
  timeLimitUnit: 'dakika',
  theme: defaultTheme,
  language: defaultLang,
  isExtensionEnabled: true
};

function getT() {
  return i18n[settings.language] || i18n.tr;
}

function appendWhenBodyReady(element) {
  if (document.body) {
    document.body.appendChild(element);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(element);
    });
  }
}

function promptUserForLimits(defaults, callback) {
  if (document.getElementById('if-shield-modal')) return;
  const t = getT();

  const modal = document.createElement('div');
  modal.id = 'if-shield-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
    z-index: 9999999; font-family: 'Inter', sans-serif; backdrop-filter: blur(10px);
  `;

  ifShieldModalActive = true;
  requestAnimationFrame(forceSilenceLoop);

  // Click outside to cancel (go back)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      restoreVideos();
      callback(null);
      modal.remove();
    }
  });

  const isDark = settings.theme !== 'light';

  const box = document.createElement('div');
  box.style.cssText = `
    background: ${isDark ? '#111111' : '#ffffff'}; padding: 32px 24px; border-radius: 24px;
    width: 340px; color: ${isDark ? '#ffffff' : '#111111'}; box-shadow: 0 20px 50px rgba(0,0,0,${isDark ? '0.9' : '0.1'});
    display: flex; flex-direction: column; gap: 24px;
    border: 1px solid ${isDark ? '#222' : '#e5e5e5'};
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;";
  
  const headerTitle = document.createElement('span');
  headerTitle.innerText = t.modalTitle;
  headerTitle.style.cssText = `color: ${isDark ? '#b7b5b4' : '#666'}; font-size: 15px; font-weight: 500;`;

  const headerLogo = document.createElement('span');
  headerLogo.innerHTML = "🛡️ IF-SHIELD";
  headerLogo.style.cssText = "color: #d8817a; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;";

  header.appendChild(headerTitle);
  header.appendChild(headerLogo);
  box.appendChild(header);

  // Helper to create the pill counter
  const createCounter = (titleText, initialValue, unitLabel, isEnabled) => {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      opacity: ${isEnabled ? '1' : '0.3'};
      pointer-events: ${isEnabled ? 'auto' : 'none'};
      transition: opacity 0.3s;
    `;

    const title = document.createElement('div');
    title.innerText = titleText;
    title.style.cssText = `color: ${isDark ? '#e5e5e5' : '#333'}; font-size: 15px; font-weight: 400;`;

    const pill = document.createElement('div');
    pill.style.cssText = `
      background: ${isDark ? '#1A1A1A' : '#f5f5f5'}; border-radius: 999px; padding: 6px; width: 85%;
      display: flex; justify-content: space-between; align-items: center;
      box-sizing: border-box; border: 1px solid ${isDark ? '#2A2A2A' : '#e5e5e5'}; margin: 0 auto;
    `;

    const btnMinus = document.createElement('button');
    btnMinus.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isDark ? '#fff' : '#111'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    btnMinus.style.cssText = `
      width: 40px; height: 40px; border-radius: 50%; background: ${isDark ? '#222' : '#fff'}; border: ${isDark ? 'none' : '1px solid #ddd'};
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: background 0.2s; flex-shrink: 0;
    `;
    btnMinus.onmouseover = () => btnMinus.style.background = isDark ? "#333" : "#eee";
    btnMinus.onmouseout = () => btnMinus.style.background = isDark ? "#222" : "#fff";

    const valueContainer = document.createElement('div');
    valueContainer.style.cssText = "display: flex; align-items: baseline; justify-content: center; flex: 1; gap: 4px;";
    
    const valueDisplay = document.createElement('span');
    valueDisplay.innerText = initialValue;
    valueDisplay.style.cssText = `font-size: 28px; font-weight: 800; color: ${isDark ? '#fff' : '#111'};`;

    if (unitLabel) {
      const unitDisplay = document.createElement('span');
      unitDisplay.innerText = unitLabel;
      unitDisplay.style.cssText = `font-size: 11px; font-weight: 600; color: ${isDark ? '#888' : '#666'};`;
      valueContainer.appendChild(valueDisplay);
      valueContainer.appendChild(unitDisplay);
    } else {
      valueContainer.appendChild(valueDisplay);
    }

    const btnPlus = document.createElement('button');
    btnPlus.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isDark ? '#fff' : '#111'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    btnPlus.style.cssText = btnMinus.style.cssText;
    btnPlus.onmouseover = () => btnPlus.style.background = isDark ? "#333" : "#eee";
    btnPlus.onmouseout = () => btnPlus.style.background = isDark ? "#222" : "#fff";

    let currentValue = initialValue;
    
    btnMinus.onclick = () => {
      if (currentValue > 1) {
        currentValue--;
        valueDisplay.innerText = currentValue;
      }
    };
    btnPlus.onclick = () => {
      currentValue++;
      valueDisplay.innerText = currentValue;
    };

    pill.appendChild(btnMinus);
    pill.appendChild(valueContainer);
    pill.appendChild(btnPlus);

    container.appendChild(title);
    container.appendChild(pill);

    return { container, getValue: () => currentValue };
  };

  const countCounter = createCounter(t.modalCountQ, defaults.countLimitValue, null, defaults.enableCount);
  box.appendChild(countCounter.container);

  // Divider
  const divider = document.createElement('div');
  divider.style.cssText = `height: 1px; background: ${isDark ? '#222' : '#e5e5e5'}; width: 20%; margin: 4px auto;`;
  box.appendChild(divider);

  let timeTitle = t.modalTimeQ_dakika;
  let timeUnitLabel = t.unitDK;
  if (defaults.timeLimitUnit === 'saniye') { timeTitle = t.modalTimeQ_saniye; timeUnitLabel = t.unitSN; }
  if (defaults.timeLimitUnit === 'saat') { timeTitle = t.modalTimeQ_saat; timeUnitLabel = t.unitSA; }
  if (defaults.timeLimitUnit === 'günlük') { timeTitle = t.modalTimeQ_günlük; timeUnitLabel = t.unitGUN; }

  const timeCounter = createCounter(timeTitle, defaults.timeLimitValue, timeUnitLabel, defaults.enableTime);
  box.appendChild(timeCounter.container);

  // Başlat Button
  const btnSave = document.createElement('button');
  btnSave.innerText = t.modalStart;
  btnSave.style.cssText = `
    width: 100%; padding: 14px; background: #FF0000; color: #fff; border: none;
    border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 16px; 
    transition: background 0.2s, transform 0.1s; margin-top: 16px;
  `;
  btnSave.onmouseover = () => btnSave.style.background = "#cc0000";
  btnSave.onmouseout = () => btnSave.style.background = "#FF0000";
  btnSave.onmousedown = () => btnSave.style.transform = "scale(0.98)";
  btnSave.onmouseup = () => btnSave.style.transform = "scale(1)";

  btnSave.onclick = () => { 
    restoreVideos();
    callback({
      count: defaults.enableCount ? countCounter.getValue() : null,
      time: defaults.enableTime ? timeCounter.getValue() : null,
      timeUnit: defaults.timeLimitUnit
    }); 
    modal.remove(); 
  };
  
  box.appendChild(btnSave);
  modal.appendChild(box);

  appendWhenBodyReady(modal);
}

function showLimitExceededAlert(callback) {
  if (document.getElementById('if-shield-alert')) return;
  const t = getT();

  const isDark = settings.theme !== 'light';

  const modal = document.createElement('div');
  modal.id = 'if-shield-alert';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center;
    z-index: 9999999; font-family: 'Inter', sans-serif; backdrop-filter: blur(10px);
  `;

  ifShieldModalActive = true;
  requestAnimationFrame(forceSilenceLoop);

  const box = document.createElement('div');
  box.style.cssText = `
    background: ${isDark ? '#1A1A1A' : '#ffffff'}; border: 2px solid #FF0000; padding: 40px; border-radius: 20px;
    max-width: 400px; color: ${isDark ? '#fff' : '#111'}; text-align: center; box-shadow: 0 10px 40px rgba(255,0,0,0.2);
  `;

  const icon = document.createElement('div');
  icon.innerHTML = '<span style="font-size: 64px;">🛡️</span>';
  icon.style.marginBottom = "20px";

  const title = document.createElement('h2');
  title.innerText = t.alertTitle;
  title.style.cssText = "margin: 0 0 16px 0; font-size: 28px; color: #FF0000; font-weight: 800;";

  const desc = document.createElement('p');
  if (quotes.length > 0) {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const lang = settings.language || 'tr';
    const quoteText = lang === 'en' ? (randomQuote.text_en || randomQuote.text_tr) : randomQuote.text_tr;
    const authorName = lang === 'en' ? (randomQuote.author_en || randomQuote.author_tr) : randomQuote.author_tr;
    
    const authorColor = isDark ? '#ff6b6b' : '#cc0000';
    desc.innerHTML = `"${quoteText}"<br><span style="color: ${authorColor}; font-size: 14px; font-weight: 700; margin-top: 12px; display: inline-block;">- ${authorName}</span>`;
  } else {
    desc.innerText = t.alertDesc;
  }
  desc.style.cssText = `margin: 0 0 32px 0; font-size: 16px; color: ${isDark ? '#e5e2e1' : '#444'}; line-height: 1.6; font-weight: 500; font-style: italic;`;

  const btn = document.createElement('button');
  btn.innerText = t.alertBtn;
  btn.style.cssText = `
    padding: 14px 28px; background: #FF0000; color: #fff; border: none;
    border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px;
    transition: transform 0.1s, background 0.2s; width: 100%;
  `;
  btn.onmouseover = () => btn.style.background = "#cc0000";
  btn.onmouseout = () => btn.style.background = "#FF0000";
  btn.onmousedown = () => btn.style.transform = "scale(0.98)";
  btn.onmouseup = () => btn.style.transform = "scale(1)";

  btn.onclick = () => { restoreVideos(); modal.remove(); callback(); };

  box.appendChild(icon); box.appendChild(title); box.appendChild(desc); box.appendChild(btn);
  modal.appendChild(box);

  appendWhenBodyReady(modal);
}

// Initialize settings from storage
chrome.storage.local.get({
  hideHome: true,
  hideSearch: false,
  hideSponsored: false,
  enableCountLimit: true,
  countLimitValue: 5,
  enableTimeLimit: false,
  timeLimitValue: 1,
  timeLimitUnit: 'dakika',
  theme: defaultTheme,
  language: defaultLang,
  isExtensionEnabled: true
}, (res) => {
  settings = res;
  updateStyles();
  
  if (document.body) {
    checkUrl(currentUrl);
  } else {
    document.addEventListener('DOMContentLoaded', () => checkUrl(currentUrl));
  }
});

// Listen for setting changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.hideHome) settings.hideHome = changes.hideHome.newValue;
    if (changes.hideSearch) settings.hideSearch = changes.hideSearch.newValue;
    if (changes.hideSponsored) settings.hideSponsored = changes.hideSponsored.newValue;
    if (changes.enableCountLimit) settings.enableCountLimit = changes.enableCountLimit.newValue;
    if (changes.countLimitValue) settings.countLimitValue = changes.countLimitValue.newValue;
    if (changes.enableTimeLimit) settings.enableTimeLimit = changes.enableTimeLimit.newValue;
    if (changes.timeLimitValue) settings.timeLimitValue = changes.timeLimitValue.newValue;
    if (changes.timeLimitUnit) settings.timeLimitUnit = changes.timeLimitUnit.newValue;
    if (changes.theme) settings.theme = changes.theme.newValue;
    if (changes.language) settings.language = changes.language.newValue;
    if (changes.isExtensionEnabled !== undefined) settings.isExtensionEnabled = changes.isExtensionEnabled.newValue;
    
    updateStyles();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'URL_CHANGED') {
    if (currentUrl !== request.url) {
      currentUrl = request.url;
      checkUrl(currentUrl);
    }
  }
});

setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    checkUrl(currentUrl);
  }
}, 500);

function checkUrl(url) {
  if (!settings.isExtensionEnabled) return;

  const isShorts = url.includes('/shorts/');
  
  if (isShorts) {
    // If NO limits are active, do not prompt and do not start a session
    if (!settings.enableCountLimit && !settings.enableTimeLimit) {
      return;
    }

    if (!shortsSessionActive) {
      const video = document.querySelector('video');
      if (video) video.pause();

      promptUserForLimits({
        enableCount: settings.enableCountLimit,
        countLimitValue: settings.countLimitValue,
        enableTime: settings.enableTimeLimit,
        timeLimitValue: settings.timeLimitValue,
        timeLimitUnit: settings.timeLimitUnit
      }, (userInput) => {
        if (userInput === null) {
          window.location.href = '/';
          return;
        }
        
        shortsLimitCountValue = userInput.count;
        shortsLimitTimeValue = userInput.time;
        shortsLimitTimeUnit = userInput.timeUnit;
        
        shortsSessionActive = true;
        shortsWatchedCount = 1;
        shortsStartTime = Date.now();
        startLimitChecker();
        
        const vid = document.querySelector('video');
        if (vid) vid.play().catch(e => console.log(e));
      });
      
    } else {
      shortsWatchedCount++;
    }
    
    checkLimit();
  } else {
    shortsSessionActive = false;
    shortsWatchedCount = 0;
    stopLimitChecker();
  }
}

function startLimitChecker() {
    if (limitInterval) clearInterval(limitInterval);
    limitInterval = setInterval(checkLimit, 1000);
}

function stopLimitChecker() {
    if (limitInterval) clearInterval(limitInterval);
    limitInterval = null;
}

function checkLimit() {
    if (!shortsSessionActive || !settings.isExtensionEnabled) return;

    let limitExceeded = false;
    
    if (settings.enableCountLimit && shortsLimitCountValue !== null) {
        if (shortsWatchedCount > shortsLimitCountValue) limitExceeded = true;
    } 
    
    if (settings.enableTimeLimit && shortsLimitTimeValue !== null) {
        const timeSpentMs = Date.now() - shortsStartTime;
        let limitMs = 0;
        
        if (shortsLimitTimeUnit === 'saniye') limitMs = shortsLimitTimeValue * 1000;
        else if (shortsLimitTimeUnit === 'dakika') limitMs = shortsLimitTimeValue * 60 * 1000;
        else if (shortsLimitTimeUnit === 'saat') limitMs = shortsLimitTimeValue * 60 * 60 * 1000;
        else if (shortsLimitTimeUnit === 'günlük') limitMs = shortsLimitTimeValue * 24 * 60 * 60 * 1000;
        
        if (timeSpentMs > limitMs) limitExceeded = true;
    }

    if (limitExceeded) {
        shortsSessionActive = false;
        shortsWatchedCount = 0;
        stopLimitChecker();
        
        const video = document.querySelector('video');
        if (video) video.pause();

        showLimitExceededAlert(() => {
          window.location.href = '/';
        });
    }
}

function updateStyles() {
  let styleEl = document.getElementById('if-shield-global-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'if-shield-global-styles';
    if (document.head) {
      document.head.appendChild(styleEl);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.head.appendChild(styleEl);
      });
    }
  }

  let css = '';

  if (settings.isExtensionEnabled) {
    if (settings.hideHome) {
      css += `
        ytd-browse[page-subtype="home"] ytd-rich-shelf-renderer[is-shorts],
        ytd-browse[page-subtype="home"] ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
        ytd-browse[page-subtype="home"] ytd-rich-section-renderer:has(a[href^="/shorts/"]),
        ytd-browse[page-subtype="home"] grid-shelf-view-model:has(a[href^="/shorts/"]),
        ytd-guide-entry-renderer:has(a[title="Shorts"]),
        ytd-guide-entry-renderer:has(a[href^="/shorts"]),
        ytd-mini-guide-entry-renderer:has(a[title="Shorts"]),
        ytd-mini-guide-entry-renderer:has(a[href^="/shorts"]) {
          display: none !important;
        }
      `;
    }

    if (settings.hideSearch) {
      css += `
        /* Classic Renderers */
        ytd-search ytd-reel-shelf-renderer,
        ytd-search ytd-shelf-renderer:has(ytd-reel-item-renderer),
        ytd-search ytd-horizontal-card-list-renderer:has(ytd-reel-item-renderer),
        
        /* Modern View-Model Renderers & Generic Shelves */
        ytd-search ytd-shelf-renderer:has(a[href^="/shorts/"]),
        ytd-search ytd-rich-shelf-renderer:has(a[href^="/shorts/"]),
        ytd-search yt-horizontal-list-renderer:has(a[href^="/shorts/"]),
        ytd-search ytd-horizontal-card-list-renderer:has(a[href^="/shorts/"]),
        ytd-search grid-shelf-view-model:has(a[href^="/shorts/"]),
        
        /* Individual Shorts in Search */
        ytd-search ytd-video-renderer:has(a[href^="/shorts/"]),
        ytd-search yt-lockup-view-model:has(a[href^="/shorts/"]),
        ytd-search ytm-shorts-lockup-view-model:has(a[href^="/shorts/"]),
        ytd-search ytm-shorts-lockup-view-model-v2:has(a[href^="/shorts/"]) {
          display: none !important;
        }
      `;
    }

    if (settings.hideSponsored) {
      css += `
        /* Ad Layout Renderers & Containers */
        ytd-ad-slot-renderer,
        ytd-in-feed-ad-layout-renderer,
        ytd-search-pyv-renderer,
        ytd-promoted-sparkles-web-renderer,
        ytd-promoted-video-renderer,
        ytd-banner-promo-renderer,
        ad-slot-renderer,
        #masthead-ad,
        
        /* Parent Container Removal to prevent empty grid spaces */
        ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
        ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer),
        ytd-rich-item-renderer:has(.badge-style-type-ad),
        ytd-rich-item-renderer:has(.badge-style-type-sponsored),
        ytd-rich-item-renderer:has(ytd-badge-supported-renderer[is-ad]),
        
        /* View Models & Items containing Ad Badges */
        ytd-video-renderer:has(.badge-style-type-ad),
        ytd-video-renderer:has(.badge-style-type-sponsored),
        ytd-video-renderer:has(ytd-badge-supported-renderer[is-ad]),
        yt-lockup-view-model:has(.badge-style-type-ad),
        yt-lockup-view-model:has(.badge-style-type-sponsored),
        yt-lockup-view-model:has(ytd-badge-supported-renderer[is-ad]) {
          display: none !important;
        }
      `;
    }
  }

  styleEl.textContent = css;
}
