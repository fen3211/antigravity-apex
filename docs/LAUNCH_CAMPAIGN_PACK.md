# Материалы для запуска Antigravity Apex

Репозиторий: https://github.com/fen3211/antigravity-apex

Ниже собраны живые тексты для публикации без канцелярщины и сложных оборотов. Для каждого зарубежного поста есть готовый русский вариант для Telegram и соцсетей.

---

## 1. Пост для Reddit и англоязычных форумов

Куда постить: r/LocalLLaMA, r/ArtificialIntelligence, r/ChatGPTCoding

### Заголовок (English):
Show LocalLLaMA: Antigravity Apex, a local supervisor for Google Antigravity that kills zombie processes and stops token waste

### Текст (English):
Hey everyone,

If you tried running multi-agent workflows with Google Antigravity or similar frameworks, you probably know the pain:
1. Subagents spawn background tests or compilers, crash, and leave zombie processes eating all your CPU.
2. An agent hits a tricky bug, fails twice, and keeps looping over the exact same broken fix until your token balance hits zero.
3. Transcripts grow into massive JSONL files, and regular file watchers lock up your disk trying to re-read them from scratch.

I got tired of dealing with this on my own machine, so I built Antigravity Apex.

What it actually does:
* Process tree killer: when an agent times out or you cancel a task, it kills the entire process tree on both Windows and Linux. No orphaned runners left behind.
* 64 KB streaming: reads newly appended lines from SQLite offsets. It never re-reads files from the start, so your SSD stays happy and emojis or Cyrillic letters never get cut in half.
* 17 built-in specialist roles: tasks go to specific roles (frontend, backend, QA, security, legal) instead of one prompt trying to do everything.
* Circuit breaker: if an agent fails twice on the same problem, Apex stops the loop and builds a clean 18-point context pack for Gemini 4 Argon so you get a real architectural fix instead of burning money.
* Completely local: runs on 127.0.0.1, writes to a local SQLite database, zero tracking, zero external telemetry.

How to try it:
* Windows: grab Antigravity-Apex-Setup.exe from the releases page (runs without git or terminal).
* Terminal: run `irm https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.ps1 | iex` on Windows or `curl -fsSL https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.sh | bash` on Linux/macOS.
* Browser: you can also open it in GitHub Codespaces with one click.

Code is MIT, check it out here: https://github.com/fen3211/antigravity-apex

If you find it useful, drop a star on the repo. Feedback and PRs are very welcome!

---

### Тот же пост на русском (для Telegram каналов и пабликов про ИИ и разработку):

Заголовок:
Сделал открытый супервизор для мультиагентов Antigravity: убивает зомби-процессы и экономит токены

Текст:
Всем привет!

Кто гоняет локальные мультиагентные пайплайны с Google Antigravity, наверняка сталкивался с бардаком:
1. Агент запустил тесты в фоне, упал по таймауту, а дочерний процесс остался висеть в памяти и греть процессор.
2. Агент упёрся в баг, дважды наступил на те же грабли и пошёл по кругу переписывать один и тот же кривой дифф, сливая баланс API в ноль.
3. Логи сессий в JSONL разрастаются до сотен мегабайт, и любой стандартный вотчер начинает насиловать SSD перечитыванием файла с самого начала.

Мне это надоело, поэтому я написал Antigravity Apex. Это локальный дашборд и диспетчер процессов для мультиагентов.

Что внутри:
* Честный киллер процессов: по таймауту или отмене срезает всё дерево процессов целиком, а не только родителя. Никаких подвисших фоновых компиляторов.
* Потоковое чтение кусками по 64 КБ: запоминает позицию в SQLite и читает только свежие строки. Диск не тормозит, а кириллица и эмодзи на стыках буфера не бьются.
* 17 готовых ролей: задачи раскидываются по специалистам (бэкенд, фронтенд, тесты, безопасность, юрист), а не валятся в один универсальный чат.
* Предохранитель от слива токенов: если агент дважды зафейлил задачу, цикл стопается, и система собирает аккуратный промпт-пак для старшей модели Gemini 4 Argon, чтобы решить проблему головой, а не тупыми повторами.
* Полный local-first: слушает только 127.0.0.1, пишет в локальную SQLite базу, никакой аналитики и слежки наружу.

Как запустить:
* На Windows: скачать готовый exe установщик из релизов (ставит всё сам в один клик).
* В консоли: одной командой через PowerShell или bash скрипт из репозитория.
* В облаке: можно поднять прямо в браузере через GitHub Codespaces.

Проект открытый под MIT: https://github.com/fen3211/antigravity-apex

Если тема интересна, заглядывайте, пробуйте и ставьте звёздочку репозиторию!

---

## 2. Пост для Hacker News (Show HN)

Заголовок:
Show HN: Antigravity Apex, local process supervisor and telemetry for Google Antigravity

Текст:
Hi HN,

I built Antigravity Apex (https://github.com/fen3211/antigravity-apex), a local-first process supervisor and web dashboard for multi-agent coding sessions with Google Antigravity.

When running local multi-agent systems, the real pain is rarely the prompt itself, but OS level process management:
* Zombie child processes: background test suites or bundlers often survive subagent termination, holding locks and hogging system resources.
* Transcript scaling: session transcripts grow fast, and naive file watchers attempt to read entire files from byte zero, creating quadratic I/O.
* Runaway loops: subagents hitting race conditions tend to retry the same broken diff until API limits run out.

How Apex handles this under the hood:
1. Low level chunked streaming: JsonlStreamReader tracks file byte offsets in SQLite. It reads appended logs in 64 KB buffers via raw file descriptors. Partial multi-byte UTF-8 sequences at chunk boundaries are held in memory and stitched together before JSON parsing, preserving Cyrillic and emojis.
2. Process tree lifecycle: tasks run through an explicit finite state machine. Concurrency is capped at 6 subagents with automatic queue draining. On cancel or timeout, it triggers a recursive tree kill (taskkill on Windows, PGID signals on Unix).
3. SQLite WAL: storage runs on better-sqlite3 with busy_timeout set to 5000ms. Events are pushed to WebSockets only after successful SQLite commit.
4. Escalation engine: two consecutive failures freeze the task and produce a sanitized 18-point context pack for Gemini 4 Argon, masking private user paths and API keys.

The project is written in TypeScript (Node.js and React 19) and licensed under MIT.

Repo: https://github.com/fen3211/antigravity-apex

Curious to hear your thoughts and feedback!

---

## 3. Карточка для Product Hunt

Название: Antigravity Apex
Слоган: Local mission control & supervisor for Google Antigravity

Короткое описание:
Open source, local-first web dashboard and process supervisor for multi-agent systems. Features process tree killing, 64 KB log streaming, 17 specialist roles, token loop protection, and zero telemetry.

Первый комментарий создателя (Maker Comment):
Hey everyone! 👋

I made Antigravity Apex because I was tired of autonomous agents creating chaos on my machine: leaving orphaned build processes, re-reading giant JSONL files, and burning through API tokens on repetitive failures.

Apex gives you clean visibility and control:
* Kills full process trees on task cancel or timeout.
* Streams logs in 64 KB chunks without bogging down your SSD.
* Stops infinite retry loops after two failed attempts and builds a clean escalation pack.
* Runs 100% locally on localhost with SQLite, zero telemetry.
* Comes with a 1-click Windows installer and simple terminal one-liners.

It is completely free and open source under MIT. Check it out and let me know what you think! 🚀

---

## 4. Статья для Хабра

Заголовок:
Как перестать убирать за мультиагентами: пишем локальный супервизор процессов для Google Antigravity

Текст статьи:

Привет, Хабр!

Если вы пробовали запускать связки автономных ИИ-агентов для написания кода, то наверняка замечали, как быстро всё превращается в кашу. 

Агент вроде бы закончил задачу, но запущенный им фоновый раннер тестов остался висеть в памяти. Другой агент застрял на баге в WebSocket, три раза подряд предложил одну и ту же нерабочую правку и сжёг дневной лимит токенов. А логи сессий тем временем раздулись до 100 мегабайт, и любой скрипт мониторинга начинает дико тупить, перечитывая всё с первой строчки.

Чтобы навести порядок, я написал Antigravity Apex. Это локальный дашборд и диспетчер процессов для Google Antigravity. Никаких внешних серверов, всё работает прямо на машине разработчика через SQLite и локальный веб-интерфейс.

В этой статье расскажу, как устроена система изнутри, как мы решили проблему зомби-процессов и почему стандартный подход к чтению логов убивает диск.

### 1. Архитектура без лишних сущностей

Главный принцип: всё работает на 127.0.0.1, никаких SaaS сервисов и облачных баз.

Схема работы простая:
1. Агенты Antigravity пишут свои транскрипты в локальные файлы JSONL.
2. Файловый вотчер ловит изменение и передаёт событие в движок JsonlStreamReader.
3. Движок считывает только свежие байты кусками по 64 КБ, парсит JSON и складывает события в очередь IngestionQueue.
4. Очередь пачками пишет события в локальную SQLite базу в режиме WAL.
5. Только после подтверждения записи в базу события улетают по WebSocket на клиентский интерфейс на React 19.

### 2. Читаем логи по 64 КБ и не ломаем кириллицу

Обычно логи читают либо заново целиком, либо построчно через стандартные библиотеки. Когда файл весит 50–100 МБ, это превращается в кошмар для диска.

В Apex мы сделали потоковый ридер:
* В специальной таблице базы сохраняется точное смещение в байтах, на котором мы закончили чтение.
* При появлении новых данных мы читаем файл с этого места блоками по 64 КБ через обычный системный дескриптор.
* Самая частая проблема таких буферов: разрыв многобайтовых символов. Если двухбайтовая русская буква или четырёхбайтовый эмодзи попали ровно на границу блока, они разрежутся пополам. JsonlStreamReader аккуратно оставляет оторванный хвост в памяти и приклеивает его к началу следующего чанка. В итоге ни одна строчка JSON не портится.
* Если файл обнулили или заменили, движок смотрит на номер inode и дату создания, после чего спокойно сбрасывает указатель в ноль.

### 3. Убиваем дерево процессов под корень

Когда агент падает по таймауту или задачу отменяет пользователь, стандартный вызов kill убивает только сам процесс агента. А вот запущенные им дочерние компиляторы или веб-серверы остаются висеть и держать порты.

Супервизор в Apex управляет жизненным циклом через конечный автомат:
* Новая задача встаёт в очередь или сразу уходит в запуск, если занято меньше 6 слотов.
* При отмене или таймауте супервизор вызывает принудительное убийство всего дерева: на Windows через команду taskkill с флагом /T, а на Linux через системный сигнал группе процессов.
* Порты освобождаются мгновенно, в диспетчере задач чистота.

### 4. Предохранитель от бессмысленного слива бюджета

Бывает, что агент не может победить сложный баг архитектуры. Вместо того чтобы признать тупик, он пробует одно и то же по кругу, пока на счету есть деньги.

В Apex встроен предохранитель:
* Если агент дважды ошибся на одной задаче, выполнение останавливается.
* Система автоматически вычищает пути пользователя (заменяет личные папки на знак тильды) и убирает секреты.
* Формируется лаконичный промпт-пак из 18 пунктов: суть бага, две неудачные попытки и 30 строк проблемного кода.
* Разработчик скармливает этот пак старшей модели Gemini 4 Argon, забирает готовое архитектурное решение и вставляет ответ в окно дашборда.
* Система сама передаёт инструкции исполнителям на быстрой модели Flash, и работа продолжается без лишних трат.

### 5. Запуск в один клик

Я хотел, чтобы проект можно было запустить без чтения километровых инструкций:
* Для Windows собран самостоятельный exe установщик на 9 КБ: скачал, запустил, он сам всё проверит, скопирует и откроет браузер.
* Для консоли есть однострочники на PowerShell и Bash.
* Встроенная команда `npm run doctor` за пару секунд прогоняет 19 тестов окружения: проверяет базы, права, пути и версии Node.js.

### Итог

Antigravity Apex полностью открыт под лицензией MIT. Исходники, скрипты и документация на 8 языках доступны в репозитории:
https://github.com/fen3211/antigravity-apex

Буду рад вашим отзывам, замечаниям в issues и звёздочкам на гитхабе!

---

## 5. Тред для Twitter / X

Твит 1:
Running local multi-agent coding sessions without a supervisor gets messy fast. Zombie build tools eating CPU, runaway retry loops, locked ports. I built Antigravity Apex to fix this. 100% open source mission control for Google Antigravity. ⚡

Твит 2:
The worst part of local subagents is orphaned processes. An agent times out, but its background test runner keeps living in memory. Apex uses an explicit FSM and kills the whole process tree on Windows and Linux. No more zombie compilers.

Твит 3:
Session logs can hit 100MB+. Normal file watchers re-read from line zero and thrash your SSD. Apex streams in 64 KB chunks from SQLite offsets with multi-byte UTF-8 boundary protection. Emojis and Cyrillic never break.

Твит 4:
Two fails in a row on the same task? Apex stops the loop before it drains your API balance. It creates an 18-point sanitized prompt pack for Gemini 4 Argon so you get a real architectural fix instead of repetitive diffs.

Твит 5:
Runs completely on localhost with SQLite, zero telemetry. 1-click Windows installer, simple bash one-liner, Codespaces ready. Code is MIT: https://github.com/fen3211/antigravity-apex ⭐
