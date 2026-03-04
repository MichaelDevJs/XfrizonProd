import React from "react";

const OrganizerBlogTab = ({ posts }) => {
  return (
    <div>
      <h2 className="text-2xl font-light text-gray-200 mb-8">-XF BLOG</h2>
      {posts.length === 0 ? (
        <div className="bg-[#1e1e1e] border border-zinc-700 rounded-lg p-12 text-center">
          <p className="text-gray-500 font-light">No blog posts yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-[#1e1e1e] border border-zinc-700 rounded-lg overflow-hidden hover:border-zinc-600 transition p-6"
            >
              <p className="text-gray-500 font-light text-xs uppercase mb-2">
                {post.date}
              </p>
              <h3 className="text-xl font-light text-white mb-3">
                {post.title}
              </h3>
              <p className="text-gray-400 font-light mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              <button className="text-cyan-400 font-light text-sm hover:text-cyan-300 transition">
                Read More →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizerBlogTab;
