import { safeUrl } from "./business-rules";

export function validateCampaignLink(value: string) {
  const link = value.trim();
  if (!link) throw new Error("Nhập link kế hoạch trước khi lưu.");
  if (!safeUrl(link)) throw new Error("Link cần bắt đầu bằng HTTP/HTTPS.");
  return link;
}
