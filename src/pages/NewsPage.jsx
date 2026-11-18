
import { useEffect, useState } from 'react';
import axios from '../services/axiosInstance';
import { Link } from 'react-router-dom';
import Navigation from "../components/navigation";
import Footer from "../components/footer";
import { useTranslation } from "react-i18next";
import { translateField } from "@/utils/translate";
import { motion } from "framer-motion";
import { MdOutlineNewspaper } from 'react-icons/md';
const getPageSize = () => {
  if (window.innerWidth < 640) return 2; // mobile
  if (window.innerWidth < 1024) return 4; // tablet
  return 6; // desktop
};

const NewsPage = () => {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const [news, setNews] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());

  useEffect(() => {
    const handleResize = () => setPageSize(getPageSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('/news');
      const sorted = [...res.data].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      setNews(sorted);
      setFeatured(sorted[0] || null);
    };
    fetchData();
  }, []);

  // Exclude featured from the rest
  const otherNews = featured ? news.slice(1) : news;

  // Search filter
  const filteredNews = otherNews.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / pageSize);
  const paginatedNews = filteredNews.slice((page - 1) * pageSize, page * pageSize);

  // Ref for grid scroll
  const gridRef = useState(null)[0] || (typeof window !== 'undefined' ? { current: null } : null);

  // Scroll to grid top on page change
  useEffect(() => {
    if (gridRef && gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);

  // Reset to page 1 if search or pageSize changes
  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);
  // No news found (only after news is loaded)
  const safeFilteredNews = Array.isArray(filteredNews) ? filteredNews : [];
  if (news.length == 0 && safeFilteredNews.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center w-full px-4 py-24 min-h-[calc(100vh-120px)]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center"
          >
            <MdOutlineNewspaper className="text-7xl text-amber-400 mb-6 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2">No News Found</h2>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Navigation />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center tracking-tight">Latest News</h1>

        {/* Search Bar */}
        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder={t('news.searchp')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black placeholder-neutral-400"
          />
        </div>
        {/* Featured News */}
        {featured && (
          <div className="mb-12 rounded-xl overflow-hidden shadow-lg bg-white flex flex-col md:flex-row">
            {featured.image_url && (
              <Link to={`/news/${featured.id}`} className="md:w-1/2 w-full block">
                <img
                  src={featured.image_url}
                  alt={featured.title}
                  className="object-cover w-full h-64 md:h-full transition-transform duration-200 hover:scale-105"
                  style={{ maxHeight: 350 }}
                />
              </Link>
            )}
            <div className="p-6 flex flex-col justify-between md:w-1/2">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link to={`/news/${featured.id}`}>
                    <h2 className="text-2xl md:text-3xl font-semibold hover:text-primary-400 transition-colors duration-150">
                      {translateField(featured, i18n.language, "title")}
                    </h2>
                  </Link>
                  {featured.source && featured.source !== 'local' && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                      {featured.source}
                    </span>
                  )}
                </div>
                <p className="text-sm text-black mb-4">
                  {new Date(featured.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-base text-black line-clamp-4">{translateField(featured, i18n.language, "content").slice(0, 220)}...</p>
              </div>
              <div className="mt-4 flex gap-3">
                <Link
                  to={`/news/${featured.id}`}
                  className="inline-block px-5 py-2 rounded bg-amber-500 hover:bg-primary-500 text-white font-medium transition-colors duration-150 shadow"
                >
                  {t('news.readMore')}
                </Link>
                {featured.external_link && (
                  <a
                    href={featured.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-5 py-2 rounded border border-amber-500 text-amber-600 hover:bg-amber-50 font-medium transition-colors duration-150 shadow-sm"
                  >
                    View Original
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* News Grid */}
        <div ref={gridRef} className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedNews.map(item => (
            <div
              key={item.id}
              className="bg-neutral-900 rounded-xl shadow-lg flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-200"
            >
              {item.image_url && (
                <Link to={`/news/${item.id}`} className="block">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="object-cover w-full h-48 hover:scale-105 transition-transform duration-200"
                  />
                </Link>
              )}
              <div className="p-5 flex flex-col flex-1 bg-white">
                <div className="flex items-start justify-between mb-1">
                  <Link to={`/news/${item.id}`} className="flex-1">
                    <h3 className="text-lg font-semibold hover:text-primary-400 transition-colors duration-150 line-clamp-2">
                      {translateField(item, i18n.language, "title")}
                    </h3>
                  </Link>
                  {item.source && item.source !== 'local' && (
                    <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-md border border-blue-100 flex-shrink-0">
                      {item.source}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-black">
                    {new Date(item.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <p className="text-sm text-gray-900 flex-1 line-clamp-3">{translateField(item, i18n.language, "content").slice(0, 120)}...</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Link
                    to={`/news/${item.id}`}
                    className="flex-1 text-center px-4 py-1.5 rounded bg-amber-500 hover:bg-primary-600 text-white text-xs font-medium transition-colors duration-150"
                  >
                    {t('news.readMore')}
                  </Link>
                  {item.external_link && (
                    <a
                      href={item.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-medium transition-colors duration-150"
                      title="View on Social Media"
                    >
                      Source
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-10">
            <nav className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`px-3 py-2 border border-amber-300 bg-white text-black font-medium rounded-l-md hover:bg-amber-100 transition-colors duration-150 ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t('news.prev')}
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`px-3 py-2 border-t border-b border-amber-300 font-medium transition-colors duration-150
                    ${page === idx + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-black hover:bg-amber-100'}
                  `}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={`px-3 py-2 border border-amber-300 bg-white text-black font-medium rounded-r-md hover:bg-amber-100 transition-colors duration-150 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t('news.next')}
              </button>
            </nav>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NewsPage;
