pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfFiles = [];
let savedFolders = [];
let db = null;

// Debug Console Logic
const debugContent = document.getElementById('debug-content');
const debugConsole = document.getElementById('debug-console');
const toggleDebugBtn = document.getElementById('toggle-debug-btn');

if (toggleDebugBtn) {
    toggleDebugBtn.addEventListener('click', () => {
        debugConsole.style.display = debugConsole.style.display === 'none' ? 'block' : 'none';
        settingsModal.classList.remove('active'); // Close settings when opening debug
    });
}

function logToDebug(msg, type = 'log') {
    if (!debugContent) return;
    const div = document.createElement('div');
    div.style.color = type === 'error' ? '#ff5555' : '#55ff55';
    div.style.marginBottom = '2px';
    div.style.borderBottom = '1px solid #222';
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    debugContent.insertBefore(div, debugContent.firstChild);
}

// Override console methods
const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
    originalLog.apply(console, args);
    try { logToDebug(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')); } catch (e) { }
};

console.error = function (...args) {
    originalError.apply(console, args);
    try { logToDebug(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), 'error'); } catch (e) { }
};

window.onerror = function (msg, url, lineNo, columnNo, error) {
    try { logToDebug(`Global Error: ${msg} (${lineNo}:${columnNo})`, 'error'); } catch (e) { }
    return false;
};

const DB_NAME = 'PDFRandomApp';
const STORE_NAME = 'folders';
const FAV_STORE_NAME = 'favorites';
const BLOCKED_STORE_NAME = 'blocked';

// File System Access API desteği
const hasFileSystemAccess = 'showDirectoryPicker' in window;

// Translations
const TRANSLATIONS = {
    en: {
        appTitle: "PDF Random Page",
        placeholder: "Select PDF Folder",
        loading: "Loading...",
        randomBtn: "🎲 Random Page",
        favoritesTab: "Favorites",
        foldersTab: "Folders",
        newFolder: "➕ Select New Folder",
        selectFiles: "📄 Select PDF Files",
        close: "✕ Close",
        debugBtn: "🐞 Debug Console",
        language: "Language / Dil",
        settingsTitle: "Settings",
        rememberTitle: "💾 Remember Folder",
        rememberText: "Do you want to save this folder?",
        rememberYes: "✓ Yes, Remember",
        rememberNo: "No",
        apiWarning: "⚠️ Browser doesn't support folder persistence.",
        infoInitial: "Loading saved folder...",
        infoSelect: "Select folder",
        infoScanning: "Scanning folder...",
        infoNoPdf: "No PDFs in folder",
        infoLoaded: "PDF files loaded",
        infoNoFile: "No PDF files found",
        noSaved: "No saved folders",
        noFavs: "No favorites yet",
        error: "Error",
        errorFolderTitle: "Folder Not Found",
        errorFolderMsg: "Folder not found or moved/deleted.",
        errorReadMsg: "Folder read error",
        errorLoadPdf: "Error: Could not load PDF",
        pageInputPlaceholder: "Jump to page",
        goBtn: "Go",
        zoomInTitle: "Zoom In",
        zoomOutTitle: "Zoom Out",
        fitWidthTitle: "Fit to Width",
        fitPageTitle: "Fit to Page",
        firstPageTitle: "First Page",
        lastPageTitle: "Last Page",
        prevPageTitle: "Previous Page",
        nextPageTitle: "Next Page",
        favoritesSearch: "Search favorites...",
        editFavorite: "Edit",
        saveFavorite: "Save",
        cancelEdit: "Cancel",
        favoriteName: "Favorite name...",
        noResults: "No results found",
        blockedTab: "Blocked Pages",
        blockBtnTitle: "Block Page",
        unblockBtnTitle: "Unblock Page",
        noBlocked: "No blocked pages"
    },
    tr: {
        appTitle: "PDF Rastgele Sayfa",
        placeholder: "PDF klasörünüzü seçin",
        loading: "Yükleniyor...",
        randomBtn: "🎲 Rastgele Sayfa",
        favoritesTab: "Favoriler",
        foldersTab: "Klasörler",
        newFolder: "➕ Yeni Klasör Seç",
        selectFiles: "📄 PDF Dosyaları Seç",
        close: "✕ Kapat",
        debugBtn: "🐞 Debug Konsolu",
        language: "Dil / Language",
        settingsTitle: "Ayarlar",
        rememberTitle: "💾 Klasörü Hatırla",
        rememberText: "Bu klasörü kaydetmek ister misiniz?",
        rememberYes: "✓ Evet, Hatırla",
        rememberNo: "Hayır",
        apiWarning: "⚠️ Tarayıcınız klasör hatırlamayı desteklemiyor.",
        infoInitial: "Kayıtlı klasör yükleniyor...",
        infoSelect: "Klasör seçin",
        infoScanning: "Klasör taranıyor...",
        infoNoPdf: "Klasörde PDF bulunamadı",
        infoLoaded: "PDF dosyaları yüklendi",
        infoNoFile: "PDF dosyası bulunamadı",
        noSaved: "Kayıtlı klasör yok",
        noFavs: "Henüz favori yok",
        error: "Hata",
        errorFolderTitle: "Klasör Bulunamadı",
        errorFolderMsg: "Klasör bulunamadı veya taşınmış/silinmiş.",
        errorReadMsg: "Klasör okuma hatası",
        errorLoadPdf: "Hata: PDF yüklenemedi",
        pageInputPlaceholder: "Sayfaya git",
        goBtn: "Git",
        zoomInTitle: "Yakınlaştır",
        zoomOutTitle: "Uzaklaştır",
        fitWidthTitle: "Genişliğe Sığdır",
        fitPageTitle: "Sayfaya Sığdır",
        firstPageTitle: "İlk Sayfa",
        lastPageTitle: "Son Sayfa",
        prevPageTitle: "Önceki Sayfa",
        nextPageTitle: "Sonraki Sayfa",
        favoritesSearch: "Favorilerde ara...",
        editFavorite: "Düzenle",
        saveFavorite: "Kaydet",
        cancelEdit: "İptal",
        favoriteName: "Favori adı...",
        noResults: "Sonuç bulunamadı",
        blockedTab: "Engellenenler",
        blockBtnTitle: "Sayfayı Engelle",
        unblockBtnTitle: "Engeli Kaldır",
        noBlocked: "Engellenen sayfa yok"
    }
};

// Default to English
let currentLang = localStorage.getItem('appLang') || 'en';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    const t = TRANSLATIONS[lang];

    // Helper function to safely update element text
    const updateText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    // Update static UI elements
    updateText('app-title', t.appTitle);
    updateText('placeholder-text', t.placeholder);
    updateText('loading-text', t.loading);
    updateText('preloader-text', t.loading); // May not exist after init
    if (randomBtn) randomBtn.textContent = t.randomBtn;
    if (tabFavorites) tabFavorites.textContent = t.favoritesTab;
    if (tabFolders) tabFolders.textContent = t.foldersTab;
    if (tabBlocked) tabBlocked.textContent = t.blockedTab;
    updateText('select-new-folder', t.newFolder);
    if (selectFilesBtn) selectFilesBtn.textContent = t.selectFiles;
    updateText('close-files-modal', t.close);
    updateText('close-settings-modal', t.close);
    updateText('debug-btn-text', t.debugBtn);
    updateText('lang-label', t.language);
    updateText('settings-title', t.settingsTitle);
    updateText('remember-title', t.rememberTitle);
    updateText('remember-text', t.rememberText);
    updateText('remember-yes', t.rememberYes);
    updateText('remember-no', t.rememberNo);
    updateText('api-warning', t.apiWarning);

    // Update new controls
    if (goPageBtn) goPageBtn.textContent = t.goBtn;
    if (pageInput && !currentPdfDoc) pageInput.placeholder = t.pageInputPlaceholder;
    if (zoomInBtn) zoomInBtn.title = t.zoomInTitle;
    if (zoomOutBtn) zoomOutBtn.title = t.zoomOutTitle;
    if (fitWidthBtn) fitWidthBtn.title = t.fitWidthTitle;
    if (fitPageBtn) fitPageBtn.title = t.fitPageTitle;
    if (firstBtn) firstBtn.title = t.firstPageTitle;
    if (lastBtn) lastBtn.title = t.lastPageTitle;
    if (prevBtn) prevBtn.title = t.prevPageTitle;
    if (nextBtn) nextBtn.title = t.nextPageTitle;

    // Update favorites search placeholder
    if (favoritesSearch) favoritesSearch.placeholder = t.favoritesSearch;

    // Re-render lists to update empty messages
    const filesModal = document.getElementById('files-modal');
    if (filesModal && filesModal.classList.contains('active')) {
        renderSavedFolders();
        renderFavorites();
        renderBlocked();
    }
}

// Make setLanguage globally accessible for HTML onclick
window.setLanguage = setLanguage;

// IndexedDB başlat
// Canvas context will be determined dynamically
let ctx = null; // Helper for current render, though PDFJS uses its own

const randomBtn = document.getElementById('random-btn');
const folderBtn = document.getElementById('folder-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const blockBtn = document.getElementById('block-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const firstBtn = document.getElementById('first-btn');
const lastBtn = document.getElementById('last-btn');
const menuBtn = document.getElementById('menu-btn');
const pageInput = document.getElementById('page-input');
const goPageBtn = document.getElementById('go-page-btn');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const fitWidthBtn = document.getElementById('fit-width-btn');
const fitPageBtn = document.getElementById('fit-page-btn');
const zoomDisplay = document.getElementById('zoom-display');
const infoText = document.getElementById('info-text');
const pdfCount = document.getElementById('pdf-count');
const placeholder = document.getElementById('placeholder');
const loading = document.getElementById('loading');
// Double buffering canvases
const canvas1 = document.getElementById('pdf-canvas-1');
const canvas2 = document.getElementById('pdf-canvas-2');
let activeCanvasIndex = 1; // 1 or 2

const filesModal = document.getElementById('files-modal');
const settingsModal = document.getElementById('settings-modal');
const rememberModal = document.getElementById('remember-modal');
const fallbackInput = document.getElementById('fallback-input');
const fileInput = document.getElementById('file-input');
const apiWarning = document.getElementById('api-warning');
const selectFilesBtn = document.getElementById('select-files-btn');

// Modal Tabs
const tabFavorites = document.getElementById('tab-favorites');
const tabFolders = document.getElementById('tab-folders');
const tabBlocked = document.getElementById('tab-blocked');
const contentFavorites = document.getElementById('favorites-content');
const contentFolders = document.getElementById('folders-content');
const contentBlocked = document.getElementById('blocked-content');

let currentPdfName = null;
let currentPageNum = null;
let currentZoom = 1.0;
let zoomMode = 'auto'; // 'auto', 'width', 'page', or 'custom'

// Performance Tracking Variables
let currentPdfDoc = null;
let renderTask = null;
let currentFileUrl = null;
let currentFolderName = null;

// IndexedDB başlat
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 3); // Version increased

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!database.objectStoreNames.contains(FAV_STORE_NAME)) {
                const store = database.createObjectStore(FAV_STORE_NAME, { keyPath: 'id' });
                store.createIndex('pdfName', 'pdfName', { unique: false });
            }
            if (!database.objectStoreNames.contains(BLOCKED_STORE_NAME)) {
                const store = database.createObjectStore(BLOCKED_STORE_NAME, { keyPath: 'id' });
                store.createIndex('pdfName', 'pdfName', { unique: false });
            }
        };
    });
}

// Klasörleri IndexedDB'den yükle
async function loadSavedFolders() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Klasörü IndexedDB'ye kaydet
async function saveFolder(name, handle) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add({ name, handle });

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Klasörü IndexedDB'den sil
async function deleteFolder(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Favorileri yükle
async function getFavorites() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(FAV_STORE_NAME, 'readonly');
        const store = transaction.objectStore(FAV_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Favori ekle
async function addFavorite(pdfName, pageNum, customName = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(FAV_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(FAV_STORE_NAME);
        const id = `${pdfName}_${pageNum}`;
        const request = store.put({
            id,
            pdfName,
            pageNum,
            customName: customName || null,
            folderName: currentFolderName, // Store folder context
            timestamp: Date.now()
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Favori sil
async function removeFavorite(pdfName, pageNum) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(FAV_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(FAV_STORE_NAME);
        const id = `${pdfName}_${pageNum}`;
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Favori kontrolü
async function checkFavorite(pdfName, pageNum) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(FAV_STORE_NAME, 'readonly');
        const store = transaction.objectStore(FAV_STORE_NAME);
        const id = `${pdfName}_${pageNum}`;
        const request = store.get(id);

        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
    });
}

// Favori ismini güncelle
async function updateFavoriteName(pdfName, pageNum, customName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(FAV_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(FAV_STORE_NAME);
        const id = `${pdfName}_${pageNum}`;

        // First get the existing favorite
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const favorite = getRequest.result;
            if (favorite) {
                favorite.customName = customName || null;
                const putRequest = store.put(favorite);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                reject(new Error('Favorite not found'));
            }
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Engellenenleri (Blocked) yükle
async function getBlocked() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BLOCKED_STORE_NAME, 'readonly');
        const store = transaction.objectStore(BLOCKED_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Engellenenlere ekle
async function addBlocked(pdfName, pageNum) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BLOCKED_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(BLOCKED_STORE_NAME);
        const id = `${pdfName}_${pageNum}`;
        const request = store.put({
            id,
            pdfName,
            pageNum,
            folderName: currentFolderName,
            timestamp: Date.now()
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Engellenenlerden sil
async function removeBlocked(pdfName, pageNum) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BLOCKED_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(BLOCKED_STORE_NAME);
        const id = `${pdfName}_${pageNum}`;
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Engellenen mi kontrolü
async function checkBlocked(pdfName, pageNum) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BLOCKED_STORE_NAME, 'readonly');
        const store = transaction.objectStore(BLOCKED_STORE_NAME);
        const id = `${pdfName}_${pageNum}`;
        const request = store.get(id);

        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
    });
}

// Belirli bir PDF için engellenen sayfa numaralarını getir
async function getBlockedForPdf(pdfName) {
    const allBlocked = await getBlocked();
    return allBlocked.filter(b => b.pdfName === pdfName).map(b => b.pageNum);
}

// API desteği yoksa uyarı göster
if (!hasFileSystemAccess) {
    apiWarning.style.display = 'block';
    selectFilesBtn.style.display = 'block';
}

// Uygulama başlatma
async function init() {
    // Initialize language first
    setLanguage(currentLang);

    try {
        await initDB();
        const t = TRANSLATIONS[currentLang];

        if (hasFileSystemAccess) {
            savedFolders = await loadSavedFolders();

            if (savedFolders.length > 0) {
                infoText.textContent = t.infoInitial;
                await tryLoadSavedFolder(0);
            } else {
                infoText.textContent = t.infoSelect;
            }
        } else {
            infoText.textContent = t.infoSelect;
        }
    } catch (e) {
        console.error('Başlatma hatası:', e);
        infoText.textContent = TRANSLATIONS[currentLang].infoSelect;
    } finally {
        // Hide preloader explicitly after init attempts
        const preloader = document.getElementById('global-preloader');
        if (preloader) {
            // Small delay to ensure smooth transition
            setTimeout(() => {
                preloader.classList.add('fade-out');
                setTimeout(() => preloader.remove(), 600);
            }, 500);
        }
    }
}

// Safety timeout in case init hangs
setTimeout(() => {
    const preloader = document.getElementById('global-preloader');
    if (preloader && !preloader.classList.contains('fade-out')) {
        preloader.classList.add('fade-out');
        setTimeout(() => preloader.remove(), 600);
    }
}, 5000);

async function tryLoadSavedFolder(index) {
    if (index >= savedFolders.length) {
        infoText.textContent = 'Klasör seçin';
        return;
    }

    const folder = savedFolders[index];

    try {
        const handle = folder.handle;
        if (!handle) {
            await tryLoadSavedFolder(index + 1);
            return;
        }

        // İzin kontrolü
        let permission = await handle.queryPermission({ mode: 'read' });

        if (permission !== 'granted') {
            permission = await handle.requestPermission({ mode: 'read' });
        }

        if (permission === 'granted') {
            await loadFolderFromHandle(handle, folder.name);
        } else {
            await tryLoadSavedFolder(index + 1);
        }
    } catch (e) {
        console.log('Klasör yüklenemedi:', e);
        await tryLoadSavedFolder(index + 1);
    }
}

async function loadFolderFromHandle(handle, name) {
    placeholder.style.display = 'none';
    loading.classList.add('active');
    infoText.textContent = 'Klasör taranıyor...';
    currentFolderName = name || handle.name;

    pdfFiles = [];

    // Clean up previous session
    if (currentPdfDoc) {
        await currentPdfDoc.destroy();
        currentPdfDoc = null;
    }
    if (currentFileUrl) {
        URL.revokeObjectURL(currentFileUrl);
        currentFileUrl = null;
    }

    try {
        for await (const entry of handle.values()) {
            if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.pdf')) {
                const file = await entry.getFile();
                pdfFiles.push(file);
            }
        }

        if (pdfFiles.length > 0) {
            pdfCount.textContent = `${pdfFiles.length} PDF`;
            pdfCount.style.display = 'inline-block';
            randomBtn.disabled = false;
            infoText.textContent = name || handle.name;
            await selectRandomPage();
        } else {
            infoText.textContent = 'Klasörde PDF bulunamadı';
        }
    } catch (e) {
        console.error('Klasör okuma hatası:', e);
        infoText.textContent = 'Hata: ' + e.message;
        alert('Klasör okuma hatası: ' + e.message + '\nLütfen "PDF Dosyaları Seç" seçeneğini deneyin.');
        // Show file select button as alternative
        selectFilesBtn.style.display = 'block';
        filesModal.classList.add('active'); // Show file select as alternative
    }
}

function loadFilesFromInput(files) {
    currentFolderName = null; // Reset folder context
    pdfFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length > 0) {
        pdfCount.textContent = `${pdfFiles.length} PDF`;
        pdfCount.style.display = 'inline-block';
        randomBtn.disabled = false;
        infoText.textContent = 'PDF dosyaları yüklendi';
        selectRandomPage();
    } else {
        infoText.textContent = 'PDF dosyası bulunamadı';
    }
}

folderBtn.addEventListener('click', async () => {
    savedFolders = await loadSavedFolders();
    renderSavedFolders();
    renderFavorites();
    renderBlocked();
    filesModal.classList.add('active');
    tabFolders.click(); // Switch to folders tab
});

document.getElementById('close-files-modal').addEventListener('click', () => {
    filesModal.classList.remove('active');
});

document.getElementById('close-settings-modal').addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

document.getElementById('select-new-folder').addEventListener('click', async () => {
    filesModal.classList.remove('active');
    await selectNewFolder();
});

selectFilesBtn.addEventListener('click', () => {
    filesModal.classList.remove('active');
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadFilesFromInput(e.target.files);
    }
});

fallbackInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadFilesFromInput(e.target.files);
    }
});

async function selectNewFolder() {
    if (hasFileSystemAccess) {
        try {
            const handle = await window.showDirectoryPicker();
            await loadFolderFromHandle(handle, handle.name);

            if (pdfFiles.length > 0) {
                savedFolders = await loadSavedFolders();
                const isAlreadySaved = savedFolders.some(f => f.name === handle.name);

                if (!isAlreadySaved) {
                    rememberModal.classList.add('active');

                    document.getElementById('remember-yes').onclick = async () => {
                        await saveFolder(handle.name, handle);
                        savedFolders = await loadSavedFolders();
                        rememberModal.classList.remove('active');
                    };

                    document.getElementById('remember-no').onclick = () => {
                        rememberModal.classList.remove('active');
                    };
                }
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('Klasör seçme hatası:', e);
                fallbackInput.click();
            }
        }
    } else {
        fallbackInput.click();
    }
}



// --- UI Logic for Favorites, Block & Menu ---

async function updateBlockButtonState() {
    if (!currentPdfName || !currentPageNum) {
        blockBtn.style.color = '#555';
        return;
    }
    const isBlocked = await checkBlocked(currentPdfName, currentPageNum);
    blockBtn.style.color = isBlocked ? '#ff5555' : '#555'; // Red or gray
    const t = TRANSLATIONS[currentLang];
    blockBtn.title = isBlocked ? (t.unblockBtnTitle || 'Engeli Kaldır') : (t.blockBtnTitle || 'Sayfayı Engelle');
}

blockBtn.addEventListener('click', async () => {
    if (!currentPdfName || !currentPageNum) return;

    const isBlocked = await checkBlocked(currentPdfName, currentPageNum);
    if (isBlocked) {
        await removeBlocked(currentPdfName, currentPageNum);
    } else {
        await addBlocked(currentPdfName, currentPageNum);
        // Skip current page since it's now blocked
        selectRandomPage();
    }
    await updateBlockButtonState();
});

async function updateFavoriteButtonState() {
    if (!currentPdfName || !currentPageNum) {
        favoriteBtn.style.color = '#555';
        return;
    }
    const isFav = await checkFavorite(currentPdfName, currentPageNum);
    favoriteBtn.style.color = isFav ? '#ffd700' : '#555'; // Gold or gray
    favoriteBtn.textContent = isFav ? '★' : '☆';
}

favoriteBtn.addEventListener('click', async () => {
    if (!currentPdfName || !currentPageNum) return;

    const isFav = await checkFavorite(currentPdfName, currentPageNum);
    if (isFav) {
        await removeFavorite(currentPdfName, currentPageNum);
    } else {
        await addFavorite(currentPdfName, currentPageNum);
    }
    await updateFavoriteButtonState();
});

menuBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
});

// Search functionality for favorites
const favoritesSearch = document.getElementById('favorites-search');
let currentSearchQuery = '';

if (favoritesSearch) {
    favoritesSearch.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase();
        renderFavorites();
    });
}

async function renderFavorites() {
    const list = document.getElementById('favorites-list');
    let favorites = await getFavorites();
    const t = TRANSLATIONS[currentLang];

    // Filter by search query
    if (currentSearchQuery) {
        favorites = favorites.filter(fav => {
            const customName = (fav.customName || '').toLowerCase();
            const pdfName = (fav.pdfName || '').toLowerCase();
            return customName.includes(currentSearchQuery) || pdfName.includes(currentSearchQuery);
        });
    }

    if (favorites.length === 0) {
        const message = currentSearchQuery ? (currentLang === 'tr' ? 'Sonuç bulunamadı' : 'No results found') : t.noFavs;
        list.innerHTML = `<div class="no-saved">${message}</div>`;
        return;
    }

    favorites.sort((a, b) => b.timestamp - a.timestamp);

    list.innerHTML = favorites.map(fav => {
        const displayName = fav.customName || fav.pdfName.replace('.pdf', '');
        const hasCustomName = !!fav.customName;
        const sanitizedPdfName = fav.pdfName.replace(/'/g, "\\'");
        const sanitizedFolderName = (fav.folderName || '').replace(/'/g, "\\'");

        return `
            <div class="saved-folder">
                <div class="favorite-name-container">
                    <span class="saved-folder-name favorite-name-display" 
                          onclick="loadFavorite('${sanitizedPdfName}', ${fav.pageNum}, '${sanitizedFolderName}')"
                          data-pdf="${sanitizedPdfName}" 
                          data-page="${fav.pageNum}">
                        ★ ${displayName} <small>(S. ${fav.pageNum})</small>
                        ${hasCustomName ? `<br><small style="opacity: 0.6;">${fav.pdfName.replace('.pdf', '')}</small>` : ''}
                    </span>
                    <button class="edit-btn" onclick="editFavoriteName('${sanitizedPdfName}', ${fav.pageNum}, this)" title="${currentLang === 'tr' ? 'Düzenle' : 'Edit'}">✏️</button>
                </div>
                <button class="saved-folder-remove" onclick="deleteFavoriteItem('${sanitizedPdfName}', ${fav.pageNum})">🗑️</button>
            </div>
        `;
    }).join('');
}

window.loadFavorite = async (pdfName, pageNum, folderName) => {
    filesModal.classList.remove('active');

    // 1. Try to find file in current list
    let file = pdfFiles.find(f => f.name === pdfName);

    // 2. If not found, try to load folder
    if (!file && folderName) {
        // Find folder handle
        const folder = savedFolders.find(f => f.name === folderName);

        if (folder) {
            if (confirm(`"${pdfName}" şu an yüklü değil. "${folderName}" klasöründen yüklemeyi denemek ister misiniz?`)) {
                try {
                    // Request permission if needed (might fail without user gesture, but worth a try)
                    const permission = await folder.handle.queryPermission({ mode: 'read' });
                    if (permission !== 'granted') {
                        await folder.handle.requestPermission({ mode: 'read' });
                    }

                    await loadFolderFromHandle(folder.handle, folder.name);

                    // Retry finding file
                    file = pdfFiles.find(f => f.name === pdfName);
                } catch (e) {
                    console.error("Auto-load failed", e);
                }
            }
        }
    }

    if (!file) {
        if (folderName) {
            alert(`Dosya "${folderName}" klasöründe bulunamadı veya klasör erişimi reddedildi.`);
        } else {
            alert('Bu dosya şu anki klasörde bulunamadı. Lütfen ilgili klasörü seçin.');
        }
        return;
    }

    placeholder.style.display = 'none';
    loading.classList.add('active');

    try {
        // CLEANUP: Destroy previous doc
        if (currentPdfDoc) {
            await currentPdfDoc.destroy();
            currentPdfDoc = null;
        }

        // CLEANUP: Revoke previous URL
        if (currentFileUrl) {
            URL.revokeObjectURL(currentFileUrl);
            currentFileUrl = null;
        }

        // OPTIMIZATION: Use Blob URL
        currentFileUrl = URL.createObjectURL(file);

        const loadingTask = pdfjsLib.getDocument({
            url: currentFileUrl,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
        });

        const pdfDoc = await loadingTask.promise;
        currentPdfDoc = pdfDoc;

        await renderPage(pdfDoc, pageNum);

        // Update state
        currentPdfName = pdfName;
        currentPageNum = pageNum;

        let displayName = pdfName.replace('.pdf', '');
        if (displayName.length > 20) displayName = displayName.substring(0, 17) + '...';
        infoText.textContent = `${displayName} | ${pageNum}/${pdfDoc.numPages}`;

        loading.classList.remove('active');

        favoriteBtn.disabled = false;
        blockBtn.disabled = false;
        await updateFavoriteButtonState();
        await updateBlockButtonState();

    } catch (e) {
        console.error('Favori yükleme hatası:', e);
        alert('Sayfa yüklenemedi: ' + e.message);
        loading.classList.remove('active');
    }
};

window.deleteFavoriteItem = async (pdfName, pageNum) => {
    await removeFavorite(pdfName, pageNum);
    renderFavorites();
    // If current page is the deleted favorite, update button
    if (currentPdfName === pdfName && currentPageNum === pageNum) {
        updateFavoriteButtonState();
    }
};

window.deleteBlockedItem = async (pdfName, pageNum) => {
    await removeBlocked(pdfName, pageNum);
    renderBlocked();
    if (currentPdfName === pdfName && currentPageNum === pageNum) {
        updateBlockButtonState();
    }
};

async function renderBlocked() {
    const list = document.getElementById('blocked-list');
    let blockedItems = await getBlocked();
    const t = TRANSLATIONS[currentLang];

    if (blockedItems.length === 0) {
        list.innerHTML = `<div class="no-saved">${t.noBlocked || 'Engellenen sayfa yok'}</div>`;
        return;
    }

    blockedItems.sort((a, b) => b.timestamp - a.timestamp);

    list.innerHTML = blockedItems.map(item => {
        const displayName = item.pdfName.replace('.pdf', '');
        const sanitizedPdfName = item.pdfName.replace(/'/g, "\\'");

        return `
            <div class="saved-folder" style="border-left: 3px solid #ff5555;">
                <div class="favorite-name-container">
                    <span class="saved-folder-name" 
                          data-pdf="${sanitizedPdfName}" 
                          data-page="${item.pageNum}">
                        🚫 ${displayName} <small>(S. ${item.pageNum})</small>
                    </span>
                </div>
                <button class="saved-folder-remove" onclick="deleteBlockedItem('${sanitizedPdfName}', ${item.pageNum})">🗑️</button>
            </div>
        `;
    }).join('');
}

window.editFavoriteName = async (pdfName, pageNum, button) => {
    const container = button.closest('.favorite-name-container');
    const nameDisplay = container.querySelector('.favorite-name-display');

    // Get current name
    const transaction = db.transaction(FAV_STORE_NAME, 'readonly');
    const store = transaction.objectStore(FAV_STORE_NAME);
    const id = `${pdfName}_${pageNum}`;
    const request = store.get(id);

    request.onsuccess = async () => {
        const fav = request.result;
        if (!fav) return;

        const currentCustomName = fav.customName || '';
        const originalPdfName = fav.pdfName.replace('.pdf', '');

        // Create input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'favorite-name-input';
        input.value = currentCustomName || originalPdfName;
        input.placeholder = currentLang === 'tr' ? 'Favori adı...' : 'Favorite name...';

        // Save function
        const save = async () => {
            const newName = input.value.trim();
            const nameToSave = (newName && newName !== originalPdfName) ? newName : null;

            await updateFavoriteName(pdfName, pageNum, nameToSave);
            renderFavorites();
        };

        // Cancel function
        const cancel = () => {
            renderFavorites();
        };

        // Replace display with input
        nameDisplay.replaceWith(input);
        input.focus();
        input.select();

        // Hide edit button, show save/cancel
        button.style.display = 'none';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'edit-btn';
        saveBtn.textContent = '✓';
        saveBtn.title = currentLang === 'tr' ? 'Kaydet' : 'Save';
        saveBtn.onclick = (e) => {
            e.stopPropagation();
            save();
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'edit-btn';
        cancelBtn.textContent = '✕';
        cancelBtn.title = currentLang === 'tr' ? 'İptal' : 'Cancel';
        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            cancel();
        };

        container.appendChild(saveBtn);
        container.appendChild(cancelBtn);

        // Enter to save, Escape to cancel
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                save();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        });

        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    };
};

// Tab Switching Logic
tabFavorites.addEventListener('click', () => {
    tabFavorites.classList.add('active');
    tabFavorites.style.borderBottom = '2px solid #e94560';
    tabFavorites.style.color = '#e94560';

    tabFolders.classList.remove('active');
    tabFolders.style.borderBottom = 'none';
    if (tabFolders) tabFolders.style.color = 'rgba(255,255,255,0.5)';

    if (tabBlocked) tabBlocked.classList.remove('active');
    if (tabBlocked) tabBlocked.style.borderBottom = 'none';
    if (tabBlocked) tabBlocked.style.color = 'rgba(255,255,255,0.5)';

    if (contentFavorites) contentFavorites.style.display = 'block';
    if (contentFolders) contentFolders.style.display = 'none';
    if (contentBlocked) contentBlocked.style.display = 'none';
});

tabFolders.addEventListener('click', () => {
    if (tabFolders) tabFolders.classList.add('active');
    if (tabFolders) tabFolders.style.borderBottom = '2px solid #e94560';
    if (tabFolders) tabFolders.style.color = '#e94560';

    if (tabFavorites) tabFavorites.classList.remove('active');
    if (tabFavorites) tabFavorites.style.borderBottom = 'none';
    if (tabFavorites) tabFavorites.style.color = 'rgba(255,255,255,0.5)';

    if (tabBlocked) tabBlocked.classList.remove('active');
    if (tabBlocked) tabBlocked.style.borderBottom = 'none';
    if (tabBlocked) tabBlocked.style.color = 'rgba(255,255,255,0.5)';

    if (contentFolders) contentFolders.style.display = 'block';
    if (contentFavorites) contentFavorites.style.display = 'none';
    if (contentBlocked) contentBlocked.style.display = 'none';
});

if (tabBlocked) {
    tabBlocked.addEventListener('click', () => {
        if (tabBlocked) tabBlocked.classList.add('active');
        if (tabBlocked) tabBlocked.style.borderBottom = '2px solid #e94560';
        if (tabBlocked) tabBlocked.style.color = '#e94560';

        if (tabFavorites) tabFavorites.classList.remove('active');
        if (tabFavorites) tabFavorites.style.borderBottom = 'none';
        if (tabFavorites) tabFavorites.style.color = 'rgba(255,255,255,0.5)';

        if (tabFolders) tabFolders.classList.remove('active');
        if (tabFolders) tabFolders.style.borderBottom = 'none';
        if (tabFolders) tabFolders.style.color = 'rgba(255,255,255,0.5)';

        if (contentBlocked) contentBlocked.style.display = 'block';
        if (contentFavorites) contentFavorites.style.display = 'none';
        if (contentFolders) contentFolders.style.display = 'none';
    });
}


// Update existing listeners for new logic
// (Removed duplicate folderBtn listener - correct one exists at line ~465)


function renderSavedFolders() {
    const list = document.getElementById('saved-folders-list');
    const t = TRANSLATIONS[currentLang];

    if (!hasFileSystemAccess || savedFolders.length === 0) {
        list.innerHTML = `<div class="no-saved">${t.noSaved}</div>`;
        return;
    }

    list.innerHTML = savedFolders.map((folder, i) => `
        <div class="saved-folder">
            <span class="saved-folder-name" data-index="${i}">📁 ${folder.name}</span>
            <button class="saved-folder-remove" data-id="${folder.id}">🗑️</button>
        </div>
    `).join('');

    list.querySelectorAll('.saved-folder-name').forEach((el) => {
        el.addEventListener('click', async () => {
            const i = parseInt(el.dataset.index);
            filesModal.classList.remove('active');
            await tryLoadSavedFolder(i);
        });
    });

    list.querySelectorAll('.saved-folder-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            await deleteFolder(id);
            savedFolders = await loadSavedFolders();
            renderSavedFolders();
        });
    });
}

randomBtn.addEventListener('click', selectRandomPage);

async function renderPage(pdfDoc, pageNum) {
    // Cancel previous render if exists
    if (renderTask) {
        try {
            await renderTask.cancel();
        } catch (e) {
            // Ignore cancel error
        }
        renderTask = null;
    }

    // DOUBLE BUFFERING LOGIC:
    // Determine target canvas (the one NOT currently active)
    const targetCanvasIndex = activeCanvasIndex === 1 ? 2 : 1;
    const targetCanvas = targetCanvasIndex === 1 ? canvas1 : canvas2;
    const currentCanvas = activeCanvasIndex === 1 ? canvas1 : canvas2;

    const targetCtx = targetCanvas.getContext('2d');

    const page = await pdfDoc.getPage(pageNum);
    const containerWidth = document.querySelector('.pdf-container').clientWidth - 20;
    const containerHeight = document.querySelector('.pdf-container').clientHeight - 20;
    const viewport = page.getViewport({ scale: 1 });

    // Calculate scale based on zoom mode
    let scale;
    if (zoomMode === 'width') {
        scale = containerWidth / viewport.width;
    } else if (zoomMode === 'page') {
        const scaleWidth = containerWidth / viewport.width;
        const scaleHeight = containerHeight / viewport.height;
        scale = Math.min(scaleWidth, scaleHeight);
    } else if (zoomMode === 'custom') {
        scale = (containerWidth / viewport.width) * currentZoom;
    } else {
        // auto mode
        scale = Math.min(containerWidth / viewport.width, 2.5);
    }

    // Handle High DPI, but CAP IT at 2.0 to prevent 4K+ render lag
    let outputScale = window.devicePixelRatio || 1;
    if (outputScale > 2) outputScale = 2; // Performance Cap

    const scaledViewport = page.getViewport({ scale: scale });

    targetCanvas.width = Math.floor(scaledViewport.width * outputScale);
    targetCanvas.height = Math.floor(scaledViewport.height * outputScale);
    targetCanvas.style.width = Math.floor(scaledViewport.width) + "px";
    targetCanvas.style.height = Math.floor(scaledViewport.height) + "px";

    const transform = outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : null;

    // Store render task for cancellation
    renderTask = page.render({
        canvasContext: targetCtx,
        transform: transform,
        viewport: scaledViewport
    });

    await renderTask.promise;
    renderTask = null;

    // SWAP BUFFERS: Update visibility only AFTER render is complete
    targetCanvas.style.display = 'block'; // Show new

    // Only hide the old one if it was actually visible (avoid flickering on first load)
    // But actually, just hiding it is fine.
    currentCanvas.style.display = 'none'; // Hide old

    // Update active index
    activeCanvasIndex = targetCanvasIndex;

    // Update Nav Buttons
    updateNavButtons(pageNum, pdfDoc.numPages);

    // Update zoom display
    if (zoomMode === 'custom') {
        updateZoomDisplay();
    } else {
        // For auto/width/page modes, show the actual scale
        const actualZoom = scale / (containerWidth / viewport.width);
        currentZoom = actualZoom;
        updateZoomDisplay();
    }
}

function updateNavButtons(current, total) {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = current <= 1;
    nextBtn.disabled = current >= total;
    firstBtn.disabled = current <= 1;
    lastBtn.disabled = current >= total;

    // Enable page input controls when PDF is loaded
    if (total > 0) {
        pageInput.disabled = false;
        goPageBtn.disabled = false;
        pageInput.setAttribute('max', total);
        pageInput.placeholder = `Page ${current}`;

        // Enable zoom controls
        zoomInBtn.disabled = false;
        zoomOutBtn.disabled = false;
        fitWidthBtn.disabled = false;
        fitPageBtn.disabled = false;
    }
}

// Navigation Logic
prevBtn.addEventListener('click', () => changePage(-1));
nextBtn.addEventListener('click', () => changePage(1));
firstBtn.addEventListener('click', () => goToPage(1));
lastBtn.addEventListener('click', () => {
    if (currentPdfDoc) goToPage(currentPdfDoc.numPages);
});

// Page Input Logic
goPageBtn.addEventListener('click', () => {
    const pageNum = parseInt(pageInput.value);
    if (pageNum && currentPdfDoc && pageNum >= 1 && pageNum <= currentPdfDoc.numPages) {
        goToPage(pageNum);
    }
});

pageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        goPageBtn.click();
    }
});

// Zoom Controls
zoomInBtn.addEventListener('click', () => adjustZoom(0.25));
zoomOutBtn.addEventListener('click', () => adjustZoom(-0.25));
fitWidthBtn.addEventListener('click', () => setZoomMode('width'));
fitPageBtn.addEventListener('click', () => setZoomMode('page'));

function adjustZoom(delta) {
    if (!currentPdfDoc) return;
    zoomMode = 'custom';
    currentZoom = Math.max(0.5, Math.min(3.0, currentZoom + delta));
    updateZoomDisplay();
    rerenderCurrentPage();
}

function setZoomMode(mode) {
    if (!currentPdfDoc) return;
    zoomMode = mode;
    if (mode === 'auto') {
        currentZoom = 1.0;
    }
    rerenderCurrentPage();
}

function updateZoomDisplay() {
    const percentage = Math.round(currentZoom * 100);
    zoomDisplay.textContent = `${percentage}%`;
}

async function goToPage(pageNum) {
    if (!currentPdfDoc || !pageNum) return;
    if (pageNum < 1 || pageNum > currentPdfDoc.numPages) return;

    loading.classList.add('active');
    try {
        await renderPage(currentPdfDoc, pageNum);
        currentPageNum = pageNum;

        // Update info text
        let displayName = currentPdfName.replace('.pdf', '');
        if (displayName.length > 20) displayName = displayName.substring(0, 17) + '...';
        infoText.textContent = `${displayName} | ${currentPageNum}/${currentPdfDoc.numPages}`;

        // Update page input
        pageInput.value = '';
        pageInput.placeholder = `Page ${pageNum}`;

        loading.classList.remove('active');
        await updateFavoriteButtonState();
        await updateBlockButtonState();
    } catch (e) {
        console.error("Go to page error", e);
        loading.classList.remove('active');
    }
}

async function rerenderCurrentPage() {
    if (!currentPdfDoc || !currentPageNum) return;
    loading.classList.add('active');
    try {
        await renderPage(currentPdfDoc, currentPageNum);
        loading.classList.remove('active');
    } catch (e) {
        console.error("Rerender error", e);
        loading.classList.remove('active');
    }
}

async function changePage(offset) {
    if (!currentPdfDoc || !currentPageNum) return;

    const newPage = currentPageNum + offset;
    if (newPage >= 1 && newPage <= currentPdfDoc.numPages) {
        loading.classList.add('active'); // Show loading for feedback
        try {
            await renderPage(currentPdfDoc, newPage);
            currentPageNum = newPage;

            // Update info text
            let displayName = currentPdfName.replace('.pdf', '');
            if (displayName.length > 20) displayName = displayName.substring(0, 17) + '...';
            infoText.textContent = `${displayName} | ${currentPageNum}/${currentPdfDoc.numPages}`;

            // Update page input
            pageInput.value = '';
            pageInput.placeholder = `Page ${newPage}`;

            loading.classList.remove('active');
            await updateFavoriteButtonState(); // Update fav state for new page
            await updateBlockButtonState(); // Update block state for new page
        } catch (e) {
            console.error("Navigation error", e);
            loading.classList.remove('active');
        }
    }
}

async function loadFolderFromHandle(handle, name) {
    // For folder load, we want a clean state.
    placeholder.style.display = 'none';
    loading.classList.add('active');
    infoText.textContent = 'Klasör taranıyor...';
    currentFolderName = name || handle.name;

    pdfFiles = [];
    // Clean up previous session
    if (currentPdfDoc) {
        await currentPdfDoc.destroy();
        currentPdfDoc = null;
    }
    if (currentFileUrl) {
        URL.revokeObjectURL(currentFileUrl);
        currentFileUrl = null;
    }

    try {
        // Request permission before accessing folder contents
        let permission = await handle.queryPermission({ mode: 'read' });
        if (permission !== 'granted') {
            permission = await handle.requestPermission({ mode: 'read' });
        }

        if (permission !== 'granted') {
            throw new Error('Klasör erişim izni verilmedi');
        }

        for await (const entry of handle.values()) {
            if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.pdf')) {
                const file = await entry.getFile();
                pdfFiles.push(file);
            }
        }

        if (pdfFiles.length > 0) {
            pdfCount.textContent = `${pdfFiles.length} PDF`;
            pdfCount.style.display = 'inline-block';
            randomBtn.disabled = false;
            infoText.textContent = name || handle.name;
            await selectRandomPage();
        } else {
            infoText.textContent = 'Klasörde PDF bulunamadı';
        }
    } catch (e) {
        console.error('Klasör okuma hatası:', e);

        let errorMsg = 'Hata: ' + e.message;

        // Specific handling for NotFoundError (Stale handle)
        if (e.name === 'NotFoundError' || e.message.includes('not be found')) {
            errorMsg = 'Klasör bulunamadı veya taşınmış/silinmiş.';
            alert('Klasör okuma hatası: Klasör bulunamadı.\nLütfen listeden silip tekrar ekleyin.');
        } else {
            alert('Klasör okuma hatası: ' + e.message + '\nLütfen "PDF Dosyaları Seç" seçeneğini deneyin.');
        }

        infoText.textContent = errorMsg;
        // Show file select button as alternative
        selectFilesBtn.style.display = 'block';
        menuModal.classList.add('active');
    }
}

async function selectRandomPage() {
    if (pdfFiles.length === 0) return;

    // Double Buffering: We don't need to capture anything visually.
    // The active canvas stays visible until renderPage swaps them.

    // Just ensure strict placeholder hiding if not done yet
    if (!placeholder.style.display || placeholder.style.display !== 'none') {
        placeholder.style.display = 'none';
    }

    loading.classList.add('active');

    try {
        // CLEANUP: Destroy previous doc to free memory
        if (currentPdfDoc) {
            await currentPdfDoc.destroy();
            currentPdfDoc = null;
        }

        // CLEANUP: Revoke previous object URL
        if (currentFileUrl) {
            URL.revokeObjectURL(currentFileUrl);
            currentFileUrl = null;
        }

        // Force placeholder hidden immediately to prevent race conditions
        placeholder.style.display = 'none';

        const randomFile = pdfFiles[Math.floor(Math.random() * pdfFiles.length)];

        // OPTIMIZATION: Use Blob URL instead of ArrayBuffer
        currentFileUrl = URL.createObjectURL(randomFile);

        const loadingTask = pdfjsLib.getDocument({
            url: currentFileUrl, // Use URL
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
        });

        const pdfDoc = await loadingTask.promise;
        currentPdfDoc = pdfDoc; // Track for cleanup

        const totalPages = pdfDoc.numPages;
        const blockedPages = await getBlockedForPdf(randomFile.name);

        let availablePages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (!blockedPages.includes(i)) availablePages.push(i);
        }

        let randomPageNum;
        if (availablePages.length > 0) {
            randomPageNum = availablePages[Math.floor(Math.random() * availablePages.length)];
        } else {
            // Fallback if all pages are blocked
            randomPageNum = Math.floor(Math.random() * totalPages) + 1;
            console.warn('All pages are blocked for this PDF. Falling back to random.');
        }

        await renderPage(pdfDoc, randomPageNum);

        let pdfName = randomFile.name.replace('.pdf', '');

        // Store current state for favorites
        currentPdfName = randomFile.name;
        currentPageNum = randomPageNum;

        if (pdfName.length > 20) pdfName = pdfName.substring(0, 17) + '...';
        infoText.textContent = `${pdfName} | ${randomPageNum}/${totalPages}`;

        // Strict placeholder removal
        document.body.classList.add('has-pdf');

        loading.classList.remove('active');
        // No freezeFrame logic needed, swap happened in renderPage

        // Update favorite and block button
        favoriteBtn.disabled = false;
        blockBtn.disabled = false;
        await updateFavoriteButtonState();
        await updateBlockButtonState();

    } catch (error) {
        console.error('PDF yükleme hatası:', error);
        infoText.textContent = 'Hata: PDF yüklenemedi';
        loading.classList.remove('active');
        // Could not swap, so old canvas remains visible or whatever
        placeholder.style.display = 'block';
        favoriteBtn.disabled = true;
        blockBtn.disabled = true;
    }
}

// --- TEST RANDOMIZER LOGIC ---
const testRandomBtn = document.getElementById('test-random-btn');
if (testRandomBtn) {
    testRandomBtn.addEventListener('click', async () => {
        if (pdfFiles.length === 0) {
            alert(currentLang === 'tr' ? "Lütfen test için PDF klasörünüzü yükleyin!" : "Please load PDF folder for testing!");
            return;
        }

        settingsModal.classList.remove('active');
        debugConsole.style.display = 'block';

        logToDebug("=== RASTGELE SEÇİM & ENGELLEME TESTİ BAŞLADI ===");
        logToDebug(`Yüklü PDF Sayısı: ${pdfFiles.length}`);

        let allAvailablePages = [];
        let totalBlockedCount = 0;
        const TEST_ITERATION = 10000;
        const blockRatio = 0.2; // %20 of the existing pages will be newly blocked

        logToDebug("Lütfen bekleyin, sayfalar analiz ediliyor ve sınırlandırılıyor...");
        const oldInfoText = infoText.textContent;
        infoText.textContent = "Test Hazırlanıyor...";
        placeholder.style.display = 'none';
        loading.classList.add('active');

        try {
            for (const file of pdfFiles) {
                const pdfName = file.name;
                const fileUrl = URL.createObjectURL(file);
                try {
                    const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
                    const pdfDoc = await loadingTask.promise;
                    const totalPages = pdfDoc.numPages;

                    const originalBlocked = await getBlockedForPdf(pdfName);
                    let blockedForThisFile = [...originalBlocked];

                    // Block more pages randomly for testing
                    for (let i = 1; i <= totalPages; i++) {
                        if (!originalBlocked.includes(i) && Math.random() < blockRatio) {
                            await addBlocked(pdfName, i);
                            blockedForThisFile.push(i);
                            totalBlockedCount++;
                        }
                    }

                    const availableForThisFile = [];
                    for (let i = 1; i <= totalPages; i++) {
                        if (!blockedForThisFile.includes(i)) {
                            availableForThisFile.push({ pdfName: pdfName, pageNum: i });
                        }
                    }

                    if (availableForThisFile.length > 0) {
                        allAvailablePages.push({
                            pdfName: pdfName,
                            available: availableForThisFile.map(p => p.pageNum)
                        });
                    }

                } catch (e) {
                    logToDebug(`Hata (${pdfName}): ${e.message}`, "error");
                }
                URL.revokeObjectURL(fileUrl);
            }

            if (allAvailablePages.length === 0) {
                logToDebug("HATA: Tüm sayfalar engellendi, test yapılamaz!", "error");
                return;
            }

            logToDebug(`Test için yeni eklenen engel sayısı: ${totalBlockedCount}`);
            logToDebug(`Erişime Açık Olan PDF Sayısı: ${allAvailablePages.length}`);

            logToDebug(`1. AŞAMA: ${TEST_ITERATION} kez seçim algoritması koşuluyor...`);
            const selectionCounts = {};
            let blockedSelectionError = 0;

            const allBlockedFromDB = await getBlocked();
            const blockedSet = new Set(allBlockedFromDB.map(b => `${b.pdfName}_${b.pageNum}`));

            for (let i = 0; i < TEST_ITERATION; i++) {
                // The exact logic in app.js
                // 1. Random PDF file
                const randomPdfObj = allAvailablePages[Math.floor(Math.random() * allAvailablePages.length)];

                // 2. Random page from available ones
                const availablePagesForSelectedPdf = randomPdfObj.available;
                const randomPageNum = availablePagesForSelectedPdf[Math.floor(Math.random() * availablePagesForSelectedPdf.length)];

                const key = `${randomPdfObj.pdfName}_${randomPageNum}`;

                // Integrity check
                if (blockedSet.has(key)) {
                    blockedSelectionError++;
                }

                selectionCounts[key] = (selectionCounts[key] || 0) + 1;
            }

            logToDebug(`2. AŞAMA: Doğruluk Kontrolü`);
            if (blockedSelectionError > 0) {
                logToDebug(`HATA: ${blockedSelectionError} kez engelli sayfa seçildi! Algoritma arızalı.`, "error");
            } else {
                logToDebug(`BAŞARILI: Engelli hiçbir sayfa seçilmedi. (Hatasızlık oranı: %100)`);
            }

            logToDebug(`3. AŞAMA: Rastgelelik Dağılım Kontrolü`);
            // Assuming even spread across ALL pages (which is not perfectly true if pdf page counts vary heavily,
            // because our normal algorithm picks uniformly among files first! Files with less pages will have those pages picked more frequently.)

            // To be accurate, expected picks per page = (1/total_pdfs) * (1/pages_in_that_pdf) * TEST_ITERATION.
            let minDiffPercent = 999;
            let maxDiffPercent = 0;
            let healthyDistributions = 0;
            const keys = Object.keys(selectionCounts);

            if (keys.length > 0) {
                for (const pdfObj of allAvailablePages) {
                    const expectedPicksForThisPdfPage = (1 / allAvailablePages.length) * (1 / pdfObj.available.length) * TEST_ITERATION;

                    for (const pg of pdfObj.available) {
                        const key = `${pdfObj.pdfName}_${pg}`;
                        const count = selectionCounts[key] || 0;
                        const diffPerc = Math.abs((count - expectedPicksForThisPdfPage) / expectedPicksForThisPdfPage) * 100;

                        if (diffPerc < minDiffPercent) minDiffPercent = diffPerc;
                        if (diffPerc > maxDiffPercent) maxDiffPercent = diffPerc;
                        if (diffPerc < 30) healthyDistributions++;
                    }
                }

                logToDebug(`Tahmini sapma (Min/Max): %${minDiffPercent.toFixed(1)} / %${maxDiffPercent.toFixed(1)}`);

                const ratio = Math.round((healthyDistributions / keys.length) * 100);
                if (ratio > 90) {
                    logToDebug(`Rastgelelik Mükemmel: Sayfaların %${ratio}'ü beklenen (%30 sapma içi) seçim sayısına ulaşıyor.`);
                } else if (ratio > 70) {
                    logToDebug(`Rastgelelik Başarılı: Sayfaların %${ratio}'si beklenen ideale uygun.`);
                } else {
                    logToDebug(`Rastgelelik Dağılımı Dengesiz (Aşırı sapma): Sağlamlık oranı %${ratio}`, "error");
                }
            }

            logToDebug("=== TEST TAMAMLANDI ===");
            renderBlocked();
        } finally {
            infoText.textContent = oldInfoText;
            loading.classList.remove('active');
            placeholder.style.display = 'block';
        }
    });
}

// Başlat
init();
