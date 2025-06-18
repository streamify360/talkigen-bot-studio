import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, BookOpen, Zap, Settings, Database, MessageSquare, Code, Play } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/ui/footer";

const Documentation = () => {
  const sections = [
    {
      title: "Getting Started",
      icon: Play,
      items: [
        { title: "Quick Start Guide", description: "Set up your first chatbot in 5 minutes" },
        { title: "Account Setup", description: "Create and configure your Talkigen account" },
        { title: "Understanding Plans", description: "Choose the right plan for your needs" }
      ]
    },
    {
      title: "Creating Chatbots",
      icon: Bot,
      items: [
        { title: "Bot Creation Wizard", description: "Step-by-step bot creation process" },
        { title: "Bot Configuration", description: "Customize bot behavior and responses" },
        { title: "Platform Integration", description: "Deploy bots to websites, Facebook, Telegram" }
      ]
    },
    {
      title: "Knowledge Management",
      icon: Database,
      items: [
        { title: "Knowledge Bases", description: "Upload and organize your content" },
        { title: "File Formats", description: "Supported file types and best practices" },
        { title: "Content Optimization", description: "Tips for better AI responses" }
      ]
    },
    {
      title: "Advanced Features",
      icon: Settings,
      items: [
        { title: "Custom Integrations", description: "API endpoints and webhooks" },
        { title: "Analytics & Reporting", description: "Track bot performance and user engagement" },
        { title: "White Label Options", description: "Custom branding for Enterprise users" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/">Home</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">Documentation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to Know
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive guides and documentation to help you get the most out of Talkigen. 
            From basic setup to advanced integrations.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Zap className="h-6 w-6" />
                <CardTitle className="text-white">Quick Start</CardTitle>
              </div>
              <CardDescription className="text-blue-100">
                Get your first chatbot up and running in just a few steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                    <span className="font-medium">Sign Up</span>
                  </div>
                  <p className="text-sm text-blue-100">Create your Talkigen account and choose a plan</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                    <span className="font-medium">Create Bot</span>
                  </div>
                  <p className="text-sm text-blue-100">Use our wizard to configure your chatbot</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                    <span className="font-medium">Deploy</span>
                  </div>
                  <p className="text-sm text-blue-100">Integrate with your website or platform</p>
                </div>
              </div>
              <Button className="bg-white text-blue-600 hover:bg-gray-100" asChild>
                <Link to="/register">Start Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <section.icon className="h-6 w-6 text-blue-600" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border-l-2 border-blue-100 pl-4">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Documentation */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Code className="h-6 w-6 text-blue-600" />
                  <CardTitle>API Documentation</CardTitle>
                </div>
                <Badge variant="secondary">Enterprise</Badge>
              </div>
              <CardDescription>
                Integrate Talkigen into your applications with our RESTful API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Endpoints Available</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Bot Management API</li>
                    <li>• Knowledge Base API</li>
                    <li>• Chat Integration API</li>
                    <li>• Analytics API</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• RESTful design</li>
                    <li>• JSON responses</li>
                    <li>• Authentication via API keys</li>
                    <li>• Rate limiting and quotas</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">Sample API call:</p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono">
                  curl -X POST https://api.talkigen.com/v1/bots<br/>
                  -H "Authorization: Bearer YOUR_API_KEY"<br/>
                  -H "Content-Type: application/json"<br/>
                  -d '{"{"}name": "My Bot", "description": "Customer support bot"{"}"}'
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you 
            get the most out of Talkigen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/register">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Documentation;