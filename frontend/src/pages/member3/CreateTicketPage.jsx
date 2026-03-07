import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import PageContainer from '../../components/PageContainer';
import { AlertCircle, CheckCircle, Upload, ChevronRight, ChevronLeft } from 'lucide-react';

export default function CreateTicketPage() {
  const navigate = useNavigate();
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

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Ticket created successfully!');
    navigate('/tickets');
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <AppLayout>
      <PageContainer>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">Create New Ticket</h1>
            <p className="text-slate-600">Report a facility issue in 3 simple steps</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all ${
                    s < step
                      ? 'bg-emerald-500 text-white shadow-md'
                      : s === step
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white ring-4 ring-cyan-100 shadow-lg'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {s < step ? '✓' : s}
                  </div>
                  <span className="text-xs text-slate-600 text-center font-medium">
                    {s === 1 ? 'Issue Details' : s === 2 ? 'Location & Contact' : 'Review & Submit'}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-sm">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full shadow-md"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            {/* Step 1: Issue Details */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">What's the issue?</h2>

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
                        : 'border-slate-300 focus:ring-2 focus:ring-cyan-400'
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
                      className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-900 font-medium"
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
                      className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-900 font-medium"
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
                        : 'border-slate-300 focus:ring-2 focus:ring-cyan-400'
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
                <div className="bg-cyan-50 border border-cyan-300 rounded-lg p-3 shadow-sm">
                  <p className="text-sm text-cyan-900 font-medium">💡 Provide as much detail as possible to help technicians resolve your issue faster.</p>
                </div>
              </div>
            )}

            {/* Step 2: Location & Contact */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">Where & How to reach you?</h2>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Location <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Block A, Room 204"
                    className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-900"
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
                    className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-900"
                  />
                </div>

                {/* Upload Images */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Evidence Images (optional, max 3)</label>
                  <div className="border-2 border-dashed border-cyan-400 rounded-lg p-6 text-center bg-cyan-50 cursor-pointer hover:bg-cyan-100 transition shadow-sm">
                    <Upload className="mx-auto h-8 w-8 text-cyan-600 mb-2" />
                    <p className="text-sm text-cyan-700 font-bold">Drag & drop images, or click to select</p>
                    <p className="text-xs text-slate-600 mt-1 font-medium">JPEG, PNG, WEBP — max 5MB each</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">Review your ticket</h2>

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
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2 shadow-md"
                >
                  <CheckCircle size={16} /> Submit Ticket
                </button>
              )}
            </div>
          </form>
        </div>
      </PageContainer>
    </AppLayout>
  );
}