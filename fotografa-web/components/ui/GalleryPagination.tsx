"use client";

type GalleryPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function GalleryPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: GalleryPaginationProps) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl"
      aria-label="Paginación de galería"
    >
      <div className="text-sm text-slate-600">
        Mostrando <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> de{" "}
        <span className="font-medium">{totalItems}</span> fotos
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        >
          ← Anterior
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 7) return true;
              return (
                p === 1 ||
                p === totalPages ||
                Math.abs(p - currentPage) <= 2
              );
            })
            .reduce<number[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push(-1);
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === -1 ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-label={`Página ${p}`}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={`min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    p === currentPage
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        >
          Siguiente →
        </button>
      </div>
    </nav>
  );
}
