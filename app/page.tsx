import { getProducts } from "@/lib/store";
import Shop from "@/components/shop";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products = [];
  try { products = await getProducts(); } catch { /* Show setup guidance if the database is not configured. */ }
  return <Shop products={products} />;
}
