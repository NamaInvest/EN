'use client';
import { useTranslation } from "@/lib/i18n";
import { getSettingGroups } from "@/app/(dashboard)/settings/page";
import { useMemo } from "react";
import { translate } from "@/lib/translations";

export default function DebugPage() {
    const { t, lang } = useTranslation();
    const groups = useMemo(() => getSettingGroups(t), [t]);
    const direct4390 = t("sys.str_4390");
    const direct_translate = translate("sys.str_4390", "ar");
    return (
        <div style={{ padding: "20px", fontFamily: "Arial" }}>
            <h1>Translation Debug</h1>
            <p><strong>Current lang:</strong> {lang}</p>
            <p><strong>t("sys.str_4390"):</strong> {direct4390}</p>
            <p><strong>translate("sys.str_4390", "ar"):</strong> {direct_translate}</p>
            <p><strong>groups[0].title:</strong> {groups[0]?.title}</p>
            <p><strong>groups[0].keys[0].label:</strong> {groups[0]?.keys[0]?.label}</p>
            <hr/>
            <h2>All group titles:</h2>
            <ul>
                {groups.map((g, i) => (
                    <li key={i}><strong>{i}:</strong> {g.title}</li>
                ))}
            </ul>
        </div>
    );
}