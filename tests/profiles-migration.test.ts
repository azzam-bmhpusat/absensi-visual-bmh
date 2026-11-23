import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "0008_profiles.sql"), "utf-8");

describe("Migrasi 0008_profiles.sql", () => {
  it("membuat enum dua role dan tabel profiles yang terhubung ke auth.users", () => {
    expect(sql).toMatch(/create type public\.app_role as enum \('admin', 'user'\)/);
    expect(sql).toMatch(/create table public\.profiles/);
    expect(sql).toMatch(/references auth\.users \(id\) on delete cascade/);
    expect(sql).toMatch(/role public\.app_role not null default 'user'/);
  });

  it("menjadikan akun yang sudah ada sebagai admin (backfill)", () => {
    expect(sql).toMatch(/insert into public\.profiles \(id, email, role\)\s+select id, email, 'admin'::public\.app_role\s+from auth\.users/);
  });

  it("mengisi profiles otomatis saat user baru dibuat dan menyinkronkan perubahan email", () => {
    expect(sql).toMatch(/create trigger on_auth_user_created\s+after insert on auth\.users/);
    expect(sql).toMatch(/after update of email on auth\.users/);
    expect(sql).toContain("insert into public.profiles (id, email)");
  });

  it("fungsi security definer memakai search_path kosong dan tidak bisa dipanggil klien", () => {
    const code = sql.replace(/--.*$/gm, ""); // abaikan komentar
    expect(code.match(/security definer/g)?.length).toBe(3);
    expect(code.match(/set search_path = ''/g)?.length).toBe(4); // 3 security definer + trigger updated_at
    expect(sql).toMatch(/revoke execute on function public\.handle_new_user\(\) from public, anon, authenticated/);
  });

  it("RLS aktif dan klien hanya boleh membaca (tidak bisa mengubah role sendiri)", () => {
    expect(sql).toMatch(/alter table public\.profiles enable row level security/);
    expect(sql).toMatch(/revoke all on public\.profiles from anon, authenticated/);
    expect(sql).toMatch(/grant select on public\.profiles to authenticated/);
    expect(sql).not.toMatch(/grant\s+(insert|update|delete)[^;]*public\.profiles/i);
    expect(sql).not.toMatch(/create policy[^;]*for (insert|update|delete|all)/i);
  });
});

describe("Migrasi role peserta (0015, 0016)", () => {
  const dir = path.join(__dirname, "..", "supabase", "migrations");
  const add = fs.readFileSync(path.join(dir, "0015_add_peserta_role.sql"), "utf-8").replace(/--.*$/gm, "");
  const move = fs.readFileSync(path.join(dir, "0016_users_to_peserta.sql"), "utf-8").replace(/--.*$/gm, "");

  it("menambah 'peserta' tanpa menghapus 'user', di file terpisah dari pemakaiannya", () => {
    expect(add).toMatch(/alter type public\.app_role add value if not exists 'peserta'/);
    expect(add).not.toMatch(/drop|rename/i);
    expect(add).not.toMatch(/update public\.profiles/);
  });

  it("memindah semua role 'user' ke 'peserta' dan menjadikannya default", () => {
    expect(move).toMatch(/update public\.profiles set role = 'peserta' where role = 'user'/);
    expect(move).toMatch(/alter column role set default 'peserta'/);
  });
});
