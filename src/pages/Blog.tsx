import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Calendar, Clock, User, ArrowRight } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

const Blog = () => {
  const articles = [
    {
      id: 1,
      title: "The Ultimate Guide to AI Chatbots for Customer Service in 2025",
      excerpt: "Discover how AI chatbots are revolutionizing customer service. Learn about the latest trends, implementation strategies, and best practices for deploying intelligent chatbots that enhance customer experience and reduce support costs.",
      author: "Sarah Chen",
      date: "June 15, 2025",
      readTime: "8 min read",
      category: "Customer Service",
      image: "/placeholder.svg",
      featured: true
    },
    {
      id: 2,
      title: "How to Train Your Chatbot: Best Practices for Knowledge Base Optimization",
      excerpt: "Learn the secrets to creating effective knowledge bases that power intelligent chatbot responses. From content structuring to data preprocessing, discover proven techniques to improve your chatbot's accuracy and helpfulness.",
      author: "Alex Johnson",
      date: "June 12, 2025",
      readTime: "6 min read",
      category: "AI Training",
      image: "/placeholder.svg",
      featured: false
    },
    {
      id: 3,
      title: "ROI of AI Chatbots: Measuring Success and Business Impact",
      excerpt: "Understand how to measure the return on investment of your chatbot implementation. Explore key metrics, tracking methods, and real-world case studies showing significant cost savings and efficiency improvements.",
      author: "Michael Rodriguez",
      date: "June 10, 2025",
      readTime: "7 min read",
      category: "Business Strategy",
      image: "/placeholder.svg",
      featured: false
    }
  ];

  const categories = ["All", "Customer Service", "AI Training", "Business Strategy", "Implementation", "Case Studies"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <Header showNavigation={false} />

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Talkigen Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest insights, trends, and best practices in AI chatbots, 
            customer service automation, and conversational AI technology.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <Badge 
              key={category} 
              variant={category === "All" ? "default" : "outline"}
              className="cursor-pointer hover:bg-blue-600 hover:text-white"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Featured Article */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">Featured Article</Badge>
          </div>
          <Card className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <div className="h-64 md:h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <Bot className="h-16 w-16 text-white" />
                </div>
              </div>
              <div className="md:w-1/2 p-8">
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant="secondary">{articles[0].category}</Badge>
                  <span className="text-sm text-gray-500">•</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{articles[0].date}</span>
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{articles[0].readTime}</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{articles[0].title}</h2>
                <p className="text-gray-600 mb-6">{articles[0].excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{articles[0].author}</span>
                  </div>
                  <Button>
                    Read More
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Article Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {articles.slice(1).map((article) => (
            <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <Bot className="h-12 w-12 text-white" />
              </div>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline">{article.category}</Badge>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{article.readTime}</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{article.title}</CardTitle>
                <CardDescription className="text-sm">{article.excerpt}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-3 w-3" />
                    <span>{article.author}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Read
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter and get the latest insights about AI chatbots 
            and customer service automation delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button>Subscribe</Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;