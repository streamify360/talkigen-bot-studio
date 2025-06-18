import React from 'react';
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Helmet } from "react-helmet-async";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Talkigen AI Chatbot Platform</title>
        <meta name="description" content="Read Talkigen's privacy policy to understand how we collect, use, and protect your personal information when using our AI chatbot platform." />
        <meta name="keywords" content="talkigen privacy policy, data protection, privacy rights, personal information, GDPR compliance, data security" />
        <link rel="canonical" href="https://talkigen.com/privacy" />
        
        <meta property="og:title" content="Privacy Policy - Talkigen AI Chatbot Platform" />
        <meta property="og:description" content="Read Talkigen's privacy policy to understand how we collect, use, and protect your personal information when using our AI chatbot platform." />
        <meta property="og:url" content="https://talkigen.com/privacy" />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:title" content="Privacy Policy - Talkigen AI Chatbot Platform" />
        <meta name="twitter:description" content="Read Talkigen's privacy policy to understand how we collect, use, and protect your personal information when using our AI chatbot platform." />
        
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Header showNavigation={false} />

        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: June 17, 2025</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold">Account Information</h3>
                <p>When you create an account, we collect your name, email address, and company information.</p>
                
                <h3 className="text-lg font-semibold">Usage Data</h3>
                <p>We collect information about how you use our service, including chatbot interactions, knowledge base uploads, and feature usage.</p>
                
                <h3 className="text-lg font-semibold">Technical Data</h3>
                <p>We automatically collect certain technical information, including IP addresses, browser type, device information, and usage analytics.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <div className="text-gray-700 space-y-2">
                <p>• To provide and maintain our chatbot service</p>
                <p>• To process your transactions and manage your account</p>
                <p>• To improve our AI models and service quality</p>
                <p>• To communicate with you about service updates and support</p>
                <p>• To ensure security and prevent fraud</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Sharing and Disclosure</h2>
              <div className="text-gray-700 space-y-4">
                <p>We do not sell, trade, or rent your personal information. We may share your information only in these circumstances:</p>
                <p>• With your explicit consent</p>
                <p>• With service providers who assist in our operations (under strict confidentiality agreements)</p>
                <p>• When required by law or to protect our rights and safety</p>
                <p>• In connection with a business transfer or acquisition</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
              <div className="text-gray-700 space-y-4">
                <p>We implement industry-standard security measures to protect your data:</p>
                <p>• Encryption in transit and at rest</p>
                <p>• Regular security audits and updates</p>
                <p>• Access controls and authentication</p>
                <p>• Secure data centers with physical protection</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
              <div className="text-gray-700 space-y-2">
                <p>You have the right to:</p>
                <p>• Access your personal data</p>
                <p>• Correct inaccurate information</p>
                <p>• Delete your account and data</p>
                <p>• Export your data</p>
                <p>• Opt out of marketing communications</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking</h2>
              <div className="text-gray-700 space-y-4">
                <p>We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie preferences through your browser settings.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. International Data Transfers</h2>
              <div className="text-gray-700 space-y-4">
                <p>Your data may be transferred and processed in countries other than your residence. We ensure appropriate safeguards are in place for such transfers.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
              <div className="text-gray-700 space-y-4">
                <p>We may update this privacy policy from time to time. We will notify you of any material changes by email or through our service.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
              <div className="text-gray-700 space-y-4">
                <p>If you have any questions about this privacy policy, please contact us:</p>
                <p>Email: privacy@talkigen.com</p>
                <p>Address: 123 AI Street, Tech Valley, CA 94000</p>
              </div>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default PrivacyPolicy;