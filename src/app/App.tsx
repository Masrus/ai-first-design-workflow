import { useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';

type Language = 'en' | 'ru';
type ViewMode = 'cards' | 'table';

interface MethodologyStep {
  title: string;
  description: string;
}

interface Stage {
  number: string;
  title: string;
  subtitle: string;
  productExpectation: string;
  designerExpectation: string;
  result: string;
  resultLabel: string;
  color: string;
  productRole: string;
  designerRole: string;
  isCore?: boolean;
  coreLabel?: string;
  methodLabel?: string;
  methodology?: MethodologyStep[];
}

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  return (
    <div className="bg-[#fbfbfd] text-[#1d1d1f] overflow-x-hidden" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <LanguageSwitcher language={language} setLanguage={setLanguage} />
      <Hero language={language} />
      <Workflow language={language} viewMode={viewMode} setViewMode={setViewMode} />
      <Footer language={language} />
    </div>
  );
}

function LanguageSwitcher({ language, setLanguage }: { language: Language; setLanguage: (lang: Language) => void }) {
  return (
    <div className="fixed top-8 right-8 z-50">
      <button
        onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
        className="w-12 h-12 bg-white/80 backdrop-blur-xl rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label={language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
      >
        <span className="text-2xl">{language === 'en' ? '🇬🇧' : '🇷🇺'}</span>
      </button>
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

function Hero({ language }: { language: Language }) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  return (
    <motion.section
      style={{ opacity, scale }}
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
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
      color: '#0071e3',
      productRole: 'Product',
      designerRole: 'Design'
    },
    {
      number: '02',
      title: 'Research',
      subtitle: 'Information Search',
      productExpectation: 'Problem explored. Key options outlined.',
      designerExpectation: 'Options explored. Feasible directions identified.',
      result: 'Research summary. Feasible directions identified and documented.',
      resultLabel: 'Result',
      methodLabel: 'Method',
      color: '#bf4800',
      productRole: 'Product',
      designerRole: 'Design',
      methodology: [
        {
          title: 'AI Maestro',
          description: 'Run the task statement through AI Maestro to surface key questions and gaps.'
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
      color: '#6e3667',
      productRole: 'Product',
      designerRole: 'Design',
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
          description: 'Feed the design system + step 2 output to AI. Review the AI result with the team.'
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
      color: '#1d7a3f',
      productRole: 'Product',
      designerRole: 'Design'
    },
    {
      number: '05',
      title: 'Handoff to Dev',
      subtitle: '',
      productExpectation: 'Specs approved. Ready for build.',
      designerExpectation: 'Specs and assets ready. Support during build.',
      result: 'All scenarios and corner cases covered. Specs and assets handed off. Support started.',
      resultLabel: 'Result',
      color: '#c73479',
      productRole: 'Product',
      designerRole: 'Design'
    },
    {
      number: '06',
      title: 'Design Review',
      subtitle: 'Quality Control',
      productExpectation: 'Implementation reviewed against specs.',
      designerExpectation: 'Build reviewed. Discrepancies logged and resolved.',
      result: 'Build approved. Quality confirmed. Task closed.',
      resultLabel: 'Result',
      color: '#5856d6',
      productRole: 'Product',
      designerRole: 'Design'
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
      color: '#0071e3',
      productRole: 'Продакт',
      designerRole: 'Дизайн'
    },
    {
      number: '02',
      title: 'Ресерч',
      subtitle: 'Поиск информации, исследование',
      productExpectation: 'Проблема изучена. Намечены варианты.',
      designerExpectation: 'Варианты изучены. Понятны реализуемые направления.',
      result: 'Саммари ресёрча. Зафиксированы реализуемые направления.',
      resultLabel: 'Результат',
      methodLabel: 'Метод',
      color: '#bf4800',
      productRole: 'Продакт',
      designerRole: 'Дизайн',
      methodology: [
        {
          title: 'AI Maestro',
          description: 'Прогнать постановку через AI Maestro — выявить ключевые вопросы и пробелы.'
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
      color: '#6e3667',
      productRole: 'Продакт',
      designerRole: 'Дизайн',
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
          description: 'Скармливаем дизайн-систему + результат шага 2. Обсуждаем AI-результат с командой.'
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
      color: '#1d7a3f',
      productRole: 'Продакт',
      designerRole: 'Дизайн'
    },
    {
      number: '05',
      title: 'Передача в разработку',
      subtitle: '',
      productExpectation: 'Спеки согласованы. Готово к разработке.',
      designerExpectation: 'Спеки и ассеты готовы. Поддержка разработки.',
      result: 'Проработаны все сценарии и корнер-кейс. Спеки и ассеты переданы в разработку. Начата поддержка.',
      resultLabel: 'Результат',
      color: '#c73479',
      productRole: 'Продакт',
      designerRole: 'Дизайн'
    },
    {
      number: '06',
      title: 'Дизайн-ревью',
      subtitle: 'Контроль качества',
      productExpectation: 'Реализация проверена по спекам.',
      designerExpectation: 'Разработка проверена. Расхождения зафиксированы и устранены.',
      result: 'Разработка принята. Качество подтверждено. Задача закрыта.',
      resultLabel: 'Результат',
      color: '#5856d6',
      productRole: 'Продакт',
      designerRole: 'Дизайн'
    }
  ]
};

function Workflow({ language, viewMode, setViewMode }: { language: Language; viewMode: ViewMode; setViewMode: (mode: ViewMode) => void }) {
  const stages = stagesData[language];

  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-20"
        >
          <div className="bg-white rounded-full p-1.5 shadow-lg flex gap-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-8 py-3 rounded-full transition-all duration-300 ${
                viewMode === 'cards' ? 'bg-[#1d1d1f] text-white' : 'text-[#1d1d1f] hover:bg-gray-100'
              }`}
              style={{ fontSize: '1rem', fontWeight: 500 }}
            >
              {translations.workflow.viewMode.cards[language]}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-8 py-3 rounded-full transition-all duration-300 ${
                viewMode === 'table' ? 'bg-[#1d1d1f] text-white' : 'text-[#1d1d1f] hover:bg-gray-100'
              }`}
              style={{ fontSize: '1rem', fontWeight: 500 }}
            >
              {translations.workflow.viewMode.table[language]}
            </button>
          </div>
        </motion.div>

        {viewMode === 'cards' ? (
          <div className="space-y-48">
            {stages.map((stage, index) => (
              <StageCard key={index} stage={stage} index={index} />
            ))}
          </div>
        ) : (
          <TableView stages={stages} language={language} />
        )}
      </div>
    </section>
  );
}

function TableView({ stages, language }: { stages: Stage[]; language: Language }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  const tableHeaders = {
    stage: { en: 'Stage', ru: 'Этап' },
    productAnalyst: { en: 'Product Analyst', ru: 'Продакт-аналитик' },
    designer: { en: 'Designer', ru: 'Дизайнер' }
  };

  return (
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
                style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', width: '20%' }}>
                {tableHeaders.stage[language]}
              </th>
              <th className="text-left p-6 bg-gradient-to-b from-[#f5f5f7] to-white"
                style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', width: '40%' }}>
                {tableHeaders.productAnalyst[language]}
              </th>
              <th className="text-left p-6 bg-gradient-to-b from-[#f5f5f7] to-white"
                style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', width: '40%' }}>
                {tableHeaders.designer[language]}
              </th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="border-b border-[#d2d2d7] last:border-b-0 hover:bg-[#fbfbfd] transition-colors duration-200"
                style={stage.isCore ? { backgroundColor: `${stage.color}05` } : {}}
              >
                <td className="p-6 align-top">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-[#86868b]" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {stage.number}
                    </span>
                  </div>
                  <h3 className="mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.75rem', fontWeight: 500, lineHeight: 1.2 }}>
                    {stage.title}
                  </h3>
                  {stage.subtitle && (
                    <p className="text-[#6e6e73]" style={{ fontSize: '0.9375rem' }}>{stage.subtitle}</p>
                  )}
                  {stage.isCore && (
                    <div className="mt-3">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold tracking-wider uppercase"
                        style={{ backgroundColor: `${stage.color}15`, color: stage.color }}>
                        {stage.coreLabel}
                      </span>
                    </div>
                  )}
                  <div className="mt-4 rounded-xl px-3 py-2.5" style={{ backgroundColor: `${stage.color}0d` }}>
                    <p className="mb-0.5" style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: stage.color }}>
                      {stage.resultLabel}
                    </p>
                    <p className="text-[#1d1d1f]" style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                      {stage.result}
                    </p>
                  </div>
                </td>
                <td className="p-6 align-top">
                  <p className="text-[#1d1d1f] leading-relaxed" style={{ fontSize: '1rem' }}>
                    {stage.productExpectation}
                  </p>
                </td>
                <td className="p-6 align-top">
                  <p className="text-[#1d1d1f] leading-relaxed" style={{ fontSize: '1rem' }}>
                    {stage.designerExpectation}
                  </p>
                  {stage.methodology && (
                    <div className="mt-4 pt-4 border-t border-[#d2d2d7]">
                      <p className="mb-2" style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#86868b' }}>
                        {stage.methodLabel}
                      </p>
                      <div className="space-y-3">
                        {stage.methodology.map((item, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[0.6875rem] font-semibold mt-0.5"
                              style={{ backgroundColor: `${stage.color}15`, color: stage.color }}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-[#1d1d1f]" style={{ fontSize: '0.875rem' }}>{item.title}</p>
                              <p className="text-[#6e6e73]" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function StageCard({ stage, index }: { stage: Stage; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <motion.div
      ref={ref}
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-semibold tracking-wider uppercase"
                    style={{ backgroundColor: `${stage.color}12`, color: stage.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    {stage.coreLabel}
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
          style={{ border: stage.isCore ? `1px solid ${stage.color}30` : '1px solid rgba(0,0,0,0.04)' }}
        >
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                <h4 className="text-[#1d1d1f]" style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {stage.productRole}
                </h4>
              </div>
              <p className="text-[#1d1d1f] leading-relaxed" style={{ fontSize: '1.0625rem' }}>
                {stage.productExpectation}
              </p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[#d2d2d7] to-transparent" />

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color, opacity: 0.6 }} />
                <h4 className="text-[#1d1d1f]" style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {stage.designerRole}
                </h4>
              </div>
              <p className="text-[#1d1d1f] leading-relaxed" style={{ fontSize: '1.0625rem' }}>
                {stage.designerExpectation}
              </p>
            </div>

            {stage.methodology && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-[#d2d2d7] to-transparent" />
                <div>
                  <p className="mb-5" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#86868b' }}>
                    {stage.methodLabel}
                  </p>
                  <div className="space-y-5">
                    {stage.methodology.map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div
                          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[0.8125rem] font-semibold"
                          style={{ backgroundColor: `${stage.color}15`, color: stage.color }}
                        >
                          {i + 1}
                        </div>
                        <div className="pt-0.5">
                          <p className="font-medium text-[#1d1d1f] mb-0.5" style={{ fontSize: '1rem' }}>{item.title}</p>
                          <p className="text-[#6e6e73] leading-relaxed" style={{ fontSize: '0.9375rem' }}>{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-[#d2d2d7] to-transparent" />
            <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: `${stage.color}0d` }}>
              <p className="mb-1.5" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: stage.color }}>
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

function Footer({ language }: { language: Language }) {
  return (
    <footer className="py-20 px-6 border-t border-[#d2d2d7]">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <p className="text-[#6e6e73]" style={{ fontSize: '1rem' }}>
            {translations.footer.copyright[language]}
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
