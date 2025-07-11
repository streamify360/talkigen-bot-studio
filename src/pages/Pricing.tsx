import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Helmet } from "react-helmet-async";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "$9.99",
      period: "/month",
      description: "Perfect for small businesses getting started",
      features: [
        "3 Chatbots",
        "2 Knowledge Bases",
        "1,000 messages/month",
        "Basic Analytics",
        "Email Support",
        "100MB Storage"
      ],
      popular: false,
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      price: "$19.99",
      period: "/month",
      description: "Ideal for growing businesses",
      features: [
        "10 Chatbots",
        "5 Knowledge Bases",
        "10,000 messages/month",
        "Advanced Analytics",
        "Priority Support",
        "1GB Storage",
        "Custom Branding"
      ],
      popular: true,
      cta: "Start Free Trial"
    },
    {
      name: "Enterprise",
      price: "$49.99",
      period: "/month",
      description: "For large organizations",
      features: [
        "Unlimited Chatbots",
        "Unlimited Knowledge Bases",
        "100,000 messages/month",
        "Full Analytics Suite",
        "24/7 Support",
        "10GB Storage",
        "White Label",
        "API Access",
        "Custom Integrations"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Talkigen Pricing - AI Chatbot Plans Starting at $9.99/month</title>
        <meta name="description" content="Choose the perfect AI chatbot plan for your business. Plans start at $9.99/month with 14-day free trial. Compare features and pricing for Starter, Professional, and Enterprise plans." />
        <meta name="keywords" content="talkigen pricing, chatbot pricing, AI chatbot cost, chatbot plans, chatbot subscription, affordable chatbot platform" />
        <link rel="canonical" href="https://talkigen.com/pricing" />
        
        <meta property="og:title" content="Talkigen Pricing - AI Chatbot Plans Starting at $9.99/month" />
        <meta property="og:description" content="Choose the perfect AI chatbot plan for your business. Plans start at $9.99/month with 14-day free trial. Compare features and pricing for Starter, Professional, and Enterprise plans." />
        <meta property="og:url" content="https://talkigen.com/pricing" />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:title" content="Talkigen Pricing - AI Chatbot Plans Starting at $9.99/month" />
        <meta name="twitter:description" content="Choose the perfect AI chatbot plan for your business. Plans start at $9.99/month with 14-day free trial. Compare features and pricing for Starter, Professional, and Enterprise plans." />
        
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Talkigen AI Chatbot Platform",
          "description": "AI-powered chatbot platform with multiple pricing tiers",
          "offers": plans.map(plan => ({
            "@type": "Offer",
            "name": plan.name,
            "price": plan.price.replace('$', ''),
            "priceCurrency": "USD",
            "priceValidUntil": "2025-12-31",
            "availability": "https://schema.org/InStock",
            "url": "https://talkigen.com/register"
          }))
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
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with our free trial and scale as you grow. All plans include our core features 
              with different limits to match your business needs.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={plan.name}
                className={`relative ${plan.popular ? 'border-2 border-blue-500 scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={`${plan.name}-feature-${featureIndex}`} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''}`}
                    asChild
                  >
                    <Link to="/register">
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-2">Can I change plans anytime?</h3>
                <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
                <p className="text-gray-600">Yes, all plans come with a 14-day free trial. No credit card required to start.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">What happens if I exceed my limits?</h3>
                <p className="text-gray-600">Your chatbots will continue to work, but you'll need to upgrade to create new ones or add more content.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Do you offer refunds?</h3>
                <p className="text-gray-600">Yes, we offer a 30-day money-back guarantee for all paid plans.</p>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Pricing;