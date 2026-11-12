import { redirect } from "next/navigation";

// The former virtual-market prototype is not part of NEXORA's social-assistance
// product. Keep the legacy URL safe and route visitors back to the real product.
export default function LegacyGamePage(): never {
  redirect("/");
}
