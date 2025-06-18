import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Helmet } from "react-helmet-async";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you within 24 hours.",
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <Helmet>
        <title>Contact Talkigen - Get Support for Your AI Chatbot Platform</title>
        <meta name="description" content="Contact Talkigen support team for help with your AI chatbot platform. Get in touch via email or our contact form. We're here to help you succeed." />
        <meta name="keywords" content="contact talkigen, chatbot support, AI chatbot help, customer service, technical support, chatbot platform assistance" />
        <link rel="canonical" href="https://talkigen.com/contact" />
        
        <meta property="og:title" content="Contact Talkigen - Get Support for Your AI Chatbot Platform" />
        <meta property="og:description" content="Contact Talkigen support team for help with your AI chatbot platform. Get in touch via email or our contact form. We're here to help you succeed." />
        <meta property="og:url" content="https://talkigen.com/contact" />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:title" content="Contact Talkigen - Get Support for Your AI Chatbot Platform" />
        <meta name="twitter:description" content="Contact Talkigen support team for help with your AI chatbot platform. Get in touch via email or our contact form. We're here to help you succeed." />
        
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "mainEntity": {
            "@type": "Organization",
            "name": "Talkigen",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "support@talkigen.com",
              "availableLanguage": "English"
            },
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "275 New North Road",
              "addressLocality": "London",
              "addressRegion": "England",
              "postalCode": "N1 7AA",
              "addressCountry": "GB"
            }
          }
        })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Header */}
        <Header showNavigation={false} />

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about Talkigen? We'd love to hear from you. 
              Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Reach out to us through any of these channels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600">support@talkigen.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-gray-600">
                        275 New North Road,<br />
                        London, United Kingdom, N1 7AA
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM GMT</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">How quickly will I get a response?</h4>
                    <p className="text-sm text-gray-600">We typically respond within 24 hours during business days.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Do you offer phone support?</h4>
                    <p className="text-sm text-gray-600">Currently, we provide support via email and our contact form. We're working on expanding our support channels.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Can I schedule a demo?</h4>
                    <p className="text-sm text-gray-600">Absolutely! Mention "demo request" in your message and we'll set one up.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Contact;