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

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  // Ensure fresh Prisma Client in Vercel's serverless environment
  const { execSync } = await import("child_process");
  try {
    console.log("🔄 Generating Prisma Client at runtime...");
    execSync("npx prisma generate", { stdio: "inherit" });
  } catch (err) {
    console.warn("⚠️ Prisma generate failed at runtime:", err);
  }
  prisma = new PrismaClient();
} else {
  // Use global Prisma instance in development to avoid hot-reload issues
  const globalForPrisma = global as unknown as { prisma: PrismaClient };
  prisma = globalForPrisma.prisma || new PrismaClient();
  if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;
}

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
          <p><strong>Date:</strong> October 17 & 18</p>
          <p><strong>Location:</strong> Camp Living Waters<br/>21230 Livingwater Rd, Loranger, LA 70446</p>
          <p><strong>Doors Open:</strong> 6 PM Friday Night</p>
          <hr/>
          <div style="margin-top:20px; font-style:italic; font-size:14px; color:#555;">
            <h3 style="margin-bottom:8px;">Isaiah 6:1-8 — Isaiah’s Commission</h3>
            <p>6 In the year that King Uzziah died, I saw the Lord, high and exalted, seated on a throne; and the train of his robe filled the temple.</p>
            <p>2 Above him were seraphim, each with six wings: With two wings they covered their faces, with two they covered their feet, and with two they were flying.</p>
            <p>3 And they were calling to one another:</p>
            <blockquote style="margin:8px 0; font-style:italic;">“Holy, holy, holy is the Lord Almighty; the whole earth is full of his glory.”</blockquote>
            <p>4 At the sound of their voices the doorposts and thresholds shook and the temple was filled with smoke.</p>
            <p>5 “Woe to me!” I cried. “I am ruined! For I am a man of unclean lips, and I live among a people of unclean lips, and my eyes have seen the King, the Lord Almighty.”</p>
            <p>6 Then one of the seraphim flew to me with a live coal in his hand, which he had taken with tongs from the altar.</p>
            <p>7 With it he touched my mouth and said, “See, this has touched your lips; your guilt is taken away and your sin atoned for.”</p>
            <p>8 Then I heard the voice of the Lord saying, “Whom shall I send? And who will go for us?”</p>
            <p>And I said, “Here am I. Send me!”</p>
          </div>
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