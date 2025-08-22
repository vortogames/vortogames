// Import helper functions
import { playSound, createAudioBank } from '../static/js/sounds.js';
import { initShareUI, attachShareButton, showShareButton } from "../static/js/share.js";

document.addEventListener("DOMContentLoaded", (event) => {
    initShareUI();

    // Game variables
    let word = "";
    let guesses = ['a', 'e', 'i', 'o', 'u'];
    let correctGuesses = [];
    let typedLetter = "";
    let lives = 3;
    let winLanguage = "";
    let lossLanguage = "";
    let puzzleDate = "";
    let puzzleNumber = "";
    let outcomes = [];

    // HTML elements
    const typedDiv = document.getElementById("typed");
    const typedUnderlineDiv = document.getElementById("typed-underline");
    const wordDiv = document.getElementById("word");
    const livesDiv = document.getElementById("lives");
    const messageDiv = document.getElementById("message");

    // Keyboard variables
    const row1 = "qwertyuiop".split("");
    const row2 = "asdfghjkl".split("");
    const row3 = "zxcvbnm".split("");

    // Share button
    const shareBtn = document.getElementById("shareBtn");

    // Audio elements
    const SOUND_SOURCES = {
        click: ['../static/audio/v_w_l/click1.mp3'],
        correct: ['../static/audio/v_w_l/correct3.mp3'],
        incorrect: ['../static/audio/v_w_l/incorrect8.mp3'],
        lose: ['../static/audio/v_w_l/lose1.mp3'],
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
        // Example: customize as you like
        const dateStr = new Date().toISOString().slice(0,10);
        const grid = outcomes.join("");
        const diamondEmoji = "♦️";
        const livesDisplay = diamondEmoji.repeat(lives);
        let shareStatus = ''
        if (status === "WIN") {
            shareStatus = `${livesDisplay}\n\nI won v_w_l #${puzzleNumber}!\n\n${grid}`;
        } else if (status === "LOSE") {
            shareStatus = `I lost v_w_l #${puzzleNumber}!\n\n${grid}`
        } else if (status === "IN PROGRESS") {
            shareStatus = `In progress on v_w_l`
        } else {
            shareStatus = ''
        }
        return shareStatus;
    }

    attachShareButton(shareBtn, () => buildShareText("IN PROGRESS"), () => "My v_w_l result");

    // Function to handle key presses
    const handleKeyPress = (letter) => {
        if (guesses.includes(letter)) {
            return;
        }
        playSound('click', AUDIO_BANK, SOUND_VOLUME);
        for (const letter of typedLetter) {
            // Find the specific button element for the guessed letter
            const keyButton = document.querySelector(`.key[data-letter="${letter}"]`);
            if (keyButton) {
                keyButton.classList.remove("selected");
            }
        }
        typedLetter = letter;
        typedDiv.innerHTML = letter;
        for (const letter of typedLetter) {
            // Find the specific button element for the guessed letter
            const keyButton = document.querySelector(`.key[data-letter="${letter}"]`);
            if (keyButton) {
                keyButton.classList.add("selected");
            }
        }
    };

    // Function to handle enter key press
    const handleEnterPress = () => {
        if (typedLetter.length == 0) {
            return;
        } else {
            // Check if the typed text is a valid guess before appending
            if (typedLetter.length > 0) {
                guesses.push(typedLetter);
                // Add guessed class to letter button
                for (const letter of typedLetter) {
                    // Find the specific button element for the guessed letter
                    const keyButton = document.querySelector(`.key[data-letter="${letter}"]`);
                    if (keyButton) {
                        keyButton.classList.add("guessed");
                        keyButton.classList.remove("selected");
                    }
                }
                if (word.includes(typedLetter)) {
                    playSound('correct', AUDIO_BANK, SOUND_VOLUME);
                    correctGuesses.push(typedLetter);
                    outcomes.push('✅');
                    if (lives < 5) {
                        lives += 1;
                    }
                } else {
                    playSound('incorrect', AUDIO_BANK, SOUND_VOLUME);
                    lives -= 1;
                    outcomes.push('❌');
                }

                updateLivesDisplay();

                if (lives > 0) {
                    typedLetter = "";
                    typedDiv.innerHTML = typedLetter;
                    updateWordDisplay();
                } else if (lives == 0) {
                    playSound('lose', AUDIO_BANK, SOUND_VOLUME);
                    wordDiv.innerHTML = "";
                    typedDiv.innerHTML = "";
                    wordDiv.innerHTML = lossLanguage;
                    messageDiv.innerHTML = "The word was: <br>" + word
                    typedUnderlineDiv.style.display = "none";
                    attachShareButton(shareBtn, () => buildShareText("LOSE"), () => "v_w_l result");
                    showShareButton();
                }
                    
                const wordLetters = word.split("").filter(l => l !== "a" && l !== "e" && l !== "i" && l !== "o" && l !== "u");
                const wordLettersUnique = [...new Set(wordLetters)];

                if (wordLettersUnique.length == correctGuesses.length) {
                    wordDiv.innerHTML = winLanguage;
                    messageDiv.innerHTML = "You got it! The word was: <br><b>" + word + "</b>";
                    typedDiv.innerHTML = "";
                    typedUnderlineDiv.style.display = "none";
                    attachShareButton(shareBtn, () => buildShareText("WIN"), () => "v_w_l result");
                    showShareButton();
                    return;
                }
            }
        }
    }

    // Function to handle delete key press
    const handleDeletePress = () => {
        if (typedLetter.length == 0) {
            return;
        } else {
            for (const letter of typedLetter) {
                // Find the specific button element for the guessed letter
                const keyButton = document.querySelector(`.key[data-letter="${letter}"]`);
                if (keyButton) {
                    keyButton.classList.remove("selected");
                }
            }
            typedLetter = "";
            typedDiv.innerHTML = typedLetter;
        }
    }

    // Create word display
    const updateWordDisplay = () => {
        wordDiv.innerHTML = "";
        word.split("").forEach(letter => {
            const letterDiv = document.createElement("div");
            letterDiv.className = "letter";
            if (guesses.includes(letter)) {
                letterDiv.classList.add("correct");
                letterDiv.textContent = letter;
            } else {
                letterDiv.textContent = "";
            }
            wordDiv.appendChild(letterDiv);
        });
    }

    // Lives display
    const updateLivesDisplay = () => {
        livesDiv.innerHTML = "";
        // Hearts
        // for (let i = 0; i < lives; i++) {
        //     const heartImg = document.createElement("img");
        //     heartImg.src = "graphics/heart.png";
        //     heartImg.alt = "lives";
        //     heartImg.className = "heart";
        //     livesDiv.appendChild(heartImg);
        // }
        // Diamonds
        for (let i = 0; i < lives; i++) {
            const diamondDiv = document.createElement("div");
            diamondDiv.className = "diamond";
            livesDiv.appendChild(diamondDiv);
        }
    };

    // Create keyboard
    const createKeyboard = () => {
        const keyboardContainer = document.getElementById("keyboard");
        [row1, row2, row3].forEach(row => {
            const rowDiv = document.createElement("div");
            rowDiv.className = "keyboard-row";
            rowDiv.id = `letter-${row[0]}`;
            if (row === row3) {
                const button = document.createElement("button");
                button.textContent = "enter";
                button.className = "key special";
                button.id = "enter";
                button.addEventListener("click", () => handleEnterPress());
                rowDiv.appendChild(button);
            }
            row.forEach(letter => {
                const button = document.createElement("button");
                button.textContent = letter;
                button.className = "key";
                if (guesses.includes(letter)) {
                    button.classList.add("guessed");
                }
                button.setAttribute("data-letter", letter);
                button.addEventListener("click", () => handleKeyPress(letter));
                rowDiv.appendChild(button);
            });
            if (row === row3) {
                const button = document.createElement("button");
                button.textContent = "delete";
                button.className = "key special";
                button.id = "delete";
                button.addEventListener("click", () => handleDeletePress());
                rowDiv.appendChild(button);
            }
            keyboardContainer.appendChild(rowDiv);
        });

        // Pointer on keyboard hover
        const keys = document.querySelectorAll(".key");
        keys.forEach(key => {
            key.addEventListener("mouseover", () => {
                key.style.cursor = "pointer";
            });
            key.addEventListener("mouseout", () => {
                key.style.cursor = "default";
            });
        });
    }


    fetch('v_w_l.csv').then(response => {
        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Read the response as plain text
        return response.text();
    }).then(csvText => {
        const rows = csvText.split('\n').filter(row => row.trim() !== '');
        const header = rows[0].split(','); // Get the column headers

        const data = rows.slice(1).map(row => {
            const values = row.split(',');
            return {
                [header[0]]: values[0],
                [header[1]]: values[1],
                [header[2]]: values[2],
                [header[3]]: values[3],
                [header[4]]: values[4],
            };
        });

        // Get all the puzzle numbers and filter out any blanks.
        function toISODateLocal(d = new Date()) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        }

        const todayStr = toISODateLocal();

        // Get all the puzzle dates and filter out any blanks.
        const puzzleDates = data.map(item => item[header[1]]).filter(word => word.trim() !== "");
        const todaysDateIndex = puzzleDates.findIndex(d => d.trim() === todayStr);
        puzzleDate = puzzleDates[todaysDateIndex];     

        // Get all the puzzle numbers and filter out any blanks.
        const puzzleNumbers = data.map(item => item[header[0]]).filter(word => word.trim() !== "");
        puzzleNumber = puzzleNumbers[todaysDateIndex];  

        // Get all the words and filter out any blanks.
        const words = data.map(item => item[header[2]]).filter(word => word.trim() !== "");
        // const wordRandomIndex = Math.floor(Math.random() * words.length);
        word = words[todaysDateIndex].toLowerCase();

        // Get all the win messages and filter out any blanks.
        const winMessages = data.map(item => item[header[3]]).filter(message => message.trim() !== "");
        const winRandomIndex = Math.floor(Math.random() * winMessages.length);
        winLanguage = winMessages[winRandomIndex];

        // Get all the loss messages and filter out any blanks.
        const lossMessages = data.map(item => item[header[4]]).filter(message => message.trim() !== "");
        const lossRandomIndex = Math.floor(Math.random() * lossMessages.length);
        lossLanguage = lossMessages[lossRandomIndex];
        
        // console.log("Game started! The secret word is:", word);

        updateWordDisplay();
        updateLivesDisplay();
        createKeyboard();

    }).catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
});