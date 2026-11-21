import type { Metadata } from "next";

// Account page: kept out of search results (the page itself is a client
// component, so its metadata lives here).
export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
