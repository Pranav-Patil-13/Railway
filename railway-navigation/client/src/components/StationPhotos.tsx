import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface StationPhotosProps {
    stationCodes: string[];
}

interface StationImage {
    code: string;
    title: string;
    imageUrl: string | null;
}

export function StationPhotos({ stationCodes }: StationPhotosProps) {
    const [images, setImages] = useState<StationImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchImages = async () => {
            setIsLoading(true);
            const fetchedImages: StationImage[] = [];

            const sourceCode = stationCodes[0];
            const destCode = stationCodes[stationCodes.length - 1];

            // Only fetch for source and destination
            const codesToFetch = Array.from(new Set([sourceCode, destCode])).filter(Boolean);

            await Promise.all(codesToFetch.map(async (code) => {
                try {
                    const res = await axios.get(
                        `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(code + ' railway station')}&gsrlimit=1&prop=pageimages|images&imlimit=50&pithumbsize=800&format=json&origin=*`,
                        { headers: { 'Accept': 'application/json' } }
                    );

                    const pages = res.data.query?.pages;
                    if (!pages) throw new Error("No page found");

                    const pageId = Object.keys(pages)[0];
                    const page = pages[pageId];
                    const thumbUrl = page.thumbnail?.source || '';

                    const isGenericArticle = page.title.toLowerCase().includes('list of') || page.title === 'India';

                    let validImages = [];
                    if (thumbUrl.toLowerCase().includes('.jpg') || thumbUrl.toLowerCase().includes('.jpeg')) {
                        validImages.push(thumbUrl);
                    }

                    // Try to extract additional images from the page if we need more
                    if (page.images && !isGenericArticle) {
                        const additionalImageFiles = page.images
                            .map((img: any) => img.title)
                            .filter((t: string) => t.toLowerCase().endsWith('.jpg') || t.toLowerCase().endsWith('.jpeg'))
                            .filter((t: string) => !thumbUrl.includes(t.replace('File:', '').replace(/ /g, '_')));

                        if (additionalImageFiles.length > 0) {
                            // Fetch as many top images as we can get up to 50
                            const topImages = additionalImageFiles.slice(0, 50);
                            const imUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${topImages.map(encodeURIComponent).join('|')}&prop=imageinfo&iiprop=url&format=json&origin=*`;
                            const res2 = await axios.get(imUrl, { headers: { 'Accept': 'application/json' } });

                            const additionalUrls = Object.values(res2.data.query?.pages || {})
                                .map((p: any) => p.imageinfo?.[0]?.url)
                                .filter(Boolean)
                                .map((u: string) => {
                                    // Scale high-res commons images down
                                    const parts = u.split('/');
                                    const filename = parts.pop();
                                    return u.replace('/commons/', '/commons/thumb/') + '/800px-' + filename;
                                });

                            validImages = [...validImages, ...additionalUrls];
                        }
                    }

                    // For each valid image we successfully found, push it into the gallery
                    // (Ensure we get at least 1 fallback if no valid images exist)
                    if (validImages.length === 0 || isGenericArticle) {
                        fetchedImages.push({
                            code,
                            title: isGenericArticle ? `${code} Station` : page.title,
                            imageUrl: `[FALLBACK_TRAIN]`
                        });
                    } else {
                        // Push all gorgeous images for this single station!
                        validImages.slice(0, 50).forEach((url, i) => {
                            fetchedImages.push({
                                code,
                                title: i === 0 ? page.title : `${page.title} (View ${i + 1})`,
                                imageUrl: url
                            });
                        });
                    }

                } catch (error) {
                    console.error("Failed to fetch image for", code, error);
                    fetchedImages.push({
                        code,
                        title: `${code} Station`,
                        imageUrl: `[FALLBACK_TRAIN]`
                    });
                }
            }));

            // Replace null with reliable Station Wikipedia Commons fallbacks
            const fallbacks = [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Secunderabad_pano_18082017.jpg/960px-Secunderabad_pano_18082017.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/3/32/Chennai_Central.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Charbagh_Railway_Station%2C_Lucknow.jpg/960px-Charbagh_Railway_Station%2C_Lucknow.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Jaipur_Railway_Station_Night_View.jpg/960px-Jaipur_Railway_Station_Night_View.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Mumbai_CST_night.jpg/960px-Mumbai_CST_night.jpg"
            ];

            // Consistent hash based on station code
            const getFallbackIndex = (c: string) => {
                let hash = 0;
                for (let i = 0; i < c.length; i++) {
                    hash = c.charCodeAt(i) + ((hash << 5) - hash);
                }
                return Math.abs(hash) % fallbacks.length;
            };

            const finalData = fetchedImages.map((img) => ({
                ...img,
                imageUrl: img.imageUrl === '[FALLBACK_TRAIN]'
                    ? fallbacks[getFallbackIndex(img.code)]
                    : (img.imageUrl || fallbacks[getFallbackIndex(img.code)])
            }));

            // Sort so that First station is first, Last is last
            const sortedData = finalData.sort((a, b) => {
                if (a.code === sourceCode) return -1;
                if (b.code === sourceCode) return 1;
                if (a.code === destCode) return 1;
                if (b.code === destCode) return -1;
                return 0;
            });

            setImages(sortedData);
            setIsLoading(false);
        };

        if (stationCodes.length > 0) {
            fetchImages();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stationCodes.join(',')]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null) return;
            if (e.key === 'Escape') setSelectedIndex(null);
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex]);

    const handleNext = () => {
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex + 1) % images.length);
        }
    };

    const handlePrev = () => {
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <ImageIcon className="h-4 w-4 text-text-secondary/50" />
                    <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-48 rounded-2xl bg-secondary/30 animate-pulse border border-border/50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-primary/30 animate-spin" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-4 px-1">
                <ImageIcon className="h-4 w-4 text-text-secondary" />
                <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                    Journey Stops
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {images.map((img, index) => (
                    <div
                        key={`${img.code}-${index}`}
                        onClick={() => setSelectedIndex(index)}
                        className="group cursor-pointer relative h-48 rounded-2xl overflow-hidden shadow-sm border border-border/50 bg-secondary/20 hover:shadow-lg transition-all duration-300"
                    >
                        <img
                            src={img.imageUrl!}
                            alt={img.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-4 left-4 right-4 flex flex-col items-start gap-1">
                            <span className="px-2 py-0.5 bg-primary rounded uppercase tracking-widest text-[10px] font-black text-white shadow-sm">
                                {img.code}
                            </span>
                            <h3 className="font-bold text-white text-sm leading-tight drop-shadow-md">
                                {img.title}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Fullscreen Slideshow Modal */}
            {selectedIndex !== null && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedIndex(null)}>
                    <button
                        onClick={() => setSelectedIndex(null)}
                        className="absolute top-6 right-6 sm:top-8 sm:right-8 flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/25 hover:scale-105 active:scale-95 text-white font-black tracking-widest uppercase text-xs sm:text-sm backdrop-blur-md transition-all z-[10000] ring-1 ring-white/20 shadow-2xl"
                    >
                        <span>Close</span>
                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className="absolute left-4 sm:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[10000] backdrop-blur-md"
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="absolute right-4 sm:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[10000] backdrop-blur-md"
                    >
                        <ChevronRight className="h-8 w-8" />
                    </button>

                    <div className="relative w-full max-w-6xl max-h-[85vh] px-4 flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={images[selectedIndex].imageUrl!}
                            alt={images[selectedIndex].title}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-4 bg-black/70 backdrop-blur-md rounded-2xl text-center border border-white/10 shadow-xl">
                            <span className="inline-block px-3 py-1 bg-primary rounded uppercase tracking-widest text-[10px] sm:text-xs font-black text-white shadow-sm mb-2">
                                {images[selectedIndex].code}
                            </span>
                            <h3 className="font-bold text-white text-lg sm:text-xl drop-shadow-md">
                                {images[selectedIndex].title}
                            </h3>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
