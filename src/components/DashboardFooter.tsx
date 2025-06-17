
import { Bot, Github, Twitter, Linkedin, Mail, ExternalLink, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Talkigen
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Build intelligent chatbots that understand your business and engage your customers 24/7.
            </p>
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Features
                </button>
              </li>
              <li>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Integrations
                </button>
              </li>
              <li>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  API Documentation
                </button>
              </li>
              <li>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Changelog
                </button>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Help Center
                </button>
              </li>
              <li>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Contact Support
                </button>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm inline-flex items-center"
                >
                  Community Forum
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Status Page
                </button>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Blog
                </button>
              </li>
              <li>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Careers
                </button>
              </li>
              <li>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Press Kit
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-gray-600 text-sm">
                © {currentYear} Talkigen. All rights reserved.
              </p>
              <div className="flex items-center space-x-4">
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Privacy Policy
                </button>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Terms of Service
                </button>
                <button 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                  onClick={() => {}}
                >
                  Cookie Policy
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 text-gray-600 text-sm">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>for businesses worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
