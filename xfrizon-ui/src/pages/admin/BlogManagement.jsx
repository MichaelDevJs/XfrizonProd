import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import blogApi from "../../api/blogApi";
import BlogEditor from "./blog/BlogEditor";
import BlogList from "./blog/BlogList";

export default function BlogManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [blogs, setBlogs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  // Fetch blogs on component mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Fetch all blogs from API
  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const response = await blogApi.getAllBlogs();
      // Extract the content array from the Page object returned by the API
      let blogList = response.data
        ? response.data.content || response.data
        : response;

      // Parse JSON strings into arrays for media fields
      if (Array.isArray(blogList)) {
        blogList = blogList.map((blog) => ({
          ...blog,
          blocks: blog.blocks
            ? typeof blog.blocks === "string"
              ? JSON.parse(blog.blocks)
              : blog.blocks
            : [],
          images: blog.images
            ? typeof blog.images === "string"
              ? JSON.parse(blog.images)
              : blog.images
            : [],
          videos: blog.videos
            ? typeof blog.videos === "string"
              ? JSON.parse(blog.videos)
              : blog.videos
            : [],
          youtubeLinks: blog.youtubeLinks
            ? typeof blog.youtubeLinks === "string"
              ? JSON.parse(blog.youtubeLinks)
              : blog.youtubeLinks
            : [],
          audioTracks: blog.audioTracks
            ? typeof blog.audioTracks === "string"
              ? JSON.parse(blog.audioTracks)
              : blog.audioTracks
            : [],
          titleStyle: blog.titleStyle
            ? typeof blog.titleStyle === "string"
              ? JSON.parse(blog.titleStyle)
              : blog.titleStyle
            : {},
          tags: blog.tags
            ? typeof blog.tags === "string"
              ? JSON.parse(blog.tags)
              : blog.tags
            : [],
        }));
      }

      setBlogs(Array.isArray(blogList) ? blogList : []);
      console.log("Blogs fetched:", blogList);
      toast.success("Blogs loaded");
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      toast.error("Failed to load blogs");
      // Fallback to empty array if API fails
      setBlogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save blog (create or update)
  const handleSaveBlog = async (formData) => {
    const readCoverImage = (coverImage) => {
      if (!coverImage) return Promise.resolve(null);
      if (typeof coverImage === "string") return Promise.resolve(coverImage);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read cover image"));
        reader.readAsDataURL(coverImage);
      });
    };

    // Extract content summary and all media from blocks
    const textContent = formData.blocks
      .filter((b) => b.type === "text")
      .map((b) => b.content)
      .join("\n\n");

    const allImages = formData.blocks
      .filter((b) => b.type === "image")
      .flatMap((b) => b.images || []);

    const allVideos = formData.blocks
      .filter((b) => b.type === "video")
      .flatMap((b) => b.videos || []);

    const allYoutube = formData.blocks
      .filter((b) => b.type === "youtube")
      .flatMap((b) => b.youtubeLinks || []);

    const allAudio = formData.blocks
      .filter((b) => b.type === "audio")
      .flatMap((b) => b.audioTracks || []);

    if (
      !formData.title.trim() ||
      !formData.author.trim() ||
      !textContent.trim()
    ) {
      toast.error(
        "Please fill in title, author, and at least some text content",
      );
      return;
    }

    let coverImageValue = null;
    try {
      coverImageValue = await readCoverImage(formData.coverImage);
    } catch (readError) {
      console.error("Failed to read cover image:", readError);
      toast.error("Failed to read cover image");
      return;
    }

    // Prepare blog data
    const blogData = {
      title: formData.title,
      author: formData.author,
      category: formData.category,
      location: formData.location || "",
      genre: formData.genre || "",
      coverImage: coverImageValue,
      excerpt: formData.excerpt,
      content: textContent,
      blocks: formData.blocks,
      images: allImages,
      videos: allVideos,
      youtubeLinks: allYoutube,
      audioTracks: allAudio,
      tags: formData.tags || [],
      titleStyle: formData.titleStyle || {},
    };

    try {
      setIsSaving(true);
      if (editingBlog) {
        // Update existing blog
        await blogApi.updateBlog(editingBlog.id, blogData);
        setBlogs(
          blogs.map((blog) =>
            blog.id === editingBlog.id
              ? { ...blog, ...blogData, createdAt: blog.createdAt }
              : blog,
          ),
        );
        toast.success("Blog updated successfully");
      } else {
        // Create new blog
        const response = await blogApi.createBlog({
          ...blogData,
          status: "DRAFT",
        });
        const newBlog = response.data || response;
        setBlogs([newBlog, ...blogs]);
        toast.success("Blog created successfully");
      }
      handleCancel();
    } catch (error) {
      console.error("Failed to save blog:", error);
      toast.error(error.message || "Failed to save blog");
    } finally {
      setIsSaving(false);
    }
  };

  // Edit blog
  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setIsCreating(true);
  };

  // Publish blog
  const handlePublish = async (id) => {
    try {
      await blogApi.publishBlog(id);
      setBlogs(
        blogs.map((blog) =>
          blog.id === id ? { ...blog, status: "PUBLISHED" } : blog,
        ),
      );
      toast.success("Blog published successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to publish blog";
      console.error("Failed to publish blog:", message, error);
      toast.error(message);
    }
  };

  // Delete blog
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    try {
      setIsDeleting(id);
      await blogApi.deleteBlog(id);
      setBlogs(blogs.filter((blog) => blog.id !== id));
      toast.success("Blog deleted successfully");
    } catch (error) {
      console.error("Failed to delete blog:", error);
      toast.error("Failed to delete blog");
    } finally {
      setIsDeleting(null);
    }
  };

  // Duplicate blog
  const handleDuplicate = async (blog) => {
    try {
      // Create a copy of the blog data
      const duplicatedBlog = {
        title: `${blog.title} (Copy)`,
        author: blog.author,
        category: blog.category,
        location: blog.location || "",
        genre: blog.genre || "",
        coverImage: blog.coverImage,
        excerpt: blog.excerpt,
        content: blog.content,
        blocks: blog.blocks || [],
        images: blog.images || [],
        videos: blog.videos || [],
        youtubeLinks: blog.youtubeLinks || [],
        audioTracks: blog.audioTracks || [],
        tags: blog.tags || [],
        titleStyle: blog.titleStyle || {},
        status: "DRAFT",
      };

      const response = await blogApi.createBlog(duplicatedBlog);
      const newBlog = response.data || response;
      setBlogs([newBlog, ...blogs]);
      toast.success("Blog duplicated successfully");
    } catch (error) {
      console.error("Failed to duplicate blog:", error);
      toast.error("Failed to duplicate blog");
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsCreating(false);
    setEditingBlog(null);
  };

  if (isCreating) {
    return (
      <BlogEditor
        blog={editingBlog}
        onSave={handleSaveBlog}
        onCancel={handleCancel}
        editingId={editingBlog?.id}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation Tabs */}
      <div className="bg-zinc-950 rounded-lg p-2 flex gap-2">
        <button
          onClick={() => navigate("/admin/blogs")}
          className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
            location.pathname === "/admin/blogs"
              ? "bg-[#403838] text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          Blog Posts
        </button>
        <button
          onClick={() => navigate("/admin/blog-hero-blocks")}
          className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
            location.pathname === "/admin/blog-hero-blocks"
              ? "bg-[#403838] text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          Hero Slideshow
        </button>
      </div>

      {/* Header with New Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center bg-zinc-950 text-white p-3 sm:p-4 rounded-lg">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold">Blog Management</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Create, edit, and manage your blog posts with multimedia support
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 bg-[#403838] text-white rounded-lg hover:bg-[#4f4545] text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "+ New Blog Post"}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-400 mx-auto mb-3"></div>
            <p className="text-zinc-400 text-xs">Loading blogs...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && blogs.length === 0 && (
        <div className="text-center py-10 bg-zinc-950 rounded-lg border border-zinc-800">
          <h3 className="text-base font-semibold text-zinc-200 mb-2">
            No blogs yet
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
            Create your first blog post to get started
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-[#403838] text-white rounded-lg hover:bg-[#4f4545] text-xs font-semibold"
          >
            Create Blog Post
          </button>
        </div>
      )}

      {/* Blog List */}
      {!isLoading && blogs.length > 0 && (
        <BlogList
          blogs={blogs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPublish={handlePublish}
          onDuplicate={handleDuplicate}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
