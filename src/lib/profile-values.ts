export function profileValues(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Thông tin không hợp lệ.");
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some(key => !["name", "email", "currentPassword", "password", "confirmPassword"].includes(key))) throw new Error("Chỉ được sửa thông tin cá nhân.");
  if (typeof data.name !== "string" || !data.name.trim() || data.name.length > 150 || typeof data.email !== "string" || data.email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) throw new Error("Nhập tên và email hợp lệ.");
  if (typeof data.currentPassword !== "string" || !data.currentPassword || data.currentPassword.length > 100) throw new Error("Nhập mật khẩu CRM hiện tại để xác nhận.");
  const password = data.password ?? "";
  if (typeof password !== "string" || (password && (password.length < 8 || password.length > 100))) throw new Error("Mật khẩu mới cần 8–100 ký tự.");
  if (password && data.confirmPassword !== password) throw new Error("Mật khẩu mới và xác nhận không trùng khớp.");
  return { name: data.name.trim(), email: data.email.trim().toLowerCase(), currentPassword: data.currentPassword, password };
}
