import { redirect } from "next/navigation";

/** The CRM opens on Contacts until the dashboard screen is built. */
export default function CrmHome() {
  redirect("/crm/contacts");
}
