// Required member details: phone, LinkedIn and CV checks (7 Nov 2026).
// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { normalizePhone, normalizeLinkedIn, cvKind, missingDetails } = await jiti.import(
  "../../src/lib/eten/member-details.ts",
);

test("phone numbers become international form", () => {
  assert.equal(normalizePhone("+234 803 123 4567"), "+2348031234567");
  assert.equal(normalizePhone("08031234567"), "+2348031234567"); // Nigerian local
  assert.equal(normalizePhone("(+44) 7700-900123"), "+447700900123");
  assert.equal(normalizePhone("0044 7700 900123"), "+447700900123");
  assert.equal(normalizePhone("2348031234567"), "+2348031234567");
});

test("implausible phone numbers are refused", () => {
  for (const bad of ["", "12345", "phone", "+0 803 123 4567", "+1234567890123456"]) {
    assert.equal(normalizePhone(bad), null, bad);
  }
});

test("LinkedIn: optional, must be linkedin.com", () => {
  assert.equal(normalizeLinkedIn(""), "");
  assert.equal(normalizeLinkedIn("linkedin.com/in/ada"), "https://linkedin.com/in/ada");
  assert.equal(normalizeLinkedIn("http://www.linkedin.com/in/ada"), "https://www.linkedin.com/in/ada");
  assert.equal(normalizeLinkedIn("https://evil.com/linkedin.com"), null);
  assert.equal(normalizeLinkedIn("https://linkedin.com.evil.com/in/x"), null);
});

test("CV type comes from the file's bytes, not its name", () => {
  assert.equal(cvKind(Buffer.from("%PDF-1.7")), "pdf");
  assert.equal(cvKind(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0])), "docx");
  assert.equal(cvKind(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0])), "doc");
  assert.equal(cvKind(Buffer.from("MZ executable")), null);
  assert.equal(cvKind(Buffer.from("<html>")), null);
});

test("missing details are listed until everything is given", () => {
  const full = { fullName: "Ada", phone: "+2348031234567", location: "Lagos", jobTitle: "Engineer", yearsExperience: 0, hasCv: true, consentAt: "2026-11-07" };
  assert.deepEqual(missingDetails(full), []); // 0 years is a valid answer
  assert.deepEqual(missingDetails({ ...full, phone: null, hasCv: false, consentAt: null }), ["phone", "cv", "consent"]);
  assert.deepEqual(missingDetails({ ...full, yearsExperience: null, jobTitle: "  " }), ["jobTitle", "yearsExperience"]);
});

test("CSV cells that look like formulas open as plain text", async () => {
  const { toCsv } = await jiti.import("../../src/lib/csv.ts");
  const csv = toCsv(["Name", "Phone", "Note"], [
    ["Ada", "+2348031234567", "=HYPERLINK(\"http://x\")"],
    ["-2", "@SUM(A1)", 5],
  ]);
  const [, row1, row2] = csv.split("\r\n");
  assert.equal(row1, `Ada,'+2348031234567,"'=HYPERLINK(""http://x"")"`);
  assert.equal(row2, "'-2,'@SUM(A1),5"); // numbers are left alone
});
