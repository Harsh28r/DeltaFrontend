import BreadcrumbComp from "../../layout/shared/breadcrumb/BreadcrumbComp";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Chat App",
};

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Chat",
  },
];
const Chats = () => {
  return (
    <>
      <BreadcrumbComp title="Chat App" items={BCrumb} />
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Chat</h2>
          <p className="text-muted-foreground">Chat coming soon</p>
        </div>
      </div>
    </>
  );
};

export default Chats;
