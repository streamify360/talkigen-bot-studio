import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Zap, ArrowRight, Heart, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

const About = () => {
  const values = [
    {
      icon: Users,
      title: "Customer-Centric",
      description: "We build tools that solve real problems for real businesses"
    },
    {
      icon: Target,
      title: "Innovation",
      description: "Pushing the boundaries of what's possible with AI technology"
    },
    {
      icon: Zap,
      title: "Simplicity",
      description: "Making complex AI technology accessible to everyone"
    },
    {
      icon: Heart,
      title: "Reliability",
      description: "Building systems you can depend on 24/7"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <Header showNavigation={false} />

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Talkigen
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're on a mission to democratize AI-powered customer service. 
            Making it easy for businesses of all sizes to create intelligent chatbots 
            that understand and engage with their customers.
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
          <div className="prose prose-lg mx-auto text-gray-600">
            <p>
              Founded in 2024, Talkigen emerged from a simple observation: while AI technology 
              was advancing rapidly, most businesses struggled to implement effective chatbot 
              solutions. Complex setup processes, expensive development costs, and technical 
              barriers prevented many companies from leveraging the power of conversational AI.
            </p>
            <p>
              Our founder, having worked with cutting-edge AI technologies, decided to change this. 
              He envisioned a platform where anyone could create sophisticated AI chatbots 
              without writing a single line of code. A platform that could understand business 
              context, integrate seamlessly with existing workflows, and scale with growing needs.
            </p>
            <p>
              Today, Talkigen serves thousands of businesses worldwide, from startups to 
              Fortune 500 companies, helping them provide better customer service, increase 
              engagement, and grow their businesses through intelligent automation.
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <value.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Founder Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Founder</h2>
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">YH</span>
                </div>
                <h3 className="font-semibold text-2xl mb-2">Yahya Hanif</h3>
                <p className="text-blue-600 font-medium mb-4">CEO & Founder</p>
                <p className="text-gray-600 text-base mb-6 leading-relaxed">
                  Yahya is a visionary entrepreneur passionate about making AI technology accessible to businesses of all sizes. 
                  With a deep understanding of both technology and business needs, he founded Talkigen to bridge the gap between 
                  complex AI capabilities and practical business solutions. His mission is to empower every business to leverage 
                  the power of conversational AI without the technical complexity.
                </p>
                <a 
                  href="https://www.linkedin.com/in/yahyahanif/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>Connect on LinkedIn</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Vision Section */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="pt-8 pb-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                To create a world where every business, regardless of size or technical expertise, 
                can harness the power of AI to provide exceptional customer experiences and drive growth.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of businesses already using Talkigen to transform 
            their customer service with AI-powered chatbots.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/register">
                Start Free Trial
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;