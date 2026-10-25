import { Plus, Users, X } from "lucide-react";

export const MAX_EXTRA_PAX = 5;

interface ExtraPaxFieldsProps {
  // The person placing the order; always pax 1
  leadName: string;
  leadLabel: string;
  names: string[];
  onNamesChange: (names: string[]) => void;
  note: string;
}

export default function ExtraPaxFields({
  leadName,
  leadLabel,
  names,
  onNamesChange,
  note,
}: ExtraPaxFieldsProps) {
  return (
    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          Peserta ({1 + names.length} pax)
        </label>
        <button
          type="button"
          aria-label="Tambah peserta"
          disabled={names.length >= MAX_EXTRA_PAX}
          onClick={() => onNamesChange([...names, ""])}
          className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
        <span className="font-bold text-slate-400 w-4">1.</span>
        <span className="flex-1 font-semibold text-slate-800 dark:text-slate-200">
          {leadName}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          {leadLabel}
        </span>
      </div>
      {names.map((name, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="font-bold text-slate-400 text-xs w-4 ml-3">
            {index + 2}.
          </span>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) =>
              onNamesChange(
                names.map((n, i) => (i === index ? e.target.value : n)),
              )
            }
            placeholder={`Nama peserta ${index + 2}`}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            aria-label={`Hapus peserta ${index + 2}`}
            onClick={() => onNamesChange(names.filter((_, i) => i !== index))}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <p className="text-[10px] text-slate-500 font-semibold">{note}</p>
    </div>
  );
}
