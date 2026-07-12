import MainLayout from '@/components/MainLayout';

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
