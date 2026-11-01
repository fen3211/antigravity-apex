// Ensure NODE_ENV is set to test before imports
process.env.NODE_ENV = 'test';

import assert from 'assert';
import http from 'http';
import { db, initDatabase } from '../server/src/db/database.js';
import { eventBus } from '../server/src/services/event-bus.js';
import { 
  legalGateService, 
  OFFICIAL_PRIMARY_SOURCES 
} from '../server/src/services/legal-gate.js';
import { CONFIG } from '../server/src/config.js';
import { app, server } from '../server/src/index.js';
import type { LegalAssessment, EventPayload } from '../server/src/types.js';

function makeRequest(
  options: http.RequestOptions,
  postData?: any
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode || 500, headers: res.headers, body: parsed });
        } catch {
          resolve({ statusCode: res.statusCode || 500, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      const payload = typeof postData === 'string' ? postData : JSON.stringify(postData);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }

    req.end();
  });
}

async function runLegalComplianceTests() {
  console.log('--- STARTING LEGAL & COMPLIANCE AGENT ACCEPTANCE TEST SUITE (16 SCENARIOS) ---');

  initDatabase();

  // =========================================================================
  // Сценарий 1: Обычный лендинг (нет триггеров шлюза, GREEN)
  // =========================================================================
  console.log('\n[Scenario 1] Обычный лендинг (no legal gate trigger, GREEN)...');
  const res1 = legalGateService.evaluateTrigger(
    'Верстка статического лендинга продукта (HTML/Tailwind)',
    'Адаптивные CSS стили, сетка 8px, анимация кнопок'
  );
  assert.strictEqual(res1.triggered, false, 'Лендинг без сбора данных не должен активировать шлюз');
  assert.strictEqual(res1.reasons.length, 0);
  assert.strictEqual(res1.safeScopeCanProceed, true);

  const assess1 = legalGateService.createAssessment({
    projectAndFeature: 'Статический промо-лендинг',
    applicableNorms: ['Общие нормы авторского права'],
    identifiedRisks: [],
    riskLevel: 'GREEN'
  });
  assert.strictEqual(assess1.verdict, 'APPROVED');
  assert.strictEqual(assess1.riskLevel, 'GREEN');
  assert.strictEqual(assess1.humanCounselRequirement, 'NO');
  assert.strictEqual(assess1.safeScopeCanProceed, true);
  console.log('✓ Scenario 1 passed: Normal landing page safely approved with GREEN level.');

  // =========================================================================
  // Сценарий 2: Форма сбора ПДн граждан РФ (152-ФЗ, 156-ФЗ, 23-ФЗ)
  // =========================================================================
  console.log('\n[Scenario 2] Форма сбора ПДн граждан РФ (152-ФЗ, 156-ФЗ, 23-ФЗ)...');
  const res2 = legalGateService.evaluateTrigger(
    'Форма регистрации пользователей и сбор контактов граждан РФ',
    'Сбор ФИО, телефона и email граждан РФ для клиентской базы',
    {
      targetAudience: 'Пользователи в РФ (.ru/.рф)',
      entityLocation: 'Москва, РФ'
    }
  );
  assert.strictEqual(res2.triggered, true, 'Сбор ПДн граждан РФ обязан триггерить Gate 2b');
  assert.strictEqual(res2.jurisdiction, 'RU');
  assert.strictEqual(res2.riskCategory, 'PERSONAL_DATA');
  assert(res2.reasons.some(r => r.includes('152-ФЗ') && r.includes('156-ФЗ') && r.includes('23-ФЗ')),
    'Должен указывать на 152-ФЗ, отдельное согласие 156-ФЗ и локализацию 23-ФЗ');
  console.log('✓ Scenario 2 passed: RF personal data laws (152-FZ, 156-FZ, 23-FZ) properly enforced.');

  // =========================================================================
  // Сценарий 3: Зарубежная аналитика / Google Analytics (ст. 12 трансграничная передача, локализация)
  // =========================================================================
  console.log('\n[Scenario 3] Зарубежная аналитика / Google Analytics...');
  const res3 = legalGateService.evaluateTrigger(
    'Подключение Google Analytics и Mixpanel на сайте',
    'Передача идентификаторов пользователей в зарубежные сервисы аналитики',
    {
      targetAudience: 'Пользователи в РФ',
      serverDbLocation: 'Москва, РФ'
    }
  );
  assert.strictEqual(res3.triggered, true);
  assert.strictEqual(res3.jurisdiction, 'RU');
  assert(res3.reasons.some(r => r.includes('ст. 12 152-ФЗ') || r.includes('трансграничн')),
    'Должен выявить риски трансграничной передачи ПДн и уведомления РКН');
  console.log('✓ Scenario 3 passed: Foreign analytics flagged for cross-border and localization.');

  // =========================================================================
  // Сценарий 4: Передача промпта во внешний Gemini API
  // =========================================================================
  console.log('\n[Scenario 4] Передача промпта во внешний Gemini API...');
  const res4 = legalGateService.evaluateTrigger(
    'Интеграция с внешним Gemini API для генерации ответов',
    'Отправка пользовательских запросов и промптов во внешний AI API',
    {
      targetAudience: 'РФ'
    }
  );
  assert.strictEqual(res4.triggered, true);
  assert.strictEqual(res4.jurisdiction, 'RU');
  assert.strictEqual(res4.riskCategory, 'AI_REGULATION');
  assert(res4.reasons.some(r => r.includes('243-ФЗ') || r.includes('AI API')),
    'Должен зафиксировать риски ИИ и трансграничной отправки данных');
  console.log('✓ Scenario 4 passed: External Gemini API integration identified under AI regulation.');

  // =========================================================================
  // Сценарий 5: Запуск интернет-магазина (ЗоЗПП ст. 26.1, 69-ФЗ dark patterns)
  // =========================================================================
  console.log('\n[Scenario 5] Запуск интернет-магазина (ЗоЗПП ст. 26.1, 69-ФЗ)...');
  const res5 = legalGateService.evaluateTrigger(
    'Запуск интернет-магазина: корзина и дистанционная продажа товаров',
    'Каталог товаров, оформление заказов физлицами в Рунете',
    {
      targetAudience: 'РФ (.ru)',
      paymentMethods: 'МИР, СБП, рубли'
    }
  );
  assert.strictEqual(res5.triggered, true);
  assert.strictEqual(res5.jurisdiction, 'RU');
  assert.strictEqual(res5.riskCategory, 'ECOMMERCE');
  assert(res5.reasons.some(r => r.includes('2300-1') && r.includes('69-ФЗ')),
    'Должен содержать ссылки на Закон о защите прав потребителей и запрет предвыбранных чекбоксов');
  console.log('✓ Scenario 5 passed: E-commerce distance sales & 69-FZ dark pattern prohibition verified.');

  // =========================================================================
  // Сценарий 6: Интеграция онлайн-кассы (54-ФЗ мгновенная фискализация)
  // =========================================================================
  console.log('\n[Scenario 6] Интеграция онлайн-кассы (54-ФЗ фискализация)...');
  const res6 = legalGateService.evaluateTrigger(
    'Интеграция онлайн-кассы и фискализация оплат картой',
    'Безналичный приём платежей через шлюз и формирование чека по 54-ФЗ',
    {
      targetAudience: 'РФ',
      paymentMethods: 'МИР, банковские карты'
    }
  );
  assert.strictEqual(res6.triggered, true);
  assert(res6.reasons.some(r => r.includes('54-ФЗ') || r.includes('онлайн-касс')),
    'Должен требовать мгновенную фискализацию по 54-ФЗ');
  console.log('✓ Scenario 6 passed: Online cash register 54-FZ instantaneous fiscalization verified.');

  // =========================================================================
  // Сценарий 7: Размещение интернет-рекламы (38-ФЗ ст. 18.1 erid, 479-ФЗ 3%)
  // =========================================================================
  console.log('\n[Scenario 7] Размещение интернет-рекламы (38-ФЗ ст. 18.1, 479-ФЗ)...');
  const res7 = legalGateService.evaluateTrigger(
    'Размещение рекламных баннеров и промокодов в Рунете',
    'Проведение интернет-рекламной кампании для привлечения клиентов в РФ',
    {
      targetAudience: 'РФ',
      advertisingTerritory: 'РФ'
    }
  );
  assert.strictEqual(res7.triggered, true);
  assert.strictEqual(res7.jurisdiction, 'RU');
  assert.strictEqual(res7.riskCategory, 'ADVERTISING');
  assert(res7.reasons.some(r => r.includes('38-ФЗ') && r.includes('erid') && r.includes('479-ФЗ')),
    'Должен требовать токен erid, передачу в ЕРИР/ОРД и учет сбора 3% по 479-ФЗ');
  console.log('✓ Scenario 7 passed: Internet advertising labeling (erid, ORD, 3% deduction) verified.');

  // =========================================================================
  // Сценарий 8: Разработка Telegram Mini App (ответственность оператора, локализация)
  // =========================================================================
  console.log('\n[Scenario 8] Разработка Telegram Mini App...');
  const res8 = legalGateService.evaluateTrigger(
    'Разработка Telegram Mini App для сервиса заказов',
    'Запуск TWA-приложения в мессенджере с авторизацией через Telegram',
    {
      distributionChannels: 'Telegram Mini App (TWA)',
      targetAudience: 'РФ'
    }
  );
  assert.strictEqual(res8.triggered, true);
  assert(res8.riskCategory === 'CONTENT_PLATFORM' || res8.riskCategory === 'PERSONAL_DATA');
  assert(res8.reasons.some(r => r.includes('149-ФЗ') || r.includes('ОРИ')),
    'Должен учитывать обязанности ОРИ по 149-ФЗ для мессенджеров и TWA');

  const assess8 = legalGateService.createAssessment({
    projectAndFeature: 'Telegram Mini App для заказов',
    jurisdiction: 'RU',
    applicableNorms: ['152-ФЗ (ч. 5 ст. 18 локализация)', '149-ФЗ (ст. 10.1 ОРИ)'],
    identifiedRisks: ['Оператор TWA несет ответственность за сбор ПДн независимо от зарубежной платформы Telegram'],
    riskLevel: 'AMBER',
    recommendedRemediation: 'Обеспечить первичную запись данных в БД на территории РФ, не полагаться на облако Telegram.'
  });
  assert.strictEqual(assess8.verdict, 'NEEDS_REVIEW_AMBER');
  assert.strictEqual(assess8.humanCounselRequirement, 'RECOMMENDED');
  console.log('✓ Scenario 8 passed: Telegram Mini App operator liability and localization documented.');

  // =========================================================================
  // Сценарий 9: Создание маркетплейса (ЗоЗПП ст. 9 товарный агрегатор, 149-ФЗ)
  // =========================================================================
  console.log('\n[Scenario 9] Создание маркетплейса...');
  const res9 = legalGateService.evaluateTrigger(
    'Создание маркетплейса товаров сторонних продавцов',
    'Платформа-агрегатор для размещения предложений и расчетов между продавцами и покупателями',
    {
      targetAudience: 'РФ',
      paymentMethods: 'Безналичные расчеты, СБП, МИР'
    }
  );
  assert.strictEqual(res9.triggered, true);
  assert(res9.reasons.some(r => r.includes('агрегатор') || r.includes('2300-1')),
    'Должен учитывать нормы ст. 9 ЗоЗПП об обязанностях владельца агрегатора информации о товарах');
  console.log('✓ Scenario 9 passed: Marketplace aggregator obligations and disclosure rules verified.');

  // =========================================================================
  // Сценарий 10: Включение open source библиотеки (AGPL copyleft вирусный риск)
  // =========================================================================
  console.log('\n[Scenario 10] Open Source аудит (AGPL-3.0 copyleft viral risk)...');
  const res10 = legalGateService.evaluateTrigger(
    'Аудит зависимостей: интеграция библиотеки под AGPL-3.0',
    'Включение модуля под лицензией AGPL-3.0 в коммерческий проприетарный бэкенд'
  );
  assert.strictEqual(res10.triggered, true);
  assert.strictEqual(res10.riskCategory, 'LICENSING');

  const assess10 = legalGateService.createAssessment({
    projectAndFeature: 'Модуль авторизации с AGPL-3.0 библиотекой',
    applicableNorms: ['GNU AGPL-3.0 License', 'ГК РФ Ч. IV ст. 1286.1'],
    identifiedRisks: ['Вирусный копилефт обязывает раскрыть исходный код всего серверного бэкенда при доступе по сети'],
    riskLevel: 'RED',
    mechanismOfNonCompliance: 'Статическое связывание проприетарного кода с компонентом AGPL-3.0 без раскрытия исходников',
    potentialConsequences: 'Судебный иск от правообладателя, запрет распространения, потеря прав на коммерческую тайну',
    recommendedRemediation: 'Заменить AGPL-3.0 библиотеку на пермиссивный аналог под лицензией MIT или Apache-2.0.'
  });
  assert.strictEqual(assess10.verdict, 'BLOCKED_RED');
  assert.strictEqual(assess10.humanCounselRequirement, 'YES');
  assert.strictEqual(assess10.safeScopeCanProceed, true, 'Не блокирует безопасные несвязанные задачи проекта!');
  console.log('✓ Scenario 10 passed: AGPL viral copyleft correctly marked as BLOCKED_RED with non-blocking isolation.');

  // =========================================================================
  // Сценарий 11: Использование чужих изображений (ст. 1229, 1270 ГК РФ)
  // =========================================================================
  console.log('\n[Scenario 11] Использование чужих изображений (ст. 1229, 1270 ГК РФ)...');
  const res11 = legalGateService.evaluateTrigger(
    'Использование сторонних изображений и фотостока в приложении',
    'Публикация найденных в интернете иллюстраций в коммерческом интерфейсе',
    {
      targetAudience: 'РФ'
    }
  );
  assert.strictEqual(res11.triggered, true);
  assert.strictEqual(res11.riskCategory, 'LICENSING');
  assert(res11.reasons.some(r => r.includes('1229') || r.includes('1270') || r.includes('авторское право')),
    'Должен напомнить о недопустимости коммерческого использования без лицензии (в РФ нет коммерческого fair use)');
  console.log('✓ Scenario 11 passed: Third-party images and Russian copyright strict protection verified.');

  // =========================================================================
  // Сценарий 12: Коммерческое распространение AI-контента (243-ФЗ ст. 8–10 с 01.03.2027)
  // =========================================================================
  console.log('\n[Scenario 12] Коммерческое распространение AI-контента (243-ФЗ)...');
  const res12 = legalGateService.evaluateTrigger(
    'Коммерческая продажа и распространение AI-generated контента',
    'Генерация изображений и текста нейросетью для продажи клиентам',
    {
      targetAudience: 'РФ'
    }
  );
  assert.strictEqual(res12.triggered, true);
  assert.strictEqual(res12.jurisdiction, 'RU');
  assert.strictEqual(res12.riskCategory, 'AI_REGULATION');
  assert(res12.reasons.some(r => r.includes('243-ФЗ') && r.includes('01.03.2027') && r.includes('БУДУЩЕЕ ТРЕБОВАНИЕ')),
    'Обязан строго пометить ст. 8–10 243-ФЗ как БУДУЩЕЕ ТРЕБОВАНИЕ с 01.03.2027, не симулируя немедленное действие!');
  console.log('✓ Scenario 12 passed: Temporal invariant of 243-FZ (Articles 8-10 effective 01.03.2027) verified.');

  // =========================================================================
  // Сценарий 13: Обработка ПДн несовершеннолетних (ч. 6 ст. 9 152-ФЗ)
  // =========================================================================
  console.log('\n[Scenario 13] Обработка ПДн детей и несовершеннолетних...');
  const res13 = legalGateService.evaluateTrigger(
    'Регистрация несовершеннолетних пользователей в образовательном сервисе',
    'Сбор данных школьников и детей в возрасте до 18 лет',
    {
      targetAudience: 'РФ'
    }
  );
  assert.strictEqual(res13.triggered, true);
  assert.strictEqual(res13.riskCategory, 'PERSONAL_DATA');
  assert(res13.reasons.some(r => r.includes('ч. 6 ст. 9 152-ФЗ') || r.includes('законных представителей')),
    'Должен требовать согласия родителей по ч. 6 ст. 9 152-ФЗ');
  console.log('✓ Scenario 13 passed: Minors personal data parental consent rule verified.');

  // =========================================================================
  // Сценарий 14: Платформа пользовательского контента (149-ФЗ ст. 10.1 ОРИ, 10.6)
  // =========================================================================
  console.log('\n[Scenario 14] Платформа пользовательского контента (149-ФЗ ОРИ / соцсеть)...');
  const res14 = legalGateService.evaluateTrigger(
    'Разработка платформы пользовательского контента и форума сообщества',
    'Публикация пользовательских статей, комментариев и чат сообщества',
    {
      targetAudience: 'РФ'
    }
  );
  assert.strictEqual(res14.triggered, true);
  assert.strictEqual(res14.riskCategory, 'CONTENT_PLATFORM');
  assert(res14.reasons.some(r => r.includes('149-ФЗ') && r.includes('ОРИ')),
    'Должен предупреждать об обязанностях ОРИ по 149-ФЗ при взаимодействии пользователей');
  console.log('✓ Scenario 14 passed: UGC platform & 149-FZ information distributor rules verified.');

  // =========================================================================
  // Сценарий 15: Двойная юрисдикция РФ и ЕС (DUAL_RU_EU)
  // =========================================================================
  console.log('\n[Scenario 15] Двойная юрисдикция РФ и ЕС (DUAL_RU_EU)...');
  const res15 = legalGateService.evaluateTrigger(
    'Сервис для клиентов в РФ и Нидерландах: сбор персональных данных',
    'Обработка данных граждан России и ЕС, прием платежей в рублях и евро',
    {
      entityLocation: 'Амстердам, Нидерланды',
      targetAudience: 'Пользователи в РФ и ЕС',
      paymentMethods: 'МИР, СБП, iDEAL, SEPA'
    }
  );
  assert.strictEqual(res15.jurisdiction, 'DUAL_RU_EU', 'Должен распознать профиль DUAL_RU_EU');

  const reconcile = legalGateService.reconcileDualJurisdiction(
    'Международная обработка персональных данных',
    'Сервис для пользователей из РФ и ЕС с авторизацией и AI-ассистентом'
  );
  assert(reconcile.conflicts.length > 0, 'Должен обнаружить конфликты локализации и согласий');
  assert(reconcile.conflicts.some(c => c.includes('локализации')), 'Конфликт локализации 152-ФЗ vs GDPR Chapter V');
  assert(reconcile.conflicts.some(c => c.includes('156-ФЗ')), 'Разделение согласий по 156-ФЗ и GDPR Art. 7');
  assert(reconcile.harmonizedStrategy.includes('Архитектурная изоляция'), 'Гармонизированная стратегия должна предлагать первичную БД в РФ');
  console.log('✓ Scenario 15 passed: Dual RU/EU reconciliation produced coherent harmonized strategy.');

  // =========================================================================
  // Сценарий 16: Недостаточно данных о юрисдикции (UNKNOWN, отказ от гадания)
  // =========================================================================
  console.log('\n[Scenario 16] Недостаточно данных о юрисдикции (UNKNOWN, отказ от гадания)...');
  const res16 = legalGateService.evaluateTrigger(
    'Рефакторинг внутренней структуры классов и кэширования',
    'Оптимизация производительности без указания страны и рынка'
  );
  assert.strictEqual(res16.jurisdiction, 'UNKNOWN');

  const assess16 = legalGateService.createAssessment({
    projectAndFeature: 'Неопределённый проект без контекста',
    applicableNorms: [],
    identifiedRisks: ['Неизвестна юрисдикция и рынок присутствия'],
    riskLevel: 'UNKNOWN'
  });
  assert.strictEqual(assess16.verdict, 'INSUFFICIENT_DATA_UNKNOWN');
  assert(assess16.jurisdiction.includes('UNKNOWN'));
  assert(assess16.recommendedRemediation?.includes('10 критериям'),
    'Обязан запросить сведения по 10 критериям юрисдикции и отказаться от гадания');
  console.log('✓ Scenario 16 passed: UNKNOWN jurisdiction handled with strict anti-hallucination refusal.');

  // =========================================================================
  // Дополнительно: Проверка EventBus и опубликованных событий
  // =========================================================================
  console.log('\n[Scenario Bonus: EventBus & Notifications] Проверка публикаций событий в шину...');
  const recordedEvents = db.prepare("SELECT * FROM events WHERE type LIKE 'legal_gate.%'").all() as any[];
  const blockedEvents = recordedEvents.filter(e => e.type === 'legal_gate.blocked');
  const warningEvents = recordedEvents.filter(e => e.type === 'legal_gate.warning');
  const passedEvents = recordedEvents.filter(e => e.type === 'legal_gate.passed');

  assert(blockedEvents.length >= 1, 'Событие legal_gate.blocked должно быть сохранено в базе');
  assert(warningEvents.length >= 1, 'Событие legal_gate.warning должно быть сохранено в базе');
  assert(passedEvents.length >= 1, 'Событие legal_gate.passed должно быть сохранено в базе');
  console.log(`✓ EventBus & DB verified: ${recordedEvents.length} legal events persisted successfully.`);

  // =========================================================================
  // Дополнительно: Проверка официальных первичных источников
  // =========================================================================
  console.log('\n[Scenario Bonus: Official Primary Sources] Проверка реестра официальных порталов...');
  const sources = OFFICIAL_PRIMARY_SOURCES;
  assert(sources.some(s => s.url.includes('pravo.gov.ru')), 'Официальный портал правовой информации РФ');
  assert(sources.some(s => s.url.includes('rkn.gov.ru')), 'Роскомнадзор');
  assert(sources.some(s => s.url.includes('fas.gov.ru')), 'ФАС России');
  assert(sources.some(s => s.url.includes('eur-lex.europa.eu')), 'EUR-Lex ЕС');
  assert(sources.some(s => s.url.includes('autoriteitpersoonsgegevens.nl')), 'AP Нидерландов');
  assert(sources.some(s => s.url.includes('spdx.org')), 'SPDX Лицензии');
  console.log(`✓ Official primary sources registry contains ${sources.length} verified government and standard portals.`);

  // =========================================================================
  // HTTP REST API Integration Endpoints
  // =========================================================================
  console.log('\n[Scenario Bonus: HTTP REST API Endpoints] Тестирование API маршрутов /api/legal/*...');

  // Start server on ephemeral port if not listening
  let testPort = 3987;
  let testServer: http.Server = server;
  if (!server.listening) {
    await new Promise<void>((resolve) => {
      testServer = app.listen(0, '127.0.0.1', () => {
        testPort = (testServer.address() as any).port;
        resolve();
      });
    });
  } else {
    testPort = (server.address() as any).port;
  }

  // 1. POST /api/legal/evaluate
  const evalRes = await makeRequest({
    hostname: '127.0.0.1',
    port: testPort,
    path: '/api/legal/evaluate',
    method: 'POST'
  }, {
    title: 'Подключение платежей СБП и онлайн-кассы 54-ФЗ',
    description: 'Оплата на сайте гражданами РФ',
    criteria: { targetAudience: 'РФ' }
  });
  assert.strictEqual(evalRes.statusCode, 200);
  assert.strictEqual(evalRes.body.triggered, true);
  assert.strictEqual(evalRes.body.jurisdiction, 'RU');
  console.log('✓ POST /api/legal/evaluate verified.');

  // 2. POST /api/legal/assess
  const assessRes = await makeRequest({
    hostname: '127.0.0.1',
    port: testPort,
    path: '/api/legal/assess',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.API_KEY}`
    }
  }, {
    projectAndFeature: 'Модуль интеграции внешнего AI',
    applicableNorms: ['243-ФЗ от 26.07.2026', '152-ФЗ'],
    identifiedRisks: ['Передача персональных данных в сторонний LLM API'],
    riskLevel: 'AMBER'
  });
  assert.strictEqual(assessRes.statusCode, 200);
  assert.strictEqual(assessRes.body.verdict, 'NEEDS_REVIEW_AMBER');
  assert.strictEqual(assessRes.body.safeScopeCanProceed, true);
  console.log('✓ POST /api/legal/assess verified.');

  // 3. POST /api/legal/reconcile
  const reconcileRes = await makeRequest({
    hostname: '127.0.0.1',
    port: testPort,
    path: '/api/legal/reconcile',
    method: 'POST'
  }, {
    feature: 'Сбор персональных данных и AI-генерация',
    description: 'Сервис с пользователями в РФ и Нидерландах'
  });
  assert.strictEqual(reconcileRes.statusCode, 200);
  assert(reconcileRes.body.conflicts.length > 0);
  assert(reconcileRes.body.harmonizedStrategy.length > 0);
  console.log('✓ POST /api/legal/reconcile verified.');

  // 4. GET /api/legal/sources
  const sourcesRes = await makeRequest({
    hostname: '127.0.0.1',
    port: testPort,
    path: '/api/legal/sources',
    method: 'GET'
  });
  assert.strictEqual(sourcesRes.statusCode, 200);
  assert(Array.isArray(sourcesRes.body));
  assert(sourcesRes.body.length >= 10);
  console.log('✓ GET /api/legal/sources verified.');

  if (testServer !== server) {
    testServer.close();
  }

  console.log('\n=================================================================');
  console.log('ALL 16 LEGAL & COMPLIANCE SCENARIOS PASSED WITH 100% SUCCESS RATE');
  console.log('=================================================================');
}

runLegalComplianceTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
