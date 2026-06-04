import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiArrowRight, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useDashboardPanel } from "../../context/DashboardPanelContext";
import { isClinicAdminRole } from "../../utils/dashboardMenu";
import {
  isClinicAdminOnboardingDone,
  markClinicAdminOnboardingDone,
} from "../../utils/clinicAdminOnboarding";

const TOUR_STEPS = [
  {
    target: "clinic-profile",
    title: "Profili i klinikës",
    body: "Filloni këtu: shtoni emrin, logon, adresën dhe preferencat e klinikës suaj.",
    placement: "bottom",
  },
  {
    target: "cases",
    title: "Rastet",
    body: "Menaxhoni vizitat — infermieri regjistron shenjat, mjeku konsulton dhe përfundon rastin.",
    placement: "bottom",
  },
  {
    target: "reports",
    title: "Raportet",
    body: "Pas përfundimit nga mjeku, infermieri mbyll rastin dhe mund të printohet raporti.",
    placement: "bottom",
  },
  {
    target: "patients",
    title: "Pacientët",
    body: "Regjistroni pacientë të rinj dhe hapni vizita të reja për klinikën.",
    placement: "bottom",
  },
  {
    target: "emrs",
    title: "EMRs",
    body: "Historia e plotë mjekësore e pacientit — konsultat, raportet dhe shenjat vitale.",
    placement: "bottom",
  },
  {
    target: "staff",
    title: "Stafi",
    body: "Shtoni mjekë, infermierë dhe laborantë që punojnë në klinikën tuaj.",
    placement: "bottom",
  },
  {
    target: "home",
    title: "Paneli kryesor",
    body: "Kthehuni këtu për një pasqyrë të shpejtë të aktivitetit të klinikës.",
    placement: "bottom",
  },
];

const PAD = 8;

function findVisibleTourTarget(targetId) {
  const nodes = document.querySelectorAll(`[data-tour="${targetId}"]`);
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return nodes[0] ?? null;
}

function getUserAndClinicIds(user) {
  return {
    userId: user?.id ?? user?.Id ?? null,
    clinicId: user?.clinicId ?? user?.ClinicId ?? null,
  };
}

export default function ClinicAdminOnboardingTour() {
  const location = useLocation();
  const { user } = useAuth();
  const { roleLower, initialized } = useDashboardPanel();
  const { userId, clinicId } = getUserAndClinicIds(user);
  const hasClinic = !!clinicId;

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const steps = useMemo(
    () => TOUR_STEPS.filter((s) => s.target !== "clinic-profile" || hasClinic),
    [hasClinic]
  );

  const finish = useCallback(() => {
    markClinicAdminOnboardingDone(userId, clinicId);
    setActive(false);
    setSpotlight(null);
    setTooltip(null);
  }, [userId, clinicId]);

  const updatePositions = useCallback(() => {
    if (!active || !steps[stepIndex]) return;
    const el = findVisibleTourTarget(steps[stepIndex].target);
    if (!el) {
      setSpotlight(null);
      setTooltip(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setSpotlight({
      top: rect.top - PAD,
      left: rect.left - PAD,
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2,
    });
    const centerX = rect.left + rect.width / 2;
    const below = rect.bottom + 16;
    const above = rect.top - 16;
    const placeBelow = rect.bottom < window.innerHeight * 0.55;
    setTooltip({
      top: placeBelow ? below : above,
      left: Math.min(Math.max(centerX, 180), window.innerWidth - 180),
      placeBelow,
      arrowX: centerX,
    });
  }, [active, stepIndex, steps]);

  useEffect(() => {
    if (!initialized || location.pathname === "/dashboard/panel") return;
    if (!isClinicAdminRole(roleLower) || !hasClinic) return;
    if (isClinicAdminOnboardingDone(userId, clinicId)) return;

    const t = window.setTimeout(() => setActive(true), 600);
    return () => window.clearTimeout(t);
  }, [initialized, location.pathname, roleLower, hasClinic, userId, clinicId]);

  useEffect(() => {
    if (!active) return undefined;
    updatePositions();
    const onLayout = () => updatePositions();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    const ro = new ResizeObserver(onLayout);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
      ro.disconnect();
    };
  }, [active, stepIndex, updatePositions]);

  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  if (!active || steps.length === 0) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;
  const stepNum = stepIndex + 1;

  const goNext = () => {
    if (isLast) finish();
    else setStepIndex((i) => i + 1);
  };

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="fixed inset-0 pointer-events-auto" aria-hidden onClick={(e) => e.preventDefault()} />
      {/* Dark overlay via spotlight box-shadow */}
      {spotlight ? (
        <div
          className="pointer-events-none fixed rounded-xl transition-all duration-300 ease-out ring-2 ring-white/90 ring-offset-2 ring-offset-transparent"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.82)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-slate-900/82 pointer-events-auto" aria-hidden />
      )}

      {/* Arrow toward highlighted nav item */}
      {spotlight && tooltip && (
        <div
          className="pointer-events-none fixed z-[201] text-white"
          style={{
            left: tooltip.arrowX - 12,
            top: tooltip.placeBelow ? spotlight.top + spotlight.height + 2 : spotlight.top - 28,
          }}
          aria-hidden
        >
          <div
            className={`mx-auto w-0 h-0 border-x-[12px] border-x-transparent ${
              tooltip.placeBelow
                ? "border-b-[14px] border-b-white"
                : "border-t-[14px] border-t-white"
            }`}
          />
        </div>
      )}

      {/* Tooltip card */}
      {tooltip && (
        <div
          className="fixed z-[202] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 pointer-events-auto"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          <div
            className={`rounded-2xl bg-white shadow-2xl border border-slate-200/90 p-5 ${
              tooltip.placeBelow ? "mt-1" : "-translate-y-full -mt-1"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-clinic-600">
                Hapi {stepNum} / {steps.length}
              </p>
              <button
                type="button"
                onClick={finish}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Mbyll udhëzimin"
              >
                <FiX size={18} />
              </button>
            </div>
            <h2 id="onboarding-title" className="text-lg font-semibold text-slate-900 mb-2">
              {step.title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">{step.body}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={finish}
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Kaloje
              </button>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clinic-500 text-white text-sm font-semibold hover:bg-clinic-600 shadow-sm"
              >
                {isLast ? "Përfundo" : "Vazhdo"}
                {!isLast && <FiArrowRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {!spotlight && (
        <div className="fixed inset-0 z-[202] flex items-center justify-center p-6 pointer-events-auto">
          <div className="rounded-2xl bg-white p-6 max-w-sm shadow-2xl text-center">
            <p className="text-sm text-slate-600 mb-4">
              Hapni menunë (☰) në mobile për të parë navigimin, ose zgjeroni dritaren.
            </p>
            <button type="button" onClick={finish} className="btn-secondary btn-sm">
              Kaloje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
