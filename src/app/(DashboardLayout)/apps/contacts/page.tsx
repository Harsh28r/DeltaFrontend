import BreadcrumbComp from "../../layout/shared/breadcrumb/BreadcrumbComp";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Contact App",
};
const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Contact",
  },
];
const Contacts = () => {
  return (
    <>
      <BreadcrumbComp title="Contact App" items={BCrumb} />
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Contacts</h2>
          <p className="text-muted-foreground">Contacts coming soon</p>
        </div>
      </div>
    </>
  );
};

export default Contacts;
