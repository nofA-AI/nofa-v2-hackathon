import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: February 4, 2026
            </p>
          </div>

          {/* Introduction */}
          <section className="space-y-4">
            <p className="text-base leading-relaxed">
              At NOFA, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our platform and services. Please read this privacy policy
              carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">1. Information We Collect</h2>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">1.1 Personal Information</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                We may collect personal information that you voluntarily provide to us when you register on the platform,
                including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Email address</li>
                <li>Wallet addresses (cryptocurrency wallets)</li>
                <li>Username and profile information</li>
                <li>Trading strategies and preferences</li>
                <li>Communication data and feedback</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">1.2 Automatically Collected Information</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                When you access our platform, we may automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">1.3 Blockchain Data</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                As a platform operating with blockchain technology, certain transaction data and wallet interactions
                are publicly available on the blockchain and cannot be modified or deleted by us.
              </p>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">2. How We Use Your Information</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>To provide, operate, and maintain our platform</li>
              <li>To improve, personalize, and expand our services</li>
              <li>To communicate with you about updates, security alerts, and support</li>
              <li>To process your transactions and manage your account</li>
              <li>To analyze usage patterns and optimize user experience</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
              <li>To comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">3. Information Sharing and Disclosure</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We do not sell, trade, or rent your personal information to third parties. We may share your information
              in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly consent to sharing your information</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">4. Data Security</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We implement appropriate technical and organizational security measures to protect your personal information.
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive
              to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">5. Your Privacy Rights</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to processing of your personal data</li>
              <li><strong>Withdrawal:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-base leading-relaxed text-muted-foreground mt-3">
              To exercise these rights, please contact us at privacy@nofa.com
            </p>
          </section>

          {/* Cookies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">6. Cookies and Tracking Technologies</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We use cookies and similar tracking technologies to track activity on our platform and store certain information.
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However,
              if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">7. Third-Party Links</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Our platform may contain links to third-party websites or services that are not operated by us.
              We have no control over and assume no responsibility for the content, privacy policies, or practices
              of any third-party sites or services.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">8. Children's Privacy</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal
              information from children. If you are a parent or guardian and believe your child has provided us with
              personal information, please contact us to have it removed.
            </p>
          </section>

          {/* International Data Transfers */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">9. International Data Transfers</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Your information may be transferred to and maintained on computers located outside of your state, province,
              country, or other governmental jurisdiction where data protection laws may differ. By using our platform,
              you consent to such transfers.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">10. Changes to This Privacy Policy</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy
              Policy periodically for any changes.
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">11. Contact Us</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="space-y-2 text-muted-foreground ml-4">
              <p>Email: privacy@nofa.com</p>
              <p>Address: NOFA Platform, 123 Crypto Street, Web3 City, BC 12345</p>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground text-center">
              © 2026 NOFA. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
