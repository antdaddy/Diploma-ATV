// API URL (для разработки)
const API_URL = 'http://localhost:8000/api/v1';

let currentEmailAccount = null;
let wsConnection = null;
let testData = null;

// Инициализация при загрузке popup
document.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
    setupEventListeners();
    setupTabs();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Убираем активный класс у всех
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // Добавляем активный класс выбранной вкладке
            tab.classList.add('active');
            document.getElementById(targetTab + 'Tab').classList.add('active');
            
            // При открытии вкладки "Письма" загружаем письма
            if (targetTab === 'messages') {
                loadMessages();
            }
        });
    });
}

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

async function generateTestData() {
    // Если есть созданный email, используем его, иначе генерируем новый
    let emailToUse = null;
    
    if (currentEmailAccount) {
        emailToUse = currentEmailAccount.email;
    } else {
        // Сначала создаем email
        try {
            const response = await fetch(`${API_URL}/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                currentEmailAccount = await response.json();
                emailToUse = currentEmailAccount.email;
                chrome.storage.local.set({ emailAccount: currentEmailAccount });
                displayEmail(currentEmailAccount);
                connectWebSocket(currentEmailAccount.id);
            }
        } catch (error) {
            console.error('Ошибка создания email:', error);
            // Продолжаем с генерацией данных без email
        }
    }
    
    // Загружаем генератор данных
    const generator = new RussianDataGenerator();
    testData = generator.generateFullData(emailToUse);
    
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
            <strong>Имя:</strong> ${data.firstName}<br>
            <strong>Фамилия:</strong> ${data.lastName}<br>
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
        
        // Автоматически генерируем тестовые данные с созданным email
        const generator = new RussianDataGenerator();
        testData = generator.generateFullData(currentEmailAccount.email);
        chrome.storage.local.set({ testData });
        displayTestData(testData);
        
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
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        // Уже подключено
        return;
    }
    
    if (wsConnection) {
        wsConnection.close();
    }
    
    const wsUrl = `ws://localhost:8000/api/v1/ws/${emailId}`;
    const status = document.getElementById('emailStatus');
    
    try {
        wsConnection = new WebSocket(wsUrl);
        
        wsConnection.onopen = () => {
            status.textContent = 'Подключено';
            status.className = 'status connected';
            loadMessages(); // Загружаем существующие письма
        };
        
        wsConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'new_message') {
                    loadMessages(); // Обновляем список при новом письме
                }
            } catch (e) {
                console.error('Ошибка парсинга WebSocket сообщения:', e);
            }
        };
        
        wsConnection.onerror = (error) => {
            // Не выводим ошибку в консоль, если это просто проблема подключения
            // WebSocket ошибки часто возникают при недоступности сервера
            if (wsConnection.readyState === WebSocket.CONNECTING || wsConnection.readyState === WebSocket.CLOSED) {
                // Сервер недоступен, это нормально если он не запущен
                status.textContent = 'Сервер недоступен';
            } else {
                status.textContent = 'Ошибка подключения';
            }
            status.className = 'status disconnected';
        };
        
        wsConnection.onclose = (event) => {
            status.textContent = 'Отключено';
            status.className = 'status disconnected';
            
            // Автоматическое переподключение только если это не было намеренное закрытие
            if (event.code !== 1000 && currentEmailAccount) {
                // Переподключение через 3 секунды
                setTimeout(() => {
                    if (currentEmailAccount) {
                        connectWebSocket(currentEmailAccount.id);
                    }
                }, 3000);
            }
        };
    } catch (error) {
        status.textContent = 'Ошибка создания подключения';
        status.className = 'status disconnected';
    }
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
    
    try {
        // Отправляем сообщение content script для заполнения формы
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            alert('Не удалось получить информацию о текущей вкладке');
            return;
        }
        
        // Проверяем, что это не системная страница (chrome://, edge:// и т.д.)
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
            alert('Расширение не может работать на системных страницах. Откройте обычную веб-страницу.');
            return;
        }
        
        chrome.tabs.sendMessage(tab.id, {
            action: 'fillForm',
            data: testData
        }, (response) => {
            if (chrome.runtime.lastError) {
                const errorMsg = chrome.runtime.lastError.message;
                if (errorMsg.includes('Could not establish connection')) {
                    alert('Не удалось подключиться к странице. Попробуйте обновить страницу и повторить попытку.');
                } else {
                    alert('Ошибка заполнения формы: ' + errorMsg);
                }
            } else if (response && response.success) {
                const filledCount = response.filledCount || 0;
                const totalFields = response.totalFields || 0;
                alert(`Форма успешно заполнена!\nЗаполнено полей: ${filledCount} из ${totalFields}`);
            } else {
                const message = response?.message || 'Не удалось заполнить форму';
                alert(message);
            }
        });
    } catch (error) {
        console.error('Ошибка при заполнении формы:', error);
        alert('Произошла ошибка: ' + error.message);
    }
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
    document.getElementById('openSidePanel')?.addEventListener('click', openSidePanel);
}


async function openSidePanel() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab) {
            await chrome.sidePanel.open({ tabId: tab.id });
        }
    } catch (error) {
        console.error('Ошибка открытия side panel:', error);
        alert('Не удалось открыть панель писем');
    }
}