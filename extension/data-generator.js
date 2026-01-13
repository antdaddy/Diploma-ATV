// Генератор тестовых данных на русском языке

const RUSSIAN_FIRST_NAMES = [
    'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артем', 'Илья',
    'Кирилл', 'Михаил', 'Никита', 'Матвей', 'Роман', 'Егор', 'Арсений', 'Иван',
    'Денис', 'Евгений', 'Данил', 'Тимофей', 'Владислав', 'Игорь', 'Владимир', 'Павел',
    'Анна', 'Мария', 'Елена', 'Наталья', 'Ольга', 'Татьяна', 'Ирина', 'Екатерина',
    'Светлана', 'Юлия', 'Анастасия', 'Дарья', 'Евгения', 'Ксения', 'Анжела', 'Полина'
];

const RUSSIAN_LAST_NAMES = [
    'Иванов', 'Петров', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов',
    'Михайлов', 'Новikov', 'Федоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семенов',
    'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев', 'Орлов', 'Андреев', 'Макаров',
    'Никитин', 'Захаров', 'Зайцев', 'Соловьев', 'Борисов', 'Яковлев', 'Григорьев', 'Романов'
];

const RUSSIAN_MIDDLE_NAMES = [
    'Александрович', 'Дмитриевич', 'Максимович', 'Сергеевич', 'Андреевич', 'Алексеевич',
    'Артемович', 'Ильич', 'Кириллович', 'Михайлович', 'Никитич', 'Матвеевич', 'Романович',
    'Александровна', 'Дмитриевна', 'Максимовна', 'Сергеевна', 'Андреевна', 'Алексеевна',
    'Артемовна', 'Ильинична', 'Кирилловна', 'Михайловна', 'Никитична', 'Матвеевна', 'Романовна'
];

const RUSSIAN_CITIES = [
    'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
    'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону',
    'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград'
];

const RUSSIAN_STREETS = [
    'Ленина', 'Советская', 'Мира', 'Победы', 'Центральная', 'Новая', 'Школьная',
    'Садовая', 'Лесная', 'Набережная', 'Комсомольская', 'Молодежная', 'Октябрьская'
];

const RUSSIAN_COMPANIES = [
    'ООО "ТехноСервис"', 'ИП Иванов', 'ООО "Торговый дом"', 'ЗАО "СтройМаш"',
    'ООО "Инновации"', 'АО "ЭнергоПром"', 'ООО "МеталлСервис"', 'ИП Петрова',
    'ООО "Логистика+"', 'ООО "Дизайн Студия"'
];

class RussianDataGenerator {
    static randomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    static generateFIO() {
        const firstName = this.randomElement(RUSSIAN_FIRST_NAMES);
        const lastName = this.randomElement(RUSSIAN_LAST_NAMES);
        const middleName = this.randomElement(RUSSIAN_MIDDLE_NAMES);
        return `${lastName} ${firstName} ${middleName}`;
    }
    
    static generateFirstName() {
        return this.randomElement(RUSSIAN_FIRST_NAMES);
    }
    
    static generateLastName() {
        return this.randomElement(RUSSIAN_LAST_NAMES);
    }
    
    static generatePhone() {
        const codes = ['903', '905', '916', '925', '999', '495', '812', '343'];
        const code = this.randomElement(codes);
        const num1 = Math.floor(Math.random() * 9000) + 1000;
        const num2 = Math.floor(Math.random() * 9000) + 1000;
        return `+7 (${code}) ${num1}-${num2}`;
    }
    
    static generateEmail(domain = 'temp.atv.local') {
        const names = ['user', 'test', 'demo', 'temp', 'mail', 'email'];
        const name = this.randomElement(names);
        const num = Math.floor(Math.random() * 10000);
        return `${name}${num}@${domain}`;
    }
    
    static generateAddress() {
        const city = this.randomElement(RUSSIAN_CITIES);
        const street = this.randomElement(RUSSIAN_STREETS);
        const house = Math.floor(Math.random() * 200) + 1;
        const flat = Math.floor(Math.random() * 150) + 1;
        return `г. ${city}, ул. ${street}, д. ${house}, кв. ${flat}`;
    }
    
    static generateCompany() {
        return this.randomElement(RUSSIAN_COMPANIES);
    }
    
    static generateDateOfBirth() {
        const year = 1970 + Math.floor(Math.random() * 40);
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        return `${day}.${month}.${year}`;
    }
    
    static generatePassport() {
        const series = Math.floor(Math.random() * 9000) + 1000;
        const number = Math.floor(Math.random() * 900000) + 100000;
        return `${series} ${number}`;
    }
    
    static generateFullData() {
        const firstName = this.generateFirstName();
        const lastName = this.generateLastName();
        
        return {
            fio: this.generateFIO(),
            firstName: firstName,
            lastName: lastName,
            phone: this.generatePhone(),
            email: this.generateEmail(),
            address: this.generateAddress(),
            company: this.generateCompany(),
            dateOfBirth: this.generateDateOfBirth(),
            passport: this.generatePassport()
        };
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RussianDataGenerator;
}