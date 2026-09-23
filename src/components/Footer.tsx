import React from 'react';
import { motion } from 'motion/react';
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  MapPin, 
  Phone, 
  ExternalLink,
  ShieldCheck,
  Heart
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { 
      title: 'Navigation', 
      links: [
        { name: 'Dashboard', icon: ExternalLink, href: '#' },
        { name: 'Expenses', icon: ExternalLink, href: '#' },
        { name: 'Budgets', icon: ExternalLink, href: '#' }
      ] 
    },
    { 
      title: 'Company', 
      links: [
        { name: 'About Us', icon: ExternalLink, href: '#' },
        { name: 'Privacy Policy', icon: ExternalLink, href: '#' },
        { name: 'Terms of Service', icon: ExternalLink, href: '#' }
      ] 
    },
    { 
      title: 'Support', 
      links: [
        { name: 'nitesh933438@gmail.com', icon: Mail, href: 'mailto:nitesh933438@gmail.com' },
        { name: '+91 9334387983', icon: Phone, href: 'tel:9334387983' },
        { name: 'Github Profile', icon: Github, href: 'https://github.com/nitesh933438' },
        { name: 'LinkedIn Profile', icon: Linkedin, href: 'https://www.linkedin.com/in/nitesh-kumar-3b7b4b382?utm_source=share_via&utm_content=profile&utm_medium=member_android' }
      ] 
    }
  ];

  return (
    <footer className="glass dark:glass-dark border-t border-white/20 dark:border-white/5 pt-16 pb-32 md:pb-16 mt-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand section */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                 <span className="text-white font-black italic text-xl">M</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Money Details</h2>
            </motion.div>
            <p className="text-gray-400 font-bold text-sm leading-relaxed">
              Empowering students and professionals to master their financial destiny through intelligent tracking and beautiful design.
            </p>
            <div className="flex gap-4">
              {[
                { Icon: Github, href: 'https://github.com/nitesh933438' },
                { Icon: Twitter, href: '#' },
                { Icon: Linkedin, href: 'https://www.linkedin.com/in/nitesh-kumar-3b7b4b382?utm_source=share_via&utm_content=profile&utm_medium=member_android' }
              ].map(({ Icon, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-gray-100 dark:border-gray-700"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links sections */}
          {footerLinks.map((section, i) => (
            <div key={i} className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{section.title}</h3>
              <ul className="space-y-4">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <motion.a
                      href={link.href}
                      target={link.href.startsWith('http') || link.href.startsWith('mailto') || link.href.startsWith('tel') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      whileHover={{ x: 5 }}
                      className="text-gray-600 dark:text-gray-400 font-bold text-sm hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-2 transition-colors"
                    >
                      <link.icon className="w-4 h-4 opacity-70" />
                      {link.name}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-12 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>© {currentYear} Money Details</span>
            <span className="hidden md:block w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            <span className="flex items-center gap-1">Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Everyone</span>
            <span className="hidden md:block w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            <span className="text-gray-900 dark:text-white">Made by Nitesh Kumar</span>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <MapPin className="w-3 h-3" /> India, Asia
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure & Encrypted
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
