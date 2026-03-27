'use client'

import { useState } from 'react'

type FAQItem = {
  question: string
  answer: string
}

export default function FaqAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="sn-accordion">
      {items.map((item, index) => {
        const isOpen = openIndex === index

        return (
          <article key={item.question} className={`sn-accordion-item${isOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="sn-accordion-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex((current) => (current === index ? null : index))}
            >
              <span className="sn-card-title sn-accordion-question">
                {item.question}
              </span>
              <span className="sn-accordion-icon" aria-hidden="true">
                <span className="sn-accordion-icon-bar sn-accordion-icon-bar-horizontal" />
                <span className="sn-accordion-icon-bar sn-accordion-icon-bar-vertical" />
              </span>
            </button>

            <div className="sn-accordion-panel">
              <div className="sn-accordion-panel-inner">
                <div className="sn-accordion-body">
                  <p className="sn-card-copy">{item.answer}</p>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
