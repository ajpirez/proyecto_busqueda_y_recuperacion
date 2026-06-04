'use client';

import type { Facet } from '@rag/shared';

export interface SelectedFacets {
  tribunal: string[];
  year: number[];
  tipoRecurso: string[];
}

export interface FacetSidebarProps {
  facets: Facet[];
  selected: SelectedFacets;
  onToggle: (field: keyof SelectedFacets, value: string) => void;
  onClear: () => void;
}

function isChecked(
  selected: SelectedFacets,
  field: string,
  value: string,
): boolean {
  if (field === 'year') return selected.year.includes(Number(value));
  if (field === 'tribunal') return selected.tribunal.includes(value);
  if (field === 'tipoRecurso') return selected.tipoRecurso.includes(value);
  return false;
}

export function FacetSidebar({
  facets,
  selected,
  onToggle,
  onClear,
}: FacetSidebarProps) {
  const totalSelected =
    selected.tribunal.length +
    selected.year.length +
    selected.tipoRecurso.length;

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Filtros</h2>
          {totalSelected > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Limpiar ({totalSelected})
            </button>
          )}
        </div>

        {facets.length === 0 && (
          <p className="text-sm text-slate-400">Sin filtros disponibles.</p>
        )}

        <div className="space-y-5">
          {facets.map((facet) => (
            <div key={facet.field}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {facet.label}
              </h3>
              <ul className="space-y-1.5">
                {facet.values.map((v) => (
                  <li key={v.value}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={isChecked(selected, facet.field, v.value)}
                        onChange={() =>
                          onToggle(
                            facet.field as keyof SelectedFacets,
                            v.value,
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="flex-1 truncate">{v.label}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {v.count}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
