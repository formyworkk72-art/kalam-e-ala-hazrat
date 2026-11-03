"use strict";

// =====================================
// KALAM E ALA HAZRAT
// ENGLISH + URDU SECTIONS
// =====================================

// HTML ELEMENTS mera naam abdul hai


const homePage = document.getElementById("homePage");
const readerPage = document.getElementById("readerPage");
const kalamList = document.getElementById("kalamList");

const searchInput = document.getElementById("searchInput");
const themeSelect = document.getElementById("themeSelect");
const message = document.getElementById("message");

const englishTab = document.getElementById("englishTab");
const urduTab = document.getElementById("urduTab");

const englishAlphabet = document.getElementById("englishAlphabet");
const urduAlphabet = document.getElementById("urduAlphabet");

const sectionTitle = document.getElementById("sectionTitle");
const kalamCount = document.getElementById("kalamCount");

let englishKalams = [];
let urduKalams = [];

let currentLanguage = "english";
let selectedLetter = "ALL";
let currentKalams = [];
let currentReaderKalam = null;


// =====================================
// SMOOTH PAGE TRANSITION
// =====================================

function animatePageTransition(element) {
    if (!element) return;

    element.classList.remove("page-transition");

    void element.offsetWidth;

    element.classList.add("page-transition");
}


// =====================================
// THEME SYSTEM
// =====================================

const savedTheme = localStorage.getItem("kalam-theme") || "light";

document.body.dataset.theme = savedTheme;
themeSelect.value = savedTheme;

themeSelect.addEventListener("change", function () {
    const theme = themeSelect.value;

    document.body.dataset.theme = theme;
    localStorage.setItem("kalam-theme", theme);
});


// =====================================
// MESSAGE SYSTEM
// =====================================

function showMessage(text) {
    message.textContent = text;

    setTimeout(function () {
        message.textContent = "";
    }, 2500);
}


// =====================================
// URDU ALPHABET SORTING
// =====================================

function sortUrduKalams(kalams) {

    const alphabet = [
        "ا", "آ", "ب", "پ", "ت", "ٹ", "ث",
        "ج", "چ", "ح", "خ", "د", "ڈ", "ذ",
        "ر", "ڑ", "ز", "ژ", "س", "ش", "ص",
        "ض", "ط", "ظ", "ع", "غ", "ف", "ق",
        "ک", "گ", "ل", "م", "ن", "و", "ہ",
        "ھ", "ء", "ی"
    ];

    function getIndex(title) {

        const firstLetter = (title || "").trim()[0];

        const index = alphabet.indexOf(firstLetter);

        return index === -1 ? 999 : index;
    }

    return [...kalams].sort(function (a, b) {
        return getIndex(a.title) - getIndex(b.title);
    });
}


// =====================================
// SUPABASE CONNECTION
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


        // ENGLISH KALAMS

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


        // URDU KALAMS

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
// =====================================

function switchLanguage(language) {

    currentLanguage = language;
    selectedLetter = "ALL";

    searchInput.value = "";

    englishTab.classList.toggle(
        "active",
        language === "english"
    );

    urduTab.classList.toggle(
        "active",
        language === "urdu"
    );

    englishAlphabet.classList.toggle(
        "hidden",
        language !== "english"
    );

    urduAlphabet.classList.toggle(
        "hidden",
        language !== "urdu"
    );

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

    filterKalams();

    animatePageTransition(homePage);
}

englishTab.addEventListener("click", function () {
    switchLanguage("english");
});

urduTab.addEventListener("click", function () {
    switchLanguage("urdu");
});


// =====================================
// ALPHABET BUTTON ACTIVE STATE
// =====================================

function setActiveAlphabet(container, letter) {

    container.querySelectorAll(".letter-btn").forEach(function (button) {

        button.classList.toggle(
            "active",
            button.dataset.letter === letter
        );

    });

}


// =====================================
// ENGLISH + URDU ALPHABET FILTER
// =====================================

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


function filterKalams() {

    const query = searchInput.value.trim().toLowerCase();

    currentKalams =
        currentLanguage === "english"
            ? englishKalams
            : urduKalams;

    const filteredKalams = currentKalams.filter(function (kalam) {

        const title = (kalam.title || "").trim();
        const poet = (kalam.poet || "").trim();
        const lyrics = (kalam.lyrics || "").trim();

        let matchesSearch;

        if (currentLanguage === "english") {

            matchesSearch =
                title.toLowerCase().includes(query) ||
                poet.toLowerCase().includes(query) ||
                lyrics.toLowerCase().includes(query);

        } else {

            const urduQuery = searchInput.value.trim();

            matchesSearch =
                title.includes(urduQuery) ||
                poet.includes(urduQuery) ||
                lyrics.includes(urduQuery);
        }

        let matchesLetter = true;

        if (selectedLetter !== "ALL") {

            if (currentLanguage === "english") {

                matchesLetter =
                    title.toUpperCase().startsWith(selectedLetter);

            } else {

                const firstLetter = normalizeUrduLetter(
                    Array.from(title)[0] || ""
                );

                const selected = normalizeUrduLetter(selectedLetter);

                matchesLetter = firstLetter === selected;
            }

        }

        return matchesSearch && matchesLetter;

    });

    displayKalams(filteredKalams);

}


// =====================================
// ALPHABET BUTTONS
// =====================================

function setupAlphabetButtons(container) {

    container.querySelectorAll(".letter-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            selectedLetter = button.dataset.letter;

            setActiveAlphabet(container, selectedLetter);

            filterKalams();

            animatePageTransition(kalamList);

        });

    });

}

setupAlphabetButtons(englishAlphabet);
setupAlphabetButtons(urduAlphabet);


// =====================================
// DISPLAY KALAMS
// =====================================

function displayKalams(kalams) {

    kalamList.replaceChildren();

    kalamCount.textContent = kalams.length + " Kalam";

    if (!kalams || kalams.length === 0) {

        const empty = document.createElement("div");

        empty.className = "empty";

        empty.textContent =
            currentLanguage === "urdu"
                ? "اس حرف سے کوئی کلام نہیں ملا۔"
                : "Is letter se koi Kalam nahi mila.";

        kalamList.appendChild(empty);

        return;
    }

    kalams.forEach(function (kalam) {

        const card = document.createElement("article");

        card.className = "kalam-card";

        if (currentLanguage === "urdu") {
            card.classList.add("urdu-card");
        }

        const title = document.createElement("h3");

        title.textContent = kalam.title || "Untitled Kalam";
        title.dir = currentLanguage === "urdu" ? "rtl" : "auto";

        const poet = document.createElement("p");

        poet.textContent = kalam.poet || "Ala Hazrat";

        card.appendChild(title);
        card.appendChild(poet);

        card.addEventListener("click", function () {
            openKalam(kalam.id);
        });

        kalamList.appendChild(card);

    });

}


// =====================================
// SEARCH
// =====================================

searchInput.addEventListener("input", function () {
    filterKalams();
});


// =====================================
// OPEN KALAM
// =====================================

function openKalam(id) {

    const kalam = currentKalams.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!kalam) return;

    currentReaderKalam = kalam;

    homePage.classList.add("hidden");
    readerPage.classList.remove("hidden");

    animatePageTransition(readerPage);

    document.getElementById("readerTitle").textContent =
        kalam.title || "Kalam";

    document.getElementById("readerPoet").textContent =
        kalam.poet || "Ala Hazrat";

    const readerTitle = document.getElementById("readerTitle");
    const readerContent = document.getElementById("readerContent");

    if (currentLanguage === "urdu") {

        readerTitle.dir = "rtl";
        readerContent.dir = "rtl";
        readerContent.classList.add("urdu-reader");

    } else {

        readerTitle.dir = "auto";
        readerContent.dir = "auto";
        readerContent.classList.remove("urdu-reader");

    }

    renderAshaar(kalam.lyrics || "");
    updateFontSize();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// =====================================
// RENDER ASHAAR
// TWO LINES = ONE ASHAAR
// =====================================

function renderAshaar(lyrics) {

    const reader = document.getElementById("readerContent");

    reader.replaceChildren();

    const lines = lyrics
        .split(/\r?\n/)
        .map(function (line) {
            return line.trim();
        })
        .filter(function (line) {
            return line.length > 0;
        });

    if (lines.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty";

        empty.textContent =
            currentLanguage === "urdu"
                ? "اس کلام کے اشعار موجود نہیں ہیں۔"
                : "Is Kalam mein lyrics nahi hain.";

        reader.appendChild(empty);

        return;
    }

    for (let i = 0; i < lines.length; i += 2) {

        const couplet = document.createElement("div");

        couplet.className = "couplet";

        const verse = document.createElement("div");

        verse.className = "verse";

        verse.textContent = lines.slice(i, i + 2).join("\n");

        const actions = document.createElement("div");

        actions.className = "actions";


        // COPY

        const copyBtn = createButton("Copy");

        copyBtn.addEventListener("click", async function () {

            try {

                await navigator.clipboard.writeText(
                    verse.textContent
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


        // HIGHLIGHT

        const highlightBtn = createButton("Highlight");

        highlightBtn.addEventListener("click", function () {

            const active = couplet.classList.toggle("highlighted");

            highlightBtn.classList.toggle("active", active);

            highlightBtn.textContent =
                active ? "Highlighted" : "Highlight";

        });


        // SHARE

        const shareBtn = createButton("Share");

        shareBtn.addEventListener("click", async function () {

            const text = verse.textContent;

            try {

                if (navigator.share) {

                    await navigator.share({
                        title: "Kalam e ala Hazrat",
                        text: text
                    });

                } else if (navigator.clipboard) {

                    await navigator.clipboard.writeText(text);

                    showMessage("Ashaar copied. Ab share kar sakte hain.");

                } else {

                    showMessage("Share feature available nahi hai.");

                }

            } catch (error) {

                if (error.name !== "AbortError") {
                    showMessage("Share nahi ho saka.");
                }

            }

        });


        actions.appendChild(copyBtn);
        actions.appendChild(highlightBtn);
        actions.appendChild(shareBtn);

        couplet.appendChild(verse);
        couplet.appendChild(actions);

        reader.appendChild(couplet);

    }

}


// =====================================
// CREATE BUTTON
// =====================================

function createButton(label) {

    const button = document.createElement("button");

    button.type = "button";
    button.className = "action-btn";
    button.textContent = label;

    return button;

}


// =====================================
// BACK BUTTON
// =====================================

document.getElementById("backButton").addEventListener(
    "click",
    function () {

        readerPage.classList.add("hidden");
        homePage.classList.remove("hidden");

        animatePageTransition(homePage);

        currentReaderKalam = null;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


// =====================================
// START WEBSITE
// =====================================

loadKalams();
// =====================================
// FONT SIZE CONTROLLER
// =====================================

let englishFontSize = 21;
let urduFontSize = 24;

const fontDecrease = document.getElementById("fontDecrease");
const fontIncrease = document.getElementById("fontIncrease");
const fontReset = document.getElementById("fontReset");

function updateFontSize() {

    const verses = document.querySelectorAll(
        "#readerContent .verse"
    );

    verses.forEach(function (verse) {

        if (currentLanguage === "urdu") {

            verse.style.fontSize = urduFontSize + "px";

        } else {

            verse.style.fontSize = englishFontSize + "px";

        }

    });

}

fontIncrease.addEventListener("click", function () {

    if (currentLanguage === "urdu") {

        urduFontSize = Math.min(urduFontSize + 2, 42);

    } else {

        englishFontSize = Math.min(englishFontSize + 2, 38);

    }

    updateFontSize();

});

fontDecrease.addEventListener("click", function () {

    if (currentLanguage === "urdu") {

        urduFontSize = Math.max(urduFontSize - 2, 16);

    } else {

        englishFontSize = Math.max(englishFontSize - 2, 14);

    }

    updateFontSize();



});

fontReset.addEventListener("click", function () {

    englishFontSize = 21;
    urduFontSize = 24;

    updateFontSize();

});
