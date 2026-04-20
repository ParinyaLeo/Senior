import type { SettingsState } from "./types";

export const STORAGE_KEY = "event_stock_manager_settings_v1";

export const DEFAULT_SETTINGS: SettingsState = {
  company: {
    companyNameTH: "EVENT STOCK MANAGER",
    companyNameEN: "Event Stock Manager Co., Ltd.",
    tagline: "Event Equipment Rental & Management Services",
    address: "255/2 Sikan, Tha Muang, Mueang, Chiang Rai 57000",
    taxId: "0575559000545",
    phone: "095-145-8088",
    email: "info@eventstock.com",
    website: "www.eventstock.com",
  },
  banking: {
    bankName: "Kasikornbank",
    accountName: "Event Stock Manager Co., Ltd.",
    accountNumber: "xxx-x-xxxxx-x",
    branch: "Chiang Rai",
    swiftCode: "KASITHBK",
  },
};