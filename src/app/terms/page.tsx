export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold font-sans text-white mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-white">
          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              Welcome to Distro. These Terms of Service (&quot;Terms&quot;) govern your access to and use of 
              our music streaming platform. By creating an account, uploading content, or using our services, 
              you agree to be bound by these Terms. If you do not agree to these Terms, please do not use 
              our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              2. User Accounts
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-3">
              You are responsible for maintaining the security of your account credentials. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground font-mono text-sm space-y-2 ml-4">
              <li>Keep your password and authentication credentials confidential</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Be responsible for all activities that occur under your account</li>
              <li>Provide accurate and complete information when creating your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              3. Content Ownership and Licensing
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-3">
              You retain full ownership of all music, artwork, and other content you upload to Distro. 
              However, by uploading content to our platform, you grant Distro a worldwide, non-exclusive, 
              royalty-free license to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground font-mono text-sm space-y-2 ml-4">
              <li>Store, stream, and distribute your content through our platform</li>
              <li>Display your content to users of the service</li>
              <li>Use your content for promotional purposes related to the platform</li>
              <li>Create and maintain backup copies of your content</li>
            </ul>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mt-3">
              This license continues for as long as your content remains on our platform. You may remove 
              your content at any time, and the license will terminate, except for content already distributed 
              or cached by our systems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              4. Acceptable Use
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-3">
              You agree not to use Distro to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground font-mono text-sm space-y-2 ml-4">
              <li>Upload content that infringes on copyrights, trademarks, or other intellectual property rights</li>
              <li>Upload illegal content, including but not limited to content that promotes violence, hate speech, or illegal activities</li>
              <li>Upload content that contains malware, viruses, or other harmful code</li>
              <li>Impersonate other artists, bands, or entities</li>
              <li>Engage in spam, harassment, or abusive behavior toward other users</li>
              <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
              <li>Use automated systems to scrape, download, or redistribute content without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              5. Termination
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              We reserve the right to suspend or terminate your account and access to Distro at any time, 
              with or without notice, for any violation of these Terms or for any other reason we deem necessary 
              to protect the integrity of our platform and community. Upon termination, you may lose access to 
              your account and content, though we will make reasonable efforts to allow you to export your data 
              where legally required.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              6. Disclaimers
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-3">
              Distro is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express 
              or implied. We do not guarantee that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground font-mono text-sm space-y-2 ml-4">
              <li>The service will be uninterrupted, secure, or error-free</li>
              <li>Any defects or errors will be corrected</li>
              <li>The service will meet your specific requirements</li>
            </ul>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed mt-3">
              You use the service at your own risk. We are not liable for any loss or damage resulting from 
              your use of Distro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              7. Changes to Terms
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of material changes 
              via email or through a notice on our platform. Your continued use of Distro after such 
              modifications constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-sans text-white mb-4">
              8. Contact
            </h2>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              If you have questions about these Terms, please contact us at support@distro.music.
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
