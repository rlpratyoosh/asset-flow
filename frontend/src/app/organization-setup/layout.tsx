import MainLayout from '@/components/MainLayout';

export default function OrganizationSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
