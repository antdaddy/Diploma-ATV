// Content Script для автоматического заполнения веб-форм

// Словарь соответствий для умного определения полей
const FIELD_MAPPINGS = {
    // ФИО и имена
    fio: ['fio', 'fullname', 'фио', 'полное имя', 'name', 'имя'],
    firstName: ['firstname', 'first-name', 'имя', 'name', 'given-name'],
    lastName: ['lastname', 'last-name', 'фамилия', 'surname', 'family-name'],
    
    // Контакты
    phone: ['phone', 'tel', 'телефон', 'mobile', 'phone-number'],
    email: ['email', 'e-mail', 'mail', 'почта', 'email-address'],
    
    // Адрес
    address: ['address', 'адрес', 'street', 'улица', 'location'],
    city: ['city', 'город'],
    street: ['street', 'улица'],
    house: ['house', 'дом', 'building'],
    flat: ['flat', 'apartment', 'квартира'],
    
    // Дополнительно
    company: ['company', 'организация', 'organization', 'employer'],
    dateOfBirth: ['birth', 'birthday', 'дата рождения', 'dob', 'birth-date'],
    passport: ['passport', 'паспорт', 'passport-number']
};

// Функция для определения типа поля по его атрибутам
function detectFieldType(field) {
    const id = (field.id || '').toLowerCase();
    const name = (field.name || '').toLowerCase();
    const placeholder = (field.placeholder || '').toLowerCase();
    const label = getFieldLabel(field).toLowerCase();
    
    const allAttrs = [id, name, placeholder, label].join(' ');
    
    // Проверяем каждое поле из маппинга
    for (const [key, patterns] of Object.entries(FIELD_MAPPINGS)) {
        for (const pattern of patterns) {
            if (allAttrs.includes(pattern)) {
                return key;
            }
        }
    }
    
    // Определение по типу input
    if (field.type === 'email') return 'email';
    if (field.type === 'tel') return 'phone';
    if (field.type === 'date') return 'dateOfBirth';
    
    return null;
}

// Получение label для поля
function getFieldLabel(field) {
    // Ищем связанный label
    if (field.id) {
        const label = document.querySelector(`label[for="${field.id}"]`);
        if (label) return label.textContent;
    }
    
    // Ищем родительский label
    let parent = field.parentElement;
    while (parent && parent.tagName !== 'BODY') {
        if (parent.tagName === 'LABEL') {
            return parent.textContent;
        }
        parent = parent.parentElement;
    }
    
    return '';
}

// Заполнение одного поля
function fillField(field, value) {
    if (!field || !value) return false;
    
    // Обработка разных типов полей
    const tagName = field.tagName.toLowerCase();
    
    if (tagName === 'input') {
        if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = true;
        } else {
            field.value = value;
            // Триггерим события для реактивных фреймворков
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
    } else if (tagName === 'textarea') {
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (tagName === 'select') {
        field.value = value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    return true;
}

// Основная функция заполнения формы
function fillForm(testData) {
    const forms = document.querySelectorAll('form');
    if (forms.length === 0) {
        return { success: false, message: 'На странице не найдено форм' };
    }
    
    let filledCount = 0;
    let totalFields = 0;
    
    // Обрабатываем все формы на странице
    forms.forEach(form => {
        const fields = form.querySelectorAll('input, textarea, select');
        totalFields += fields.length;
        
        fields.forEach(field => {
            // Пропускаем скрытые поля и кнопки
            if (field.type === 'hidden' || 
                field.type === 'submit' || 
                field.type === 'button' ||
                field.type === 'reset') {
                return;
            }
            
            const fieldType = detectFieldType(field);
            if (!fieldType) return;
            
            let value = null;
            
            // Маппинг значений
            switch (fieldType) {
                case 'fio':
                    value = testData.fio;
                    break;
                case 'firstName':
                    value = testData.firstName;
                    break;
                case 'lastName':
                    value = testData.lastName;
                    break;
                case 'phone':
                    value = testData.phone;
                    break;
                case 'email':
                    value = testData.email;
                    break;
                case 'address':
                    value = testData.address;
                    break;
                case 'company':
                    value = testData.company;
                    break;
                case 'dateOfBirth':
                    value = testData.dateOfBirth;
                    break;
                case 'passport':
                    value = testData.passport;
                    break;
            }
            
            if (value && fillField(field, value)) {
                filledCount++;
            }
        });
    });
    
    // Если не нашли форму, пробуем заполнить поля напрямую
    if (filledCount === 0) {
        const allFields = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        allFields.forEach(field => {
            const fieldType = detectFieldType(field);
            if (fieldType && testData[fieldType]) {
                if (fillField(field, testData[fieldType])) {
                    filledCount++;
                    totalFields++;
                }
            }
        });
    }
    
    return {
        success: filledCount > 0,
        message: `Заполнено полей: ${filledCount} из ${totalFields}`,
        filledCount,
        totalFields
    };
}

// Слушатель сообщений от popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fillForm') {
        const result = fillForm(request.data);
        sendResponse(result);
        return true; // Асинхронный ответ
    }
    
    if (request.action === 'detectForm') {
        const forms = document.querySelectorAll('form');
        const fields = Array.from(document.querySelectorAll('input, textarea, select'))
            .filter(f => f.type !== 'hidden' && f.type !== 'submit' && f.type !== 'button')
            .map(f => ({
                type: detectFieldType(f),
                id: f.id,
                name: f.name,
                placeholder: f.placeholder,
                tagName: f.tagName
            }));
        
        sendResponse({
            formsCount: forms.length,
            fields: fields
        });
        return true;
    }
});

// Добавляем визуальный индикатор заполнения
function highlightFilledFields() {
    const filled = document.querySelectorAll('[data-atv-filled="true"]');
    filled.forEach(field => {
        field.style.backgroundColor = '#e7f3ff';
        field.style.borderColor = '#2196F3';
    });
}