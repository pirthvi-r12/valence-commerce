import { OrderDetail } from "@/components/account/OrderDetail";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shipment" };

export default function OrderPage({ params }: { params: { id: string } }) {
  return <OrderDetail id={params.id} />;
}
