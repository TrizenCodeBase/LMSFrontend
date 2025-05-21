import { Link } from "react-router-dom";
import { HeartHandshake, Calendar, Image, Users, BookOpen } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-2">
              <img src="/logo_footer.png" alt="Trizen Logo" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              High-quality recorded and live online training for professionals and beginners.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contribute" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4" />
                  <span>Contribute</span>
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Events</span>
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span>Gallery</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <a 
                  href="https://instructor.lms.trizenventures.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-primary flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Become an Instructor</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/careers" className="text-muted-foreground hover:text-primary">Careers</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-primary">Blog</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="text-muted-foreground hover:text-primary">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Trizen. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex space-x-4 mt-4 md:mt-0">
            {/* X (Twitter) */}
            <a href="https://x.com/TrizenVentures" className="text-gray-500 hover:text-primary">
              <span className="sr-only">X</span>
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.18 3H17.3L12 9.1L6.7 3H3.82L10.6 11L3 21H6.02L12 14.37L17.98 21H21L13.4 11L20.18 3Z" />
              </svg>
            </a>
            
            {/* Instagram */}
            <a href="https://www.instagram.com/trizenventures" className="text-gray-500 hover:text-primary" target="_blank" rel="noopener noreferrer">
              <span className="sr-only">Instagram</span>
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.75 2.75a.75.75 0 1 1 0 1.5a.75.75 0 0 1 0-1.5Zm-4.5 1A5.25 5.25 0 1 1 7.25 12A5.25 5.25 0 0 1 12 7.25Zm0 1.5a3.75 3.75 0 1 0 3.75 3.75A3.75 3.75 0 0 0 12 8.75Z" />
              </svg>
            </a>
            
            {/* LinkedIn */}
            <a href="https://www.linkedin.com/company/trizenventures" className="text-gray-500 hover:text-primary" target="_blank" rel="noopener noreferrer">
              <span className="sr-only">LinkedIn</span>
              <svg 
                className="h-6 w-6" 
                fill="currentColor" 
                viewBox="0 0 24 24" 
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            
            {/* GitHub */}
            <a href="https://github.com/trizenventures" className="text-gray-500 hover:text-primary" target="_blank" rel="noopener noreferrer">
              <span className="sr-only">GitHub</span>
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
