import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { logger } from '@/lib/logger' // adjust path if your logger lives elsewhere

// ─────────────────────────────────────────────
// SMTP transporter (reuses existing env vars)
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const FROM = {
  name: 'Axora Recruiter',
  address: process.env.SMTP_FROM || process.env.SMTP_USER || 'recruiter@axora.com',
}

const BASE_URL = (
  process.env.BASE_URL ||
  process.env.baseurl ||
  'https://worldapply.axorawebsolutions.com/interview'
).replace(/\/$/, '')
// ─────────────────────────────────────────────
// Prevent overlapping executions
// ─────────────────────────────────────────────
let isRunning = false

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function escapeHtml(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildInterviewUrl(slug: string | null | undefined): string {
  const safeSlug = (slug || 'interview').replace(/[^a-zA-Z0-9-_]/g, '')
  return `${BASE_URL}/#${safeSlug}`
}

/**
 * Deterministic 3–6 hour delay derived from candidate id.
 * Same candidate always gets the same delay window, even after restarts.
 */
function getDelayMs(candidateId: string): number {
  const min = 3 * 60 * 60 * 1000 // 3 hours
  const max = 6 * 60 * 60 * 1000 // 6 hours

  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─────────────────────────────────────────────
// Quick Reply HTML
// ─────────────────────────────────────────────
function buildQuickReplyHtml(
  candidateName: string,
  jobTitle: string
): string {
  const name = escapeHtml(candidateName || 'Candidate')
  const title = escapeHtml(jobTitle || 'the opportunity')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received</title>
</head>

<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#222222;">

  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#ffffff;"
  >
    <tr>
      <td align="center" style="padding:30px 16px;">

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="max-width:600px;"
        >

          <!-- Header -->
          <tr>
            <td style="padding:0 0 18px 0;border-bottom:1px solid #e5e5e5;">

              <div style="font-size:18px;font-weight:600;color:#111111;">
                Axora Recruiter
              </div>

              <div style="margin-top:4px;font-size:12px;color:#777777;">
                Recruitment Team
              </div>

            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px 0 10px 0;">

              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#222222;">
                Hello ${name},
              </p>

              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#333333;">
                Thank you for your interest in the
                <strong style="color:#222222;">${title}</strong>
                opportunity.
              </p>

              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#333333;">
                We have received your application and appreciate the time you took
                to share your experience and professional background with us.
              </p>

              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#333333;">
                Our recruitment team is currently reviewing applications based on
                experience, technical expertise, and alignment with the role.
              </p>

              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#333333;">
                If your profile is shortlisted for the next stage, you will receive
                a follow-up invitation with the next steps.
              </p>

              <p style="margin:0 0 28px 0;font-size:15px;line-height:1.7;color:#333333;">
                We appreciate your interest and look forward to reviewing your profile.
              </p>

              <p style="margin:0;font-size:14px;line-height:1.7;color:#555555;">
                Best regards,<br>
                <strong style="color:#222222;">Axora Recruiter</strong><br>
                Recruitment Team
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 0 0 0;border-top:1px solid #eeeeee;">

              <p style="margin:0;font-size:11px;line-height:1.5;color:#999999;">
                Axora Recruiter · Recruitment Team
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`
}
// ─────────────────────────────────────────────
// Interview Invitation HTML
// ─────────────────────────────────────────────
function buildInterviewHtml(
  candidateName: string,
  jobTitle: string,
  interviewUrl: string
): string {
  const name = escapeHtml(candidateName || 'Candidate')
  const title = escapeHtml(jobTitle || 'the opportunity')
  const safeUrl = escapeHtml(interviewUrl)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Invitation</title>
</head>

<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#222;">

  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#ffffff;"
  >
    <tr>
      <td align="center" style="padding:30px 16px;">

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="max-width:600px;"
        >

          <!-- Header -->
          <tr>
            <td style="padding-bottom:18px;border-bottom:1px solid #e5e5e5;">

              <div style="font-size:18px;font-weight:600;color:#111;">
                Axora Recruiter
              </div>

              <div style="margin-top:4px;font-size:12px;color:#777;">
                Recruitment Team
              </div>

            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px 0;">

              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
                Hello ${name},
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">
                Thank you for your application for the
                <strong>${title}</strong> opportunity.
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">
                After reviewing your profile, we would like to invite you
                to the next stage of our recruitment process.
              </p>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;">
                Please complete the interview using the link below:
              </p>

              <!-- Button -->
              <table
                role="presentation"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="margin-bottom:24px;"
              >
                <tr>
                  <td style="background:#111;border-radius:6px;">

                    <a
                      href="${safeUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        display:inline-block;
                        padding:12px 24px;
                        color:#fff;
                        font-size:14px;
                        font-weight:600;
                        text-decoration:none;
                      "
                    >
                      Start Interview
                    </a>

                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:13px;color:#777;">
                Or copy this link into your browser:
              </p>

              <p style="margin:0 0 24px;word-break:break-all;">
                <a
                  href="${safeUrl}"
                  style="color:#2563eb;font-size:13px;text-decoration:none;"
                >
                  ${safeUrl}
                </a>
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">
                The interview will help us understand your experience,
                technical skills, and suitability for the position.
              </p>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;">
                We appreciate your time and look forward to learning more
                about your experience.
              </p>

              <p style="margin:0;font-size:14px;line-height:1.6;color:#555;">
                Best regards,<br>
                <strong style="color:#111;">Axora Recruiter</strong><br>
                Recruitment Team
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:18px;border-top:1px solid #eeeeee;">

              <p style="margin:0;font-size:11px;color:#999;">
                Axora Recruiter · Recruitment Team
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`
}
// ─────────────────────────────────────────────
// Send helpers (idempotent)
// ─────────────────────────────────────────────
async function sendQuickReply(employee: {
  id: string
  email: string
  fullName: string
  jobPosition: string | null
}) {
  // Final guard against race conditions
  const current = await prisma.employee.findUnique({
    where: { id: employee.id },
    select: { quickReplySent: true },
  })
  if (!current || current.quickReplySent) return

  const jobTitle = employee.jobPosition || 'Opportunity'
  const html = buildQuickReplyHtml(employee.fullName, jobTitle)

  await transporter.sendMail({
    from: FROM,
    to: employee.email,
    subject: `Application Received — ${jobTitle}`,
    html,
  })

  // Mark only after successful send
  await prisma.employee.update({
    where: { id: employee.id },
    data: {
      quickReplySent: true,
      quickReplySentAt: new Date(),
    },
  })
}

async function sendInterviewInvitation(employee: {
  id: string
  email: string
  fullName: string
  jobPosition: string | null
  slug: string | null
}) {
  // Final guard against race conditions
  const current = await prisma.employee.findUnique({
    where: { id: employee.id },
    select: { interviewInviteSent: true },
  })
  if (!current || current.interviewInviteSent) return

  const jobTitle = employee.jobPosition || 'Opportunity'
  const interviewUrl = buildInterviewUrl(employee.slug)
  const html = buildInterviewHtml(employee.fullName, jobTitle, interviewUrl)

  await transporter.sendMail({
    from: FROM,
    to: employee.email,
    subject: `Interview Invitation — ${jobTitle}`,
    html,
  })

  // Mark only after successful send
  await prisma.employee.update({
    where: { id: employee.id },
    data: {
      interviewInviteSent: true,
      interviewInviteSentAt: new Date(),
    },
  })
}

// ─────────────────────────────────────────────
// Main cycle
// ─────────────────────────────────────────────
export async function runRecruitmentWorker() {
  if (isRunning) {
    logger.info('[RecruitmentWorker] Previous cycle still running – skipping')
    return
  }

  isRunning = true
  const startedAt = Date.now()

  try {
    logger.info('[RecruitmentWorker] Starting cycle...')

    // ─── 1. Quick Replies ───
    const needQuickReply = await prisma.employee.findMany({
      where: {
        quickReplySent: false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        jobPosition: true,
      },
      take: 40, // safety batch
    })

    logger.info(`[RecruitmentWorker] Candidates requiring quick reply: ${needQuickReply.length}`)

    for (const candidate of needQuickReply) {
      try {
        await sendQuickReply(candidate)
        logger.info(`[RecruitmentWorker] Quick reply sent: ${candidate.email}`)
      } catch (err) {
        logger.error(`[RecruitmentWorker] Failed to send email: ${candidate.email}`, err)
      }
    }

    // ─── 2. Interview Invitations (3–6 h after quick reply) ───
    const now = new Date()

    const pendingInterview = await prisma.employee.findMany({
      where: {
        quickReplySent: true,
        interviewInviteSent: false,
        quickReplySentAt: { not: null },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        jobPosition: true,
        slug: true,
        quickReplySentAt: true,
      },
      take: 40,
    })

    let interviewSentCount = 0

    for (const candidate of pendingInterview) {
      if (!candidate.quickReplySentAt) continue

      const delayMs = getDelayMs(candidate.id)
      const eligibleAt = new Date(candidate.quickReplySentAt.getTime() + delayMs)

      if (now < eligibleAt) {
        // Still waiting – log once in a while if you want visibility
        continue
      }

      try {
        await sendInterviewInvitation(candidate)
        interviewSentCount++
        logger.info(`[RecruitmentWorker] Interview invitation sent: ${candidate.email}`)
      } catch (err) {
        logger.error(`[RecruitmentWorker] Failed to send email: ${candidate.email}`, err)
      }
    }

    logger.info(`[RecruitmentWorker] Interview invitations sent this cycle: ${interviewSentCount}`)
    logger.info(`[RecruitmentWorker] Cycle completed (${Date.now() - startedAt}ms)`)
  } catch (err) {
    logger.error('[RecruitmentWorker] Unexpected error in cycle', err)
  } finally {
    isRunning = false
  }
}

// ─────────────────────────────────────────────
// Start the worker (call once at application boot)
// ─────────────────────────────────────────────
export function startRecruitmentWorker() {
  // Run once immediately
  runRecruitmentWorker().catch((err) =>
    logger.error('[RecruitmentWorker] Initial run failed', err)
  )

  // Then every 30 minutes
  const INTERVAL_MS = 30 * 60 * 1000
  setInterval(() => {
    runRecruitmentWorker().catch((err) =>
      logger.error('[RecruitmentWorker] Scheduled run failed', err)
    )
  }, INTERVAL_MS)

  logger.info('[RecruitmentWorker] Scheduled – runs every 30 minutes')
}
runRecruitmentWorker().catch((err) =>
  logger.error('[RecruitmentWorker] Initial run failed', err)
)

startRecruitmentWorker()