# Cybersecurity Incidents Tracker — v0.4.0

Трекер кіберінцидентів: Express-бекенд (TypeScript) + ванільний TypeScript-фронтенд.

---

## Швидкий старт

### 1. Запуск бекенду

```bash
cd backend
npm install
npm run dev          # tsx watch — гарячий перезапуск
# → API на http://localhost:3000
# → Swagger: http://localhost:3000/api-docs
```

### 2. Компіляція та запуск фронтенду

```bash
cd frontend
npm install          # встановлює TypeScript
npx tsc              # компілює src/ → public/js/
npx http-server public -p 5500 --cors=false
# → UI на http://localhost:5500
```

> **Важливо:** фронтенд відкривати лише через `http://localhost:5500`, а не як `file://`.

---

## Структура проєкту

```
backend/
  src/
    app.ts                   ← CORS whitelist + /api/v1/ routing
    routes/incidents.routes.ts
    controllers/
    services/
    repositories/
    dtos/incidents.dto.ts    ← серверні DTO
    errors/api-error.ts
    middleware/

frontend/
  src/
    config.ts                ← API_BASE_URL (одна точка правди)
    dtos.ts                  ← типізовані DTO + ViewModel
    apiClient.ts             ← єдиний HTTP-шар, AbortController
    ui.ts                    ← DOM-операції
    main.ts                  ← сценарії
  public/
    index.html
    styles.css
    js/                      ← зкомпільовані .js (не редагувати вручну)
  tsconfig.json
```

---

## API v1 — ендпоінти

Усі маршрути мають префікс `/api/v1/`.

| Метод  | Шлях                              | Опис                        |
|--------|-----------------------------------|-----------------------------|
| GET    | /api/v1/incidents                 | Список (фільтр/сортування/пагінація) |
| GET    | /api/v1/incidents/:id             | Деталі інциденту            |
| POST   | /api/v1/incidents                 | Створити інцидент           |
| PUT    | /api/v1/incidents/:id             | Оновити інцидент            |
| DELETE | /api/v1/incidents/:id             | Видалити інцидент           |
| DELETE | /api/v1/incidents/reporters/:id   | Видалити репортера          |

---

## Контракти DTO (v1)

### IncidentResponseDto
```typescript
{
  id:          string   // UUID
  date:        string   // "YYYY-MM-DD"
  tag:         string   // тип інциденту
  criticality: string   // рівень критичності
  reporterId:  string   // UUID репортера
  reporter:    string   // ім'я репортера
  comment:     string   // опис
}
```

### CreateIncidentDto (POST body)
```typescript
{
  date:        string   // обов'язкове
  tag:         string   // обов'язкове
  criticality: string   // обов'язкове, одне з п'яти значень
  reporter:    string   // обов'язкове, мін 5 символів
  comment:     string   // обов'язкове, мін 15 символів
}
```

### Правила сумісності форматів (v1)

1. **Не можна** перейменовувати або видаляти наявні поля — фронтенд залежить від `id`, `date`, `tag`, `criticality`, `reporter`, `comment`, `reporterId`.
2. **Можна** додавати нові необов'язкові поля — фронтенд їх просто ігнорує.
3. **Не можна** змінювати тип поля (наприклад, `id: number` замість `string`).
4. Будь-яка зміна, що порушує ці правила, вимагає нової версії `/api/v2/`.

---

## CORS

Бекенд дозволяє лише явно задані origin (без `*`):

```
http://localhost:5500
http://127.0.0.1:5500
http://localhost:5173
http://127.0.0.1:5173
```

Preflight `OPTIONS` оброблено для всіх маршрутів.

---

## Сценарії перевірки

### GET — список інцидентів

```bash
curl http://localhost:3000/api/v1/incidents
# очікується: { items: [...], meta: { totalItems, currentPage, ... } }
```

### POST — створення

```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-05-01","tag":"Фішинг","criticality":"Середня критичність","reporter":"Іванченко","comment":"Підозрілий email з вкладенням"}'
# очікується: 201 + об'єкт з id
```

### POST — помилка валідації (400)

```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -d '{"date":"","tag":"","criticality":"","reporter":"abc","comment":"short"}'
# очікується: 400 + { error: { code: "VALIDATION_ERROR", message: "...", details: [...] } }
# у браузері: червоне повідомлення з деталями під полями
```

### GET — неіснуючий запис (404)

```bash
curl http://localhost:3000/api/v1/incidents/nonexistent-id
# очікується: 404 + { error: { code: "NOT_FOUND", ... } }
```

### Бекенд вимкнений (мережева помилка)

1. Зупинити бекенд.
2. У браузері відкрити http://localhost:5500.
3. Очікується: червоний статус «Помилка мережі або CORS — перевірте, чи запущений сервер».

### Таймаут (AbortController)

Таймаут — 12 секунд (константа `REQUEST_TIMEOUT_MS` у `config.ts`).
Якщо сервер не відповідає довше — у UI з'являється: «Запит перевищив ліміт часу».

### Перевірка CORS у браузері

1. Запустити обидва сервери.
2. DevTools → Network → POST на `/api/v1/incidents`.
3. Переконатися, що перед POST є OPTIONS із статусом 204 і заголовками `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`.
4. Спробувати відкрити з порту, якого немає у whitelist — в Console має з'явитися CORS-помилка.

---

## Теґ релізу

```bash
git add .
git commit -m "feat: lab 04 — frontend-backend integration (v0.4.0)"
git tag 0.4.0
git push origin main --tags
```
