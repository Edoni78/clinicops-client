import React from "react";
import { FiDownload, FiDroplet, FiFile, FiUpload } from "react-icons/fi";

export default function LabResultsSection({
  labFileInputKey,
  labUploading,
  setLabUploading,
  id,
  uploadLabResult,
  getLabResults,
  setLabResults,
  setLabFileInputKey,
  showNotif,
  labResultsLoading,
  labResults,
  downloadLabResultFile,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7 mb-7">
      <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <FiDroplet className="text-amber-600" />
        Rezultatet e laboratorit
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Shtoni PDF të rezultateve të laboratorit. Ato do të përfshihen në raportin e rastit (Shkarko PDF).
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl cursor-pointer transition-colors border border-slate-200">
          <FiUpload size={18} />
          Zgjidh PDF
          <input
            key={labFileInputKey}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !id) return;
              setLabUploading(true);
              try {
                await uploadLabResult(id, file);
                const list = await getLabResults(id);
                setLabResults(Array.isArray(list) ? list : []);
                setLabFileInputKey((k) => k + 1);
                showNotif("success", "Rezultati i laboratorit u ngarkua.");
              } catch (err) {
                const msg = err.response?.data?.message || err.response?.data || "Ngarkimi dështoi.";
                showNotif("error", msg);
              } finally {
                setLabUploading(false);
              }
            }}
            disabled={labUploading}
          />
        </label>
        {labUploading && <span className="text-sm text-slate-500 animate-pulse">Duke ngarkuar…</span>}
      </div>

      {labResultsLoading ? (
        <p className="text-sm text-slate-500">Duke ngarkuar rezultatet…</p>
      ) : labResults.length === 0 ? (
        <p className="text-sm text-slate-500 italic">Nuk ka rezultate laboratori ende. Shtoni një PDF më sipër.</p>
      ) : (
        <ul className="space-y-2">
          {labResults.map((lab) => (
            <li key={lab.id} className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="flex items-center gap-2 text-slate-800"><FiFile className="text-amber-600" />{lab.fileName ?? lab.FileName ?? "lab-result.pdf"}</span>
              <span className="text-xs text-slate-500">{lab.uploadedAt ?? lab.UploadedAt ? new Date(lab.uploadedAt ?? lab.UploadedAt).toLocaleString("sq-AL") : ""}</span>
              <button type="button" onClick={() => downloadLabResultFile(lab.downloadUrl ?? lab.DownloadUrl, lab.fileName ?? lab.FileName ?? "lab-result.pdf")} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200">
                <FiDownload size={16} />
                Shkarko
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
