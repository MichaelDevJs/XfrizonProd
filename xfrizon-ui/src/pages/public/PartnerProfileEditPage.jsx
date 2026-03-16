import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCamera, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import partnersApi from "../../api/partnersApi";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import OrganizerCoverSlideshow from "../../component/organizer/OrganizerCoverSlideshow";

const CATEGORIES = [
  "FOOD",
  "HAIR_SALON",
  "FASHION",
  "BEAUTY",
  "FITNESS",
  "ENTERTAINMENT",
  "OTHER",
];

const TYPES = ["ONLINE", "IN_PERSON", "BOTH"];
const TEXT_MAX_LENGTH = 1000;
const LIMITED_TEXT_FIELDS = new Set([
  "description",
  "aboutPrimaryBody",
  "aboutSecondaryBody",
]);

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".m4v",
  ".avi",
  ".mkv",
];

const getMediaUrl = (path) => {
  if (!path) return null;
  const value = String(path).trim();
  if (value.startsWith("http") || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }
  if (/^:\d+\//.test(value)) {
    return `http://localhost${value}`;
  }
  if (/^localhost:\d+\//i.test(value)) {
    return `http://${value}`;
  }
  if (/^\/\/localhost:\d+\//i.test(value)) {
    return `http:${value}`;
  }
  const normalized = value.startsWith("/") ? value : `/${value}`;
  if (import.meta.env.PROD) {
    return normalized;
  }
  if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
    return `http://localhost:8081${normalized}`;
  }
  return `http://localhost:8081/api/v1${normalized}`;
};

const isVideoMedia = (value) => {
  if (!value) return false;
  const normalized = String(value).toLowerCase();
  if (normalized.startsWith("data:video/")) return true;
  return VIDEO_EXTENSIONS.some((ext) => normalized.includes(ext));
};

const toEditableMedia = (items = [], prefix) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    id: `${prefix}-${index}`,
    url: item?.url || "",
    caption: item?.caption || "",
    type: item?.type || (isVideoMedia(item?.url) ? "video" : "image"),
    file: null,
    isNew: false,
  }));

export default function PartnerProfileEditPage() {
  const navigate = useNavigate();
  const { organizer: currentUser, updateUser } = useContext(AuthContext);
  const logoInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partner, setPartner] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [coverItems, setCoverItems] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "FOOD",
    type: "IN_PERSON",
    website: "",
    instagram: "",
    twitter: "",
    location: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    aboutPrimaryTitle: "About",
    aboutPrimaryBody: "",
    aboutSecondaryTitle: "More",
    aboutSecondaryBody: "",
    headlineTitle: "Headline",
    headlineBody: "",
    headlineLinkLabel: "",
    headlineLinkUrl: "",
  });

  useEffect(() => {
    const loadPartner = async () => {
      try {
        setLoading(true);
        const data = await partnersApi.getMine();
        setPartner(data);
        setLogoPreview(data?.logoUrl || "");
        setProfilePhotoPreview(data?.profilePhotoUrl || currentUser?.profilePicture || "");
        setCoverItems(toEditableMedia(data?.coverMedia || [], "cover"));
        setGalleryItems(toEditableMedia(data?.gallery || [], "gallery"));
        setFormData({
          name: data?.name || "",
          description: data?.description || "",
          category: data?.category || data?.industry || "FOOD",
          type: data?.type || "IN_PERSON",
          website: data?.website || "",
          instagram: data?.instagram || "",
          twitter: data?.twitter || "",
          location: data?.location || "",
          address: data?.address || "",
          contactEmail: data?.contactEmail || currentUser?.email || "",
          contactPhone: data?.contactPhone || "",
          aboutPrimaryTitle: data?.aboutPrimaryTitle || "About",
          aboutPrimaryBody: data?.aboutPrimaryBody || "",
          aboutSecondaryTitle: data?.aboutSecondaryTitle || "More",
          aboutSecondaryBody: data?.aboutSecondaryBody || "",
          headlineTitle: data?.headlineTitle || "Headline",
          headlineBody: data?.headlineBody || "",
          headlineLinkLabel: data?.headlineLinkLabel || "",
          headlineLinkUrl: data?.headlineLinkUrl || "",
        });
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load partner profile");
      } finally {
        setLoading(false);
      }
    };

    loadPartner();
  }, [currentUser?.email]);

  const publicProfilePath = useMemo(() => {
    return partner?.id ? `/partners/${partner.id}` : "/partners";
  }, [partner?.id]);

  const postUploadWithFallback = async (endpoints, file) => {
    const baseUrl = String(api?.defaults?.baseURL || "");
    const origin = baseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
    const candidates = [];
    const origins = [];
    if (origin) origins.push(origin);
    if (typeof window !== "undefined" && window.location?.origin) {
      origins.push(window.location.origin.replace(/\/$/, ""));
    }
    if (import.meta.env.DEV) {
      origins.push("http://localhost:8081");
    }

    endpoints.forEach((endpoint) => {
      origins.forEach((candidateOrigin) => {
        candidates.push(`${candidateOrigin}${endpoint}`);
      });
    });

    const uniqueCandidates = [...new Set(candidates)];
    const token = localStorage.getItem("userToken") || localStorage.getItem("adminToken");
    let lastError = null;

    for (const url of uniqueCandidates) {
      try {
        const payload = new FormData();
        payload.append("file", file);
        const headers = { "Content-Type": "multipart/form-data" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const response = await axios.post(url, payload, { headers, timeout: 30000 });
        if (response?.data?.url) return response.data.url;
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        if (status === 400 || status === 404 || status === 405 || (typeof status === "number" && status >= 500)) {
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error("Upload failed");
  };

  const onTextChange = (e) => {
    const { name, value } = e.target;
    if (LIMITED_TEXT_FIELDS.has(name) && value.length > TEXT_MAX_LENGTH) {
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Logo must be an image file");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onProfilePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Profile photo must be an image file");
      return;
    }
    setProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const appendMediaItems = (setter) => (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    files.forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`${file.name}: must be an image or video`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter((prev) => [
          ...prev,
          {
            id: `new-${Date.now()}-${Math.random()}`,
            url: reader.result,
            type: file.type.startsWith("video/") ? "video" : "image",
            caption: "",
            file,
            isNew: true,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMediaItem = (setter, id) => {
    setter((prev) => prev.filter((item) => item.id !== id));
  };

  const uploadMediaItems = async (items) => {
    const uploaded = [];
    for (const item of items) {
      if (item.isNew && item.file) {
        const endpoint = item.type === "video" ? "/uploads/upload" : "/uploads/cover-photo";
        const url = await postUploadWithFallback([endpoint], item.file);
        uploaded.push({ url, type: item.type, caption: item.caption || "" });
      } else if (item.url) {
        uploaded.push({
          url: item.url,
          type: item.type || (isVideoMedia(item.url) ? "video" : "image"),
          caption: item.caption || "",
        });
      }
    }
    return uploaded;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if ((formData.aboutPrimaryBody || "").length > TEXT_MAX_LENGTH) {
      toast.error(`Description Body must be ${TEXT_MAX_LENGTH} characters or less`);
      return;
    }
    try {
      setSaving(true);
      let uploadedLogoUrl = null;
      if (logoFile) {
        uploadedLogoUrl = await postUploadWithFallback(["/uploads/organizer-logo"], logoFile);
      }
      let uploadedProfilePhotoUrl = null;
      if (profilePhotoFile) {
        uploadedProfilePhotoUrl = await postUploadWithFallback(["/uploads/profile-photo"], profilePhotoFile);
      }

      const uploadedCover = await uploadMediaItems(coverItems);
      const uploadedGallery = await uploadMediaItems(galleryItems);

      const payload = {
        ...formData,
        logoUrl: uploadedLogoUrl || partner?.logoUrl || null,
        profilePhotoUrl: uploadedProfilePhotoUrl || partner?.profilePhotoUrl || currentUser?.profilePicture || null,
        coverPhoto: uploadedCover[0]?.url || partner?.coverPhoto || null,
        coverMedia: uploadedCover,
        gallery: uploadedGallery,
      };

      const updated = await partnersApi.updateMine(payload);
      setPartner(updated);
      setLogoFile(null);
      setProfilePhotoFile(null);
      setCoverItems(toEditableMedia(updated?.coverMedia || [], "cover"));
      setGalleryItems(toEditableMedia(updated?.gallery || [], "gallery"));
      setLogoPreview(updated?.logoUrl || "");
      setProfilePhotoPreview(updated?.profilePhotoUrl || "");

      updateUser?.({
        name: updated?.name,
        firstName: updated?.name || currentUser?.firstName,
        email: updated?.contactEmail || currentUser?.email,
        logo: updated?.logoUrl,
        profilePicture: updated?.profilePhotoUrl || updated?.logoUrl,
        location: updated?.location,
        address: updated?.address,
        website: updated?.website,
        instagram: updated?.instagram,
        twitter: updated?.twitter,
        phoneNumber: updated?.contactPhone,
        bio: updated?.description,
        coverPhoto: updated?.coverPhoto,
      });

      toast.success("Partner profile updated");
    } catch (error) {
      console.error("Failed to update partner profile", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to update partner profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading partner profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-8 pt-4 sm:space-y-6 sm:pt-6">
      <div className="flex flex-col items-center justify-center gap-3 p-4 text-center sm:p-5">
        <div>
          <h1 className="text-xl font-semibold tracking-wide text-gray-100 sm:text-2xl">
            Partner Profile Edit
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Build the same storytelling structure as organizer profiles.
          </p>
        </div>
      </div>

      <section className="overflow-hidden border-b border-zinc-900/70 transition-colors">
        <div className="flex flex-col gap-3 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-300/90">
            Live Preview
          </span>
          <Link
            to={publicProfilePath}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Open Public Profile
          </Link>
        </div>
        <div className="overflow-y-auto hide-scrollbar max-h-96 pointer-events-none">
          <div className="relative h-40 w-full overflow-hidden bg-black sm:h-52 lg:h-60">
            <OrganizerCoverSlideshow
              slides={coverItems.map((item) => ({
                id: item.id,
                url: getMediaUrl(item.url) || item.url,
                type: item.type,
              }))}
            />
          </div>
          <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
            <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 text-center">
              <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-2xl border border-zinc-700 bg-black">
                {logoPreview ? (
                  <img src={getMediaUrl(logoPreview) || logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[#c0f24d]">
                    {String(formData.name || "P").charAt(0)}
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-semibold text-white">{formData.name || "Partner"}</h2>
              <p className="mt-2 text-sm text-zinc-400">{formData.location || "Location"} · {formData.category} · {formData.type}</p>
            </div>
            <Block title="About" body={formData.description} />
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        <Section title="Branding Media" subtitle="Logo, cover block, and visual gallery.">
          <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
            <div className="rounded-2xl border border-zinc-800 bg-black/20 p-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="text-center">
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Profile Photo</p>
                  <div className="mt-5 flex flex-col items-center justify-center">
                    <div className="h-32 w-32 overflow-hidden border border-zinc-700 bg-black">
                      {profilePhotoPreview ? (
                        <img src={getMediaUrl(profilePhotoPreview) || profilePhotoPreview} alt="Profile photo preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-600">No photo</div>
                      )}
                    </div>
                    <input ref={profilePhotoInputRef} type="file" accept="image/*" onChange={onProfilePhotoUpload} className="hidden" />
                    <button type="button" onClick={() => profilePhotoInputRef.current?.click()} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-400 transition-colors hover:text-red-300">
                      <FaCamera />
                      {profilePhotoPreview ? "Change Photo" : "Upload Photo"}
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Logo</p>
                  <div className="mt-5 flex flex-col items-center justify-center">
                    <div className="h-32 w-32 overflow-hidden border border-zinc-700 bg-black">
                      {logoPreview ? (
                        <img src={getMediaUrl(logoPreview) || logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-600">No logo</div>
                      )}
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={onLogoUpload} className="hidden" />
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-400 transition-colors hover:text-red-300">
                      <FaCamera />
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <MediaStrip
              title="Cover Block"
              items={coverItems}
              onAdd={() => coverInputRef.current?.click()}
              onRemove={(id) => removeMediaItem(setCoverItems, id)}
            />
          </div>
          <input ref={coverInputRef} type="file" accept="image/*,video/*" multiple onChange={appendMediaItems(setCoverItems)} className="hidden" />
        </Section>

        <Section title="Profile Details" subtitle="Core partner profile information\.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Partner Name"><input name="name" value={formData.name} onChange={onTextChange} className="input" /></Field>
            <Field label="Contact Email"><input name="contactEmail" type="email" value={formData.contactEmail} onChange={onTextChange} className="input" /></Field>
            <Field label="Category"><select name="category" value={formData.category} onChange={onTextChange} className="input">{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
            <Field label="Type"><select name="type" value={formData.type} onChange={onTextChange} className="input">{TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
            <Field label="Location"><input name="location" value={formData.location} onChange={onTextChange} className="input" /></Field>
            <Field label="Contact Phone"><input name="contactPhone" value={formData.contactPhone} onChange={onTextChange} className="input" /></Field>
            <Field label="Address" className="md:col-span-2"><input name="address" value={formData.address} onChange={onTextChange} className="input" /></Field>
            <Field label="Description Body" className="md:col-span-2">
              <textarea name="aboutPrimaryBody" value={formData.aboutPrimaryBody} onChange={onTextChange} rows={6} maxLength={TEXT_MAX_LENGTH} className="input" />
              <p className="mt-1 text-[11px] text-gray-500">{(formData.aboutPrimaryBody || "").length}/{TEXT_MAX_LENGTH}</p>
            </Field>
          </div>
        </Section>

        <Section title="Gallery Block" subtitle="Supporting images and videos." noContentPanel>
          <MediaStrip
            title=""
            items={galleryItems}
            onAdd={() => galleryInputRef.current?.click()}
            onRemove={(id) => removeMediaItem(setGalleryItems, id)}

          />
          <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple onChange={appendMediaItems(setGalleryItems)} className="hidden" />
        </Section>

        <Section title="Socials" subtitle="Where customers should follow or contact you.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Website"><input name="website" value={formData.website} onChange={onTextChange} className="input" placeholder="https://..." /></Field>
            <Field label="Instagram"><input name="instagram" value={formData.instagram} onChange={onTextChange} className="input" /></Field>
            <Field label="Twitter / X"><input name="twitter" value={formData.twitter} onChange={onTextChange} className="input" /></Field>
          </div>
        </Section>

        <div className="sticky bottom-3 z-10 flex justify-end">
          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-400 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            <FaSave />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

      <style>{`.input{margin-top:0.5rem;width:100%;border-radius:0.75rem;border:1px solid #3f3f46;background:#1e1e1e;padding:0.75rem;color:white;outline:none}.input:focus{border-color:#ef4444}`}</style>
    </div>
  );
}

function Section({ title, subtitle, children, noContentPanel = false }) {
  return (
    <section className="bg-[#1e1e1e] p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-300 sm:text-sm">{title}</h2>
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      </div>
      {noContentPanel ? children : <div className="bg-black/20 p-5">{children}</div>}
    </section>
  );
}

function Field({ label, className = "", children }) {
  return <label className={`text-xs text-gray-400 ${className}`}>{label}{children}</label>;
}

function MediaStrip({ title, items, onAdd, onRemove, plain = false }) {
  return (
    <div className={plain ? "w-full max-w-4xl mx-auto" : "border border-zinc-800 bg-black/20 p-5"}>
      {title ? (
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className={plain ? "text-sm font-medium tracking-wide uppercase text-gray-200" : "text-xs font-semibold uppercase tracking-[0.18em] text-gray-400"}>{title}</p>
            <p className="mt-1 text-xs text-gray-500">Image or video.</p>
          </div>
        </div>
      ) : null}
      <div className={plain ? "mb-3 flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar pb-1" : "mb-3 flex gap-2 overflow-x-auto hide-scrollbar pb-1"}>
        {items.map((item, idx) => (
          <div key={item.id} className={plain ? "relative shrink-0 w-48 sm:w-60 h-28 sm:h-32 rounded-lg border border-zinc-800 bg-zinc-900/70 overflow-hidden" : "relative h-24 w-44 shrink-0 overflow-hidden border border-zinc-700 bg-black sm:h-28 sm:w-52"}>
            {item.type === "video" ? (
              <video src={getMediaUrl(item.url) || item.url} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <img src={getMediaUrl(item.url) || item.url} alt={`${title} ${idx + 1}`} className="h-full w-full object-cover" />
            )}
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">{idx + 1}</span>
            <button type="button" onClick={() => onRemove(item.id)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600" aria-label="Remove media item">
              <FaTrash size={9} />
            </button>
          </div>
        ))}
        <button type="button" onClick={onAdd} className={plain ? "flex h-28 sm:h-32 w-48 sm:w-60 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-600 bg-zinc-900/40 text-zinc-500 transition hover:border-red-500 hover:text-red-400" : "flex h-24 w-44 shrink-0 flex-col items-center justify-center border border-dashed border-zinc-600 text-zinc-500 transition hover:border-red-500 hover:text-red-400 sm:h-28 sm:w-52"}>
          <FaPlus size={16} />
          <span className="mt-1 text-xs">Add</span>
        </button>
      </div>
    </div>
  );
}

function Block({ title, body }) {
  if (!title && !body) return null;
  return (
    <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 sm:p-8">
      {title && <h2 className="text-xl font-semibold text-white">{title}</h2>}
      {body && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{body}</p>}
    </section>
  );
}







