import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiMenu, FiX, FiPlus, FiMinus } from "react-icons/fi";
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
    title: "Pacientë dhe raste",
    desc: "Regjistrim, lista e pacientëve dhe rrjedha e rasteve nga pritja deri te mbyllja.",
  },
  {
    title: "Laboratori dhe raporte",
    desc: "Ngarkim PDF rezultatesh, lista sipas rastit dhe raport PDF që përmbledh raportin mjekësor me laboratorin.",
  },
  {
    title: "Shërbime dhe staf",
    desc: "Emër dhe çmim për çdo shërbim; krijim përdoruesish Doctor, Nurse, Lab për klinikën tuaj.",
  },
  {
    title: "Qasje me role",
    desc: "Autentikim me JWT dhe role. Përditësime të menjëhershme për shenjat jetësore, raportin dhe statusin e rastit.",
  },
];

const highlights = [
  "Panele të ndara për infermierë, mjekë dhe super administrator",
  "Raport PDF i plotë: raport mjekësor plus PDF-të e laboratorit në një skedar",
  "Ndërfaqe në shqip, e ndërtuar për punën e përditshme në klinikë",
];

const featureTabs = [
  {
    label: "Të gjitha funksionet",
    headline: "Detyrat e klinikës në një panel të qartë.",
    description:
      "Organizoni rastet, informacionin e pacientit dhe punën e përditshme pa ndërruar sisteme.",
    bullets: [
      "Planifikoni, caktoni dhe menaxhoni rastet nëpër ekip.",
      "Ruani informacionin e përbashkët dhe hapeni kur duhet.",
      "Zvogëloni punën manuale dhe gabimet në proceset e përditshme.",
    ],
    image: tab1,
    imageAlt: "Pamje e përgjithshme e panelit iKlinika",
  },
  {
    label: "Pacientë & raste",
    headline: "Regjistrim i shpejtë dhe ndjekje e qartë e rasteve.",
    description:
      "Hapni raste të reja, ndiqni statusin nga pritja deri te mbyllja dhe mbani historikun e pacientit në një vend.",
    bullets: [
      "Formular regjistrimi me të dhëna bazë dhe lidhje me klinikën.",
      "Lista e rasteve me status: në pritje, në progres, përfunduar.",
      "Faqe detaji për çdo rast sipas rolit, infermier ose mjek.",
    ],
    image: tab2,
    imageAlt: "Paneli i pacientëve dhe rasteve",
  },
  {
    label: "Shenja jetësore",
    headline: "Matje të sakta para konsultës.",
    description:
      "Infermierët regjistrojnë peshën, presionin, temperaturën dhe rrahjet. Rasti kalon te mjeku sapo të jetë gati.",
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
    headline: "Konsultim dhe raport mjekësor në të njëjtën kartelë.",
    description:
      "Anamneza, diagnoza dhe terapia në një ndërfaqe të pastër. Filloni konsultimin dhe përfundoni vizitën nga rasti.",
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
    headline: "Rezultatet e laboratorit sipas rastit.",
    description:
      "Ngarkoni PDF rezultatesh, filtroni sipas datës dhe hapni dokumentacionin e çdo pacienti.",
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
      "Shkarkoni raportin mjekësor së bashku me PDF-të e laboratorit. Një skedar, i gatshëm për arshivim ose printim.",
    bullets: [
      "Lista e raporteve me filtra: sot, java, të gjitha.",
      "PDF nga serveri me token. Skedarët nuk janë publikë.",
      "Përmbledhje e plotë: raport mjekësor plus faqet e laboratorit.",
    ],
    image: tab6,
    imageAlt: "Paneli i raporteve dhe PDF",
  },
  {
    label: "Stafi & rolet",
    headline: "Role dhe qasje për çdo anëtar të ekipit.",
    description:
      "Krijoni llogari për mjekë, infermierë dhe laborator. Çdo rol sheh vetëm panelin dhe menutë që i duhen.",
    bullets: [
      "Panele të ndara: infermier, mjek, super administrator.",
      "Krijim përdoruesish të rinj nga admini i klinikës.",
      "Autentikim me JWT dhe kontroll i qartë i qasjes.",
    ],
    image: tab7,
    imageAlt: "Paneli i stafit dhe roleve",
  },
];

const featureStories = [
  { tabIndex: 1 },
  { tabIndex: 4 },
  { tabIndex: 5 },
  { tabIndex: 6 },
];

const workflowSteps = [
  {
    step: "01",
    title: "Pacienti dhe rasti",
    desc: "Regjistroni pacientin dhe hapni një rast. Statusi ndjek rrjedhën: në pritje, në progres, në konsultim, përfunduar.",
  },
  {
    step: "02",
    title: "Infermieri, shenjat jetësore",
    desc: "Pesha, presioni, temperatura, rrahjet e zemrës. Ruajtja dhe kalimi i rastit te mjeku kur është gati.",
  },
  {
    step: "03",
    title: "Mjeku, konsultim dhe raport",
    desc: "Anamneza, diagnoza, terapia. Ndryshim statusi (fillo konsultimin, përfundo vizitën). Shkarkim i raportit PDF nga serveri.",
  },
  {
    step: "04",
    title: "Laboratori dhe dokumentacion",
    desc: "Ngarkoni PDF rezultatesh për çdo rast. Raporti i shkarkuar përfshin automatikisht faqet e laboratorit.",
  },
];

const dashboardPanels = [
  {
    title: "Paneli i infermierit",
    subtitle: "Për infermierët",
    items: [
      "Pacientët: regjistrim dhe lista",
      "Rastet: hapja dhe ndjekja e statusit",
      "Shenjat jetësore dhe dërgimi te mjeku",
      "Laboratori: ngarkim PDF për rastet",
    ],
  },
  {
    title: "Paneli i mjekut",
    subtitle: "Për mjekët",
    items: [
      "Rastet me shenja jetësore të përditësuara",
      "Raport mjekësor (anamneza, diagnozë, terapi)",
      "Raportet: lista dhe shkarkim PDF",
      "Profili: emër shfaqje, nënshkrim dhe vulë për PDF",
    ],
  },
  {
    title: "Paneli i super administratorit",
    subtitle: "Për administrimin e platformës",
    items: [
      "Aplikimet: aprovim ose refuzim klinikash të reja",
      "Qasje e plotë në raste, pacientë, laborator, shërbime",
      "Stafi: krijim përdoruesish për klinikën (mjek, infermier, laborator)",
    ],
  },
];

const deepFeatures = [
  {
    title: "Pacientët",
    text: "Formular regjistrimi me të dhëna bazë dhe lidhje me klinikën nga llogaria.",
  },
  {
    title: "Menaxhimi i rasteve",
    text: "Lista e rasteve me status. Faqe detaji për çdo rast sipas rolit (infermier / mjek).",
  },
  {
    title: "Laboratori",
    text: "Faqe e dedikuar: filtrim sipas sot / dje / datës. Ngarkim dhe shkarkim PDF për çdo rast.",
  },
  {
    title: "Raportet dhe PDF",
    text: "Faqja Raportet me filtra (sot, java, të gjitha). PDF nga backend: raporti plus PDF-të e laboratorit.",
  },
  {
    title: "Shërbimet dhe çmimet",
    text: "Lista, shtim, ndryshim dhe fshirje (joaktiv) i shërbimeve me emër dhe çmim për klinikën.",
  },
  {
    title: "Profili i klinikës",
    text: "Emër, adresë, telefon, përshkrim. Logo e klinikës (ngarkim foto).",
  },
  {
    title: "Stafi",
    text: "Klinika admin ose super admin: lista e përdoruesve, filtrim sipas rolit, krijim llogarish të reja stafi.",
  },
  {
    title: "Aplikimet",
    text: "Super admin: shqyrtim i aplikimeve për klinika të reja, aprovim ose refuzim me shënim.",
  },
  {
    title: "Shkarkime të sigurta",
    text: "Të gjitha shkarkimet e PDF përmes API me token. Skedarët e laboratorit nuk janë publikë.",
  },
];

const adminBullets = [
  "Administratori i klinikës sheh të gjitha menutë operacionale pa ndarje paneli (rastet, shërbimet, stafi, profili).",
  "Tekniku i laboratorit ka të njëjtën qasje të gjerë në operacionet e përditshme.",
  "Pas hyrjes, infermierët, mjekët dhe super admin zgjedhin panelin e duhur. Paneli i gabuar tregon mesazh nëse roli nuk përputhet.",
];

const faqs = [
  {
    q: "Si funksionon rrjedha e punës në klinikë?",
    a: "Platforma pasqyron procesin në klinikë: hapja e rastit, matjet nga infermieri, konsultimi nga mjeku, plus rezultatet e laboratorit që bashkohen në raportin e shkarkuar.",
  },
  {
    q: "Cilët panele dhe role ekzistojnë?",
    a: "Pas hyrjes, përdoruesit me rol infermier, mjek ose super administrator zgjedhin panelin e tyre. Menuja dhe qasja përshtaten. Administratori i klinikës sheh të gjitha menutë operacionale pa ndarje paneli. Teknici i laboratorit ka qasje të gjerë në operacionet e përditshme.",
  },
  {
    q: "Çfarë përfshin prova falas?",
    a: "Përdorni të gjitha funksionet për dy muaj, pa pagesë dhe pa kartë bankare për të filluar. Prova nuk kërkon kartë bankare.",
  },
  {
    q: "Si funksionon pagesa pas provës?",
    a: "Nuk ofrojmë pagesë automatike me kartë brenda aplikacionit. Faturimi rregullohet me ju, me faturë, transfertë ose në takim. Pas provës mund të zgjidhni abonim vjetor 120 € ose mujor 25 €.",
  },
  {
    q: "Si shkarkohen raportet dhe rezultatet e laboratorit?",
    a: "Raporti PDF përmban raportin mjekësor plus PDF-të e laboratorit në një skedar. Shkarkimet bëhen nga serveri me token. Skedarët e laboratorit nuk janë publikë.",
  },
  {
    q: "A është ndërfaqja në shqip?",
    a: "Po. Ndërfaqja është në shqip, e ndërtuar për punën e përditshme në klinikë.",
  },
];

const navLinks = [
  { href: "#funksionalitete", label: "Funksionalitete" },
  { href: "#cmime", label: "Çmimet" },
  { href: "/apply", label: "Aplikoni", isRoute: true },
];

const shell = "max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10";

function NavItem({ href, label, isRoute, onClick, className = "" }) {
  const cls = `text-[15px] text-[#666666] hover:text-[#111111] transition-colors ${className}`;
  if (isRoute) {
    return (
      <Link to={href} onClick={onClick} className={cls}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} onClick={onClick} className={cls}>
      {label}
    </a>
  );
}

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobileNav = () => setMobileNavOpen(false);
  const activeTab = featureTabs[activeFeatureTab];

  const showFeature = (index) => {
    setActiveFeatureTab(index);
    const el = document.getElementById("funksionalitete");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#F4F4F2] text-[#111111] overflow-x-hidden antialiased">
      <header
        className={`sticky top-0 z-50 bg-[#F4F4F2] ${
          navScrolled ? "border-b border-[#E5E5E2]" : "border-b border-transparent"
        }`}
      >
        <div className={`${shell} flex h-[4.25rem] items-center justify-between gap-6`}>
          <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={closeMobileNav}>
            <img src={navLogo} alt="iKlinika" className="h-8 w-auto object-contain" />
            <span className="text-[17px] font-medium tracking-tight text-[#111111]">iKlinika</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavItem key={link.href} {...link} />
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-5">
            <Link to="/login" className="text-[15px] text-[#666666] hover:text-[#111111] transition-colors">
              Hyr
            </Link>
            <Link
              to="/apply"
              className="inline-flex items-center h-10 px-5 rounded-xl bg-[#111111] text-white text-[14px] font-medium hover:bg-black transition-colors"
            >
              Aplikoni
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl text-[#111111]"
            aria-label={mobileNavOpen ? "Mbyll menunë" : "Hap menunë"}
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-[#E5E5E2] bg-[#F4F4F2]">
            <nav className={`${shell} py-5 flex flex-col gap-1`}>
              {navLinks.map((link) => (
                <NavItem key={link.href} {...link} onClick={closeMobileNav} className="px-1 py-3 text-base" />
              ))}
              <Link
                to="/login"
                onClick={closeMobileNav}
                className="mt-3 flex h-11 items-center justify-center rounded-xl border border-[#E5E5E2] bg-white text-[#111111] text-[15px] font-medium"
              >
                Hyr
              </Link>
              <Link
                to="/apply"
                onClick={closeMobileNav}
                className="flex h-11 items-center justify-center rounded-xl bg-[#111111] text-white text-[15px] font-medium"
              >
                Aplikoni
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="pt-10 sm:pt-14 lg:pt-16 pb-4">
          <div className={shell}>
            <h1 className="max-w-4xl text-[2.35rem] sm:text-5xl lg:text-[4.5rem] font-medium leading-[1.05] tracking-tight text-[#111111] mb-6">
              Operacione klinike, pacientë dhe raporte në një sistem
            </h1>
            <p className="max-w-[38rem] text-base sm:text-lg text-[#666666] leading-relaxed mb-8">
              iKlinika lidh recepsionin, infermierët, mjekët dhe laboratorin. Ndiqni rastet, shenjat jetësore dhe dokumentacionin nga i njëjti panel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-10 lg:mb-14">
              <Link
                to="/login"
                className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#111111] text-white text-[15px] font-medium hover:bg-black transition-colors"
              >
                Hyr në sistem
              </Link>
              <a
                href="#funksionalitete"
                className="inline-flex items-center justify-center h-12 px-7 rounded-xl text-[#111111] text-[15px] font-medium hover:bg-white/70 transition-colors"
              >
                Shiko funksionalitetet
              </a>
            </div>

            <div className="relative overflow-hidden rounded-[24px] aspect-[16/10] sm:aspect-[2.05/1] min-h-[240px]">
              <img
                src={IMAGES.cta}
                alt={IMAGES.ctaAlt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
          </div>
        </section>

        <section className="py-24 lg:py-32">
          <div className={shell}>
            <div className="max-w-xl mb-10 lg:mb-14">
              <h2 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] tracking-tight mb-4">
                Nga vizita te raporti PDF
              </h2>
              <p className="text-base sm:text-lg text-[#666666] leading-relaxed">
                Platforma pasqyron procesin në klinikë: hapja e rastit, matjet nga infermieri, konsultimi nga mjeku, plus rezultatet e laboratorit që bashkohen në raportin e shkarkuar.
              </p>
            </div>

            <div className="bg-white rounded-[24px] overflow-hidden">
              {workflowSteps.map((item, i) => (
                <div
                  key={item.step}
                  className={`grid sm:grid-cols-[5.5rem_1fr] gap-4 sm:gap-8 px-6 sm:px-10 lg:px-14 py-8 lg:py-10 ${
                    i < workflowSteps.length - 1 ? "border-b border-[#E5E5E2]" : ""
                  }`}
                >
                  <span className="text-[1.75rem] sm:text-[2rem] font-medium tabular-nums text-[#B8B8B4] leading-none pt-0.5">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-medium text-[#111111] mb-2">{item.title}</h3>
                    <p className="text-base sm:text-[17px] text-[#666666] leading-relaxed max-w-2xl">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-24 lg:pb-32">
          <div className={shell}>
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-12 lg:mb-16">
              <div className="lg:col-span-5">
                <h2 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] tracking-tight mb-5">
                  Çfarë ofron iKlinika
                </h2>
                <p className="text-base sm:text-lg text-[#666666] leading-relaxed max-w-md">
                  Përmbledhje e moduleve që përdor ekipi çdo ditë.
                </p>
              </div>
              <div className="lg:col-span-7 overflow-hidden rounded-[24px] aspect-[16/10]">
                <img
                  src={IMAGES.platform}
                  alt={IMAGES.platformAlt}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
              {features.map((item) => (
                <div key={item.title}>
                  <h3 className="text-lg font-medium text-[#111111] mb-2">{item.title}</h3>
                  <p className="text-[15px] text-[#666666] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="funksionalitete" className="scroll-mt-24 pb-24 lg:pb-32">
          <div className={shell}>
            <h2 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] tracking-tight mb-8 lg:mb-12 max-w-2xl">
              Funksionalitete
            </h2>

            <div className="flex gap-1 overflow-x-auto scrollbar-none mb-10 border-b border-[#E5E5E2]">
              {featureTabs.map((tab, index) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveFeatureTab(index)}
                  className={`shrink-0 whitespace-nowrap px-1 mr-6 py-3 text-[15px] transition-colors ${
                    activeFeatureTab === index
                      ? "text-[#111111] border-b border-[#111111] -mb-px"
                      : "text-[#666666] hover:text-[#111111] border-b border-transparent -mb-px"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start mb-8">
              <div className="lg:col-span-5">
                <h3 className="text-2xl sm:text-3xl lg:text-[2.15rem] font-medium leading-snug tracking-tight mb-4">
                  {activeTab.headline}
                </h3>
                <p className="text-base sm:text-lg text-[#666666] leading-relaxed mb-6 max-w-md">
                  {activeTab.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {activeTab.bullets.map((bullet) => (
                    <li key={bullet} className="text-[15px] sm:text-base text-[#666666] leading-relaxed pl-0">
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-2 text-[15px] font-medium text-[#111111] hover:gap-3 transition-all"
                >
                  Aplikoni
                  <FiArrowRight size={16} />
                </Link>
              </div>
              <div className="lg:col-span-7 overflow-hidden rounded-[24px] border border-[#E5E5E2] bg-white">
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

        <section className="pb-24 lg:pb-32">
          <div className={shell}>
            <h2 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] tracking-tight mb-10 lg:mb-14 max-w-2xl">
              Paneli i punës, në detaj
            </h2>
            <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
              {featureStories.map(({ tabIndex }) => {
                const story = featureTabs[tabIndex];
                return (
                  <article key={story.label} className="group">
                    <button
                      type="button"
                      onClick={() => showFeature(tabIndex)}
                      className="w-full text-left"
                    >
                      <div className="overflow-hidden rounded-[24px] border border-[#E5E5E2] bg-white mb-5">
                        <img
                          src={story.image}
                          alt={story.imageAlt}
                          className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-medium text-[#111111] mb-2">{story.headline}</h3>
                      <p className="text-[15px] sm:text-base text-[#666666] leading-relaxed mb-3 max-w-md">
                        {story.description}
                      </p>
                      <span className="inline-flex items-center gap-2 text-[15px] font-medium text-[#111111]">
                        Mësoni më shumë
                        <FiArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-24 lg:pb-32">
          <div className={shell}>
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
              <div className="lg:col-span-6 overflow-hidden rounded-[24px] aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
                <img
                  src={IMAGES.workflow}
                  alt={IMAGES.workflowAlt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="lg:col-span-6 lg:pt-8">
                <h2 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] tracking-tight mb-5">
                  Tre panele, një platformë
                </h2>
                <p className="text-base sm:text-lg text-[#666666] leading-relaxed mb-10 max-w-md">
                  Pas hyrjes, përdoruesit me rol infermier, mjek ose super administrator zgjedhin panelin e tyre. Menuja dhe qasja përshtaten.
                </p>

                <div className="space-y-8">
                  {dashboardPanels.map((panel) => (
                    <div key={panel.title} className="border-t border-[#E5E5E2] pt-6">
                      <p className="text-sm text-[#888888] mb-1">{panel.subtitle}</p>
                      <h3 className="text-xl font-medium text-[#111111] mb-3">{panel.title}</h3>
                      <ul className="space-y-1.5">
                        {panel.items.map((item) => (
                          <li key={item} className="text-[15px] text-[#666666] leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-[#E5E5E2]">
                  <h4 className="text-lg font-medium text-[#111111] mb-3">
                    Administratori i klinikës dhe tekniku i laboratorit
                  </h4>
                  <ul className="space-y-2">
                    {adminBullets.map((b) => (
                      <li key={b} className="text-[15px] text-[#666666] leading-relaxed">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <ul className="mt-10 space-y-3">
                  {highlights.map((text) => (
                    <li key={text} className="text-[15px] text-[#666666] leading-relaxed max-w-md">
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24 lg:pb-32">
          <div className={shell}>
            <h2 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] tracking-tight mb-4 max-w-2xl">
              Funksionalitete në detaj
            </h2>
            <p className="text-base sm:text-lg text-[#666666] leading-relaxed mb-12 lg:mb-16 max-w-xl">
              Çdo veçori më poshtë është pjesë e panelit të punës.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
              {deepFeatures.map((item) => (
                <div key={item.title}>
                  <h3 className="text-lg font-medium text-[#111111] mb-2">{item.title}</h3>
                  <p className="text-[15px] text-[#666666] leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 lg:mt-20 overflow-hidden rounded-[24px] border border-[#E5E5E2] bg-white">
              <img src={IMAGES.hero} alt={IMAGES.heroAlt} className="w-full h-auto block" loading="lazy" />
            </div>
          </div>
        </section>

        <section id="cmime" className="scroll-mt-24 pb-24 lg:pb-32">
          <div className={shell}>
            <h2 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] tracking-tight mb-4 max-w-2xl">
              Çmime dhe provë falas
            </h2>
            <p className="text-base sm:text-lg text-[#666666] leading-relaxed mb-12 lg:mb-16 max-w-xl">
              Prova nuk kërkon kartë bankare. Pas provës, zgjidhni planin. Pagesa bëhet drejtpërdrejt, jo me abonim automatik me kartë në aplikacion.
            </p>

            <div className="bg-white rounded-[24px] px-6 sm:px-10 py-10 mb-6">
              <h3 className="text-2xl sm:text-3xl font-medium text-[#111111] mb-3">2 muaj falas për të provuar</h3>
              <p className="text-base sm:text-lg text-[#666666] leading-relaxed max-w-xl">
                Përdorni të gjitha funksionet për <strong className="font-medium text-[#111111]">dy muaj</strong>, pa pagesë dhe{" "}
                <strong className="font-medium text-[#111111]">pa kartë bankare</strong> për të filluar.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white rounded-[24px] px-6 sm:px-10 py-10 flex flex-col">
                <p className="text-sm text-[#888888] mb-2">Më i zgjedhur</p>
                <h3 className="text-xl font-medium text-[#111111]">Abonim vjetor</h3>
                <p className="text-[15px] text-[#666666] mb-8">Një vit me mbështetje</p>
                <p className="text-5xl font-medium tabular-nums tracking-tight text-[#111111] mb-6">
                  120 <span className="text-2xl font-medium">€</span>
                  <span className="text-lg font-normal text-[#666666]"> / vit</span>
                </p>
                <p className="text-[15px] sm:text-base text-[#666666] leading-relaxed mb-8">
                  Pas provës, <strong className="font-medium text-[#111111]">120 euro në vit</strong>, me{" "}
                  <strong className="font-medium text-[#111111]">mbështetje teknike</strong>.
                </p>
                <ul className="space-y-2 text-[15px] text-[#666666] mb-10 flex-1">
                  <li>Çmim i fiksuar për 12 muaj</li>
                  <li>Mbështetje e vazhdueshme përgjatë vitit</li>
                  <li>Pagesë e drejtpërdrejtë (jo me kartë të lidhur në app)</li>
                </ul>
                <Link
                  to="/apply"
                  className="inline-flex items-center justify-center h-12 rounded-xl bg-[#111111] text-white text-[15px] font-medium hover:bg-black transition-colors"
                >
                  Aplikoni dhe na kontaktoni
                </Link>
              </div>

              <div className="bg-white rounded-[24px] px-6 sm:px-10 py-10 flex flex-col">
                <h3 className="text-xl font-medium text-[#111111] mt-7">Abonim mujor</h3>
                <p className="text-[15px] text-[#666666] mb-8">Një muaj në një kohë</p>
                <p className="text-5xl font-medium tabular-nums tracking-tight text-[#111111] mb-6">
                  25 <span className="text-2xl font-medium">€</span>
                  <span className="text-lg font-normal text-[#666666]"> / muaj</span>
                </p>
                <p className="text-[15px] sm:text-base text-[#666666] leading-relaxed mb-8">
                  Nëse preferoni <strong className="font-medium text-[#111111]">25 euro në muaj</strong>, pagesa bëhet drejtpërdrejt sipas marrëveshjes.
                </p>
                <ul className="space-y-2 text-[15px] text-[#666666] mb-10 flex-1">
                  <li>Pa angazhim të fshehur me kartë</li>
                  <li>Mbështetje gjatë përdorimit</li>
                  <li>Transparencë në çmime</li>
                </ul>
                <Link
                  to="/apply"
                  className="inline-flex items-center justify-center h-12 rounded-xl border border-[#E5E5E2] bg-[#F4F4F2] text-[#111111] text-[15px] font-medium hover:bg-white transition-colors"
                >
                  Mësoni më shumë duke aplikuar
                </Link>
              </div>
            </div>

            <p className="mt-8 text-[15px] sm:text-base text-[#666666] leading-relaxed max-w-2xl">
              <strong className="font-medium text-[#111111]">Pagesa e drejtpërdrejtë:</strong> nuk ofrojmë pagesë automatike me kartë brenda aplikacionit. Faturimi rregullohet me ju, me faturë, transfertë ose në takim.
            </p>
          </div>
        </section>

        <section className="pb-24 lg:pb-32">
          <div className={`${shell} max-w-4xl`}>
            <h2 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] tracking-tight mb-10 lg:mb-14">
              Pyetje të shpeshta
            </h2>
            <div>
              {faqs.map((item, index) => {
                const open = openFaq === index;
                return (
                  <div key={item.q} className="border-t border-[#E5E5E2] last:border-b">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? -1 : index)}
                      className="w-full flex items-start justify-between gap-6 py-6 text-left"
                    >
                      <span className="text-lg sm:text-xl font-medium text-[#111111] leading-snug">{item.q}</span>
                      <span className="shrink-0 mt-1 text-[#888888]" aria-hidden>
                        {open ? <FiMinus size={18} /> : <FiPlus size={18} />}
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${
                        open ? "max-h-96 opacity-100 pb-6" : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-base sm:text-[17px] text-[#666666] leading-relaxed max-w-xl">{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-24 lg:pb-32">
          <div className={shell}>
            <h2 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] tracking-tight mb-5 max-w-2xl">
              Gati të filloni?
            </h2>
            <p className="text-base sm:text-lg text-[#666666] leading-relaxed mb-8 max-w-xl">
              Hyni me llogarinë tuaj ose aplikoni për të hapur një klinikë të re. Ekipi shqyrton aplikimin dhe ju njofton.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#111111] text-white text-[15px] font-medium hover:bg-black transition-colors"
              >
                Hyr në sistem
              </Link>
              <Link
                to="/apply"
                className="inline-flex items-center justify-center h-12 px-7 rounded-xl border border-[#E5E5E2] bg-white text-[#111111] text-[15px] font-medium hover:bg-[#F4F4F2] transition-colors"
              >
                Aplikoni për klinikë
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5E5E2] pt-16 pb-10">
        <div className={shell}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 mb-16">
            <div>
              <p className="text-lg font-medium text-[#111111] mb-3">iKlinika</p>
              <p className="text-[15px] text-[#666666] leading-relaxed max-w-xs">
                Sistem për operacionet e klinikës: pacientë, raste, laborator dhe raporte.
              </p>
            </div>
            <div>
              <p className="text-sm text-[#888888] mb-4">Produkt</p>
              <ul className="space-y-3">
                <li>
                  <a href="#funksionalitete" className="text-[15px] text-[#666666] hover:text-[#111111] transition-colors">
                    Funksionalitete
                  </a>
                </li>
                <li>
                  <a href="#cmime" className="text-[15px] text-[#666666] hover:text-[#111111] transition-colors">
                    Çmimet
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-[#888888] mb-4">Llogaria</p>
              <ul className="space-y-3">
                <li>
                  <Link to="/login" className="text-[15px] text-[#666666] hover:text-[#111111] transition-colors">
                    Hyr
                  </Link>
                </li>
                <li>
                  <Link to="/apply" className="text-[15px] text-[#666666] hover:text-[#111111] transition-colors">
                    Aplikoni
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-[#888888] mb-4">Kontakt</p>
              <p className="text-[15px] text-[#666666] leading-relaxed">
                Aplikoni për klinikë. Ekipi shqyrton aplikimin dhe ju njofton.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-[#E5E5E2] text-sm text-[#888888]">
            <span>© {new Date().getFullYear()} iKlinika</span>
            <span>Platformë për klinika</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
