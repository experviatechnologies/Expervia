/**
 * Deterministic demo dataset for the Phase 1 tracker frontend.
 *
 * Every person, client and figure here is fictional. Dates are anchored to the
 * moment the demo is seeded (and to working days), so the pipeline always
 * looks current: meetings sit a few working days ahead, outcomes a few weeks
 * behind. Phase 3 replaces this with the real ETEN member list.
 */
import {
  addDaysToDate,
  DEFAULT_TZ,
  weekdayOf,
  zonedDate,
  zonedToUtc,
  HOUR,
} from "./time";
import type {
  ActivityEntry,
  Assignment,
  AuditEntry,
  BackgroundJob,
  CalendarStatus,
  Member,
  MeetingFormat,
  Notification,
  Nomination,
  Pod,
  PresalesRequest,
  Seniority,
  Skill,
  SkillLevel,
  TrackerData,
  WeeklyWindow,
  Weekday,
} from "./types";

export const DATA_VERSION = 3;

// ---------------------------------------------------------------- reference

const POD_DEFS: [string, string, string, string][] = [
  [
    "cld",
    "CLD",
    "Cloud & Microsoft Azure",
    "Azure, Microsoft 365, migration and cloud cost.",
  ],
  [
    "aia",
    "AIA",
    "AI & Enterprise Automation",
    "Azure OpenAI, Copilot, ML and process automation.",
  ],
  [
    "sec",
    "SEC",
    "Cybersecurity",
    "Security operations, identity, Zero Trust and compliance.",
  ],
  [
    "inf",
    "INF",
    "Infrastructure & Networking",
    "Networks, servers, virtualisation and end-user computing.",
  ],
  [
    "dat",
    "DAT",
    "Data & Analytics",
    "Power BI, Fabric, data engineering and databases.",
  ],
  [
    "swe",
    "SWE",
    "Software Engineering",
    "Application development and solution architecture.",
  ],
  [
    "erp",
    "ERP",
    "Enterprise Applications",
    "Dynamics 365, SAP, Business Central and Power Apps.",
  ],
  [
    "dvo",
    "DVO",
    "DevOps & Platform Engineering",
    "Kubernetes, CI/CD, IaC and SRE.",
  ],
];

const SKILL_DEFS: [string, string, string][] = [
  ["Microsoft Azure", "Cloud", "cld"],
  ["Microsoft 365", "Cloud", "cld"],
  ["Azure Migration", "Cloud", "cld"],
  ["AWS", "Cloud", "cld"],
  ["Cloud Cost Optimisation", "Cloud", "cld"],
  ["Azure OpenAI", "AI & Automation", "aia"],
  ["Copilot Studio", "AI & Automation", "aia"],
  ["Machine Learning", "AI & Automation", "aia"],
  ["Power Automate", "AI & Automation", "aia"],
  ["Robotic Process Automation", "AI & Automation", "aia"],
  ["Microsoft Sentinel", "Security", "sec"],
  ["Identity & Access Management", "Security", "sec"],
  ["Penetration Testing", "Security", "sec"],
  ["ISO 27001", "Security", "sec"],
  ["Zero Trust Architecture", "Security", "sec"],
  ["Network Design", "Infrastructure", "inf"],
  ["Windows Server", "Infrastructure", "inf"],
  ["VMware", "Infrastructure", "inf"],
  ["SD-WAN", "Infrastructure", "inf"],
  ["End-User Computing", "Infrastructure", "inf"],
  ["Power BI", "Data", "dat"],
  ["Microsoft Fabric", "Data", "dat"],
  ["Data Engineering", "Data", "dat"],
  ["SQL Server", "Data", "dat"],
  ["Databricks", "Data", "dat"],
  [".NET", "Software", "swe"],
  ["React", "Software", "swe"],
  ["Node.js", "Software", "swe"],
  ["Mobile Development", "Software", "swe"],
  ["Solution Architecture", "Software", "swe"],
  ["Dynamics 365 Finance", "Business Applications", "erp"],
  ["Dynamics 365 CRM", "Business Applications", "erp"],
  ["SAP", "Business Applications", "erp"],
  ["Business Central", "Business Applications", "erp"],
  ["Power Apps", "Business Applications", "erp"],
  ["Kubernetes", "DevOps", "dvo"],
  ["Azure DevOps", "DevOps", "dvo"],
  ["Terraform", "DevOps", "dvo"],
  ["GitHub Actions", "DevOps", "dvo"],
  ["Site Reliability Engineering", "DevOps", "dvo"],
];

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const MEETING_TYPES = [
  "Client discovery meeting",
  "Presales consultation",
  "Technical demonstration",
  "Solution architecture discussion",
  "Technical proposal review",
  "Cybersecurity consultation",
];

const FIRST = [
  "Abimbola",
  "Adebayo",
  "Adaobi",
  "Ayodele",
  "Bolaji",
  "Chidinma",
  "Chukwuemeka",
  "Damilola",
  "Ebuka",
  "Efosa",
  "Emeka",
  "Funmilayo",
  "Gbenga",
  "Halima",
  "Ibrahim",
  "Ifeoluwa",
  "Ikenna",
  "Jumoke",
  "Kayode",
  "Kelechi",
  "Ladi",
  "Mariam",
  "Musa",
  "Nkechi",
  "Nnamdi",
  "Obinna",
  "Oluwaseun",
  "Onyinye",
  "Rotimi",
  "Sade",
  "Samuel",
  "Temitope",
  "Tobi",
  "Uche",
  "Usman",
  "Wale",
  "Yemi",
  "Zainab",
  "Amara",
  "Bisi",
  "Dayo",
  "Folake",
  "Kunle",
  "Lola",
  "Tayo",
];
const LAST = [
  "Aminu",
  "Etim",
  "Ogbonna",
  "Ogunleye",
  "Olawale",
  "Salami",
  "Ugwu",
  "Adeyemi",
  "Balogun",
  "Chukwu",
  "Danjuma",
  "Eze",
  "Fashola",
  "Garba",
  "Ibe",
  "Johnson",
  "Kalu",
  "Lawal",
  "Mohammed",
  "Nwachukwu",
  "Obi",
  "Okeke",
  "Onuoha",
  "Peters",
  "Quadri",
  "Sanni",
  "Taiwo",
  "Umeh",
  "Yusuf",
  "Akande",
  "Bello",
  "Ilori",
  "Uzoma",
  "Ighalo",
  "Nwosu",
  "Abubakar",
  "Okon",
  "Afolabi",
];
const CITIES = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Enugu",
  "Kano",
  "Benin City",
];
const INDUSTRIES = [
  "Banking",
  "Telecoms",
  "Oil & Gas",
  "Public Sector",
  "Retail",
  "Insurance",
  "Fintech",
  "Logistics",
  "Healthcare",
];
const CERTS: Record<string, string[]> = {
  cld: ["AZ-104", "AZ-305", "MS-102", "AWS SAA"],
  aia: ["AI-102", "PL-500", "DP-100"],
  sec: ["SC-200", "CISSP", "CEH", "ISO 27001 LA"],
  inf: ["CCNP", "VCP-DCV", "MD-102"],
  dat: ["PL-300", "DP-600", "DP-203"],
  swe: ["AZ-204", "AWS DVA"],
  erp: ["MB-310", "MB-210", "SAP S/4HANA"],
  dvo: ["CKA", "AZ-400", "Terraform Associate"],
};

/** Pod sizes add to 386 active engineers (CLD is the largest pod). */
const POD_SIZES: Record<string, number> = {
  cld: 56,
  aia: 47,
  sec: 52,
  inf: 48,
  dat: 45,
  swe: 51,
  erp: 43,
  dvo: 44,
};

// ---------------------------------------------------------------- helpers

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let idSeq = 0;
const uid = (p: string) => `${p}-${(++idSeq).toString(36)}`;

function win(
  day: Weekday,
  start: string,
  end: string,
  formats: MeetingFormat[] = ["online", "physical", "hybrid"],
): WeeklyWindow {
  return { id: uid("w"), day, start, end, formats, active: true };
}

const weekdays = (start: string, end: string, formats?: MeetingFormat[]) =>
  ([1, 2, 3, 4, 5] as Weekday[]).map((d) => win(d, start, end, formats));

// ---------------------------------------------------------------- seed

export function createSeed(nowMs = Date.now()): TrackerData {
  idSeq = 0;
  const now = Math.floor(nowMs / HOUR) * HOUR;
  const iso = (ms: number) => new Date(ms).toISOString();
  const ago = (hours: number) => iso(now - hours * HOUR);
  const today = zonedDate(now, DEFAULT_TZ);

  /** n-th working day from today (n<0 goes back). */
  const wd = (n: number) => {
    let d = today;
    let left = Math.abs(n);
    const step = n >= 0 ? 1 : -1;
    while (left > 0) {
      d = addDaysToDate(d, step);
      if (weekdayOf(d) <= 5) left--;
    }
    return d;
  };
  const at = (date: string, time: string) =>
    zonedToUtc(date, time, DEFAULT_TZ).toISOString();

  const r = rng(20261031);
  const pick = <T>(arr: T[]) => arr[Math.floor(r() * arr.length)];

  // --- pods & skills
  const skills: Skill[] = SKILL_DEFS.map(([name, category, podId]) => ({
    id: slug(name),
    name,
    category,
    podId,
    active: true,
  }));
  const skillsByPod = (podId: string) =>
    skills.filter((s) => s.podId === podId);

  // --- named people (personas + pod leaders + scenario engineers)
  const members: Member[] = [];
  let codeSeq = 0;
  const usedNames = new Set<string>();

  function makeMember(
    name: string,
    podId: string,
    o: Partial<Member> & { skillNames?: string[] } = {},
  ): Member {
    codeSeq++;
    usedNames.add(name);
    const years = o.years ?? 2 + Math.floor(r() * 16);
    const seniority: Seniority =
      o.seniority ??
      (years >= 12
        ? "principal"
        : years >= 7
          ? "senior"
          : years >= 4
            ? "mid"
            : "associate");
    const podSkills = skillsByPod(podId);
    const chosen = o.skillNames
      ? o.skillNames.map(slug)
      : Array.from(
          new Set([
            ...Array.from(
              { length: 2 + Math.floor(r() * 3) },
              () => pick(podSkills).id,
            ),
            ...(r() < 0.35 ? [pick(skills).id] : []),
          ]),
        );
    const levels: SkillLevel[] = [
      "foundational",
      "working",
      "advanced",
      "expert",
    ];
    const lvlBase = Math.min(3, Math.floor(years / 4));
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${codeSeq > 6 ? codeSeq : ""}@demo.eten.example`;
    const first = name.split(" ")[0];
    return {
      id: o.id ?? `m-${codeSeq}`,
      code: `ETEN-${String(codeSeq).padStart(4, "0")}`,
      name,
      email: o.email ?? email,
      phone: o.phone ?? `+234 80${Math.floor(10000000 + r() * 89999999)}`,
      roles: o.roles ?? ["member"],
      status: o.status ?? "active",
      podId,
      extraPodIds:
        o.extraPodIds ??
        (r() < 0.2 ? [pick(POD_DEFS.filter((p) => p[0] !== podId))[0]] : []),
      seniority,
      years,
      bio:
        o.bio ??
        `${first} is a ${seniority === "principal" ? "principal" : seniority} engineer with ${years} years' experience delivering ${POD_DEFS.find((p) => p[0] === podId)![2]} projects for enterprise clients.`,
      skills: chosen.map((skillId) => ({
        skillId,
        level:
          levels[
            Math.min(
              3,
              Math.max(0, lvlBase + Math.floor(r() * 2) - (r() < 0.3 ? 1 : 0)),
            )
          ],
      })),
      specialisations: o.specialisations ?? [],
      certifications:
        o.certifications ?? (r() < 0.7 ? [pick(CERTS[podId])] : []),
      industries:
        o.industries ??
        [pick(INDUSTRIES), pick(INDUSTRIES)].filter(
          (v, i, a) => a.indexOf(v) === i,
        ),
      formats:
        o.formats ??
        (r() < 0.75 ? ["online", "physical", "hybrid"] : ["online"]),
      cities: o.cities ?? [r() < 0.6 ? "Lagos" : pick(CITIES)],
      willingToTravel: o.willingToTravel ?? r() < 0.35,
      travelNotes: o.travelNotes ?? "",
      timezone:
        o.timezone ??
        (r() < 0.92
          ? DEFAULT_TZ
          : pick(["Europe/London", "Africa/Accra", "Africa/Nairobi"])),
      calendar: o.calendar ?? "none",
      calendarProvider: o.calendarProvider,
      reviewedAt:
        o.reviewedAt !== undefined
          ? o.reviewedAt
          : ago(24 * (1 + Math.floor(r() * 40))),
      lastSignInAt: o.lastSignInAt !== undefined ? o.lastSignInAt : null,
      weekly: o.weekly ?? [],
      exceptions: o.exceptions ?? [],
      busy: o.busy ?? [],
      prefs: o.prefs ?? {
        weeklyReminder: true,
        meetingReminders: true,
        digest: false,
      },
    };
  }

  // Personas first so they get the low member codes.
  const adaeze = makeMember("Adaeze Okafor", "cld", {
    id: "p-adaeze",
    email: "adaeze.okafor@demo.eten.example",
    years: 7,
    seniority: "senior",
    skillNames: [
      "Microsoft Azure",
      "Microsoft 365",
      "Azure Migration",
      "Zero Trust Architecture",
    ],
    specialisations: ["Microsoft 365 Copilot readiness", "Landing zones"],
    certifications: ["AZ-305", "MS-102"],
    industries: ["Banking", "Telecoms"],
    formats: ["online", "physical", "hybrid"],
    cities: ["Lagos", "Abuja"],
    willingToTravel: false,
    timezone: DEFAULT_TZ,
    calendar: "connected",
    calendarProvider: "microsoft",
    reviewedAt: ago(72),
    lastSignInAt: ago(0),
    bio: "Senior cloud engineer focused on Microsoft 365 and Azure adoption for banks and telecoms. Leads Copilot readiness and landing zone workshops.",
    weekly: weekdays("09:00", "17:00"),
    exceptions: [
      {
        id: "x-1",
        date: wd(5),
        kind: "unavailable_part",
        start: "14:00",
        end: "17:00",
        reason: "client_work",
        note: "Client workshop",
      },
      {
        id: "x-2",
        date: wd(8),
        kind: "unavailable_all",
        reason: "leave",
        note: "Annual leave",
      },
    ],
  });
  const tunde = makeMember("Tunde Bakare", "cld", {
    id: "p-tunde",
    roles: ["member", "pod_leader"],
    years: 13,
    seniority: "principal",
    skillNames: [
      "Microsoft Azure",
      "Azure Migration",
      "Cloud Cost Optimisation",
      "AWS",
    ],
    calendar: "connected",
    calendarProvider: "google",
    reviewedAt: ago(30),
    lastSignInAt: ago(1),
    weekly: weekdays("08:30", "16:30"),
    cities: ["Lagos"],
  });
  const staff = (
    name: string,
    id: string,
    role: Member["roles"][number],
    email: string,
  ) =>
    makeMember(name, "cld", {
      id,
      email,
      roles: [role],
      skillNames: [],
      formats: ["online", "physical", "hybrid"],
      calendar: "connected",
      calendarProvider: "microsoft",
      lastSignInAt: ago(2),
      reviewedAt: null,
    });
  const ngozi = staff(
    "Ngozi Eze",
    "p-ngozi",
    "sales_manager",
    "ngozi.eze@demo.eten.example",
  );
  const femi = staff(
    "Femi Adeyemi",
    "p-femi",
    "management",
    "femi.adeyemi@demo.eten.example",
  );
  const kemiOjo = staff(
    "Kemi Ojo",
    "p-kemi",
    "admin",
    "kemi.ojo@demo.eten.example",
  );
  const ifeoma = staff(
    "Ifeoma Nwosu",
    "p-ifeoma",
    "sales_manager",
    "ifeoma.nwosu@demo.eten.example",
  );
  members.push(adaeze, tunde, ngozi, femi, kemiOjo, ifeoma);

  // Pod leaders (Tunde leads CLD).
  const leaderDefs: [string, string, string[]][] = [
    [
      "Kemi Salami",
      "aia",
      ["Azure OpenAI", "Copilot Studio", "Power Automate"],
    ],
    [
      "Eniola Etim",
      "sec",
      ["Microsoft Sentinel", "Zero Trust Architecture", "ISO 27001"],
    ],
    ["Segun Ighalo", "inf", ["Network Design", "SD-WAN", "VMware"]],
    [
      "Victor Ugwu",
      "dat",
      ["Power BI", "Microsoft Fabric", "Data Engineering"],
    ],
    ["Chinedu Ilori", "swe", ["Solution Architecture", ".NET", "React"]],
    [
      "Yetunde Uzoma",
      "erp",
      ["Dynamics 365 Finance", "Business Central", "Power Apps"],
    ],
    ["Ifeanyi Bello", "dvo", ["Kubernetes", "Terraform", "Azure DevOps"]],
  ];
  const leaders: Record<string, Member> = { cld: tunde };
  for (const [name, podId, sk] of leaderDefs) {
    const m = makeMember(name, podId, {
      id: `lead-${podId}`,
      roles: ["member", "pod_leader"],
      years: 10 + Math.floor(r() * 6),
      skillNames: sk,
      calendar: "connected",
      calendarProvider: "microsoft",
      reviewedAt: ago(48 + Math.floor(r() * 100)),
      lastSignInAt: ago(10),
      weekly: weekdays("09:00", "17:00"),
    });
    leaders[podId] = m;
    members.push(m);
  }

  // Scenario engineers referenced by the requests below.
  const eng = (
    name: string,
    podId: string,
    sk: string[],
    o: Partial<Member> = {},
  ) => {
    const m = makeMember(name, podId, {
      skillNames: sk,
      calendar: "connected",
      calendarProvider: "microsoft",
      reviewedAt: ago(24 * 4),
      lastSignInAt: ago(30),
      weekly: weekdays("09:00", "17:00"),
      ...o,
    });
    members.push(m);
    return m;
  };
  const eniola = eng(
    "Eniola Abubakar",
    "cld",
    ["Microsoft 365", "Copilot Studio", "Microsoft Azure"],
    { years: 8 },
  );
  const babatunde = eng(
    "Babatunde Ogbonna",
    "inf",
    ["Network Design", "SD-WAN", "Windows Server"],
    { years: 11, cities: ["Abuja", "Lagos"], willingToTravel: true },
  );
  const chiamaka = eng(
    "Chiamaka Obi",
    "cld",
    ["Microsoft 365", "Power Apps", "Microsoft Azure"],
    { years: 9 },
  );
  const olumide = eng(
    "Olumide Fashola",
    "sec",
    [
      "Zero Trust Architecture",
      "Identity & Access Management",
      "Microsoft Sentinel",
    ],
    { years: 12 },
  );
  const aisha = eng(
    "Aisha Garba",
    "sec",
    ["Microsoft Sentinel", "Penetration Testing"],
    { years: 6 },
  );
  const daniel = eng(
    "Daniel Okon",
    "swe",
    ["Solution Architecture", "Mobile Development", "React"],
    { years: 14, seniority: "principal" },
  );
  const precious = eng(
    "Precious Nwachukwu",
    "aia",
    ["Azure OpenAI", "Machine Learning", "Robotic Process Automation"],
    { years: 7 },
  );
  const kola = eng(
    "Kola Akande",
    "aia",
    ["Power Automate", "Robotic Process Automation", "Copilot Studio"],
    { years: 5 },
  );
  const hauwa = eng(
    "Hauwa Danjuma",
    "aia",
    ["Azure OpenAI", "Copilot Studio"],
    { years: 9, calendar: "expired" },
  );
  const emeka = eng(
    "Emeka Kalu",
    "inf",
    ["VMware", "Windows Server", "Network Design"],
    { years: 10 },
  );
  const sola = eng("Sola Peters", "inf", ["VMware", "End-User Computing"], {
    years: 6,
    calendar: "none",
    calendarProvider: undefined,
  });
  const ruth = eng(
    "Ruth Johnson",
    "inf",
    ["Windows Server", "VMware", "SD-WAN"],
    { years: 8 },
  );
  const tobi = eng(
    "Tobiloba Sanni",
    "dvo",
    ["Kubernetes", "Terraform", "Site Reliability Engineering"],
    { years: 9 },
  );
  const grace = eng(
    "Grace Umeh",
    "dvo",
    ["Azure DevOps", "GitHub Actions", "Kubernetes"],
    { years: 6 },
  );
  const yusuf = eng("Yusuf Lawal", "dat", ["Power BI", "Microsoft Fabric"], {
    years: 7,
  });
  const ada2 = eng(
    "Adanna Ibe",
    "erp",
    ["Dynamics 365 Finance", "Business Central"],
    { years: 10 },
  );
  const seyi = eng(
    "Seyi Afolabi",
    "sec",
    ["Penetration Testing", "ISO 27001"],
    { years: 8 },
  );

  // Simulated calendar busy block that collides with the Power Platform session.
  const ppDate = wd(3);
  chiamaka.busy = [
    { startUtc: at(ppDate, "10:00"), endUtc: at(ppDate, "11:00") },
  ];
  tunde.busy = [{ startUtc: at(wd(2), "15:30"), endUtc: at(wd(2), "16:30") }];

  // Fill every pod to its size with generated engineers.
  const PATTERNS: (() => WeeklyWindow[])[] = [
    () => weekdays("09:00", "17:00"),
    () => weekdays("10:00", "16:00", ["online"]),
    () => [
      win(1, "09:00", "13:00"),
      win(3, "09:00", "13:00"),
      win(5, "09:00", "13:00"),
    ],
    () => weekdays("17:00", "20:00", ["online"]),
    () => [win(2, "10:00", "15:00"), win(4, "10:00", "15:00")],
    () => [...weekdays("08:00", "12:00"), win(6, "10:00", "13:00", ["online"])],
  ];
  const CAL: CalendarStatus[] = [
    "connected",
    "connected",
    "connected",
    "none",
    "none",
    "connected",
    "expired",
    "connected",
    "revoked",
    "connected",
    "none",
    "error",
  ];
  for (const [podId] of POD_DEFS) {
    let count = members.filter(
      (m) =>
        m.podId === podId &&
        m.roles.includes("member") &&
        m.status === "active",
    ).length;
    while (count < POD_SIZES[podId]) {
      let name = `${pick(FIRST)} ${pick(LAST)}`;
      if (usedNames.has(name)) name = `${pick(FIRST)} ${pick(LAST)}`;
      const hasWindows = r() < 0.91;
      const fresh = r() < 0.47;
      const cal = pick(CAL);
      members.push(
        makeMember(name, podId, {
          weekly: hasWindows ? pick(PATTERNS)() : [],
          reviewedAt: hasWindows
            ? ago(
                24 *
                  (fresh
                    ? 1 + Math.floor(r() * 12)
                    : 16 + Math.floor(r() * 70)),
              )
            : null,
          calendar: cal,
          calendarProvider:
            cal === "none" ? undefined : r() < 0.7 ? "microsoft" : "google",
          lastSignInAt: r() < 0.6 ? ago(Math.floor(r() * 24 * 30)) : null,
        }),
      );
      count++;
    }
  }
  // Invited, suspended and deactivated accounts (not in the active count).
  for (let i = 0; i < 26; i++) {
    const podId = pick(POD_DEFS)[0];
    members.push(
      makeMember(`${pick(FIRST)} ${pick(LAST)}`, podId, {
        status: i < 13 ? "invited" : i < 21 ? "suspended" : "deactivated",
        weekly: [],
        reviewedAt: null,
        calendar: "none",
      }),
    );
  }

  const pods: Pod[] = POD_DEFS.map(([id, code, name, description], i) => ({
    id,
    code,
    name,
    description,
    leaderId: leaders[id].id,
    backupLeaderId: leaders[POD_DEFS[(i + 1) % POD_DEFS.length][0]].id,
    active: true,
  }));

  // ---------------------------------------------------------- requests
  const requests: PresalesRequest[] = [];
  const nominations: Nomination[] = [];
  const assignments: Assignment[] = [];
  let refN = 0;

  type ReqSpec = Omit<
    PresalesRequest,
    | "id"
    | "ref"
    | "activity"
    | "opportunityRef"
    | "platform"
    | "joinLink"
    | "techPrep"
    | "prepNotes"
    | "timezone"
    | "location"
    | "responseHours"
    | "createdAt"
  > &
    Partial<PresalesRequest> & { createdHoursAgo: number };

  function addRequest(spec: ReqSpec) {
    refN++;
    const ref = `PSR-2026-${String(refN).padStart(4, "0")}`;
    const createdAt = ago(spec.createdHoursAgo);
    const req: PresalesRequest = {
      id: `req-${refN}`,
      ref,
      opportunityRef: "",
      timezone: DEFAULT_TZ,
      platform: spec.format === "physical" ? "" : "Microsoft Teams",
      joinLink:
        spec.format === "physical"
          ? ""
          : "https://teams.microsoft.com/l/meetup-join/demo",
      location: "",
      techPrep: "Test screen sharing before the call.",
      prepNotes:
        "Review the client brief in the request and prepare two relevant case studies.",
      responseHours: 24,
      createdAt,
      activity: [
        { at: createdAt, actorId: spec.ownerId, text: "Created the request" },
      ],
      ...spec,
    };
    if (req.status !== "draft") {
      req.submittedAt = req.submittedAt ?? ago(spec.createdHoursAgo - 0.5);
      req.activity.push({
        at: req.submittedAt,
        actorId: spec.ownerId,
        text: `Submitted for nominations and routed to ${req.routing.map((x) => pods.find((p) => p.id === x.podId)!.name).join(", ")}`,
      });
    }
    requests.push(req);
    return req;
  }

  function nominate(
    req: PresalesRequest,
    podId: string,
    m: Member,
    hoursAgo: number,
    justification: string,
    status: Nomination["status"] = "submitted",
  ) {
    const leader = leaders[podId];
    const n: Nomination = {
      id: uid("n"),
      requestId: req.id,
      podId,
      memberId: m.id,
      byId: leader.id,
      justification,
      status,
      at: ago(hoursAgo),
    };
    nominations.push(n);
    req.activity.push({
      at: n.at,
      actorId: leader.id,
      text: `Nominated ${m.name}`,
    });
    const route = req.routing.find((x) => x.podId === podId);
    if (route && route.status === "awaiting") {
      route.status = "nominated";
      route.respondedAt = n.at;
    }
    return n;
  }

  function assign(
    req: PresalesRequest,
    m: Member,
    o: Partial<Assignment> & { invitedHoursAgo: number },
  ) {
    const invitedAt = ago(o.invitedHoursAgo);
    const a: Assignment = {
      id: uid("a"),
      requestId: req.id,
      memberId: m.id,
      status: "invitation_pending",
      invitedAt,
      dueAt: iso(new Date(invitedAt).getTime() + req.responseHours * HOUR),
      sync: "not_synced",
      ...o,
    };
    assignments.push(a);
    req.activity.push({
      at: invitedAt,
      actorId: req.ownerId,
      text: `Selected ${m.name} and sent an invitation`,
    });
    if (a.respondedAt) {
      req.activity.push({
        at: a.respondedAt,
        actorId: m.id,
        text:
          a.status === "declined"
            ? `${m.name} declined the invitation`
            : `${m.name} accepted the invitation`,
      });
    }
    return a;
  }

  const routeTo = (
    podIds: string[],
    deadline: string,
    status: "awaiting" = "awaiting",
  ) => podIds.map((podId) => ({ podId, status, deadline }));

  // --- completed (past) meetings with outcomes
  const past: [
    string,
    string,
    string,
    string,
    string[],
    Member[],
    "progressed" | "follow_up" | "on_hold",
    string,
    number,
  ][] = [
    [
      "Azure landing zone workshop",
      "Harbour Telecoms",
      "cld",
      "Technical demonstration",
      ["Microsoft Azure", "Azure Migration"],
      [adaeze, tunde],
      "progressed",
      "Workshop well received; client wants a migration assessment.",
      -32,
    ],
    [
      "SOC capability review",
      "Pinnacle Insurance",
      "sec",
      "Cybersecurity consultation",
      ["Microsoft Sentinel"],
      [olumide, aisha],
      "follow_up",
      "Client interested but needs board approval before a pilot.",
      -20,
    ],
    [
      "Analytics platform demo",
      "Coastline Retail",
      "dat",
      "Technical demonstration",
      ["Power BI", "Microsoft Fabric"],
      [yusuf],
      "on_hold",
      "Demo landed well; procurement paused until next budget cycle.",
      -11,
    ],
    [
      "ERP modernisation discovery",
      "Unity Foods",
      "erp",
      "Client discovery meeting",
      ["Dynamics 365 Finance"],
      [ada2],
      "progressed",
      "Client confirmed budget for a phased Dynamics 365 Finance rollout.",
      -4,
    ],
  ];
  for (const [
    title,
    client,
    podId,
    type,
    sk,
    team,
    tag,
    summary,
    offset,
  ] of past) {
    const d = wd(offset);
    const start = at(d, "10:00");
    const created = (now - new Date(start).getTime()) / HOUR + 96;
    const req = addRequest({
      title,
      client,
      objective: `${title} for ${client}.`,
      meetingTypeId: slug(type),
      access: "standard",
      skillIds: sk.map(slug),
      seniority: "senior",
      needed: team.length,
      startUtc: start,
      endUtc: at(d, "11:30"),
      format: "online",
      routing: routeTo([podId], iso(new Date(start).getTime() - 72 * HOUR)),
      urgency: "standard",
      ownerId: ngozi.id,
      status: "completed",
      createdHoursAgo: created,
    });
    for (const m of team) {
      nominate(
        req,
        m.podId,
        m,
        created - 3,
        "Strong fit for the required skills and available.",
        "selected",
      );
      assign(req, m, {
        invitedHoursAgo: created - 8,
        status: "attended",
        respondedAt: ago(created - 10),
        sync: "created",
      });
    }
    req.confirmedAt = ago(created - 12);
    req.activity.push({
      at: req.confirmedAt,
      actorId: ngozi.id,
      text: "Confirmed the meeting",
    });
    req.outcome = {
      summary,
      tag,
      actions: [
        {
          id: uid("act"),
          text: tag === "progressed" ? "Send proposal" : "Schedule follow-up",
          ownerName: "Ngozi Eze",
          due: addDaysToDate(d, 7),
        },
      ],
      nextSteps:
        tag === "progressed"
          ? "Prepare a scoped proposal."
          : "Check in with the client in two weeks.",
      recordedAt: iso(new Date(at(d, "13:00")).getTime()),
      recordedBy: ngozi.id,
    };
    req.activity.push({
      at: req.outcome.recordedAt,
      actorId: ngozi.id,
      text: "Recorded the meeting outcome",
    });
  }
  // One past meeting where an engineer did not attend (attendance rate < 100%).
  const socAssign = assignments.find((a) => a.memberId === aisha.id);
  if (socAssign) socAssign.status = "absent";

  // --- confirmed meeting that has happened but has no outcome yet
  const fabDate = wd(-1);
  const fabric = addRequest({
    title: "Microsoft Fabric data platform briefing",
    client: "Atlantic Shipping Lines",
    objective:
      "Brief the client's data team on consolidating reporting onto Microsoft Fabric.",
    meetingTypeId: slug("Technical demonstration"),
    access: "standard",
    skillIds: ["microsoft-fabric", "power-bi"],
    seniority: "senior",
    needed: 1,
    startUtc: at(fabDate, "11:00"),
    endUtc: at(fabDate, "12:00"),
    format: "online",
    routing: routeTo(["dat"], at(addDaysToDate(fabDate, -3), "12:00")),
    urgency: "standard",
    ownerId: ngozi.id,
    status: "confirmed",
    createdHoursAgo:
      (now - new Date(at(fabDate, "11:00")).getTime()) / HOUR + 90,
  });
  {
    const created =
      (now - new Date(at(fabDate, "11:00")).getTime()) / HOUR + 90;
    nominate(
      fabric,
      "dat",
      yusuf,
      created - 4,
      "Delivered two Fabric migrations this year.",
      "selected",
    );
    assign(fabric, yusuf, {
      invitedHoursAgo: created - 10,
      status: "confirmed",
      respondedAt: ago(created - 14),
      sync: "created",
    });
    fabric.confirmedAt = ago(created - 15);
  }

  // --- confirmed upcoming
  const r6date = wd(2);
  const r5date = wd(3);
  const m365 = addRequest({
    title: "Microsoft 365 Copilot readiness briefing",
    client: "Harbour Telecoms",
    objective:
      "Brief the client's IT leadership on Copilot readiness: licensing, data governance and a pilot plan.",
    meetingTypeId: slug("Presales consultation"),
    access: "standard",
    skillIds: ["microsoft-365", "copilot-studio"],
    seniority: "senior",
    needed: 2,
    startUtc: at(r5date, "10:00"),
    endUtc: at(r5date, "11:30"),
    format: "online",
    routing: routeTo(["cld"], ago(60)),
    urgency: "standard",
    ownerId: ngozi.id,
    status: "confirmed",
    createdHoursAgo: 80,
  });
  nominate(
    m365,
    "cld",
    adaeze,
    70,
    "Led two Copilot readiness workshops this quarter.",
    "selected",
  );
  nominate(
    m365,
    "cld",
    eniola,
    69,
    "Copilot Studio specialist, available all morning.",
    "selected",
  );
  assign(m365, adaeze, {
    invitedHoursAgo: 10,
    status: "confirmed",
    respondedAt: ago(6),
    sync: "created",
  });
  assign(m365, eniola, {
    invitedHoursAgo: 10,
    status: "confirmed",
    respondedAt: ago(5),
    sync: "created",
  });
  m365.confirmedAt = ago(4);
  m365.activity.push({
    at: m365.confirmedAt,
    actorId: ngozi.id,
    text: "Confirmed the meeting and created calendar events",
  });

  const branch = addRequest({
    title: "Branch network refresh site visit",
    client: "Capital Mortgage Bank",
    objective:
      "Walk the branch estate with the client's infrastructure team to scope an SD-WAN refresh.",
    meetingTypeId: slug("Client discovery meeting"),
    access: "standard",
    skillIds: ["sd-wan", "network-design"],
    seniority: "senior",
    needed: 1,
    startUtc: at(r6date, "13:00"),
    endUtc: at(r6date, "14:30"),
    format: "physical",
    location: "Capital Mortgage Bank HQ, Central Business District, Abuja",
    routing: routeTo(["inf"], ago(40)),
    urgency: "standard",
    ownerId: ngozi.id,
    status: "confirmed",
    createdHoursAgo: 70,
  });
  nominate(
    branch,
    "inf",
    babatunde,
    50,
    "Based in Abuja and designed SD-WAN for two banks.",
    "selected",
  );
  assign(branch, babatunde, {
    invitedHoursAgo: 30,
    status: "confirmed",
    respondedAt: ago(26),
    sync: "created",
  });
  branch.confirmedAt = ago(25);

  // --- active pipeline
  const r7date = wd(4);
  const zt = addRequest({
    title: "Zero Trust roadmap consultation",
    client: "Pinnacle Insurance",
    objective:
      "Help the CISO shape a 12-month Zero Trust roadmap covering identity, devices and Microsoft 365.",
    meetingTypeId: slug("Cybersecurity consultation"),
    access: "standard",
    skillIds: [
      "zero-trust-architecture",
      "identity-access-management",
      "microsoft-365",
    ],
    seniority: "senior",
    needed: 2,
    startUtc: at(r7date, "10:00"),
    endUtc: at(r7date, "11:00"),
    format: "online",
    routing: routeTo(["sec", "cld"], ago(4)),
    urgency: "standard",
    ownerId: ifeoma.id,
    status: "awaiting_acceptance",
    createdHoursAgo: 10,
  });
  nominate(
    zt,
    "sec",
    olumide,
    8,
    "Architected Zero Trust for two insurers.",
    "selected",
  );
  nominate(
    zt,
    "sec",
    seyi,
    7.5,
    "Strong on compliance framing for the board.",
    "not_selected",
  );
  nominate(
    zt,
    "cld",
    adaeze,
    7,
    "Microsoft 365 depth, holds AZ-305 and has Zero Trust experience.",
    "selected",
  );
  assign(zt, olumide, {
    invitedHoursAgo: 5,
    status: "accepted",
    respondedAt: ago(3),
  });
  assign(zt, adaeze, { invitedHoursAgo: 5, dueAt: iso(now + 19 * HOUR) });
  zt.rationale =
    "Olumide for the security architecture, Adaeze for the Microsoft 365 controls.";

  const ppdReq = addRequest({
    title: "Power Platform governance session",
    client: "Bonny Gas Logistics",
    objective:
      "Walk the client through Power Platform governance and environment strategy.",
    meetingTypeId: slug("Presales consultation"),
    access: "standard",
    skillIds: ["microsoft-365"],
    seniority: "senior",
    needed: 1,
    startUtc: at(ppDate, "10:30"),
    endUtc: at(ppDate, "11:30"),
    format: "online",
    routing: routeTo(["cld"], ago(1)),
    urgency: "standard",
    ownerId: ngozi.id,
    status: "conflict",
    createdHoursAgo: 2.5,
  });
  nominate(
    ppdReq,
    "cld",
    chiamaka,
    2,
    "Built the governance model for a similar logistics client.",
    "selected",
  );
  assign(ppdReq, chiamaka, {
    invitedHoursAgo: 1.5,
    status: "accepted",
    respondedAt: ago(1),
  });
  ppdReq.activity.push({
    at: ago(0.8),
    actorId: "system",
    text: "Calendar recheck found a busy period for Chiamaka Obi during the meeting",
  });

  const r13date = wd(5);
  const mob = addRequest({
    title: "Mobile banking app architecture review",
    client: "Sterling Cooperative Bank",
    objective:
      "The client asked for a named architect to review their mobile banking app architecture.",
    meetingTypeId: slug("Solution architecture discussion"),
    access: "standard",
    skillIds: ["solution-architecture", "mobile-development"],
    seniority: "senior",
    needed: 1,
    startUtc: at(r13date, "12:00"),
    endUtc: at(r13date, "13:00"),
    format: "online",
    routing: routeTo(["swe"], iso(now + 2 * HOUR)),
    urgency: "standard",
    ownerId: ifeoma.id,
    status: "awaiting_acceptance",
    createdHoursAgo: 4,
  });
  mob.override = {
    reason:
      "Client requested this architect by name after a previous engagement.",
    at: ago(3.5),
    byId: ifeoma.id,
  };
  mob.rationale = "Client asked for this architect by name.";
  nominate(
    mob,
    "swe",
    daniel,
    3.4,
    "Requested by name; endorsed by the pod.",
    "selected",
  );
  mob.routing[0].status = "awaiting";
  assign(mob, daniel, { invitedHoursAgo: 3.5, override: true });

  const r9date = wd(6);
  const idp = addRequest({
    title: "Intelligent document processing demo",
    client: "Lekki Logistics Group",
    objective:
      "Demonstrate automated invoice and waybill processing with Azure OpenAI and Power Automate.",
    meetingTypeId: slug("Technical demonstration"),
    access: "standard",
    skillIds: ["azure-openai", "power-automate", "robotic-process-automation"],
    seniority: "mid",
    needed: 2,
    startUtc: at(r9date, "10:00"),
    endUtc: at(r9date, "11:30"),
    format: "hybrid",
    location: "Lekki Logistics Group, Lekki Phase 1, Lagos",
    routing: routeTo(["aia"], ago(1)),
    urgency: "standard",
    ownerId: ngozi.id,
    status: "nominations_received",
    createdHoursAgo: 5,
  });
  nominate(
    idp,
    "aia",
    precious,
    3,
    "Built the IDP accelerator demo; strong Azure OpenAI.",
  );
  nominate(
    idp,
    "aia",
    kola,
    2.8,
    "Power Automate and RPA delivery lead for logistics clients.",
  );
  nominate(
    idp,
    "aia",
    hauwa,
    2.5,
    "Azure OpenAI specialist; calendar needs reconnecting.",
  );

  const r8date = wd(7);
  const dc = addRequest({
    title: "Data centre consolidation review",
    client: "Ogun State Revenue Service",
    objective:
      "Review the current data centre estate and outline a consolidation and virtualisation approach.",
    meetingTypeId: slug("Technical proposal review"),
    access: "standard",
    skillIds: ["vmware", "windows-server"],
    seniority: "senior",
    needed: 1,
    startUtc: at(r8date, "14:00"),
    endUtc: at(r8date, "15:00"),
    format: "online",
    routing: routeTo(["inf"], ago(6)),
    urgency: "standard",
    ownerId: ngozi.id,
    status: "selection",
    createdHoursAgo: 15,
  });
  nominate(
    dc,
    "inf",
    emeka,
    12,
    "Led a public-sector VMware consolidation last year.",
  );
  nominate(
    dc,
    "inf",
    sola,
    11.5,
    "End-user computing angle; no calendar connected.",
  );
  nominate(dc, "inf", ruth, 11, "Windows Server and VMware, strong presenter.");

  const r12date = wd(8);
  addRequest({
    title: "Incident response retainer discussion",
    client: "Tier-1 bank (confidential)",
    objective:
      "Scope an incident response retainer and tabletop exercise programme.",
    meetingTypeId: slug("Cybersecurity consultation"),
    access: "confidential",
    skillIds: ["microsoft-sentinel", "penetration-testing"],
    seniority: "senior",
    needed: 1,
    startUtc: at(r12date, "10:00"),
    endUtc: at(r12date, "11:00"),
    format: "online",
    routing: routeTo(["sec"], iso(now + 22 * HOUR)),
    urgency: "standard",
    ownerId: ngozi.id,
    status: "open",
    createdHoursAgo: 2,
  });

  const r11date = wd(9);
  const plat = addRequest({
    title: "Platform engineering assessment",
    client: "Paystream Fintech",
    objective:
      "Assess the client's Kubernetes platform and CI/CD maturity ahead of a scale-up.",
    meetingTypeId: slug("Technical proposal review"),
    access: "standard",
    skillIds: ["kubernetes", "terraform", "microsoft-azure"],
    seniority: "senior",
    needed: 2,
    startUtc: at(r11date, "11:00"),
    endUtc: at(r11date, "12:30"),
    format: "online",
    routing: routeTo(["dvo", "cld"], iso(now + 46 * HOUR)),
    urgency: "standard",
    ownerId: ngozi.id,
    status: "nominations_received",
    createdHoursAgo: 3,
  });
  nominate(plat, "dvo", tobi, 2, "Runs AKS platforms for two fintechs.");
  nominate(plat, "dvo", grace, 1.8, "CI/CD and GitHub Actions specialist.");

  const azure = addRequest({
    title: "Azure cost optimisation call",
    client: "Eko Retail Holdings",
    objective:
      "Urgent call: the client's Azure bill doubled this quarter and they want a quick review of options.",
    meetingTypeId: slug("Presales consultation"),
    access: "standard",
    skillIds: ["cloud-cost-optimisation", "microsoft-azure"],
    seniority: "senior",
    needed: 1,
    startUtc: at(r6date, "15:00"),
    endUtc: at(r6date, "16:00"),
    format: "online",
    routing: routeTo(["cld"], iso(now + 46 * HOUR)),
    urgency: "urgent",
    ownerId: ngozi.id,
    status: "open",
    createdHoursAgo: 0.6,
  });

  // --- draft and cancelled
  addRequest({
    title: "Copilot Studio pilot scoping",
    client: "Meridian Health",
    objective: "Scope a Copilot Studio pilot for patient-enquiry triage.",
    meetingTypeId: slug("Client discovery meeting"),
    access: "standard",
    skillIds: ["copilot-studio"],
    seniority: "mid",
    needed: 1,
    startUtc: at(wd(12), "11:00"),
    endUtc: at(wd(12), "12:00"),
    format: "online",
    routing: routeTo(["aia"], iso(now + 120 * HOUR)),
    urgency: "standard",
    ownerId: ngozi.id,
    status: "draft",
    createdHoursAgo: 20,
  });
  const cancelled = addRequest({
    title: "Kubernetes readiness review",
    client: "Northgate Payments",
    objective: "Review readiness to move workloads to Kubernetes.",
    meetingTypeId: slug("Technical proposal review"),
    access: "standard",
    skillIds: ["kubernetes"],
    seniority: "senior",
    needed: 1,
    startUtc: at(wd(1), "14:00"),
    endUtc: at(wd(1), "15:00"),
    format: "online",
    routing: routeTo(["dvo"], ago(20)),
    urgency: "standard",
    ownerId: ifeoma.id,
    status: "cancelled",
    createdHoursAgo: 40,
    cancelledReason: "Client postponed the initiative to next quarter.",
  });
  cancelled.activity.push({
    at: ago(18),
    actorId: ifeoma.id,
    text: "Cancelled the request: Client postponed the initiative to next quarter.",
  });

  // ---------------------------------------------------------- notifications
  const notifications: Notification[] = [];
  const notify = (
    to: string,
    n: Omit<Notification, "id" | "to" | "read"> & { read?: boolean },
  ) => notifications.push({ id: uid("nt"), to, read: false, ...n });

  notify(adaeze.id, {
    at: ago(5),
    title: "Invitation: Zero Trust roadmap consultation",
    body: `You have been selected for ${zt.ref}. Please accept or decline.`,
    action: "Accept or decline the invitation.",
    requestId: zt.id,
    critical: true,
    dueAt: iso(now + 19 * HOUR),
  });
  notify(adaeze.id, {
    at: ago(4),
    title: "Confirmed: Microsoft 365 Copilot readiness briefing",
    body: `${m365.ref} is confirmed. A calendar event has been added.`,
    requestId: m365.id,
    critical: false,
  });
  notify(adaeze.id, {
    at: ago(26),
    title: "Weekly availability review",
    body: "Check your weekly availability is still correct.",
    action: "Review your schedule.",
    href: "/tracker/availability",
    critical: false,
  });

  notify(tunde.id, {
    at: ago(0.6),
    title: "New nomination request: Azure cost optimisation call",
    body: `${azure.ref} needs 1 engineer from Cloud & Microsoft Azure. Urgent.`,
    action: "Nominate by the deadline.",
    requestId: azure.id,
    critical: true,
    dueAt: azure.routing[0].deadline,
  });
  notify(tunde.id, {
    at: ago(3),
    title: "New nomination request: Platform engineering assessment",
    body: `${plat.ref} needs Azure expertise alongside DevOps.`,
    action: "Nominate by the deadline.",
    requestId: plat.id,
    critical: false,
    dueAt: plat.routing[1].deadline,
  });
  notify(tunde.id, {
    at: ago(1),
    title: "Invitation accepted",
    body: "Chiamaka Obi accepted the Power Platform governance session.",
    requestId: ppdReq.id,
    critical: false,
    read: true,
  });

  for (const [hrs, title, body, req, critical] of [
    [
      0.8,
      "Calendar conflict: Power Platform governance session",
      "Chiamaka Obi's calendar shows a busy period during the meeting.",
      ppdReq,
      true,
    ],
    [
      2.5,
      "Nominations submitted: Intelligent document processing demo",
      "AI & Enterprise Automation nominated 3 engineers.",
      idp,
      false,
    ],
    [
      1.8,
      "Nominations submitted: Platform engineering assessment",
      "DevOps & Platform Engineering nominated 2 engineers.",
      plat,
      false,
    ],
    [
      11,
      "Nominations submitted: Data centre consolidation review",
      "Infrastructure & Networking nominated 3 engineers.",
      dc,
      false,
    ],
    [
      26,
      "Confirmed: Branch network refresh site visit",
      "Babatunde Ogbonna accepted. The meeting is confirmed.",
      branch,
      false,
    ],
    [
      4,
      "Team confirmed: Microsoft 365 Copilot readiness briefing",
      "Both participants accepted.",
      m365,
      false,
    ],
  ] as [number, string, string, PresalesRequest, boolean][]) {
    notify(ngozi.id, {
      at: ago(hrs),
      title,
      body,
      requestId: req.id,
      critical,
    });
  }
  notify(ngozi.id, {
    at: ago(30),
    title: "Outcome needed",
    body: "Record the outcome for ERP modernisation discovery.",
    requestId: requests[3].id,
    critical: false,
    read: true,
  });
  notify(ifeoma.id, {
    at: ago(3),
    title: "Invitation accepted: Zero Trust roadmap consultation",
    body: "Olumide Fashola accepted.",
    requestId: zt.id,
    critical: false,
  });
  notify(femi.id, {
    at: ago(20),
    title: "Weekly presales summary",
    body: "8 active requests, 2 confirmed meetings in the next two weeks.",
    href: "/tracker/reports",
    critical: false,
  });
  notify(kemiOjo.id, {
    at: ago(6),
    title: "Integration failure: calendar sync",
    body: "Creating a calendar event for Hauwa Danjuma failed (authorisation expired).",
    href: "/tracker/settings?tab=health",
    critical: true,
  });
  notify(kemiOjo.id, {
    at: ago(30),
    title: "Import completed",
    body: "12 members imported, 2 skipped as duplicates.",
    href: "/tracker/settings?tab=import",
    critical: false,
    read: true,
  });

  // ---------------------------------------------------------- audit & jobs
  const audit: AuditEntry[] = [
    {
      id: uid("au"),
      at: ago(3.5),
      actorId: ifeoma.id,
      action: "Authorised nomination override",
      target: mob.ref,
      reason: mob.override!.reason,
    },
    {
      id: uid("au"),
      at: ago(30),
      actorId: kemiOjo.id,
      action: "Imported members from CSV",
      target: "12 created, 2 skipped",
    },
    {
      id: uid("au"),
      at: ago(52),
      actorId: kemiOjo.id,
      action: "Changed roles",
      target: "Kemi Salami",
      reason: "Backup leader for Cloud & Microsoft Azure",
    },
    {
      id: uid("au"),
      at: ago(75),
      actorId: kemiOjo.id,
      action: "Suspended account",
      target: "ETEN-0391",
      reason: "Left the network",
    },
    {
      id: uid("au"),
      at: ago(5),
      actorId: ifeoma.id,
      action: "Selected participants",
      target: zt.ref,
    },
    {
      id: uid("au"),
      at: ago(4),
      actorId: ngozi.id,
      action: "Confirmed meeting",
      target: m365.ref,
    },
  ];
  const jobs: BackgroundJob[] = [
    {
      id: uid("j"),
      kind: "calendar_sync",
      label: `Create calendar event for Hauwa Danjuma (${idp.ref})`,
      status: "failed",
      at: ago(6),
      error: "Authorisation expired (HTTP 401). The member must reconnect.",
      attempts: 3,
    },
    {
      id: uid("j"),
      kind: "calendar_sync",
      label: `Create calendar events (${m365.ref})`,
      status: "succeeded",
      at: ago(4),
      attempts: 1,
    },
    {
      id: uid("j"),
      kind: "reminder",
      label: "Weekly availability reminder",
      status: "succeeded",
      at: ago(26),
      attempts: 1,
    },
    {
      id: uid("j"),
      kind: "email",
      label: "Invitation email (in-app only, no email provider)",
      status: "succeeded",
      at: ago(5),
      attempts: 1,
    },
  ];

  return {
    version: DATA_VERSION,
    seededAt: iso(now),
    pods,
    skills,
    meetingTypes: MEETING_TYPES.map((name) => ({
      id: slug(name),
      name,
      active: true,
    })),
    members,
    requests,
    nominations,
    assignments,
    notifications,
    audit,
    jobs,
    policies: {
      standardHours: 4,
      urgentHours: 2,
      responseHours: 24,
      freshDays: 14,
      reminderDay: 1,
      timezone: DEFAULT_TZ,
      allowDirectSelection: true,
      workingDays: [1, 2, 3, 4, 5],
      opens: "09:00",
      closes: "17:00",
      holidays: [
        { date: "2026-12-25", name: "Christmas Day" },
        { date: "2026-12-28", name: "Boxing Day (observed)" },
        { date: "2027-01-01", name: "New Year's Day" },
      ],
      outlookEnabled: true,
      googleEnabled: true,
    },
    refCounter: refN,
  };
}

export type { ActivityEntry };
