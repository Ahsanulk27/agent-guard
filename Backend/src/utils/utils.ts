import crypto from "crypto";

export const generateHash = (data: any): string => {
  const jsonString = JSON.stringify(data);
  return crypto.createHash("sha256").update(jsonString).digest("hex");
};

export const generateRandomKey = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return `sk-ag-${Array.from(
    { length: 32 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("")}`;
}