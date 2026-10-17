import ObjectsTabs from "./ObjectsTabs";

export default function AdminObjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-helvetica font-bold text-2xl text-[#1a1a1a] mb-5">
          Nexo Objects
        </h1>
        <ObjectsTabs />
      </div>
      {children}
    </div>
  );
}
