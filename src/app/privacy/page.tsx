export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold font-sans text-white mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-white">
          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-3">
              We collect information that you provide directly to us and information about how you use our service:
            </p>
            <ul className="list-disc list-inside text-muted-foreground font-mono text-sm space-y-2 ml-4">
              <li><strong>Account Information:</strong> Email address, username (if provided), and authentication credentials</li>
              <li><strong>Content:</strong> Music files, album artwork, band information, and other content you upload</li>
              <li><strong>Usage Data:</strong> Songs played, play counts, likes, saved albums, and other interaction data</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground font-mono text-sm space-y-2 ml-4">
              <li>Provide, maintain, and improve our music streaming service</li>
              <li>Process your authentication and manage your account</li>
              <li>Deliver content you request and personalize your experience</li>
              <li>Send transactional emails (e.g., authentication links, account notifications)</li>
              <li>Analyze usage patterns to improve our platform and recommendations</li>
              <li>Ensure platform security and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              3. Data Storage
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              We use Supabase for database and file storage. Your data is stored securely on Supabase&apos;s infrastructure, 
              which provides industry-standard security measures including encryption at rest and in transit. We do not 
              sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              4. Cookies and Session Management
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-3">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground font-mono text-sm space-y-2 ml-4">
              <li><strong>Authentication:</strong> To maintain your login session and keep you signed in</li>
              <li><strong>Security:</strong> To protect against unauthorized access and maintain platform security</li>
              <li><strong>Preferences:</strong> To remember your settings and preferences</li>
            </ul>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mt-3">
              You can control cookies through your browser settings, though disabling cookies may affect your ability 
              to use certain features of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              5. Data Sharing
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-3">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground font-mono text-sm space-y-2 ml-4">
              <li>With service providers (like Supabase) who help us operate our platform, subject to confidentiality agreements</li>
              <li>When required by law or to respond to legal process</li>
              <li>To protect the rights, property, or safety of Distro, our users, or others</li>
              <li>In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              6. Your Rights
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground font-mono text-sm space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information in your account</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from non-essential communications</li>
            </ul>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mt-3">
              To exercise these rights, please contact us at support@distro.music. We will respond to your request 
              within a reasonable timeframe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              7. Data Retention
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you 
              services. If you delete your account, we will delete or anonymize your personal information, except 
              where we are required to retain it for legal or legitimate business purposes (such as maintaining 
              records of transactions or complying with legal obligations).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              Distro is not intended for users under the age of 13. We do not knowingly collect personal 
              information from children under 13. If you believe we have collected information from a child under 13, 
              please contact us immediately so we can delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by 
              posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. Your continued use 
              of Distro after such changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              10. Contact Us
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, 
              please contact us at:
            </p>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mt-2">
              <strong>Email:</strong> support@distro.music
            </p>
          </section>

          <p className="text-xs text-muted-foreground font-mono mt-8 pt-8 border-t border-white/10">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}
