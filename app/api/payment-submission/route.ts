import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { fullName, email, phone, amount } = body

    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Full name, email and phone are required.' },
        { status: 400 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New JazzCash Payment Submission - ₨${amount || 500}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>New Payment Submission</h2>

          <p>A user has submitted a JazzCash payment confirmation.</p>

          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:10px; font-weight:bold;">Full Name</td>
              <td style="padding:10px;">${fullName}</td>
            </tr>

            <tr>
              <td style="padding:10px; font-weight:bold;">Email</td>
              <td style="padding:10px;">${email}</td>
            </tr>

            <tr>
              <td style="padding:10px; font-weight:bold;">Phone</td>
              <td style="padding:10px;">${phone}</td>
            </tr>

            <tr>
              <td style="padding:10px; font-weight:bold;">Amount</td>
              <td style="padding:10px;">₨${amount || 500}</td>
            </tr>

            <tr>
              <td style="padding:10px; font-weight:bold;">Status</td>
              <td style="padding:10px;">Payment Submitted</td>
            </tr>

            <tr>
              <td style="padding:10px; font-weight:bold;">Date</td>
              <td style="padding:10px;">${new Date().toLocaleString()}</td>
            </tr>
          </table>

          <p style="margin-top:20px;">
            Please manually verify the JazzCash payment before activating premium access.
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Payment submission sent successfully.',
    })
  } catch (error) {
    console.error('Payment submission email error:', error)

    return NextResponse.json(
      { error: 'Failed to send payment submission.' },
      { status: 500 }
    )
  }
}