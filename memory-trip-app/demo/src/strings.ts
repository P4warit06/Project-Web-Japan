// Text that exists only in the demo (the real app's text lives in lib/i18n/messages).
import type { Locale } from "@/lib/i18n/config";

type DemoText = {
  banner: string;
  resetTitle: string;
  resetBody: string;
  resetTrigger: string;
  resetConfirm: string;
  demoAccount: string;
  demoAccountBody: string;
  storageNote: string;
};

export const demoText: Record<Locale, DemoText> = {
  th: {
    banner: "โหมดสาธิต: ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์ของคุณเท่านั้น ไม่มีการส่งไปที่ไหน",
    resetTitle: "เริ่มใหม่จากข้อมูลตัวอย่าง?",
    resetBody: "ทริป ความทรงจำ และรูปที่คุณเพิ่มไว้ในโหมดสาธิตจะถูกลบ แล้วกลับไปเป็นข้อมูลตัวอย่าง",
    resetTrigger: "ล้างข้อมูลสาธิต",
    resetConfirm: "ล้างและเริ่มใหม่",
    demoAccount: "โหมดสาธิต",
    demoAccountBody:
      "หน้านี้เป็นตัวอย่างหน้าตาและการใช้งาน ไม่มีการล็อกอินหรือเซิร์ฟเวอร์ รูปที่เพิ่มจะถูกย่อและเก็บในเบราว์เซอร์นี้ (เก็บได้ราว 20 รูป)",
    storageNote: "ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น เปิดจากเครื่องอื่นจะไม่เห็น",
  },
  en: {
    banner: "Demo mode: everything stays in your browser and is sent nowhere.",
    resetTitle: "Start again from the sample data?",
    resetBody: "The trips, memories and photos you added in the demo will be deleted and the sample data comes back.",
    resetTrigger: "Reset demo data",
    resetConfirm: "Reset and start again",
    demoAccount: "Demo mode",
    demoAccountBody:
      "This page shows how the app looks and works. There is no login and no server. Photos you add are shrunk and kept in this browser (about 20 fit).",
    storageNote: "Data lives in this browser only. Other devices will not see it.",
  },
};
