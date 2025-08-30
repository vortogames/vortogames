// Import helper functions
import {playSound, createAudioBank} from "../static/js/sounds.js";
import {
    initShareUI,
    attachShareButton,
    showShareButton,
} from "../static/js/share.js";

document.addEventListener("DOMContentLoaded", (event) => {
    initShareUI();

    // Game variables
    let themeWord = "";
    let answers = [];
    let clues = [];
    let currentGuess = "";
    let solved = [];
    let clueIndex = 0;
    let wordCount = 0;
    let maxWordLength = 0;
    let correctGuesses = new Set();
    let columnText = "";
    let centeredIndex = [];
    let hints = [];

    let phase2 = false;
    let phase2Height = 0; // total rows in the invisible grid (per col)
    let paylineRow = 0; // which row is the highlighted row
    let offsets = []; // per-column start index where the word begins

    const PAD = 4;

    // HTML elements
    const puzzleGrid = document.getElementById("puzzle-grid");
    const shareBtn = document.getElementById("shareBtn");
    const cluesDiv = document.getElementById("clues");
    const clueDiv = document.getElementById("clue");
    const leftArrowDiv = document.getElementById("left-arrow");
    const rightArrowDiv = document.getElementById("right-arrow");
    const keyboardDiv = document.getElementById("keyboard");
    const directionsDiv = document.getElementById("directions");

    // Keyboard variables
    const row1 = "qwertyuiop".split("");
    const row2 = "asdfghjkl".split("");
    const row3 = "zxcvbnm".split("");

    // Audio elements
    const SOUND_SOURCES = {
        click: ["../static/audio/v_w_l/click1.mp3"],
        correct: ["../static/audio/v_w_l/correct3.mp3"],
        incorrect: ["../static/audio/v_w_l/incorrect8.mp3"],
        lose: ["../static/audio/v_w_l/lose1.mp3"],
    };

    // Per-sound volumes
    const SOUND_VOLUME = {
        click: 0.5,
        correct: 0.2,
        incorrect: 1,
        lose: 0.6,
    };

    // Create audio bank
    const AUDIO_BANK = createAudioBank(SOUND_SOURCES);

    function buildShareText(status) {
        // const dateStr = new Date().toISOString().slice(0,10);
        // const grid = outcomes.join("");
        // const diamondEmoji = "♦️";
        // const livesDisplay = diamondEmoji.repeat(lives);
        // let shareStatus = ''
        // if (status === "WIN") {
        //     shareStatus = `${livesDisplay}\n\nI won v_w_l #${puzzleNumber}!\n\n${grid}`;
        // } else if (status === "LOSE") {
        //     shareStatus = `I lost v_w_l #${puzzleNumber}!\n\n${grid}`
        // } else if (status === "IN PROGRESS") {
        //     shareStatus = `In progress on v_w_l`
        // } else {
        //     shareStatus = ''
        // }
        // return shareStatus;
        return "Results placeholder";
    }

    attachShareButton(
        shareBtn,
        () => buildShareText("IN PROGRESS"),
        () => "My Cross Link result"
    );

    function clearColumn(colIndex) {
        const len = answers[colIndex].length;
        for (let i = 0; i < len; i++) {
            const cell = document.getElementById(`cell-${colIndex}-${i}`);
            if (cell) cell.textContent = "";
        }
    }

    function highlightColumn(colIndex) {
        let len = answers[clueIndex].length;
        for (let i = 0; i < len; i++) {
            const cell = document.getElementById(`cell-${colIndex}-${i}`);
            cell.classList.add("selected");
        }
    }

    function removeHighlight(colIndex) {
        let len = answers[clueIndex].length;
        for (let i = 0; i < len; i++) {
            const cell = document.getElementById(`cell-${colIndex}-${i}`);
            cell.classList.remove("selected");
        }
    }

    function highlightRow(rowIndex = 0) {
        // optional: clear any prior row highlight
        document
            .querySelectorAll(".puzzle-cell.row-highlight")
            .forEach((el) => el.classList.remove("row-highlight"));

        for (let col = 0; col < answers.length; col++) {
            const cell = document.getElementById(`cell-${col}-${rowIndex}`);
            if (cell) cell.classList.add("row-highlight");
        }
    }

    function clearClueBox() {
        if (correctGuesses.size !== answers.length) {
            return;
        } else {
            document
                .querySelectorAll(".puzzle-cell.selected")
                .forEach((el) => el.classList.remove("selected"));

            // clueDiv.innerHTML = "Align the words to spell the theme"
            leftArrowDiv.remove();
            rightArrowDiv.remove();
            keyboardDiv.remove();
            directionsDiv.classList.add("directions");
            directionsDiv.innerHTML = "Align the words to spell the theme";
        }
    }

    const isSolved = (i) => correctGuesses.has(i);
    const allSolved = () => correctGuesses.size === answers.length;

    // Function to handle key presses
    const handleKeyPress = (letter) => {
        // console.log(`current word: ${answers[clueIndex]}`)
        // console.log(`currentGuess: ${currentGuess}`)
        if (currentGuess.length >= answers[clueIndex].length) {
            return;
        } else {
            playSound("click", AUDIO_BANK, SOUND_VOLUME);
            currentGuess += letter;
            // console.log(currentGuess);
            let currentBox = document.getElementById(
                `cell-${clueIndex}-${currentGuess.length - 1}`
            );
            currentBox.textContent = letter;
            if (currentGuess.length === answers[clueIndex].length) {
                if (currentGuess === answers[clueIndex]) {
                    playSound("correct", AUDIO_BANK, SOUND_VOLUME);
                    correctGuesses.add(clueIndex);
                    console.log([...correctGuesses]);
                    console.log(`correctGuesses len: ${correctGuesses.size}`);
                    console.log(`answers len: ${answers.length}`);
                    if (correctGuesses.size === answers.length) {
                        console.log(`Finished with phase 1`);
                        highlightRow();
                        clearClueBox();
                        createPuzzleGridPhase2();
                        return;
                    }
                    nextClue();
                } else {
                    playSound("incorrect", AUDIO_BANK, SOUND_VOLUME);
                    currentGuess = "";
                    clearColumn(clueIndex);
                }
            }
        }
    };

    // Function to handle delete key press
    const handleDeletePress = () => {
        if (currentGuess.length == 0) {
            return;
        } else {
            // Remove last character
            currentGuess = currentGuess.slice(0, -1);
            console.log(currentGuess);
            let currentBox = document.getElementById(
                `cell-${clueIndex}-${currentGuess.length}`
            );
            currentBox.textContent = "";
        }
    };

    // Function to create and display clues
    const createClues = () => {
        clueDiv.textContent = `${clueIndex + 1}. ${clues[clueIndex]}`;
    };

    function nextClue() {
        removeHighlight(clueIndex);
        if (!isSolved(clueIndex)) clearColumn(clueIndex);
        currentGuess = "";

        if (allSolved()) {
            clueIndex = (clueIndex + 1) % wordCount;
            createClues();
            return;
        }

        const start = clueIndex;
        do {
            clueIndex = (clueIndex + 1) % wordCount;
            if (clueIndex === start) break;
        } while (isSolved(clueIndex));

        createClues();
        highlightColumn(clueIndex);
    }

    const previousClue = () => {
        removeHighlight(clueIndex);
        if (!isSolved(clueIndex)) clearColumn(clueIndex);
        currentGuess = "";

        if (allSolved()) {
            clueIndex = (clueIndex - 1 + wordCount) % wordCount;
            createClues();
            return;
        }

        const start = clueIndex;
        do {
            clueIndex = (clueIndex - 1 + wordCount) % wordCount;
            if (clueIndex === start) break;
        } while (isSolved(clueIndex));

        createClues();
        highlightColumn(clueIndex);
    };

    // Update clue values based on arrow clicks
    rightArrowDiv.addEventListener("click", (event) => {
        nextClue();
    });
    leftArrowDiv.addEventListener("click", (event) => {
        previousClue();
    });

    // Create puzzle grid (one column per answer; each column has N cells)
    const createPuzzleGrid = () => {
        puzzleGrid.innerHTML = ""; // Clear existing

        answers.forEach((word, colIndex) => {
            const col = document.createElement("div");
            col.className = "puzzle-column";
            col.id = `column-${colIndex}`;

            // create one cell per letter (empty text for now)
            for (let i = 0; i < word.length; i++) {
                const cell = document.createElement("div");
                cell.className = "puzzle-cell";
                cell.id = `cell-${colIndex}-${i}`;
                // For debugging you can show letters; leave commented for gameplay feel:
                // cell.textContent = word[i];
                col.appendChild(cell);
            }

            puzzleGrid.appendChild(col);
        });
    };

    // ---- Phase 2 grid with hidden empties + payline-locked scrolling ----

    // helper: per-column legal offset range so payline always has a letter
    function offsetBounds(wordLen) {
        // start index so that the *last* letter can sit on payline at minimum,
        // and the *first* letter can sit on payline at maximum.
        const minOff = Math.max(0, paylineRow - (wordLen - 1));
        const maxOff = Math.min(paylineRow, phase2Height - wordLen);
        return [minOff, maxOff];
    }

    // Step 1: build the invisible grid and hook up handlers
    function createPuzzleGridPhase2() {
        puzzleGrid.innerHTML = "";
        phase2 = true;

        // tall enough for freedom to move; tune if desired
        phase2Height = maxWordLength * 2 - 1;

        // pick a payline row (center looks great)
        paylineRow = Math.floor(phase2Height / 2);

        // init offsets so each word's FIRST letter sits on the payline (maxOff)
        offsets = answers.map((word) => {
            const [, maxOff] = offsetBounds(word.length);
            return maxOff;
        });

        // Build columns
        answers.forEach((word, colIndex) => {
            const col = document.createElement("div");
            col.className = "puzzle-column phase2";
            col.id = `column-${colIndex}`;
            col.setAttribute("tabindex", "0");

            // Create the invisible grid cells
            for (let r = 0; r < phase2Height; r++) {
                const cell = document.createElement("div");
                cell.className = "puzzle-cell";
                cell.id = `cell-${colIndex}-${r}`;
                col.appendChild(cell);
            }

            puzzleGrid.appendChild(col);
            paintColumn(colIndex); // paint AFTER appending so queries find cells

            // Wheel “scroll” = move offset up/down by 1
            col.addEventListener(
                "wheel",
                (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const dir = Math.sign(e.deltaY); // 1 down, -1 up
                    nudgeColumn(colIndex, dir);
                },
                {passive: false}
            );

            // Touch drag (mobile) → discrete steps
            let startY = null,
                accum = 0;
            const STEP_PX = 20;

            col.addEventListener(
                "touchstart",
                (e) => {
                    if (e.touches.length !== 1) return;
                    startY = e.touches[0].clientY;
                    accum = 0;
                },
                {passive: true}
            );

            col.addEventListener(
                "touchmove",
                (e) => {
                    if (startY == null) return;
                    const y = e.touches[0].clientY;
                    const dy = y - startY; // + down, - up
                    accum += dy;
                    startY = y;

                    while (accum <= -STEP_PX) {
                        nudgeColumn(colIndex, +1);
                        accum += STEP_PX;
                        e.preventDefault();
                    }
                    while (accum >= +STEP_PX) {
                        nudgeColumn(colIndex, -1);
                        accum -= STEP_PX;
                        e.preventDefault();
                    }

                    e.stopPropagation();
                },
                {passive: false}
            );

            col.addEventListener(
                "touchend",
                () => {
                    startY = null;
                    accum = 0;
                },
                {passive: true}
            );
        });

        paintPayline();
    }

    // Step 2: move a column’s word up/down by one row and repaint (clamped)
    function nudgeColumn(colIndex, dir) {
        const wordLen = answers[colIndex].length;
        const [minOff, maxOff] = offsetBounds(wordLen);

        const next = Math.max(
            minOff,
            Math.min(maxOff, offsets[colIndex] + dir)
        );
        if (next !== offsets[colIndex]) {
            offsets[colIndex] = next;
            paintColumn(colIndex);
            checkThemeAlignment();
        }
    }

    // Step 3: paint a single column from its offset, hiding empty cells
    function paintColumn(colIndex) {
        const word = answers[colIndex];
        const start = offsets[colIndex];

        for (let r = 0; r < phase2Height; r++) {
            const cell = document.getElementById(`cell-${colIndex}-${r}`);
            if (!cell) continue;
            cell.textContent = "";
            cell.style.visibility = "hidden"; // hide empties
            cell.classList.remove("row-highlight");
        }

        // place letters and show those cells
        for (let i = 0; i < word.length; i++) {
            const r = start + i;
            const cell = document.getElementById(`cell-${colIndex}-${r}`);
            if (cell) {
                cell.textContent = word[i];
                cell.style.visibility = "visible"; // show letters
            }
        }

        // highlight payline only if there's a letter there
        const hl = document.getElementById(`cell-${colIndex}-${paylineRow}`);
        if (hl && hl.textContent) hl.classList.add("row-highlight");
    }

    // Step 4: paint the payline across all columns
    function paintPayline() {
        document
            .querySelectorAll(".puzzle-cell.row-highlight")
            .forEach((el) => el.classList.remove("row-highlight"));

        for (let col = 0; col < answers.length; col++) {
            const cell = document.getElementById(`cell-${col}-${paylineRow}`);
            if (cell && cell.textContent) cell.classList.add("row-highlight");
        }
    }

    // Step 5: win check for phase 2
    function checkThemeAlignment() {
        for (let c = 0; c < answers.length; c++) {
            const idxOnPayline = paylineRow - offsets[c]; // index of letter at payline
            if (idxOnPayline < 0 || idxOnPayline >= answers[c].length) return; // should never happen due to clamping
            const ch = answers[c][idxOnPayline].toLowerCase();
            if (ch !== themeWord[c].toLowerCase()) return;
        }
        playSound("correct", AUDIO_BANK, SOUND_VOLUME);
        console.log("Phase 2 solved! 🎉");
        buildEndScreen();
    }

    function buildEndScreen() {
        directionsDiv.innerHTML = "";
        puzzleGrid.innerHTML = "";
        puzzleGrid.classList.add("end-screen");

        const winMsg = document.createElement("div");
        winMsg.className = "end-title";
        winMsg.textContent = "You win!";
        directionsDiv.appendChild(winMsg);

        const subtitle = document.createElement("div");
        subtitle.className = "end-subtitle";
        subtitle.textContent = "The theme word was:";
        puzzleGrid.appendChild(subtitle);

        const wordContainer = document.createElement("div");
        wordContainer.className = "end-theme-word";
        for (let i = 0; i < themeWord.length; i++) {
            const cell = document.createElement("div");
            cell.className = "puzzle-cell row-highlight";
            cell.textContent = themeWord[i].toUpperCase();
            wordContainer.appendChild(cell);
        }
        puzzleGrid.appendChild(wordContainer);

        showShareButton(shareBtn);
    }

    function giveHint() {
        
    }

    // Create keyboard
    const createKeyboard = () => {
        const keyboardContainer = document.getElementById("keyboard");
        [row1, row2, row3].forEach((row) => {
            const rowDiv = document.createElement("div");
            rowDiv.className = "keyboard-row";
            rowDiv.id = `letter-${row[0]}`;
            // if (row === row3) {
            //     const button = document.createElement("button");
            //     button.textContent = "enter";
            //     button.className = "key special";
            //     button.id = "enter";
            //     button.addEventListener("click", () => handleEnterPress());
            //     rowDiv.appendChild(button);
            // }
            row.forEach((letter) => {
                const button = document.createElement("button");
                button.textContent = letter;
                button.className = "key";
                button.setAttribute("data-letter", letter);
                button.addEventListener("click", () => handleKeyPress(letter));
                rowDiv.appendChild(button);
            });
            if (row === row3) {
                const button = document.createElement("button");
                button.className = "key special ph ph-backspace";
                button.id = "delete";
                button.addEventListener("click", () => handleDeletePress());
                rowDiv.appendChild(button);
            }
            keyboardContainer.appendChild(rowDiv);
        });

        // Pointer on keyboard hover
        const keys = document.querySelectorAll(".key");
        keys.forEach((key) => {
            key.addEventListener("mouseover", () => {
                key.style.cursor = "pointer";
            });
            key.addEventListener("mouseout", () => {
                key.style.cursor = "default";
            });
        });
    };

    // Fetch JSON data
    fetch("puzzles/1.json")
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then((data) => {
            // Support either { puzzle: [...] } or { clues: [...] }
            const rows = Array.isArray(data.puzzle)
                ? data.puzzle
                : Array.isArray(data.clues)
                ? data.clues
                : [];

            if (!rows.length) {
                throw new Error(
                    'Puzzle data missing: expected a "puzzle" or "clues" array'
                );
            }

            // Sort by column_index to guarantee left→right order
            rows.sort((a, b) => (a.column_index ?? 0) - (b.column_index ?? 0));

            // Basic fields
            themeWord = (data.theme_word || "").trim().toLowerCase();
            if (!themeWord) throw new Error("theme_word missing");

            // Build parallel arrays
            answers = rows.map((r) => (r.answer || "").trim());
            clues = rows.map((r) => (r.clue ?? r.clue_text ?? "").trim());

            // Optional: quick sanity checks
            if (answers.some((a) => !a)) console.warn("Empty answer found");
            if (clues.some((c) => !c)) console.warn("Empty clue found");
            if (rows.length !== themeWord.length) {
                console.warn(
                    `Columns (${rows.length}) != theme_word length (${themeWord.length}). ` +
                        `You can still play, but alignment may be impossible for some columns.`
                );
            }

            // Optional: verify each column’s answer contains its target theme letter
            const targets = [...themeWord]; // one letter per column
            rows.forEach((row, i) => {
                const ok = row.answer.toLowerCase().includes(targets[i]);
                if (!ok) {
                    console.warn(
                        `Column ${i} answer "${row.answer}" does not contain required letter "${targets[i]}".`
                    );
                }
            });

            wordCount = answers.length;
            maxWordLength = Math.max(...answers.map((word) => word.length));

            // console.log("Word count:", wordCount);
            // console.log("Max word length:", maxWordLength);

            // console.log("Theme word:", themeWord);
            // console.log("Answers:", answers);
            // console.log("Clues:", clues);

            createKeyboard();
            createClues();
            createPuzzleGrid();
            highlightColumn(clueIndex);
        })
        .catch((error) => console.error("Error loading puzzle data:", error));

    document.addEventListener("keydown", (event) => {
        const letter = event.key.toLowerCase();
        if (letter === "backspace") {
            handleDeletePress();
        } else if (letter.length === 1 && letter >= "a" && letter <= "z") {
            handleKeyPress(letter);
        }
    });
});
