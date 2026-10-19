import type { Dictionary } from "./en";

/**
 * Afar (Qafár af) starter strings.
 *
 * Afar is a Cushitic language with a comparatively small written UI corpus,
 * so rather than machine-guessing business terminology this file only carries
 * the entries we can stand behind. Every other key falls back to English
 * through the deep merge in `../index.ts`.
 *
 * TODO(native-speaker): fill in the remaining sections here, the merge makes
 * it safe to add keys progressively.
 */
export const aa: DeepPartial<Dictionary> = {
  common: {
    save: "Qofaa",
    cancel: "Haquu qoodu",
    delete: "Qoodu",
    search: "Barraadee",
    loading: "Fe'aa jira...",
    back: "Duubatti",
    next: "Kun itti aanu",
    previous: "Kun dursee",
    yes: "Awa",
    no: "Kinii",
    all: "Hudaa",
    add: "Dabalii",
    remove: "Qoodu",
    name: "Cinnay",
    email: "Iimayilii",
    phone: "Bilisa",
    image: "Suuraa",
    price: "Qabeenya",
    quantity: "Togga",
    total: "Waliigalle",
    actions: "Qabxii",
    details: "Faayo",
    results: "Faayo",
  },
  nav: {
    home: "Soo",
    marketplace: "Gabaa gabaa",
    login: "Galmaa",
    logout: "Baajji",
    admin: "Bulchaa",
    menu: "Menyuu",
    language: "Afaan",
    theme: "Bifa",
    light: "Ifa",
    dark: "Dharraa",
    night: "Halkan",
    system: "Sistem",
  },
  errors: {
    generic: "Waan tokko irratti dogoggora.",
    notFound: "Waan barbaadan hin argine.",
    backHome: "Soo duubatti",
  },
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};