import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      fullName,
      email,
      phone,
      country,
      jobTitle,
      experience,
      skills,
      expectedSalary,
      linkedin,
      github,
      portfolio,
      cvUrl,
      cvFileName,
      jobPosition,
    } = body

    // Required fields
    if (!fullName || !email || !phone || !country) {
      return NextResponse.json(
        {
          success: false,
          message: 'Full name, email, phone and country are required.',
        },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check duplicate application
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          message: 'An application with this email already exists.',
        },
        { status: 409 }
      )
    }

    // Generate secure interview token
    const interviewToken = randomUUID()
   const slug = jobPosition?.trim().toLowerCase().replace(/\s+/g, '-') || jobTitle?.trim().toLowerCase().replace(/\s+/g, '-') || 'unknown-position'
    // Create employee/application
    const employee = await prisma.employee.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        country: country.trim(),

        jobTitle: jobTitle?.trim() || null,
        experience: experience || null,
        skills: Array.isArray(skills) ? skills : [],
        expectedSalary: expectedSalary?.trim() || null,
        
        linkedin: linkedin?.trim() || null,
        github: github?.trim() || null,
        portfolio: portfolio?.trim() || null,

        cvUrl: cvUrl?.trim() || null,
        cvFileName: cvFileName?.trim() || null,

        jobPosition: jobPosition?.trim() || jobTitle?.trim() || null,
        slug,

        interviewToken,
        interviewStatus: 'pending',
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully.',

        employee: {
          id: employee.id,
          fullName: employee.fullName,
          email: employee.email,
          jobPosition: employee.jobPosition,
          slug: employee.slug,
        },

        interviewToken: employee.interviewToken,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create employee error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit application.',
      },
      { status: 500 }
    )
  }
}