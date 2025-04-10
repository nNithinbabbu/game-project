// Game State
const gameState = {
    isPlaying: false,
    keysCollected: 0,
    playerPosition: { x: 0, y: 0 },
    grannyPosition: { x: 0, y: 0 },
    rooms: [],
    interactiveObjects: [],
    soundEffects: {}
};

// DOM Elements
const startModal = new bootstrap.Modal(document.getElementById('startModal'));
const instructionsModal = new bootstrap.Modal(document.getElementById('instructionsModal'));
const gameOverModal = new bootstrap.Modal(document.getElementById('gameOverModal'));
const gameContainer = document.getElementById('gameContainer');
const player = document.getElementById('player');
const granny = document.getElementById('granny');
const keyCountDisplay = document.getElementById('keyCount');

// Sound Effects
function loadSounds() {
    gameState.soundEffects = {
        footstep: new Audio('sounds/footstep.mp3'),
        doorCreak: new Audio('sounds/door-creak.mp3'),
        keyPickup: new Audio('sounds/key-pickup.mp3'),
        grannyScream: new Audio('sounds/granny-scream.mp3'),
        ambient: new Audio('sounds/ambient.mp3')
    };
    
    // Loop ambient sound
    gameState.soundEffects.ambient.loop = true;
    gameState.soundEffects.ambient.volume = 0.3;
}

// Room Generation
function generateRooms() {
    const roomLayouts = [
        { x: 100, y: 100, width: 200, height: 200 },
        { x: 300, y: 100, width: 200, height: 200 },
        { x: 100, y: 300, width: 200, height: 200 },
        { x: 300, y: 300, width: 200, height: 200 }
    ];

    const house = document.getElementById('house');
    roomLayouts.forEach((layout, index) => {
        const room = document.createElement('div');
        room.className = 'room';
        room.style.left = layout.x + 'px';
        room.style.top = layout.y + 'px';
        room.style.width = layout.width + 'px';
        room.style.height = layout.height + 'px';
        house.appendChild(room);
        gameState.rooms.push(layout);
    });
}

// Interactive Objects
function generateInteractiveObjects() {
    const keyPositions = getRandomKeyPositions();
    keyPositions.forEach(pos => {
        createKey(pos.x, pos.y);
    });
    createExitDoor();
}

function getRandomKeyPositions() {
    const positions = [];
    const rooms = [...gameState.rooms];
    for (let i = 0; i < 3; i++) {
        const roomIndex = Math.floor(Math.random() * rooms.length);
        const room = rooms[roomIndex];
        positions.push({
            x: room.x + Math.random() * (room.width - 20),
            y: room.y + Math.random() * (room.height - 20)
        });
        rooms.splice(roomIndex, 1);
    }
    return positions;
}

function createKey(x, y) {
    const key = document.createElement('div');
    key.className = 'interactive key';
    key.style.left = x + 'px';
    key.style.top = y + 'px';
    gameContainer.appendChild(key);
    
    key.addEventListener('click', () => collectKey(key));
    gameState.interactiveObjects.push({ element: key, type: 'key', x, y });
}

function createExitDoor() {
    const lastRoom = gameState.rooms[gameState.rooms.length - 1];
    const door = document.createElement('div');
    door.className = 'interactive door';
    door.style.left = (lastRoom.x + lastRoom.width - 40) + 'px';
    door.style.top = (lastRoom.y + lastRoom.height - 60) + 'px';
    gameContainer.appendChild(door);
    
    door.addEventListener('click', tryEscape);
    gameState.interactiveObjects.push({ element: door, type: 'door', x: lastRoom.x + lastRoom.width - 40, y: lastRoom.y + lastRoom.height - 60 });
}

// Player Movement
function initializePlayerMovement() {
    const startRoom = gameState.rooms[0];
    gameState.playerPosition = {
        x: startRoom.x + 50,
        y: startRoom.y + 50
    };
    updatePlayerPosition();

    document.addEventListener('keydown', handlePlayerMovement);
}

function handlePlayerMovement(e) {
    if (!gameState.isPlaying) return;

    const speed = 5;
    const newPosition = { ...gameState.playerPosition };

    switch(e.key) {
        case 'ArrowUp':
        case 'w':
            newPosition.y -= speed;
            break;
        case 'ArrowDown':
        case 's':
            newPosition.y += speed;
            break;
        case 'ArrowLeft':
        case 'a':
            newPosition.x -= speed;
            break;
        case 'ArrowRight':
        case 'd':
            newPosition.x += speed;
            break;
    }

    if (isValidPosition(newPosition)) {
        gameState.playerPosition = newPosition;
        updatePlayerPosition();
        gameState.soundEffects.footstep.play();
        checkGrannyProximity();
    }
}

function isValidPosition(position) {
    return gameState.rooms.some(room => 
        position.x >= room.x &&
        position.x <= room.x + room.width - 30 &&
        position.y >= room.y &&
        position.y <= room.y + room.height - 30
    );
}

function updatePlayerPosition() {
    player.style.left = gameState.playerPosition.x + 'px';
    player.style.top = gameState.playerPosition.y + 'px';
}

// Granny AI
function initializeGranny() {
    const lastRoom = gameState.rooms[gameState.rooms.length - 1];
    gameState.grannyPosition = {
        x: lastRoom.x + lastRoom.width / 2,
        y: lastRoom.y + lastRoom.height / 2
    };
    updateGrannyPosition();
    startGrannyMovement();
}

function startGrannyMovement() {
    setInterval(() => {
        if (!gameState.isPlaying) return;
        
        const targetPosition = {
            x: gameState.playerPosition.x,
            y: gameState.playerPosition.y
        };

        const angle = Math.atan2(
            targetPosition.y - gameState.grannyPosition.y,
            targetPosition.x - gameState.grannyPosition.x
        );

        const speed = 2;
        gameState.grannyPosition.x += Math.cos(angle) * speed;
        gameState.grannyPosition.y += Math.sin(angle) * speed;

        updateGrannyPosition();
        checkGrannyProximity();
    }, 50);
}

function updateGrannyPosition() {
    granny.style.left = gameState.grannyPosition.x + 'px';
    granny.style.top = gameState.grannyPosition.y + 'px';
}

function checkGrannyProximity() {
    const distance = Math.hypot(
        gameState.playerPosition.x - gameState.grannyPosition.x,
        gameState.playerPosition.y - gameState.grannyPosition.y
    );

    if (distance < 50) {
        gameOver();
    }
}

// Game Events
function collectKey(keyElement) {
    gameState.keysCollected++;
    keyCountDisplay.textContent = gameState.keysCollected;
    keyElement.remove();
    gameState.soundEffects.keyPickup.play();
    
    if (gameState.keysCollected === 3) {
        document.querySelector('.door').style.backgroundColor = '#4a8';
    }
}

function tryEscape() {
    if (gameState.keysCollected === 3) {
        gameState.soundEffects.doorCreak.play();
        setTimeout(() => {
            alert('Congratulations! You escaped!');
            resetGame();
        }, 500);
    } else {
        gameState.soundEffects.doorCreak.play();
        const keysNeeded = 3 - gameState.keysCollected;
        alert(`You need ${keysNeeded} more key${keysNeeded > 1 ? 's' : ''} to escape!`);
    }
}

function gameOver() {
    gameState.isPlaying = false;
    gameState.soundEffects.grannyScream.play();
    document.body.classList.add('red-flash');
    setTimeout(() => {
        document.body.classList.remove('red-flash');
        gameOverModal.show();
    }, 300);
}

// Game Control
function startGame() {
    gameState.isPlaying = true;
    gameState.keysCollected = 0;
    keyCountDisplay.textContent = '0';
    gameContainer.classList.remove('d-none');
    startModal.hide();
    
    // Clear previous game state
    document.getElementById('house').innerHTML = '';
    gameState.rooms = [];
    gameState.interactiveObjects.forEach(obj => obj.element.remove());
    gameState.interactiveObjects = [];
    
    // Initialize game elements
    generateRooms();
    generateInteractiveObjects();
    initializePlayerMovement();
    initializeGranny();
    
    // Start ambient sound
    gameState.soundEffects.ambient.play();
}

function resetGame() {
    gameState.isPlaying = false;
    gameContainer.classList.add('d-none');
    startModal.show();
    gameState.soundEffects.ambient.pause();
    gameState.soundEffects.ambient.currentTime = 0;
}

// Event Listeners
document.getElementById('startGame').addEventListener('click', startGame);
document.getElementById('instructions').addEventListener('click', () => instructionsModal.show());
document.getElementById('exitGame').addEventListener('click', () => window.close());
document.getElementById('restartGame').addEventListener('click', startGame);

// Initialize game
window.addEventListener('load', () => {
    loadSounds();
    startModal.show();
}); 