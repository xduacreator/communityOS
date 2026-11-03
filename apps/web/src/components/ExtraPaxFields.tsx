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
    <div className="p-3.5 bg-white border border-[#E6E6E0] rounded-2xl mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-bold text-[#3A3C41] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[var(--club-text)]" />
          Peserta ({1 + names.length} pax)
        </label>
        <button
          type="button"
          aria-label="Tambah peserta"
          disabled={names.length >= MAX_EXTRA_PAX}
          onClick={() => onNamesChange([...names, ""])}
          className="w-8 h-8 flex items-center justify-center bg-[#111214] hover:bg-[#2a2c30] text-white rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E6E6E0] rounded-xl text-sm">
        <span className="font-bold text-[#6B6E74] w-4">1.</span>
        <span className="flex-1 font-semibold text-[#111214]">
          {leadName}
        </span>
        <span className="text-xs font-bold text-[#6B6E74]">
          {leadLabel}
        </span>
      </div>
      {names.map((name, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="font-bold text-[#6B6E74] text-sm w-4 ml-3">
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
            className="flex-1 px-3 py-2 bg-white border border-[#E6E6E0] rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--club)]"
          />
          <button
            type="button"
            aria-label={`Hapus peserta ${index + 2}`}
            onClick={() => onNamesChange(names.filter((_, i) => i !== index))}
            className="p-1.5 text-[#6B6E74] hover:text-red-500 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <p className="text-xs text-[#55585E] font-semibold">{note}</p>
    </div>
  );
}
