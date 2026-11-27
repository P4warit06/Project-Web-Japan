// Sample trips shown the first time the demo opens (and after "reset demo data").
import { PALETTES, scene } from "./art";
import type { DemoState, MediaRec, MemoryRec, PlaceRec, TripRec } from "./data";

const at = (iso: string) => `${iso}:00.000Z`;

export function createSeed(): DemoState {
  const photo = (
    id: string,
    tripId: string,
    memoryId: string | null,
    when: string,
    kind: Parameters<typeof scene>[0],
    palette: keyof typeof PALETTES,
    n: number,
    portrait = false,
  ): MediaRec => {
    const [w, h] = portrait ? [900, 1200] : [1200, 900];
    const url = scene(kind, PALETTES[palette], w, h, n);
    return { id, tripId, memoryId, width: w, height: h, createdAt: at(when), thumbUrl: url, fullUrl: url };
  };

  const trips: TripRec[] = [
    {
      id: "kyoto",
      title: "เกียวโต ฤดูใบไม้ผลิ",
      description: "ทริปแรกของเรา เดินช้าๆ ดูซากุระ กินมัทฉะ และหลงทางในซอยเล็กๆ",
      startDate: "2026-03-28",
      endDate: "2026-04-03",
      coverMediaId: "m-kyoto-1",
      createdAt: at("2026-03-01T09:00"),
    },
    {
      id: "osaka",
      title: "โอซาก้า กินให้หนำ",
      description: "สามวันที่เดินไปกินไป ทาโกยากิ โอโคโนมิยากิ และไอศกรีมริมคลอง",
      startDate: "2025-11-14",
      endDate: "2025-11-16",
      coverMediaId: null,
      createdAt: at("2025-10-20T09:00"),
    },
    {
      id: "hokkaido",
      title: "ฮอกไกโด หิมะแรก",
      description: null,
      startDate: "2025-01-10",
      endDate: null,
      coverMediaId: null,
      createdAt: at("2024-12-20T09:00"),
    },
  ];

  const places: PlaceRec[] = [
    { id: "p-fushimi", tripId: "kyoto", name: "ศาลเจ้าฟูชิมิ อินาริ", address: "68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto", note: "ไปตอนเช้ามืด คนยังน้อย เดินขึ้นไปครึ่งทางก็พอ", latitude: 34.9671, longitude: 135.7727, createdAt: at("2026-03-01T10:00") },
    { id: "p-arashi", tripId: "kyoto", name: "อาราชิยาม่า", address: "Sagaogurayama Tabuchiyamacho, Ukyo Ward, Kyoto", note: "ป่าไผ่สวยกว่าในรูปเยอะ", latitude: 35.0094, longitude: 135.6668, createdAt: at("2026-03-01T10:05") },
    { id: "p-nishiki", tripId: "kyoto", name: "ตลาดนิชิกิ", address: null, note: null, latitude: null, longitude: null, createdAt: at("2026-03-01T10:10") },
    { id: "p-dotonbori", tripId: "osaka", name: "โดทงโบริ", address: "Dotonbori, Chuo Ward, Osaka", note: "ป้ายกูลิโกะตอนกลางคืนสวยมาก", latitude: 34.6687, longitude: 135.5013, createdAt: at("2025-10-20T10:00") },
    { id: "p-kuromon", tripId: "osaka", name: "ตลาดคุโรมง", address: null, note: "ไปตั้งแต่เช้า หอยเชลล์ย่างอร่อยที่สุด", latitude: null, longitude: null, createdAt: at("2025-10-20T10:05") },
    { id: "p-otaru", tripId: "hokkaido", name: "คลองโอตารุ", address: "Otaru, Hokkaido", note: null, latitude: 43.1976, longitude: 141.0036, createdAt: at("2024-12-20T10:00") },
  ];

  const memories: MemoryRec[] = [
    {
      id: "mem-kyoto-1", tripId: "kyoto", title: "เดินขึ้นภูเขาเสาโทริอิ",
      content: "ตื่นตั้งแต่ตีห้าเพื่อมาให้ทันแสงเช้า เสาสีแดงเรียงกันยาวสุดสายตา เราเดินขึ้นไปจนถึงจุดชมวิวแล้วนั่งพักกินขนมที่ซื้อมาจากร้านสะดวกซื้อ ไม่คิดเลยว่าจะมีความสุขกับอะไรง่ายๆ ขนาดนี้",
      happenedAt: at("2026-03-29T06:30"), mood: "happy", tags: ["kyoto", "shrine"], createdAt: at("2026-03-29T20:00"),
    },
    {
      id: "mem-kyoto-2", tripId: "kyoto", title: "ซากุระริมแม่น้ำคาโมะ",
      content: "นั่งใต้ต้นซากุระริมแม่น้ำ ดื่มชาเขียวร้อนๆ ลมพัดกลีบดอกไม้ลงมาเต็มไปหมด เราไม่ได้พูดอะไรกันเลยเกือบครึ่งชั่วโมง แต่เป็นช่วงเวลาที่อยากจำไว้ที่สุดของทริปนี้",
      happenedAt: at("2026-03-31T16:10"), mood: "calm", tags: ["sakura", "kyoto"], createdAt: at("2026-03-31T21:00"),
    },
    {
      id: "mem-kyoto-3", tripId: "kyoto", title: "หลงทางตอนกลางคืน",
      content: "เดินกลับโรงแรมผิดทางไปไกลมาก ขาแทบหมดแรง แต่ได้เจอร้านราเมงเล็กๆ ที่มีลุงเจ้าของร้านใจดี เลยกลายเป็นมื้อดึกที่อร่อยที่สุด",
      happenedAt: at("2026-04-01T21:45"), mood: "tired", tags: ["food"], createdAt: at("2026-04-01T23:00"),
    },
    {
      id: "mem-osaka-1", tripId: "osaka", title: "ทาโกยากิร้อนๆ ริมคลอง",
      content: "ต่อคิวสิบห้านาทีแต่คุ้มมาก ทาโกยากิร้อนจนลวกลิ้น ยังหัวเราะกันไม่หยุด",
      happenedAt: at("2025-11-14T19:20"), mood: "excited", tags: ["food", "osaka"], createdAt: at("2025-11-14T22:00"),
    },
    {
      id: "mem-osaka-2", tripId: "osaka", title: "วันสุดท้าย",
      content: "ไม่อยากกลับบ้านเลย นั่งมองแม่น้ำอยู่นานก่อนไปสนามบิน",
      happenedAt: at("2025-11-16T15:00"), mood: "sad", tags: [], createdAt: at("2025-11-16T18:00"),
    },
    {
      id: "mem-hokkaido-1", tripId: "hokkaido", title: "หิมะแรกในชีวิต",
      content: "ยืนอ้าปากรับหิมะอยู่กลางถนนเหมือนเด็กๆ คนข้างๆ ถ่ายรูปเก็บไว้ตั้งสิบรูป",
      happenedAt: at("2025-01-10T18:00"), mood: "happy", tags: ["snow"], createdAt: at("2025-01-10T21:00"),
    },
  ];

  const media: MediaRec[] = [
    photo("m-kyoto-1", "kyoto", "mem-kyoto-1", "2026-03-29T06:40", "torii", "dusk", 11),
    photo("m-kyoto-2", "kyoto", "mem-kyoto-1", "2026-03-29T07:05", "mountain", "spring", 12),
    photo("m-kyoto-3", "kyoto", "mem-kyoto-2", "2026-03-31T16:20", "blossom", "spring", 13, true),
    photo("m-kyoto-4", "kyoto", "mem-kyoto-2", "2026-03-31T17:00", "blossom", "night", 14),
    photo("m-kyoto-5", "kyoto", null, "2026-04-01T20:30", "lanterns", "night", 15),
    photo("m-kyoto-6", "kyoto", "mem-kyoto-3", "2026-04-01T22:00", "lanterns", "dusk", 16),
    photo("m-osaka-1", "osaka", "mem-osaka-1", "2025-11-14T19:30", "lanterns", "dusk", 21),
    photo("m-osaka-2", "osaka", null, "2025-11-15T12:00", "torii", "spring", 22),
    photo("m-hokkaido-1", "hokkaido", "mem-hokkaido-1", "2025-01-10T18:10", "mountain", "winter", 31, true),
  ];

  return { version: 1, trips, places, memories, media };
}
