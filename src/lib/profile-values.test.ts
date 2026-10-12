import { describe, expect, it } from "vitest";
import { profileValues } from "./profile-values";
const input = { name: " Sales 02 ", email: "SALES02@example.com", currentPassword: "test-current" };
describe("self profile updates", () => {
  it("normalizes personal fields", () => { expect(profileValues(input)).toEqual({ name: "Sales 02", email: "sales02@example.com", currentPassword: "test-current", password: "" }); });
  it("rejects editing ownership, permissions and extension", () => { for (const field of ["id", "role", "extension", "teamId"]) expect(() => profileValues({ ...input, [field]: "changed" })).toThrow(); });
  it("requires current password, valid email and sufficient new password length", () => { for (const change of [{ currentPassword: "" }, { email: "invalid" }, { password: "short" }, { name: "" }]) expect(() => profileValues({ ...input, ...change })).toThrow(); });
  it("requires matching confirmation when changing password", () => {
    expect(() => profileValues({ ...input, password: "new-password", confirmPassword: "different-password" })).toThrow("không trùng khớp");
    expect(profileValues({ ...input, password: "new-password", confirmPassword: "new-password" }).password).toBe("new-password");
  });
});
