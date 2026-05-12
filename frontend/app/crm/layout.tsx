export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="crm-layout">
      {children}
    </div>
  );
}