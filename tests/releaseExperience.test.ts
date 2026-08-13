import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("IAMme release experience", () => {
  it("keeps IAMme as the parent brand and links the primary experience", () => {
    const page = read("app/page.tsx");
    expect(page).toContain("IAMme");
    expect(page).toContain('href="/demo"');
    expect(page).toContain("HumanProofは、その最初の動くプロダクトです");
  });

  it("starts the guided demo without a service-policy form", () => {
    const demo = read("app/demo/page.tsx");
    expect(demo).toContain("デモアカウントを作る");
    expect(demo).toContain("本人確認を完了する（模擬）");
    expect(demo).toContain("IAMmeで証明する");
    expect(demo).toContain("18歳以上向け映像作品を扱う架空のECサイト");
    expect(demo).toContain("AIは導入時に働きます");
    expect(demo).not.toMatch(/<input|<textarea|\/api\/analyze|\/api\/provider/);
  });

  it("uses the real proof lifecycle endpoints", () => {
    const demo = read("app/demo/page.tsx");
    for (const endpoint of ["quote", "issue", "verify", "revoke"]) {
      expect(demo).toContain(`/api/proof/${endpoint}`);
    }
    expect(demo).toContain('"over_18", "human_verified"');
  });

  it("keeps Policy Studio on a separate route", () => {
    expect(read("app/studio/page.tsx")).toContain('fetch("/api/analyze"');
  });

  it("ships the HumanProof poster as a public asset", () => {
    expect(existsSync("public/brand/humanproof-poc-poster.png")).toBe(true);
  });
});
