import { LoadingScreen } from "@/components/ui/spinner";
import { getTranslator } from "@/lib/i18n-server";

export default async function Loading() {
  const t = await getTranslator();
  return <LoadingScreen label={t("common.loading")} />;
}