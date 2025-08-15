// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { Prisma, ShirtSize } from "@prisma/client";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Disable caching and force runtime execution
import "server-only";

// -----------------------------
// Types
// -----------------------------
type AttendeeIn = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  shirtSize?: string;
  notes?: string;
};

type AttendeeClean = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  shirtSize: ShirtSize | null;
};

// -----------------------------
// Utilities
// -----------------------------
function normalizeShirtSize(input?: string | null): ShirtSize | null {
  if (!input) return null;
  const v = String(input).trim().toUpperCase();
  switch (v) {
    case "XS": return ShirtSize.XS;
    case "S":  return ShirtSize.S;
    case "M":  return ShirtSize.M;
    case "L":  return ShirtSize.L;
    case "XL": return ShirtSize.XL;
    case "2XL": return ShirtSize.E2XL;
    case "3XL": return ShirtSize.E3XL;
    default:   return null;
  }
}

const cleanString = (val?: string | null) => {
  if (typeof val !== "string") return null;
  const t = val.trim();
  return t.length ? t : null;
};

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async (options: nodemailer.SendMailOptions) => {
  const transporter = createTransporter();
  await transporter.sendMail(options);
};

const buildConfirmationEmail = (
  name: string,
  attendees: AttendeeClean[],
  prayerRequest?: string
) => `
  <h2>Hi ${name},</h2>
  <p>🎉 Thank you for registering for the <strong>AVAILABLE Conference</strong>!</p>
  <p><strong>Tickets Reserved:</strong> ${attendees.length}</p>
  <p>We can't wait to see you there!</p>
  ${prayerRequest ? `
    <p>🙏 We have also received your prayer request and our team will be praying for you:</p>
    <blockquote>${prayerRequest}</blockquote>
  ` : ""}
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
`;

const buildAdminEmail = (
  name: string,
  phone: string,
  email: string,
  attendees: AttendeeClean[],
  prayerRequest?: string
) => `
  <h2>New Registration Received</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Phone:</strong> ${phone}</p>
  <p><strong>Email:</strong> ${email || "N/A"}</p>
  <p><strong>Tickets:</strong> ${attendees.length}</p>
  ${prayerRequest ? `<p><strong>Prayer Request:</strong> ${prayerRequest}</p>` : ""}
  <hr/>
  <h3>Attendees:</h3>
  <ul>
    ${attendees
      .map(
        (a) =>
          `<li>${a.name || "N/A"} (${a.phone || "N/A"}) - Shirt Size: ${
            a.shirtSize ?? "N/A"
          }</li>`
      )
      .join("")}
  </ul>
`;

// -----------------------------
// Route
// -----------------------------
export async function POST(req: Request) {
  try {
    console.log("📥 Incoming registration request...");
    const { prisma } = await import("@/lib/prisma");

    // Parse + types
    const body = (await req.json()) as {
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      contactAddress?: string;
      prayerRequest?: string;
      attendees?: AttendeeIn[];       // additional attendees entered in the form
      primaryWantsShirt?: boolean;
      primaryShirtSize?: string;
    };

    const {
      contactName,
      contactPhone,
      contactEmail,
      contactAddress,
      prayerRequest,
      attendees = [],
      primaryWantsShirt,
      primaryShirtSize,
    } = body;

    console.log("✅ Parsed request data:", {
      contactName,
      contactPhone,
      contactEmail,
      attendeeCount: attendees?.length,
    });

    // Basic required fields
    if (
      !contactName ||
      !contactPhone ||
      !contactEmail ||
      !String(contactEmail).includes("@")
    ) {
      console.error("❌ Validation failed: Missing/invalid contact fields.");
      return NextResponse.json(
        { error: "Missing or invalid contact fields" },
        { status: 400 }
      );
    }

    const emailLc = contactEmail.trim().toLowerCase();
    const phoneClean = contactPhone.trim();

    // Idempotency / Duplicate pre-check (email OR phone)
    const existing = await prisma.registration.findFirst({
      where: {
        OR: [{ contactEmail: emailLc }, { contactPhone: phoneClean }],
      },
      include: { attendees: true },
    });

    if (existing) {
      console.log("ℹ️ Existing registration found — returning idempotent success.");
      return NextResponse.json({
        success: true,
        duplicate: true,
        registration: existing,
      });
    }

    // 1) Clean incoming attendees & keep any row with name OR email OR phone
    let cleanedAttendees: AttendeeClean[] = (attendees || [])
      .map((a): AttendeeClean => ({
        name: (a?.name ?? "").trim(),
        phone: cleanString(a?.phone),
        email: cleanString(a?.email?.toLowerCase() || null),
        address: cleanString(a?.address),
        notes: cleanString(a?.notes),
        shirtSize: normalizeShirtSize(a?.shirtSize),
      }))
      .filter((a) => Boolean(a.name || a.email || a.phone));

    // 2) Ensure the primary contact is included as an attendee if not already
    const primaryCandidate: AttendeeClean = {
      name: contactName.trim(),
      phone: cleanString(phoneClean),
      email: cleanString(emailLc),
      address: cleanString(contactAddress),
      notes: null,
      shirtSize: normalizeShirtSize(primaryWantsShirt ? primaryShirtSize : null),
    };

    const alreadyHasPrimary = cleanedAttendees.some((a) => {
      // consider same person if any of these match (most forgiving)
      const nameMatch = a.name && a.name.toLowerCase() === primaryCandidate.name.toLowerCase();
      const emailMatch = a.email && primaryCandidate.email && a.email === primaryCandidate.email;
      const phoneMatch = a.phone && primaryCandidate.phone && a.phone === primaryCandidate.phone;
      return nameMatch || emailMatch || phoneMatch;
    });

    if (!alreadyHasPrimary) {
      cleanedAttendees.unshift(primaryCandidate);
    }

    // 3) Guard: ensure at least one attendee with a name
    if (cleanedAttendees.length === 0 || !cleanedAttendees[0].name) {
      console.error("❌ Validation failed: No valid attendees.");
      return NextResponse.json(
        { error: "At least one attendee is required" },
        { status: 400 }
      );
    }

    console.log("👥 Cleaned attendees:", cleanedAttendees.map(a => ({
      name: a.name, email: a.email, phone: a.phone, size: a.shirtSize
    })));

    // 4) Persist
    console.log("🗄 Creating registration record in database...");
    let registration;
    try {
      registration = await prisma.registration.create({
        data: {
          contactName,
          contactPhone: phoneClean,
          contactEmail: emailLc,
          contactAddress,
          prayerRequest,
          attendees: {
            create: cleanedAttendees.map((a) => {
              const base: Prisma.AttendeeCreateWithoutRegistrationInput = {
                name: a.name,
                phone: a.phone,
                email: a.email,
                address: a.address,
                notes: a.notes,
              };
              if (a.shirtSize) base.shirtSize = a.shirtSize;
              return base;
            }),
          },
        },
        include: { attendees: true },
      });
    } catch (dbErr: unknown) {
      if (
        dbErr instanceof Prisma.PrismaClientKnownRequestError &&
        dbErr.code === "P2002"
      ) {
        console.error("❌ Duplicate entry detected:", dbErr.meta);
        return NextResponse.json(
          { error: "Already registered", duplicate: true, field: dbErr.meta?.target },
          { status: 409 }
        );
      }
      if (dbErr instanceof Error) {
        console.error("❌ Prisma error while creating registration:", dbErr);
        throw new Error(dbErr.message || "Database error during registration");
      }
      throw new Error("Unknown database error");
    }

    console.log("🧾 Created registration", {
      id: registration.id,
      attendees: registration.attendees.map(a => ({ id: a.id, name: a.name, size: a.shirtSize })),
    });

    // 5) Emails (best-effort; failures do not block success)
    console.log("📧 Sending confirmation email...");
    try {
      if (emailLc) {
        await sendEmail({
          from: `"AVAILABLE Conference" <${process.env.EMAIL_USER}>`,
          to: emailLc,
          subject: "Your AVAILABLE Conference Registration is Confirmed!",
          html: buildConfirmationEmail(contactName, cleanedAttendees, prayerRequest),
        });
      }
    } catch (emailErr: unknown) {
      console.error("⚠️ Failed to send confirmation email:", emailErr);
    }

    console.log("📧 Sending admin notification email...");
    try {
      if (process.env.ADMIN_EMAIL) {
        await sendEmail({
          from: `"AVAILABLE Conference" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: "New Conference Registration Submitted",
          html: buildAdminEmail(contactName, phoneClean, emailLc, cleanedAttendees, prayerRequest),
        });
      }
    } catch (adminEmailErr: unknown) {
      console.error("⚠️ Failed to send admin email:", adminEmailErr);
    }

    console.log("✅ Registration completed successfully.");
    return NextResponse.json({ success: true, registration });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Registration Error:", error);
      return NextResponse.json(
        { error: error.message || "Registration failed" },
        { status: 500 }
      );
    }
    console.error("❌ Registration Error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}