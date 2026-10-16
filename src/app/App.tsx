import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ChevronDown, LifeBuoy, Search, X } from 'lucide-react';
import logoUrl from '../assets/logo.svg';

type Language = 'en' | 'ru';
type Page = 'workflow' | 'tools' | 'lost';
type ViewMode = 'cards' | 'table';

const ACCENT = '#007a3b';
const pillBase = 'inline-flex items-center justify-center gap-2 px-4 min-h-[36px] pointer-coarse:min-h-[44px] rounded-full text-[0.875rem] font-medium transition-colors';
const pillLink = `${pillBase} hover:underline`;

interface MethodologyStep {
  title: string;
  description: string;
  link?: string;
}

interface ResourceLink {
  label: string;
  url: string;
}

interface Stage {
  number: string;
  title: string;
  subtitle: string;
  productExpectation: string;
  designerExpectation: string;
  result: string;
  resultLabel: string;
  productRole: string;
  designerRole: string;
  isCore?: boolean;
  coreLabel?: string;
  methodLabel?: string;
  methodology?: MethodologyStep[];
  resourceLink?: ResourceLink;
}

type Route =
  | { page: 'workflow'; view: ViewMode; stage: string | null }
  | { page: 'tools'; tool: string | null }
  | { page: 'lost'; section: string | null };

function detectLanguage(): Language {
  try {
    const saved = window.localStorage.getItem('lang');
    if (saved === 'ru' || saved === 'en') return saved;
  } catch { /* storage unavailable */ }
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function parseHash(hash: string): { route: Route; lang: Language | null } {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const langParam = new URLSearchParams(query).get('lang');
  const lang: Language | null = langParam === 'ru' || langParam === 'en' ? langParam : null;
  const [first, second] = path.split('/').filter(Boolean);
  if (first === 'tools') return { route: { page: 'tools', tool: second ?? null }, lang };
  if (first === 'lost') return { route: { page: 'lost', section: second ?? null }, lang };
  const stage = second && /^stage-0[1-6]$/.test(second) ? second.slice(6) : null;
  return { route: { page: 'workflow', view: second === 'table' ? 'table' : 'cards', stage }, lang };
}

interface AppCtx {
  language: Language;
  linkTo: (path: string) => string;
  navigate: (path: string) => void;
  openGlossary: (id?: string) => void;
}

const AppContext = createContext<AppCtx>({
  language: 'en',
  linkTo: p => `#/${p}`,
  navigate: () => {},
  openGlossary: () => {}
});
const useApp = () => useContext(AppContext);

interface GlossaryTerm {
  id: string;
  term: Record<Language, string>;
  match: string[];
  def: Record<Language, string>;
}

const glossary: GlossaryTerm[] = [
  {
    id: 'sp',
    term: { en: 'SP (story points)', ru: 'SP (story points)' },
    match: ['SP'],
    def: {
      en: 'Our unit for estimating a design task. 1 SP is about 4–5 hours, and one person has 16 SP per week. SP predict volume; do not convert them to hours.',
      ru: 'Наша единица оценки дизайн-задачи. 1 SP — примерно 4–5 часов, на человека приходится 16 SP в неделю. SP предсказывают объём, в часы их напрямую не переводят.'
    }
  },
  {
    id: 'core-stage',
    term: { en: 'Core stage', ru: 'Основной этап' },
    match: ['Core Stage', 'Основной этап'],
    def: {
      en: 'Stage 03, Concepts & Drafts. It sets our process apart from a usual one: the direction is chosen and agreed with the team before any final design.',
      ru: 'Этап 03, «Концепты и драфты». Он отличает наш процесс от обычного: направление выбирается и согласуется с командой до финального дизайна.'
    }
  },
  {
    id: 'progressive-jpg',
    term: { en: 'Progressive JPG', ru: 'Progressive JPG' },
    match: ['Progressive JPG'],
    def: {
      en: 'Our method for stage 03. The design gets sharper in passes (block diagram, page wireframes, AI draft), like a progressive JPG loading from blurry to sharp.',
      ru: 'Наш метод для этапа 03. Дизайн проясняется проходами (блок-схема, схемы страниц, AI-драфт), как progressive JPG загружается от размытого к чёткому.'
    }
  },
  {
    id: 'soft-glass',
    term: { en: 'Soft Glass', ru: 'Soft Glass' },
    match: ['Soft Glass'],
    def: {
      en: 'Our 3D illustration style: one isolated object made of frosted translucent glass or glossy jelly acrylic, with glowing edges and soft studio light. The main colour is brand green #009345.',
      ru: 'Наш стиль 3D-иллюстраций: один изолированный объект из матового прозрачного стекла или глянцевого акрила, со светящимися краями и мягким студийным светом. Основной цвет — брендовый зелёный #009345.'
    }
  },
  {
    id: 'maestro',
    term: { en: 'Maestro', ru: 'Maestro' },
    match: [],
    def: {
      en: 'Our AI product assistant on top of Claude Code. It takes a feature from research to a spec, wireframes and published tasks.',
      ru: 'Наш AI-ассистент для продукта поверх Claude Code. Ведёт фичу от ресерча до спеки, вайрфреймов и опубликованных задач.'
    }
  },
  {
    id: 'lane',
    term: { en: 'Studio lane', ru: 'Лейн (lane)' },
    match: [],
    def: {
      en: 'One track of Maestro Studio for one kind of UI: mobile, desktop, cadmin, store, general or product. Each lane has its own command, for example /studio-mobile.',
      ru: 'Отдельная дорожка Maestro Studio под один тип интерфейса: mobile, desktop, cadmin, store, general или product. У каждой своя команда, например /studio-mobile.'
    }
  },
  {
    id: 'ds-summer-2025',
    term: { en: 'DS cTrader Summer 2025', ru: 'DS cTrader Summer 2025' },
    match: [],
    def: {
      en: 'The design system that ships in cTrader. The source of truth for product tasks.',
      ru: 'Дизайн-система, которая реально используется в cTrader. Источник правды для продуктовых задач.'
    }
  },
  {
    id: 'atlas',
    term: { en: 'Atlas', ru: 'Atlas' },
    match: [],
    def: {
      en: 'Our new design system, built for AI. It should match DS cTrader Summer 2025 but has drifted in places. If they differ, trust Summer 2025 and tell the team.',
      ru: 'Наша новая дизайн-система, заточенная под AI. Должна повторять Summer 2025, но местами уже разъехалась. Видишь расхождение — считай правильным Summer 2025 и скажи команде.'
    }
  },
  {
    id: 'jtbd',
    term: { en: 'JTBD', ru: 'JTBD' },
    match: ['JTBD'],
    def: {
      en: 'Jobs To Be Done. Our Figma files are organised by JTBD scenarios, for example Discovery or Trading from Watchlist.',
      ru: 'Jobs To Be Done. Файлы в Figma организованы по JTBD-сценариям, например Discovery или Trading from Watchlist.'
    }
  },
  {
    id: 'cadmin',
    term: { en: 'cAdmin', ru: 'cAdmin' },
    match: ['cAdmin'],
    def: {
      en: 'cTrader Admin: the back-office for brokers.',
      ru: 'cTrader Admin: брокерский бэк-офис.'
    }
  },
  {
    id: 'white-label',
    term: { en: 'White-label', ru: 'White-label' },
    match: ['white-label'],
    def: {
      en: 'cTrader under a broker’s own brand: its logo, colours and icons on every platform.',
      ru: 'cTrader под собственным брендом брокера: его логотип, цвета и иконки на каждой платформе.'
    }
  }
];

const glossaryMatchToId = new Map<string, string>();
glossary.forEach(g => g.match.forEach(m => glossaryMatchToId.set(m.toLowerCase(), g.id)));
const glossaryPattern = new RegExp(
  `(?<![A-Za-z])(${[...glossaryMatchToId.keys()]
    .sort((a, b) => b.length - a.length)
    .map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})(?![A-Za-z])`,
  'gi'
);

function Term({ id, children }: { id: string; children: ReactNode }) {
  const { language, openGlossary } = useApp();
  const entry = glossary.find(g => g.id === id);
  if (!entry) return <>{children}</>;
  return (
    <span className="relative group inline-block">
      <button
        type="button"
        onClick={() => openGlossary(id)}
        className="cursor-help"
        style={{
          background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit',
          letterSpacing: 'inherit', textTransform: 'inherit',
          textDecoration: 'underline dotted', textUnderlineOffset: 3
        }}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-200 absolute z-40 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 max-w-[80vw] rounded-xl bg-[#1d1d1f] text-white p-3 shadow-lg text-left normal-case font-normal"
        style={{ fontSize: '0.875rem', lineHeight: 1.45, letterSpacing: 'normal' }}
      >
        {entry.def[language]}
      </span>
    </span>
  );
}

function Gloss({ children }: { children: string }) {
  const parts: ReactNode[] = [];
  const seen = new Set<string>();
  let last = 0;
  for (const m of children.matchAll(glossaryPattern)) {
    const id = glossaryMatchToId.get(m[1].toLowerCase());
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const start = m.index ?? 0;
    parts.push(children.slice(last, start));
    parts.push(<Term key={start} id={id}>{m[1]}</Term>);
    last = start + m[1].length;
  }
  parts.push(children.slice(last));
  return <>{parts}</>;
}

const glossaryText = {
  title: { en: 'Glossary', ru: 'Глоссарий' },
  search: { en: 'Search a term', ru: 'Найти термин' },
  empty: { en: 'Nothing found', ru: 'Ничего не найдено' },
  close: { en: 'Close', ru: 'Закрыть' }
};

function GlossaryPanel({ open, focusId, onClose }: { open: boolean; focusId: string | null; onClose: () => void }) {
  const { language } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !focusId) return;
    const timer = setTimeout(() => document.getElementById(`gloss-${focusId}`)?.scrollIntoView({ block: 'center' }), 300);
    return () => clearTimeout(timer);
  }, [open, focusId]);

  const q = query.trim().toLowerCase();
  const items = glossary.filter(
    g => !q || g.term[language].toLowerCase().includes(q) || g.def[language].toLowerCase().includes(q)
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="glossary-overlay"
          className="fixed inset-0 z-[60] bg-black/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}
      {open && (
        <motion.aside
          key="glossary-panel"
          role="dialog"
          aria-label={glossaryText.title[language]}
          className="fixed top-0 right-0 bottom-0 z-[70] w-[26rem] max-w-full bg-white shadow-[-8px_0_48px_rgba(0,0,0,0.12)] flex flex-col"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              {glossaryText.title[language]}
            </h2>
            <button
              onClick={onClose}
              aria-label={glossaryText.close[language]}
              className="w-11 h-11 rounded-full flex items-center justify-center text-[#6e6e73] hover:bg-[#f5f5f7] transition-colors"
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-6 pb-4">
            <label className="flex items-center gap-2.5 rounded-xl bg-[#f5f5f7] px-4 py-2.5">
              <Search size={16} className="text-[#6e6e73] flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={glossaryText.search[language]}
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: '1rem', border: 'none' }}
              />
            </label>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {items.length === 0 && (
              <p className="px-2 py-6 text-[#6e6e73]" style={{ fontSize: '1rem' }}>{glossaryText.empty[language]}</p>
            )}
            {items.map(g => (
              <div
                key={g.id}
                id={`gloss-${g.id}`}
                className="rounded-2xl p-4 transition-colors duration-300"
                style={{ backgroundColor: focusId === g.id ? '#f5f5f7' : 'transparent' }}
              >
                <p className="font-semibold mb-1" style={{ fontSize: '1rem' }}>{g.term[language]}</p>
                <p className="text-[#6e6e73] leading-relaxed" style={{ fontSize: '0.875rem' }}>{g.def[language]}</p>
              </div>
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [language, setLanguage] = useState<Language>(() => parseHash(window.location.hash).lang ?? detectLanguage());
  const [glossaryState, setGlossaryState] = useState<{ open: boolean; focusId: string | null }>({ open: false, focusId: null });
  const [scrollTick, setScrollTick] = useState(0);
  const reduceMotion = useReducedMotion();
  const { route } = parseHash(hash);

  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash);
      const { lang } = parseHash(window.location.hash);
      if (lang) setLanguage(lang);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const linkTo = useCallback((path: string) => `#/${path}${language === 'ru' ? '?lang=ru' : ''}`, [language]);

  const navigate = useCallback((path: string) => {
    const target = linkTo(path);
    if (window.location.hash === target) setScrollTick(t => t + 1);
    else window.location.hash = target;
  }, [linkTo]);

  const changeLanguage = (l: Language) => {
    setLanguage(l);
    try { window.localStorage.setItem('lang', l); } catch { /* storage unavailable */ }
    const [path] = window.location.hash.replace(/^#/, '').split('?');
    window.history.replaceState(null, '', `#${path || '/'}${l === 'ru' ? '?lang=ru' : ''}`);
  };

  const openGlossary = useCallback((id?: string) => setGlossaryState({ open: true, focusId: id ?? null }), []);
  const closeGlossary = useCallback(() => setGlossaryState(s => ({ ...s, open: false })), []);

  const scrollTarget =
    route.page === 'workflow' && route.stage ? `stage-${route.stage}`
    : route.page === 'tools' && route.tool && route.tool !== 'sp-calculator' ? `tool-${route.tool}`
    : route.page === 'lost' && route.section ? `lost-${route.section}`
    : null;
  const routeKey = hash.split('?')[0];

  useEffect(() => {
    if (!scrollTarget) {
      window.scrollTo(0, 0);
      return;
    }
    const timer = setTimeout(() => {
      document.getElementById(scrollTarget)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(timer);
  }, [routeKey, scrollTick]);

  const setViewMode = (m: ViewMode) => navigate(m === 'table' ? 'workflow/table' : 'workflow');
  const calcOpen = route.page === 'tools' && route.tool === 'sp-calculator';

  return (
    <AppContext.Provider value={{ language, linkTo, navigate, openGlossary }}>
      <MotionConfig reducedMotion="user">
      <div className="bg-[#fbfbfd] text-[#1d1d1f] overflow-x-hidden" style={{ fontFamily: "'Work Sans', sans-serif" }}>
        <TopBar language={language} setLanguage={changeLanguage} page={route.page} />
        {route.page === 'workflow' && route.view === 'cards' && (
          <Hero language={language} viewMode="cards" setViewMode={setViewMode} />
        )}
        {route.page === 'workflow' && <Workflow language={language} viewMode={route.view} setViewMode={setViewMode} />}
        {route.page === 'tools' && (
          calcOpen
            ? <SpCalculator language={language} onBack={() => navigate('tools')} />
            : <ToolsView language={language} onStage={n => navigate(`workflow/stage-${n}`)} onOpenCalculator={() => navigate('tools/sp-calculator')} />
        )}
        {route.page === 'lost' && <LostView language={language} />}
        {!calcOpen && <Footer language={language} />}
        <GlossaryPanel open={glossaryState.open} focusId={glossaryState.focusId} onClose={closeGlossary} />
      </div>
      </MotionConfig>
    </AppContext.Provider>
  );
}

const lostText = {
  nav: { en: "I'm lost", ru: 'Я потерялся' },
  title: { en: "I'm lost", ru: 'Я потерялся' },
  subtitle: {
    en: 'Where things live in the design team, and where to go when you are stuck.',
    ru: 'Где что лежит в дизайн-команде и куда идти, если запутался.'
  },
  termsTitle: { en: 'Terms', ru: 'Термины' },
  termsIntro: {
    en: 'Short definitions of the words we use. Underlined words on other pages show the same definitions.',
    ru: 'Короткие определения наших слов. Подчёркнутые слова на других страницах показывают те же определения.'
  }
};

function TopBar({
  language, setLanguage, page
}: {
  language: Language;
  setLanguage: (l: Language) => void;
  page: Page;
}) {
  const { linkTo, navigate } = useApp();
  const links: { page: Page; label: Record<Language, string> }[] = [
    { page: 'workflow', label: { en: 'AI Workflow', ru: 'AI-воркфлоу' } },
    { page: 'tools',    label: { en: 'Tools',       ru: 'Инструменты' } },
  ];
  const lostActive = page === 'lost';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6"
      style={{ background: 'rgba(251,251,253,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(210,210,215,0.5)' }}
    >
      <div className="max-w-7xl mx-auto h-16 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-4">
        <a
          href={linkTo('workflow')}
          onClick={e => { e.preventDefault(); navigate('workflow'); }}
          aria-label="SW Design Team"
          className="inline-flex items-center gap-2.5 min-h-[44px] justify-self-start"
        >
          <img src={logoUrl} alt="SW Design Team" className="h-8 sm:h-9 w-auto max-w-none shrink-0 block" />
        </a>

        <nav className="flex gap-1 justify-self-center">
          {links.map(l => {
            const active = page === l.page;
            return (
              <a
                key={l.page}
                href={linkTo(l.page)}
                onClick={e => { e.preventDefault(); navigate(l.page); }}
                className={`relative px-2 sm:px-4 min-h-[44px] inline-flex items-center whitespace-nowrap transition-colors text-[0.875rem] sm:text-[1rem] ${
                  active ? 'text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
                style={{ fontWeight: active ? 600 : 500 }}
              >
                {l.label[language]}
                {active && <span className="absolute left-2 right-2 sm:left-4 sm:right-4 -bottom-[10px] h-0.5 rounded-full bg-[#1d1d1f]" />}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 justify-self-end">
          <a
            href={linkTo('lost')}
            onClick={e => { e.preventDefault(); navigate('lost'); }}
            aria-label={lostText.nav[language]}
            className={`relative px-2 sm:px-3 min-h-[44px] inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              lostActive ? 'text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
            }`}
            style={{ fontSize: '1rem', fontWeight: lostActive ? 600 : 500 }}
          >
            <LifeBuoy size={18} />
            <span className="hidden md:inline">{lostText.nav[language]}</span>
            {lostActive && <span className="absolute left-2 right-2 sm:left-3 sm:right-3 -bottom-[10px] h-0.5 rounded-full bg-[#1d1d1f]" />}
          </a>
          <button
            onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
            className="h-11 px-1.5 sm:px-3 rounded-full flex items-center gap-1 hover:bg-white/80 transition-colors"
            aria-label={language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
          >
            <span className="sm:hidden" style={{ color: '#1d1d1f' }}>{language === 'en' ? 'RU' : 'EN'}</span>
            <span className="hidden sm:inline" style={{ color: language === 'en' ? '#1d1d1f' : '#6e6e73' }}>EN</span>
            <span className="hidden sm:inline" aria-hidden style={{ color: '#6e6e73' }}>/</span>
            <span className="hidden sm:inline" style={{ color: language === 'ru' ? '#1d1d1f' : '#6e6e73' }}>RU</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function ViewToggle({
  language, viewMode, setViewMode
}: {
  language: Language;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}) {
  const options: { key: ViewMode; label: Record<Language, string> }[] = [
    { key: 'cards', label: { en: 'Cards', ru: 'Карточки' } },
    { key: 'table', label: { en: 'Table', ru: 'Таблица' } },
  ];
  return (
    <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => setViewMode(o.key)}
          className={`px-4 min-h-[36px] pointer-coarse:min-h-[44px] rounded-full transition-all duration-300 ${
            viewMode === o.key ? 'bg-[#1d1d1f] text-white' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
          }`}
          style={{ fontSize: '0.875rem', fontWeight: 500 }}
        >
          {o.label[language]}
        </button>
      ))}
    </div>
  );
}

const translations = {
  hero: {
    title: {
      en: <>AI-First<br />Design Workflow.</>,
      ru: <>AI-First<br />Design Workflow.</>
    }
  },
  workflow: {
    viewMode: {
      cards: { en: 'Cards', ru: 'Карточки' },
      table: { en: 'Table', ru: 'Таблица' }
    }
  },
  footer: {
    copyright: {
      en: '2026',
      ru: '2026'
    }
  }
};

const workflowLede: Record<Language, string> = {
  en: 'How a feature moves from brief to design review: what product and design expect from each other at every stage, and where AI helps.',
  ru: 'Как фича проходит путь от брифа до дизайн-ревью: что продакт и дизайн ждут друг от друга на каждом этапе и где помогает AI.'
};

function Hero({
  language, viewMode, setViewMode
}: {
  language: Language;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      style={reduceMotion ? undefined : { opacity, scale }}
      className="min-h-screen flex flex-col items-center justify-center px-6 relative pt-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-5xl"
      >
        <h1
          className="mb-6"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: '-0.02em'
          }}
        >
          {translations.hero.title[language]}
        </h1>
        <p className="text-[#6e6e73] mx-auto max-w-xl" style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>
          {workflowLede[language]}
        </p>
        <div className="mt-8">
          <ViewToggle language={language} viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="absolute bottom-12"
      >
        <div className="w-6 h-10 border-2 border-[#1d1d1f] rounded-full flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1 h-2 bg-[#1d1d1f] rounded-full"
          />
        </div>
      </motion.div>
    </motion.section>
  );
}

const stagesData: Record<Language, Stage[]> = {
  en: [
    {
      number: '01',
      title: 'Brief',
      subtitle: 'Task Definition',
      productExpectation: 'Problem, goals, and constraints aligned.',
      designerExpectation: 'Scope and constraints understood.',
      result: 'Aligned brief. Shared understanding of the problem and scope.',
      resultLabel: 'Result',
      productRole: 'Product Analyst',
      designerRole: 'Designer'
    },
    {
      number: '02',
      title: 'Research',
      subtitle: 'Information Search',
      productExpectation: 'Problem explored. Key options outlined.',
      designerExpectation: 'Options explored. Feasible directions identified.',
      result: 'Research summary. Feasible directions identified and documented.',
      resultLabel: 'Result',
      methodLabel: 'AI-assisted steps',
      productRole: 'Product Analyst',
      designerRole: 'Designer',
      methodology: [
        {
          title: 'AI Maestro',
          description: 'Run the task statement through AI Maestro to surface key questions and gaps.',
          link: 'https://ctrader-maestro.pages.dev/'
        },
        {
          title: 'Sync with analyst or PM',
          description: 'Discuss results and task understanding with an analyst or product manager.'
        }
      ]
    },
    {
      number: '03',
      title: 'Concepts & Drafts',
      subtitle: 'Core Work',
      productExpectation: 'Options reviewed. Direction selected.',
      designerExpectation: 'Options tested. One direction chosen.',
      result: 'Approved direction. Draft reviewed and agreed with the team.',
      resultLabel: 'Result',
      productRole: 'Product Analyst',
      designerRole: 'Designer',
      isCore: true,
      coreLabel: 'Core Stage',
      methodLabel: 'Method: Progressive JPG',
      methodology: [
        {
          title: 'Block diagrams',
          description: 'Flow & transition maps — understand scope and all interconnections before any visual work.'
        },
        {
          title: 'Page wireframes',
          description: 'Low-fi page layouts where transitions are obvious — Balsamiq level of fidelity.'
        },
        {
          title: 'AI-draft',
          description: 'Feed the design system + step 2 output to AI. Review the AI result with the team.',
          link: 'https://ctrader-maestro.pages.dev/'
        }
      ]
    },
    {
      number: '04',
      title: 'Design',
      subtitle: 'Main Scenario Mockups',
      productExpectation: 'Flows and requirements clarified.',
      designerExpectation: 'Flows and screens refined. Ready for handoff.',
      result: 'Final mockups for the main user flow. Ready for handoff.',
      resultLabel: 'Result',
      productRole: 'Product Analyst',
      designerRole: 'Designer',
      resourceLink: { label: 'Illustration guide — setup & prompts', url: 'https://yt.ctrader.com/articles/DSGN-A-4' },
      methodLabel: 'AI-assisted steps',
      methodology: [
        {
          title: 'Illustrations',
          description: 'When a screen needs a visual, ask SW Art Director for an on-brand Soft Glass 3D illustration. Pick one option from the light-theme grid, then request the dark variant.',
          link: 'https://chatgpt.com/agents/a/agt_69faf78b0b4481919b91fc494cc7032d'
        },
        {
          title: 'Motion design',
          description: 'After the main flow is done: define transitions and animations for the key screens. Export specs for the developer.',
          link: 'https://motion-atlas-web.vercel.app/'
        }
      ]
    },
    {
      number: '05',
      title: 'Handoff to Dev',
      subtitle: '',
      productExpectation: 'Specs approved. Ready for build.',
      designerExpectation: 'Specs and assets ready. Support during build.',
      result: 'All scenarios and corner cases covered. Specs and assets handed off. Support started.',
      resultLabel: 'Result',
      productRole: 'Product Analyst',
      designerRole: 'Designer'
    },
    {
      number: '06',
      title: 'Design Review',
      subtitle: 'Quality Control',
      productExpectation: 'Implementation reviewed against specs.',
      designerExpectation: 'Build reviewed. Discrepancies logged and resolved.',
      result: 'Build approved. Quality confirmed. Task closed.',
      resultLabel: 'Result',
      productRole: 'Product Analyst',
      designerRole: 'Designer',
      methodLabel: 'How to conduct a design review',
      methodology: [
        {
          title: 'Open mockup and implementation',
          description: 'Compare the Figma design with the interface in the test environment.'
        },
        {
          title: 'Check visual alignment',
          description: 'Spacing, sizes, typography, colours, icons, component states, and responsiveness.'
        },
        {
          title: 'Check behaviour',
          description: 'Interactions, transitions, loading states, errors, and edge cases.'
        },
        {
          title: 'Log discrepancies',
          description: 'Attach screenshots, describe the issue and the expected result.'
        },
        {
          title: 'Create fix tasks',
          description: 'Hand off the found issues to the developer.'
        },
        {
          title: 'Verify fixes',
          description: 'Re-check the implementation against the mockup.'
        },
        {
          title: 'Confirm the result',
          description: 'Close comments after review or document remaining issues.'
        }
      ]
    }
  ],
  ru: [
    {
      number: '01',
      title: 'Бриф',
      subtitle: 'Постановка задачи',
      productExpectation: 'Согласованы проблема, цели и ограничения.',
      designerExpectation: 'Понятны рамки и ограничения.',
      result: 'Согласованный бриф. Общее понимание задачи и скоупа.',
      resultLabel: 'Результат',
      productRole: 'Продакт-аналитик',
      designerRole: 'Дизайнер'
    },
    {
      number: '02',
      title: 'Ресерч',
      subtitle: 'Поиск информации, исследование',
      productExpectation: 'Проблема изучена. Намечены варианты.',
      designerExpectation: 'Варианты изучены. Понятны реализуемые направления.',
      result: 'Саммари ресёрча. Зафиксированы реализуемые направления.',
      resultLabel: 'Результат',
      methodLabel: 'AI-шаги',
      productRole: 'Продакт-аналитик',
      designerRole: 'Дизайнер',
      methodology: [
        {
          title: 'AI Maestro',
          description: 'Прогнать постановку через AI Maestro — выявить ключевые вопросы и пробелы.',
          link: 'https://ctrader-maestro.pages.dev/'
        },
        {
          title: 'Синк с аналитиком или продактом',
          description: 'Обсудить с аналитиком или продактом результаты и понимание задачи.'
        }
      ]
    },
    {
      number: '03',
      title: 'Концепты и драфты',
      subtitle: 'Основная работа',
      productExpectation: 'Варианты рассмотрены. Выбрано направление.',
      designerExpectation: 'Варианты проверены. Выбрано решение.',
      result: 'Согласованное направление. Драфт обсуждён и принят командой.',
      resultLabel: 'Результат',
      productRole: 'Продакт-аналитик',
      designerRole: 'Дизайнер',
      isCore: true,
      coreLabel: 'Основной этап',
      methodLabel: 'Метод Progressive JPG:',
      methodology: [
        {
          title: 'Блок-схемы',
          description: 'Схема переходов — понять объём работы и взаимосвязи до любой визуализации.'
        },
        {
          title: 'Схемы страниц',
          description: 'Лоу-фай макеты с очевидными переходами — уровень Balsamiq.'
        },
        {
          title: 'AI-драфт',
          description: 'Скармливаем дизайн-систему + результат шага 2. Обсуждаем AI-результат с командой.',
          link: 'https://ctrader-maestro.pages.dev/'
        }
      ]
    },
    {
      number: '04',
      title: 'Дизайн',
      subtitle: 'Макеты основного сценария',
      productExpectation: 'Уточнены флоу и требования.',
      designerExpectation: 'Флоу и экраны доработаны. Готово к передаче.',
      result: 'Финальные макеты основного пользовательского флоу. Готово к передаче.',
      resultLabel: 'Результат',
      productRole: 'Продакт-аналитик',
      designerRole: 'Дизайнер',
      resourceLink: { label: 'Гайд по иллюстрациям — настройка и промпты', url: 'https://yt.ctrader.com/articles/DSGN-A-4' },
      methodLabel: 'AI-шаги',
      methodology: [
        {
          title: 'Иллюстрации',
          description: 'Если экрану нужен визуал, попросить SW Art Director сгенерировать 3D-иллюстрацию в стиле Soft Glass. Выбрать вариант из сетки в светлой теме, затем запросить тёмный.',
          link: 'https://chatgpt.com/agents/a/agt_69faf78b0b4481919b91fc494cc7032d'
        },
        {
          title: 'Motion design',
          description: 'После основного флоу: определить переходы и анимации для ключевых экранов. Подготовить спеки для разработчика.',
          link: 'https://motion-atlas-web.vercel.app/'
        }
      ]
    },
    {
      number: '05',
      title: 'Передача в разработку',
      subtitle: '',
      productExpectation: 'Спеки согласованы. Готово к разработке.',
      designerExpectation: 'Спеки и ассеты готовы. Поддержка разработки.',
      result: 'Проработаны все сценарии и корнер-кейс. Спеки и ассеты переданы в разработку. Начата поддержка.',
      resultLabel: 'Результат',
      productRole: 'Продакт-аналитик',
      designerRole: 'Дизайнер'
    },
    {
      number: '06',
      title: 'Дизайн-ревью',
      subtitle: 'Контроль качества',
      productExpectation: 'Реализация проверена по спекам.',
      designerExpectation: 'Разработка проверена. Расхождения зафиксированы и устранены.',
      result: 'Разработка принята. Качество подтверждено. Задача закрыта.',
      resultLabel: 'Результат',
      productRole: 'Продакт-аналитик',
      designerRole: 'Дизайнер',
      methodLabel: 'Как проводить дизайн-ревью',
      methodology: [
        {
          title: 'Открыть макет и реализацию',
          description: 'Сравнить дизайн в Figma с интерфейсом в тестовой среде.'
        },
        {
          title: 'Проверить визуальное соответствие',
          description: 'Отступы, размеры, типографика, цвета, иконки, состояния компонентов и адаптивность.'
        },
        {
          title: 'Проверить поведение',
          description: 'Взаимодействия, переходы, состояния загрузки, ошибки и граничные сценарии.'
        },
        {
          title: 'Зафиксировать расхождения',
          description: 'Приложить скриншоты, описать проблему и ожидаемый результат.'
        },
        {
          title: 'Создать задачи на исправление',
          description: 'Передать разработчику найденные проблемы.'
        },
        {
          title: 'Проверить исправления',
          description: 'Повторно сверить реализацию с макетом.'
        },
        {
          title: 'Подтвердить результат',
          description: 'Закрыть замечания после проверки или зафиксировать оставшиеся проблемы.'
        }
      ]
    }
  ]
};

interface Tool {
  id: string;
  name: string;
  status: 'live' | 'wip';
  group: 'workflow' | 'other';
  description: Record<Language, string>;
  stages?: string[];
  commands?: string[];
  links?: { label: Record<Language, string>; url: string }[];
  internal?: 'calculator';
}

const toolsText = {
  title: { en: 'AI Tools', ru: 'AI-инструменты' },
  subtitle: {
    en: 'What we built and set up with AI — with links, so nobody has to search again.',
    ru: 'Что мы сделали и настроили через AI — со ссылками, чтобы не искать заново.'
  },
  live: { en: 'Live', ru: 'Работает' },
  wip: { en: 'In progress', ru: 'В работе' },
  stage: { en: 'Stage', ru: 'Этап' },
  groupWorkflow: { en: 'Used in the workflow', ru: 'В воркфлоу' },
  groupOther: { en: 'Beyond the workflow', ru: 'Вне воркфлоу' },
  openCalculator: { en: 'Open calculator', ru: 'Открыть калькулятор' }
};

const toolsData: Tool[] = [
  {
    id: 'maestro',
    name: 'Maestro',
    status: 'live',
    group: 'workflow',
    stages: ['02', '03'],
    description: {
      en: 'AI product assistant on top of Claude Code, connected to YouTrack, GitLab, Amplitude and Figma. Takes a feature from research to a spec, wireframes and published tasks. Also builds landing pages, slides and decks.',
      ru: 'AI-ассистент поверх Claude Code с интеграциями YouTrack, GitLab, Amplitude и Figma. Ведёт фичу от ресерча до спеки, вайрфреймов и опубликованных задач. Также собирает лендинги, слайды и презентации.'
    },
    commands: ['/cortana', '/research', '/wireframe-*', '/studio-general', '/publish'],
    links: [{ label: { en: 'Open Maestro', ru: 'Открыть Maestro' }, url: 'https://ctrader-maestro.pages.dev/' }]
  },
  {
    id: 'art-director',
    name: 'SW Art Director',
    status: 'live',
    group: 'workflow',
    stages: ['04'],
    description: {
      en: 'ChatGPT agent that generates on-brand 3D illustrations in the Soft Glass style: product visuals, empty states, onboarding, marketing. It always shows a grid of light options first and makes the dark variant after you approve one.',
      ru: 'ChatGPT-агент, который генерирует 3D-иллюстрации в фирменном стиле Soft Glass: продуктовые визуалы, empty states, онбординг, маркетинг. Сначала всегда сетка вариантов в светлой теме, тёмный вариант — после выбора одного.'
    },
    links: [
      { label: { en: 'Workspace agent (corporate)', ru: 'Workspace-агент (корпоративный)' }, url: 'https://chatgpt.com/agents/a/agt_69faf78b0b4481919b91fc494cc7032d' },
      { label: { en: 'GPT (personal account)', ru: 'GPT (личный аккаунт)' }, url: 'https://chatgpt.com/g/g-69f2fef054088191be660b04f8998dbb-sw-art-director' },
      { label: { en: 'Guide', ru: 'Гайд' }, url: 'https://yt.ctrader.com/articles/DSGN-A-4' }
    ]
  },
  {
    id: 'motion-atlas',
    name: 'Motion Atlas',
    status: 'live',
    group: 'workflow',
    stages: ['04'],
    description: {
      en: 'Our tool to configure animations, preview them and hand them off to development.',
      ru: 'Наш инструмент: настроить анимации, посмотреть на них и передать в разработку.'
    },
    links: [{ label: { en: 'Open Motion Atlas', ru: 'Открыть Motion Atlas' }, url: 'https://motion-atlas-web.vercel.app/' }]
  },
  {
    id: 'sp-calculator',
    name: 'SP Calculator',
    status: 'live',
    group: 'workflow',
    description: {
      en: 'Estimate a design task in story points (SP) by choosing which workflow stages it needs. 1 SP is about 4–5 hours; one person has 16 SP per week.',
      ru: 'Оценка дизайн-задачи в story points (SP) по нужным этапам воркфлоу. 1 SP — примерно 4–5 часов, на человека приходится 16 SP в неделю.'
    },
    internal: 'calculator'
  },
  {
    id: 'assets-generator',
    name: 'Broker Assets Generator',
    status: 'live',
    group: 'other',
    description: {
      en: 'One broker logo plus brand colours gives the full tree of 245 white-label assets for every cTrader platform, and a branded PDF deck for sales. From hours of manual work to about 4 minutes.',
      ru: 'Логотип брокера и брендовые цвета превращаются в 245 white-label ассетов для всех платформ cTrader и branded PDF-презентацию для sales. Вместо часов ручной работы — около 4 минут.'
    },
    links: [{ label: { en: 'Open generator', ru: 'Открыть генератор' }, url: 'https://assets-generator-prod.swdesign.workers.dev/login' }]
  },
  {
    id: 'studio-product',
    name: 'studio-product',
    status: 'live',
    group: 'other',
    description: {
      en: 'Converts competitor UI into the Spotware Design System and generates a working frontend.',
      ru: 'Конвертирует UI конкурентов в Spotware Design System и генерирует рабочий фронтенд.'
    },
    commands: ['/studio-product']
  },
  {
    id: 'studio-cadmin',
    name: 'studio-cadmin',
    status: 'wip',
    group: 'other',
    description: {
      en: 'Generates interfaces for products where a UX/UI mistake is cheap. Works reliably only for cTrader so far.',
      ru: 'Генерирует интерфейсы для продуктов с низкой ценой UX/UI-ошибки. Пока стабильно работает только для cTrader.'
    },
    commands: ['/studio-cadmin']
  },
  {
    id: 'design-system',
    name: 'AI-ready Design System',
    status: 'wip',
    group: 'other',
    description: {
      en: 'Our Design System prepared for AI tools such as Figma Make, so generated screens use real components.',
      ru: 'Наша Design System, подготовленная для AI-инструментов вроде Figma Make, чтобы сгенерированные экраны использовали настоящие компоненты.'
    },
    links: [{ label: { en: 'Open', ru: 'Открыть' }, url: 'https://ctdsgn.pages.dev/#/figma-make' }]
  }
];

function ToolCard({
  tool, index, language, onStage, onOpenCalculator
}: {
  tool: Tool;
  index: number;
  language: Language;
  onStage: (number: string) => void;
  onOpenCalculator: () => void;
}) {
  return (
    <motion.div
      id={`tool-${tool.id}`}
      style={{ scrollMarginTop: 120 }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 0.6, delay: (index % 2) * 0.08 }}
      className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col"
    >
      <div className="flex items-center gap-1.5 mb-3" style={{ fontSize: '0.875rem', fontWeight: 500, color: tool.status === 'live' ? ACCENT : '#6e6e73' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tool.status === 'live' ? ACCENT : '#c7c7cc' }} />
        {toolsText[tool.status][language]}
      </div>

      <h3 className="mb-2" style={{ fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
        {tool.name}
      </h3>
      <p className="text-[#6e6e73] leading-relaxed" style={{ fontSize: '1rem' }}>
        <Gloss>{tool.description[language]}</Gloss>
      </p>

      {tool.commands && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {tool.commands.map(c => (
            <code key={c} className="px-2 py-1 rounded-lg bg-[#f5f5f7] text-[#1d1d1f]" style={{ fontSize: '0.875rem', fontFamily: 'inherit' }}>{c}</code>
          ))}
        </div>
      )}

      {(tool.links || tool.internal || tool.stages) && (
        <div className="flex flex-wrap gap-2 mt-5">
          {tool.stages?.map(st => (
            <button
              key={st}
              onClick={() => onStage(st)}
              className={pillLink}
              style={{ backgroundColor: `${ACCENT}0d`, color: ACCENT, border: 'none', cursor: 'pointer' }}
            >
              {toolsText.stage[language]} {st} →
            </button>
          ))}
          {tool.internal === 'calculator' && (
            <button
              onClick={onOpenCalculator}
              className={pillLink}
              style={{ backgroundColor: `${ACCENT}0d`, color: ACCENT, border: 'none', cursor: 'pointer' }}
            >
              {toolsText.openCalculator[language]} →
            </button>
          )}
          {tool.links?.map(l => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className={pillLink}
              style={{ backgroundColor: `${ACCENT}0d`, color: ACCENT }}
            >
              {l.label[language]} ↗
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ToolsView({
  language, onStage, onOpenCalculator
}: {
  language: Language;
  onStage: (number: string) => void;
  onOpenCalculator: () => void;
}) {
  const groups = [
    { key: 'workflow', label: toolsText.groupWorkflow },
    { key: 'other', label: toolsText.groupOther },
  ] as const;

  return (
    <section className="px-6" style={{ paddingTop: 80, paddingBottom: 128 }}>
      <div className="max-w-5xl mx-auto">
        <h1
          className="mb-4 text-center"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.02em', paddingTop: '2rem'
          }}
        >
          {toolsText.title[language]}
        </h1>
        <p className="text-center text-[#6e6e73] mb-12 mx-auto max-w-xl" style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>
          {toolsText.subtitle[language]}
        </p>

        {groups.map(g => (
          <div key={g.key} className="mb-12 last:mb-0">
            <h2 className="mb-5" style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e73' }}>
              {g.label[language]}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {toolsData.filter(t => t.group === g.key).map((tool, i) => (
                <ToolCard
                  key={tool.name}
                  tool={tool}
                  index={i}
                  language={language}
                  onStage={onStage}
                  onOpenCalculator={onOpenCalculator}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface LostItem {
  label: Record<Language, string>;
  text: Record<Language, string>;
  to?: string;
  href?: string;
}

interface LostSection {
  id: string;
  title: Record<Language, string>;
  intro?: Record<Language, string>;
  items: LostItem[];
}

const T = (en: string, ru: string): Record<Language, string> => ({ en, ru });

const lostSections: LostSection[] = [
  {
    id: 'start',
    title: T('Start here', 'С чего начать'),
    items: [
      {
        label: T('How we run a task', 'Как мы ведём задачу'),
        text: T('Six stages from brief to design review, and what product and design expect at each one.', 'Шесть этапов от брифа до дизайн-ревью и что на каждом ждут продакт и дизайн.'),
        to: 'workflow'
      },
      {
        label: T('Concepts & Drafts', 'Концепты и драфты'),
        text: T('Stage 03 is the core of our process. This is where we differ from a usual one.', 'Этап 03 — ядро нашего процесса. Здесь мы отличаемся от обычного.'),
        to: 'workflow/stage-03'
      },
      {
        label: T('AI tools', 'AI-инструменты'),
        text: T('Everything we built and set up with AI, with links.', 'Всё, что мы сделали и настроили через AI, со ссылками.'),
        to: 'tools'
      },
      {
        label: T('Maestro', 'Maestro'),
        text: T('Our AI product assistant: research, spec, wireframes, published tasks.', 'Наш AI-ассистент для продукта: ресерч, спека, вайрфреймы, опубликованные задачи.'),
        to: 'tools/maestro'
      },
      {
        label: T('Estimate a task', 'Оценить задачу'),
        text: T('Count story points by the stages the task needs.', 'Посчитать story points по нужным задаче этапам.'),
        to: 'tools/sp-calculator'
      },
      {
        label: T('A word you do not know', 'Непонятное слово'),
        text: T('Short definitions of our terms, at the bottom of this page.', 'Короткие определения наших слов, внизу этой страницы.'),
        to: 'lost/terms'
      }
    ]
  },
  {
    id: 'tasks',
    title: T('Where tasks live', 'Где лежат задачи'),
    intro: T(
      'Tasks live in YouTrack, in the Design Team project group. Pick the project by direction.',
      'Задачи живут в YouTrack, в группе проектов Design Team. Проект выбирается по направлению.'
    ),
    items: [
      { label: T('MD', 'MD'), text: T('Design: Mobile. Mobile apps.', 'Design: Mobile. Мобильные приложения.'), href: 'https://yt.ctrader.com/projects/MD' },
      { label: T('DWM', 'DWM'), text: T('Design: cTrader Web, Mac, Windows. Everything about desktop cTrader.', 'Design: cTrader Web, Mac, Windows. Всё по десктопному cTrader.'), href: 'https://yt.ctrader.com/projects/DWM' },
      { label: T('DST', 'DST'), text: T('Design: Store. The web store and the store inside the app.', 'Design: Store. Веб-стор и стор внутри приложения.'), href: 'https://yt.ctrader.com/projects/DST' },
      { label: T('DC', 'DC'), text: T('Design: cAdmin. The broker back-office, and cBridge.', 'Design: cAdmin. Брокерский бэк-офис, там же cBridge.'), href: 'https://yt.ctrader.com/projects/DC' },
      { label: T('DSB', 'DSB'), text: T('Design: Sandbox. Our own broker.', 'Design: Sandbox. Наш собственный брокер.'), href: 'https://yt.ctrader.com/projects/DSB' },
      { label: T('XD', 'XD'), text: T('Branding Design. Branding and presentations only.', 'Branding Design. Только брендинг и подготовка презентаций.'), href: 'https://yt.ctrader.com/projects/XD' },
      { label: T('DSGN', 'DSGN'), text: T('The general design project and the team knowledge base.', 'Общий дизайнерский проект и база знаний команды.'), href: 'https://yt.ctrader.com/projects/DSGN/articles/DSGN-A-5/DSGN-Knowledge-Base' }
    ]
  },
  {
    id: 'files',
    title: T('Where files and design systems live', 'Где макеты и дизайн-системы'),
    items: [
      {
        label: T('Figma', 'Figma'),
        text: T('Team “Designers”. Each direction has its own folders: Mobile, Desktop & Web, macOS, Store, Marketing, cTrader Admin, Presentations.', 'Команда «Designers». У каждого направления свои папки: Mobile, Desktop & Web, macOS, Store, Marketing, cTrader Admin, Presentations.')
      },
      {
        label: T('DS cTrader Summer 2025', 'DS cTrader Summer 2025'),
        text: T('The design system that ships in cTrader. The source of truth for product tasks.', 'Дизайн-система, которая реально используется в cTrader. Источник правды для продуктовых задач.')
      },
      {
        label: T('Atlas', 'Atlas'),
        text: T('The new design system, built for AI. It has drifted from Summer 2025 in places. If they differ, trust Summer 2025 and tell the team.', 'Новая дизайн-система, заточенная под AI. Местами разъехалась с Summer 2025. Видишь расхождение — считай правильным Summer 2025 и скажи команде.')
      },
      {
        label: T('File structure', 'Структура файлов'),
        text: T('Figma files follow JTBD scenarios, for example Discovery or Trading from Watchlist.', 'Файлы в Figma организованы по JTBD-сценариям, например Discovery или Trading from Watchlist.')
      }
    ]
  },
  {
    id: 'ask',
    title: T('Where to ask', 'Где спросить'),
    items: [
      {
        label: T('Designers chat', 'Чат дизайнеров'),
        text: T('Telegram chat “Inside SW” for quick questions. Other work chats are added over time.', 'Telegram-чат «Inside SW» для быстрых вопросов. В остальные рабочие чаты добавляют постепенно.')
      },
      {
        label: T('Team lead', 'Руководитель команды'),
        text: T('A 1:1 once a week: scope, expectations and plans.', '1:1 раз в неделю: зона ответственности, ожидания, планы.')
      },
      {
        label: T('Friday team meeting', 'Пятничная встреча'),
        text: T('The whole team meets to brainstorm and discuss changes.', 'Общий сбор команды: штурмуем и обсуждаем изменения.')
      },
      {
        label: T('UX research', 'UX-исследования'),
        text: T('Ask the UX researcher for research and interface testing. This role is not in the designers chat, so write directly.', 'К UX-исследователю — за исследованиями и тестированием интерфейсов. Этой роли нет в чате дизайнеров, пиши напрямую.')
      },
      {
        label: T('AI questions', 'Вопросы про AI'),
        text: T('Ask the designer who leads most of the team’s AI activities.', 'К дизайнеру, который ведёт большинство AI-активностей команды.')
      },
      {
        label: T('Equipment and licences', 'Техника и лицензии'),
        text: T('Create a task in YouTrack, project NOC.', 'Задача в YouTrack, проект NOC.'),
        href: 'https://yt.ctrader.com/projects/NOC'
      },
      {
        label: T('HR portal', 'HR-портал'),
        text: T('PeopleForce: profile, leave, documents, performance.', 'PeopleForce: профиль, отпуска, документы, performance.')
      },
      {
        label: T('Retros and boards', 'Ретро и доски'),
        text: T('Miro.', 'Miro.')
      }
    ]
  },
  {
    id: 'maestro',
    title: T('Inside Maestro', 'Внутри Maestro'),
    items: [
      {
        label: T('Knowledge base', 'База знаний'),
        text: T('knowledge-base/: company, principles, users, team learnings.', 'knowledge-base/: company, principles, users, team-learnings.')
      },
      {
        label: T('Trading glossary', 'Глоссарий трейдинга'),
        text: T('knowledge-base/domain.md: trading terms. Useful in the first weeks.', 'knowledge-base/domain.md: трейдинговые термины. Пригодится в первые недели.')
      },
      {
        label: T('Component index', 'Каталог компонентов'),
        text: T('studio/.ds-index.md: every Atlas component with its props. The source of truth for props.', 'studio/.ds-index.md: все компоненты Atlas с пропсами. Источник правды по пропсам.')
      }
    ]
  },
  {
    id: 'refs',
    title: T('References', 'Референсы'),
    items: [
      { label: T('iOS', 'iOS'), text: T('Apple Human Interface Guidelines.', 'Apple Human Interface Guidelines.'), href: 'https://developer.apple.com/design/human-interface-guidelines/' },
      { label: T('Android', 'Android'), text: T('Material Design 3.', 'Material Design 3.'), href: 'https://m3.material.io/' },
      { label: T('Icons', 'Иконки'), text: T('Google Fonts Icons.', 'Google Fonts Icons.'), href: 'https://fonts.google.com/icons' }
    ]
  }
];

const lostCard = 'bg-white rounded-3xl p-8 md:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]';
const lostHeading = { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em' } as const;

function LostRow({ item, language }: { item: LostItem; language: Language }) {
  const { navigate, linkTo } = useApp();
  const linkStyle = { color: ACCENT };
  let label: ReactNode = <span>{item.label[language]}</span>;
  if (item.to) {
    const to = item.to;
    label = (
      <a href={linkTo(to)} onClick={e => { e.preventDefault(); navigate(to); }} className="hover:underline" style={linkStyle}>
        {item.label[language]} →
      </a>
    );
  } else if (item.href) {
    label = (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:underline" style={linkStyle}>
        {item.label[language]} ↗
      </a>
    );
  }
  return (
    <div className="grid md:grid-cols-[13rem_1fr] gap-1 md:gap-6">
      <div className="font-semibold" style={{ fontSize: '1rem' }}>{label}</div>
      <p className="text-[#6e6e73] leading-relaxed" style={{ fontSize: '1rem' }}>
        <Gloss>{item.text[language]}</Gloss>
      </p>
    </div>
  );
}

function LostView({ language }: { language: Language }) {
  return (
    <section className="px-6" style={{ paddingTop: 80, paddingBottom: 128 }}>
      <div className="max-w-4xl mx-auto">
        <h1
          className="mb-4 text-center"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.02em', paddingTop: '2rem'
          }}
        >
          {lostText.title[language]}
        </h1>
        <p className="text-center text-[#6e6e73] mb-12 mx-auto max-w-xl" style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>
          {lostText.subtitle[language]}
        </p>

        <div className="space-y-6">
          {lostSections.map(sec => (
            <motion.section
              key={sec.id}
              id={`lost-${sec.id}`}
              style={{ scrollMarginTop: 120 }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-5%' }}
              transition={{ duration: 0.6 }}
              className={lostCard}
            >
              <h2 style={lostHeading}>{sec.title[language]}</h2>
              {sec.intro && (
                <p className="mt-2 text-[#6e6e73] leading-relaxed" style={{ fontSize: '1rem' }}>{sec.intro[language]}</p>
              )}
              <div className="mt-6 space-y-5">
                {sec.items.map(it => <LostRow key={it.label.en} item={it} language={language} />)}
              </div>
            </motion.section>
          ))}

          <motion.section
            id="lost-terms"
            style={{ scrollMarginTop: 120 }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-5%' }}
            transition={{ duration: 0.6 }}
            className={lostCard}
          >
            <h2 style={lostHeading}>{lostText.termsTitle[language]}</h2>
            <p className="mt-2 text-[#6e6e73] leading-relaxed" style={{ fontSize: '1rem' }}>{lostText.termsIntro[language]}</p>
            <div className="mt-6 grid md:grid-cols-2 gap-x-10 gap-y-6">
              {glossary.map(g => (
                <div key={g.id}>
                  <p className="font-semibold mb-1" style={{ fontSize: '1rem' }}>{g.term[language]}</p>
                  <p className="text-[#6e6e73] leading-relaxed" style={{ fontSize: '1rem' }}>{g.def[language]}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </section>
  );
}

function Workflow({
  language, viewMode, setViewMode
}: {
  language: Language;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}) {
  const stages = stagesData[language];

  return (
    <section className="px-6" style={{ paddingTop: viewMode === 'cards' ? 0 : 80, paddingBottom: 128 }}>
      <div className="max-w-7xl mx-auto">
        {viewMode === 'cards' ? (
          <div className="space-y-48">
            {stages.map((stage, index) => (
              <StageCard key={index} stage={stage} index={index} />
            ))}
          </div>
        ) : (
          <TableView stages={stages} language={language} viewMode={viewMode} setViewMode={setViewMode} />
        )}
      </div>
    </section>
  );
}

function TableRow({ stage, index, isInView }: { stage: Stage; index: number; isInView: boolean }) {
  const [methodOpen, setMethodOpen] = useState(!!stage.isCore);
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="border-b border-[#d2d2d7] last:border-b-0 hover:bg-[#fbfbfd] transition-colors duration-200"
      style={stage.isCore ? { backgroundColor: `${ACCENT}05` } : {}}
    >
      <td className="p-6 align-top">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ACCENT }} />
          <span className="text-[#6e6e73]" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{stage.number}</span>
        </div>
        <h3 className="mb-1" style={{ fontFamily: "'Work Sans', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>{stage.title}</h3>
        {stage.subtitle && <p className="text-[#6e6e73]" style={{ fontSize: '1rem' }}>{stage.subtitle}</p>}
        {stage.isCore && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5" style={{ color: ACCENT, fontSize: '0.875rem', fontWeight: 600 }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
              <Gloss>{stage.coreLabel ?? ''}</Gloss>
            </span>
          </div>
        )}
      </td>
      <td className="p-6 align-top">
        <p className="text-[#1d1d1f] leading-relaxed" style={{ fontSize: '1rem' }}>{stage.productExpectation}</p>
      </td>
      <td className="p-6 align-top">
        <p className="text-[#1d1d1f] leading-relaxed" style={{ fontSize: '1rem' }}>{stage.designerExpectation}</p>
        {stage.resourceLink && (
          <a href={stage.resourceLink.url} target="_blank" rel="noopener noreferrer"
            className={`${pillLink} mt-3`}
            style={{ backgroundColor: `${ACCENT}0d`, color: ACCENT }}>
            {stage.resourceLink.label} ↗
          </a>
        )}
        {stage.methodology && (
          <div className="mt-4 pt-4 border-t border-[#d2d2d7]">
            <button
              onClick={() => setMethodOpen(v => !v)}
              className={`${pillBase} hover:opacity-75`}
              style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
            >
              {stage.methodLabel}
              <ChevronDown size={14} style={{ transform: methodOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }} />
            </button>
            {methodOpen && (
              <div className="space-y-2 mt-4">
                {stage.methodology.map((item, i) => (
                  <div key={i} className="rounded-2xl px-5 py-4" style={{ backgroundColor: `${ACCENT}0d` }}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-[0.875rem] font-semibold tabular-nums" style={{ color: ACCENT }}>{i + 1}</span>
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                          className="font-semibold hover:underline"
                          style={{ fontSize: '1rem', color: ACCENT }}>
                          {item.title} ↗
                        </a>
                      ) : (
                        <p className="font-semibold text-[#1d1d1f]" style={{ fontSize: '1rem' }}>{item.title}</p>
                      )}
                    </div>
                    <p className="text-[#6e6e73] leading-relaxed" style={{ fontSize: '0.875rem', paddingLeft: '1.375rem' }}><Gloss>{item.description}</Gloss></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </td>
      <td className="p-6 align-top">
        <p className="text-[#1d1d1f]" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{stage.result}</p>
      </td>
    </motion.tr>
  );
}

function TableView({
  stages, language, viewMode, setViewMode
}: {
  stages: Stage[];
  language: Language;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  const tableHeaders = {
    stage: { en: 'Stage', ru: 'Этап' },
    productAnalyst: { en: 'Product Analyst', ru: 'Продакт-аналитик' },
    designer: { en: 'Designer', ru: 'Дизайнер' },
    result: { en: 'Result', ru: 'Результат' }
  };

  return (
    <div>
      <h1
        className="mb-4 text-center"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 300,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: '#1d1d1f',
          paddingTop: '2rem'
        }}
      >
        {language === 'ru' ? 'AI-First Design Workflow' : 'AI-First Design Workflow'}
      </h1>
      <p className="text-center text-[#6e6e73] mx-auto max-w-xl" style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>
        {workflowLede[language]}
      </p>
      <div className="flex justify-center mt-6 mb-8">
        <ViewToggle language={language} viewMode={viewMode} setViewMode={setViewMode} />
      </div>
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="bg-white rounded-3xl shadow-[0_8px_48px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#d2d2d7]">
              <th className="text-left p-6 bg-gradient-to-b from-[#f5f5f7] to-white"
                style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', width: '18%' }}>
                {tableHeaders.stage[language]}
              </th>
              <th className="text-left p-6 bg-gradient-to-b from-[#f5f5f7] to-white"
                style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', width: '28%' }}>
                {tableHeaders.productAnalyst[language]}
              </th>
              <th className="text-left p-6 bg-gradient-to-b from-[#f5f5f7] to-white"
                style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', width: '32%' }}>
                {tableHeaders.designer[language]}
              </th>
              <th className="text-left p-6 bg-gradient-to-b from-[#f5f5f7] to-white"
                style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', width: '22%' }}>
                {tableHeaders.result[language]}
              </th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, index) => (
              <TableRow key={index} stage={stage} index={index} isInView={isInView} />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
    </div>
  );
}

function StageCard({ stage, index }: { stage: Stage; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const [methodOpen, setMethodOpen] = useState(!!stage.isCore);

  return (
    <motion.div
      ref={ref}
      id={`stage-${stage.number}`}
      style={{ scrollMarginTop: 160 }}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="grid md:grid-cols-2 gap-12 items-start"
    >
      <div className={`${index % 2 === 0 ? 'md:pr-16' : 'md:pl-16 md:order-2'}`}>
        <motion.div
          initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex items-baseline gap-6 mb-4">
            <span
              className="opacity-30"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(3rem, 5vw, 5rem)', fontWeight: 300, lineHeight: 1 }}
            >
              {stage.number}
            </span>
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                {stage.title}
              </h3>
              {stage.subtitle && (
                <p className="text-[#6e6e73] mt-1" style={{ fontSize: '1.125rem' }}>{stage.subtitle}</p>
              )}
              {stage.isCore && (
                <div className="mt-4">
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: ACCENT, fontSize: '0.875rem', fontWeight: 600 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                    <Gloss>{stage.coreLabel ?? ''}</Gloss>
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className={`${index % 2 === 0 ? '' : 'md:order-1'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          style={{ border: stage.isCore ? `1px solid ${ACCENT}30` : 'none' }}
        >
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                <h4 className="text-[#1d1d1f]" style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {stage.productRole}
                </h4>
              </div>
              <p className="text-[#1d1d1f] leading-relaxed" style={{ fontSize: '1rem' }}>
                {stage.productExpectation}
              </p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[#d2d2d7] to-transparent" />

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT, opacity: 0.6 }} />
                <h4 className="text-[#1d1d1f]" style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {stage.designerRole}
                </h4>
              </div>
              <p className="text-[#1d1d1f] leading-relaxed" style={{ fontSize: '1rem' }}>
                {stage.designerExpectation}
              </p>
              {stage.resourceLink && (
                <a
                  href={stage.resourceLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${pillLink} mt-3`}
                  style={{ backgroundColor: `${ACCENT}0d`, color: ACCENT }}
                >
                  {stage.resourceLink.label} ↗
                </a>
              )}
            </div>

            {stage.methodology && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-[#d2d2d7] to-transparent" />
                <div>
                  <button
                    onClick={() => setMethodOpen(v => !v)}
                    className={`${pillBase} hover:opacity-75`}
                    style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {stage.methodLabel}
                    <ChevronDown size={14} style={{ transform: methodOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }} />
                  </button>
                  {methodOpen && (
                    <div className="space-y-2 mt-4">
                      {stage.methodology.map((item, i) => (
                        <div key={i} className="rounded-2xl px-5 py-4" style={{ backgroundColor: `${ACCENT}0d` }}>
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <span className="text-[0.875rem] font-semibold tabular-nums" style={{ color: ACCENT }}>{i + 1}</span>
                            {item.link ? (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold hover:underline"
                                style={{ fontSize: '1rem', color: ACCENT }}
                              >
                                {item.title} ↗
                              </a>
                            ) : (
                              <p className="font-semibold text-[#1d1d1f]" style={{ fontSize: '1rem' }}>{item.title}</p>
                            )}
                          </div>
                          <p className="text-[#6e6e73] leading-relaxed" style={{ fontSize: '0.875rem', paddingLeft: '1.375rem' }}><Gloss>{item.description}</Gloss></p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-[#d2d2d7] to-transparent" />
            <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: `${ACCENT}0d` }}>
              <p className="mb-1.5" style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}>
                {stage.resultLabel}
              </p>
              <p className="text-[#1d1d1f] leading-relaxed" style={{ fontSize: '1rem' }}>
                {stage.result}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function SpCalculator({ language, onBack }: { language: Language; onBack: () => void }) {
  const [brief,      setBrief]      = useState(false);
  const [research,   setResearch]   = useState(false);
  const [draft,      setDraft]      = useState(false);
  const [mainFlow,   setMainFlow]   = useState(false);
  const [mainFlowSP, setMainFlowSP] = useState(10);
  const [prep,       setPrep]       = useState(false);
  const [review,     setReview]     = useState(false);

  const total =
    (brief    ? 0.5 : 0) +
    (research ? 2 : 0) +
    (draft    ? 6 : 0) +
    (mainFlow ? mainFlowSP : 0) +
    (prep     ? 4 : 0) +
    (review   ? 1 : 0);

  const fmt = (n: number) => (language === 'ru' ? String(n).replace('.', ',') : String(n));

  const reset = () => {
    setBrief(false); setResearch(false); setDraft(false); setMainFlow(false);
    setMainFlowSP(10);  setPrep(false);  setReview(false);
  };

  const t = {
    title:    { en: 'SP Calculator',                    ru: 'SP Calculator' },
    subtitle: { en: 'Choose the workflow stages your task needs. SP are story points: 1 SP is about 4–5 hours, and one person has 16 SP per week.',
                ru: 'Выберите этапы воркфлоу, которые нужны задаче. SP — story points: 1 SP это примерно 4–5 часов, на человека приходится 16 SP в неделю.' },
    back:     { en: 'Tools',                            ru: 'Инструменты' },
    total:    { en: 'Total',                            ru: 'Итого' },
    reset:    { en: 'Reset',                            ru: 'Сбросить' },
    warn16:   { en: 'Over 16 SP — won\'t fit in a week. Break it down.',
                ru: 'Больше 16 SP — не влезет в неделю. Раздроби на части.' },
    warnHalf: { en: `${fmt(total)} SP — over half a week. Consider splitting.`,
                ru: `${fmt(total)} SP — больше половины недели. Стоит раздробить.` },
  };

  const stages: { key: string; title: string; sp: string; desc: string }[] = language === 'ru'
    ? [
        { key: 'brief',    title: '01 · Бриф',                   sp: 'до 0,5 SP',  desc: 'Согласовать проблему, цели и ограничения. Не больше часа.' },
        { key: 'research', title: '02 · Ресерч и декомпозиция', sp: 'до 2 SP',  desc: 'Исследование задачи, уточнение требований, декомпозиция, построение основного сценария.' },
        { key: 'draft',    title: '03 · Концепты и драфты',              sp: '~6 SP',    desc: 'Быстрая визуализация решения, проверка UX-гипотез. Грубый макет вручную или с AI.' },
        { key: 'mainFlow', title: '04 · Дизайн (основной макет)',          sp: '2–16 SP',  desc: 'Детальная проработка main flow. Финальный макет основного пользовательского сценария.' },
        { key: 'prep',     title: '05 · Передача в разработку',            sp: '~4 SP',    desc: 'Проработка corner cases, спецификация, подготовка состояний интерфейса.' },
        { key: 'review',   title: '06 · Дизайн-ревью',                       sp: '1 SP',     desc: 'Проверка соответствия реализации макетам, фиксация расхождений.' },
      ]
    : [
        { key: 'brief',    title: '01 · Brief',                  sp: 'up to 0.5 SP', desc: 'Align on the problem, goals and constraints. Up to one hour.' },
        { key: 'research', title: '02 · Research & decomposition',    sp: 'up to 2 SP', desc: 'Clarify requirements, build main scenario, decompose into subtasks.' },
        { key: 'draft',    title: '03 · Concepts & Drafts',                       sp: '~6 SP',      desc: 'Quick solution visualisation, UX hypothesis check. Rough mockup — manual or AI.' },
        { key: 'mainFlow', title: '04 · Design (Main Flow)',                   sp: '2–16 SP',    desc: 'Detailed main flow design. Final mockups for the primary user scenario.' },
        { key: 'prep',     title: '05 · Handoff to Dev',                    sp: '~4 SP',      desc: 'Corner cases, specs, interface states and details.' },
        { key: 'review',   title: '06 · Design Review',               sp: '1 SP',       desc: 'Check implementation against mockups, log discrepancies.' },
      ];

  const checkedMap: Record<string, boolean> = { brief, research, draft, mainFlow, prep, review };
  const setterMap: Record<string, (v: boolean) => void> = {
    brief: setBrief, research: setResearch, draft: setDraft, mainFlow: setMainFlow, prep: setPrep, review: setReview
  };

  const quickPicks: { label: string; sp: number }[] = language === 'ru'
    ? [{ label: 'Правка иконок', sp: 2 }, { label: 'Форма регистрации', sp: 6 }, { label: 'Корзина с состояниями', sp: 10 }, { label: 'Редизайн раздела', sp: 16 }]
    : [{ label: 'Icon fix', sp: 2 }, { label: 'Registration form', sp: 6 }, { label: 'Cart with states', sp: 10 }, { label: 'Section redesign', sp: 16 }];

  return (
    <section className="px-6 pb-32" style={{ paddingTop: 80 }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-4 text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.875rem', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
          >
            ← {t.back[language]}
          </button>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {t.title[language]}
          </h1>
          <p className="text-[#6e6e73] mt-3" style={{ fontSize: '1rem', lineHeight: 1.6 }}>
            <Gloss>{t.subtitle[language]}</Gloss>
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Stages */}
          <div className="space-y-3 mb-4">
            {stages.map(stage => (
              <div
                key={stage.key}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200"
                style={{ border: checkedMap[stage.key] ? '1px solid rgba(29,29,31,0.15)' : '1px solid rgba(0,0,0,0.04)' }}
              >
                <label className="flex items-start gap-4 cursor-pointer px-6 py-5">
                  <input
                    type="checkbox"
                    checked={checkedMap[stage.key]}
                    onChange={e => setterMap[stage.key](e.target.checked)}
                    className="mt-1 flex-shrink-0"
                    style={{ width: 18, height: 18, accentColor: '#1d1d1f', cursor: 'pointer' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ fontSize: '1rem', fontWeight: 500 }}>{stage.title}</span>
                      <span className="text-[#6e6e73]" style={{ fontSize: '0.875rem' }}>{stage.sp}</span>
                    </div>
                    <p className="text-[#6e6e73]" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{stage.desc}</p>
                  </div>
                </label>

                {/* Main Flow slider */}
                {stage.key === 'mainFlow' && checkedMap['mainFlow'] && (
                  <div className="px-6 pb-5 pt-1 border-t border-[#d2d2d7]">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="range" min={2} max={16} value={mainFlowSP}
                        onChange={e => setMainFlowSP(Number(e.target.value))}
                        className="flex-1"
                        style={{ accentColor: '#1d1d1f', height: 3 }}
                      />
                      <span style={{ fontSize: '1rem', fontWeight: 500, minWidth: 48, textAlign: 'right' }}>{mainFlowSP} SP</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {quickPicks.map(q => (
                        <button
                          key={q.sp}
                          onClick={() => setMainFlowSP(q.sp)}
                          className="transition-all duration-150"
                          style={{
                            fontSize: '0.875rem', padding: '0 16px', minHeight: 40, borderRadius: 100,
                            border: `1px solid ${mainFlowSP === q.sp ? '#1d1d1f' : '#d2d2d7'}`,
                            background: mainFlowSP === q.sp ? '#1d1d1f' : '#f5f5f7',
                            color: mainFlowSP === q.sp ? '#fff' : '#6e6e73',
                            cursor: 'pointer', fontFamily: "'Work Sans', sans-serif"
                          }}
                        >
                          {q.label} — {q.sp} SP
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </motion.div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ background: '#1d1d1f' }}>
        {(total > 16 || (total > 8 && total <= 16)) && (
          <div className="max-w-2xl mx-auto px-6 pt-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.5, paddingBottom: 10,
              color: total > 16 ? '#fca5a5' : '#fcd34d' }}>
              {total > 16 ? t.warn16[language] : t.warnHalf[language]}
            </p>
          </div>
        )}
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-white/50" style={{ fontSize: '1rem' }}>
              {t.total[language]}:
            </span>
            <span className="text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.25rem', fontWeight: 300, lineHeight: 1 }}>
              {fmt(total)} SP
            </span>
          </div>
          <button
            onClick={reset}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 100, padding: '8px 20px', fontSize: '1rem', fontWeight: 500,
              cursor: 'pointer', color: '#fff', fontFamily: "'Work Sans', sans-serif",
              transition: 'all 0.2s'
            }}
          >
            {t.reset[language]}
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer({ language }: { language: Language }) {
  return (
    <footer className="py-20 px-6 border-t border-[#d2d2d7]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="flex items-center justify-center"
        >
          <div className="text-center space-y-1">
            <p className="text-[#6e6e73]" style={{ fontSize: '1rem' }}>
              {translations.footer.copyright[language]}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6e6e73' }}>
              {'SW Design Team · ' + ['a.mamyrin', 'gmail.com'].join('@')}
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
