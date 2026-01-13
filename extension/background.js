// Background Service Worker

// Установка расширения
chrome.runtime.onInstalled.addListener(() => {
    console.log('ПМ АТВ расширение установлено');
});

// Обработка сообщений между компонентами расширения
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ping') {
        sendResponse({ status: 'ok' });
    }
    return true;
});