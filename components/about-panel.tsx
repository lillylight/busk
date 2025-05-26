"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Info, Mail, Heart } from "lucide-react"
export function AboutPanel() {
  const [activeSection, setActiveSection] = useState<"about" | "contact" | "donate">("about")

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveSection("about")}
          className={`text-sm px-3 py-1 rounded-full ${
            activeSection === "about" ? "bg-[#ff5722] text-white" : "bg-[#f0f0f0] text-[#666666]"
          }`}
        >
          About Us
        </button>
        <button
          onClick={() => setActiveSection("contact")}
          className={`text-sm px-3 py-1 rounded-full ${
            activeSection === "contact" ? "bg-[#ff5722] text-white" : "bg-[#f0f0f0] text-[#666666]"
          }`}
        >
          Contact
        </button>
        <button
          onClick={() => setActiveSection("donate")}
          className={`text-sm px-3 py-1 rounded-full ${
            activeSection === "donate" ? "bg-[#ff5722] text-white" : "bg-[#f0f0f0] text-[#666666]"
          }`}
        >
          Donate
        </button>
      </div>

      <AnimatedSection active={activeSection === "about"}>
        <div className="bg-white rounded-md shadow-sm p-4">
          <h3 className="font-medium text-[#333333] flex items-center">
            <Info size={18} className="mr-2 text-[#ff5722]" />
            About AI Radio
          </h3>
          <p className="mt-3 text-sm text-[#666666]">
            AI Radio is a cutting-edge radio station powered by artificial intelligence. We combine the latest in AI
            technology with traditional radio formats to create a unique listening experience.
          </p>
          <p className="mt-2 text-sm text-[#666666]">
            Our AI hosts are powered by advanced language models that can generate natural, engaging content in
            real-time. Each host has a unique personality and voice profile, creating diverse shows across music and
            talk formats.
          </p>
          <p className="mt-2 text-sm text-[#666666]">
            Founded in 2025, we're pioneering the future of audio entertainment by blending AI-generated music,
            conversations, and interactive features that traditional radio simply can't offer.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection active={activeSection === "contact"}>
        <div className="bg-white rounded-md shadow-sm p-4">
          <h3 className="font-medium text-[#333333] flex items-center">
            <Mail size={18} className="mr-2 text-[#ff5722]" />
            Contact Us
          </h3>
          <p className="mt-3 text-sm text-[#666666]">
            Have questions, feedback, or business inquiries? We'd love to hear from you!
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <h4 className="text-sm font-medium text-[#333333]">Email</h4>
              <p className="text-sm text-[#666666]">contact@airadio.fm</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#333333]">Business Inquiries</h4>
              <p className="text-sm text-[#666666]">business@airadio.fm</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#333333]">Technical Support</h4>
              <p className="text-sm text-[#666666]">support@airadio.fm</p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection active={activeSection === "donate"}>
        <div className="bg-white rounded-md shadow-sm p-4">
          <h3 className="font-medium text-[#333333] flex items-center">
            <Heart size={18} className="mr-2 text-[#ff5722]" />
            Support AI Radio
          </h3>
          <p className="mt-3 text-sm text-[#666666]">
            AI Radio relies on API services to provide an immersive radio experience. We're constantly working to improve our content and provide the best possible experience.
          </p>
          <p className="mt-2 text-sm text-[#666666]">By donating, you're directly contributing to:</p>
          <ul className="mt-2 space-y-1 text-sm text-[#666666]">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>API costs for AI-generated content</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Development of new features</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Server infrastructure</span>
            </li>
          </ul>
        </div>
      </AnimatedSection>
    </div>
  )
}

function AnimatedSection({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: active ? 1 : 0, height: active ? "auto" : 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  )
}
