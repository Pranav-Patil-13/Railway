import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import ARNavigationPage from './pages/ARNavigationPage';
import { ChatBot } from './components/ChatBot';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/ar-navigate" element={<ARNavigationPage />} />
        {/* Fallback for 404 */}
        <Route path="*" element={<Home />} />
      </Routes>
      <ChatBot />
    </Router>
  );
}

export default App;