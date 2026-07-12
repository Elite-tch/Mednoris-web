export default function Footer() {
  return (
    <footer className="bg-white py-12 px-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-secondary rounded-full flex items-center justify-center font-bold text-white">
              M
            </div>
            <span className="text-xl font-bold text-brand-primary tracking-tight">Mednoris</span>
          </div>
          <p className="text-gray-500 text-sm">
            The privacy-first digital healthcare ecosystem where patients own their records and connect with global specialists.
          </p>
        </div>
        
        <div className="flex gap-16">
          <div>
            <h4 className="font-bold text-brand-primary mb-4">Quick Links</h4>
            <ul className="flex flex-col gap-2 text-gray-500 text-sm">
              <li><a href="#" className="hover:text-brand-accent">Home</a></li>
              <li><a href="#about" className="hover:text-brand-accent">About Us</a></li>
              <li><a href="#features" className="hover:text-brand-accent">Features</a></li>
              <li><a href="#marketplace" className="hover:text-brand-accent">Doctor Marketplace</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-brand-primary mb-4">Legal</h4>
            <ul className="flex flex-col gap-2 text-gray-500 text-sm">
              <li><a href="#" className="hover:text-brand-accent">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-accent">Terms of Service</a></li>
              <li><a href="#" className="hover:text-brand-accent">HIPAA Compliance</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Mednoris. All rights reserved.
      </div>
    </footer>
  );
}
