import MainLayout from '@/components/MainLayout';

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
