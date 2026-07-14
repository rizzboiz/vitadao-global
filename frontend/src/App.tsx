import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Governance from "./pages/Governance";
import IPNFTGallery from "./pages/IPNFTGallery";
import ResearchFunding from "./pages/ResearchFunding";
import Portfolio from "./pages/Portfolio";

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <div className="min-h-screen bg-vita-dark">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/ipnft" element={<IPNFTGallery />} />
              <Route path="/funding" element={<ResearchFunding />} />
              <Route path="/portfolio" element={<Portfolio />} />
            </Routes>
          </main>
          <footer className="border-t border-vita-dark-border py-8 px-4 mt-10">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <p>© 2024 VitaDAO. Funding the science of living longer.</p>
              <div className="flex gap-6">
                <a
                  href="https://vitadao.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-vita-teal transition-colors"
                >
                  Website
                </a>
                <a
                  href="https://github.com/vitadao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-vita-teal transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="https://discord.gg/vitadao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-vita-teal transition-colors"
                >
                  Discord
                </a>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </Web3Provider>
  );
}
