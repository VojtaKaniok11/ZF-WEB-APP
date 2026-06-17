// Sdílená klasifikace výsledku lékařské prohlídky.
// Odolná vůči diakritice a velikosti písmen – data mohou obsahovat
// např. "Zpusobily", "Způsobilý", "Způsobilý s omezením", "Nezpůsobilý".
export function medicalResultClass(result: string): string {
    const r = (result ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, ""); // odstranění diakritiky
    if (r.includes("nezpusobil")) return "bg-red-50 text-red-700";
    if (r.includes("omezen") || r.includes("podmink")) return "bg-amber-50 text-amber-700";
    if (r.includes("zpusobil")) return "bg-emerald-50 text-emerald-700";
    return "bg-gray-100 text-gray-600";
}
