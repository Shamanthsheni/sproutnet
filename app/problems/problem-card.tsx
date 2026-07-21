'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const DOMAIN_ICONS: Record<string, string> = {
  'AI & Data': '🤖',
  Climate: '🌿',
  'Public Infrastructure': '🏗',
  Healthcare: '🏥',
  Agriculture: '🌾',
  Education: '📚',
  'Urban Mobility': '🚌',
  'Civic Technology': '🏛',
}

export type ProblemCardData = {
  id: string
  title: string
  domain: string
  problem_type: string
  status: string
  thumbnail_url: string | null
  reward_amount: number | null
  milestones: number
  deadline: string
  submission_count: number
  context: string
  rejected_reason?: string | null
}

export default function ProblemCard({ problem }: { problem: ProblemCardData }) {
  const [nowMs] = useState(() => Date.now())
  const isIndustry = problem.problem_type === 'industry_challenge'
  const daysLeft = Math.ceil((new Date(problem.deadline).getTime() - nowMs) / (1000 * 60 * 60 * 24))
  const contextSnippet = problem.context.length > 140 ? `${problem.context.slice(0, 140)}...` : problem.context

  return (
    <Link href={`/problems/${problem.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff',
        border: '1.5px solid rgba(28,20,16,0.07)',
        borderRadius: 14,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}>
        {problem.thumbnail_url && (
          <div style={{ aspectRatio: '16 / 9', background: '#F3EEE7', position: 'relative' }}>
            <Image
              src={problem.thumbnail_url}
              alt={`${problem.title} thumbnail`}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        <div style={{
          padding: 'clamp(20px, 3vw, 28px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          flex: 1,
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              color: '#2D6A4F',
              background: '#EAF4EE',
              border: '1px solid rgba(45,106,79,0.15)',
              padding: '4px 10px',
              borderRadius: 999,
            }}>
              {DOMAIN_ICONS[problem.domain]} {problem.domain}
            </span>

            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              color: isIndustry ? '#1E40AF' : '#4A3F38',
              background: isIndustry ? 'rgba(30,64,175,0.08)' : 'rgba(28,20,16,0.05)',
              border: `1px solid ${isIndustry ? 'rgba(30,64,175,0.15)' : 'rgba(28,20,16,0.1)'}`,
              padding: '4px 10px',
              borderRadius: 999,
            }}>
              {isIndustry ? `💼 ₹${problem.reward_amount?.toLocaleString('en-IN')}` : '🌍 Public Impact'}
            </span>
          </div>

          <h2 style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            color: '#1C1410',
            lineHeight: 1.4,
            margin: 0,
          }}>
            {problem.title}
          </h2>

          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: '#4A3F38',
            fontWeight: 300,
            lineHeight: 1.6,
            margin: 0,
            flex: 1,
          }}>
            {contextSnippet}
          </p>

          <div style={{
            display: 'flex',
            gap: 20,
            rowGap: 8,
            flexWrap: 'wrap',
            paddingTop: 14,
            borderTop: '1px solid rgba(28,20,16,0.06)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 14,
                fontWeight: 500,
                color: daysLeft <= 7 ? '#DC2626' : '#F4A723',
              }}>
                {daysLeft}d
              </span>
              <span style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                left
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 14,
                fontWeight: 500,
                color: '#1C1410',
              }}>
                {problem.submission_count}
              </span>
              <span style={{ fontSize: 11, color: '#9CA3A0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                submissions
              </span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#2D6A4F',
              }}>
                View →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
