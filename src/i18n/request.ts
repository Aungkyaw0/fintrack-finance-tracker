import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export type Locale = "my" | "en";
export const defaultLocale: Locale = "my";
export const locales: Locale[] = ["my", "en"];

export default getRequestConfig(async () => {
  // Read locale from cookie (set by user preference or profile)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value as Locale | undefined;
  const locale: Locale =
    localeCookie && locales.includes(localeCookie)
      ? localeCookie
      : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

