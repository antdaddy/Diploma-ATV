// sidepanel.js - Панель для просмотра входящих писем

const API_URL = 'http://localhost:8000/api/v1';

class SidePanel {
    constructor() {
        this.currentEmailAccount = null;
        this.wsConnection = null;
        this.init();
    }
    
    async init() {
        // Загружаем сохраненный email
        await this.loadEmailAccount();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        // Загружаем письма
        if (this.currentEmailAccount) {
            await this.loadMessages();
            this.connectWebSocket();
        } else {
            this.showNoEmailMessage();
        }
    }
    
    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadMessages();
        });
        
        // Обновляем письма каждые 30 секунд
        setInterval(() => {
            if (this.currentEmailAccount) {
                this.loadMessages();
            }
        }, 30000);
    }
    
    async loadEmailAccount() {
        try {
            const result = await chrome.storage.local.get(['emailAccount']);
            if (result.emailAccount) {
                this.currentEmailAccount = result.emailAccount;
                return true;
            }
        } catch (error) {
            console.error('Ошибка загрузки email:', error);
        }
        return false;
    }
    
    async loadMessages() {
        if (!this.currentEmailAccount) {
            this.showNoEmailMessage();
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch(`${API_URL}/email/${this.currentEmailAccount.id}/messages`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const messages = await response.json();
            this.displayMessages(messages);
            
        } catch (error) {
            console.error('Ошибка загрузки писем:', error);
            this.showError('Не удалось загрузить письма. Проверьте подключение к серверу.');
        }
    }
    
    displayMessages(messages) {
        const container = document.getElementById('messagesContainer');
        
        if (!messages || messages.length === 0) {
            container.innerHTML = `
                <div class="no-email">
                    <p>Писем пока нет</p>
                    <p style="font-size: 12px; color: #999; margin-top: 10px;">
                        Отправьте форму с вашим временным email: <br>
                        <strong>${this.currentEmailAccount.email}</strong>
                    </p>
                </div>
            `;
            return;
        }
        
        // Сортируем письма по дате (новые сверху)
        messages.sort((a, b) => new Date(b.received_at) - new Date(a.received_at));
        
        container.innerHTML = messages.map(msg => {
            const date = new Date(msg.received_at);
            const timeStr = date.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            // Создаем предпросмотр текста
            let preview = '';
            if (msg.body_text) {
                preview = msg.body_text.substring(0, 100);
                if (msg.body_text.length > 100) preview += '...';
            } else if (msg.body_html) {
                // Удаляем HTML теги для предпросмотра
                preview = msg.body_html.replace(/<[^>]*>/g, '').substring(0, 100);
                if (msg.body_html.length > 100) preview += '...';
            }
            
            return `
                <div class="message-item">
                    <div class="message-header">
                        <div class="message-subject">${msg.subject || '(Без темы)'}</div>
                        <div class="message-time">${timeStr}</div>
                    </div>
                    <div class="message-from">От: ${msg.sender}</div>
                    ${preview ? `<div class="message-preview">${preview}</div>` : ''}
                    ${msg.has_attachments ? '<div class="attachments">Есть вложения</div>' : ''}
                </div>
            `;
        }).join('');
    }
    
    connectWebSocket() {
        if (!this.currentEmailAccount || this.wsConnection) {
            return;
        }
        
        const wsUrl = `ws://localhost:8000/api/v1/ws/${this.currentEmailAccount.id}`;
        
        try {
            this.wsConnection = new WebSocket(wsUrl);
            
            this.wsConnection.onopen = () => {
                console.log('WebSocket подключен для side panel');
            };
            
            this.wsConnection.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'new_message') {
                        // Обновляем список писем при получении нового
                        this.loadMessages();
                    }
                } catch (e) {
                    console.error('Ошибка парсинга WebSocket сообщения:', e);
                }
            };
            
            this.wsConnection.onerror = (error) => {
                console.error('WebSocket ошибка:', error);
            };
            
            this.wsConnection.onclose = (event) => {
                console.log('WebSocket отключен, код:', event.code);
                this.wsConnection = null;
                
                // Переподключение через 5 секунд
                setTimeout(() => {
                    if (this.currentEmailAccount) {
                        this.connectWebSocket();
                    }
                }, 5000);
            };
            
        } catch (error) {
            console.error('Ошибка создания WebSocket:', error);
        }
    }
    
    showNoEmailMessage() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = `
            <div class="no-email">
                <h3>Временный email не создан</h3>
                <p>Создайте временный email в основном окне расширения</p>
                <button id="openPopupBtn">Открыть расширение</button>
            </div>
        `;
        
        // Добавляем обработчик для кнопки
        document.getElementById('openPopupBtn')?.addEventListener('click', () => {
            chrome.windows.getCurrent(window => {
                chrome.action.openPopup();
            });
        });
    }
    
    showLoading() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '<div class="loading">Загрузка писем...</div>';
    }
    
    showError(message) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = `
            <div class="error">
                <p>${message}</p>
                <button id="retryBtn" style="
                    margin-top: 10px;
                    padding: 5px 10px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Повторить</button>
            </div>
        `;
        
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            this.loadMessages();
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new SidePanel();
});