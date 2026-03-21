import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiShield,
  FiUsers,
  FiActivity,
  FiLayers,
  FiCheckCircle,
  FiFolder,
  FiFileText,
  FiClipboard,
  FiBriefcase,
  FiUserCheck,
  FiPackage,
  FiZap,
  FiDownload,
  FiEdit3,
  FiMonitor,
  FiHeart,
  FiTag,
  FiCalendar,
} from "react-icons/fi";
import entryImg from "../../assets/images/entry.jpg";

const features = [
  {
    icon: FiUsers,
    title: "Pacientë & raste",
    desc: "Regjistrim, lista e pacientëve dhe rrjedha e plotë e rasteve nga pritja deri te mbyllja.",
    color: "bg-cyan-500/10 text-cyan-700",
  },
  {
    icon: FiActivity,
    title: "Laboratori & raporte",
    desc: "Ngarkim PDF rezultatesh, lista sipas rastit dhe raport PDF që përmbledh raportin mjekësor me laboratorin.",
    color: "bg-violet-500/10 text-violet-700",
  },
  {
    icon: FiLayers,
    title: "Shërbime & staf",
    desc: "Emër dhe çmim për çdo shërbim; krijim përdoruesish Doctor, Nurse, Lab për klinikën tuaj.",
    color: "bg-amber-500/10 text-amber-800",
  },
  {
    icon: FiShield,
    title: "Sigurt & në kohë reale",
    desc: "Autentikim me JWT dhe role; përditësime të menjëhershme për shenjat jetësore, raportin dhe statusin e rastit.",
    color: "bg-emerald-500/10 text-emerald-700",
  },
];

const highlights = [
  "Panel të ndara për infermierë, mjekë dhe super administrator",
  "Raport PDF i plotë: raport mjekësor + të gjitha PDF-të e laboratorit në një skedar",
  "Gati për klinika moderne — shqip, i thjeshtë për ekipin",
];

/** Hapat e një vizite tipike në platformë */
const workflowSteps = [
  {
    step: "1",
    title: "Pacienti & rasti",
    desc: "Regjistroni pacientin dhe hapni një rast. Statusi ndjek rrjedhën: në pritje, në progres, në konsultim, përfunduar.",
    icon: FiFolder,
  },
  {
    step: "2",
    title: "Infermieri — shenjat jetësore",
    desc: "Pesha, presioni, temperatura, rrahjet e zemrës. Ruajtja dhe kalimi i rastit te mjeku kur është gati.",
    icon: FiHeart,
  },
  {
    step: "3",
    title: "Mjeku — konsultim & raport",
    desc: "Anamneza, diagnoza, terapia. Ndryshim statusi (fillo konsultimin, përfundo vizitën). Shkarkim i raportit PDF nga serveri.",
    icon: FiEdit3,
  },
  {
    step: "4",
    title: "Laboratori & dokumentacion",
    desc: "Ngarkoni PDF rezultatesh për çdo rast (edhe nga faqja Laboratori). Raporti i shkarkuar përfshin automatikisht faqet e laboratorit.",
    icon: FiFileText,
  },
];

/** Tre panelet e dashboard-it */
const dashboardPanels = [
  {
    title: "Paneli i infermierit",
    subtitle: "Për infermierët",
    accent: "border-teal-200 bg-teal-50/50",
    dot: "bg-teal-500",
    items: [
      "Pacientët — regjistrim dhe lista",
      "Rastet — hapja dhe ndjekja e statusit",
      "Shenjat jetësore dhe dërgimi te mjeku",
      "Laboratori — ngarkim PDF për rastet",
    ],
  },
  {
    title: "Paneli i mjekut",
    subtitle: "Për mjekët",
    accent: "border-violet-200 bg-violet-50/50",
    dot: "bg-violet-500",
    items: [
      "Rastet me shenja jetësore të përditësuara",
      "Raport mjekësor (anamneza, diagnozë, terapi)",
      "Raportet — lista dhe shkarkim PDF",
      "Profili — emër shfaqje, nënshkrim dhe vulë për PDF",
    ],
  },
  {
    title: "Paneli i super administratorit",
    subtitle: "Për administrimin e platformës",
    accent: "border-slate-300 bg-slate-50/80",
    dot: "bg-slate-700",
    items: [
      "Aplikimet — aprovim ose refuzim klinikash të reja",
      "Qasje e plotë në raste, pacientë, laborator, shërbime",
      "Stafi — krijim përdoruesish për klinikën (mjek, infermier, laborator)",
    ],
  },
];

/** Funksionalitete në detaj — çdo kartë ka gradient unik për ikonën */
const deepFeatures = [
  {
    icon: FiUsers,
    title: "Pacientët",
    text: "Formular regjistrimi me të dhëna bazë dhe lidhje me klinikën nga llogaria.",
    bar: "from-cyan-400 via-cyan-500 to-teal-500",
    iconBg: "from-cyan-500 to-teal-600",
    glow: "shadow-cyan-500/20",
  },
  {
    icon: FiFolder,
    title: "Menaxhimi i rasteve",
    text: "Lista e të gjitha rasteve me status me ngjyra; faqe detaji për çdo rast sipas rolit (infermier / mjek).",
    bar: "from-violet-400 via-violet-500 to-purple-600",
    iconBg: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
  },
  {
    icon: FiActivity,
    title: "Laboratori",
    text: "Faqe e dedikuar: të gjitha rastet, filtrim sipas sot / dje / datës; ngarkim dhe shkarkim PDF për çdo rast.",
    bar: "from-amber-400 via-orange-400 to-rose-500",
    iconBg: "from-amber-500 to-rose-600",
    glow: "shadow-amber-500/20",
  },
  {
    icon: FiFileText,
    title: "Raportet & PDF",
    text: "Faqja Raportet me filtra (sot, java, të gjitha). PDF nga backend: përmban raportin dhe PDF-të e bashkuara të laboratorit.",
    bar: "from-blue-400 via-indigo-500 to-indigo-600",
    iconBg: "from-indigo-500 to-blue-700",
    glow: "shadow-indigo-500/20",
  },
  {
    icon: FiPackage,
    title: "Shërbimet & çmimet",
    text: "Lista, shtim, ndryshim dhe fshirje (joaktiv) i shërbimeve me emër dhe çmim për klinikën.",
    bar: "from-emerald-400 to-emerald-600",
    iconBg: "from-emerald-500 to-teal-700",
    glow: "shadow-emerald-500/20",
  },
  {
    icon: FiBriefcase,
    title: "Profili i klinikës",
    text: "Emër, adresë, telefon, përshkrim; logo e klinikës (ngarkim foto).",
    bar: "from-slate-400 via-slate-500 to-slate-700",
    iconBg: "from-slate-600 to-slate-800",
    glow: "shadow-slate-400/25",
  },
  {
    icon: FiUserCheck,
    title: "Stafi",
    text: "Klinika admin ose super admin: lista e përdoruesve, filtrim sipas rolit, krijim llogarish të reja stafi.",
    bar: "from-sky-400 to-blue-600",
    iconBg: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/20",
  },
  {
    icon: FiClipboard,
    title: "Aplikimet",
    text: "Super admin: shqyrtim i aplikimeve për klinika të reja, aprovim ose refuzim me shënim.",
    bar: "from-fuchsia-400 to-pink-600",
    iconBg: "from-fuchsia-600 to-pink-600",
    glow: "shadow-fuchsia-500/20",
  },
  {
    icon: FiZap,
    title: "Në kohë reale",
    text: "Përditësime të menjëhershme kur ndryshojnë shenjat jetësore, raporti ose statusi — pa rifreskuar faqen.",
    bar: "from-yellow-400 via-amber-400 to-orange-500",
    iconBg: "from-amber-400 to-orange-600",
    glow: "shadow-amber-400/30",
  },
  {
    icon: FiDownload,
    title: "Shkarkime të sigurta",
    text: "Të gjitha shkarkimet e PDF përmes API me token — skedarët e laboratorit nuk janë publikë.",
    bar: "from-teal-400 to-cyan-600",
    iconBg: "from-teal-500 to-cyan-700",
    glow: "shadow-teal-500/20",
  },
];

const adminBullets = [
  "Administratori i klinikës sheh të gjitha menutë operacionale pa ndarje paneli (rastet, shërbimet, stafi, profili).",
  "Tekniku i laboratorit ka të njëjtën qasje të gjerë në operacionet e përditshme.",
  "Pas hyrjes, infermierët, mjekët dhe super admin zgjedhin panelin e duhur; paneli i gabuar tregon mesazh qartë nëse roli nuk përputhet.",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 overflow-x-hidden">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-cyan-200/40 via-[#81a2c5]/20 to-transparent blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-violet-200/30 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-cyan-100/50 blur-3xl" />
      </div>

      {/* Nav */}
      <header className="relative z-20 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-[#5a7a94] bg-clip-text text-transparent">
              iKlinika
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#funksionalitete"
              className="hidden md:inline-flex px-3 py-2 text-sm font-semibold text-slate-600 hover:text-[#81a2c5] transition-colors"
            >
              Funksionalitete
            </a>
            <a
              href="#cmime"
              className="hidden md:inline-flex px-3 py-2 text-sm font-semibold text-slate-600 hover:text-[#81a2c5] transition-colors"
            >
              Çmimet
            </a>
            <Link
              to="/apply"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-600 hover:text-[#81a2c5] transition-colors"
            >
              Aplikoni
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5"
            >
              Hyr në sistem
              <FiArrowRight className="opacity-80" size={18} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#81a2c5] mb-4">
                <span className="h-px w-8 bg-[#81a2c5]/60" />
                Platformë për klinika
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
                Menaxhoni klinikën{" "}
                <span className="bg-gradient-to-r from-[#81a2c5] via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  më thjesht
                </span>
                , në një vend.
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl mb-10">
                iKlinika lidh recepsionin, infermierët, mjekët dhe laboratorin në një panel të sigurt —
                më pak letër, më shumë kohë për pacientët. Më poshtë gjeni të gjitha funksionet që ofron platforma jonë.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#81a2c5] to-[#6b8fa8] text-white text-base font-bold shadow-xl shadow-[#81a2c5]/30 hover:shadow-2xl hover:shadow-[#81a2c5]/35 hover:-translate-y-0.5 transition-all"
                >
                  Hyr në sistem
                  <FiArrowRight size={20} />
                </Link>
                <Link
                  to="/apply"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 text-base font-bold hover:border-[#81a2c5]/50 hover:bg-slate-50/80 transition-all"
                >
                  Aplikoni për klinikë
                </Link>
              </div>

              <ul className="mt-10 space-y-3">
                {highlights.map((text) => (
                  <li key={text} className="flex items-start gap-3 text-slate-600 text-sm sm:text-base">
                    <FiCheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative lg:pl-4">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200/80 aspect-[4/5] sm:aspect-auto sm:min-h-[420px] lg:min-h-[480px]">
                <img
                  src={entryImg}
                  alt="Kujdes shëndetësor"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-sm font-medium text-white/90 mb-1">E ndërtuar për ekipet mjekësore</p>
                  <p className="text-lg font-bold">Rrjedhë e qartë, nga vizita te raporti.</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-2 sm:left-4 max-w-[200px] rounded-2xl bg-white p-4 shadow-xl border border-slate-100 hidden sm:block">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Statusi</p>
                <p className="text-lg font-bold text-slate-900 mt-1">Në kohë reale</p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#81a2c5] to-cyan-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Overview cards */}
        <section id="funksionalitete" className="scroll-mt-20 border-t border-slate-200/80 bg-white/60 backdrop-blur-sm py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Çfarë ofron iKlinika
              </h2>
              <p className="text-slate-600 text-lg">
                Një përmbledhje e shpejtë — më poshtë zgjerojmë çdo pjesë me hapa konkretë.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-lg hover:border-[#81a2c5]/20 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white border-y border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mb-12 sm:mb-16">
              <p className="text-sm font-bold text-[#81a2c5] uppercase tracking-wider mb-2">Rrjedha e punës</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Nga vizita te raporti i plotë PDF
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Platforma pasqyron procesin real në klinikë: hapja e rastit, matjet nga infermieri, konsultimi dhe dokumentimi nga mjeku,
                plus rezultatet e laboratorit që bashkohen automatikisht në një raport të vetëm kur shkarkoni PDF nga sistemi.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {workflowSteps.map(({ step, title, desc, icon: Icon }) => (
                <div
                  key={step}
                  className="relative flex gap-5 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#81a2c5] to-[#5a7a94] text-white font-extrabold text-lg flex items-center justify-center shadow-lg shadow-[#81a2c5]/25">
                    {step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="text-[#81a2c5]" size={20} />
                      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Three panels */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Tre panele, një platformë
              </h2>
              <p className="text-slate-600 text-lg">
                Pas hyrjes, përdoruesit me rol infermier, mjek ose super administrator zgjedhin panelin e tyre.
                Menuja dhe qasja përshtaten — për shembull aplikimet e klinikave të reja shfaqen vetëm në panelin e super administratorit.
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {dashboardPanels.map((panel) => (
                <div
                  key={panel.title}
                  className={`rounded-2xl border-2 p-6 sm:p-8 ${panel.accent} flex flex-col h-full`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${panel.dot}`} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{panel.subtitle}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-5">{panel.title}</h3>
                  <ul className="space-y-3 flex-1">
                    {panel.items.map((item) => (
                      <li key={item} className="flex gap-3 text-slate-700 text-sm leading-relaxed">
                        <FiCheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-3">
                <FiMonitor className="text-[#81a2c5] flex-shrink-0 mt-1" size={22} />
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Administratori i klinikës & tekniku i laboratorit</h4>
                  <ul className="space-y-2 text-slate-600 text-sm leading-relaxed">
                    {adminBullets.map((b) => (
                      <li key={b}>• {b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deep feature grid — premium cards */}
        <section className="relative  py-20 sm:py-28 overflow-hidden border-t border-slate-200/80">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-[#eef6f9] to-slate-50" />
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgb(148_163_184_/_22%)_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#81a2c5] mb-3">
                Platforma juaj
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Funksionalitete në detaj
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Çdo veçori më poshtë është pjesë e panelit të punës — dizajnuar për t’u lexuar lehtë dhe për t’ju kujtuar vlerën që merrni me iKlinika.
              </p>
            </div>
            <div className="grid sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-6 sm:gap-7">
              {deepFeatures.map(({ icon: Icon, title, text, bar, iconBg, glow }) => (
                <div
                  key={title}
                  className={`
                    group relative flex flex-col rounded-2xl bg-white/90 backdrop-blur-sm
                    border border-white shadow-lg ${glow}
                    hover:shadow-2xl hover:-translate-y-2 hover:border-[#81a2c5]/25
                    transition-all duration-500 ease-out
                  `}
                >
                  <div
                    className={`h-1.5 w-full rounded-t-2xl bg-gradient-to-r ${bar} shrink-0`}
                    aria-hidden
                  />
                  <div className="p-6 sm:p-7 flex flex-col flex-1 pt-6">
                    <div
                      className={`
                        mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl
                        bg-gradient-to-br ${iconBg} text-white shadow-lg
                        ring-4 ring-white/80 group-hover:scale-105 group-hover:rotate-3
                        transition-transform duration-500
                      `}
                    >
                      <Icon size={26} strokeWidth={1.75} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-3 text-base sm:text-lg leading-snug group-hover:text-[#5a7a94] transition-colors">
                      {title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed flex-1 border-t border-slate-100/80 pt-4 mt-auto">
                      {text}
                    </p>
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/0 via-[#81a2c5]/[0.04] to-cyan-500/[0.06]"
                    aria-hidden
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing — Albanian */}
        <section id="cmime" className="scroll-mt-20 py-20 sm:py-24 bg-white border-t border-slate-200/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-4 py-1.5 rounded-full mb-4">
                <FiTag className="text-emerald-600" size={16} />
                Ofertë e qartë
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Çmime & provë falas
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Filloni pa stres: prova nuk kërkon kartë bankare. Pas provës, zgjidhni planin që ju përshtatet — me mbështetje të vazhdueshme dhe pagesë të drejtpërdrejtë, jo abonim automatik me kartë në aplikacion.
              </p>
            </div>

            {/* Trial banner */}
            <div className="mb-10 rounded-3xl border-2 border-dashed border-[#81a2c5]/40 bg-gradient-to-br from-[#81a2c5]/[0.08] via-cyan-50/80 to-white p-8 sm:p-10 text-center shadow-inner">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#81a2c5] to-teal-600 text-white shadow-lg shadow-[#81a2c5]/30 mb-4">
                <FiCalendar size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                2 muaj falas për të provuar
              </h3>
              <p className="text-slate-700 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Përdorni të gjitha funksionet e platformës për <strong>dy muaj</strong>, pa pagesë dhe{" "}
                <strong>pa nevojë për kartë bankare</strong> për të filluar. Testoni me ekipin tuaj para se të vendosni.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              {/* Annual — featured */}
              <div className="relative rounded-3xl border-2 border-[#81a2c5] bg-gradient-to-b from-white to-slate-50/90 p-8 sm:p-10 shadow-xl shadow-[#81a2c5]/15 flex flex-col">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#81a2c5] to-teal-600 text-white text-xs font-bold uppercase tracking-wide shadow-md">
                  Më i zgjedhur
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-4 mb-1">Abonim vjetor</h3>
                <p className="text-slate-500 text-sm mb-6">Një vit i plotë me mbështetje gjatë gjithë kohës</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">120</span>
                  <span className="text-2xl font-bold text-slate-700">€</span>
                  <span className="text-slate-600 font-medium ml-1">/ vit</span>
                </div>
                <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                  Pas periudhës së provës, <strong>120 euro në vit</strong> për një vit përdorimi, me{" "}
                  <strong>mbështetje teknike dhe këshillim gjatë gjithë kohës</strong> — për çdo pyetje ose ndihmë me platformën.
                </p>
                <ul className="space-y-3 text-slate-700 text-sm mb-8 flex-1">
                  <li className="flex gap-2">
                    <FiCheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                    Çmim i fiksuar për 12 muaj
                  </li>
                  <li className="flex gap-2">
                    <FiCheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                    Mbështetje e vazhdueshme përgjatë vitit
                  </li>
                  <li className="flex gap-2">
                    <FiCheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                    Pagesë e drejtpërdrejtë (jo me kartë të lidhur në app)
                  </li>
                </ul>
                <Link
                  to="/apply"
                  className="inline-flex items-center justify-center w-full py-3.5 rounded-xl bg-gradient-to-r from-[#81a2c5] to-[#6b8fa8] text-white font-bold hover:shadow-lg transition-shadow"
                >
                  Aplikoni dhe na kontaktoni
                </Link>
              </div>

              {/* Monthly */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-lg flex flex-col hover:border-slate-300 transition-colors">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Abonim mujor</h3>
                <p className="text-slate-500 text-sm mb-6">Fleksibilitet, një muaj në një kohë</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">25</span>
                  <span className="text-2xl font-bold text-slate-700">€</span>
                  <span className="text-slate-600 font-medium ml-1">/ muaj</span>
                </div>
                <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                  Nëse preferoni të paguani <strong>25 euro në muaj</strong>, mund ta përdorni këtë opsion. I njëjti parim:{" "}
                  <strong>pagesa bëhet drejtpërdrejt</strong> (sipas marrëveshjes — faturë, transfertë ose në zyrë), jo përmes kartës së ruajtur në aplikacion.
                </p>
                <ul className="space-y-3 text-slate-700 text-sm mb-8 flex-1">
                  <li className="flex gap-2">
                    <FiCheckCircle className="text-[#81a2c5] flex-shrink-0 mt-0.5" size={18} />
                    Pa angazhim të fshehur me kartë
                  </li>
                  <li className="flex gap-2">
                    <FiCheckCircle className="text-[#81a2c5] flex-shrink-0 mt-0.5" size={18} />
                    Mbështetje gjatë përdorimit
                  </li>
                  <li className="flex gap-2">
                    <FiCheckCircle className="text-[#81a2c5] flex-shrink-0 mt-0.5" size={18} />
                    Transparencë në çmime
                  </li>
                </ul>
                <Link
                  to="/apply"
                  className="inline-flex items-center justify-center w-full py-3.5 rounded-xl border-2 border-slate-200 text-slate-800 font-bold hover:border-[#81a2c5] hover:bg-slate-50 transition-colors"
                >
                  Mësoni më shumë duke aplikuar
                </Link>
              </div>
            </div>

            <div className="mt-10 rounded-2xl bg-slate-900 text-slate-300 px-6 py-5 sm:px-8 sm:py-6 text-center text-sm sm:text-base leading-relaxed">
              <p className="max-w-3xl mx-auto">
                <strong className="text-white">Pagesa “live” (e drejtpërdrejtë):</strong> nuk ofrojmë pagesë automatike me kartë brenda aplikacionit.
                Faturimi dhe pagesa rregullohen drejtpërdrejt me ju — për shembull me faturë, transfertë bankare ose në takim — që të keni kontroll të plotë dhe transparencë.
              </p>
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-[#2d4a5e] px-8 sm:px-12 py-12 sm:py-16 text-center shadow-2xl shadow-slate-900/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Gati të filloni?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Hyni me llogarinë tuaj ose aplikoni për të hapur një klinikë të re në platformë. Ekipi shqyrton aplikimin dhe ju njofton.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors"
              >
                Hyr në sistem
              </Link>
              <Link
                to="/apply"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white/10 transition-colors"
              >
                Aplikoni për klinikë
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white/80 backdrop-blur py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">iKlinika</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#funksionalitete" className="hover:text-[#81a2c5] font-medium transition-colors">
              Funksionalitete
            </a>
            <Link to="/login" className="hover:text-[#81a2c5] font-medium transition-colors">
              Hyr
            </Link>
            <Link to="/apply" className="hover:text-[#81a2c5] font-medium transition-colors">
              Aplikoni
            </Link>
            <a href="#cmime" className="hover:text-[#81a2c5] font-medium transition-colors">
              Çmimet
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
