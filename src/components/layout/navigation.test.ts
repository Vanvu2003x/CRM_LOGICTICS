import { describe, expect, it } from "vitest";
import { navigation, navigationForPath, sections } from "./navigation";

describe("CRM navigation", () => {
  it("groups daily work, operations and administration separately", () => {
    expect(sections.map((section) => section.id)).toEqual(["sales", "tasks", "operations", "system"]);
    expect(navigation.find((item) => item.href === "/payments")?.section).toBe("operations");
    expect(navigation.some((item) => item.href === "/tasks")).toBe(false);
    expect(navigation.find((item) => item.href === "/orders")?.children?.map((item) => item.name)).toEqual(["Quy trình đơn hàng", "Danh sách đơn"]);
    expect(navigation.find((item) => item.href === "/settings")?.children).toBeUndefined();
  });
  it("selects the most specific destination for nested routes", () => {
    expect(navigationForPath("/orders/failed")?.name).toBe("Danh sách đơn");
    expect(navigationForPath("/pipeline/ORD-001")?.name).toBe("Quy trình đơn hàng");
    expect(navigationForPath("/settings/ity")?.name).toBe("Quản trị hệ thống");
    expect(navigationForPath("/payments")?.name).toBe("Công nợ & Thanh toán");
    expect(navigationForPath("/unknown")).toBeUndefined();
  });
});
