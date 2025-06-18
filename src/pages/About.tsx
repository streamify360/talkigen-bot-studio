import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Users, Target, Zap, ArrowRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/ui/footer";

const About = () => {
  const team = [
    {
      name: "Alex Johnson",
      role: "CEO & Founder",
      bio: "Former AI researcher at Google with 10+ years in conversational AI",
      image: "/placeholder.svg"
    },
    {
      name: "Sarah Chen",
      role: "CTO",
      bio: "Ex-Microsoft engineer specializing in natural language processing",
      image: "/placeholder.svg"
    },
    {
      name: "Michael Rodriguez",
      role: "Head of Product",
      bio: "Product leader with experience at Slack and Intercom",
      image: "/placeholder.svg"
    }
  ];

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
              Our founders, having worked at leading tech companies, decided to change this. 
              They envisioned a platform where anyone could create sophisticated AI chatbots 
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

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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