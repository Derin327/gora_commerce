import { redirect } from "next/navigation";
export default function OldOrdersRedirect() {
  redirect("/account/orders");
}
