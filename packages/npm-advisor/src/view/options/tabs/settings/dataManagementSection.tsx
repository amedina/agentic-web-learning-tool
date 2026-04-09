/**
 * External dependencies
 */
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  Download,
  Upload,
  AlertTriangle,
  Loader2,
  CircleAlert,
} from "lucide-react";
import {
  Button,
  OptionsPageTabSection,
  toast,
} from "@google-awlt/design-system";

type DataManagementSectionProps = {
  setIsResetModalOpen: Dispatch<SetStateAction<boolean>>;
};

export default function DataManagementSection({
  setIsResetModalOpen,
}: DataManagementSectionProps) {
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (errors.length > 0) {
      const t = setTimeout(() => setErrors([]), 2500);
      return () => clearTimeout(t);
    }
  }, [errors]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const filename = `npm-advisor-backup-${date}-${hours}-${minutes}.json`;

    const [syncData, localData] = await Promise.all([
      chrome.storage.sync.get(["apiKeys", "targetLicense"]),
      chrome.storage.local.get(["npmAdvisorThemeMode", "npmAdvisorDarkMode"]),
    ]);

    setTimeout(() => {
      const payload = {
        version: "1.0",
        timestamp: Date.now(),
        config: {
          apiKeys: syncData.apiKeys ?? {},
          targetLicense: syncData.targetLicense ?? "MIT",
          npmAdvisorThemeMode: localData.npmAdvisorThemeMode ?? "auto",
          npmAdvisorDarkMode: localData.npmAdvisorDarkMode ?? false,
        },
      };
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(payload, null, 2));
      const a = document.createElement("a");
      a.href = dataStr;
      a.download = filename;
      a.click();
      setIsExporting(false);
    }, 600);
  }, []);

  const handleImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so the same file can be re-imported if needed
    event.target.value = "";
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (_event) => {
      if (!_event.target?.result) {
        toast.error("Empty file content");
        setIsImporting(false);
        setErrors((prev) => [...prev, "Empty file content"]);
        return;
      }

      try {
        const parsed = JSON.parse((_event.target.result ?? "{}") as string);

        if (!parsed?.config) {
          throw new Error("Invalid backup file format.");
        }

        const {
          apiKeys,
          targetLicense,
          npmAdvisorThemeMode,
          npmAdvisorDarkMode,
        } = parsed.config;

        await Promise.all([
          chrome.storage.sync.set({
            ...(apiKeys !== undefined && { apiKeys }),
            ...(targetLicense !== undefined && { targetLicense }),
          }),
          chrome.storage.local.set({
            ...(npmAdvisorThemeMode !== undefined && { npmAdvisorThemeMode }),
            ...(npmAdvisorDarkMode !== undefined && { npmAdvisorDarkMode }),
          }),
        ]);

        // Apply theme immediately
        if (npmAdvisorDarkMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }

        toast.success("Settings imported successfully. Reloading...");
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error("Invalid backup file.");
        setErrors((prev) => [...prev, "Invalid backup file"]);
      }

      setIsImporting(false);
    };

    reader.onerror = () => {
      toast.error("Error reading file.");
      setIsImporting(false);
    };
    reader.readAsText(file);
  }, []);

  return (
    <OptionsPageTabSection title="Backup & Restore">
      <div className="gap-5 flex flex-col sm:flex-row">
        <Button
          disabled={isExporting}
          variant="outline"
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors max-w-[200px]"
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Export Configuration
        </Button>
        <Button
          disabled={isImporting}
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors max-w-[200px]"
        >
          {isImporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : errors.length > 0 ? (
            <CircleAlert size={16} className="text-red-500" />
          ) : (
            <Upload size={16} />
          )}
          Import Configuration
        </Button>
        <input
          onChange={handleImport}
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
        />
      </div>
      <div className="mt-8 rounded-xl border border-baby-red bg-baby-red p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-danger flex items-center gap-2">
            <AlertTriangle size={16} /> Factory Reset
          </h4>
          <p className="text-xs text-amethyst-haze max-w-sm leading-relaxed">
            This will permanently delete all API keys and settings. This action
            cannot be undone.
          </p>
        </div>
        <Button variant="destructive" onClick={() => setIsResetModalOpen(true)}>
          Reset Data
        </Button>
      </div>
    </OptionsPageTabSection>
  );
}
