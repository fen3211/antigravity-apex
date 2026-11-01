import { eventBus } from './event-bus.js';
import type { 
  LegalAssessment, 
  LegalRiskLevel, 
  LegalGateStatus, 
  LegalOfficialSource,
  JurisdictionType,
  JurisdictionCriteria,
  TriggerEvaluationResult
} from '../types.js';

export const OFFICIAL_PRIMARY_SOURCES: LegalOfficialSource[] = [
  // 1. Российская Федерация
  {
    name: 'Официальный интернет-портал правовой информации (pravo.gov.ru)',
    url: 'http://pravo.gov.ru/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  },
  {
    name: 'Федеральная служба по надзору в сфере связи, ИТ и массовых коммуникаций (Роскомнадзор)',
    url: 'https://rkn.gov.ru/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  },
  {
    name: 'Федеральная антимонопольная служба (ФАС России)',
    url: 'https://fas.gov.ru/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  },
  {
    name: 'Федеральная налоговая служба (ФНС России)',
    url: 'https://www.nalog.gov.ru/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  },
  {
    name: 'Министерство цифрового развития, связи и массовых коммуникаций РФ',
    url: 'https://digital.gov.ru/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  },
  // 2. Европейский союз и Нидерланды
  {
    name: 'EUR-Lex (Official EU Law Portal)',
    url: 'https://eur-lex.europa.eu/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  },
  {
    name: 'European Commission (EC Portal)',
    url: 'https://commission.europa.eu/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  },
  {
    name: 'European AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/',
    checkedDate: '2026-11-01',
    inForceDate: '2024-08-01'
  },
  {
    name: 'Autoriteit Persoonsgegevens (Dutch DPA)',
    url: 'https://autoriteitpersoonsgegevens.nl/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  },
  {
    name: 'Business.gov.nl (Netherlands Government for Entrepreneurs)',
    url: 'https://business.gov.nl/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  },
  {
    name: 'Government of the Netherlands (Rijksoverheid)',
    url: 'https://www.government.nl/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  },
  // 3. Открытые лицензии
  {
    name: 'SPDX Open Source License List',
    url: 'https://spdx.org/licenses/',
    checkedDate: '2026-11-01',
    inForceDate: 'Active'
  }
];

export class LegalGateService {
  /**
   * Определение применимой юрисдикции на основе 10 критериев или текстового контекста.
   */
  public inferJurisdiction(
    criteria?: Partial<JurisdictionCriteria>,
    textContext: string = ''
  ): JurisdictionType {
    const combined = `${textContext} ${JSON.stringify(criteria || {})}`.toLowerCase();

    let hasRuScore = 0;
    let hasEuScore = 0;
    let hasOtherScore = 0;

    // 10 критериев при наличии
    if (criteria) {
      // 1. Место регистрации компании
      if (criteria.entityLocation) {
        const el = criteria.entityLocation.toLowerCase();
        if (el.includes('рф') || el.includes('росси') || el.includes('russia')) hasRuScore += 2;
        if (el.includes('нидерланд') || el.includes('netherlands') || el.includes('eu') || el.includes('ес')) hasEuScore += 2;
        if (el.includes('usa') || el.includes('сша') || el.includes('delaware')) hasOtherScore += 2;
      }
      // 2. Гражданство/резидентство основателей
      if (criteria.founderCitizenship) {
        const fc = criteria.founderCitizenship.toLowerCase();
        if (fc.includes('рф') || fc.includes('росси') || fc.includes('russia')) hasRuScore += 1;
        if (fc.includes('нидерланд') || fc.includes('netherlands') || fc.includes('eu')) hasEuScore += 1;
      }
      // 3. Физическое расположение серверов
      if (criteria.serverDbLocation) {
        const srv = criteria.serverDbLocation.toLowerCase();
        if (srv.includes('рф') || srv.includes('росси') || srv.includes('москв') || srv.includes('спб')) hasRuScore += 2;
        if (srv.includes('ес') || srv.includes('европ') || srv.includes('амстердам') || srv.includes('netherlands') || srv.includes('frankfurt')) hasEuScore += 2;
      }
      // 4. Целевая аудитория
      if (criteria.targetAudience) {
        const ta = criteria.targetAudience.toLowerCase();
        if (ta.includes('рф') || ta.includes('росси') || ta.includes('.ru') || ta.includes('.рф')) hasRuScore += 2;
        if (ta.includes('ес') || ta.includes('европ') || ta.includes('.nl') || ta.includes('.eu')) hasEuScore += 2;
      }
      // 5. Способы приёма платежей
      if (criteria.paymentMethods) {
        const pm = criteria.paymentMethods.toLowerCase();
        if (pm.includes('мир') || pm.includes('сбп') || pm.includes('рубл') || pm.includes('rub')) hasRuScore += 2;
        if (pm.includes('ideal') || pm.includes('sepa') || pm.includes('eur') || pm.includes('евро')) hasEuScore += 2;
      }
      // 6. Регистрация в реестрах
      if (criteria.regulatoryRegistries) {
        const rr = criteria.regulatoryRegistries.toLowerCase();
        if (rr.includes('ори') || rr.includes('минцифр') || rr.includes('ркн')) hasRuScore += 2;
        if (rr.includes('kvk') || rr.includes('autoriteit')) hasEuScore += 2;
      }
      // 7. Каналы дистрибуции
      if (criteria.distributionChannels) {
        const dc = criteria.distributionChannels.toLowerCase();
        if (dc.includes('rustore')) hasRuScore += 1;
      }
      // 8. Сторонние сервисы
      if (criteria.thirdPartyServices) {
        const ts = criteria.thirdPartyServices.toLowerCase();
        if (ts.includes('яндекс') || ts.includes('yandex') || ts.includes('vk')) hasRuScore += 1;
      }
      // 9. Применимое право
      if (criteria.applicableLawClause) {
        const al = criteria.applicableLawClause.toLowerCase();
        if (al.includes('рф') || al.includes('росси') || al.includes('гк рф')) hasRuScore += 2;
        if (al.includes('netherlands') || al.includes('нидерланд') || al.includes('dutch')) hasEuScore += 2;
      }
      // 10. Территория рекламы
      if (criteria.advertisingTerritory) {
        const at = criteria.advertisingTerritory.toLowerCase();
        if (at.includes('рф') || at.includes('росси')) hasRuScore += 1;
        if (at.includes('ес') || at.includes('европ')) hasEuScore += 1;
      }
    }

    // Текстовый анализ маркеров
    const ruKeywords = [
      '152-фз', '156-фз', '23-фз', '149-фз', '243-фз', '38-фз', '479-фз', '54-фз',
      'гк рф', 'зозпп', 'роскомнадзор', 'ркн', 'рунет', 'граждане рф', 'граждан рф',
      'сбп', 'карта мир', 'rustore', 'яндекс.метрика', 'реестр ори', 'российск', 'в рф'
    ];
    for (const kw of ruKeywords) {
      if (combined.includes(kw)) hasRuScore += 1;
    }

    const euKeywords = [
      'gdpr', 'avg', 'uavg', 'eu ai act', 'eprivacy', 'telecommunicatiewet',
      'autoriteit persoonsgegevens', 'netherlands', 'нидерланд', 'евросоюз', 'амстердам',
      'ideal', 'sepa', 'kvk'
    ];
    for (const kw of euKeywords) {
      if (combined.includes(kw)) hasEuScore += 1;
    }

    if (hasRuScore > 0 && hasEuScore > 0) {
      return 'DUAL_RU_EU';
    }
    if (hasRuScore > 0 && hasEuScore === 0) {
      return 'RU';
    }
    if (hasEuScore > 0 && hasRuScore === 0) {
      return 'EU_NL';
    }
    if (hasOtherScore > 0) {
      return 'OTHER';
    }

    return 'UNKNOWN';
  }

  /**
   * Детерминированная проверка триггеров Юридического шлюза (Gate 2b).
   */
  public evaluateTrigger(
    title: string, 
    description: string = '',
    criteria?: Partial<JurisdictionCriteria>
  ): TriggerEvaluationResult {
    const combined = `${title} ${description}`.toLowerCase();
    const reasons: string[] = [];
    let riskCategory: TriggerEvaluationResult['riskCategory'] = undefined;

    const jurisdiction = this.inferJurisdiction(criteria, combined);

    // 1. Personal Data & Privacy
    const personalDataKeywords = [
      'personal data', 'персональные данные', 'пдн', 'gdpr', 'avg', 'uavg', 'cookie', 'cookies',
      'куки', 'email', 'парол', 'password', 'user profile', 'профиль пользователя',
      'tracking', 'трекинг', 'analytics', 'аналитик', 'auth', 'авторизац', 'privacy policy',
      'политика конфиденциальности', 'dpa', 'dpia', '152-фз', '156-фз', '23-фз', 'роскомнадзор',
      'google analytics', 'гугл аналитик', 'метрика', 'сбор данных', 'регистрация'
    ];
    if (personalDataKeywords.some(kw => combined.includes(kw))) {
      if (jurisdiction === 'RU' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Затрагивает обработку персональных данных граждан РФ (152-ФЗ, отдельное согласие 156-ФЗ с 01.09.2025, локализация в РФ 23-ФЗ с 01.07.2025)');
      }
      if (jurisdiction === 'EU_NL' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Затрагивает обработку персональных данных субъектов в ЕС (GDPR / AVG / ePrivacy Directive)');
      }
      if (jurisdiction === 'UNKNOWN' || jurisdiction === 'OTHER') {
        reasons.push('Затрагивает сбор и обработку персональных данных физических лиц');
      }
      riskCategory = 'PERSONAL_DATA';
    }

    // 2. Foreign Analytics / Cross-border data transfer
    const foreignAnalyticsKeywords = [
      'google analytics', 'гугл аналитик', 'mixpanel', 'amplitude', 'foreign analytics',
      'трансграничн', 'cross-border', 'firebase analytics'
    ];
    if (foreignAnalyticsKeywords.some(kw => combined.includes(kw))) {
      if (jurisdiction === 'RU' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Использование зарубежных сервисов аналитики с передачей ПДн за рубеж (ст. 12 152-ФЗ уведомительный порядок, риск нарушения локализации 23-ФЗ)');
      }
      if (!riskCategory) riskCategory = 'PERSONAL_DATA';
    }

    // 3. Children / Minors personal data
    const childrenKeywords = [
      'дети', 'детск', 'несовершеннолетн', 'minors', 'children', 'возраст до 18', 'школьник'
    ];
    if (childrenKeywords.some(kw => combined.includes(kw))) {
      if (jurisdiction === 'RU' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Обработка персональных данных несовершеннолетних требует письменного согласия законных представителей (ч. 6 ст. 9 152-ФЗ)');
      }
      if (jurisdiction === 'EU_NL' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Обработка персональных данных детей в ЕС требует согласия родителей (GDPR Art. 8)');
      }
      riskCategory = 'PERSONAL_DATA';
    }

    // 4. External AI APIs & AI Regulation
    const aiApiKeywords = [
      'external ai', 'ai api', 'openai', 'gemini api', 'anthropic', 'claude',
      'ai-generated', 'генеративный ai', 'искусственный интеллект', 'ai act',
      'llm api', 'модель ии', 'синтез речи', 'deepfake', 'watermarking', '243-фз',
      'ai-контент', 'нейросеть'
    ];
    if (aiApiKeywords.some(kw => combined.includes(kw))) {
      if (jurisdiction === 'RU' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Интеграция ИИ и генеративного контента: Федеральный закон № 243-ФЗ от 26.07.2026 (в силе с 01.09.2026; ст. 8–10 маркировка AI-контента и обучение вступают в силу с 01.03.2027 как БУДУЩЕЕ ТРЕБОВАНИЕ)');
      }
      if (jurisdiction === 'EU_NL' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Интеграция внешних AI API или распространение AI-generated контента (EU AI Act 2024/1689: прозрачность Art. 50, GPAI)');
      }
      if (jurisdiction === 'UNKNOWN' || jurisdiction === 'OTHER') {
        reasons.push('Интеграция внешних AI API или генеративных моделей (требуется оценка рисков трансграничной передачи данных и регулирования ИИ)');
      }
      if (!riskCategory) riskCategory = 'AI_REGULATION';
    }

    // 5. Open Source Licensing, Copyright & Third-party assets
    const licenseKeywords = [
      'license', 'лицензи', 'agpl', 'gpl', 'sspl', 'copyleft', 'proprietary',
      'авторское право', 'авторск', 'copyright', 'spdx', 'open source', 'открытый исходный',
      'коммерческое использование', 'commercial license', 'dependency audit',
      'изображен', 'фотосток', 'фотобанк', 'чужие фото', 'unauthorized images', 'шрифт'
    ];
    if (licenseKeywords.some(kw => combined.includes(kw))) {
      if (jurisdiction === 'RU' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Включение сторонних библиотек или медиа-активов: ст. 1229, 1261, 1270, 1286.1 ГК РФ (в РФ отсутствует fair use для коммерческих проектов)');
      } else if (jurisdiction === 'EU_NL') {
        reasons.push('Включение сторонних библиотек, лицензионный аудит или авторское право (SPDX / Copyright Directive)');
      } else {
        reasons.push('Включение сторонних библиотек или медиа-активов: аудит открытых лицензий (SPDX) и авторских прав');
      }
      if (!riskCategory) riskCategory = 'LICENSING';
    }

    // 6. E-Commerce, Online Stores, Checkouts & Marketplaces
    const ecommerceKeywords = [
      'интернет-магазин', 'online store', 'ecommerce', 'e-commerce', 'корзина', 'checkout',
      'оплата товаров', 'возврат товара', 'маркетплейс', 'marketplace', 'договор розничной купли',
      'онлайн-касса', 'касса', '54-фз', 'чек', 'фискализац', 'зозпп'
    ];
    if (ecommerceKeywords.some(kw => combined.includes(kw))) {
      if (jurisdiction === 'RU' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Дистанционная торговля и электронная коммерция: Закон РФ № 2300-1 (ст. 26.1 возврат 7 дней / 3 месяца без памятки, ст. 9 информация агрегатора), 69-ФЗ от 07.04.2025 (запрет предвыбранных чекбоксов/dark patterns с 01.09.2025)');
        if (combined.includes('касс') || combined.includes('54-фз') || combined.includes('оплат') || combined.includes('чек')) {
          reasons.push('Обязательная мгновенная фискализация безналичных расчетов через онлайн-кассу (54-ФЗ)');
        }
      } else if (jurisdiction === 'EU_NL') {
        reasons.push('Дистанционная торговля и электронная коммерция в ЕС (Consumer Rights Directive 2011/83/EU)');
      } else {
        reasons.push('Дистанционная торговля, оформление заказов и электронная коммерция (требуется аудит потребительских прав и фискализации)');
      }
      if (!riskCategory) riskCategory = 'ECOMMERCE';
    }

    // 7. Internet Advertising & Labeling
    const advertisingKeywords = [
      'реклама', 'advertising', 'баннер', 'промокод', 'маркировка рекламы', 'erid',
      'орд', 'ерир', '38-фз', '479-фз', 'рекламная кампания'
    ];
    if (advertisingKeywords.some(kw => combined.includes(kw))) {
      if (jurisdiction === 'RU' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Размещение интернет-рекламы в Рунете: ст. 18.1 38-ФЗ (маркировка рекламы, токен erid, передача данных в ЕРИР через ОРД), 479-ФЗ (3% отчислений)');
      } else {
        reasons.push('Размещение интернет-рекламы и маркетинговых материалов (требуется проверка обязательной маркировки и рекламного законодательства)');
      }
      if (!riskCategory) riskCategory = 'ADVERTISING';
    }

    // 8. Telegram Mini Apps, Messengers, User Generated Content & ORI
    const platformKeywords = [
      'telegram mini app', 'telegram bot', 'телеграм бот', 'телеграм мини апп', 'twa',
      'пользовательский контент', 'user-generated content', 'ugc', 'форум', 'чат',
      'организатор распространения информации', 'ори', '149-фз', 'соцсеть'
    ];
    if (platformKeywords.some(kw => combined.includes(kw))) {
      if (jurisdiction === 'RU' || jurisdiction === 'DUAL_RU_EU') {
        reasons.push('Сервис коммуникации / платформа пользовательского контента: 149-ФЗ (ст. 10.1 обязанности ОРИ при включении в реестр, ст. 10.6 критерии посещаемости >500k пользователей в сутки)');
      } else {
        reasons.push('Сервис коммуникации / платформа пользовательского контента (требуется аудит регулирования цифровых платформ и ответственности за контент)');
      }
      if (!riskCategory) riskCategory = 'CONTENT_PLATFORM';
    }

    // 9. Web Scraping & Data Harvesting
    const scrapingKeywords = [
      'scrape', 'scraping', 'скрейпинг', 'парсер сайтов', 'crawler', 'сбор данных с сайтов',
      'harvesting', 'выгрузка данных'
    ];
    if (scrapingKeywords.some(kw => combined.includes(kw))) {
      reasons.push('Автоматизированный сбор данных со сторонних сайтов (нарушение ToS, права изготовителя базы данных ст. 1334 ГК РФ / EU Database Directive)');
      if (!riskCategory) riskCategory = 'SCRAPING';
    }

    // 10. Automated Decisions / Profiling
    const automatedDecisionKeywords = [
      'automated decision', 'автоматизированное решение', 'скоринг', 'scoring',
      'profiling', 'профилирование', 'отбор кандидатов', 'ранжирование людей'
    ];
    if (automatedDecisionKeywords.some(kw => combined.includes(kw))) {
      reasons.push('Автоматизированное принятие решений в отношении физических лиц (GDPR Art. 22 / ст. 16 152-ФЗ)');
      if (!riskCategory) riskCategory = 'AUTOMATED_DECISION';
    }

    // 11. Commercial Distribution & Public Deployment
    const commercialKeywords = [
      'коммерческий релиз', 'commercial release', 'передача клиенту', 'public deployment',
      'публикация в продакшн', 'terms of service', 'пользовательское соглашение', 'публичная оферта'
    ];
    if (commercialKeywords.some(kw => combined.includes(kw))) {
      reasons.push('Коммерческое распространение программного обеспечения или публичный запуск сервиса (требуется аудит ToS, политики конфиденциальности и прав)');
      if (!riskCategory) riskCategory = 'COMMERCIAL_RELEASE';
    }

    if (reasons.length > 0) {
      return {
        triggered: true,
        jurisdiction,
        riskCategory,
        reasons,
        recommendedAction: 'Направить на предварительный аудит специалисту `legal-compliance` перед переходом в разработку.',
        safeScopeCanProceed: true
      };
    }

    return {
      triggered: false,
      jurisdiction,
      reasons: [],
      recommendedAction: 'Юридический шлюз не требуется. Разработка и фиксы продолжаются в штатном режиме без задержек.',
      safeScopeCanProceed: true
    };
  }

  /**
   * Разрешение конфликтов и гармонизация при одновременном действии РФ и ЕС (DUAL_RU_EU).
   */
  public reconcileDualJurisdiction(feature: string, description: string = ''): {
    conflicts: string[];
    harmonizedStrategy: string;
    applicableNorms: string[];
  } {
    const combined = `${feature} ${description}`.toLowerCase();
    const conflicts: string[] = [];
    const norms: string[] = [
      '152-ФЗ (ч. 5 ст. 18 — локализация баз данных в РФ)',
      '156-ФЗ от 24.06.2025 (отдельное согласие на обработку ПДн с 01.09.2025)',
      'GDPR Regulation (EU) 2016/679 (Chapter V — трансграничные передачи)',
      'GDPR Art. 7 (требования к свободному и информированному согласию)'
    ];

    if (combined.includes('персональн') || combined.includes('personal data') || combined.includes('пользовател') || combined.includes('auth')) {
      conflicts.push('Конфликт локализации и трансграничной передачи: 152-ФЗ (23-ФЗ) требует первичного сбора и хранения ПДн граждан РФ в базе на территории РФ, тогда как передача в ЕС подпадает под правила Chapter V GDPR.');
      conflicts.push('Форма согласия: 156-ФЗ (в силе с 01.09.2025) запрещает объединение согласия на обработку ПДн с условиями сервиса (ToS); GDPR Art. 7 также требует раздельного и гранулярного согласия.');
    }

    if (combined.includes('ai') || combined.includes('ии') || combined.includes('генератив')) {
      conflicts.push('Регулирование ИИ: EU AI Act классифицирует системы по уровням риска (запрет, высокий риск, GPAI), тогда как 243-ФЗ от 26.07.2026 выделяет фундаментальные модели от 1 млрд параметров и вводит маркировку контента (ст. 9) с 01.03.2027.');
      norms.push('EU AI Act 2024/1689 (Art. 50 — transparency)');
      norms.push('Федеральный закон № 243-ФЗ от 26.07.2026 (ст. 8–10 — БУДУЩЕЕ ТРЕБОВАНИЕ с 01.03.2027)');
    }

    const harmonizedStrategy = 
      '1. Архитектурная изоляция: первичная запись ПДн граждан РФ производится в ЦОД на территории РФ; трансграничная репликация в ЕС настраивается только после явного информированного согласия и заключения Standard Contractual Clauses (SCC) / соглашения о поручении обработки.\n' +
      '2. UI-форма согласий: разделить чекбоксы на независимые пункты (отдельно ToS, отдельно согласие на обработку ПДн по 156-ФЗ/GDPR, без предварительно проставленных галочек по 69-ФЗ).\n' +
      '3. Маркировка AI-контента: предусмотреть видимое указание на генерацию ИИ (соответствует Art. 50 EU AI Act уже сейчас и подготовит проект к ст. 9 243-ФЗ с 01.03.2027).';

    return {
      conflicts,
      harmonizedStrategy,
      applicableNorms: norms
    };
  }

  /**
   * Создание и валидация структурированного отчёта LegalAssessment (11 обязательных пунктов).
   */
  public createAssessment(params: {
    projectAndFeature: string;
    jurisdiction?: JurisdictionType | string;
    applicableNorms: string[];
    identifiedRisks: string[];
    riskLevel: LegalRiskLevel;
    officialSources?: LegalOfficialSource[];
    mechanismOfNonCompliance?: string;
    potentialConsequences?: string;
    recommendedRemediation?: string;
    humanCounselRequirement?: 'YES' | 'NO' | 'RECOMMENDED';
    taskId?: string;
    criteria?: Partial<JurisdictionCriteria>;
  }): LegalAssessment {
    let resolvedJurisdiction = params.jurisdiction;
    if (!resolvedJurisdiction || resolvedJurisdiction === 'UNKNOWN') {
      const inferred = this.inferJurisdiction(params.criteria, `${params.projectAndFeature} ${params.applicableNorms.join(' ')}`);
      resolvedJurisdiction = inferred;
    }

    let jurisdictionDisplay = String(resolvedJurisdiction);
    if (resolvedJurisdiction === 'RU') {
      jurisdictionDisplay = 'Российская Федерация (152-ФЗ, 149-ФЗ, 243-ФЗ, ГК РФ Ч. IV, 38-ФЗ, ЗоЗПП 2300-1)';
    } else if (resolvedJurisdiction === 'EU_NL') {
      jurisdictionDisplay = 'Европейский союз и Нидерланды (GDPR, UAVG, EU AI Act 2024/1689, Telecommunicatiewet)';
    } else if (resolvedJurisdiction === 'DUAL_RU_EU') {
      jurisdictionDisplay = 'Одновременная юрисдикция РФ и ЕС/Нидерландов (DUAL_RU_EU: 152-ФЗ + GDPR, 243-ФЗ + EU AI Act)';
    } else if (resolvedJurisdiction === 'UNKNOWN') {
      jurisdictionDisplay = 'UNKNOWN (Недостаточно данных для установления применимого законодательства)';
    }

    // Подбор официальных источников в зависимости от юрисдикции
    let sources: LegalOfficialSource[] = [];
    if (params.officialSources && params.officialSources.length > 0) {
      sources = params.officialSources;
    } else {
      if (resolvedJurisdiction === 'RU') {
        sources = OFFICIAL_PRIMARY_SOURCES.filter(s => s.url.includes('gov.ru') || s.url.includes('spdx.org'));
      } else if (resolvedJurisdiction === 'EU_NL') {
        sources = OFFICIAL_PRIMARY_SOURCES.filter(s => s.url.includes('europa.eu') || s.url.includes('.nl') || s.url.includes('spdx.org'));
      } else {
        sources = OFFICIAL_PRIMARY_SOURCES.slice(0, 5);
      }
    }

    let verdict: LegalGateStatus = 'APPROVED';
    if (params.riskLevel === 'RED') {
      verdict = 'BLOCKED_RED';
    } else if (params.riskLevel === 'AMBER') {
      verdict = 'NEEDS_REVIEW_AMBER';
    } else if (params.riskLevel === 'UNKNOWN') {
      verdict = 'INSUFFICIENT_DATA_UNKNOWN';
    }

    // Если юрисдикция UNKNOWN, запрещено гадать
    let remediation = params.recommendedRemediation;
    let consequences = params.potentialConsequences;
    if (resolvedJurisdiction === 'UNKNOWN') {
      if (!remediation) {
        remediation = 'Предоставить сведения по 10 критериям юрисдикции (место регистрации, резидентство основателей, сервера, целевая аудитория, валюта расчетов) перед правовой оценкой. Гадание исключено.';
      }
      if (!consequences) {
        consequences = 'Неопределённость правового статуса проекта и невозможность корректного применения защитных механизмов.';
      }
    }

    const assessment: LegalAssessment = {
      projectAndFeature: params.projectAndFeature,
      jurisdiction: jurisdictionDisplay,
      applicableNorms: params.applicableNorms,
      identifiedRisks: params.identifiedRisks,
      riskLevel: params.riskLevel,
      officialSources: sources,
      mechanismOfNonCompliance: params.mechanismOfNonCompliance,
      potentialConsequences: consequences,
      recommendedRemediation: remediation,
      humanCounselRequirement: params.humanCounselRequirement || (params.riskLevel === 'RED' ? 'YES' : params.riskLevel === 'AMBER' ? 'RECOMMENDED' : 'NO'),
      verdict,
      safeScopeCanProceed: true // Non-blocking invariant: безопасные смежные задачи не блокируются
    };

    // Публикация события в EventBus
    try {
      const eventType = params.riskLevel === 'RED' 
        ? 'legal_gate.blocked' 
        : params.riskLevel === 'AMBER' || params.riskLevel === 'UNKNOWN'
        ? 'legal_gate.warning'
        : 'legal_gate.passed';

      eventBus.publish({
        type: eventType,
        source: 'INTERNAL_BRIDGE',
        task_id: params.taskId,
        agent_id: 'legal-compliance',
        data: {
          feature: assessment.projectAndFeature,
          jurisdiction: assessment.jurisdiction,
          riskLevel: assessment.riskLevel,
          verdict: assessment.verdict,
          norms: assessment.applicableNorms,
          safeScopeCanProceed: assessment.safeScopeCanProceed
        }
      });
    } catch (e) {
      console.error('[LegalGate] Error publishing legal event:', e);
    }

    return assessment;
  }
}

export const legalGateService = new LegalGateService();
