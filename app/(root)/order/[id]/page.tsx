import { getOrderById } from "@/lib/actions/order.actions";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import OrderDetailsTable from "./order-details-table";
import { ShippingAddress } from "@/types";

export const metadata: Metadata = {
  title: "Order Details",
};

const OrderDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;
  const orderFromDb = await getOrderById(id);

  if (!orderFromDb) notFound();

  //   const { orderitems, ...restOfOrder } = orderFromDb;

  //   const correctedOrder = {
  //     ...restOfOrder,
  //     orderItems: orderitems, // renamne the property
  //     shippingAddress: orderFromDb.shippingAddress as ShippingAddress, // rename the property
  //   };

  return (
    <OrderDetailsTable
      order={{
        ...orderFromDb,
        orderItems: orderFromDb.orderitems,
        shippingAddress: orderFromDb.shippingAddress as ShippingAddress,
      }}
    />
  );
};

export default OrderDetailsPage;
