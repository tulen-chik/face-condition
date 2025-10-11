"use client"

import type { ReactNode } from "react"
import { Lightbulb, Info, Star, AlertTriangle, CheckCircle } from "lucide-react"

// --- Type Definitions ---
export interface ContentBlock {
  type: string
  [key: string]: any
}

interface BlogContentProps {
  content: ContentBlock[]
}

// --- REDESIGNED CONTENT COMPONENTS ---

// Component: Paragraph
function Paragraph({ content, className = "" }: { content: string; className?: string }) {
  return <p className={`text-lg text-slate-700 leading-relaxed mb-6 ${className}`}>{content}</p>
}

// Component: Heading
function Heading({ level, content }: { level: number; content:string }) {
  const baseClasses = "font-bold text-gray-900 mt-10 mb-4 border-b border-slate-200 pb-2"

  switch (level) {
    case 2:
      return <h2 className={`text-3xl ${baseClasses}`}>{content}</h2>
    case 3:
      return <h3 className={`text-2xl ${baseClasses} mt-8`}>{content}</h3>
    case 4:
      return <h4 className={`text-xl font-semibold text-gray-800 mt-6 mb-3`}>{content}</h4>
    default:
      return <h2 className={`text-3xl ${baseClasses}`}>{content}</h2>
  }
}

// Component: List
function List({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const ListTag = ordered ? "ol" : "ul"
  const listClass = ordered ? "list-decimal" : "list-disc"

  return (
    <ListTag className={`${listClass} list-outside ml-5 mb-6 text-slate-700 space-y-2 text-lg marker:text-[#009f5a]`}>
      {items.map((item, index) => (
        <li key={index} className="pl-2">
          {item}
        </li>
      ))}
    </ListTag>
  )
}

// Component: Tip / Callout Block
function Tip({ title, content, color = "green" }: { title: string; content: string; color?: string }) {
  const colorSchemes = {
    green: {
      bg: "bg-[#00ff90]/10",
      border: "border-[#00ff90]/50",
      iconColor: "text-[#009f5a]",
      icon: <Lightbulb />,
    },
    blue: {
      bg: "bg-sky-50",
      border: "border-sky-200",
      iconColor: "text-sky-600",
      icon: <Info />,
    },
    yellow: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
      icon: <AlertTriangle />,
    },
  }
  const scheme = colorSchemes[color as keyof typeof colorSchemes] || colorSchemes.green;

  return (
    <div className={`border ${scheme.bg} ${scheme.border} rounded-xl p-6 my-8 flex gap-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${scheme.bg}`}>
        <div className={scheme.iconColor}>{scheme.icon}</div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-slate-700">{content}</p>
      </div>
    </div>
  )
}

// Component: Info Box
function InfoBox({ title, items, color = "gray" }: { title: string; items: string[]; color?: string }) {
    const colorSchemes = {
        gray: { bg: "bg-slate-50", border: "border-slate-200", iconColor: "text-slate-500" },
        green: { bg: "bg-emerald-50", border: "border-emerald-200", iconColor: "text-emerald-600" },
    }
    const scheme = colorSchemes[color as keyof typeof colorSchemes] || colorSchemes.gray;

  return (
    <div className={`${scheme.bg} border ${scheme.border} rounded-xl p-6 my-8`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${scheme.iconColor}`} />
            <span className="text-slate-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Component: Product Rating
function ProductRating({ name, rating, description, color = "green" }: { name: string; rating: string; description: string; color?: string }) {
  const colorSchemes = {
    green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", star: "text-emerald-500" },
    yellow: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", star: "text-amber-500" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", star: "text-red-500" },
  }
  const scheme = colorSchemes[color as keyof typeof colorSchemes] || colorSchemes.green;

  return (
    <div className={`${scheme.bg} border ${scheme.border} rounded-xl p-6 my-6`}>
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        <p className={`font-bold text-lg flex items-center gap-1 ${scheme.text}`}>
          <Star className={`w-5 h-5 ${scheme.star}`} /> {rating}
        </p>
      </div>
      <p className={`mt-2 ${scheme.text}`}>{description}</p>
    </div>
  )
}

// Component: Divider
function Divider() {
  return <hr className="border-slate-200 my-10" />
}

// Component: Quote
function Quote({ content }: { content: string }) {
  return (
    <blockquote className="border-l-4 border-[#00ff90] pl-6 my-8">
      <p className="text-xl text-gray-800 italic">"{content}"</p>
    </blockquote>
  )
}

// Component: Steps
function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="my-8 space-y-4">
      {steps.map((step, index) => (
        <li key={index} className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#00ff90] text-gray-900 font-bold rounded-full">
            {index + 1}
          </div>
          <p className="text-lg text-slate-700 mt-0.5">{step}</p>
        </li>
      ))}
    </ol>
  )
}

// --- Main Content Renderer ---
export default function BlogContent({ content }: BlogContentProps) {
  const renderBlock = (block: ContentBlock, index: number): ReactNode => {
    switch (block.type) {
      case "paragraph":
        return <Paragraph key={index} content={block.content} className={block.className} />
      case "heading":
        return <Heading key={index} level={block.level} content={block.content} />
      case "list":
        return <List key={index} items={block.items} ordered={block.ordered} />
      case "tip":
        return <Tip key={index} title={block.title} content={block.content} color={block.color} />
      case "infoBox":
        return <InfoBox key={index} title={block.title} items={block.items} color={block.color} />
      case "productRating":
        return <ProductRating key={index} name={block.name} rating={block.rating} description={block.description} color={block.color} />
      case "divider":
        return <Divider key={index} />
      case "quote":
        return <Quote key={index} content={block.content} />
      case "steps":
        return <Steps key={index} steps={block.steps} />
      default:
        return null
    }
  }

  return <div>{content.map((block, index) => renderBlock(block, index))}</div>
}