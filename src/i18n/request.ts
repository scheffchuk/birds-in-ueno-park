import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as localeRootParam } from "next/root-params";
import { loadMessages } from "./load-messages";
import { routing, type AppLocale } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await localeRootParam();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else if (paramValue == null || paramValue === "") {
      locale = routing.defaultLocale;
    } else {
      notFound();
    }
  }

  return {
    locale,
    messages: await loadMessages(locale as AppLocale),
  };
});
