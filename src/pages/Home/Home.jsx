import React, { useState, useEffect, useRef } from "react";
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
  FiMenu,
  FiX,
  FiPlay,
} from "react-icons/fi";
import navLogo from "../../assets/images/logo3.png";
import heroDashboard from "../../assets/home/hero/panel.png";
import tab1 from "../../assets/home/hero/tab1.png";
import tab2 from "../../assets/home/hero/tab2.png";
import tab3 from "../../assets/home/hero/tab3.png";
import tab4 from "../../assets/home/hero/tab4.png";
import tab5 from "../../assets/home/hero/tab5.png";
import tab6 from "../../assets/home/hero/tab6.png";
import tab7 from "../../assets/home/hero/tab7.png";
import heroImage from "../../assets/home/martha-dominguez-de-gouveia-nMyM7fxpokE-unsplash.jpg";
import workflowImage from "../../assets/home/ibrahim-boran-zsKFQs2kDpM-unsplash.jpg";
import platformImage from "../../assets/home/national-cancer-institute-NFvdKIhxYlU-unsplash.jpg";

const IMAGES = {
  hero: heroDashboard,
  heroAlt: "Paneli i iKlinikës — menaxhim i rasteve, mjekëve dhe checkout",
  workflow: workflowImage,
  workflowAlt: "Pajisje dhe materiale mjekësore në klinikë",
  platform: platformImage,
  platformAlt: "Mjek duke përdorur laptop dhe stetoskop — menaxhim dixhital",
  cta: heroImage,
  ctaAlt: "Recepsion modern klinike",
};

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

const featureTabs = [
  {
    label: "Të gjitha funksionet",
    headline: "Menaxhoni detyrat kryesore me shpejtësi dhe qartësi.",
    description:
      "Gjithçka që ju duhet për të organizuar proceset, menaxhuar informacionin dhe mbajtur punën e përditshme të klinikës të rrjedhë si duhet.",
    bullets: [
      "Planifikoni, caktoni dhe menaxhoni rastet qartë nëpër ekip.",
      "Ruani informacionin e përbashkët në mënyrë të sigurt dhe qasuni kur duhet.",
      "Automatizoni proceset e përditshme për të reduktuar punën manuale dhe gabimet.",
    ],
    image: tab1,
    imageAlt: "Pamje e përgjithshme e panelit iKlinika",
  },
  {
    label: "Pacientë & raste",
    headline: "Regjistrim i shpejtë dhe menaxhim i qartë i rasteve.",
    description:
      "Hapni raste të reja, ndiqni statusin nga pritja deri te mbyllja dhe mbani historikun e pacientit në një vend të vetëm.",
    bullets: [
      "Formular regjistrimi me të dhëna bazë dhe lidhje me klinikën.",
      "Lista e rasteve me status me ngjyra: në pritje, në progres, përfunduar.",
      "Faqe detaji për çdo rast sipas rolit — infermier ose mjek.",
    ],
    image: tab2,
    imageAlt: "Paneli i pacientëve dhe rasteve",
  },
  {
    label: "Shenja jetësore",
    headline: "Matje të sakta dhe kalim i qetë te mjeku.",
    description:
      "Infermierët regjistrojnë pesha, presion, temperaturë dhe rrahje zemre — rasti kalon te mjeku sapo të jetë gati.",
    bullets: [
      "Formular i thjeshtë për shenjat jetësore në çdo vizitë.",
      "Ruajtje e menjëhershme dhe historik për çdo rast.",
      "Përditësime në kohë reale pa rifreskuar faqen.",
    ],
    image: tab3,
    imageAlt: "Paneli i shenjave jetësore",
  },
  {
    label: "Konsultimi mjekësor",
    headline: "Konsultim i plotë dhe raport mjekësor në minuta.",
    description:
      "Anamneza, diagnoza dhe terapia në një ndërfaqe të pastër — filloni konsultimin dhe përfundoni vizitën me një klik.",
    bullets: [
      "Ndryshim statusi: fillo konsultimin, përfundo vizitën.",
      "Raport mjekësor i strukturuar për çdo rast.",
      "Profili i mjekut: emër shfaqje, nënshkrim dhe vulë për PDF.",
    ],
    image: tab4,
    imageAlt: "Paneli i konsultimit mjekësor",
  },
  {
    label: "Laboratori",
    headline: "Rezultatet e laboratorit të organizuara sipas rastit.",
    description:
      "Ngarkoni PDF rezultatesh, filtroni sipas datës dhe qasuni shpejt te dokumentacioni i çdo pacienti.",
    bullets: [
      "Faqe e dedikuar me filtrim: sot, dje ose datë e zgjedhur.",
      "Ngarkim dhe shkarkim PDF të sigurt për çdo rast.",
      "Rezultatet bashkohen automatikisht në raportin final.",
    ],
    image: tab5,
    imageAlt: "Paneli i laboratorit",
  },
  {
    label: "Raportet & PDF",
    headline: "Raport i plotë PDF me një klik.",
    description:
      "Shkarkoni raportin mjekësor së bashku me të gjitha PDF-të e laboratorit — një skedar i vetëm, i gatshëm për arshivim ose printim.",
    bullets: [
      "Lista e raporteve me filtra: sot, java, të gjitha.",
      "PDF nga serveri me token të sigurt — skedarët nuk janë publikë.",
      "Përmbledhje e plotë: raport mjekësor + faqet e laboratorit.",
    ],
    image: tab6,
    imageAlt: "Paneli i raporteve dhe PDF",
  },
  {
    label: "Stafi & rolet",
    headline: "Menaxhim i roleve dhe qasjes për çdo anëtar të ekipit.",
    description:
      "Krijoni llogari për mjekë, infermierë dhe laborator — çdo rol sheh vetëm panelin dhe menutë që i duhen.",
    bullets: [
      "Panele të ndara: infermier, mjek, super administrator.",
      "Krijim përdoruesish të rinj nga admini i klinikës.",
      "Autentikim me JWT dhe kontroll i qartë i qasjes.",
    ],
    image: tab7,
    imageAlt: "Paneli i stafit dhe roleve",
  },
];

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

const navLinks = [
  { href: "#funksionalitete", label: "Funksionalitete" },
  { href: "#cmime", label: "Çmimet" },
  { href: "/apply", label: "Aplikoni", isRoute: true },
];

const shell = "max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-10";

function Reveal({ children, className = "", delay = 0, scale = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delayClass =
    delay === 1 ? "landing-delay-1" : delay === 2 ? "landing-delay-2" : delay === 3 ? "landing-delay-3" : delay === 4 ? "landing-delay-4" : "";

  return (
    <div
      ref={ref}
      className={`${scale ? "landing-reveal-scale" : "landing-reveal"} ${visible ? "is-visible" : ""} ${delayClass} ${className}`}
      style={delay && !delayClass ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, dark = false }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] mb-4 ${dark ? "text-clinic-400" : "text-clinic-600"}`}>
      {children}
    </p>
  );
}

function EnterpriseIcon({ icon: Icon }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 group-hover:border-clinic-300 group-hover:text-clinic-700 transition-colors duration-300">
      <Icon size={18} strokeWidth={1.75} />
    </div>
  );
}

function FeatureTabCheck() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clinic-700 text-white shadow-sm">
      <FiCheckCircle size={14} strokeWidth={2.5} />
    </span>
  );
}

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobileNav = () => setMobileNavOpen(false);

  const activeTab = featureTabs[activeFeatureTab];

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-800 overflow-x-hidden antialiased">
      {/* ── Navigation ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
            : "bg-white/80 backdrop-blur-sm border-b border-transparent"
        }`}
      >
        <div className={`${shell} flex h-16 lg:h-[4.25rem] items-center justify-between gap-6`}>
          <Link to="/" className="flex items-center gap-3 shrink-0" onClick={closeMobileNav}>
            <img src={navLogo} alt="iKlinika" className="h-9 sm:h-10 lg:h-11 w-auto object-contain" />
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-clinic-700">iKlinika</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(({ href, label, isRoute }) =>
              isRoute ? (
                <Link
                  key={href}
                  to={href}
                  className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={href}
                  href={href}
                  className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {label}
                </a>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-5">
            <Link
              to="/login"
              className="text-[13px] font-medium text-slate-600 hover:text-clinic-800 transition-colors"
            >
              Hyr
            </Link>
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-clinic-700 text-white text-[13px] font-semibold hover:bg-clinic-800 transition-colors shadow-sm"
            >
              Fillo tani
              <FiArrowRight size={15} />
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
            aria-label={mobileNavOpen ? "Mbyll menunë" : "Hap menunë"}
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className={`${shell} py-4 flex flex-col gap-1`}>
              {navLinks.map(({ href, label, isRoute }) =>
                isRoute ? (
                  <Link key={href} to={href} onClick={closeMobileNav} className="px-3 py-3 text-sm font-medium text-slate-700">
                    {label}
                  </Link>
                ) : (
                  <a key={href} href={href} onClick={closeMobileNav} className="px-3 py-3 text-sm font-medium text-slate-700">
                    {label}
                  </a>
                )
              )}
              <Link
                to="/login"
                onClick={closeMobileNav}
                className="mt-2 flex h-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 text-sm font-semibold"
              >
                Hyr
              </Link>
              <Link
                to="/apply"
                onClick={closeMobileNav}
                className="flex h-11 items-center justify-center rounded-full bg-clinic-700 text-white text-sm font-semibold"
              >
                Fillo tani
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-12 lg:pb-20 overflow-hidden bg-white">
          <div className="absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-clinic-50/60 to-transparent pointer-events-none" />

          <div className={`relative z-10 ${shell} w-full`}>
            <div className="max-w-3xl mx-auto text-center landing-hero-enter">
              <h1 className="text-[2.15rem] sm:text-5xl lg:text-[3.25rem] font-semibold leading-[1.1] tracking-tight text-clinic-800 mb-6">
                Menaxhoni operacionet në një platformë të unifikuar
              </h1>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
                iKlinika lidh recepsionin, infermierët, mjekët dhe laboratorin në një panel të sigurt —
                organizoni rrjedhën e punës, ndiqni progresin dhe menaxhoni aktivitetet e përditshme në një hapësirë të përbashkët.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14 lg:mb-16">
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 px-7 rounded-full bg-clinic-700 text-white text-sm font-semibold hover:bg-clinic-800 transition-colors shadow-sm"
                >
                  Hyr në sistem
                  <FiArrowRight size={16} />
                </Link>
                <a
                  href="#funksionalitete"
                  className="inline-flex h-12 items-center justify-center gap-2 px-7 rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <FiPlay size={16} className="text-clinic-600" />
                  Shiko funksionalitetet
                </a>
              </div>
            </div>

            <div className="relative landing-hero-image max-w-5xl mx-auto">
              <div className="landing-hero-dashboard rounded-2xl overflow-hidden border border-slate-200/80 bg-white">
                <img
                  src={IMAGES.hero}
                  alt={IMAGES.heroAlt}
                  className="w-full h-auto block"
                />
              </div>
            </div>

            <ul className="mt-12 lg:mt-16 grid sm:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto">
              {highlights.map((text) => (
                <li
                  key={text}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-4 text-sm text-slate-600 leading-relaxed"
                >
                  <FiCheckCircle className="text-clinic-600 shrink-0 mt-0.5" size={16} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Feature tabs ── */}
        <section id="funksionalitete" className="scroll-mt-24 py-16 lg:py-24 bg-white border-b border-slate-200/80">
          <div className={shell}>
            <div className="rounded-full bg-slate-100/90 p-1.5 flex gap-0.5 overflow-x-auto scrollbar-none mb-6 lg:mb-8">
              {featureTabs.map((tab, index) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveFeatureTab(index)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 sm:px-5 py-2.5 text-[13px] sm:text-sm font-medium transition-all duration-200 ${
                    activeFeatureTab === index
                      ? "bg-clinic-700 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-10 xl:p-12">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-20 items-start">
                <div className="min-w-0">
                  <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-semibold text-slate-900 tracking-tight leading-snug mb-4">
                    {activeTab.headline}
                  </h2>
                  <p className="text-slate-500 text-base sm:text-[17px] leading-relaxed mb-8 max-w-lg">
                    {activeTab.description}
                  </p>
                  <Link
                    to="/apply"
                    className="inline-flex h-11 items-center justify-center gap-2 px-6 rounded-full bg-clinic-700 text-white text-sm font-semibold hover:bg-clinic-800 transition-colors shadow-sm"
                  >
                    Eksploro më shumë
                    <FiArrowRight size={15} />
                  </Link>
                </div>

                <ul className="min-w-0 divide-y divide-slate-200/90">
                  {activeTab.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
                      <FeatureTabCheck />
                      <span className="text-[15px] sm:text-base text-slate-600 leading-relaxed pt-0.5">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 lg:mt-12 landing-hero-dashboard rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50">
                <img
                  key={activeFeatureTab}
                  src={activeTab.image}
                  alt={activeTab.imageAlt}
                  className="w-full h-auto block"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Overview ── */}
        <section className="py-24 lg:py-32 bg-white border-b border-slate-200/80">
          <div className={shell}>
            <Reveal className="max-w-2xl mb-16 lg:mb-20">
              <SectionLabel>Përmbledhje</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
                Çfarë ofron iKlinika
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Një përmbledhje e shpejtë — më poshtë zgjerojmë çdo pjesë me hapa konkretë.
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
              {features.map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={i + 1} className="group bg-white p-8 lg:p-9 hover:bg-slate-50/80 transition-colors duration-300">
                  <EnterpriseIcon icon={Icon} />
                  <h3 className="mt-6 text-base font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Workflow ── */}
        <section className="py-24 lg:py-32 bg-[#f7f8fa]">
          <div className={shell}>
            <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-start">
              <div className="lg:col-span-5 lg:sticky lg:top-28">
                <Reveal>
                  <SectionLabel>Rrjedha e punës</SectionLabel>
                  <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-5">
                    Nga vizita te raporti i plotë PDF
                  </h2>
                  <p className="text-slate-600 text-lg leading-relaxed mb-10">
                    Platforma pasqyron procesin real në klinikë: hapja e rastit, matjet nga infermieri, konsultimi dhe dokumentimi nga mjeku,
                    plus rezultatet e laboratorit që bashkohen automatikisht në një raport të vetëm kur shkarkoni PDF nga sistemi.
                  </p>
                </Reveal>
                <Reveal scale className="rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-[4/3]">
                  <img
                    src={IMAGES.workflow}
                    alt={IMAGES.workflowAlt}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700"
                    loading="lazy"
                  />
                </Reveal>
              </div>

              <div className="lg:col-span-7 relative">
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-200 hidden sm:block" />
                <div className="space-y-0">
                  {workflowSteps.map(({ step, title, desc, icon: Icon }, i) => (
                    <Reveal key={step} delay={i + 1}>
                      <div className="group relative flex gap-6 sm:gap-8 py-8 border-b border-slate-200/80 last:border-0">
                        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-white text-xs font-bold text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                          {step}
                        </div>
                        <div className="pt-0.5">
                          <div className="flex items-center gap-2.5 mb-2">
                            <Icon className="text-slate-400" size={16} />
                            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-[15px]">{desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Panels ── */}
        <section className="py-24 lg:py-32 bg-white border-y border-slate-200/80">
          <div className={shell}>
            <Reveal className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
              <SectionLabel>Arkitektura e platformës</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
                Tre panele, një platformë
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Pas hyrjes, përdoruesit me rol infermier, mjek ose super administrator zgjedhin panelin e tyre.
                Menuja dhe qasja përshtaten — për shembull aplikimet e klinikave të reja shfaqen vetëm në panelin e super administratorit.
              </p>
            </Reveal>

            <div className="grid lg:grid-cols-3 gap-6">
              {dashboardPanels.map((panel, i) => (
                <Reveal key={panel.title} delay={i + 1}>
                  <article className="h-full flex flex-col bg-white border border-slate-200 rounded-xl p-8 hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0_0_0_/0.06)] transition-all duration-300">
                    <div className="flex items-center gap-2 mb-6">
                      <span className={`h-1.5 w-1.5 rounded-full ${panel.dot}`} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{panel.subtitle}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-6">{panel.title}</h3>
                    <ul className="space-y-3.5 flex-1">
                      {panel.items.map((item) => (
                        <li key={item} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-8">
              <div className="flex flex-col sm:flex-row gap-6 rounded-xl border border-slate-200 bg-slate-50/50 p-8">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                  <FiMonitor size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Administratori i klinikës & tekniku i laboratorit</h4>
                  <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
                    {adminBullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Deep features + image split ── */}
        <section className="py-24 lg:py-32 bg-slate-950 text-white overflow-hidden">
          <div className={shell}>
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center mb-20">
              <Reveal>
                <SectionLabel dark>Platforma juaj</SectionLabel>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                  Funksionalitete në detaj
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Çdo veçori më poshtë është pjesë e panelit të punës — dizajnuar për t’u lexuar lehtë dhe për t’ju kujtuar vlerën që merrni me iKlinika.
                </p>
              </Reveal>
              <Reveal scale className="rounded-xl overflow-hidden border border-white/10 aspect-[16/10]">
                <img
                  src={IMAGES.platform}
                  alt={IMAGES.platformAlt}
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 hover:scale-[1.02] transition-all duration-700"
                  loading="lazy"
                />
              </Reveal>
            </div>

            <div className="grid sm:grid-cols-2 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10">
              {deepFeatures.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={(i % 4) + 1}>
                  <div className="group flex gap-5 bg-slate-950 p-7 sm:p-8 hover:bg-slate-900/80 transition-colors duration-300">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-400 group-hover:text-clinic-300 group-hover:border-clinic-500/30 transition-colors">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1.5 text-[15px]">{title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="cmime" className="scroll-mt-20 py-24 lg:py-32 bg-[#f7f8fa]">
          <div className={`${shell} max-w-5xl`}>
            <Reveal className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                <FiTag size={14} />
                Ofertë e qartë
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
                Çmime & provë falas
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Filloni pa stres: prova nuk kërkon kartë bankare. Pas provës, zgjidhni planin që ju përshtatet — me mbështetje të vazhdueshme dhe pagesë të drejtpërdrejtë, jo abonim automatik me kartë në aplikacion.
              </p>
            </Reveal>

            <Reveal className="mb-10 rounded-xl border border-slate-200 bg-white p-8 sm:p-10 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white mb-5">
                <FiCalendar size={22} />
              </div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-3">
                2 muaj falas për të provuar
              </h3>
              <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Përdorni të gjitha funksionet e platformës për <strong>dy muaj</strong>, pa pagesë dhe{" "}
                <strong>pa nevojë për kartë bankare</strong> për të filluar. Testoni me ekipin tuaj para se të vendosni.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-6">
              <Reveal delay={1}>
                <div className="relative h-full flex flex-col rounded-xl border-2 border-slate-900 bg-white p-8 sm:p-10">
                  <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-white bg-slate-900 px-2.5 py-1 rounded">
                    Më i zgjedhur
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Abonim vjetor</h3>
                  <p className="text-slate-500 text-sm mb-8">Një vit i plotë me mbështetje gjatë gjithë kohës</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-semibold text-slate-900 tracking-tight">120</span>
                    <span className="text-xl font-semibold text-slate-700">€</span>
                    <span className="text-slate-500 text-sm ml-1">/ vit</span>
                  </div>
                  <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                    Pas periudhës së provës, <strong>120 euro në vit</strong> për një vit përdorimi, me{" "}
                    <strong>mbështetje teknike dhe këshillim gjatë gjithë kohës</strong> — për çdo pyetje ose ndihmë me platformën.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-700 mb-8 flex-1">
                    <li className="flex gap-2.5"><FiCheckCircle className="text-slate-900 shrink-0 mt-0.5" size={16} />Çmim i fiksuar për 12 muaj</li>
                    <li className="flex gap-2.5"><FiCheckCircle className="text-slate-900 shrink-0 mt-0.5" size={16} />Mbështetje e vazhdueshme përgjatë vitit</li>
                    <li className="flex gap-2.5"><FiCheckCircle className="text-slate-900 shrink-0 mt-0.5" size={16} />Pagesë e drejtpërdrejtë (jo me kartë të lidhur në app)</li>
                  </ul>
                  <Link to="/apply" className="flex h-11 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors">
                    Aplikoni dhe na kontaktoni
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={2}>
                <div className="h-full flex flex-col rounded-xl border border-slate-200 bg-white p-8 sm:p-10 hover:border-slate-300 transition-colors">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Abonim mujor</h3>
                  <p className="text-slate-500 text-sm mb-8">Fleksibilitet, një muaj në një kohë</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-semibold text-slate-900 tracking-tight">25</span>
                    <span className="text-xl font-semibold text-slate-700">€</span>
                    <span className="text-slate-500 text-sm ml-1">/ muaj</span>
                  </div>
                  <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                    Nëse preferoni të paguani <strong>25 euro në muaj</strong>, mund ta përdorni këtë opsion. I njëjti parim:{" "}
                    <strong>pagesa bëhet drejtpërdrejt</strong> (sipas marrëveshjes — faturë, transfertë ose në zyrë), jo përmes kartës së ruajtur në aplikacion.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-700 mb-8 flex-1">
                    <li className="flex gap-2.5"><FiCheckCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />Pa angazhim të fshehur me kartë</li>
                    <li className="flex gap-2.5"><FiCheckCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />Mbështetje gjatë përdorimit</li>
                    <li className="flex gap-2.5"><FiCheckCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />Transparencë në çmime</li>
                  </ul>
                  <Link to="/apply" className="flex h-11 items-center justify-center rounded-lg border border-slate-200 text-slate-800 text-sm font-semibold hover:border-slate-400 hover:bg-slate-50 transition-colors">
                    Mësoni më shumë duke aplikuar
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal className="mt-8">
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 sm:px-8 sm:py-6 text-center text-sm sm:text-base text-slate-600 leading-relaxed">
                <p className="max-w-3xl mx-auto">
                  <strong className="text-slate-900">Pagesa “live” (e drejtpërdrejtë):</strong> nuk ofrojmë pagesë automatike me kartë brenda aplikacionit.
                  Faturimi dhe pagesa rregullohen drejtpërdrejt me ju — për shembull me faturë, transfertë bankare ose në takim — që të keni kontroll të plotë dhe transparencë.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative py-28 lg:py-36 overflow-hidden">
          <img
            src={IMAGES.cta}
            alt={IMAGES.ctaAlt}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-950/85" />
          <div className={`relative ${shell} max-w-3xl mx-auto text-center`}>
            <Reveal>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4 tracking-tight">
                Gati të filloni?
              </h2>
              <p className="text-slate-300 mb-10 text-lg leading-relaxed">
                Hyni me llogarinë tuaj ose aplikoni për të hapur një klinikë të re në platformë. Ekipi shqyrton aplikimin dhe ju njofton.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center justify-center px-8 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors"
                >
                  Hyr në sistem
                </Link>
                <Link
                  to="/apply"
                  className="inline-flex h-12 items-center justify-center px-8 rounded-lg border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Aplikoni për klinikë
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10">
        <div className={`${shell} flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">iKlinika</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a href="#funksionalitete" className="hover:text-slate-900 transition-colors">Funksionalitete</a>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Hyr</Link>
            <Link to="/apply" className="hover:text-slate-900 transition-colors">Aplikoni</Link>
            <a href="#cmime" className="hover:text-slate-900 transition-colors">Çmimet</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
