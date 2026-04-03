import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SmartMarkdown = ({ children }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                a: ({ node, ...props }) => {
                    const url = props.href || '';
                    // Regex to match YouTube URLs
                    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                    const match = url.match(youtubeRegex);

                    if (match && match[1]) {
                        const videoId = match[1];
                        return (
                            <iframe
                                className="w-full aspect-video rounded-xl shadow-lg border border-white/10 my-4"
                                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            ></iframe>
                        );

                    }

                    // Check if it's a direct image link
                    const imageRegex = /\.(jpeg|jpg|gif|png|svg|webp)(\?.*)?$/i;
                    if (url.match(imageRegex)) {
                        return (
                            <span className="block my-6 rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-slate-900/50 relative group">
                                <img
                                    src={url}
                                    className="w-full h-auto max-h-[500px] object-contain bg-slate-800/20"
                                    loading="lazy"
                                    alt="Embedded Image"
                                />
                            </span>
                        );
                    }

                    return (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition-colors break-words relative z-10"
                        >
                            {props.children}
                        </a>
                    );
                },
                img: ({ node, ...props }) => {
                    return (
                        <span className="block my-6 rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-slate-900/50 relative group">
                            <img
                                {...props}
                                className="w-full h-auto max-h-[500px] object-contain bg-slate-800/20"
                                loading="lazy"
                                alt={props.alt || 'Content Image'}
                            />
                            {props.alt && props.alt !== 'image' && (
                                <span className="block absolute bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-md text-center text-xs text-white py-2 font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                                    {props.alt}
                                </span>
                            )}
                        </span>
                    );
                }
            }}
        >
            {children}
        </ReactMarkdown>
    );
};

export default SmartMarkdown;
