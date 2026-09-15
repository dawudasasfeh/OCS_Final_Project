import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  const { t } = useTranslation();

  // Around the page only, so the navbar and footer stay put while a
  // lazily-loaded page's code arrives.
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<div className="container section"><p className="muted">{t("common.loading")}</p></div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
