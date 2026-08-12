// Import personel Mechanical & Structure dari 2 sumber:
//   1. Pas Foto Team Maint. Mechanical(1).xlsx  -> group/workshop (65 baris)
//   2. Salinan SAU - Form PA-2021(Mrk)-rev0 - Website(1).pdf -> master profil (30 record)
// Keputusan user: untuk NIK duplikat, abaikan varian SC/L, pakai S1/HPI.
// Departemen: per group (Rotating/Static/Jetty); workshop masuk ke kolom position.
// Foto: diupload ke bucket Supabase Storage 'employee-photos'.
//
// Usage: node --env-file=.env.local scripts/import-personnel.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PHOTO_DIR = "photos";

function basic(nik, name, dept, workshop) {
  const pos = workshop ? `Mechanic - Workshop ${workshop}` : "Mechanic";
  return { nik, name, dept, workshop, position: pos, edu: null, grade: null, join: null, skills: [], certs: [], notes: null, photo: null };
}

// Skill di-normalisasi ke nama yang sudah ada di tabel skills (seed).
const PEOPLE = [
  // ---------- MECHANICAL STATIC - CAP ----------
  { nik: "S0957", name: "Muhammad Jamil", dept: "Mechanical Static", workshop: "CAP", position: "Foreman - Workshop CAP", edu: "SMK", grade: "4", join: "01/07/2008", skills: ["Welder", "Non Metal", "Driver Forklift", "Weight Lifting Arrangement"], certs: ["TKBT1"], notes: "NIK S1327 (Excel Rotating CAP) diabaikan per keputusan - diduga orang sama." },
  { nik: "S1472", name: "HEBRON SIMAMORA", dept: "Mechanical Static", workshop: "CAP", position: "Mechanic - Workshop CAP", edu: null, grade: null, join: null, skills: [], certs: [], notes: null },
  { nik: "S1562", name: "Adam Mahendra", dept: "Mechanical Static", workshop: "CAP", position: "Leader - Workshop CAP", edu: "D3", grade: "4", join: "05/07/2021", skills: ["SMAW", "Non Metal"], certs: ["Tenaga Kerja Bangunan Tinggi (TKBT) Tingkat 2"], notes: null },
  { nik: "S1686", name: "Syaiful Arifin", dept: "Mechanical Static", workshop: "CAP", position: "Leader - Workshop CAP", edu: "D3", grade: "4", join: "24/10/2022", skills: ["SMAW", "Non Metal"], certs: ["TKBT1"], notes: null },
  { nik: "S1061", name: "Endang Galih", dept: "Mechanical Static", workshop: "CAP", position: "Welder SMAW/GTAW - Workshop CAP", edu: "SMK", grade: "2", join: "01/11/2011", skills: ["Welder", "Fitter"], certs: ["TKBT1"], notes: null },
  { nik: "S1344", name: "Adi Syuhada", dept: "Mechanical Static", workshop: "CAP", position: "Welder SMAW - Workshop CAP", edu: "SMK", grade: "3", join: "15/11/2016", skills: ["Welder", "Scaffolder", "Non Metal", "Weight Lifting Arrangement"], certs: ["Certified Welder SMAW 6G", "Teknisi K3 Scaffolding", "Tenaga Kerja pada Ketinggian (TKPK) Tingkat 1"], notes: null },
  { nik: "S1532", name: "Firmansyah", dept: "Mechanical Static", workshop: "CAP", position: "Welder SMAW/GTAW - Workshop CAP", edu: "SMK", grade: "2", join: "14/10/2019", skills: ["Welder"], certs: ["Certified Welder GTAW 6G", "TKBT1"], notes: null },
  { nik: "S1678", name: "Sofwatillah", dept: "Mechanical Static", workshop: "CAP", position: "Scaffolder - Workshop CAP", edu: "SMK", grade: "2", join: "01/11/2021", skills: ["Scaffolder", "Welder", "Tool Keeper", "Driver Forklift"], certs: ["Teknisi K3 Scaffolding", "Tenaga Kerja pada Ketinggian (TKPK) Tingkat 1"], notes: null },
  { nik: "HPI0021", name: "Aceng", dept: "Mechanical Static", workshop: "CAP", position: "Mechanic - Workshop CAP", edu: null, grade: null, join: null, skills: [], certs: [], notes: "Profil PDF (NIK L0208) diabaikan per keputusan - pakai NIK HPI." },
  { nik: "S1666", name: "Verdi Maykl", dept: "Mechanical Static", workshop: "CAP", position: "Scaffolder - Workshop CAP", edu: "SMK", grade: "2", join: "01/11/2021", skills: ["Scaffolder", "Welder", "Tool Keeper"], certs: ["TKBT1"], notes: null },
  { nik: "SC1332", name: "Wahyu Nur Huda", dept: "Mechanical Static", workshop: "CAP", position: "On Training - Workshop CAP", edu: "D3", grade: "4", join: null, skills: [], certs: [], notes: "Tercatat di Static CAP & VCM - 1 personel." },
  { nik: "S1529", name: "Babay Isroby", dept: "Mechanical Static", workshop: "CAP", position: "Welder - Workshop CAP", edu: "SMK", grade: "2", join: "14/10/2019", skills: ["SMAW", "Welder"], certs: ["Teknisi K3 Scaffolding", "Tenaga Kerja pada Ketinggian (TKPK) Tingkat 1"], notes: null },
  { nik: "S1604", name: "Ferdiansyah", dept: "Mechanical Static", workshop: "CAP", position: "Tool Keeper - Workshop CAP", edu: "SMK", grade: "2", join: "01/02/2019", skills: ["Tool Keeper", "Welder"], certs: ["Teknisi K3 Scaffolding", "Tenaga Kerja pada Ketinggian (TKPK) Tingkat 1"], notes: null },
  { nik: "SC1306", name: "Sandi Purnama", dept: "Mechanical Static", workshop: "CAP", position: "Welder SMAW - Workshop CAP", edu: "D3", grade: "4", join: null, skills: ["Welder", "Non Metal"], certs: [], notes: null },
  { nik: "S1503", name: "Fathoni Akbar", dept: "Mechanical Static", workshop: "CAP", position: "Fitter - Workshop CAP", edu: "D3", grade: "4", join: "02/12/2019", skills: ["SMAW", "Non Metal", "Fitter"], certs: ["Juru Fitter Structure, Piping & Equipment", "Tenaga Kerja Bangunan Tinggi (TKBT) Tingkat 2"], notes: null },

  // ---------- MECHANICAL STATIC - VCM ----------
  { nik: "S1754", name: "M. Ichwan Faried", dept: "Mechanical Static", workshop: "VCM", position: "Mechanic - Workshop VCM", edu: null, grade: null, join: null, skills: [], certs: [], notes: null },
  { nik: "S1504", name: "Andre Pratama", dept: "Mechanical Static", workshop: "VCM", position: "Foreman - Workshop VCM", edu: "D3", grade: "4", join: "02/12/2019", skills: ["Fitter", "SMAW", "Non Metal", "Rigger", "Driver Forklift", "Weight Lifting Arrangement"], certs: ["Juru Fitter Structure, Piping & Equipment", "Tenaga Kerja Bangunan Tinggi (TKBT) Tingkat 2", "Teknisi K3 Juru Ikat (Rigger)"], notes: null },
  { nik: "S1563", name: "Yudit Hernawan", dept: "Mechanical Static", workshop: "VCM", position: "Leader - Workshop VCM", edu: "D3", grade: "4", join: "05/07/2021", skills: ["SMAW", "Non Metal", "Driver Forklift", "Rigger"], certs: ["Tenaga Kerja pada Ketinggian (TKPK) Tingkat 1", "Teknisi K3 Juru Ikat (Rigger)", "Petugas K3 Ruang Terbatas Utama"], notes: null },
  { nik: "S1753", name: "M. Saiffudin", dept: "Mechanical Static", workshop: "VCM", position: "Welder - Workshop VCM", edu: "D3", grade: "4", join: "12/01/2023", skills: ["SMAW", "Non Metal"], certs: ["TKBT1"], notes: null },
  { nik: "S1655", name: "Apriyanto", dept: "Mechanical Static", workshop: "VCM", position: "Scaffolder - Workshop VCM", edu: "SMK", grade: "2", join: "01/11/2021", skills: ["Scaffolder", "SMAW"], certs: ["Teknisi K3 Scaffolding", "Tenaga Kerja pada Ketinggian (TKPK) Tingkat 1"], notes: null },
  { nik: "S1796", name: "Ansori", dept: "Mechanical Static", workshop: "VCM", position: "Mechanic - Workshop VCM", edu: null, grade: null, join: null, skills: [], certs: [], notes: "NIK SC1095 (PDF) diabaikan per keputusan - pakai S1." },
  { nik: "S1671", name: "Yusuful Agrifiadi", dept: "Mechanical Static", workshop: "VCM", position: "Welder SMAW/GTAW - Workshop VCM", edu: "SMK", grade: "2", join: "01/11/2021", skills: ["Welder", "Non Metal"], certs: ["Juru Las Combine SMAW / Listrik & GTAW / Argon 6 G", "TKBT1"], notes: null },
  { nik: "S1794", name: "Andri Wijaya", dept: "Mechanical Static", workshop: "VCM", position: "Mechanic - Workshop VCM", edu: null, grade: null, join: null, skills: [], certs: [], notes: "NIK SC1093 (PDF) diabaikan per keputusan - pakai S1." },
  { nik: "S1859", name: "Kurnaini", dept: "Mechanical Static", workshop: "VCM", position: "Mechanic - Workshop VCM", edu: null, grade: null, join: null, skills: [], certs: [], notes: "NIK L0129 (PDF, Kurnaeni) diabaikan per keputusan - pakai S1." },
  { nik: "SC1264", name: "Andrian Hamzah Kurniawan", dept: "Mechanical Static", workshop: "VCM", position: "Welder SMAW - Workshop VCM", edu: "SMK", grade: "2", join: "01/01/2025", skills: ["Welder", "Non Metal"], certs: [], notes: null },
  { nik: "S1570", name: "Aji Syamsul Arifin", dept: "Mechanical Static", workshop: "VCM", position: "Leader - Workshop VCM", edu: "D3", grade: "4", join: "05/07/2021", skills: ["SMAW", "Non Metal"], certs: ["Tenaga Kerja Bangunan Tinggi (TKBT) Tingkat 2", "Petugas K3 Ruang Terbatas Utama"], notes: null },
  { nik: "S1526", name: "Afriyadi", dept: "Mechanical Static", workshop: "VCM", position: "Welder SMAW/GTAW - Workshop VCM", edu: "SMK", grade: "2", join: "14/10/2019", skills: ["Welder"], certs: ["Juru Las Combine SMAW / Listrik & GTAW / Argon 6 G", "Teknisi K3 Juru Ikat (Rigger)", "TKBT1"], notes: null },
  { nik: "S1658", name: "Reksi Hajatulloh", dept: "Mechanical Static", workshop: "VCM", position: "Tool Keeper - Workshop VCM", edu: "SMK", grade: "2", join: "01/11/2021", skills: ["Tool Keeper", "Scaffolder"], certs: ["Tenaga Kerja pada Ketinggian (TKPK) Tingkat 1"], notes: null },
  { nik: "S1663", name: "Ahmad Sufriyadi", dept: "Mechanical Static", workshop: "VCM", position: "Welder SMAW/GTAW - Workshop VCM", edu: "SMK", grade: "2", join: "01/11/2021", skills: ["Welder"], certs: ["Juru Las Combine SMAW / Listrik & GTAW / Argon 6 G", "TKBT1"], notes: null },

  // ---------- MECHANICAL ROTATING - CAP ----------
  basic("P0072", "Harjito", "Mechanical Rotating", "CAP"),
  basic("S1567", "Fredick Bona Pahala", "Mechanical Rotating", "CAP"),
  basic("S1565", "Ryan Adinata", "Mechanical Rotating", "CAP"),
  basic("S1815", "Gustricho Bashar S", "Mechanical Rotating", "CAP"),
  basic("S1342", "Bahrul Ulum", "Mechanical Rotating", "CAP"),
  basic("S1533", "Nasrudin", "Mechanical Rotating", "CAP"),
  basic("S1773", "Fajar Bahrul Ulum", "Mechanical Rotating", "CAP"),
  basic("L0503", "Rafiuddarojat", "Mechanical Rotating", "CAP"),
  basic("S1058", "Rohmatulloh", "Mechanical Rotating", "CAP"),
  basic("S1560", "Bagas Ivan Maulana", "Mechanical Rotating", "CAP"),
  basic("S1751", "Rifqi Alfyan", "Mechanical Rotating", "CAP"),
  basic("S1475", "Abdul Latif Alfaqih", "Mechanical Rotating", "CAP"),

  // ---------- MECHANICAL ROTATING - VCM ----------
  basic("S1477", "M. Rifai", "Mechanical Rotating", "VCM"),
  basic("S1571", "Rizal Awaludin", "Mechanical Rotating", "VCM"),
  basic("S1823", "Raja Mahatama G C S", "Mechanical Rotating", "VCM"),
  basic("S1523", "Davis", "Mechanical Rotating", "VCM"),
  basic("S1651", "Noval Maulana", "Mechanical Rotating", "VCM"),
  basic("S1652", "Sirajudin", "Mechanical Rotating", "VCM"),
  basic("S1670", "M. Indra Hariawan", "Mechanical Rotating", "VCM"),
  basic("S1785", "Jajuli", "Mechanical Rotating", "VCM"),
  basic("S1605", "M. Nur Ihsan", "Mechanical Rotating", "VCM"),
  basic("S1843", "Rd Reyhan Triwibowo", "Mechanical Rotating", "VCM"),
  { nik: "S1564", name: "Taif Asfar", dept: "Mechanical Rotating", workshop: "VCM", position: "Leader - Workshop VCM", edu: "D3", grade: "4", join: "05/07/2021", skills: ["SMAW", "Non Metal", "Fitter"], certs: ["Juru Fitter Structure, Piping & Equipment", "Tenaga Kerja Bangunan Tinggi (TKBT) Tingkat 2", "Petugas K3 Ruang Terbatas Utama"], notes: null },
  basic("S1775", "M. Adittiar Rosyanto", "Mechanical Rotating", "VCM"),

  // ---------- MECHANICAL JETTY ----------
  basic("S1502", "Gusti Agung P", "Mechanical Jetty", "JETTY"),
  basic("S1559", "Dimas Prasetio", "Mechanical Jetty", "JETTY"),
  basic("S1691", "Roy Risky Ramadan", "Mechanical Jetty", "JETTY"),
  basic("S0961", "Heri Susanto", "Mechanical Jetty", "JETTY"),
  basic("S1343", "Jihadillah", "Mechanical Jetty", "JETTY"),
  basic("S1647", "Ryan Renaldi", "Mechanical Jetty", "JETTY"),
  basic("S1776", "Susanto", "Mechanical Jetty", "JETTY"),
  basic("S1851", "Faturohman", "Mechanical Jetty", "JETTY"),
  basic("S1531", "Vrengsisco", "Mechanical Jetty", "JETTY"),
  basic("S1774", "Rafiul Amri", "Mechanical Jetty", "JETTY"),

  // ---------- PDF-ONLY (tanpa kelompok di Excel) ----------
  { nik: "SC1277", name: "Daniel Jhuanlie Einstein S", dept: null, workshop: null, position: "Mechanic", edu: "D3", grade: "4", join: null, skills: ["Non Metal"], certs: [], notes: null },
  { nik: "L0134", name: "Usman", dept: null, workshop: null, position: "Fitter", edu: "SMK", grade: "2", join: "01/09/2013", skills: ["Fitter", "SMAW", "Non Metal"], certs: ["TKBT1"], notes: null },
];

function parseDate(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let y = Number(m[3]);
  if (y < 100) y += 2000;
  const mo = Number(m[2]);
  const d = Number(m[1]);
  if (!mo || !d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

async function ensureDepartments() {
  const { data: existing } = await db.from("departments").select("id, name");
  const map = new Map((existing ?? []).map((d) => [d.name, d.id]));
  for (const name of ["Mechanical Rotating", "Mechanical Static", "Mechanical Jetty"]) {
    if (!map.has(name)) {
      const { data, error } = await db
        .from("departments")
        .insert({ name, description: "Tim mechanical (import personel)" })
        .select("id, name")
        .single();
      if (error) throw new Error("Gagal buat departemen " + name + ": " + error.message);
      map.set(name, data.id);
    }
  }
  return map;
}

async function getSkillMap() {
  const { data } = await db.from("skills").select("id, name");
  const map = new Map();
  for (const s of data ?? []) map.set(s.name, s.id);
  return map;
}

async function generateEmployeeCode() {
  const { data, error } = await db.rpc("generate_code", { prefix: "EMP", width: 4 });
  if (error || !data) throw new Error("generate_code gagal: " + (error?.message ?? "unknown"));
  return String(data);
}

async function uploadPhotos() {
  const { error: bucketErr } = await db.storage.createBucket("employee-photos", { public: true });
  if (bucketErr && !String(bucketErr.message).toLowerCase().includes("already exists")) {
    console.log("Bucket check:", bucketErr.message);
  }

  const files = readdirSync(PHOTO_DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));
  const byNik = new Map();
  for (const file of files) {
    const nik = file.split("_")[0].toUpperCase();
    if (!byNik.has(nik) || /\.png$/i.test(file)) byNik.set(nik, file); // preferensi .png
  }

  let uploaded = 0;
  for (const [nik, file] of byNik) {
    const buffer = readFileSync(join(PHOTO_DIR, file));
    const contentType = /\.png$/i.test(file) ? "image/png" : "image/jpeg";
    const { error } = await db.storage
      .from("employee-photos")
      .upload(file, buffer, { contentType, upsert: true });
    if (error) {
      console.log("Upload gagal " + file + ": " + error.message);
      continue;
    }
    uploaded++;
  }
  console.log(`Foto terupload: ${uploaded}/${byNik.size}`);
  return [...byNik.entries()].reduce((acc, [nik, file]) => {
    acc[nik] = `${SUPABASE_URL}/storage/v1/object/public/employee-photos/${encodeURIComponent(file)}`;
    return acc;
  }, {});
}

(async () => {
  console.log("Memulai import personel...");
  const deptMap = await ensureDepartments();
  const skillMap = await getSkillMap();
  const photoUrls = await uploadPhotos();

  let inserted = 0, skipped = 0, skillLinks = 0, certInserts = 0;

  for (const p of PEOPLE) {
    const employeeId = await generateEmployeeCode();
    const deptId = p.dept ? deptMap.get(p.dept) : null;

    const { data: existing } = await db.from("employees").select("id").eq("nik", p.nik).maybeSingle();
    if (existing) {
      console.log(`SKIP ${p.nik} - sudah ada`);
      skipped++;
      continue;
    }

    const photoUrl = photoUrls[p.nik.toUpperCase()] ?? null;
    const { data: emp, error: empErr } = await db
      .from("employees")
      .insert({
        employee_id: employeeId,
        qr_code: employeeId,
        nik: p.nik,
        name: p.name,
        photo_url: photoUrl,
        position: p.position,
        department_id: deptId,
        education: p.edu,
        grade: p.grade ? String(p.grade) : null,
        join_date: parseDate(p.join),
        employment_status: "ACTIVE",
        notes: p.notes ? `${p.notes} Data diimpor dari Dokumen Personel Mechanical & Structure.` : "Data diimpor dari Dokumen Personel Mechanical & Structure.",
      })
      .select("id")
      .single();
    if (empErr) {
      console.error(`GAGAL ${p.nik} ${p.name}: ${empErr.message}`);
      continue;
    }
    inserted++;

    for (const skillName of p.skills) {
      const skillId = skillMap.get(skillName);
      if (!skillId) {
        console.log(`Skill tidak ditemukan (skip): ${skillName} untuk ${p.nik}`);
        continue;
      }
      const { error } = await db.from("employee_skills").insert({
        employee_id: emp.id,
        skill_id: skillId,
        level: "INTERMEDIATE",
        status: "VERIFIED",
        verified_at: new Date().toISOString(),
      });
      if (!error) skillLinks++;
    }

    for (const certName of p.certs) {
      const { error } = await db.from("employee_certificates").insert({
        employee_id: emp.id,
        certificate_name: certName,
        status: "VALID",
      });
      if (!error) certInserts++;
    }
  }

  console.log(`\nSelesai. Employee baru: ${inserted}, skip: ${skipped}, skill link: ${skillLinks}, sertifikat: ${certInserts}.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
