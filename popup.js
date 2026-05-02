// popup.js

const i18n = {
  tr: {
    appName: "IF-Shield for YouTube Shorts™",
    hideHomeTitle: "Ana Sayfada Shorts Gizle",
    hideHomeDesc: "Önerilen videoları engeller",
    hideSearchTitle: "Aramada Shorts Gizle",
    hideSearchDesc: "Arama sonuçlarındaki Shorts'ları engeller",
    hideSponsoredTitle: "Sponsorlu Engelleme",
    hideSponsoredDesc: "Sponsorlu reklamları arayüzden gizler",
    countLimitTitle: "Adet Limiti",
    countLimitDesc: "Video sayısına göre engeller",
    timeLimitTitle: "Zaman Limiti",
    timeLimitDesc: "İzlenen süreye göre engeller",
    optSaniye: "Saniye",
    optDakika: "Dakika",
    optSaat: "Saat",
    optGunluk: "Günlük",
    unitAdet: "Adet",
    saveBtn: "Ayarları Kaydet",
    savedBtn: "Kaydedildi!",
    statusActive: "Şu an koruma aktif",
    statusInactive: "Koruma pasif"
  },
  en: {
    appName: "IF-Shield for YouTube Shorts™",
    hideHomeTitle: "Hide Shorts on Home",
    hideHomeDesc: "Blocks recommended shorts videos",
    hideSearchTitle: "Hide Shorts in Search",
    hideSearchDesc: "Blocks shorts videos in search results",
    hideSponsoredTitle: "Block Sponsored",
    hideSponsoredDesc: "Hides sponsored ads from the interface",
    countLimitTitle: "Count Limit",
    countLimitDesc: "Blocks based on video count",
    timeLimitTitle: "Time Limit",
    timeLimitDesc: "Blocks based on time spent",
    optSaniye: "Seconds",
    optDakika: "Minutes",
    optSaat: "Hours",
    optGunluk: "Daily",
    unitAdet: "Count",
    saveBtn: "Save Settings",
    savedBtn: "Saved!",
    statusActive: "Protection is active",
    statusInactive: "Protection is passive"
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const hideHome = document.getElementById('hide-home');
  const hideSearch = document.getElementById('hide-search');
  const hideSponsored = document.getElementById('hide-sponsored');
  
  const enableCountLimit = document.getElementById('enable-count-limit');
  const countLimitValue = document.getElementById('count-limit-value');
  
  const enableTimeLimit = document.getElementById('enable-time-limit');
  const timeLimitValue = document.getElementById('time-limit-value');
  
  const unitDropdown = document.getElementById('time-unit-dropdown');
  const selectSelected = document.getElementById('time-select-selected');
  const selectedText = document.getElementById('time-selected-text');
  const selectItems = document.querySelector('.select-items');
  const optionDivs = selectItems.querySelectorAll('div');
  
  const saveBtn = document.getElementById('save-limit');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const masterToggle = document.getElementById('master-toggle');
  const shieldIcon = document.getElementById('shield-icon');
  const langToggle = document.getElementById('lang-toggle');
  const langText = document.getElementById('lang-text');
  const htmlTag = document.documentElement;

  let currentLang = 'tr';
  let isExtensionEnabled = true;
  let currentTimeLimitUnit = 'dakika';

  // Load existing settings
  chrome.storage.local.get({
    hideHome: true,
    hideSearch: true,
    hideSponsored: true,
    enableCountLimit: true,
    countLimitValue: 5,
    enableTimeLimit: false,
    timeLimitValue: 10,
    timeLimitUnit: 'dakika',
    theme: 'dark',
    language: 'tr',
    isExtensionEnabled: true
  }, (res) => {
    hideHome.checked = res.hideHome;
    hideSearch.checked = res.hideSearch;
    hideSponsored.checked = res.hideSponsored;
    
    enableCountLimit.checked = res.enableCountLimit;
    countLimitValue.value = res.countLimitValue;
    
    enableTimeLimit.checked = res.enableTimeLimit;
    timeLimitValue.value = res.timeLimitValue;
    currentTimeLimitUnit = res.timeLimitUnit;
    
    const activeOpt = Array.from(optionDivs).find(opt => opt.getAttribute('data-value') === currentTimeLimitUnit);
    if (activeOpt) selectedText.textContent = activeOpt.textContent;
    
    currentLang = res.language;
    langText.textContent = currentLang.toUpperCase();
    
    isExtensionEnabled = res.isExtensionEnabled;
    updateShieldIcon();
    
    if (res.theme === 'light') {
      htmlTag.classList.remove('dark');
      themeIcon.textContent = 'dark_mode';
    } else {
      htmlTag.classList.add('dark');
      themeIcon.textContent = 'light_mode';
    }
    
    applyTranslations();
    updateStatus();
  });

  // Custom Select Logic
  selectSelected.addEventListener('click', function(e) {
    e.stopPropagation();
    selectItems.classList.toggle('select-hide');
    this.classList.toggle('select-arrow-active');
  });

  document.addEventListener('click', function(e) {
    if (!unitDropdown.contains(e.target)) {
      selectItems.classList.add('select-hide');
      selectSelected.classList.remove('select-arrow-active');
    }
  });

  optionDivs.forEach(opt => {
    opt.addEventListener('click', function(e) {
      e.stopPropagation();
      currentTimeLimitUnit = this.getAttribute('data-value');
      selectedText.textContent = this.textContent;
      selectItems.classList.add('select-hide');
      selectSelected.classList.remove('select-arrow-active');
    });
  });

  function applyTranslations() {
    const t = i18n[currentLang];
    document.getElementById('t-appName').textContent = t.appName;
    document.getElementById('t-hideHomeTitle').textContent = t.hideHomeTitle;
    document.getElementById('t-hideHomeDesc').textContent = t.hideHomeDesc;
    document.getElementById('t-hideSearchTitle').textContent = t.hideSearchTitle;
    document.getElementById('t-hideSearchDesc').textContent = t.hideSearchDesc;
    document.getElementById('t-hideSponsoredTitle').textContent = t.hideSponsoredTitle;
    document.getElementById('t-hideSponsoredDesc').textContent = t.hideSponsoredDesc;
    
    document.getElementById('t-countLimitTitle').textContent = t.countLimitTitle;
    document.getElementById('t-countLimitDesc').textContent = t.countLimitDesc;
    document.getElementById('t-timeLimitTitle').textContent = t.timeLimitTitle;
    document.getElementById('t-timeLimitDesc').textContent = t.timeLimitDesc;
    
    document.getElementById('t-optSaniye').textContent = t.optSaniye;
    document.getElementById('t-optDakika').textContent = t.optDakika;
    document.getElementById('t-optSaat').textContent = t.optSaat;
    document.getElementById('t-optGunluk').textContent = t.optGunluk;
    document.getElementById('t-unitAdet').textContent = t.unitAdet;
    
    const activeOpt = Array.from(optionDivs).find(opt => opt.getAttribute('data-value') === currentTimeLimitUnit);
    if (activeOpt) selectedText.textContent = activeOpt.textContent;
    
    if (saveBtn.textContent !== t.savedBtn) saveBtn.textContent = t.saveBtn;
    updateStatus();
  }

  themeToggle.addEventListener('click', () => {
    if (htmlTag.classList.contains('dark')) {
      htmlTag.classList.remove('dark');
      themeIcon.textContent = 'dark_mode';
      chrome.storage.local.set({ theme: 'light' });
    } else {
      htmlTag.classList.add('dark');
      themeIcon.textContent = 'light_mode';
      chrome.storage.local.set({ theme: 'dark' });
    }
  });

  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'tr' ? 'en' : 'tr';
    langText.textContent = currentLang.toUpperCase();
    chrome.storage.local.set({ language: currentLang });
    applyTranslations();
  });

  masterToggle.addEventListener('click', () => {
    isExtensionEnabled = !isExtensionEnabled;
    chrome.storage.local.set({ isExtensionEnabled: isExtensionEnabled });
    updateShieldIcon();
    updateStatus();
  });

  function updateShieldIcon() {
    if (isExtensionEnabled) {
      masterToggle.classList.remove('inactive-shield');
      shieldIcon.style.fontVariationSettings = "'FILL' 1";
    } else {
      masterToggle.classList.add('inactive-shield');
      shieldIcon.style.fontVariationSettings = "'FILL' 0";
    }
  }

  function updateStatus() {
    const t = i18n[currentLang];
    if (isExtensionEnabled && (hideHome.checked || hideSearch.checked || hideSponsored.checked || enableCountLimit.checked || enableTimeLimit.checked)) {
      statusIndicator.classList.remove('inactive');
      statusIndicator.classList.add('active');
      statusText.textContent = t.statusActive;
    } else {
      statusIndicator.classList.remove('active');
      statusIndicator.classList.add('inactive');
      statusText.textContent = t.statusInactive;
    }
  }

  // Bind change events to sync directly to storage for toggles
  const syncToggle = (el, key) => {
    el.addEventListener('change', () => {
      chrome.storage.local.set({ [key]: el.checked });
      updateStatus();
    });
  };
  syncToggle(hideHome, 'hideHome');
  syncToggle(hideSearch, 'hideSearch');
  syncToggle(hideSponsored, 'hideSponsored');
  syncToggle(enableCountLimit, 'enableCountLimit');
  syncToggle(enableTimeLimit, 'enableTimeLimit');

  // Save Limits explicitly
  saveBtn.addEventListener('click', () => {
    chrome.storage.local.set({
      countLimitValue: parseFloat(countLimitValue.value) || 5,
      timeLimitValue: parseFloat(timeLimitValue.value) || 10,
      timeLimitUnit: currentTimeLimitUnit
    }, () => {
      const originalText = i18n[currentLang].saveBtn;
      saveBtn.textContent = i18n[currentLang].savedBtn;
      setTimeout(() => {
        saveBtn.textContent = originalText;
      }, 1500);
    });
  });
});
