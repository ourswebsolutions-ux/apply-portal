import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Email ID is required.' },
        { status: 400 }
      )
    }

    const existingEmail = await prisma.paidEmail.findUnique({
      where: {
        id,
      },
    })

    if (!existingEmail) {
      return NextResponse.json(
        { error: 'Paid email not found.' },
        { status: 404 }
      )
    }

    await prisma.paidEmail.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Email removed successfully.',
    })
  } catch (error) {
    console.error('DELETE paid email error:', error)

    return NextResponse.json(
      { error: 'Failed to remove email.' },
      { status: 500 }
    )
  }
}