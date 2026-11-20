import { getEventSettings } from "@/lib/event-settings-server";
import { WhatsAppFloat } from "@/components/rakernas/whatsapp-float";

/** Server component: mengambil footer_url dari event settings lalu meneruskannya ke popup. */
export async function WhatsAppFloatSlot() {
  const { footerUrl } = await getEventSettings();
  return <WhatsAppFloat href={footerUrl} />;
}
