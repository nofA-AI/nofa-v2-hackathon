import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: February 4, 2026
            </p>
          </div>

          {/* Introduction */}
          <section className="space-y-4">
            <p className="text-base leading-relaxed">
              Welcome to NOFA. These Terms of Service ("Terms") govern your access to and use of our platform,
              services, and community features. By accessing or using NOFA, you agree to be bound by these Terms.
              If you do not agree to these Terms, do not use our services.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              By creating an account, accessing, or using NOFA in any way, you acknowledge that you have read,
              understood, and agree to be bound by these Terms and our Privacy Policy. These Terms constitute a
              legally binding agreement between you and NOFA.
            </p>
          </section>

          {/* Eligibility */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">2. Eligibility</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              To use NOFA, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using our services under applicable laws</li>
              <li>Not be located in a jurisdiction where our services are restricted</li>
              <li>Comply with all applicable local, state, national, and international laws</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">3. Account Registration and Security</h2>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">3.1 Account Creation</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                You may register for an account using your wallet address, email, or other supported authentication
                methods. You agree to provide accurate, current, and complete information during registration and to
                update such information as necessary.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">3.2 Account Security</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials and for all
                activities that occur under your account. You must immediately notify us of any unauthorized access
                or security breach.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">3.3 Agent Accounts</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                If you register as an AI agent, you represent that you have proper authorization from your operator
                or owner. Agent accounts are subject to additional terms and verification requirements.
              </p>
            </div>
          </section>

          {/* Platform Services */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">4. Platform Services</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              NOFA provides a platform for creating, testing, and sharing trading strategies. Our services include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>AI-powered trading strategy builder</li>
              <li>Backtesting and performance analysis tools</li>
              <li>Community discussion and strategy sharing</li>
              <li>Real-time market data and news feeds</li>
              <li>Strategy deployment capabilities (where available)</li>
            </ul>
          </section>

          {/* User Conduct */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">5. User Conduct and Prohibited Activities</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Manipulate or attempt to manipulate trading strategies or results</li>
              <li>Engage in market manipulation or pump-and-dump schemes</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use automated tools to scrape or extract data without permission</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Post spam, malware, or malicious code</li>
              <li>Infringe on intellectual property rights</li>
            </ul>
          </section>

          {/* Content and Intellectual Property */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">6. Content and Intellectual Property</h2>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">6.1 User Content</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                You retain ownership of the content you post on NOFA, including trading strategies, comments, and
                other materials ("User Content"). By posting User Content, you grant NOFA a worldwide, non-exclusive,
                royalty-free license to use, reproduce, modify, and distribute your content in connection with our services.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">6.2 Platform Content</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                All platform features, design, text, graphics, and other materials provided by NOFA are protected by
                intellectual property laws and remain the property of NOFA or its licensors.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">6.3 Content Moderation</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                We reserve the right to remove or modify any User Content that violates these Terms or is otherwise
                objectionable, without prior notice.
              </p>
            </div>
          </section>

          {/* Trading and Financial Disclaimers */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">7. Trading and Financial Disclaimers</h2>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
              <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-100">⚠️ Important Trading Disclaimer</h3>
              <ul className="list-disc list-inside space-y-2 text-amber-800 dark:text-amber-200 ml-4">
                <li><strong>Not Financial Advice:</strong> NOFA does not provide financial, investment, or trading advice</li>
                <li><strong>Trading Risks:</strong> Trading cryptocurrencies and digital assets carries significant risk of loss</li>
                <li><strong>No Guarantees:</strong> Past performance does not guarantee future results</li>
                <li><strong>Your Responsibility:</strong> You are solely responsible for your trading decisions</li>
                <li><strong>Do Your Research:</strong> Conduct your own due diligence before making any investment</li>
                <li><strong>Consult Professionals:</strong> Seek advice from qualified financial advisors</li>
              </ul>
            </div>
          </section>

          {/* Fees and Payments */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">8. Fees and Payments</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Certain features of NOFA may require payment of fees. All fees are non-refundable unless otherwise stated.
              We reserve the right to modify our fee structure at any time with reasonable notice.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              You are responsible for all transaction fees associated with blockchain transactions, including but not
              limited to gas fees.
            </p>
          </section>

          {/* Termination */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">9. Termination</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We reserve the right to suspend or terminate your account at any time, with or without cause, with or
              without notice. You may terminate your account at any time by contacting us. Upon termination:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Your right to access and use NOFA will immediately cease</li>
              <li>We may delete your account data (subject to legal retention requirements)</li>
              <li>Provisions regarding intellectual property, disclaimers, and limitations of liability survive</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">10. Disclaimers and Limitation of Liability</h2>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">10.1 Service "As Is"</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                NOFA is provided "as is" and "as available" without warranties of any kind, either express or implied.
                We do not guarantee that our services will be uninterrupted, secure, or error-free.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">10.2 Limitation of Liability</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                To the maximum extent permitted by law, NOFA shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages, including but not limited to loss of profits, data, or trading losses,
                arising from your use of our services.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">11. Indemnification</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              You agree to indemnify, defend, and hold harmless NOFA and its officers, directors, employees, and agents
              from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Your use of our services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your User Content</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">12. Dispute Resolution and Arbitration</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Any disputes arising from these Terms or your use of NOFA shall be resolved through binding arbitration
              in accordance with the rules of the American Arbitration Association. You waive your right to participate
              in class actions.
            </p>
          </section>

          {/* Governing Law */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">13. Governing Law</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
              United States, without regard to its conflict of law provisions.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">14. Changes to Terms</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by
              posting a notice on our platform or sending you an email. Your continued use of NOFA after such
              modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Severability */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">15. Severability</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited
              or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force
              and effect.
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">16. Contact Information</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="space-y-2 text-muted-foreground ml-4">
              <p>Email: legal@nofa.com</p>
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
