// Content Script для автоматического заполнения веб-форм

// Словарь соответствий для умного определения полей
const FIELD_MAPPINGS = {
    // ФИО и имена - приоритет для отдельных полей
    firstName: ['firstname', 'first-name', 'first_name', 'имя', 'name', 'given-name', 'givenname', 'имя', 'first'],
    lastName: ['lastname', 'last-name', 'last_name', 'фамилия', 'surname', 'family-name', 'familyname', 'last', 'surname'],
    fio: ['fio', 'fullname', 'full-name', 'full_name', 'фио', 'полное имя', 'полноеимя'],
    
    // Контакты
    phone: ['phone', 'tel', 'telephone', 'телефон', 'mobile', 'phone-number', 'phone_number', 'mobile-phone', 'мобильный'],
    email: ['email', 'e-mail', 'e_mail', 'mail', 'почта', 'email-address', 'email_address', 'e-mail-address', 'почтовый'],
    
    // Адрес
    address: ['address', 'адрес', 'street', 'улица', 'location', 'адрес', 'street-address', 'street_address'],
    city: ['city', 'город', 'town', 'населенный пункт'],
    street: ['street', 'улица', 'street-name', 'street_name'],
    house: ['house', 'дом', 'building', 'house-number', 'house_number', 'номер дома'],
    flat: ['flat', 'apartment', 'квартира', 'apt', 'apartment-number', 'apartment_number', 'номер квартиры'],
    
    // Дополнительно
    company: ['company', 'организация', 'organization', 'employer', 'workplace', 'место работы', 'компания'],
    dateOfBirth: ['birth', 'birthday', 'дата рождения', 'dob', 'birth-date', 'birth_date', 'date-of-birth', 'date_of_birth', 'день рождения'],
    passport: ['passport', 'паспорт', 'passport-number', 'passport_number', 'серия паспорта'],
    
    // Дополнительные поля
    middleName: ['middlename', 'middle-name', 'middle_name', 'отчество', 'patronymic'],
    age: ['age', 'возраст'],
    zip: ['zip', 'postal', 'postcode', 'индекс', 'postal-code', 'postal_code', 'почтовый индекс'],
    country: ['country', 'страна'],
    region: ['region', 'область', 'регион']
};

// Функция для определения типа поля по его атрибутам
function detectFieldType(field) {
    const id = (field.id || '').toLowerCase();
    const name = (field.name || '').toLowerCase();
    const placeholder = (field.placeholder || '').toLowerCase();
    const label = getFieldLabel(field).toLowerCase();
    const className = (field.className || '').toLowerCase();
    
    const allAttrs = [id, name, placeholder, label, className].join(' ');
    
    // Сначала проверяем приоритетные поля (firstName, lastName) перед fio
    const priorityFields = ['firstName', 'lastName', 'email', 'phone'];
    for (const key of priorityFields) {
        const patterns = FIELD_MAPPINGS[key] || [];
        for (const pattern of patterns) {
            if (allAttrs.includes(pattern)) {
                return key;
            }
        }
    }
    
    // Затем проверяем остальные поля
    for (const [key, patterns] of Object.entries(FIELD_MAPPINGS)) {
        if (priorityFields.includes(key)) continue; // Уже проверили
        
        for (const pattern of patterns) {
            if (allAttrs.includes(pattern)) {
                return key;
            }
        }
    }
    
    // Определение по типу input (только если не определили выше)
    if (field.type === 'email' && !allAttrs.includes('email')) return 'email';
    if (field.type === 'tel' && !allAttrs.includes('phone') && !allAttrs.includes('tel')) return 'phone';
    if (field.type === 'date' && !allAttrs.includes('date') && !allAttrs.includes('birth')) return 'dateOfBirth';
    
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
    if (!field) return false;
    
    // Обработка разных типов полей
    const tagName = field.tagName.toLowerCase();
    
    if (tagName === 'input') {
        if (field.type === 'checkbox') {
            // Случайно выбираем чекбокс (50% вероятность)
            field.checked = Math.random() > 0.5;
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('click', { bubbles: true }));
            return true;
        } else if (field.type === 'radio') {
            // Выбираем radio кнопку
            field.checked = true;
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('click', { bubbles: true }));
            return true;
        } else if (value) {
            field.value = value;
            // Триггерим события для реактивных фреймворков
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
    } else if (tagName === 'textarea') {
        if (value) {
            field.value = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
    } else if (tagName === 'select') {
        // Для select выбираем случайный вариант
        const options = Array.from(field.options);
        if (options.length > 0) {
            // Пропускаем пустую опцию (если есть)
            const validOptions = options.filter(opt => opt.value && opt.value !== '' && !opt.disabled);
            if (validOptions.length > 0) {
                const randomOption = validOptions[Math.floor(Math.random() * validOptions.length)];
                field.value = randomOption.value;
                field.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
    }
    
    return false;
}

// Генератор случайных данных для неопределенных полей
function generateRandomValue(field) {
    const tagName = field.tagName.toLowerCase();
    const type = field.type || '';
    
    // Для email полей
    if (type === 'email' || field.type === 'email') {
        return `test${Math.floor(Math.random() * 10000)}@example.com`;
    }
    
    // Для телефонных полей
    if (type === 'tel' || field.type === 'tel') {
        return `+7 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
    }
    
    // Для числовых полей
    if (type === 'number' || type === 'range') {
        return Math.floor(Math.random() * 1000) + 1;
    }
    
    // Для дат
    if (type === 'date') {
        const year = 1980 + Math.floor(Math.random() * 30);
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Для текстовых полей
    const randomWords = ['тест', 'данные', 'пример', 'заполнение', 'автотест'];
    const word = randomWords[Math.floor(Math.random() * randomWords.length)];
    const num = Math.floor(Math.random() * 1000);
    return `${word}${num}`;
}

// Проверка, является ли поле частью формы
function isFieldInForm(field) {
    // Проверяем, находится ли поле внутри тега <form>
    let element = field;
    while (element && element !== document.body) {
        if (element.tagName === 'FORM') {
            return true;
        }
        element = element.parentElement;
    }
    return false;
}

// Проверка, является ли поле поиском или навигацией
function isSearchOrNavigationField(field) {
    const id = (field.id || '').toLowerCase();
    const name = (field.name || '').toLowerCase();
    const placeholder = (field.placeholder || '').toLowerCase();
    const className = (field.className || '').toLowerCase();
    const label = getFieldLabel(field).toLowerCase();
    
    const allAttrs = [id, name, placeholder, className, label].join(' ');
    
    // Исключаем поля поиска, навигации и другие системные поля
    const excludePatterns = [
        'search', 'поиск', 'q', 'query', 'nav', 'navigation',
        'menu', 'header', 'footer', 'sidebar', 'aside',
        'cookie', 'csrf', 'token', 'captcha', 'recaptcha'
    ];
    
    for (const pattern of excludePatterns) {
        if (allAttrs.includes(pattern)) {
            return true;
        }
    }
    
    // Проверяем, находится ли поле в header, nav, aside, footer
    let element = field;
    while (element && element !== document.body) {
        const tagName = element.tagName.toLowerCase();
        if (['header', 'nav', 'aside', 'footer'].includes(tagName)) {
            return true;
        }
        element = element.parentElement;
    }
    
    return false;
}

// Основная функция заполнения формы
function fillForm(testData) {
    // Сначала ищем все формы на странице
    const forms = document.querySelectorAll('form');
    
    let filledCount = 0;
    let totalFields = 0;
    let skippedFields = 0;
    let formsProcessed = 0;
    
    // Обрабатываем каждую форму отдельно
    forms.forEach(form => {
        formsProcessed++;
        const formFields = form.querySelectorAll('input, textarea, select');
        
        formFields.forEach(field => {
            // Пропускаем скрытые поля и кнопки
            if (field.type === 'hidden' || 
                field.type === 'submit' || 
                field.type === 'button' ||
                field.type === 'reset' ||
                field.disabled ||
                field.readOnly) {
                skippedFields++;
                return;
            }
            
            // Пропускаем поля поиска и навигации
            if (isSearchOrNavigationField(field)) {
                skippedFields++;
                return;
            }
            
            totalFields++;
            
            const fieldType = detectFieldType(field);
            let value = null;
            
            // Для чекбоксов и select не нужен value
            if (field.type === 'checkbox' || field.type === 'radio' || field.tagName === 'SELECT') {
                if (fillField(field, null)) {
                    filledCount++;
                }
            } else {
                // Если тип определен, используем данные из testData
                if (fieldType && testData[fieldType]) {
                    value = testData[fieldType];
                } else {
                    // Если тип не определен, генерируем случайное значение
                    value = generateRandomValue(field);
                }
                
                if (value && fillField(field, value)) {
                    filledCount++;
                }
            }
        });
    });
    
    // Если не нашли форм, но есть поля - пробуем найти поля, которые явно не являются поиском
    if (formsProcessed === 0) {
        const allFields = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select');
        
        allFields.forEach(field => {
            // Пропускаем поля поиска и навигации
            if (isSearchOrNavigationField(field) || field.disabled || field.readOnly) {
                skippedFields++;
                return;
            }
            
            totalFields++;
            
            const fieldType = detectFieldType(field);
            let value = null;
            
            // Для чекбоксов и select
            if (field.type === 'checkbox' || field.type === 'radio' || field.tagName === 'SELECT') {
                if (fillField(field, null)) {
                    filledCount++;
                }
            } else {
                if (fieldType && testData[fieldType]) {
                    value = testData[fieldType];
                } else {
                    value = generateRandomValue(field);
                }
                
                if (value && fillField(field, value)) {
                    filledCount++;
                }
            }
        });
    }
    
    // Если не нашли полей вообще
    if (totalFields === 0) {
        return {
            success: false,
            message: 'На странице не найдено форм или полей для заполнения',
            filledCount: 0,
            totalFields: 0
        };
    }
    
    return {
        success: filledCount > 0,
        message: `Заполнено полей: ${filledCount} из ${totalFields} (пропущено: ${skippedFields})`,
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
// Визуальный индикатор заполненных полей
function showFillNotification(count) {
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 999999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        ">
            ✅ Заполнено ${count} полей
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Горячая клавиша для заполнения (Ctrl+Shift+F)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        chrome.storage.local.get(['testData'], (result) => {
            if (result.testData) {
                const fillResult = fillForm(result.testData);
                if (fillResult.success) {
                    showFillNotification(fillResult.filledCount);
                }
            }
        });
    }
});

// Автоопределение форм при загрузке страницы
window.addEventListener('load', () => {
    const forms = document.querySelectorAll('form');
    if (forms.length > 0) {
        console.log(`ПМ АТВ: Найдено ${forms.length} форм на странице`);
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