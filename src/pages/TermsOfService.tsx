
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Talkigen
              </span>
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: June 17, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <div className="text-gray-700 space-y-4">
              <p>By accessing and using Talkigen's services, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <div className="text-gray-700 space-y-4">
              <p>Talkigen provides AI-powered chatbot creation and management services. Our platform allows users to create, customize, and deploy intelligent chatbots for customer service and engagement.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <div className="text-gray-700 space-y-2">
              <p>• You must provide accurate and complete registration information</p>
              <p>• You are responsible for maintaining the security of your account</p>
              <p>• You must notify us immediately of any unauthorized use</p>
              <p>• One person or legal entity may maintain only one account</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <div className="text-gray-700 space-y-2">
              <p>You agree not to use our service to:</p>
              <p>• Violate any laws or regulations</p>
              <p>• Transmit harmful, offensive, or illegal content</p>
              <p>• Interfere with or disrupt our services</p>
              <p>• Attempt to gain unauthorized access to our systems</p>
              <p>• Use our service for spam or phishing activities</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscription and Billing</h2>
            <div className="text-gray-700 space-y-4">
              <h3 className="text-lg font-semibold">Payment Terms</h3>
              <p>• Subscriptions are billed monthly or annually in advance</p>
              <p>• All fees are non-refundable except as required by law</p>
              <p>• We may change pricing with 30 days' notice</p>
              
              <h3 className="text-lg font-semibold">Cancellation</h3>
              <p>• You may cancel your subscription at any time</p>
              <p>• Cancellation takes effect at the end of the current billing period</p>
              <p>• We may suspend or terminate accounts for non-payment</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Content and Data</h2>
            <div className="text-gray-700 space-y-4">
              <h3 className="text-lg font-semibold">Your Content</h3>
              <p>• You retain ownership of content you upload to our service</p>
              <p>• You grant us license to use your content to provide our services</p>
              <p>• You are responsible for ensuring you have rights to uploaded content</p>
              
              <h3 className="text-lg font-semibold">Our Content</h3>
              <p>• Our platform, software, and documentation are our intellectual property</p>
              <p>• You may not copy, modify, or distribute our content</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
            <div className="text-gray-700 space-y-4">
              <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Availability</h2>
            <div className="text-gray-700 space-y-4">
              <p>• We strive for 99.9% uptime but cannot guarantee uninterrupted service</p>
              <p>• We may perform maintenance that temporarily affects availability</p>
              <p>• We are not liable for third-party service disruptions</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <div className="text-gray-700 space-y-4">
              <p>To the maximum extent permitted by law, Talkigen shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
            <div className="text-gray-700 space-y-4">
              <p>• Either party may terminate this agreement at any time</p>
              <p>• We may terminate accounts that violate these terms</p>
              <p>• Upon termination, your access to the service will cease</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
            <div className="text-gray-700 space-y-4">
              <p>We reserve the right to modify these terms at any time. We will notify users of material changes via email or through our service.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
            <div className="text-gray-700 space-y-4">
              <p>For questions about these terms, please contact us:</p>
              <p>Email: legal@talkigen.com</p>
              <p>Address: 123 AI Street, Tech Valley, CA 94000</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
