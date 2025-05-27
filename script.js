// Game state
let gameStarted = false;
let moves = 0;
let timer = 0;
let timerInterval;
let flippedCards = [];
let matchedPairs = 0;
let currentScore = 0;

// DOM elements
const gameBoard = document.getElementById('game-board');
const movesCount = document.getElementById('moves-count');
const timeDisplay = document.getElementById('time');
const startButton = document.getElementById('start');
const difficultySelect = document.getElementById('difficulty');
const currentScoreDisplay = document.getElementById('current-score');
const easyHighScore = document.getElementById('easy-high-score');
const mediumHighScore = document.getElementById('medium-high-score');
const hardHighScore = document.getElementById('hard-high-score');
const toggleScoresButton = document.getElementById('toggle-scores');
const highScoresSidebar = document.getElementById('high-scores-sidebar');
const currentStats = document.querySelector('.current-stats');
const resultsModal = document.getElementById('results-modal');
const closeModalBtn = document.querySelector('.close-modal');
const playAgainBtn = document.querySelector('.play-again-btn');
const closeBtn = document.querySelector('.close-btn');

// Card emojis for the game
const cardEmojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
    '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'
];

// Load high scores from localStorage
function loadHighScores() {
    const scores = JSON.parse(localStorage.getItem('memoryGameHighScores')) || {
        easy: 0,
        medium: 0,
        hard: 0
    };
    
    easyHighScore.textContent = scores.easy === 0 ? '-' : scores.easy;
    mediumHighScore.textContent = scores.medium === 0 ? '-' : scores.medium;
    hardHighScore.textContent = scores.hard === 0 ? '-' : scores.hard;
    
    return scores;
}

// Save high score
function saveHighScore(difficulty, score) {
    const scores = loadHighScores();
    if (score > scores[difficulty]) {
        scores[difficulty] = score;
        localStorage.setItem('memoryGameHighScores', JSON.stringify(scores));
        loadHighScores();
        return true;
    }
    return false;
}

// Calculate score based on moves and time
function calculateScore(moves, time, difficulty) {
    const baseScore = 1000;
    const movePenalty = 10;
    const timePenalty = 1;
    const difficultyMultiplier = {
        easy: 1,
        medium: 1.5,
        hard: 2
    };
    
    const score = Math.max(0, Math.floor(
        (baseScore - (moves * movePenalty) - (time * timePenalty)) * 
        difficultyMultiplier[difficulty]
    ));
    
    return score;
}

// Update current score display
function updateScore() {
    const difficulty = difficultySelect.value;
    currentScore = calculateScore(moves, timer, difficulty);
    currentScoreDisplay.textContent = currentScore;
}

// Initialize game
function initGame() {
    const difficulty = difficultySelect.value;
    let gridSize;
    
    switch(difficulty) {
        case 'easy':
            gridSize = 4;
            break;
        case 'medium':
            gridSize = 6;
            break;
        case 'hard':
            gridSize = 8;
            break;
    }

    // Clear previous game
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    // Create pairs of cards
    const totalPairs = (gridSize * gridSize) / 2;
    const selectedEmojis = cardEmojis.slice(0, totalPairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    
    // Shuffle cards
    const shuffledCards = shuffleArray(cardPairs);
    
    // Create card elements
    shuffledCards.forEach((emoji, index) => {
        const card = createCard(emoji, index);
        gameBoard.appendChild(card);
    });
}

// Create a card element
function createCard(emoji, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cardIndex = index;
    card.dataset.emoji = emoji;
    
    card.addEventListener('click', () => handleCardClick(card));
    
    return card;
}

// Handle card click
function handleCardClick(card) {
    if (!gameStarted || flippedCards.length >= 2 || card.classList.contains('flipped')) {
        return;
    }

    flipCard(card);
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        movesCount.textContent = moves;
        updateScore();
        checkForMatch();
    }
}

// Flip card
function flipCard(card) {
    card.classList.add('flipped');
    card.textContent = card.dataset.emoji;
}

// Check for match
function checkForMatch() {
    const [card1, card2] = flippedCards;
    const match = card1.dataset.emoji === card2.dataset.emoji;

    if (match) {
        matchedPairs++;
        flippedCards = [];
        checkGameEnd();
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.textContent = '';
            card2.textContent = '';
            flippedCards = [];
        }, 1000);
    }
}

// Check if game is over
function checkGameEnd() {
    const totalPairs = (gameBoard.children.length) / 2;
    if (matchedPairs === totalPairs) {
        endGame();
    }
}

// Start game
function startGame() {
    const difficulty = difficultySelect.value;
    
    // Check if difficulty is selected
    if (!difficulty) {
        // Create and show a temporary message
        const message = document.createElement('div');
        message.className = 'error-message';
        message.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please select a difficulty level first!';
        document.querySelector('.controls-wrapper').appendChild(message);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            message.remove();
        }, 3000);
        return;
    }

    if (!gameStarted) {
        // Starting the game
        gameStarted = true;
        moves = 0;
        timer = 0;
        matchedPairs = 0;
        currentScore = 0;
        movesCount.textContent = moves;
        timeDisplay.textContent = '00:00';
        currentScoreDisplay.textContent = '0';
        startButton.textContent = 'Stop Game';
        currentStats.style.display = 'flex';
        // Add a small delay to ensure the display: flex is applied before adding the visible class
        setTimeout(() => {
            currentStats.classList.add('visible');
        }, 10);
        
        startTimer();
        initGame();
    } else {
        // Stopping the game
        gameStarted = false;
        clearInterval(timerInterval);
        startButton.textContent = 'Start Game';
        currentStats.classList.remove('visible');
        // Wait for the fade-out animation to complete before hiding
        setTimeout(() => {
            currentStats.style.display = 'none';
        }, 300);
        gameBoard.innerHTML = '';
    }
}

// End game
function endGame() {
    gameStarted = false;
    clearInterval(timerInterval);
    startButton.textContent = 'Start Game';
    currentStats.classList.remove('visible');
    // Wait for the fade-out animation to complete before hiding
    setTimeout(() => {
        currentStats.style.display = 'none';
    }, 300);
    
    const difficulty = difficultySelect.value;
    const isNewHighScore = saveHighScore(difficulty, currentScore);
    
    // Update modal content
    const gameStats = document.querySelector('.game-stats');
    const scoreDisplay = document.querySelector('.score-display');
    const highScoreMessage = document.querySelector('.high-score-message');
    
    gameStats.textContent = `You won in ${moves} moves and ${timeDisplay.textContent}!`;
    scoreDisplay.textContent = `Score: ${currentScore}`;
    
    if (isNewHighScore) {
        highScoreMessage.textContent = 'New High Score! 🎉';
        highScoreMessage.style.display = 'block';
    } else {
        highScoreMessage.style.display = 'none';
    }
    
    // Show modal
    resultsModal.classList.add('active');
}

// Close modal
function closeModal() {
    resultsModal.classList.remove('active');
    
    // Add fade-out class to game board
    gameBoard.classList.add('fade-out');
    
    // Wait for the fade-out animation to complete before clearing the board
    setTimeout(() => {
        // Clear the game board
        gameBoard.innerHTML = '';
        // Remove fade-out class
        gameBoard.classList.remove('fade-out');
        
        // Reset game state
        gameStarted = false;
        moves = 0;
        timer = 0;
        matchedPairs = 0;
        currentScore = 0;
        flippedCards = [];
        
        // Update displays
        movesCount.textContent = '0';
        timeDisplay.textContent = '00:00';
        currentScoreDisplay.textContent = '0';
        startButton.textContent = 'Start Game';
    }, 500); // Match this with the CSS transition duration
}

// Event listeners for modal
closeModalBtn.addEventListener('click', closeModal);
closeBtn.addEventListener('click', closeModal);
playAgainBtn.addEventListener('click', () => {
    closeModal();
    startGame();
});

// Close modal when clicking outside
resultsModal.addEventListener('click', (event) => {
    if (event.target === resultsModal) {
        closeModal();
    }
});

// Start timer
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer++;
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        updateScore();
    }, 1000);
}

// Utility function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Event listeners
startButton.addEventListener('click', startGame);
difficultySelect.addEventListener('change', () => {
    if (gameStarted) {
        startGame();
    }
});

// Load high scores when the page loads
loadHighScores();

// Add click outside to close
document.addEventListener('click', (event) => {
    if (!highScoresSidebar.contains(event.target) && 
        !toggleScoresButton.contains(event.target) && 
        highScoresSidebar.classList.contains('active')) {
        highScoresSidebar.classList.remove('active');
    }
});

// Add toggle scores button
toggleScoresButton.addEventListener('click', () => {
    highScoresSidebar.classList.toggle('active');
});

// Add close sidebar button
const closeSidebarButton = document.querySelector('.close-sidebar');
closeSidebarButton.addEventListener('click', () => {
    highScoresSidebar.classList.remove('active');
}); 