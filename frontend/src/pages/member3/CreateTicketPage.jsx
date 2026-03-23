import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  DashboardPageLayout,
  campusBtnPrimary,
  campusInputFocus,
} from "../../components/dashboard/DashboardPrimitives";
import { AlertCircle, CheckCircle, Upload, ChevronRight, ChevronLeft } from "lucide-react";
import { ticketApi } from "../../api/ticketApi";

const focusOk = `border-slate-200 ${campusInputFocus}`;
const brandBar = "h-full rounded-full bg-campus-brand transition-all duration-300";

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    location: '',
    contact: '',
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      const ticketJson = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        location: formData.location.trim(),
        preferredContact: formData.contact.trim(),
      };
      const fd = new FormData();
      fd.append(
        "ticket",
        new Blob([JSON.stringify(ticketJson)], { type: "application/json" }),
      );
      const files = formData.images || [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        fd.append("files", files[i]);
      }
      const { data } = await ticketApi.createTicket(fd);
      return data;
    },
    onSuccess: () => {
      toast.success("Ticket created");
      queryClient.invalidateQueries({ queryKey: ["tickets", "my"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "myTickets"] });
      navigate("/tickets");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "Could not create ticket";
      toast.error(typeof msg === "string" ? msg : "Could not create ticket");
    },
  });

  // Validation rules
  const validate = (field, value) => {
    const newErrors = { ...errors };
    
    if (field === 'title') {
      if (!value || value.length < 3) {
        newErrors.title = 'Title must be at least 3 characters';
      } else if (value.length > 100) {
        newErrors.title = 'Title must be less than 100 characters';
      } else {
        delete newErrors.title;
      }
    }
    if (field === 'description') {
      if (!value || value.length < 10) {
        newErrors.description = 'Description must be at least 10 characters';
      } else if (value.length > 500) {
        newErrors.description = 'Description must be less than 500 characters';
      } else {
        delete newErrors.description;
      }
    }
    if (field === 'category') {
      if (!value) {
        newErrors.category = 'Category is required';
      } else {
        delete newErrors.category;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      validate(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validate(name, value);
  };

  // Step validation
  const canProceedStep1 = formData.title && formData.description && formData.category && !errors.title && !errors.description && !errors.category;
  const canProceedStep2 = formData.location && formData.contact;

  const handlePickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    const next = [];
    for (const f of list.slice(0, 3)) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} is over 5MB`);
        continue;
      }
      if (!/^image\/(jpeg|png|webp)$/i.test(f.type)) {
        toast.error("Use JPEG, PNG, or WEBP images only");
        continue;
      }
      next.push(f);
    }
    setFormData((prev) => ({ ...prev, images: next }));
    e.target.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step !== 3) return;
    createTicketMutation.mutate();
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <DashboardPageLayout
      eyebrow="Tickets"
      title="Create ticket"
      subtitle="Report a facility issue in three steps."
    >
      <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-1 flex-col items-center">
                  <div
                    className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      s < step
                        ? "bg-emerald-600 text-white shadow-md"
                        : s === step
                          ? "bg-campus-brand text-white shadow-md ring-4 ring-slate-200"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {s < step ? "✓" : s}
                  </div>
                  <span className="text-center text-xs font-medium text-slate-600">
                    {s === 1 ? "Issue details" : s === 2 ? "Location & contact" : "Review & submit"}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 shadow-sm">
              <div className={brandBar} style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Step 1: Issue Details */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">What&apos;s the issue?</h2>

                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Issue Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Broken projector in Lab 3"
                    className={`w-full border-2 rounded-lg px-3 py-2 focus:outline-none transition-all ${
                      touched.title && errors.title
                        ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200'
                        : formData.title
                        ? 'border-emerald-500 bg-emerald-50'
                        : `border-slate-300 ${focusOk}`
                    }`}
                  />
                  {touched.title && errors.title && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.title}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1 font-medium">{formData.title.length}/100 characters</p>
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Category <span className="text-red-500">*</span></label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border-2 border-slate-300 px-3 py-2 font-medium text-slate-900 ${focusOk}`}
                    >
                      <option value="">Select category</option>
                      <option value="ELECTRICAL">⚡ Electrical</option>
                      <option value="PLUMBING">💧 Plumbing</option>
                      <option value="EQUIPMENT">🔧 Equipment</option>
                      <option value="IT">💻 IT/Network</option>
                      <option value="CLEANING">🧹 Cleaning</option>
                      <option value="OTHER">❓ Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Priority <span className="text-red-500">*</span></label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className={`w-full rounded-xl border-2 border-slate-300 px-3 py-2 font-medium text-slate-900 ${focusOk}`}
                    >
                      <option value="LOW">🟢 Low</option>
                      <option value="MEDIUM">🟡 Medium</option>
                      <option value="HIGH">🟠 High</option>
                      <option value="CRITICAL">🔴 Critical</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    className={`w-full border-2 rounded-lg px-3 py-2 focus:outline-none transition-all resize-none ${
                      touched.description && errors.description
                        ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200'
                        : formData.description
                        ? 'border-emerald-500 bg-emerald-50'
                        : `border-slate-300 ${focusOk}`
                    }`}
                  />
                  {touched.description && errors.description && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1 font-medium">{formData.description.length}/500 characters</p>
                </div>

                {/* Info Box */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
                  <p className="text-sm font-medium text-slate-700">
                    Provide as much detail as possible so technicians can resolve the issue faster.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Location & Contact */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Where & how to reach you</h2>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Location <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Block A, Room 204"
                    className={`w-full rounded-xl border-2 border-slate-300 px-3 py-2 text-slate-900 ${focusOk}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Preferred Contact <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="Email or phone number"
                    className={`w-full rounded-xl border-2 border-slate-300 px-3 py-2 text-slate-900 ${focusOk}`}
                  />
                </div>

                {/* Upload Images */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Evidence Images (optional, max 3)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handlePickFiles}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
                  >
                    <Upload className="mx-auto mb-2 h-8 w-8 text-campus-brand" />
                    <p className="text-sm font-semibold text-slate-800">Click to select up to 3 images</p>
                    <p className="text-xs text-slate-600 mt-1 font-medium">JPEG, PNG, WEBP — max 5MB each</p>
                  </button>
                  {formData.images?.length ? (
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {formData.images.map((f) => (
                        <li key={f.name}>{f.name}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Review your ticket</h2>

                <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 space-y-4 shadow-sm">
                  <div>
                    <p className="text-xs text-slate-600 mb-1 font-bold">Title</p>
                    <p className="text-sm font-semibold text-slate-900">{formData.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1 font-bold">Category</p>
                      <p className="text-sm font-semibold text-slate-900">{formData.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1 font-bold">Priority</p>
                      <p className="text-sm font-semibold text-slate-900">{formData.priority}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1 font-bold">Description</p>
                    <p className="text-sm text-slate-900">{formData.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1 font-bold">Location</p>
                      <p className="text-sm font-semibold text-slate-900">{formData.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1 font-bold">Contact</p>
                      <p className="text-sm font-semibold text-slate-900">{formData.contact}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 flex items-center gap-2 shadow-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <p className="text-sm text-emerald-900 font-medium">Everything looks good! Click submit to create your ticket.</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-between mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={16} /> Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${campusBtnPrimary}`}
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-800 disabled:pointer-events-none disabled:opacity-60"
                >
                  <CheckCircle size={16} />{" "}
                  {createTicketMutation.isPending ? "Submitting…" : "Submit Ticket"}
                </button>
              )}
            </div>
          </form>
      </div>
    </DashboardPageLayout>
  );
}