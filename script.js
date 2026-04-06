// --- CONFIGURATION ---
const MAX_SCREENS = 3;
const DEFAULT_COLS = 12;

// --- STATE ---
let currentScreenIndex = 0;
let grids = []; // Will hold the Gridstack instances
let screenNames = ["Screen 1", "Screen 2", "Screen 3"];

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    initWorkspace();
    setupEventListeners();
});

function initWorkspace() {
    const tabsContainer = document.getElementById("screen-tabs");
    const workspace = document.getElementById("workspace");

    // Generate exactly 3 screens based on our V1 limits
    for (let i = 0; i < MAX_SCREENS; i++) {
        // 1. Create Tab
        const tab = document.createElement("button");
        tab.className = `tab ${i === 0 ? "active" : ""}`;
        tab.innerText = screenNames[i];
        tab.dataset.index = i;
        
        // Tab Events
        tab.addEventListener("click", () => switchScreen(i));
        tab.addEventListener("dblclick", () => renameScreen(i, tab));
        
        tabsContainer.appendChild(tab);

        // 2. Create Grid Container
        const gridWrapper = document.createElement("div");
        gridWrapper.className = `grid-screen ${i === 0 ? "active" : ""}`;
        gridWrapper.id = `grid-screen-${i}`;
        
        const gridDiv = document.createElement("div");
        gridDiv.className = "grid-stack";
        gridWrapper.appendChild(gridDiv);
        workspace.appendChild(gridWrapper);

        // 3. Initialize Gridstack on this container
        const grid = GridStack.init({
            column: DEFAULT_COLS,
            cellHeight: '80px',
            disableDrag: true, // Start in locked/view mode
            disableResize: true,
            margin: 10
        }, gridDiv);

        grids.push(grid);
    }
}

// --- SCREEN MANAGEMENT ---
function switchScreen(index) {
    // Update active class on tabs
    document.querySelectorAll(".tab").forEach((tab, i) => {
        tab.classList.toggle("active", i === index);
    });

    // Update active class on grid containers
    document.querySelectorAll(".grid-screen").forEach((screen, i) => {
        screen.classList.toggle("active", i === index);
    });

    currentScreenIndex = index;
}

function renameScreen(index, tabElement) {
    const newName = prompt("Rename screen to:", screenNames[index]);
    if (newName !== null && newName.trim() !== "") {
        screenNames[index] = newName.trim();
        tabElement.innerText = screenNames[index];
        // TODO: Save to localStorage
    }
}

// --- EVENT LISTENERS (UI Controls) ---
function setupEventListeners() {
    // Edit Mode Toggle
    const editBtn = document.getElementById("btn-edit-mode");
    let isEditMode = false;
    
    editBtn.addEventListener("click", () => {
        isEditMode = !isEditMode;
        editBtn.innerText = `Edit Mode: ${isEditMode ? "ON" : "OFF"}`;
        
        grids.forEach(grid => {
            grid.enableMove(isEditMode);
            grid.enableResize(isEditMode);
        });
    });

    // Add Widget Dropdown
    const addWidgetSelect = document.getElementById("add-widget-select");
    addWidgetSelect.addEventListener("change", (e) => {
        const widgetType = e.target.value;
        if (widgetType) {
            addWidgetToCurrentScreen(widgetType);
            e.target.value = ""; // Reset dropdown
        }
    });

    // Grid Size Changer (with constraint logic placeholder)
    const gridColsInput = document.getElementById("grid-cols");
    gridColsInput.addEventListener("change", (e) => {
        let newCols = parseInt(e.target.value);
        if (newCols < 2) newCols = 2;
        if (newCols > 50) newCols = 50;
        e.target.value = newCols;
        
        // TODO: Implement the check to ensure no widget is wider than newCols
        // If check passes: grids.forEach(g => g.column(newCols));
        // If check fails: alert user
    });
}

// --- UPDATED WIDGET ADDER ---
function addWidgetToCurrentScreen(type) {
    const grid = grids[currentScreenIndex];
    let widgetContent = "";
    let w = 2, h = 2;

    switch(type) {
        case "clock":
            widgetContent = `
                <div class="grid-stack-item-content widget-container clock-widget">
                    <div class="time-display">--:--</div>
                </div>`;
            w = 3; h = 2;
            break;
        case "stopwatch":
            widgetContent = `
                <div class="grid-stack-item-content widget-container stopwatch-widget">
                    <div class="time-display">00:00.0</div>
                    <div class="widget-controls">
                        <button class="btn btn-start">Start</button>
                        <button class="btn btn-reset">Reset</button>
                    </div>
                </div>`;
            w = 3; h = 2;
            break;
        case "timer":
            widgetContent = `
                <div class="grid-stack-item-content widget-container timer-widget">
                    <div class="timer-setup">
                        <input type="number" class="time-input min-input" placeholder="Min" min="0"> : 
                        <input type="number" class="time-input sec-input" placeholder="Sec" min="0" max="59">
                    </div>
                    <div class="time-display" style="display: none;">00:00</div>
                    <div class="widget-controls">
                        <button class="btn btn-start">Start</button>
                        <button class="btn btn-reset">Reset</button>
                    </div>
                </div>`;
            w = 3; h = 2;
            break;
        case "music":
            widgetContent = `<div class="grid-stack-item-content">Music Player (Coming Soon)</div>`;
            w = 4; h = 2;
            break;
    }

    // Add the widget and get the DOM element back
    const widgetEl = grid.addWidget({w: w, h: h, content: widgetContent, autoPosition: true});

    // Initialize the specific logic for the widget we just added
    if (type === "clock") initClock(widgetEl);
    if (type === "stopwatch") initStopwatch(widgetEl);
    if (type === "timer") initTimer(widgetEl);
}

// ==========================================
// --- WIDGET LOGIC (Treated as sub-modules) ---
// ==========================================

// --- CLOCK LOGIC ---
function initClock(widgetEl) {
    const display = widgetEl.querySelector(".time-display");
    
    function updateTime() {
        const now = new Date();
        display.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    updateTime(); // Run immediately
    setInterval(updateTime, 1000); // Update every second
}

// --- STOPWATCH LOGIC ---
function initStopwatch(widgetEl) {
    const display = widgetEl.querySelector(".time-display");
    const startBtn = widgetEl.querySelector(".btn-start");
    const resetBtn = widgetEl.querySelector(".btn-reset");
    
    let interval;
    let startTime;
    let elapsedTime = 0;
    let isRunning = false;

    function updateDisplay() {
        const time = new Date(elapsedTime);
        const mins = time.getUTCMinutes().toString().padStart(2, '0');
        const secs = time.getUTCSeconds().toString().padStart(2, '0');
        const tenths = Math.floor(time.getUTCMilliseconds() / 100);
        display.innerText = `${mins}:${secs}.${tenths}`;
    }

    startBtn.addEventListener("click", () => {
        if (isRunning) {
            clearInterval(interval);
            startBtn.innerText = "Start";
        } else {
            startTime = Date.now() - elapsedTime;
            interval = setInterval(() => {
                elapsedTime = Date.now() - startTime;
                updateDisplay();
            }, 100);
            startBtn.innerText = "Pause";
        }
        isRunning = !isRunning;
    });

    resetBtn.addEventListener("click", () => {
        clearInterval(interval);
        isRunning = false;
        elapsedTime = 0;
        updateDisplay();
        startBtn.innerText = "Start";
    });
}

// --- TIMER LOGIC ---
function initTimer(widgetEl) {
    const display = widgetEl.querySelector(".time-display");
    const setupDiv = widgetEl.querySelector(".timer-setup");
    const minInput = widgetEl.querySelector(".min-input");
    const secInput = widgetEl.querySelector(".sec-input");
    const startBtn = widgetEl.querySelector(".btn-start");
    const resetBtn = widgetEl.querySelector(".btn-reset");
    
    let interval;
    let remainingSeconds = 0;
    let isRunning = false;

    function updateDisplay() {
        const mins = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
        const secs = (remainingSeconds % 60).toString().padStart(2, '0');
        display.innerText = `${mins}:${secs}`;
    }

    startBtn.addEventListener("click", () => {
        if (isRunning) {
            clearInterval(interval);
            startBtn.innerText = "Resume";
            isRunning = false;
        } else {
            // If starting from fresh setup
            if (setupDiv.style.display !== "none") {
                const mins = parseInt(minInput.value) || 0;
                const secs = parseInt(secInput.value) || 0;
                remainingSeconds = (mins * 60) + secs;
                
                if (remainingSeconds === 0) return; // Don't start if 0
                
                setupDiv.style.display = "none";
                display.style.display = "block";
            }

            interval = setInterval(() => {
                if (remainingSeconds > 0) {
                    remainingSeconds--;
                    updateDisplay();
                } else {
                    clearInterval(interval);
                    startBtn.innerText = "Start";
                    isRunning = false;
                    display.innerText = "DONE!";
                }
            }, 1000);
            
            startBtn.innerText = "Pause";
            isRunning = true;
        }
    });

    resetBtn.addEventListener("click", () => {
        clearInterval(interval);
        isRunning = false;
        remainingSeconds = 0;
        
        setupDiv.style.display = "block";
        display.style.display = "none";
        startBtn.innerText = "Start";
        
        minInput.value = "";
        secInput.value = "";
    });
}