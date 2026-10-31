import { permanentRedirect } from "next/navigation";

// The demo used to live at /tracker; keep links already shared working.
export default function OldDemoLogin() {
  permanentRedirect("/tracker/demo/login");
}
