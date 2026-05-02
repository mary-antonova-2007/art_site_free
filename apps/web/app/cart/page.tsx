import { CartPage } from "@/components/shop/cart-page";
import { getCommerceSettings } from "@/lib/content-service";

export default async function CartRoutePage() {
  const commerceSettings = await getCommerceSettings();
  return <CartPage commerceSettings={commerceSettings} />;
}
