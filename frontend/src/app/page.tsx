import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.logo}>Asset Flow</div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.navLink}>Log in</Link>
          <Link href="/register" className={styles.btnPrimary} style={{ padding: '0.5rem 1rem' }}>Get Started</Link>
        </div>
      </nav>

      <main className={styles.hero}>
        <h1 className={styles.title}>Asset Management, Simplified.</h1>
        <p className={styles.subtitle}>
          Take control of your organization's physical resources. Track inventory, manage lifecycle audits, and streamline resource bookings—all from a single, minimalist platform.
        </p>
        <div className={styles.actions}>
          <Link href="/register" className={styles.btnPrimary}>Start for free</Link>
          <Link href="/login" className={styles.btnSecondary}>Sign in to workspace</Link>
        </div>
      </main>

      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>Smart Directory</h3>
            <p className={styles.featureDesc}>
              Maintain a centralized repository of all your assets. Track real-time statuses—whether available, allocated, or under maintenance.
            </p>
          </div>
          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>Resource Booking</h3>
            <p className={styles.featureDesc}>
              Prevent conflicts with a unified calendar view. Allow employees to seamlessly book shared resources like conference rooms and company vehicles.
            </p>
          </div>
          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>Lifecycle Audits</h3>
            <p className={styles.featureDesc}>
              Ensure accountability. Schedule periodic audits, assign auditors, and keep a definitive history of every asset's condition over time.
            </p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} Asset Flow. All rights reserved.
      </footer>
    </div>
  );
}
