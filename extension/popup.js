// API URL (для разработки)
const API_URL = 'http://localhost:8000/api/v1';

let currentEmailAccount = null;
let wsConnection = null;
let testData = null;

// Инициализация при загрузке popup
document.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('generateData').addEventListener('click', generateTestData);
    document.getElementById('createEmail').addEventListener('click', createTempEmail);
    document.getElementById('fillForm').addEventListener('click', fillFormOnPage);
    document.getElementById('clearData').addEventListener('click', clearAllData);
    document.getElementById('refreshMessages').addEventListener('click', loadMessages);
}

async function loadStoredData() {
    const result = await chrome.storage.local.get(['testData', 'emailAccount']);
    
    if (result.testData) {
        testData = result.testData;
        displayTestData(testData);
    }
    
    if (result.emailAccount) {
        currentEmailAccount = result.emailAccount;
        displayEmail(currentEmailAccount);
        connectWebSocket(currentEmailAccount.id);
    }
}

function generateTestData() {
    // Загружаем генератор данных
    const generator = new RussianDataGenerator();
    testData = generator.generateFullData();
    
    // Сохраняем в storage
    chrome.storage.local.set({ testData });
    
    // Отображаем
    displayTestData(testData);
}

function displayTestData(data) {
    const display = document.getElementById('testDataDisplay');
    display.classList.remove('hidden');
    display.innerHTML = `
        <div class="info-box">
            <strong>ФИО:</strong> ${data.fio}<br>
            <strong>Телефон:</strong> ${data.phone}<br>
            <strong>Email:</strong> ${data.email}<br>
            <strong>Адрес:</strong> ${data.address}<br>
            <strong>Компания:</strong> ${data.company}
        </div>
    `;
}

async function createTempEmail() {
    try {
        const response = await fetch(`${API_URL}/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка создания email');
        }
        
        currentEmailAccount = await response.json();
        
        // Сохраняем в storage
        chrome.storage.local.set({ emailAccount: currentEmailAccount });
        
        // Отображаем
        displayEmail(currentEmailAccount);
        
        // Подключаемся к WebSocket
        connectWebSocket(currentEmailAccount.id);
        
    } catch (error) {
        console.error('Ошибка создания email:', error);
        alert('Ошибка создания временного email: ' + error.message);
    }
}

function displayEmail(account) {
    const display = document.getElementById('emailDisplay');
    const status = document.getElementById('emailStatus');
    
    display.classList.remove('hidden');
    display.textContent = account.email;
    
    status.classList.remove('hidden');
    status.textContent = 'Подключение...';
    status.className = 'status disconnected';
}

function connectWebSocket(emailId) {
    if (wsConnection) {
        wsConnection.close();
    }
    
    const wsUrl = `ws://localhost:8000/api/v1/ws/${emailId}`;
    wsConnection = new WebSocket(wsUrl);
    
    const status = document.getElementById('emailStatus');
    
    wsConnection.onopen = () => {
        status.textContent = 'Подключено';
        status.className = 'status connected';
        loadMessages(); // Загружаем существующие письма
    };
    
    wsConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
            loadMessages(); // Обновляем список при новом письме
        }
    };
    
    wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        status.textContent = 'Ошибка подключения';
        status.className = 'status disconnected';
    };
    
    wsConnection.onclose = () => {
        status.textContent = 'Отключено';
        status.className = 'status disconnected';
    };
}

async function loadMessages() {
    if (!currentEmailAccount) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/email/${currentEmailAccount.id}/messages`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки писем');
        }
        
        const messages = await response.json();
        displayMessages(messages);
    } catch (error) {
        console.error('Ошибка загрузки писем:', error);
        document.getElementById('messagesList').innerHTML = '<div class="loading">Ошибка загрузки</div>';
    }
}

function displayMessages(messages) {
    const list = document.getElementById('messagesList');
    
    if (messages.length === 0) {
        list.innerHTML = '<div class="loading">Нет писем</div>';
        return;
    }
    
    list.innerHTML = messages.map(msg => `
        <div class="message-item">
            <div class="message-subject">${msg.subject || '(Без темы)'}</div>
            <div class="message-from">От: ${msg.sender}</div>
        </div>
    `).join('');
}

async function fillFormOnPage() {
    if (!testData) {
        alert('Сначала сгенерируйте тестовые данные!');
        return;
    }
    
    // Отправляем сообщение content script для заполнения формы
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, {
        action: 'fillForm',
        data: testData
    }, (response) => {
        if (chrome.runtime.lastError) {
            alert('Ошибка заполнения формы: ' + chrome.runtime.lastError.message);
        } else if (response && response.success) {
            alert('Форма успешно заполнена!');
        } else {
            alert('Не удалось заполнить форму');
        }
    });
}

function clearAllData() {
    chrome.storage.local.remove(['testData', 'emailAccount']);
    testData = null;
    currentEmailAccount = null;
    
    if (wsConnection) {
        wsConnection.close();
        wsConnection = null;
    }
    
    document.getElementById('testDataDisplay').classList.add('hidden');
    document.getElementById('emailDisplay').classList.add('hidden');
    document.getElementById('emailStatus').classList.add('hidden');
    document.getElementById('messagesList').innerHTML = '<div class="loading">Нет писем</div>';
}