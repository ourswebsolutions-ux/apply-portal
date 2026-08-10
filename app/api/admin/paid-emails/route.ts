import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export async function GET() {
  try {
    const emails = await prisma.paidEmail.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(emails)
  } catch (error) {
    console.error('GET paid emails error:', error)

    return NextResponse.json(
      { error: 'Failed to load paid emails.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const email = String(body.email || '')
      .trim()
      .toLowerCase()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const existingEmail = await prisma.paidEmail.findUnique({
      where: {
        email,
      },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'This email is already added.' },
        { status: 409 }
      )
    }

    const paidEmail = await prisma.paidEmail.create({
      data: {
        email,
      },
    })

    return NextResponse.json(paidEmail, { status: 201 })
  } catch (error) {
    console.error('POST paid email error:', error)

    return NextResponse.json(
      { error: 'Failed to add email.' },
      { status: 500 }
    )
  }
}