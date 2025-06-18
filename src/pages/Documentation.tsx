import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Zap, Settings, Database, MessageSquare, Play, Globe, Facebook, Send, Upload, Bot, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Helmet } from "react-helmet-async";

const Documentation = () => {
  const sections = [
    {
      title: "Getting Started",
      icon: Play,
      items: [
        { 
          title: "Quick Start Guide", 
          description: "Set up your first chatbot in 5 minutes",
          content: "Learn how to create your account, set up your first knowledge base, and deploy your chatbot across multiple platforms."
        },
        { 
          title: "Account Setup", 
          description: "Create and configure your Talkigen account",
          content: "Step-by-step guide to creating your account, choosing the right plan, and configuring your profile settings."
        },
        { 
          title: "Understanding Plans", 
          description: "Choose the right plan for your needs",
          content: "Compare features across Starter, Professional, and Enterprise plans to find the perfect fit for your business."
        }
      ]
    },
    {
      title: "Knowledge Base Management",
      icon: Database,
      items: [
        { 
          title: "Creating Knowledge Bases", 
          description: "Upload and organize your content effectively",
          content: "Learn how to create knowledge bases, upload documents, and organize content for optimal chatbot performance."
        },
        { 
          title: "Supported File Formats", 
          description: "PDF, DOC, DOCX, and TXT files up to 10MB",
          content: "Understand which file types work best and how to prepare your documents for maximum AI comprehension."
        },
        { 
          title: "Content Optimization", 
          description: "Best practices for better AI responses",
          content: "Tips for structuring content, writing clear FAQs, and organizing information to improve chatbot accuracy."
        }
      ]
    },
    {
      title: "Creating Chatbots",
      icon: MessageSquare,
      items: [
        { 
          title: "Bot Creation Wizard", 
          description: "Step-by-step bot creation process",
          content: "Use our intuitive wizard to configure your bot's personality, appearance, and behavior settings."
        },
        { 
          title: "Bot Configuration", 
          description: "Customize bot behavior and responses",
          content: "Set up system messages, welcome messages, fallback responses, and customize your bot's personality."
        },
        { 
          title: "Testing Your Bot", 
          description: "Preview and test before deployment",
          content: "Use our built-in testing tools to ensure your chatbot responds accurately before going live."
        }
      ]
    },
    {
      title: "Platform Integration",
      icon: Settings,
      items: [
        { 
          title: "Website Integration", 
          description: "Add chat widgets to your website",
          content: "Copy and paste our simple embed code to add a chat widget to any website or web application."
        },
        { 
          title: "Facebook Messenger", 
          description: "Connect to your Facebook page",
          content: "Set up webhooks and configure your Facebook page to enable automated responses through Messenger."
        },
        { 
          title: "Telegram Integration", 
          description: "Create and deploy Telegram bots",
          content: "Use BotFather to create your Telegram bot and connect it to your Talkigen knowledge base."
        }
      ]
    }
  ];

  const quickStartSteps = [
    {
      step: 1,
      title: "Create Your Account",
      description: "Sign up for Talkigen and choose your plan",
      icon: Users
    },
    {
      step: 2,
      title: "Upload Knowledge Base",
      description: "Add your documents and content",
      icon: Upload
    },
    {
      step: 3,
      title: "Configure Your Bot",
      description: "Customize personality and responses",
      icon: Bot
    },
    {
      step: 4,
      title: "Deploy & Monitor",
      description: "Launch your bot and track performance",
      icon: BarChart3
    }
  ];

  const integrationGuides = [
    {
      platform: "Website",
      icon: Globe,
      difficulty: "Easy",
      time: "5 minutes",
      description: "Add a chat widget to any website with a simple embed code",
      steps: [
        "Copy the widget embed code from your dashboard",
        "Paste it before the closing </body> tag on your website",
        "Customize the appearance and position if needed",
        "Test the widget to ensure it's working properly"
      ]
    },
    {
      platform: "Facebook Messenger",
      icon: Facebook,
      difficulty: "Medium",
      time: "15 minutes",
      description: "Connect your Facebook page to enable automated responses",
      steps: [
        "Create a Facebook App in the Meta Developer Console",
        "Add the Messenger product to your app",
        "Generate a Page Access Token for your Facebook page",
        "Configure the webhook URL in your Facebook app settings",
        "Test the integration by sending a message to your page"
      ]
    },
    {
      platform: "Telegram",
      icon: Send,
      difficulty: "Medium",
      time: "10 minutes",
      description: "Create a Telegram bot using BotFather",
      steps: [
        "Message @BotFather on Telegram",
        "Use the /newbot command to create a new bot",
        "Choose a name and username for your bot",
        "Copy the bot token provided by BotFather",
        "Add the token to your Talkigen dashboard"
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Talkigen Documentation - Complete Guide to AI Chatbot Platform</title>
        <meta name="description" content="Comprehensive documentation for Talkigen AI chatbot platform. Learn how to create, configure, and deploy intelligent chatbots with step-by-step guides and tutorials." />
        <meta name="keywords" content="talkigen documentation, chatbot tutorial, AI chatbot guide, chatbot setup, platform integration, knowledge base setup, bot configuration" />
        <link rel="canonical" href="https://talkigen.com/docs" />
        
        <meta property="og:title" content="Talkigen Documentation - Complete Guide to AI Chatbot Platform" />
        <meta property="og:description" content="Comprehensive documentation for Talkigen AI chatbot platform. Learn how to create, configure, and deploy intelligent chatbots with step-by-step guides and tutorials." />
        <meta property="og:url" content="https://talkigen.com/docs" />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:title" content="Talkigen Documentation - Complete Guide to AI Chatbot Platform" />
        <meta name="twitter:description" content="Comprehensive documentation for Talkigen AI chatbot platform. Learn how to create, configure, and deploy intelligent chatbots with step-by-step guides and tutorials." />
        
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "headline": "Talkigen Documentation - Complete Guide to AI Chatbot Platform",
          "description": "Comprehensive documentation for Talkigen AI chatbot platform",
          "author": {
            "@type": "Organization",
            "name": "Talkigen"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Talkigen",
            "url": "https://talkigen.com"
          },
          "dateModified": "2025-01-17",
          "mainEntity": {
            "@type": "SoftwareApplication",
            "name": "Talkigen",
            "applicationCategory": "BusinessApplication"
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
                  <CardTitle className="text-white">Quick Start Guide</CardTitle>
                </div>
                <CardDescription className="text-blue-100">
                  Get your first chatbot up and running in just a few steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-4 gap-4">
                  {quickStartSteps.map((step) => (
                    <div key={step.step} className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          {step.step}
                        </span>
                        <step.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-medium mb-2">{step.title}</h3>
                      <p className="text-sm text-blue-100">{step.description}</p>
                    </div>
                  ))}
                </div>
                <Button className="bg-white text-blue-600 hover:bg-gray-100" asChild>
                  <Link to="/register">Start Now</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Documentation Sections */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Documentation Sections</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {sections.map((section, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <section.icon className="h-6 w-6 text-blue-600" />
                      <CardTitle>{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="border-l-2 border-blue-100 pl-4 hover:border-blue-300 transition-colors">
                          <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <p className="text-xs text-gray-500">{item.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Integration Guides */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Platform Integration Guides</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {integrationGuides.map((guide, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <guide.icon className="h-6 w-6 text-blue-600" />
                        <CardTitle className="text-lg">{guide.platform}</CardTitle>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={guide.difficulty === "Easy" ? "secondary" : "outline"} className="text-xs">
                          {guide.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {guide.time}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm mb-2">Setup Steps:</h4>
                      <ol className="text-sm text-gray-600 space-y-1">
                        {guide.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start space-x-2">
                            <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5 flex-shrink-0">
                              {stepIndex + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-6 w-6 text-blue-600" />
                  <span>Best Practices</span>
                </CardTitle>
                <CardDescription>
                  Tips and recommendations for optimal chatbot performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">Knowledge Base Optimization</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Use clear, concise language in your documents</li>
                      <li>• Structure content with headings and bullet points</li>
                      <li>• Include common questions and variations</li>
                      <li>• Keep documents focused on specific topics</li>
                      <li>• Regular update and maintain your content</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Bot Configuration</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Write clear system messages that define the bot's role</li>
                      <li>• Use friendly, professional welcome messages</li>
                      <li>• Set appropriate fallback responses</li>
                      <li>• Test your bot thoroughly before deployment</li>
                      <li>• Monitor performance and adjust as needed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Troubleshooting */}
          <div className="mb-16">
            <Card>
              <CardHeader>
                <CardTitle>Common Issues & Solutions</CardTitle>
                <CardDescription>
                  Quick fixes for the most common problems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Bot not responding accurately</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      If your bot isn't providing accurate responses, try these solutions:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Review and improve your knowledge base content</li>
                      <li>• Add more specific examples and variations</li>
                      <li>• Check for conflicting information in your documents</li>
                      <li>• Ensure your system message clearly defines the bot's purpose</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Integration not working</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      If your platform integration isn't working:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Verify all tokens and credentials are correct</li>
                      <li>• Check webhook URLs are properly configured</li>
                      <li>• Ensure your bot is active and published</li>
                      <li>• Test with simple messages first</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">File upload issues</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      If you're having trouble uploading files:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Ensure files are under 10MB in size</li>
                      <li>• Use supported formats: PDF, DOC, DOCX, TXT</li>
                      <li>• Check your internet connection</li>
                      <li>• Try uploading files one at a time</li>
                    </ul>
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
    </>
  );
};

export default Documentation;