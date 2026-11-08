"use strict";

// =====================================
// KALAM E ALA HAZRAT
// ENGLISH + URDU + FAVOURITES
// =====================================

const homePage = document.getElementById("homePage");
const readerPage = document.getElementById("readerPage");
const kalamList = document.getElementById("kalamList");

const searchInput = document.getElementById("searchInput");
const searchSuggestion = document.getElementById("searchsuggestion");
const themeToggle = document.getElementById("themeToggle");
const message = document.getElementById("message");

const englishTab = document.getElementById("englishTab");
const urduTab = document.getElementById("urduTab");
const englishAlphabet = document.getElementById("englishAlphabet");
const urduAlphabet = document.getElementById("urduAlphabet");

const sectionTitle = document.getElementById("sectionTitle");
const kalamCount = document.getElementById("kalamCount");
const copyFullKalam = document.getElementById("copyFullKalam");

// FAVOURITE ELEMENTS

const favoritesToggle = document.getElementById("favoritesToggle");
const readerFavoriteBtn = document.getElementById("readerFavoriteBtn");
const readerTazmeenBtn = document.getElementById("readerTazmeenBtn");
const readerTazmeenContent = document.getElementById("readerTazmeenContent");
const readerTazmeenTabs = document.getElementById("readerTazmeenTabs");
const readerTazmeenAshaar = document.getElementById("readerTazmeenAshaar");
const copyFullTazmeen = document.getElementById("copyFullTazmeen");
const closeTazmeenBtn = document.getElementById("closeTazmeenBtn");
const readerFontSizeValue = document.getElementById("readerFontSizeValue");


let englishKalams = [];
let urduKalams = [];

let currentLanguage = "english";
let selectedLetter = "ALL";
let currentKalams = [];
let currentReaderKalam = null;
let currentTazmeenEntries = [];
let currentTazmeenIndex = 0;
let isTazmeenMode = false;
let currentAppHistoryView = "home";
let showingFavorites = false;

// SAVE HOME PAGE SCROLL POSITION
let savedHomeScrollY = 0;


// Stores the English and Urdu versions of the currently open Kalam.

let readerKalamsByLanguage = {
    english: null,
    urdu: null
};


const HIGHLIGHT_STORAGE_KEY = "kalam-saved-highlights";
const FAVORITE_STORAGE_KEY = "kalam-favorite-list";


// =====================================
// THEME
// =====================================

function applyTheme(theme, save = true) {

    const availableThemes = ["light", "dark", "indigo"];
    const selectedTheme = availableThemes.includes(theme) ? theme : "light";

    document.body.dataset.theme = selectedTheme;

    if (save) {
        localStorage.setItem("kalam-theme", selectedTheme);
    }

    const nextTheme = {
        light: "dark",
        dark: "indigo",
        indigo: "light"
    }[selectedTheme];
    const nextThemeName = {
        light: "Light",
        dark: "Dark",
        indigo: "Royal Indigo + Moonstone"
    }[nextTheme];
    const nextThemeLabel = {
        light: "☀️ Light",
        dark: "🌙 Dark",
        indigo: "🔷 Indigo"
    }[nextTheme];

    themeToggle.textContent = nextThemeLabel;

    themeToggle.setAttribute(
        "aria-label",
        `Switch to ${nextThemeName} theme`
    );

    themeToggle.setAttribute("aria-pressed", String(selectedTheme !== "light"));

    themeToggle.title = `Switch to ${nextThemeName} theme`;

    const themeColor = document.querySelector(
        'meta[name="theme-color"]'
    );

    if (themeColor) {
        themeColor.setAttribute(
            "content",
            selectedTheme === "dark"
                ? "#10131f"
                : selectedTheme === "indigo"
                    ? "#F3F2F8"
                    : "#eef4ef"
        );
    }
}

const storedTheme = localStorage.getItem("kalam-theme");

const initialTheme = ["light", "dark", "indigo"].includes(storedTheme)
    ? storedTheme
    : "light";

applyTheme(initialTheme, storedTheme !== initialTheme);

themeToggle.addEventListener("click", function () {
    const themeOrder = ["light", "dark", "indigo"];
    const currentIndex = themeOrder.indexOf(document.body.dataset.theme);
    applyTheme(themeOrder[(currentIndex + 1) % themeOrder.length]);
});


// =====================================
// MESSAGE
// =====================================

let messageTimer;

function showMessage(text) {

    message.classList.remove("share-toast");
    message.textContent = text;

    clearTimeout(messageTimer);

    messageTimer = setTimeout(function () {

        message.textContent = "";

    }, 2500);
}

function showShareConfirmation(text) {
    clearTimeout(messageTimer);
    message.textContent = text;
    message.classList.remove("share-toast");
    void message.offsetWidth;
    message.classList.add("share-toast");

    messageTimer = setTimeout(function () {
        message.textContent = "";
        message.classList.remove("share-toast");
    }, 1800);
}


// =====================================
// HIGHLIGHT STORAGE
// =====================================

function getSavedHighlights() {

    try {

        return JSON.parse(
            localStorage.getItem(HIGHLIGHT_STORAGE_KEY) || "{}"
        );

    } catch (error) {

        console.warn("Highlight data could not be read:", error);

        return {};
    }
}


function saveHighlight(kalam, coupletIndex, isHighlighted, highlightNamespace = null) {

    if (!kalam) return;

    const saved = getSavedHighlights();

    const key = highlightNamespace
        ? highlightNamespace + ":" + currentLanguage + ":" + String(kalam.id) + ":" + coupletIndex
        : currentLanguage + ":" + String(kalam.id) + ":" + coupletIndex;

    if (isHighlighted) {

        saved[key] = true;

    } else {

        delete saved[key];
    }

    try {

        localStorage.setItem(
            HIGHLIGHT_STORAGE_KEY,
            JSON.stringify(saved)
        );

    } catch (error) {

        showMessage("Highlight save nahi ho saka. Browser storage check karein.");
    }
}


function isHighlightSaved(kalam, coupletIndex, highlightNamespace = null) {

    if (!kalam) return false;

    const key = highlightNamespace
        ? highlightNamespace + ":" + currentLanguage + ":" + String(kalam.id) + ":" + coupletIndex
        : currentLanguage + ":" + String(kalam.id) + ":" + coupletIndex;

    return getSavedHighlights()[key] === true;
}


// =====================================
// URDU SORTING
// =====================================

function sortUrduKalams(kalams) {

    const alphabet = [
        "ا", "آ", "ب", "پ", "ت", "ث",
        "ج", "چ", "ح", "خ", "د", "ذ",
        "ر", "ز", "س", "ش", "ص", "ط",
        "ع", "غ", "ق", "ک", "گ", "ل",
        "م", "ن", "و", "ہ", "ی"
    ];

    function getIndex(title) {

        const firstLetter = Array.from(
            (title || "").trim()
        )[0];

        const index = alphabet.indexOf(firstLetter);

        return index === -1 ? 999 : index;
    }

    return [...kalams].sort(
        (a, b) => getIndex(a.title) - getIndex(b.title)
    );
}


// =====================================
// FIND SAME KALAM IN OTHER LANGUAGE
// ONLY USE VERIFIED RELATIONSHIPS
// NO UNRELATED KALAM
// =====================================

function findLanguageVersion(sourceKalam, targetLanguage) {

    if (!sourceKalam) return null;

    const targetKalams = targetLanguage === "english"
        ? englishKalams
        : urduKalams;

    const sourceId = String(sourceKalam.id);

    // Fields that point directly to the other language.

    const directLinkFields = targetLanguage === "urdu"
        ? [
            "urdu_id",
            "urdu_kalam_id",
            "urdu_kalaam_id"
        ]
        : [
            "english_id",
            "english_kalam_id",
            "english_kalaam_id"
        ];


    // CHECK DIRECT LINK

    for (const field of directLinkFields) {

        const linkedId = sourceKalam[field];

        if (linkedId !== undefined && linkedId !== null) {

            const match = targetKalams.find(function (item) {

                return String(item.id) === String(linkedId);

            });

            if (match) return match;
        }
    }


    // CHECK REVERSE LINK

    const reverseLinkFields = targetLanguage === "urdu"
        ? [
            "english_id",
            "english_kalam_id",
            "english_kalaam_id"
        ]
        : [
            "urdu_id",
            "urdu_kalam_id",
            "urdu_kalaam_id"
        ];

    const reverseMatch = targetKalams.find(function (item) {

        return reverseLinkFields.some(function (field) {

            return (
                item[field] !== undefined &&
                item[field] !== null &&
                String(item[field]) === sourceId
            );

        });

    });

    if (reverseMatch) return reverseMatch;


    // CHECK SHARED TRANSLATION GROUP

    const groupFields = [
        "translation_group_id",
        "kalam_group_id",
        "group_id",
        "translation_key"
    ];

    for (const field of groupFields) {

        const sourceGroup = sourceKalam[field];

        if (
            sourceGroup !== undefined &&
            sourceGroup !== null &&
            String(sourceGroup).trim() !== ""
        ) {

            const groupMatch = targetKalams.find(function (item) {

                return (
                    item[field] !== undefined &&
                    item[field] !== null &&
                    String(item[field]) === String(sourceGroup)
                );

            });

            if (groupMatch) return groupMatch;
        }
    }

    // IMPORTANT:
    // Do not use same numeric ID as a fallback.
    // Different Kalams can have the same ID in separate tables.

    return null;
}


// =====================================
// FAVOURITE STORAGE
// =====================================

function getSavedFavorites() {

    try {

        const saved = JSON.parse(
            localStorage.getItem(FAVORITE_STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved : [];

    } catch (error) {

        console.warn("Favourite data could not be read:", error);

        return [];
    }
}


// =====================================
// GET FAVOURITE KEY
// ENGLISH + URDU LINK SYNC
// =====================================

function getFavoriteKey(kalam, language = currentLanguage) {

    if (!kalam) return null;

    const otherLanguage = language === "english"
        ? "urdu"
        : "english";

    const linkedKalam = findLanguageVersion(
        kalam,
        otherLanguage
    );


    // If a verified translation exists,
    // both versions use the same favourite key.

    if (linkedKalam) {

        const englishId = language === "english"
            ? kalam.id
            : linkedKalam.id;

        const urduId = language === "urdu"
            ? kalam.id
            : linkedKalam.id;

        return `paired:${String(englishId)}:${String(urduId)}`;
    }


    // If no verified translation exists,
    // save the favourite separately.

    return `${language}:${String(kalam.id)}`;
}


// =====================================
// CHECK FAVOURITE
// =====================================

function isFavorite(kalam, language = currentLanguage) {

    const key = getFavoriteKey(kalam, language);

    if (!key) return false;

    return getSavedFavorites().includes(key);
}


// =====================================
// UPDATE FAVOURITE BUTTON
// =====================================

function updateFavoriteButton(button, active) {

    if (!button) return;

    button.classList.toggle("active", active);

    button.textContent = active
        ? "♥ Favourite"
        : "♡ Favourite";

    button.setAttribute(
        "aria-pressed",
        String(active)
    );
}


// =====================================
// TOGGLE FAVOURITE
// =====================================

function toggleFavorite(kalam, language = currentLanguage) {

    if (!kalam) return;

    const key = getFavoriteKey(kalam, language);

    if (!key) return;

    const favorites = getSavedFavorites();

    const alreadySaved = favorites.includes(key);

    let updatedFavorites;

    if (alreadySaved) {

        updatedFavorites = favorites.filter(
            item => item !== key
        );

    } else {

        updatedFavorites = [...favorites, key];
    }


    try {

        localStorage.setItem(
            FAVORITE_STORAGE_KEY,
            JSON.stringify(updatedFavorites)
        );

    } catch (error) {

        showMessage("Favourite save nahi ho saka. Browser storage check karein.");

        return;
    }


    // Update reader button.

    if (
        currentReaderKalam &&
        readerFavoriteBtn
    ) {

        updateFavoriteButton(
            readerFavoriteBtn,
            isFavorite(currentReaderKalam)
        );
    }

    // Update home page list immediately.

    filterKalams();


    showMessage(
        alreadySaved
            ? "Favourite se remove kar diya gaya."
            : "Favourite mein save kar diya gaya."
    );
}


// =====================================
// FAVOURITE BUTTON EVENTS
// =====================================

if (favoritesToggle) {

    favoritesToggle.addEventListener("click", function () {

        showingFavorites = !showingFavorites;

        favoritesToggle.classList.toggle(
            "active",
            showingFavorites
        );

        favoritesToggle.textContent = showingFavorites
            ? "← All Kalam"
            : "❤️ Favourite";

        favoritesToggle.setAttribute(
            "aria-pressed",
            String(showingFavorites)
        );


        // Reset search and alphabet when changing view.

        searchInput.value = "";

        selectedLetter = "ALL";

        hideSuggestions();


        if (currentLanguage === "english") {

            setActiveAlphabet(englishAlphabet, "ALL");

        } else {

            setActiveAlphabet(urduAlphabet, "ALL");
        }


        filterKalams();

    });
}


if (readerTazmeenBtn) {
    readerTazmeenBtn.addEventListener("click", function () {
        openTazmeenMode();
    });
}

if (closeTazmeenBtn) {
    closeTazmeenBtn.addEventListener("click", function () {
        if (currentAppHistoryView === "tazmeen") {
            window.history.back();
        } else {
            closeTazmeenMode();
        }
    });
}

if (copyFullTazmeen) {
    copyFullTazmeen.addEventListener("click", async function () {
        const selectedTazmeen = currentTazmeenEntries[currentTazmeenIndex];

        if (!currentReaderKalam || !selectedTazmeen?.text) return;

        const fullText = [
            currentReaderKalam.title || "Kalam",
            selectedTazmeen.label,
            "",
            selectedTazmeen.text
        ].join("\n");

        try {
            await navigator.clipboard.writeText(fullText);
            showMessage("Full Tazmeen copied successfully!");
        } catch (error) {
            showMessage("Tazmeen copy nahi ho saki.");
        }
    });
}


if (readerFavoriteBtn) {

    readerFavoriteBtn.addEventListener("click", function () {

        if (!currentReaderKalam) return;

        toggleFavorite(currentReaderKalam);

    });
}


// =====================================
// SUPABASE
// =====================================

async function loadKalams() {

    try {

        kalamList.textContent = "Kalam load ho rahe hain...";

        if (!window.supabase) {

            throw new Error("Supabase library load nahi hui.");
        }

        if (
            typeof SUPABASE_URL === "undefined" ||
            typeof SUPABASE_ANON_KEY === "undefined" ||
            typeof supabaseClient === "undefined"
        ) {

            throw new Error("config.js check karein.");
        }

        // LOAD ENGLISH KALAMS

        const englishResult = await supabaseClient
            .from("kalaam")
            .select("*")
            .order("id", { ascending: true });

        if (englishResult.error) {

            throw new Error(
                "English table error: " + englishResult.error.message
            );
        }

        englishKalams = englishResult.data || [];


        // LOAD URDU KALAMS

        const urduResult = await supabaseClient
            .from("kalaam_urdu")
            .select("*")
            .order("id", { ascending: true });

        if (urduResult.error) {

            throw new Error(
                "Urdu table error: " + urduResult.error.message
            );
        }

        urduKalams = sortUrduKalams(urduResult.data || []);

        console.log("English Kalam:", englishKalams);
        console.log("Urdu Kalam:", urduKalams);

        filterKalams();

    } catch (error) {

        console.error("SUPABASE ERROR:", error);

        kalamList.textContent = "ERROR: " + error.message;
    }
}


// =====================================
// LANGUAGE SWITCH
// HOME + READER PAGE
// =====================================

function switchLanguage(language) {

    const readerIsOpen = !readerPage.classList.contains("hidden");

    let translatedKalam = null;

    let sourceKalam = null;


    if (readerIsOpen) {

        // Save the currently displayed language version.

        if (currentReaderKalam) {

            readerKalamsByLanguage[currentLanguage] =
                currentReaderKalam;
        }

        sourceKalam =
            readerKalamsByLanguage[currentLanguage] ||
            readerKalamsByLanguage.english ||
            readerKalamsByLanguage.urdu;


        // First use an already loaded matching version.

        translatedKalam = readerKalamsByLanguage[language];


        // Otherwise search using verified relationship fields.

        if (!translatedKalam && sourceKalam) {

            translatedKalam = findLanguageVersion(
                sourceKalam,
                language
            );

            if (translatedKalam) {

                readerKalamsByLanguage[language] =
                    translatedKalam;
            }
        }
    }


    // CHANGE LANGUAGE

    currentLanguage = language;

    selectedLetter = "ALL";

    searchInput.value = "";

    hideSuggestions();


    // UPDATE LANGUAGE BUTTONS

    englishTab.classList.toggle(
        "active",
        language === "english"
    );

    urduTab.classList.toggle(
        "active",
        language === "urdu"
    );


    // UPDATE ALPHABET VISIBILITY

    englishAlphabet.classList.toggle(
        "hidden",
        language !== "english"
    );

    urduAlphabet.classList.toggle(
        "hidden",
        language !== "urdu"
    );


    // UPDATE LANGUAGE TEXT

    if (language === "english") {

        searchInput.placeholder = "Search Kalam...";

        sectionTitle.textContent = "NAAT E PAAK";

        setActiveAlphabet(englishAlphabet, "ALL");

    } else {

        searchInput.placeholder = "کلام تلاش کریں...";

        sectionTitle.textContent = "نعتِ پاک";

        setActiveAlphabet(urduAlphabet, "ALL");
    }


    document.body.classList.toggle(
        "urdu-mode",
        language === "urdu"
    );


    // UPDATE HOME PAGE LIST

    filterKalams();


    // UPDATE OPEN READER

    if (readerIsOpen) {

        if (translatedKalam) {

            currentReaderKalam = translatedKalam;

            renderReaderKalam(translatedKalam);

        } else {

            renderUnavailableLanguage(sourceKalam);
        }
    }
}


englishTab.addEventListener("click", function () {

    switchLanguage("english");

});

urduTab.addEventListener("click", function () {

    switchLanguage("urdu");

});


// =====================================
// ALPHABET FILTER
// =====================================

function setActiveAlphabet(container, letter) {

    container.querySelectorAll(".letter-btn").forEach(
        function (button) {

            button.classList.toggle(
                "active",
                button.dataset.letter === letter
            );

        }
    );
}


function normalizeUrduLetter(letter) {

    const map = {
        "أ": "ا",
        "إ": "ا",
        "ٱ": "ا",
        "ى": "ی",
        "ي": "ی",
        "ے": "ی"
    };

    return map[letter] || letter;
}


function setupAlphabetButtons(container) {

    container.querySelectorAll(".letter-btn").forEach(
        function (button) {

            button.addEventListener("click", function () {

                selectedLetter = button.dataset.letter;

                setActiveAlphabet(container, selectedLetter);

                filterKalams();

            });

        }
    );
}

setupAlphabetButtons(englishAlphabet);

setupAlphabetButtons(urduAlphabet);


// =====================================
// FILTER + SEARCH SUGGESTIONS
// =====================================

function filterKalams() {

    const rawQuery = searchInput.value.trim();

    const query = rawQuery.toLowerCase();

    currentKalams = currentLanguage === "english"
        ? englishKalams
        : urduKalams;


    const filteredKalams = currentKalams.filter(
        function (kalam) {

            const title = (kalam.title || "").trim();

            const lyrics = (kalam.lyrics || "").trim();

            const matchesSearch = currentLanguage === "english"

                ? title.toLowerCase().includes(query) ||
                  lyrics.toLowerCase().includes(query)

                : title.includes(rawQuery) ||
                  lyrics.includes(rawQuery);


            let matchesLetter = true;

            if (selectedLetter !== "ALL") {

                if (currentLanguage === "english") {

                    matchesLetter = title
                        .toUpperCase()
                        .startsWith(selectedLetter);

                } else {

                    const firstLetter = normalizeUrduLetter(
                        Array.from(title)[0] || ""
                    );

                    matchesLetter =
                        firstLetter === normalizeUrduLetter(selectedLetter);
                }
            }


            // FAVOURITE FILTER

            const matchesFavorite = !showingFavorites ||
                isFavorite(kalam);


            return (
                matchesSearch &&
                matchesLetter &&
                matchesFavorite
            );
        }
    );


    displayKalams(filteredKalams);

    renderSuggestions(rawQuery);
}


// =====================================
// SEARCH SUGGESTIONS
// =====================================

function renderSuggestions(query) {

    searchSuggestion.replaceChildren();

    if (!query) {

        hideSuggestions();

        return;
    }

    const normalizedQuery = currentLanguage === "english"
        ? query.toLocaleLowerCase()
        : query;


    const matches = currentKalams.filter(function (kalam) {

        // In Favourite view, suggestions also show favourites only.

        if (showingFavorites && !isFavorite(kalam)) {

            return false;
        }

        const title = (kalam.title || "").trim();

        return currentLanguage === "english"

            ? title.toLocaleLowerCase().startsWith(normalizedQuery)

            : title.startsWith(normalizedQuery);

    }).slice(0, 8);


    if (matches.length === 0) {

        hideSuggestions();

        return;
    }


    matches.forEach(function (kalam) {

        const item = document.createElement("button");

        item.type = "button";

        item.className = "suggestion-item";

        item.textContent = kalam.title || "Untitled Kalam";

        item.dir = currentLanguage === "urdu" ? "rtl" : "auto";


        item.addEventListener("click", function () {

            hideSuggestions();

            searchInput.value = kalam.title || "";

            openKalam(kalam.id);

        });


        searchSuggestion.appendChild(item);

    });


    searchSuggestion.classList.remove("hidden");
}


function hideSuggestions() {

    searchSuggestion.classList.add("hidden");

    searchSuggestion.replaceChildren();
}


searchInput.addEventListener("input", filterKalams);


searchInput.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        hideSuggestions();
    }


    if (event.key === "Enter") {

        const firstSuggestion = searchSuggestion.querySelector(
            ".suggestion-item"
        );

        if (
            firstSuggestion &&
            !searchSuggestion.classList.contains("hidden")
        ) {

            firstSuggestion.click();
        }
    }
});


document.addEventListener("click", function (event) {

    if (!event.target.closest(".search-box")) {

        hideSuggestions();
    }

});


// =====================================
// DISPLAY KALAMS - WITH FAVOURITE BUTTON
// =====================================

function displayKalams(kalams) {

    kalamList.replaceChildren();

    kalamCount.textContent = kalams.length + " Kalam";


    if (!kalams || kalams.length === 0) {

        const empty = document.createElement("div");

        empty.className = "empty";

        empty.textContent = showingFavorites

            ? (
                currentLanguage === "urdu"
                    ? "ابھی کوئی پسندیدہ کلام محفوظ نہیں ہے۔"
                    : "No favourite Kalam saved yet."
            )

            : (
                currentLanguage === "urdu"
                    ? "اس حرف سے کوئی کلام نہیں ملا۔"
                    : "Is letter se koi Kalam nahi mila."
            );

        kalamList.appendChild(empty);

        return;
    }


    kalams.forEach(function (kalam) {

        const card = document.createElement("article");

        card.className = "kalam-card";

        if (currentLanguage === "urdu") {

            card.classList.add("urdu-card");
        }


        // TITLE ROW

        const titleRow = document.createElement("div");

        titleRow.className = "kalam-card-title-row";


        const title = document.createElement("h3");

        title.textContent = kalam.title || "Untitled Kalam";

        title.dir = currentLanguage === "urdu" ? "rtl" : "auto";


        // SMALL FAVOURITE HEART BUTTON

        const favoriteBtn = document.createElement("button");

        favoriteBtn.type = "button";

        favoriteBtn.className = "card-favorite-btn";

        favoriteBtn.textContent = isFavorite(kalam) ? "♥" : "♡";

        favoriteBtn.classList.toggle(
            "active",
            isFavorite(kalam)
        );

        favoriteBtn.setAttribute(
            "aria-label",
            isFavorite(kalam)
                ? "Remove from favourites"
                : "Add to favourites"
        );

        favoriteBtn.setAttribute(
            "aria-pressed",
            String(isFavorite(kalam))
        );


        favoriteBtn.addEventListener("click", function (event) {

            // Do not open the reader when heart is clicked.

            event.stopPropagation();

            toggleFavorite(kalam);

        });


        titleRow.append(title, favoriteBtn);


        card.appendChild(titleRow);


        card.addEventListener("click", function () {

            openKalam(kalam.id);

        });


        kalamList.appendChild(card);

    });
}


// =====================================
// OPEN KALAM
// =====================================

function pushKalamHistoryState(view, kalamId) {
    try {
        const previousState = window.history.state &&
            typeof window.history.state === "object"
            ? window.history.state
            : {};
        window.history.pushState(
            { ...previousState, kalamAppView: view, kalamId: String(kalamId) },
            "",
            window.location.href
        );
        currentAppHistoryView = view;
        return true;
    } catch (error) {
        currentAppHistoryView = "home";
        return false;
    }
}


function openKalam(id, restoringHistory = false) {

    const kalam = currentKalams.find(
        item => String(item.id) === String(id)
    );

    if (!kalam) return;

    if (!restoringHistory) pushKalamHistoryState("reader", id);


    // SAVE HOME PAGE SCROLL POSITION

    savedHomeScrollY = window.scrollY;


    // RESET PREVIOUS KALAM

    readerKalamsByLanguage = {
        english: null,
        urdu: null
    };


    // STORE OPENED LANGUAGE VERSION

    readerKalamsByLanguage[currentLanguage] = kalam;

    currentReaderKalam = kalam;


    // OPEN READER

    homePage.classList.add("hidden");

    readerPage.classList.remove("hidden");


    // HIDE BOTH LANGUAGE BUTTONS INSIDE READER

    englishTab.classList.add("hidden");

    urduTab.classList.add("hidden");


    renderReaderKalam(kalam);

    // OPEN READER FROM TOP

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


// =====================================
// RENDER READER
// =====================================

function getTazmeenEntries(kalam) {
    const tazmeenColumns = [
        { field: "tazmeen", label: "TAZMEEN 1" },
        { field: "tazmeen_2", label: "TAZMEEN 2" },
        { field: "tazmeen_3", label: "TAZMEEN 3" }
    ];

    return tazmeenColumns
        .map(function (column) {
            return {
                label: column.label,
                text: String(kalam?.[column.field] ?? "")
            };
        })
        .filter(function (entry) {
            return entry.text.trim().length > 0;
        });
}


function openTazmeenMode(restoringHistory = false) {
    if (!currentTazmeenEntries.length) return;

    if (!restoringHistory) pushKalamHistoryState("tazmeen", currentReaderKalam.id);

    isTazmeenMode = true;

    document.getElementById("readerContent").classList.add("hidden");
    document.querySelector(".reader-action-bar").classList.add("hidden");
    readerFavoriteBtn.classList.add("hidden");
    document.getElementById("backButton").classList.add("hidden");
    readerTazmeenBtn.classList.add("hidden");
    readerPage.classList.add("tazmeen-mode");
    readerTazmeenBtn.setAttribute("aria-expanded", "true");
    readerTazmeenContent.classList.remove("hidden");

    renderTazmeenTabs();
    showTazmeenEntry(0);
}


function closeTazmeenMode() {
    isTazmeenMode = false;

    readerTazmeenContent.classList.add("hidden");
    readerTazmeenBtn.setAttribute("aria-expanded", "false");

    document.getElementById("readerContent").classList.remove("hidden");
    document.querySelector(".reader-action-bar").classList.remove("hidden");
    document.getElementById("backButton").classList.remove("hidden");
    readerFavoriteBtn.classList.remove("hidden");
    readerPage.classList.remove("tazmeen-mode");
    readerTazmeenBtn.classList.toggle(
        "hidden",
        currentTazmeenEntries.length === 0
    );
    readerTazmeenBtn.textContent = "📜 TAZMEEN";
}


function renderTazmeenTabs() {
    readerTazmeenTabs.replaceChildren();
    readerTazmeenTabs.classList.toggle(
        "hidden",
        currentTazmeenEntries.length <= 1
    );

    if (currentTazmeenEntries.length <= 1) return;

    currentTazmeenEntries.forEach(function (entry, index) {
        const tab = document.createElement("button");

        tab.type = "button";
        tab.className = "tazmeen-tab-btn";
        tab.textContent = entry.label;
        tab.setAttribute("aria-pressed", String(index === currentTazmeenIndex));

        if (index === currentTazmeenIndex) {
            tab.classList.add("active");
        }

        tab.addEventListener("click", function () {
            showTazmeenEntry(index);
        });

        readerTazmeenTabs.appendChild(tab);
    });
}


function showTazmeenEntry(index) {
    if (!currentTazmeenEntries[index]) return;

    currentTazmeenIndex = index;

    readerTazmeenTabs.querySelectorAll(".tazmeen-tab-btn").forEach(
        function (tab, tabIndex) {
            const active = tabIndex === index;

            tab.classList.toggle("active", active);
            tab.setAttribute("aria-pressed", String(active));
        }
    );

    readerTazmeenAshaar.dir = currentLanguage === "urdu" ? "rtl" : "auto";
    readerTazmeenAshaar.classList.toggle(
        "urdu-reader",
        currentLanguage === "urdu"
    );

    const tazmeenLines = currentTazmeenEntries[index].text.split(/\r?\n/);
    readerTazmeenAshaar.replaceChildren();
    tazmeenLines.forEach(function (line) {
        const lineElement = document.createElement("span");
        lineElement.className = "verse-line";
        lineElement.textContent = line || "\u00a0";
        readerTazmeenAshaar.appendChild(lineElement);
    });
    readerTazmeenAshaar.classList.add("tazmeen-plain-text");
    updateFontSize();
}


function renderReaderKalam(kalam) {

    if (!kalam) return;

    currentReaderKalam = kalam;

    const readerTitle = document.getElementById("readerTitle");

    const readerContent = document.getElementById("readerContent");

    const readerActions = document.querySelector(
        ".reader-action-bar"
    );


    // TITLE

    readerTitle.textContent = kalam.title || "Kalam";


    // UPDATE READER FAVOURITE BUTTON

    if (readerFavoriteBtn) {

        readerFavoriteBtn.classList.remove("hidden");

        updateFavoriteButton(
            readerFavoriteBtn,
            isFavorite(kalam)
        );
    }


    // Read this language version's Tazmeen value.

    currentTazmeenEntries = getTazmeenEntries(kalam);
    currentTazmeenIndex = 0;

    closeTazmeenMode();

    readerTazmeenBtn.classList.toggle(
        "hidden",
        currentTazmeenEntries.length === 0
    );

    readerTazmeenTabs.replaceChildren();
    readerTazmeenAshaar.replaceChildren();

    // LANGUAGE DIRECTION

    if (currentLanguage === "urdu") {

        readerTitle.dir = "rtl";

        readerContent.dir = "rtl";

        readerContent.classList.add("urdu-reader");

    } else {

        readerTitle.dir = "auto";

        readerContent.dir = "auto";

        readerContent.classList.remove("urdu-reader");
    }


    // CHECK EMPTY LYRICS

    if (!String(kalam.lyrics || "").trim()) {

        renderUnavailableLanguage(kalam);

        return;
    }


    // SHOW READER ACTIONS

    readerActions.classList.remove("hidden");


    // DISPLAY ASHAAR

    renderAshaar(kalam.lyrics || "");

    updateFontSize();
}


// =====================================
// LANGUAGE NOT AVAILABLE
// =====================================

function renderUnavailableLanguage(sourceKalam) {

    const readerTitle = document.getElementById("readerTitle");

    const readerContent = document.getElementById("readerContent");

    const readerActions = document.querySelector(
        ".reader-action-bar"
    );


    // Do not keep an unrelated or old Kalam active.

    currentReaderKalam = null;
    currentTazmeenEntries = [];
    currentTazmeenIndex = 0;
    isTazmeenMode = false;
    readerPage.classList.remove("tazmeen-mode");
    document.getElementById("backButton").classList.remove("hidden");


    // HIDE READER FAVOURITE BUTTON

    if (readerFavoriteBtn) {

        readerFavoriteBtn.classList.add("hidden");
    }


    if (readerTazmeenBtn) readerTazmeenBtn.classList.add("hidden");
    if (readerTazmeenContent) readerTazmeenContent.classList.add("hidden");
    readerContent.classList.remove("hidden");

    // KEEP THE SOURCE KALAM TITLE

    readerTitle.textContent = sourceKalam?.title || "Kalam";


    // SET LANGUAGE DIRECTION

    if (currentLanguage === "urdu") {

        readerTitle.dir = "rtl";

        readerContent.dir = "rtl";

        readerContent.classList.add("urdu-reader");

    } else {

        readerTitle.dir = "auto";

        readerContent.dir = "auto";

        readerContent.classList.remove("urdu-reader");
    }


    // CLEAR OLD LYRICS

    readerContent.replaceChildren();


    // SHOW MESSAGE

    const unavailable = document.createElement("p");

    unavailable.className = "empty";

    unavailable.textContent = "No available in this language.";

    readerContent.appendChild(unavailable);


    // HIDE COPY AND OTHER ACTIONS

    readerActions.classList.add("hidden");
}


// =====================================
// RENDER ASHAAR
// PERSISTENT HIGHLIGHT
// =====================================

function renderAshaar(
    lyrics,
    reader = document.getElementById("readerContent"),
    highlightNamespace = null,
    showActions = true
) {

    reader.replaceChildren();


    const lines = lyrics
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);


    if (lines.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty";

        empty.textContent = "No available in this language.";

        reader.appendChild(empty);

        return;
    }


    for (
        let i = 0, coupletIndex = 0;
        i < lines.length;
        i += 2, coupletIndex++
    ) {

        const couplet = document.createElement("div");

        couplet.className = "couplet";


        const verse = document.createElement("div");

        verse.className = "verse";

        const coupletLines = lines.slice(i, i + 2);
        const verseText = coupletLines.join("\n");

        coupletLines.forEach(function (line) {
            const lineElement = document.createElement("span");
            lineElement.className = "verse-line";
            lineElement.textContent = line;
            verse.appendChild(lineElement);
        });


        const actions = document.createElement("div");

        actions.className = "actions";


        // =====================================
        // COPY BUTTON
        // =====================================

        const copyBtn = createButton("Copy");
        copyBtn.classList.add("copy-action-btn");
        copyBtn.innerHTML = '<span class="copy-btn-label">Copy</span>';

        copyBtn.addEventListener("click", async function () {
            couplet.classList.remove("copy-scanning");
            copyBtn.classList.remove("copy-scanning");
            clearTimeout(copyBtn.scanTimer);
            void couplet.offsetWidth;
            couplet.classList.add("copy-scanning");
            copyBtn.classList.add("copy-scanning");
            copyBtn.scanTimer = window.setTimeout(function () {
                couplet.classList.remove("copy-scanning");
                copyBtn.classList.remove("copy-scanning");
            }, 1200);

            try {

                await navigator.clipboard.writeText(
                    verseText
                );

                showMessage(
                    currentLanguage === "urdu"
                        ? "اشعار کاپی ہوگئے!"
                        : "Ashaar copied successfully!"
                );

            } catch (error) {

                showMessage("Copy nahi ho saka.");
            }
        });


        // =====================================
        // HIGHLIGHT BUTTON
        // =====================================

        const highlightBtn = createButton("Highlight");

        const initiallyHighlighted = showActions && isHighlightSaved(
            currentReaderKalam,
            coupletIndex,
            highlightNamespace
        );


        couplet.classList.toggle(
            "highlighted",
            initiallyHighlighted
        );

        highlightBtn.classList.toggle(
            "active",
            initiallyHighlighted
        );

        highlightBtn.textContent = initiallyHighlighted
            ? "Highlighted"
            : "Highlight";


        highlightBtn.addEventListener("click", function () {

            const active = couplet.classList.toggle("highlighted");

            highlightBtn.classList.toggle("active", active);

            highlightBtn.textContent = active
                ? "Highlighted"
                : "Highlight";

            saveHighlight(
                currentReaderKalam,
                coupletIndex,
                active,
                highlightNamespace
            );
        });


        // =====================================
        // SHARE BUTTON
        // =====================================

        const shareBtn = createButton("Share");

        shareBtn.addEventListener("click", async function () {

            const text = verseText;

            try {

                if (navigator.share) {

                    await navigator.share({

                        title: "Kalam e ala Hazrat",

                        text: text

                    });
                    showShareConfirmation("Shared!");

                } else if (navigator.clipboard) {

                    await navigator.clipboard.writeText(text);
                    showShareConfirmation("Copied to share");

                } else {

                    showMessage("Share feature available nahi hai.");
                }

            } catch (error) {

                if (error.name !== "AbortError") {

                    showMessage("Share nahi ho saka.");
                }
            }
        });


        if (showActions) {
            actions.append(
                copyBtn,
                highlightBtn,
                shareBtn
            );

            couplet.append(
                verse,
                actions
            );
        } else {
            couplet.appendChild(verse);
        }

        reader.appendChild(couplet);
    }
}


// =====================================
// BUTTON HELPER
// =====================================

function createButton(label) {

    const button = document.createElement("button");

    button.type = "button";

    button.className = "action-btn";

    button.textContent = label;

    return button;
}


// =====================================
// COPY FULL KALAM
// =====================================

copyFullKalam.addEventListener("click", async function () {

    if (
        !currentReaderKalam ||
        !String(currentReaderKalam.lyrics || "").trim()
    ) {

        return;
    }


    const fullText = [

        currentReaderKalam.title || "Kalam",

        "",

        currentReaderKalam.lyrics || ""

    ].join("\n");


    try {

        await navigator.clipboard.writeText(fullText);

        showMessage(
            currentLanguage === "urdu"
                ? "مکمل کلام کاپی ہوگیا!"
                : "Full Kalam copied successfully!"
        );

    } catch (error) {

        showMessage("Full Kalam copy nahi ho saka.");
    }
});


// =====================================
// READER NAVIGATION
// =====================================

function closeReaderToHome() {
    currentAppHistoryView = "home";
    readerPage.classList.add("hidden");
    homePage.classList.remove("hidden");

    currentReaderKalam = null;
    currentTazmeenEntries = [];
    currentTazmeenIndex = 0;
    isTazmeenMode = false;
    readerPage.classList.remove("tazmeen-mode");

    readerKalamsByLanguage = {
        english: null,
        urdu: null
    };

    if (readerFavoriteBtn) readerFavoriteBtn.classList.add("hidden");
    if (readerTazmeenBtn) readerTazmeenBtn.classList.add("hidden");
    if (readerTazmeenContent) readerTazmeenContent.classList.add("hidden");
    document.querySelector(".reader-action-bar").classList.remove("hidden");
    document.getElementById("backButton").classList.remove("hidden");
    document.getElementById("readerContent").classList.remove("hidden");
    englishTab.classList.remove("hidden");
    urduTab.classList.remove("hidden");

    searchInput.value = "";
    hideSuggestions();
    filterKalams();

    requestAnimationFrame(function () {
        window.scrollTo({ top: savedHomeScrollY, behavior: "instant" });
    });
}


document.getElementById("backButton").addEventListener("click", function () {
    if (currentAppHistoryView === "reader" || currentAppHistoryView === "tazmeen") {
        window.history.back();
    } else {
        closeReaderToHome();
    }
});


window.addEventListener("popstate", function (event) {
    const nextView = event.state?.kalamAppView || "home";

    if (nextView === "tazmeen") {
        currentAppHistoryView = "tazmeen";
        if (!isTazmeenMode && !readerPage.classList.contains("hidden")) {
            openTazmeenMode(true);
        }
        return;
    }

    if (nextView === "reader") {
        if (isTazmeenMode) closeTazmeenMode();
        currentAppHistoryView = "reader";
        if (readerPage.classList.contains("hidden") && event.state?.kalamId) {
            openKalam(event.state.kalamId, true);
        }
        return;
    }

    currentAppHistoryView = "home";
    if (isTazmeenMode) closeTazmeenMode();
    if (!readerPage.classList.contains("hidden")) closeReaderToHome();
});


// =====================================
// FONT SIZE CONTROLS
// =====================================

const isCompactReader = window.matchMedia("(max-width: 650px)").matches;
let englishFontSize = isCompactReader ? 22 : 30;
let urduFontSize = isCompactReader ? 24 : 34;


const fontDecrease = document.getElementById("fontDecrease");

const fontIncrease = document.getElementById("fontIncrease");


function fitLinesToWidth(container, lines, preferredSize) {
    const containerStyle = window.getComputedStyle(container);
    const availableWidth = container.clientWidth -
        parseFloat(containerStyle.paddingLeft) -
        parseFloat(containerStyle.paddingRight);
    if (!lines.length || !availableWidth) return preferredSize;

    let size = preferredSize;
    container.style.fontSize = size + "px";
    while (size > 7 && lines.some(function (line) {
        return line.getBoundingClientRect().width > availableWidth;
    })) {
        size -= 1;
        container.style.fontSize = size + "px";
    }
    return size;
}


function updateFontSize() {

    const activeFontSize = currentLanguage === "urdu"
        ? urduFontSize
        : englishFontSize;

    document.querySelectorAll(
        "#readerContent .verse, #readerTazmeenAshaar .verse"
    ).forEach(
        function (verse) {

            const lines = Array.from(verse.querySelectorAll(".verse-line"));
            fitLinesToWidth(verse, lines, activeFontSize);
        }
    );

    if (readerTazmeenAshaar.classList.contains("tazmeen-plain-text")) {
        const lines = Array.from(readerTazmeenAshaar.querySelectorAll(".verse-line"));
        fitLinesToWidth(readerTazmeenAshaar, lines, activeFontSize);
    }

    readerFontSizeValue.textContent = activeFontSize + "px";
}


window.addEventListener("resize", function () {
    requestAnimationFrame(updateFontSize);
});

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateFontSize);
}


fontIncrease.addEventListener("click", function () {

    if (currentLanguage === "urdu") {

        urduFontSize = Math.min(
            urduFontSize + 2,
            48
        );

    } else {

        englishFontSize = Math.min(
            englishFontSize + 2,
            44
        );
    }

    updateFontSize();
});


fontDecrease.addEventListener("click", function () {

    if (currentLanguage === "urdu") {

        urduFontSize = Math.max(
            urduFontSize - 2,
            16
        );

    } else {

        englishFontSize = Math.max(
            englishFontSize - 2,
            14
        );
    }

    updateFontSize();
});


// =====================================
// START WEBSITE
// =====================================

loadKalams();
