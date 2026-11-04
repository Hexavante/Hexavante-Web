import { describe, expect, it } from "vitest";
import { allowedRoleChanges, canManageTarget, canDo } from "../moderation/permissions";
import { isInstructor, canModerate } from "../permissions";

describe("hierarquia de moderação", () => {
  it.each(["USER","MODERATOR","ADMIN","SUPERADMIN"])("bloqueia a própria conta e o cargo máximo para %s", actor => {
    expect(allowedRoleChanges([actor], ["USER"], true)).toEqual([]);
    expect(allowedRoleChanges([actor], ["USER"], false)).not.toContain("SUPERADMIN");
    expect(canManageTarget([actor], ["USER","SUPERADMIN"], false)).toBe(false);
  });
  it("limita cargo e alvo, inclusive remoções", () => {
    expect(allowedRoleChanges(["MODERATOR"],["USER"],false)).toContain("INSTRUCTOR");
    expect(allowedRoleChanges(["MODERATOR"],["USER"],false)).not.toContain("ADMIN");
    expect(allowedRoleChanges(["ADMIN"],["USER","MODERATOR"],false)).toContain("MODERATOR");
    expect(allowedRoleChanges(["ADMIN"],["ADMIN"],false)).toEqual([]);
    expect(allowedRoleChanges(["SUPERADMIN"],["USER"],false)).toContain("ADMIN");
  });
  it("docentes não recebem poderes de moderação e sanções só são levantadas pela administração", () => {
    for (const role of ["TEACHER","INSTRUCTOR"]) {
      expect(isInstructor([role])).toBe(true); expect(canModerate([role])).toBe(false);
    }
    for (const command of ["unban","unmute"]) {
      expect(canDo(command,["MODERATOR"])).toBe(false);
      expect(canDo(command,["ADMIN"])).toBe(true);
    }
  });
});
