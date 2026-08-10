import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // use your existing Prisma client path

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawEmail = searchParams.get('email')

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ paid: false }, { status: 200 })
    }

    const email = rawEmail.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ paid: false }, { status: 200 })
    }

    // Basic email shape check — do not reject the form, just treat as unpaid
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ paid: false }, { status: 200 })
    }

    const record = await prisma.paidEmail.findUnique({
      where: { email },
      select: { id: true }, // never return other fields
    })

    return NextResponse.json({ paid: !!record }, { status: 200 })
  } catch {
    // Never break the form — treat as unpaid on any failure
    return NextResponse.json({ paid: false }, { status: 200 })
  }
}