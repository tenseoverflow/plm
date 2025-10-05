// Minimal CalDAV + iCalendar helpers for VTODO sync

export type CalDavAuth = { username: string; password: string };

export type CalDavAccount = {
  baseUrl: string; // e.g., https://cal.example.com/dav/user/calendars/mytodo/
  auth: CalDavAuth;
};

export type RemoteTodo = {
  href: string; // full resource URL
  etag?: string | null;
  uid?: string | null;
  summary: string;
  completed: boolean;
  due?: string | null; // YYYY-MM-DD
};

async function proxyFetch(input: RequestInfo, init?: RequestInit & { auth?: CalDavAuth }) {
  const url = typeof input === "string" ? input : (input as Request).url;
  const method = (init?.method || "GET").toUpperCase();
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(init?.headers || {})) headers[k] = String(v);
  let body: string | undefined;
  if (typeof init?.body === "string") body = init.body as string;
  else if ((init as any)?.body && typeof (init as any).body === "object" && typeof (init as any).body.text === "function") {
    body = await (init as any).body.text();
  }
  const res = await fetch("/api/caldav", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ url, method, headers, body, auth: init?.auth }),
  });
  return res;
}

export async function listTodos(account: CalDavAccount): Promise<RemoteTodo[]> {
  // REPORT calendar-query for VTODO
  const report = `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VTODO"/>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

  const res = await proxyFetch(account.baseUrl, {
    method: "REPORT",
    headers: { "Content-Type": "application/xml; charset=utf-8" },
    body: report,
    auth: account.auth,
  });
  if (!res.ok) throw new Error(`CalDAV REPORT failed: ${res.status}`);
  const text = await res.text();
  return parseMultiStatusForTodos(text, account.baseUrl);
}

export async function createOrUpdateTodo(account: CalDavAccount, todo: RemoteTodo): Promise<{ href: string; etag?: string | null }> {
  const ical = buildVtodoIcs(todo);
  const targetUrl = todo.href || new URL(`${crypto.randomUUID()}.ics`, account.baseUrl).toString();
  const res = await proxyFetch(targetUrl, {
    method: todo.href ? "PUT" : "PUT",
    headers: {
      "If-Match": todo.etag ? todo.etag : "",
      "Content-Type": "text/calendar; charset=utf-8",
    },
    body: ical,
    auth: account.auth,
  });
  if (!(res.status >= 200 && res.status < 300)) throw new Error(`CalDAV save failed: ${res.status}`);
  // Prefer Location/Content-Location for resource URL; fallback to request URL
  const href = res.headers.get("location") || res.headers.get("content-location") || targetUrl;
  const etag = res.headers.get("etag");
  return { href, etag };
}

export async function deleteTodo(account: CalDavAccount, href: string, etag?: string | null): Promise<void> {
  const res = await proxyFetch(href, {
    method: "DELETE",
    headers: etag ? { "If-Match": etag } : {},
    auth: account.auth,
  });
  if (res.status !== 204 && res.status !== 200) throw new Error(`CalDAV delete failed: ${res.status}`);
}

function parseMultiStatusForTodos(xml: string, baseUrl: string): RemoteTodo[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const responses = Array.from(doc.getElementsByTagName("response"));
  const out: RemoteTodo[] = [];
  for (const r of responses) {
    const href = r.getElementsByTagName("href")[0]?.textContent || "";
    const etag = r.getElementsByTagName("getetag")[0]?.textContent || null;
    const calData = r.getElementsByTagName("calendar-data")[0]?.textContent || "";
    if (!calData) continue;
    const parsed = parseIcsForVtodo(calData);
    if (!parsed) continue;
    out.push({
      href: absolutizeHref(baseUrl, href),
      etag,
      uid: parsed.uid,
      summary: parsed.summary,
      completed: parsed.completed,
      due: parsed.due,
    });
  }
  return out;
}

function absolutizeHref(base: string, href: string): string {
  try { return new URL(href, base).toString(); } catch { return href; }
}

function parseIcsForVtodo(ics: string): { uid?: string; summary: string; completed: boolean; due?: string | null } | null {
  const lines = ics.split(/\r?\n/);
  let inTodo = false;
  let summary = "";
  let completed = false;
  let due: string | null = null;
  let uid: string | undefined;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VTODO") inTodo = true;
    else if (line === "END:VTODO") break;
    else if (inTodo) {
      if (line.startsWith("SUMMARY:")) summary = line.slice(8).trim();
      else if (line.startsWith("STATUS:")) completed = /COMPLETED/i.test(line.slice(7));
      else if (line.startsWith("COMPLETED")) completed = true;
      else if (line.startsWith("UID:")) uid = line.slice(4).trim();
      else if (line.startsWith("DUE:")) {
        const v = line.slice(4).trim();
        // Accept YYYYMMDD or date-time
        if (/^\d{8}$/.test(v)) due = `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`;
        else if (/^\d{8}T/.test(v)) due = `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`;
      }
    }
  }
  if (!summary) return null;
  return { uid, summary, completed, due };
}

function buildVtodoIcs(todo: RemoteTodo): string {
  const uid = todo.uid || crypto.randomUUID();
  const now = new Date();
  const dtstamp = toIcsDateTime(now);
  const completedLine = todo.completed ? `\nSTATUS:COMPLETED` : "";
  const dueLine = todo.due ? `\nDUE:${todo.due.replace(/-/g, "")}` : "";
  const ical = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Mindful PLM//EN\nBEGIN:VTODO\nUID:${uid}\nDTSTAMP:${dtstamp}\nSUMMARY:${escapeIcsText(todo.summary)}${dueLine}${completedLine}\nEND:VTODO\nEND:VCALENDAR\n`;
  return ical;
}

function toIcsDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcsText(t: string): string {
  return t.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}


