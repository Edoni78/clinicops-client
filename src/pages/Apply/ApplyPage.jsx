import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiMenu, FiX } from "react-icons/fi";
import navLogo from "../../assets/images/logo3.png";
import applyImage from "../../assets/home/national-cancer-institute-NFvdKIhxYlU-unsplash.jpg";
import ClinicApply from "../../components/CreateClinic/ClinicApply";

const shell = "max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-10";

const applyHighlights = [
  "2 muaj provë falas — pa kartë bankare",
  "Mbështetje teknike gjatë gjithë përdorimit",
  "Aktivizim pas shqyrtimit të aplikimit",
];

export default function ApplyPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-800 overflow-x-hidden antialiased flex flex-col">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
            : "bg-white border-b border-slate-200/80"
        }`}
      >
        <div className={`${shell} flex h-16 lg:h-[4.25rem] items-center justify-between gap-6`}>
          <Link to="/" className="flex items-center gap-3 shrink-0" onClick={closeMobileNav}>
            <img src={navLogo} alt="iKlinika" className="h-9 sm:h-10 w-auto object-contain" />
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-[#8db2c6]">iKlinika</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Faqja kryesore
            </Link>
            <a href="/#cmime" className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Çmimet
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-800 transition-colors"
            >
              Hyr në sistem
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
              <Link to="/" onClick={closeMobileNav} className="px-3 py-3 text-sm font-medium text-slate-700">
                Faqja kryesore
              </Link>
              <a href="/#cmime" onClick={closeMobileNav} className="px-3 py-3 text-sm font-medium text-slate-700">
                Çmimet
              </a>
              <Link
                to="/login"
                onClick={closeMobileNav}
                className="mt-2 flex h-11 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-semibold"
              >
                Hyr në sistem
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className={`${shell} py-12 sm:py-16 lg:py-20`}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-start">
            <div className="min-w-0 order-2 lg:order-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-clinic-600 mb-4">
                Regjistrimi i klinikës
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
                Aplikoni për iKlinika
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-lg">
                Plotësoni aplikimin për klinikën tuaj. Ekipi ynë e shqyrton dhe aktivizon llogarinë pasi të aprovohet.
              </p>

              <ul className="space-y-3 mb-10">
                {applyHighlights.map((text) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-slate-600">
                    <FiCheckCircle className="text-clinic-600 shrink-0 mt-0.5" size={16} />
                    {text}
                  </li>
                ))}
              </ul>

              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <ClinicApply embedded />
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:sticky lg:top-28">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-lg aspect-[4/3] lg:aspect-auto lg:min-h-[520px]">
                <img
                  src={applyImage}
                  alt="Mjek duke përdorur teknologji në klinikë"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-6 text-sm text-slate-500 leading-relaxed max-w-md">
                Platformë e plotë për menaxhimin e pacientëve, rasteve, laboratorit dhe raporteve — e ndërtuar për
                klinika moderne në Shqipëri.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className={`${shell} flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">iKlinika</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link to="/" className="hover:text-slate-900 transition-colors">
              Faqja kryesore
            </Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">
              Hyr
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
