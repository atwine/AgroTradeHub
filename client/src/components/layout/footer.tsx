import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <Link href="/">
              <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate font-nunito cursor-pointer">
                AgriBridge
              </h2>
            </Link>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-200">
                <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-200" />
                123 Agri Lane, Digital District
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-200">
                <Mail className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-200" />
                contact@agribridge.com
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-200">
                <Phone className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-200" />
                +91 9876543210
              </div>
            </div>
          </div>
          <div className="mt-5 flex lg:mt-0 lg:ml-4">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                  Platform
                </h3>
                <ul className="mt-4 space-y-2">
                  <li><a href="#" className="text-base text-gray-300 hover:text-white">About Us</a></li>
                  <li><a href="#" className="text-base text-gray-300 hover:text-white">How It Works</a></li>
                  <li><a href="#" className="text-base text-gray-300 hover:text-white">Features</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                  Resources
                </h3>
                <ul className="mt-4 space-y-2">
                  <li><a href="#" className="text-base text-gray-300 hover:text-white">Blog</a></li>
                  <li><a href="#" className="text-base text-gray-300 hover:text-white">Market Prices</a></li>
                  <li><a href="#" className="text-base text-gray-300 hover:text-white">FAQs</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                  Legal
                </h3>
                <ul className="mt-4 space-y-2">
                  <li><a href="#" className="text-base text-gray-300 hover:text-white">Privacy Policy</a></li>
                  <li><a href="#" className="text-base text-gray-300 hover:text-white">Terms of Service</a></li>
                  <li><a href="#" className="text-base text-gray-300 hover:text-white">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-opacity-20 border-white pt-6 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <a href="#" className="text-gray-300 hover:text-white">
              <span className="sr-only">Facebook</span>
              <Facebook className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              <span className="sr-only">Instagram</span>
              <Instagram className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              <span className="sr-only">Twitter</span>
              <Twitter className="h-6 w-6" />
            </a>
          </div>
          <p className="mt-8 text-base text-gray-300 md:mt-0 md:order-1">
            &copy; {new Date().getFullYear()} AgriBridge, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
