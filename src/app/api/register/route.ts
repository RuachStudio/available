import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

type Attendee = {
  name: string;
  phone: string;
  email: string;
  address: string;
  shirtSize: string;
  notes?: string;
};

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { contactName, contactPhone, contactEmail, contactAddress, prayerRequest, attendees } = await req.json();

    // 1️⃣ Save to Supabase Postgres (via Prisma)
    const registration = await prisma.registration.create({
      data: {
        contactName,
        contactPhone,
        contactEmail,
        contactAddress,
        prayerRequest,
        attendees: {
          create: attendees.map((a: Attendee) => ({
            name: a.name,
            phone: a.phone,
            email: a.email,
            address: a.address,
            shirtSize: a.shirtSize,
            notes: a.notes,
          })),
        },
      },
      include: { attendees: true },
    });

    // 2️⃣ Configure Gmail Transporter (using App Password)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,  // e.g., ruachministriesdev@gmail.com
        pass: process.env.EMAIL_PASS,  // App password from Google
      },
    });

    // 3️⃣ Send Confirmation Email to Attendee
    if (contactEmail) {
      await transporter.sendMail({
        from: `"AVAILABLE Conference" <${process.env.EMAIL_USER}>`,
        to: contactEmail,
        subject: "Your AVAILABLE Conference Registration is Confirmed!",
        html: `
          <h2>Hi ${contactName},</h2>
          <p>🎉 Thank you for registering for the <strong>AVAILABLE Conference</strong>!</p>
          <p><strong>Tickets Reserved:</strong> ${attendees.length}</p>
          <p>We can't wait to see you there!</p>
          ${
            prayerRequest
              ? `<p>🙏 We have also received your prayer request and our team will be praying for you:</p>
                 <blockquote>${prayerRequest}</blockquote>`
              : ""
          }
          <hr/>
          <p><strong>Date:</strong> [Insert Conference Date Here]</p>
          <p><strong>Location:</strong> [Insert Venue Here]</p>
          <p>— The AVAILABLE Conference Team</p>
        `,
      });
    }

    // 4️⃣ Send Admin Notification
    if (process.env.ADMIN_EMAIL) {
      await transporter.sendMail({
        from: `"AVAILABLE Conference" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: "New Conference Registration Submitted",
        html: `
          <h2>New Registration Received</h2>
          <p><strong>Name:</strong> ${contactName}</p>
          <p><strong>Phone:</strong> ${contactPhone}</p>
          <p><strong>Email:</strong> ${contactEmail || "N/A"}</p>
          <p><strong>Tickets:</strong> ${attendees.length}</p>
          ${
            prayerRequest
              ? `<p><strong>Prayer Request:</strong> ${prayerRequest}</p>`
              : ""
          }
          <hr/>
          <h3>Attendees:</h3>
          <ul>
            ${attendees
              .map(
                (a: Attendee) =>
                  `<li>${a.name} (${a.phone}) - Shirt Size: ${a.shirtSize}</li>`
              )
              .join("")}
          </ul>
        `,
      });
    }

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}